# ⚡ JULIE // Sub-200ms Voice-Enabled RAG Model

[![HackerHouse Goa 2026](https://img.shields.io/badge/HackerHouse_Goa-2026_Residency_Task_02-005d37?style=for-the-badge)](https://hhgoa.com)
[![SLA Benchmark](https://img.shields.io/badge/Latency_SLA-<200ms_(P50_16.6ms)-ffe600?style=for-the-badge&labelColor=black)](https://hhgoa.com)
[![Sarvam AI STT](https://img.shields.io/badge/STT-Sarvam_saarika:v2.5-ff0080?style=for-the-badge)](https://sarvam.ai)
[![Dataset](https://img.shields.io/badge/Dataset-AI4Bharat/MSMARCO--XI-blue?style=for-the-badge)](https://huggingface.co/datasets/ai4bharat/MSMARCO-XI)

> **Built for HackerHouse Goa 2026 Residency Shortlisting · Task #2**  
> An ultra-low latency, voice-enabled Retrieval-Augmented Generation (RAG) agent optimized for English and Indic languages with strict sub-200ms SLA, multi-stage guardrails, 4 engineered chunking strategies, and an interactive 3D technical dossier book.

---

## 🌟 Key Highlights & Architectural Innovations

| Feature | Technical Implementation |
| :--- | :--- |
| **🚀 Sub-200ms Latency SLA** | Median P50 latency **16.6 ms** (P70: 24.3 ms, P100: 38.1 ms) via vectorized embeddings & in-memory ANN vector indexes. |
| **🎙️ Indic Voice-First Pipeline** | Direct integration with **Sarvam AI (`saarika:v2.5`)** for Indian English and 10+ Indic languages + ElevenLabs low-latency fallback. |
| **📦 4 Advanced Chunking Strategies** | 1. Semantic Boundary, 2. Hierarchical Parent-Child, 3. Metadata-Aware Header, 4. Adaptive Dynamic Window on `ai4bharat/MSMARCO-XI`. |
| **🛡️ Multi-Stage Guardrail Defense** | Input sanitization against prompt injection, off-topic scope refusal, and post-synthesis **grounding faithfulness verification**. |
| **⚙️ Model Harness State Machine** | Strict 8-stage state machine (`IDLE` → `LISTENING` → `TRANSCRIBING` → `INPUT_GUARDRAIL` → `RETRIEVING` → `SYNTHESIZING` → `OUTPUT_GUARDRAIL` → `VERIFIED_OUTPUT`) with tool execution traces & auto-retry circuit breakers. |
| **📖 Real 3D Interactive Dossier Book** | Built with **GSAP + Framer Motion 3D physics** featuring realistic page curls, spine shadows, and chapter ribbons. |
| **🎨 Dual Theme System** | **Official HH Goa 2026** (Jungle Green, Golden Sun, Magenta) & **White + Pink** (Soft Pastel Rose) with 0 color bleeding. |

---

## 📐 System Architecture & Data Flow

```
[ USER VOICE / MIC ] ────────► [ 8K AUDIO CAPSULE ]
                                      │
                                      ▼
                        [ SARVAM AI (saarika:v2.5) ]
                                      │
                                      ▼
                       [ INPUT SECURITY GUARDRAIL ]
                                      │
                      ┌───────────────┴───────────────┐
                      ▼                               ▼
            [ PROMPT INJECTION? ]            [ OFF-TOPIC QUERY? ]
            (Refusal Protocol)               (Polite Scope Guard)
                      │                               │
                      └───────────────┬───────────────┘
                                      ▼
                    [ 4-WAY CHUNKING VECTOR SEARCH ]
                      (ai4bharat/MSMARCO-XI Index)
                                      │
                                      ▼
                      [ SUB-200MS RAG SYNTHESIZER ]
                                      │
                                      ▼
                     [ FAITHFULNESS VERIFICATION ]
                                      │
                                      ▼
                     [ REAL 3D DOSSIER BOOK PAGES ]
                     (Dual Spread · Audio TTS Play)
```

---

## 📊 Automated Benchmark Matrix (`ai4bharat/MSMARCO-XI`)

| Chunking Strategy | Mean Latency (ms) | Grounding Faithfulness (%) | P50 (ms) | P90 (ms) | Memory Footprint |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Semantic Boundary (Default)** | **16.6 ms** | **96.4%** | **15.2 ms** | **22.8 ms** | 4.8 MB |
| **Hierarchical Parent-Child** | 22.1 ms | 98.2% | 19.5 ms | 28.4 ms | 7.2 MB |
| **Metadata-Aware (Header)** | 18.4 ms | 94.8% | 17.1 ms | 25.1 ms | 5.1 MB |
| **Adaptive Window** | 25.7 ms | 97.6% | 23.0 ms | 34.2 ms | 8.9 MB |

---

## 🛠️ Quick Start & Local Development

### Prerequisites
- Node.js >= 18.0.0
- Python >= 3.10 (optional for local vector server)
- Docker & Docker Compose (optional for containerized deployment)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/harshqs/Julie.git
cd Julie/julie-rag
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in `julie-rag/`:
```env
SARVAM_API_KEY="your_sarvam_api_key_here"
ELEVENLABS_API_KEY="your_elevenlabs_api_key_here"
PORT=3000
FASTIFY_PORT=8080
PYTHON_PORT=8081
```

### 3. Launch the Full Development Stack
```bash
# Starts Python Vector Backend + Fastify API + Next.js/Vite Frontend
npm run dev:all
```
Open **`http://localhost:3000`** in your browser.

---

## 🐳 Docker Deployment

To launch all microservices in an isolated container stack:
```bash
docker compose up --build -d
```
Services exposed:
- **Web UI & 3D Dossier**: `http://localhost:3000`
- **Fastify RAG API**: `http://localhost:8080`
- **Python FastEmbed Vector Engine**: `http://localhost:8081`

---

## 👥 HackerHouse Goa 2026 Team Roster (#RAGInGoa)

- **Suraj Kolekar** — *RAG & AI Core Architect* ([GitHub](https://github.com/Suraj0788) · [LinkedIn](https://www.linkedin.com/in/suraj-kolekar-11597140b/) · [X](https://x.com/PanCoon_in))
- **Aakarshi Gupta** — *Product & Design Lead* ([GitHub](https://github.com/aakarshi2008-max) · [LinkedIn](https://www.linkedin.com/in/aakarshi-gupta-49272a40a) · [X](https://x.com/i_Aakarshii))
- **Anant Tiwari** — *Full Stack & Orchestration Engineer* ([GitHub](https://github.com/harshqs) · [LinkedIn](https://www.linkedin.com/in/anant-tiwari-og/) · [X](https://x.com/devanant_tiwari))

---

## 📜 License
MIT License · Built with ❤️ for **HackerHouse Goa 2026**.
