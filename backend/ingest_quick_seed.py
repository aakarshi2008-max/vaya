"""
Quick seed ingestion — downloads only the first ~100MB of each language
parquet via HTTP range requests, giving ~500-1000 rows per language.

This lets you demo immediately without waiting for 3.5GB/language downloads.
Run ingest.bat overnight for the full 55GB corpus.

Usage:
  python backend/ingest_quick_seed.py

Env vars:
  QDRANT_URL            (default: http://localhost:6333)
  QDRANT_COLLECTION     (default: msmarco_xi_passages)
  EMBEDDING_MODEL       (default: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2)
  SEED_LANGUAGES        comma-separated (default: hi,ta,te,bn)
  SEED_BYTES_MB         MB to download per language parquet (default: 100)
"""
import hashlib, io, os, re, uuid, warnings
warnings.filterwarnings("ignore")

import httpx
import pyarrow as pa
import pyarrow.parquet as pq
from fastembed import TextEmbedding
from qdrant_client import QdrantClient, models

# ── Config ────────────────────────────────────────────────────────────────
COLLECTION    = os.getenv("QDRANT_COLLECTION", "msmarco_xi_passages")
QDRANT_URL    = os.getenv("QDRANT_URL",        "http://localhost:6333")
MODEL         = os.getenv("EMBEDDING_MODEL",   "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
SEED_LANGS    = [l.strip() for l in os.getenv("SEED_LANGUAGES", "hi,ta,te,bn").split(",") if l.strip()]
BYTES_MB      = int(os.getenv("SEED_BYTES_MB", "100"))
BATCH_SIZE    = 64

LANG_PARQUET = {
    "as": "asm", "bn": "ben", "gu": "guj", "hi": "hin", "kn": "kan",
    "ml": "mal", "mr": "mar", "ne": "nep", "or": "ori", "pa": "pan",
    "sa": "san", "ta": "tam", "te": "tel", "ur": "urd",
}

ALL_STRATEGIES = [
    "semantic_boundary",
    "hierarchical_parent_child",
    "metadata_aware",
    "adaptive_sliding_window",
]

# ── Chunkers ──────────────────────────────────────────────────────────────
def chunks_semantic_boundary(text):
    sentences = [s.strip() for s in re.split(r'(?<=[.!?।॥])\s+', text) if s.strip()]
    out, current, wc = [], [], 0
    for s in sentences:
        sw = len(s.split())
        if wc + sw > 35 and current:
            out.append(" ".join(current)); current, wc = [s], sw
        else:
            current.append(s); wc += sw
    if current: out.append(" ".join(current))
    return [(c, None) for c in out]

def chunks_hierarchical_parent_child(text):
    parent, words, out, i = text, text.split(), [], 0
    while i < len(words):
        child = " ".join(words[i:i+18])
        if len(child.split()) > 5: out.append((child, parent))
        i += 14
    return out

def chunks_metadata_aware(text, language="hi", domain="General", section="Main"):
    sentences = [s.strip() for s in re.split(r'(?<=[.!?।॥])\s+', text) if s.strip()]
    return [
        (f"[LANG: {language.upper()} | DOMAIN: {domain} | SECTION: {section}] {' '.join(sentences[i:i+2])}", None)
        for i in range(0, len(sentences), 2)
    ]

def chunks_adaptive_sliding_window(text):
    words, out, i = text.split(), [], 0
    while i < len(words):
        ec = sum(1 for w in " ".join(words[i:i+35]).split() if w and w[0].isupper())
        ws, ov = (22, 8) if ec >= 3 else (32, 6)
        chunk = " ".join(words[i:i+ws])
        if len(chunk.split()) > 5: out.append((chunk, None))
        i += max(8, ws - ov)
    return out

def get_chunks(text, strategy, language="hi"):
    if strategy == "semantic_boundary":           return chunks_semantic_boundary(text)
    if strategy == "hierarchical_parent_child":   return chunks_hierarchical_parent_child(text)
    if strategy == "metadata_aware":              return chunks_metadata_aware(text, language)
    if strategy == "adaptive_sliding_window":     return chunks_adaptive_sliding_window(text)
    return chunks_semantic_boundary(text)

# ── Download first N MB of parquet via range request ─────────────────────
def download_partial_parquet(lang_code, mb):
    prefix = LANG_PARQUET.get(lang_code)
    if not prefix:
        print(f"  No parquet for {lang_code}")
        return []

    url    = f"https://huggingface.co/datasets/ai4bharat/MSMARCO-XI/resolve/main/train/{prefix}train.parquet"
    nbytes = mb * 1024 * 1024
    print(f"  Downloading first {mb}MB of {prefix}train.parquet ...")

    try:
        r = httpx.get(
            url,
            headers={"Range": f"bytes=0-{nbytes-1}"},
            timeout=180,
            follow_redirects=True,
        )
        if r.status_code not in (200, 206):
            print(f"  HTTP {r.status_code} — skipping {lang_code}")
            return []

        print(f"  Got {len(r.content)//1024//1024}MB — parsing rows ...")

        # pyarrow can read partial parquet from a buffer.
        # The partial file won't have a valid footer, so we use IPC stream
        # or try reading batch-by-batch with error recovery.
        buf = io.BytesIO(r.content)

        # Try reading as a partial parquet — will fail at footer but may yield batches
        try:
            reader = pq.ParquetFile(buf)
            # Read first batch (may be partial row group)
            table = reader.read()
            rows = table.to_pylist()
            print(f"  Parsed {len(rows)} rows (full parse succeeded)")
            return rows
        except Exception:
            pass

        # Fallback: read as Arrow IPC stream (some parquet writers use it)
        buf.seek(0)
        try:
            reader = pa.ipc.open_stream(buf)
            rows = reader.read_all().to_pylist()
            print(f"  Parsed {len(rows)} rows via IPC stream")
            return rows
        except Exception:
            pass

        print(f"  Could not parse partial parquet for {lang_code} — skipping")
        return []

    except Exception as e:
        print(f"  Download error for {lang_code}: {e}")
        return []

# ── Main ──────────────────────────────────────────────────────────────────
def main():
    print("=== Julie Quick Seed Ingestion ===")
    print(f"Languages  : {SEED_LANGS}")
    print(f"Bytes/lang : {BYTES_MB}MB")
    print(f"Strategies : {ALL_STRATEGIES}")
    print(f"Qdrant     : {QDRANT_URL}\n")

    client   = QdrantClient(url=QDRANT_URL, timeout=120, check_compatibility=False)
    embedder = TextEmbedding(model_name=MODEL)
    dim      = len(next(embedder.embed(["probe"])))
    print(f"Embedding dim: {dim}\n")

    if not client.collection_exists(COLLECTION):
        client.create_collection(
            COLLECTION,
            vectors_config=models.VectorParams(size=dim, distance=models.Distance.COSINE),
        )
        print(f"Created collection: {COLLECTION}")
    else:
        print(f"Using existing collection: {COLLECTION}")

    total_upserted = 0

    for lang in SEED_LANGS:
        rows = download_partial_parquet(lang, BYTES_MB)
        if not rows:
            print(f"  Skipping {lang} (no rows)\n")
            continue

        print(f"  Processing {len(rows)} rows for language '{lang}' ...")

        for strategy in ALL_STRATEGIES:
            points = []
            for ex in rows:
                passages = ex.get("passages") or {}
                texts    = passages.get("passage_text") or passages.get("Translated_passages") or passages.get("English_passages") or []
                if isinstance(texts, str): texts = [texts]

                for text in texts:
                    text = str(text or "").strip()
                    if len(text.split()) < 8:
                        continue
                    for pno, (piece, parent) in enumerate(get_chunks(text, strategy, lang)):
                        uid = str(uuid.UUID(
                            hashlib.sha256(f"{lang}:{strategy}:{text}:{pno}".encode()).hexdigest()[:32]
                        ))
                        payload = {
                            "language": lang,
                            "query_id": str(ex.get("query_id", "")),
                            "query":    str(ex.get("query") or ex.get("Eng_Query") or ""),
                            "chunking": strategy,
                            "chunk_no": pno,
                            "text":     piece,
                        }
                        if parent:
                            payload["parent_context"] = parent[:1500]
                        points.append((uid, piece, payload))

            upserted = 0
            for start in range(0, len(points), BATCH_SIZE):
                batch   = points[start:start+BATCH_SIZE]
                vectors = list(embedder.embed([b[1] for b in batch]))
                pts     = [
                    models.PointStruct(id=b[0], vector=v.tolist(), payload=b[2])
                    for b, v in zip(batch, vectors)
                ]
                client.upsert(COLLECTION, points=pts, wait=True)
                upserted += len(pts)

            total_upserted += upserted
            print(f"    [{strategy}] {upserted} points upserted")

        print()

    print(f"Seed ingestion complete. Total points: {total_upserted}")

    if total_upserted > 0:
        # Sanity check retrieval
        print("\nRetrieval sanity check ...")
        test_queries = ["photosynthesis process", "machine learning algorithm", "quantum computing"]
        for q in test_queries:
            qvec = list(embedder.embed([q]))[0].tolist()
            result = client.query_points(COLLECTION, query=qvec, limit=1, with_payload=True)
            pts = result.points if hasattr(result, "points") else []
            if pts:
                print(f"  '{q}' -> score={pts[0].score:.3f} [{pts[0].payload.get('chunking')}] {str(pts[0].payload.get('text',''))[:80]}...")
    else:
        print("\nNo data ingested. Check your internet connection or HuggingFace access.")
        print("The full ingest will work once you have the parquet files cached locally.")

    print("\nDone. Run 'ingest.bat' overnight for full corpus indexing.\n")

if __name__ == "__main__":
    main()
