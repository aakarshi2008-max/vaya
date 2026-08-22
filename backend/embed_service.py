"""
Julie — Unified Python Multilingual Embedding & Local Vector Search Service
HH Goa 2026 Task 2: Sub-200ms Voice-Enabled RAG System

Features:
  ✓ Multilingual fastembed ONNX embeddings (sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2)
  ✓ Native Qdrant vector database (embedded local storage, 0 Docker required)
  ✓ Automatic seeding of MSMARCO-XI representative passages across 4 chunking strategies:
      - semantic_boundary
      - hierarchical_parent_child
      - metadata_aware
      - adaptive_sliding_window
  ✓ Qdrant REST API endpoints:
      - POST /collections/{name}/points/query
      - POST /collections/{name}/points/search
      - POST /collections/{name}/points
      - GET  /collections/{name}
  ✓ Embedding API endpoints:
      - GET  /health, /ready
      - POST /embed, /embed/query
"""

import os
import re
import time
import uuid
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from fastembed import TextEmbedding
from qdrant_client import QdrantClient, models

# ── Configuration ─────────────────────────────────────────────────────────────
MODEL_NAME = os.getenv("EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "msmarco_xi_passages")
DB_STORAGE_PATH = os.getenv("QDRANT_STORAGE_PATH", "./backend/qdrant_db")

# Ensure directory exists
Path(DB_STORAGE_PATH).mkdir(parents=True, exist_ok=True)

# Global instances
_model: Optional[TextEmbedding] = None
_qdrant: Optional[QdrantClient] = None

def get_model() -> TextEmbedding:
    global _model
    if _model is None:
        _model = TextEmbedding(model_name=MODEL_NAME)
    return _model

def get_qdrant() -> QdrantClient:
    global _qdrant
    if _qdrant is None:
        try:
            _qdrant = QdrantClient(path=DB_STORAGE_PATH)
        except (RuntimeError, Exception):
            # Fallback to in-memory if DB is locked by another process (e.g. uvicorn --reload spawns two workers)
            print("[Qdrant] Disk DB locked, using in-memory mode.")
            _qdrant = QdrantClient(location=":memory:")
    return _qdrant

# ── Representative MSMARCO-XI Passages Seed ──────────────────────────────────
DEMO_DOCS = [
    {
        "id": "doc-001", "language": "en", "domain": "Quantum Physics",
        "section": "Physics > Computation", "query": "What is quantum superposition?",
        "passages": [
            "Quantum computing utilizes the fundamental principles of quantum mechanics, notably superposition and entanglement, to process complex computational information exponentially faster than classical computers.",
            "Unlike classical bits which exist strictly in binary states of 0 or 1, quantum bits (qubits) can exist in a linear combination of both states simultaneously.",
            "This superposition allows quantum algorithms, such as Shor's algorithm for prime factorization and Grover's algorithm for unstructured database search, to achieve polynomial and quadratic speedups respectively.",
        ]
    },
    {
        "id": "doc-002", "language": "en", "domain": "Biological Sciences",
        "section": "Biology > Plant Physiology", "query": "How does photosynthesis work?",
        "passages": [
            "Photosynthesis is the biochemical process by which photoautotrophic organisms convert light energy into chemical energy stored in glucose molecules.",
            "It occurs inside plant chloroplasts in two distinct stages: the light-dependent reactions within thylakoid membranes where photon absorption generates ATP and NADPH while splitting water into oxygen.",
            "The light-independent Calvin cycle within the stroma uses the enzyme RuBisCO to fix carbon dioxide (CO2) into glyceraldehyde-3-phosphate (G3P).",
        ]
    },
    {
        "id": "doc-003", "language": "hi", "domain": "Renewable Energy",
        "section": "Energy > Solar Tech", "query": "फोटोवोल्टिक सेल कैसे काम करते हैं?",
        "passages": [
            "सौर ऊर्जा सूर्य से प्राप्त विकिरण ऊर्जा है जो पृथ्वी पर जीवन का मुख्य आधार है।",
            "फोटोवोल्टिक (PV) सेल अर्धचालक सामग्रियों (मुख्यतः सिलिकॉन) से बने होते हैं जो सौर प्रकाश के फोटॉनों को सीधे विद्युत ऊर्जा में परिवर्तित करते हैं।",
            "जब प्रकाश सिलिकॉन पी-एन जंक्शन पर पड़ता है, तो इलेक्ट्रॉन उत्तेजित होकर मुक्त होते हैं, जिससे दिष्ट धारा (DC) विद्युत प्रवाह उत्पन्न होता है।",
        ]
    },
    {
        "id": "doc-004", "language": "ta", "domain": "Computer Science",
        "section": "Technology > AI", "query": "செயற்கை நுண்ணறிவு என்றால் என்ன?",
        "passages": [
            "செயற்கை நுண்ணறிவு (Artificial Intelligence) மனித மூளையின் கற்றல் மற்றும் பகுத்தறியும் திறன்களை கணினிகளில் செயல்படுத்தும் தொழில்நுட்பமாகும்.",
            "ஆழமான கற்றல் (Deep Learning) மற்றும் செயற்கை நரம்பியல் வலைப்பின்னல்கள் பெருந்தரவுகளை பகுப்பாய்வு செய்து மனிதர்களை விட துல்லியமாக செயல்படுகின்றன.",
        ]
    },
    {
        "id": "doc-005", "language": "te", "domain": "Data Science",
        "section": "Data Science > ML", "query": "మెషిన్ లెర్నింగ్ అంటే ఏమిటి?",
        "passages": [
            "మెషిన్ లెర్నింగ్ అనేది కృత్రిమ మేధస్సు యొక్క ఒక విభాగం, ఇది ముందస్తు ప్రోగ్రామింగ్ లేకుండా అనుభవం నుండి నేర్చుకోవడానికి కంప్యూటర్ వ్యవస్థలను అనుమతిస్తుంది.",
            "సూపర్‌వైజ్డ్ లెర్నింగ్, అన్-సూపర్‌వైజ్డ్ లెర్నింగ్ మరియు రీఇన్‌ఫోర్స్‌మెంట్ లెర్నింగ్ వంటి అల్గోరిథంలు భారీ డేటాసెట్ల నుండి విజ్ఞానాన్ని సేకరిస్తాయి.",
        ]
    },
    {
        "id": "doc-006", "language": "en", "domain": "Astrophysics",
        "section": "Astrophysics > Gravity", "query": "What are black holes and Hawking radiation?",
        "passages": [
            "A black hole is a region of spacetime exhibiting gravitational acceleration so intense that no particles or electromagnetic radiation, including light, can escape from its event horizon.",
            "In 1974, physicist Stephen Hawking demonstrated through quantum field theory in curved spacetime that black holes emit thermal black-body radiation (Hawking radiation).",
            "This causes black holes to slowly lose mass and eventually evaporate over cosmic timescales.",
        ]
    },
    {
        "id": "doc-007", "language": "en", "domain": "Genetics & Biotechnology",
        "section": "Biotech > Genomic Editing", "query": "How does CRISPR-Cas9 work?",
        "passages": [
            "CRISPR-Cas9 is an RNA-guided targeted genome editing technology adapted from bacterial adaptive immune systems.",
            "The system comprises two core components: the Cas9 endonuclease enzyme which introduces double-strand DNA breaks, and a synthetic single guide RNA (sgRNA) that directs Cas9 to a matching 20-nucleotide genomic target sequence.",
            "Cells repair the cleaved DNA through non-homologous end joining (NHEJ) or homology-directed repair (HDR), enabling precise gene knockouts or insertions.",
        ]
    },
    {
        "id": "doc-008", "language": "en", "domain": "HH Goa Hackathon",
        "section": "HH Goa > Official Guide", "query": "What is HackerHouse Goa 2026?",
        "passages": [
            "Hacker House Goa 2026 (HH Goa 2026) is India's premier high-signal hackathon residency taking place from October 28 to 31, 2026 in Goa, India.",
            "With the motto Less Noise More Signal, 247 elite builders assemble for 4 intensive days structured across Genesis Day, Day of Triangle, Build Day, and Launch Day.",
            "Key challenges include Task 2: Sub-200ms Voice-Enabled RAG System with engineered chunking, Sarvam STT, model harness orchestration, and hallucination guardrails.",
        ]
    },
    {
        "id": "doc-009", "language": "hi", "domain": "Law & Polity",
        "section": "Polity > Fundamental Rights", "query": "भारतीय संविधान के मौलिक अधिकार क्या हैं?",
        "passages": [
            "भारतीय संविधान दुनिया का सबसे लंबा लिखित संविधान है जिसे 26 जनवरी 1950 को लागू किया गया था।",
            "संविधान के भाग 3 में 6 मौलिक अधिकारों का वर्णन है: समानता का अधिकार, स्वतंत्रता का अधिकार, शोषण के विरुद्ध अधिकार, धार्मिक स्वतंत्रता का अधिकार।",
            "डॉ. भीमराव आंबेडकर ने संवैधानिक उपचारों के अधिकार (अनुच्छेद 32) को संविधान की आत्मा और हृदय कहा था।",
        ]
    },
    {
        "id": "doc-010", "language": "bn", "domain": "Computer Science",
        "section": "CS > Distributed Systems", "query": "বিতরণকৃত সিস্টেম কি?",
        "passages": [
            "একটি বিতরণকৃত সিস্টেম হলো একাধিক স্বায়ত্তশাসিত কম্পিউটারের একটি नेटवर्क যা ব্যবহারকারীর কাছে একটি একক সুসংগত সিস্টেম হিসাবে উপস্থিত হয়।",
            "রাফ্ট (Raft) এবং প্যাক্সোস (Paxos) কনসেনসাস অ্যালগরিদম নেটওয়ার্ক পার্টিশনের মধ্যেও নোডগুলির মধ্যে ধারাবাহিকতা বজায় রাখে।",
        ]
    },
    {
        "id": "doc-011", "language": "en", "domain": "Indian Polity & Governance",
        "section": "Polity > National Leadership", "query": "Who is Prime Minister Narendra Modi?",
        "passages": [
            "Narendra Damodardas Modi is the 14th Prime Minister of India, serving continuously since May 2014 after leading the Bharatiya Janata Party (BJP) to parliamentary victories in 2014, 2019, and 2024.",
            "Prior to becoming Prime Minister of India, Narendra Modi served as the Chief Minister of Gujarat from October 2001 to May 2014, known for the Gujarat development model.",
            "Key national initiatives spearheaded under his tenure include Digital India, Make in India, Pradhan Mantri Jan Dhan Yojana for financial inclusion, Ayushman Bharat, and PM Gati Shakti.",
        ]
    },
    {
        "id": "doc-012", "language": "hi", "domain": "Indian Governance",
        "section": "Polity > Leadership", "query": "प्रधानमंत्री नरेंद्र मोदी कौन हैं?",
        "passages": [
            "नरेंद्र दामोदरदास मोदी भारत के 14वें प्रधानमंत्री हैं, जो मई 2014 से निरंतर भारत के प्रधानमंत्री के रूप में देश का नेतृत्व कर रहे हैं।",
            "प्रधानमंत्री बनने से पहले नरेंद्र मोदी 2001 से 2014 तक गुजरात के मुख्यमंत्री रहे थे।",
            "उनके नेतृत्व में डिजिटल इंडिया, मेक इन इंडिया, स्वच्छ भारत मिशन, जन धन योजना और पीएम गति शक्ति जैसी महत्वपूर्ण राष्ट्रीय योजनाएं लागू की गईं।",
        ]
    },
    {
        "id": "doc-013", "language": "en", "domain": "Space Exploration & Science",
        "section": "Science > Space Missions", "query": "What is ISRO and Chandrayaan-3?",
        "passages": [
            "The Indian Space Research Organisation (ISRO) is the national space agency of India, headquartered in Bengaluru, Karnataka.",
            "On August 23, 2023, ISRO's Chandrayaan-3 mission successfully soft-landed the Vikram lander and Pragyan rover near the lunar south pole, making India the first nation to reach the Moon's south pole region.",
            "ISRO has also successfully executed the Mars Orbiter Mission (Mangalyaan), the Aditya-L1 solar observation mission, and is developing the Gaganyaan human spaceflight programme.",
        ]
    },
    {
        "id": "doc-014", "language": "en", "domain": "Economics & Digital Infrastructure",
        "section": "Economy > Fintech", "query": "What is UPI and Digital Public Infrastructure?",
        "passages": [
            "Unified Payments Interface (UPI) is an instant real-time payment system developed by the National Payments Corporation of India (NPCI) facilitating inter-bank peer-to-peer and person-to-merchant transactions.",
            "UPI forms a foundational pillar of India Stack, India's world-leading Digital Public Infrastructure (DPI) alongside Aadhaar identity verification and DigiLocker.",
            "India's DPI ecosystem processes over 13 billion monthly digital financial transactions, accounting for nearly 46% of all global real-time digital payments.",
        ]
    },
    {
        "id": "doc-015", "language": "en", "domain": "Artificial Intelligence & LLMs",
        "section": "AI > Deep Learning", "query": "How do Transformer models and Attention mechanisms work?",
        "passages": [
            "The Transformer deep learning architecture was introduced by Vaswani et al. in 2017 in the foundational paper 'Attention Is All You Need'.",
            "Unlike Recurrent Neural Networks (RNNs) that process sequential data step-by-step, Transformers use multi-head self-attention mechanisms to compute dependencies between all tokens in parallel.",
            "Self-attention dynamically assigns mathematical weights to contextual relationships between words, forming the architectural backbone for modern Large Language Models such as GPT-4, Llama 3, and Gemini.",
        ]
    },
    {
        "id": "doc-016", "language": "en", "domain": "Geography & Earth Sciences",
        "section": "Geography > Mountains", "query": "What is Mount Everest?",
        "passages": [
            "Mount Everest is Earth's highest mountain above sea level, located in the Mahalangur Himal sub-range of the Himalayas on the border of Nepal and the Tibet Autonomous Region of China.",
            "The official elevation of Mount Everest was jointly confirmed as 8,848.86 meters (29,031.7 feet) by Nepalese and Chinese authorities.",
            "In 1953, Sir Edmund Hillary of New Zealand and Tenzing Norgay, a Sherpa of Nepal, became the first climbers confirmed to have reached the summit.",
        ]
    }
]

# ── Chunking Functions ────────────────────────────────────────────────────────
def chunks_semantic_boundary(text: str):
    sentences = [s.strip() for s in re.split(r'(?<=[.!?।॥])\s+', text) if s.strip()]
    out, current, wc = [], [], 0
    for s in sentences:
        sw = len(s.split())
        if wc + sw > 35 and current:
            out.append(" ".join(current))
            current, wc = [s], sw
        else:
            current.append(s)
            wc += sw
    if current:
        out.append(" ".join(current))
    return [(c, None) for c in out]

def chunks_hierarchical_parent_child(text: str):
    parent, words, out, i = text, text.split(), [], 0
    while i < len(words):
        child = " ".join(words[i:i+18])
        if len(child.split()) > 5:
            out.append((child, parent))
        i += 14
    return out

def chunks_metadata_aware(text: str, language: str = "en", domain: str = "General", section: str = "Main"):
    sentences = [s.strip() for s in re.split(r'(?<=[.!?।॥])\s+', text) if s.strip()]
    return [
        (f"[LANG: {language.upper()} | DOMAIN: {domain} | SECTION: {section}] {' '.join(sentences[i:i+2])}", None)
        for i in range(0, len(sentences), 2)
    ]

def chunks_adaptive_sliding_window(text: str):
    words, out, i = text.split(), [], 0
    while i < len(words):
        ec = sum(1 for w in " ".join(words[i:i+35]).split() if w and w[0].isupper())
        ws, ov = (22, 8) if ec >= 3 else (32, 6)
        chunk = " ".join(words[i:i+ws])
        if len(chunk.split()) > 5:
            out.append((chunk, None))
        i += max(8, ws - ov)
    return out

def get_chunks(text: str, strategy: str, language: str = "en", domain: str = "General", section: str = "Main"):
    if strategy == "semantic_boundary":
        return chunks_semantic_boundary(text)
    elif strategy == "hierarchical_parent_child":
        return chunks_hierarchical_parent_child(text)
    elif strategy == "metadata_aware":
        return chunks_metadata_aware(text, language, domain, section)
    elif strategy == "adaptive_sliding_window":
        return chunks_adaptive_sliding_window(text)
    return chunks_semantic_boundary(text)

def seed_collection(client: QdrantClient, embedder: TextEmbedding, collection_name: str):
    """Seed the collection with representative MSMARCO-XI passages if empty."""
    dim = 384
    if not client.collection_exists(collection_name):
        client.create_collection(
            collection_name,
            vectors_config=models.VectorParams(size=dim, distance=models.Distance.COSINE),
        )
        print(f"[Seed] Created collection '{collection_name}'")

    strategies = [
        "semantic_boundary",
        "hierarchical_parent_child",
        "metadata_aware",
        "adaptive_sliding_window",
    ]

    all_points = []
    for doc in DEMO_DOCS:
        for strategy in strategies:
            for passage in doc["passages"]:
                for pno, (piece, parent) in enumerate(get_chunks(
                    passage, strategy,
                    language=doc["language"],
                    domain=doc["domain"],
                    section=doc["section"],
                )):
                    uid = str(uuid.UUID(
                        hashlib.sha256(
                            f"{doc['id']}:{strategy}:{passage}:{pno}".encode()
                        ).hexdigest()[:32]
                    ))
                    payload = {
                        "language": doc["language"],
                        "query_id": doc["id"],
                        "query": doc["query"],
                        "chunking": strategy,
                        "chunk_no": pno,
                        "domain": doc["domain"],
                        "text": piece,
                    }
                    if parent:
                        payload["parent_context"] = parent[:1500]
                    all_points.append((uid, piece, payload))

    batch_size = 64
    for start in range(0, len(all_points), batch_size):
        batch = all_points[start:start+batch_size]
        vectors = list(embedder.embed([b[1] for b in batch]))
        pts = [
            models.PointStruct(id=b[0], vector=v.tolist(), payload=b[2])
            for b, v in zip(batch, vectors)
        ]
        client.upsert(collection_name, points=pts, wait=True)
    print(f"[Seed] Successfully indexed {len(all_points)} chunks across 4 strategies into '{collection_name}'")


# ── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(title="Julie Unified Multilingual Vector & Embedding Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ── Schemas ───────────────────────────────────────────────────────────────────
class EmbedRequest(BaseModel):
    texts: List[str] = Field(..., min_length=1, max_length=256)
    prefix: str = Field(default="passage", description="'passage' or 'query'")

class QueryEmbedRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1200)

class QdrantQueryRequest(BaseModel):
    query: Optional[List[float]] = None
    vector: Optional[List[float]] = None
    limit: int = 5
    with_payload: bool = True
    score_threshold: Optional[float] = None
    filter: Optional[Dict[str, Any]] = None

# ── Embedding Routes ──────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "julie_vector_embed",
        "model": MODEL_NAME,
        "collection": COLLECTION_NAME,
        "model_loaded": _model is not None,
    }

@app.get("/ready")
def ready():
    try:
        m = get_model()
        _ = list(m.embed(["ready"]))
        return {"ok": True, "model": MODEL_NAME}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Model not ready: {str(e)}")

@app.post("/embed")
def embed(request: EmbedRequest):
    start = time.perf_counter()
    model = get_model()
    vectors = list(model.embed(request.texts))
    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
    return {
        "vectors": [v.tolist() for v in vectors],
        "dim": len(vectors[0]) if vectors else 0,
        "count": len(vectors),
        "latency_ms": elapsed_ms,
    }

@app.post("/embed/query")
def embed_query(request: QueryEmbedRequest):
    start = time.perf_counter()
    model = get_model()
    vectors = list(model.embed([request.query]))
    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
    return {
        "vector": vectors[0].tolist(),
        "dim": len(vectors[0]),
        "latency_ms": elapsed_ms,
    }

# ── Qdrant REST Compatible Endpoints ──────────────────────────────────────────
@app.get("/collections/{collection_name}")
def get_collection(collection_name: str):
    client = get_qdrant()
    if not client.collection_exists(collection_name):
        raise HTTPException(status_code=404, detail="Collection not found")
    info = client.get_collection(collection_name)
    count = client.count(collection_name).count
    return {
        "result": {
            "status": "green",
            "vectors_count": count,
            "points_count": count,
            "config": {
                "params": {
                    "vectors": {"size": 384, "distance": "Cosine"}
                }
            }
        }
    }

def _parse_filter(filter_dict: Optional[Dict[str, Any]]) -> Optional[models.Filter]:
    if not filter_dict:
        return None
    try:
        must_clauses = []
        if "must" in filter_dict and isinstance(filter_dict["must"], list):
            for condition in filter_dict["must"]:
                key = condition.get("key")
                match = condition.get("match", {})
                if key and "value" in match:
                    must_clauses.append(
                        models.FieldCondition(
                            key=key,
                            match=models.MatchValue(value=match["value"])
                        )
                    )
        if must_clauses:
            return models.Filter(must=must_clauses)
    except Exception:
        pass
    return None

@app.post("/collections/{collection_name}/points/query")
@app.post("/collections/{collection_name}/points/search")
def search_points(collection_name: str, req: QdrantQueryRequest):
    start = time.perf_counter()
    client = get_qdrant()

    # Ensure collection exists & seeded
    if not client.collection_exists(collection_name):
        seed_collection(client, get_model(), collection_name)

    vec = req.query or req.vector
    if not vec:
        raise HTTPException(status_code=400, detail="Missing vector in query")

    qfilter = _parse_filter(req.filter)

    try:
        results = client.query_points(
            collection_name=collection_name,
            query=vec,
            limit=req.limit,
            query_filter=qfilter,
            score_threshold=req.score_threshold or 0.10,
            with_payload=req.with_payload,
        )

        points = results.points if hasattr(results, "points") else results
        formatted = [
            {
                "id": str(hit.id),
                "version": getattr(hit, "version", 0),
                "score": round(float(hit.score), 4),
                "payload": hit.payload or {},
            }
            for hit in points
        ]

        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "result": formatted,
            "status": "ok",
            "time": elapsed_ms / 1000.0,
        }
    except Exception as e:
        print("[Qdrant Search Error]", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/seed")
def manual_seed(collection_name: str = COLLECTION_NAME):
    client = get_qdrant()
    embedder = get_model()
    seed_collection(client, embedder, collection_name)
    count = client.count(collection_name).count
    return {"ok": True, "collection": collection_name, "points_count": count}

# ── Startup Lifecycle ─────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    print("[Julie Vector Service] Starting up and loading embedding model...")
    embedder = get_model()
    client = get_qdrant()
    seed_collection(client, embedder, COLLECTION_NAME)
    print(f"[Julie Vector Service] Ready on port 8081! Collection '{COLLECTION_NAME}' active.")
