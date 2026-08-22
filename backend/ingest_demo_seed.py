"""
Demo seed ingestion — indexes the 10 hardcoded MSMARCO-XI representative
passages already in the frontend (src/lib/dataset/msmarco_xi.ts) into real
Qdrant with all 4 chunking strategies and real multilingual embeddings.

This gives a fully functional demo immediately.
Run ingest.bat overnight for the full 55GB corpus.

Usage:
  python backend/ingest_demo_seed.py
"""
import hashlib, os, re, uuid, warnings
warnings.filterwarnings("ignore")

from fastembed import TextEmbedding
from qdrant_client import QdrantClient, models

COLLECTION = os.getenv("QDRANT_COLLECTION", "msmarco_xi_passages")
QDRANT_URL = os.getenv("QDRANT_URL",        "http://localhost:6333")
MODEL      = os.getenv("EMBEDDING_MODEL",   "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

# ── Representative MSMARCO-XI passages (10 docs, 6 languages) ────────────
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
        "id": "doc-010", "language": "en", "domain": "Software Engineering",
        "section": "Systems > Distributed Architecture", "query": "What is microservices architecture?",
        "passages": [
            "Microservices architecture structures an application as a collection of loosely coupled, independently deployable services organized around specific business capabilities.",
            "Communication occurs over lightweight protocols such as gRPC or asynchronous event buses like Apache Kafka.",
            "To maintain state consistency across distributed databases, distributed consensus protocols like Raft or Paxos and the Saga pattern with compensating transactions are employed.",
        ]
    },
]

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

def chunks_metadata_aware(text, language="en", domain="General", section="Main"):
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

def get_chunks(text, strategy, language="en", domain="General", section="Main"):
    if strategy == "semantic_boundary":           return chunks_semantic_boundary(text)
    if strategy == "hierarchical_parent_child":   return chunks_hierarchical_parent_child(text)
    if strategy == "metadata_aware":              return chunks_metadata_aware(text, language, domain, section)
    if strategy == "adaptive_sliding_window":     return chunks_adaptive_sliding_window(text)
    return chunks_semantic_boundary(text)

# ── Main ──────────────────────────────────────────────────────────────────
def main():
    print("=== Julie Demo Seed Ingestion ===")
    print(f"Docs: {len(DEMO_DOCS)} | Strategies: 4")
    print(f"Qdrant: {QDRANT_URL}\n")

    client   = QdrantClient(url=QDRANT_URL, timeout=60, check_compatibility=False)
    embedder = TextEmbedding(model_name=MODEL)
    dim      = len(next(embedder.embed(["probe"])))
    print(f"Model: {MODEL} | dim={dim}")

    if not client.collection_exists(COLLECTION):
        client.create_collection(
            COLLECTION,
            vectors_config=models.VectorParams(size=dim, distance=models.Distance.COSINE),
        )
        print(f"Created collection: {COLLECTION}")
    else:
        print(f"Using existing collection: {COLLECTION}")

    for field in ("chunking", "language"):
        try:
            client.create_payload_index(
                COLLECTION, field_name=field, field_schema=models.PayloadSchemaType.KEYWORD
            )
        except Exception:
            pass

    print()
    all_points  = []
    total_chunks = 0

    for doc in DEMO_DOCS:
        for strategy in ALL_STRATEGIES:
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
                        "query":    doc["query"],
                        "chunking": strategy,
                        "chunk_no": pno,
                        "domain":   doc["domain"],
                        "text":     piece,
                    }
                    if parent:
                        payload["parent_context"] = parent[:1500]
                    all_points.append((uid, piece, payload))
                    total_chunks += 1

    print(f"Total chunks to index: {total_chunks} ({len(DEMO_DOCS)} docs × ~{total_chunks//len(DEMO_DOCS)} avg/doc across 4 strategies)\n")

    # Embed and upsert in batches
    BATCH = 64
    upserted = 0
    for start in range(0, len(all_points), BATCH):
        batch   = all_points[start:start+BATCH]
        vectors = list(embedder.embed([b[1] for b in batch]))
        pts     = [
            models.PointStruct(id=b[0], vector=v.tolist(), payload=b[2])
            for b, v in zip(batch, vectors)
        ]
        client.upsert(COLLECTION, points=pts, wait=True)
        upserted += len(pts)
        print(f"  Upserted {upserted}/{total_chunks} points ...", end="\r")

    print(f"\n\nDone! {upserted} points indexed into Qdrant collection '{COLLECTION}'")

    # Verify retrieval
    print("\nRetrieval sanity checks:")
    test_cases = [
        ("What is quantum superposition?", "en"),
        ("फोटोवोल्टिक सेल", "hi"),
        ("CRISPR gene editing", "en"),
        ("machine learning supervised", "en"),
    ]
    for query, lang in test_cases:
        qvec = list(embedder.embed([query]))[0].tolist()
        result = client.query_points(COLLECTION, query=qvec, limit=2, with_payload=True)
        pts = result.points if hasattr(result, "points") else []
        if pts:
            p = pts[0]
            print(f"  Query: '{query[:45]}'")
            print(f"  -> score={p.score:.3f} [{p.payload.get('chunking')}] [{p.payload.get('language')}]")
            print(f"     {str(p.payload.get('text',''))[:90]}...")
        else:
            print(f"  Query: '{query}' -> no results")

    print(f"\n✅ Julie is ready! Open http://localhost:3000 after starting 'npm run dev'")
    print(f"   API running at http://localhost:8787/health")
    print(f"   Qdrant dashboard: http://localhost:6333/dashboard\n")
    print("   For full 55GB corpus: run 'ingest.bat' overnight\n")

if __name__ == "__main__":
    main()
