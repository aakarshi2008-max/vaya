"""
Resumable, streaming MSMARCO-XI -> Qdrant indexer.
HH Goa 2026 Task 2 — 4 chunking strategies.

The dataset 'ai4bharat/MSMARCO-XI' has a single 'default' config.
Each row contains a 'language' field (en, hi, ta, te, bn, gu, mr, etc.).
We stream once and bucket by language via LANGUAGES filter.

Run once as an offline job:
  python backend/ingest_msmarco_xi.py

Or a single strategy:
  CHUNKING_STRATEGY=hierarchical_parent_child python backend/ingest_msmarco_xi.py

Or limit rows for a quick test:
  MAX_ROWS=1000 python backend/ingest_msmarco_xi.py
"""
import hashlib, os, re, uuid, warnings
from itertools import islice
from pathlib import Path

warnings.filterwarnings("ignore", category=UserWarning)

from datasets import load_dataset
from fastembed import TextEmbedding
from qdrant_client import QdrantClient, models
from tenacity import retry, stop_after_attempt, wait_exponential

# ── Config ────────────────────────────────────────────────────────────────
DATASET       = "ai4bharat/MSMARCO-XI"
COLLECTION    = os.getenv("QDRANT_COLLECTION",  "msmarco_xi_passages")
QDRANT_URL    = os.getenv("QDRANT_URL",         "http://localhost:6333")
MODEL         = os.getenv("EMBEDDING_MODEL",    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
BATCH_SIZE    = int(os.getenv("BATCH_SIZE",     "96"))
STRATEGY      = os.getenv("CHUNKING_STRATEGY",  "semantic_boundary")
# Comma-separated languages to keep; empty = keep all Indic splits that exist on HF
LANGUAGES_ENV = os.getenv("LANGUAGES", "")
LANG_FILTER   = set(LANGUAGES_ENV.split(",")) if LANGUAGES_ENV.strip() else None
MAX_ROWS      = int(os.getenv("MAX_ROWS", "0"))   # 0 = unlimited
INDEX_ENGLISH = os.getenv("INDEX_ENGLISH", "1") not in ("0", "false", "False")
CHECKPOINT_DIR = Path(os.getenv("CHECKPOINT_DIR", ".checkpoints"))

# ── Chunking strategies ───────────────────────────────────────────────────

def chunks_semantic_boundary(text):
    """Splits at sentence / clause boundaries. ~35 words per chunk."""
    sentences = [s.strip() for s in re.split(r'(?<=[.!?।॥])\s+', text) if s.strip()]
    out, current, wc = [], [], 0
    for s in sentences:
        sw = len(s.split())
        if wc + sw > 35 and current:
            out.append(" ".join(current))
            current, wc = [s], sw
        else:
            current.append(s); wc += sw
    if current: out.append(" ".join(current))
    return [(c, None) for c in out]

def chunks_hierarchical_parent_child(text):
    """Dense 18-word child chunks; full text stored as parent_context."""
    parent, words = text, text.split()
    out, idx = [], 0
    while idx < len(words):
        child = " ".join(words[idx:idx + 18])
        if len(child.split()) > 5:
            out.append((child, parent))
        idx += 14   # 4-word overlap
    return out

def chunks_metadata_aware(text, language="en", domain="General", section="Main"):
    """Pairs of sentences prefixed with ISO-code + domain header."""
    sentences = [s.strip() for s in re.split(r'(?<=[.!?।॥])\s+', text) if s.strip()]
    out = []
    for i in range(0, len(sentences), 2):
        body    = " ".join(sentences[i:i + 2])
        header  = f"[LANG: {language.upper()} | DOMAIN: {domain} | SECTION: {section}]"
        out.append((f"{header} {body}", None))
    return out

def chunks_adaptive_sliding_window(text):
    """Dynamic window: smaller + more overlap near entity-dense zones."""
    words, out, i = text.split(), [], 0
    while i < len(words):
        lookahead    = " ".join(words[i:i + 35])
        entity_count = sum(1 for w in lookahead.split() if w and w[0].isupper())
        ws           = 22 if entity_count >= 3 else 32
        ov           = 8  if entity_count >= 3 else 6
        chunk        = " ".join(words[i:i + ws])
        if len(chunk.split()) > 5:
            out.append((chunk, None))
        i += max(8, ws - ov)
    return out

def passage_lists(example):
    """MSMARCO-XI stores lists under passages.{English_passages, Translated_passages, is_selected}."""
    passages = example.get("passages") or {}
    if not isinstance(passages, dict):
        return [], [], []
    eng = passages.get("English_passages") or []
    tr  = passages.get("Translated_passages") or []
    sel = passages.get("is_selected") or []
    return list(eng or []), list(tr or []), list(sel or [])

def ordered_texts(texts, selected):
    """Selected gold passages first so retrieval prefers MSMARCO answers."""
    indexed = list(enumerate(texts))
    indexed.sort(key=lambda iv: 0 if (iv[0] < len(selected) and selected[iv[0]]) else 1)
    for i, text in indexed:
        if not text or len(str(text).split()) < 8:
            continue
        yield str(text), bool(i < len(selected) and selected[i])

def chunk_text(text, language, strategy, example):
    if strategy == "semantic_boundary":
        return chunks_semantic_boundary(text)
    if strategy == "hierarchical_parent_child":
        return chunks_hierarchical_parent_child(text)
    if strategy == "metadata_aware":
        domain  = example.get("query_type") or example.get("domain") or "General"
        section = example.get("section") or "Main"
        return chunks_metadata_aware(text, language, domain, section)
    if strategy == "adaptive_sliding_window":
        return chunks_adaptive_sliding_window(text)
    return chunks_semantic_boundary(text)

def get_pieces(example, language, strategy):
    """Yield (piece_text, parent_or_None, chunk_language) for English + Indic passages."""
    eng, tr, selected = passage_lists(example)
    sources = []
    if INDEX_ENGLISH:
        sources.append(("en", eng))
    sources.append((language, tr))
    seen = set()
    for lang, texts in sources:
        for text, _gold in ordered_texts(texts, selected):
            key = (lang, text[:200])
            if key in seen:
                continue
            seen.add(key)
            for piece, parent in chunk_text(text, lang, strategy, example):
                yield piece, parent, lang

def make_point(example, language, strategy, piece, parent, piece_no):
    """Build a Qdrant PointStruct payload (without the vector)."""
    uid = str(uuid.UUID(
        hashlib.sha256(f"{language}:{strategy}:{piece}:{piece_no}".encode()).hexdigest()[:32]
    ))
    payload = {
        "language":    language,
        "query_id":    str(example.get("query_id", "")),
        "query":       example.get("query", ""),
        "chunking":    strategy,
        "chunk_no":    piece_no,
        "text":        piece,
    }
    if parent:
        payload["parent_context"] = parent[:1500]
    return uid, piece, payload

# ── Qdrant upsert with retry ──────────────────────────────────────────────
@retry(stop=stop_after_attempt(5), wait=wait_exponential(min=2, max=30))
def upsert_batch(client, points):
    client.upsert(COLLECTION, points=points, wait=False)

# ── Main ──────────────────────────────────────────────────────────────────
def main():
    CHECKPOINT_DIR.mkdir(exist_ok=True)

    print(f"Strategy : {STRATEGY}")
    print(f"Qdrant   : {QDRANT_URL}")
    print(f"Model    : {MODEL}")
    print(f"Languages: {LANG_FILTER or 'all'}")
    print(f"Max rows : {MAX_ROWS or 'unlimited'}\n")

    client   = QdrantClient(url=QDRANT_URL, timeout=120, check_compatibility=False)
    embedder = TextEmbedding(model_name=MODEL)

    dim = len(next(embedder.embed(["dimension probe"])))
    print(f"Embedding dim: {dim}")

    if not client.collection_exists(COLLECTION):
        client.create_collection(
            COLLECTION,
            vectors_config=models.VectorParams(size=dim, distance=models.Distance.COSINE),
        )
        print(f"Created collection: {COLLECTION}\n")
    else:
        print(f"Collection exists:  {COLLECTION}\n")

    for field in ("chunking", "language"):
        try:
            client.create_payload_index(
                COLLECTION,
                field_name=field,
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
        except Exception:
            pass

    # Resume checkpoint
    checkpoint = CHECKPOINT_DIR / f"global_{STRATEGY}.offset"
    offset     = int(checkpoint.read_text()) if checkpoint.exists() else 0
    print(f"Resuming from row {offset:,}\n")

    row_buffer     = []
    total_upserted = 0

    # Stream the dataset directly from parquet files (much faster than default config)
    # ai4bharat/MSMARCO-XI stores one parquet per language: hintrain.parquet, tamtrain.parquet, etc.
    # Lang abbreviation map (3-char prefix → 2-char ISO code)
    # Actual HuggingFace train/*.parquet names — there is NO engtrain or teltrain.
    LANG_PREFIX_MAP = {
        "asm": "as", "ben": "bn", "guj": "gu", "hin": "hi", "kan": "kn",
        "mal": "ml", "mar": "mr", "nep": "ne", "ori": "or", "pan": "pa",
        "san": "sa", "tam": "ta", "urd": "ur",
    }

    # Build list of parquet URLs to stream
    from huggingface_hub import hf_hub_url
    parquet_files = []
    for prefix, lang_code in LANG_PREFIX_MAP.items():
        if LANG_FILTER and lang_code not in LANG_FILTER:
            continue
        url = hf_hub_url(
            repo_id="ai4bharat/MSMARCO-XI",
            repo_type="dataset",
            filename=f"train/{prefix}train.parquet",
        )
        parquet_files.append((url, lang_code))

    if not parquet_files:
        print("No matching language parquet files found. Check LANGUAGES env var.")
        return

    print(f"  Will stream {len(parquet_files)} language parquet files\n")

    row_no = 0
    for parquet_url, lang_code in parquet_files:
        print(f"  Loading: {lang_code} ({parquet_url.split('/')[-1]}) ...")
        try:
            lang_stream = load_dataset("parquet", data_files={"train": parquet_url}, split="train", streaming=True)
        except Exception as e:
            print(f"    Skipping {lang_code}: {e}")
            continue

        # Resume checkpoint per language+strategy
        lang_checkpoint = CHECKPOINT_DIR / f"{lang_code}_{STRATEGY}.offset"
        lang_offset     = int(lang_checkpoint.read_text()) if lang_checkpoint.exists() else 0

        lang_row = 0
        for example in islice(lang_stream, lang_offset, None):
            if MAX_ROWS and row_no >= MAX_ROWS:
                break

            # Override language field with the known lang_code
            example_lang = lang_code

            for piece_no, (piece, parent, piece_lang) in enumerate(get_pieces(example, example_lang, STRATEGY)):
                row_buffer.append(make_point(example, piece_lang, STRATEGY, piece, parent, piece_no))

            # Flush when buffer is full
            while len(row_buffer) >= BATCH_SIZE:
                batch      = row_buffer[:BATCH_SIZE]
                row_buffer = row_buffer[BATCH_SIZE:]
                vectors    = list(embedder.embed([b[1] for b in batch]))
                pts        = [
                    models.PointStruct(id=b[0], vector=v.tolist(), payload=b[2])
                    for b, v in zip(batch, vectors)
                ]
                upsert_batch(client, pts)
                total_upserted += len(pts)

            lang_row += 1
            row_no   += 1

            if lang_row % 500 == 0:
                lang_checkpoint.write_text(str(lang_offset + lang_row))
                print(f"    {lang_code}: {lang_row:,} rows | total upserted: {total_upserted:,}", flush=True)

        # Clear per-language checkpoint when done
        lang_checkpoint.unlink(missing_ok=True)
        print(f"    {lang_code}: done ({lang_row:,} rows)")

    # Flush remaining buffer
    if row_buffer:
        vectors = list(embedder.embed([b[1] for b in row_buffer]))
        pts     = [
            models.PointStruct(id=b[0], vector=v.tolist(), payload=b[2])
            for b, v in zip(row_buffer, vectors)
        ]
        upsert_batch(client, pts)
        total_upserted += len(pts)

    checkpoint.unlink(missing_ok=True)
    print(f"\nDone. Total points upserted for strategy '{STRATEGY}': {total_upserted:,}")
if __name__ == "__main__":
    main()
