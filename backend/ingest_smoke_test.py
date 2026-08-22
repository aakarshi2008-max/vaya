"""
Quick smoke-test ingestion — 50 rows from English only, all 4 strategies.
Run this first to verify the full pipeline works before the full corpus job.

Usage:
  python backend/ingest_smoke_test.py
"""
import hashlib, os, uuid
from pathlib import Path
from datasets import load_dataset
from fastembed import TextEmbedding
from qdrant_client import QdrantClient, models

DATASET   = "ai4bharat/MSMARCO-XI"
COLLECTION = os.getenv("QDRANT_COLLECTION", "msmarco_xi_passages")
QDRANT_URL = os.getenv("QDRANT_URL",         "http://localhost:6333")
MODEL      = os.getenv("EMBEDDING_MODEL",    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
ROWS_PER_STRATEGY = int(os.getenv("SMOKE_ROWS", "50"))

# ─── Chunking strategies ──────────────────────────────────────────────────
import re

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
    parent, words = text, text.split()
    out, idx = [], 0
    while idx < len(words):
        child = " ".join(words[idx:idx+18])
        if len(child.split()) > 5: out.append((child, parent))
        idx += 14
    return out

def chunks_metadata_aware(text, language="en", domain="General", section="Main"):
    sentences = [s.strip() for s in re.split(r'(?<=[.!?।॥])\s+', text) if s.strip()]
    out = []
    for i in range(0, len(sentences), 2):
        body = " ".join(sentences[i:i+2])
        out.append((f"[LANG: {language.upper()} | DOMAIN: {domain} | SECTION: {section}] {body}", None))
    return out

def chunks_adaptive_sliding_window(text):
    words, out, i = text.split(), [], 0
    while i < len(words):
        lookahead = " ".join(words[i:i+35])
        ec = sum(1 for w in lookahead.split() if w and w[0].isupper())
        ws = 22 if ec >= 3 else 32
        ov = 8  if ec >= 3 else 6
        chunk = " ".join(words[i:i+ws])
        if len(chunk.split()) > 5: out.append((chunk, None))
        i += max(8, ws - ov)
    return out

CHUNKERS = {
    "semantic_boundary":         chunks_semantic_boundary,
    "hierarchical_parent_child": chunks_hierarchical_parent_child,
    "metadata_aware":            chunks_metadata_aware,
    "adaptive_sliding_window":   chunks_adaptive_sliding_window,
}

# ─── Main ─────────────────────────────────────────────────────────────────
def main():
    print(f"Connecting to Qdrant at {QDRANT_URL} …")
    client   = QdrantClient(url=QDRANT_URL, timeout=60, check_compatibility=False)
    embedder = TextEmbedding(model_name=MODEL)

    # Probe dimension
    dim = len(next(embedder.embed(["dimension probe"])))
    print(f"Embedding dim: {dim}")

    if not client.collection_exists(COLLECTION):
        client.create_collection(
            COLLECTION,
            vectors_config=models.VectorParams(size=dim, distance=models.Distance.COSINE)
        )
        print(f"Created collection: {COLLECTION}")
    else:
        print(f"Collection already exists: {COLLECTION}")

    print(f"\nStreaming {ROWS_PER_STRATEGY} rows × 4 strategies from {DATASET} …\n")

    # Load Hindi parquet directly (small, fast, representative multilingual sample)
    from huggingface_hub import hf_hub_url
    parquet_url = hf_hub_url(
        repo_id="ai4bharat/MSMARCO-XI",
        repo_type="dataset",
        filename="train/hintrain.parquet",
    )
    print(f"  Streaming from: {parquet_url.split('/')[-1]}")
    stream = load_dataset("parquet", data_files={"train": parquet_url}, split="train", streaming=True)

    # Collect rows once, reuse across strategies
    rows_raw = []
    for i, ex in enumerate(stream):
        if i >= ROWS_PER_STRATEGY: break
        rows_raw.append(ex)

    print(f"  Collected {len(rows_raw)} rows\n")

    total_points = 0
    for strategy_name, chunker in CHUNKERS.items():
        print(f"  [{strategy_name}] chunking {len(rows_raw)} rows …")
        points = []
        for ex in rows_raw:
            passages = ex.get("passages", {})
            texts = passages.get("Translated_passages") or passages.get("English_passages") or []
            selected = passages.get("is_selected") or [0]*len(texts)
            lang = ex.get("language", ex.get("lang", "en"))
            for idx, text in enumerate(texts):
                if not text or len(text.split()) < 8: continue
                pieces = chunker(text) if strategy_name != "metadata_aware" else chunks_metadata_aware(text, language=lang)
                for pno, (piece, parent) in enumerate(pieces):
                    pid = str(uuid.UUID(hashlib.sha256(
                        f"smoke:{strategy_name}:{text}:{pno}".encode()
                    ).hexdigest()[:32]))
                    payload = {
                        "language": "en",
                        "query_id": str(ex.get("query_id", "")),
                        "query":    ex.get("query", ""),
                        "is_selected": bool(selected[idx]) if idx < len(selected) else False,
                        "chunk_no": pno,
                        "chunking": strategy_name,
                        "text":     piece,
                    }
                    if parent:
                        payload["parent_context"] = parent[:1500]
                    points.append((pid, piece, payload))

        # Embed in batches of 64
        BATCH = 64
        upserted = 0
        for start in range(0, len(points), BATCH):
            batch = points[start:start+BATCH]
            vectors = list(embedder.embed([p[1] for p in batch]))
            qdrant_points = [
                models.PointStruct(id=p[0], vector=v.tolist(), payload=p[2])
                for p, v in zip(batch, vectors)
            ]
            client.upsert(COLLECTION, points=qdrant_points, wait=True)
            upserted += len(qdrant_points)

        total_points += upserted
        print(f"    ✓ {upserted} points upserted")

    print(f"\n✅ Smoke-test ingestion complete. Total points: {total_points}")

    # Quick retrieval sanity-check
    print("\nRunning retrieval sanity-check …")
    query = "What is quantum superposition?"
    qvec = list(embedder.embed([query]))[0].tolist()
    results = client.query_points(
        collection_name=COLLECTION,
        query=qvec,
        limit=3,
        with_payload=True,
    )
    pts = results.points if hasattr(results, "points") else (results or [])
    if pts:
        print(f"  Top result (score={pts[0].score:.3f}, strategy={pts[0].payload.get('chunking')}):")
        print(f"  Text: {pts[0].payload.get('text','')[:120]}...")
    else:
        print("  No results (collection may need more data for meaningful retrieval).")

    print("\nAll done. You can now start the Fastify API and test the full pipeline.\n")

if __name__ == "__main__":
    main()
