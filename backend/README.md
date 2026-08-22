# Julie — Backend Reference

## Architecture

```
Browser (Vite SPA)
       │  VITE_API_BASE_URL
       ▼
┌─────────────────────────────┐
│  Fastify API  :8787          │  Node.js 22
│  server/index.mjs            │
│                              │
│  /v1/ask   POST multipart    │  ← audio blob or JSON text
│  /v1/benchmark POST          │  ← automated latency test
│  /v1/strategies GET          │  ← chunking strategy list
│  /health   GET               │
└──────┬──────────────┬────────┘
       │              │
       ▼              ▼
 Sarvam STT      Embedding Service
 (external)       :8081  Python/FastAPI
                  /embed/query
                       │
                       ▼
                 Qdrant :6333
                 msmarco_xi_passages
```

## Services

| Service | Port | Tech | Purpose |
|---------|------|------|---------|
| api | 8787 | Node 22 + Fastify 5 | Main pipeline |
| embeddings | 8081 | Python 3.12 + fastembed | multilingual-e5-small vectors |
| qdrant | 6333 | Qdrant v1.15 | Persistent vector storage |

## Chunking Strategies (Qdrant `chunking` field values)

| ID | Name | Description |
|----|------|-------------|
| `semantic_boundary` | Semantic Boundary | Splits at discourse markers and sentence boundaries |
| `hierarchical_parent_child` | Hierarchical Parent-Child | Dense micro-chunks + full parent context in metadata |
| `metadata_aware` | Metadata & Language Aware | ISO-code + domain-tagged enriched embeddings |
| `adaptive_sliding_window` | Adaptive Sliding Window | Entity-density driven dynamic overlap |

## Quick Start (Docker)

```bash
# 1. Fill in your API keys
cp server/.env.example server/.env
# Edit server/.env: set SARVAM_API_KEY, GROQ_API_KEY

# 2. Start the serving stack (API + embeddings + Qdrant)
docker compose up -d

# 3. Run the offline ingestion job (streams MSMARCO-XI, ~hours)
# This runs all 4 chunking strategies automatically
docker compose run --rm ingest

# 4. Set frontend env
echo "VITE_API_BASE_URL=http://localhost:8787" > .env

# 5. Start frontend dev server
npm run dev
```

## Running Locally (without Docker)

```bash
# Start Qdrant
docker run -d -p 6333:6333 qdrant/qdrant:v1.15.4

# Start embedding service
pip install -r backend/requirements.txt
uvicorn backend.embed_service:app --port 8081 --reload

# Start API
npm run api:dev   # or npm run dev:full to run both API + Vite together

# Run ingestion (in another terminal)
cd julie-rag
QDRANT_URL=http://localhost:6333 \
QDRANT_COLLECTION=msmarco_xi_passages \
CHUNKING_STRATEGY=semantic_boundary \
python backend/ingest_msmarco_xi.py
```

## Running a Specific Chunking Strategy

```bash
# Ingest only one strategy
docker compose run --rm \
  -e CHUNKING_STRATEGY=hierarchical_parent_child \
  -e LANGUAGES=en,hi \
  ingest
```

## Benchmark (P50/P70/P100)

```bash
curl -X POST http://localhost:8787/v1/benchmark \
  -H "Content-Type: application/json" \
  -d '{"strategy": "semantic_boundary"}'
```

Returns P50/P70/P90/P99/P100 latency across 12 benchmark queries.

## API Reference

### POST /v1/ask

Text mode:
```json
{ "query": "What is quantum superposition?", "strategy": "semantic_boundary" }
```

Audio mode: `multipart/form-data` with fields `file` (audio blob), `strategy`, `language`.

Success response:
```json
{
  "query": "...",
  "language": "en",
  "answer": "...",
  "citations": [{ "id": "uuid", "score": 0.87, ... }],
  "faithfulnessScore": 0.76,
  "llmSource": "groq",
  "trace": [
    { "step": "input_guardrail", "ms": 0.4, "result": "passed" },
    { "step": "embed", "ms": 12.1 },
    { "step": "qdrant_retrieve", "ms": 8.3, "count": 5 },
    { "step": "generate", "ms": 180.2, "llm": "groq" },
    { "step": "faithfulness_check", "ms": 0.2, "score": 0.76, "passed": true }
  ],
  "totalMs": 201.5,
  "targetMet": false
}
```

Note: `totalMs < 200` is achievable for text-RAG without LLM. With Groq, expect 200–400ms.
The latency target spec applies to the embed+retrieve pipeline; Sarvam STT adds 1–3s on top.

## Guardrails

| Check | Trigger | Response |
|-------|---------|----------|
| Input Safety | Adversarial/unsafe keywords | `refusal.code: unsafe_input` |
| Off-Topic | Food, astrology, sports, etc. | `refusal.code: off_topic` |
| Domain Relevance | Top Qdrant score < 0.28 | `refusal.code: insufficient_evidence` |
| Output Faithfulness | Lexical grounding < 40% | `refusal.code: hallucination_risk` |

## LLM Setup (Recommended: Groq)

1. Get a free API key at [console.groq.com](https://console.groq.com)
2. Add to `server/.env`: `GROQ_API_KEY=gsk_...`
3. Model: `llama-3.1-8b-instant` (default) — very fast, free tier

Without a key, Julie falls back to **extractive** mode (returns best passage sentences directly).
