# DocuMind — CLAUDE.md

AI-powered private document Q\&A API. No OpenAI dependency. Fully local inference. Built by Swastik Dasgupta | MSRIT AI\&ML, 6th Sem

---

## Project Overview

DocuMind is a RAG (Retrieval-Augmented Generation) backend API that allows companies or users to upload private documents and query them in natural language. Everything runs locally — no data leaves the machine. Built to demonstrate production-grade LLM engineering \+ SDE backend skills for 20 LPA+ placement.

**Core Flow:**

User uploads PDF/DOCX

  → Text extracted & chunked

    → Chunks embedded (sentence-transformers)

      → Stored in FAISS vector index \+ PostgreSQL metadata

        → User queries in natural language

          → Top-K chunks retrieved via FAISS

            → Local LLM (Ollama) generates grounded answer

              → Response returned via REST API

---

## Tech Stack

| Layer | Tool | Why |
| :---- | :---- | :---- |
| API Framework | FastAPI | Async, auto docs, production-ready |
| Embeddings | `sentence-transformers` (`all-MiniLM-L6-v2`) | Runs on 4GB VRAM, fast, good quality |
| Vector Store | FAISS | Local, no cloud dependency, fast ANN search |
| LLM | Ollama (`mistral` or `llama3.2`) | Fully offline, no API cost |
| Orchestration | LangChain | RAG pipeline, prompt management |
| Database | PostgreSQL | Document metadata, user sessions, chunk registry |
| Cache | Redis | Query result caching, session store |
| Async Jobs | Celery \+ Redis | Background ingestion pipeline |
| PDF Parsing | PyMuPDF (`fitz`) | Fast, handles complex PDFs |
| DOCX Parsing | `python-docx` | Word document support |
| Auth | JWT (via `python-jose`) | Bearer token auth |
| Containerization | Docker \+ Docker Compose | Full stack local deployment |
| Testing | pytest \+ httpx | API integration tests |
| Migrations | Alembic | PostgreSQL schema versioning |

---

## Project Structure

documind/

├── CLAUDE.md                  \# ← you are here

├── docker-compose.yml

├── .env.example

├── requirements.txt

│

├── app/

│   ├── main.py                \# FastAPI app entrypoint

│   ├── config.py              \# Settings via pydantic-settings

│   ├── dependencies.py        \# Shared DI (DB session, auth)

│   │

│   ├── api/

│   │   ├── routes/

│   │   │   ├── documents.py   \# Upload, list, delete documents

│   │   │   ├── query.py       \# Q\&A endpoint

│   │   │   └── auth.py        \# Register, login, token refresh

│   │   └── middleware.py      \# CORS, rate limiting

│   │

│   ├── core/

│   │   ├── ingestion/

│   │   │   ├── parser.py      \# PDF \+ DOCX text extraction

│   │   │   ├── chunker.py     \# Recursive text chunking logic

│   │   │   └── embedder.py    \# sentence-transformers wrapper

│   │   │

│   │   ├── retrieval/

│   │   │   ├── faiss\_store.py \# FAISS index CRUD operations

│   │   │   └── retriever.py   \# Top-K chunk retrieval logic

│   │   │

│   │   └── generation/

│   │       ├── llm\_client.py  \# Ollama API wrapper

│   │       └── prompt.py      \# RAG prompt templates

│   │

│   ├── models/

│   │   ├── document.py        \# SQLAlchemy ORM models

│   │   ├── chunk.py

│   │   └── user.py

│   │

│   ├── schemas/

│   │   ├── document.py        \# Pydantic request/response schemas

│   │   ├── query.py

│   │   └── auth.py

│   │

│   ├── services/

│   │   ├── document\_service.py

│   │   ├── query\_service.py

│   │   └── auth\_service.py

│   │

│   └── workers/

│       └── ingestion\_worker.py  \# Celery task: async doc ingestion

│

├── alembic/                   \# DB migrations

├── tests/

│   ├── test\_ingestion.py

│   ├── test\_query.py

│   └── test\_auth.py

│

└── scripts/

    └── seed\_db.py             \# Dev seed data

---

## API Endpoints

### Auth

| Method | Endpoint | Description |
| :---- | :---- | :---- |
| POST | `/auth/register` | Create user account |
| POST | `/auth/login` | Returns JWT access \+ refresh token |
| POST | `/auth/refresh` | Refresh access token |

### Documents

| Method | Endpoint | Description |
| :---- | :---- | :---- |
| POST | `/documents/upload` | Upload PDF or DOCX (triggers async ingestion) |
| GET | `/documents/` | List user's uploaded documents |
| GET | `/documents/{doc_id}` | Document metadata \+ ingestion status |
| DELETE | `/documents/{doc_id}` | Delete document \+ its FAISS chunks |

### Query

| Method | Endpoint | Description |
| :---- | :---- | :---- |
| POST | `/query/` | Ask a question, get a grounded answer |
| GET | `/query/history` | Past queries for the user |

### System

| Method | Endpoint | Description |
| :---- | :---- | :---- |
| GET | `/health` | Health check |
| GET | `/docs` | Auto-generated Swagger UI |

---

## Key Design Decisions

### Chunking Strategy

- **Method:** Recursive character text splitter  
- **Chunk size:** 512 tokens  
- **Overlap:** 64 tokens (prevents context loss at boundaries)  
- **Why not fixed-size?** Recursive splitting respects paragraph/sentence boundaries — better semantic coherence per chunk

### Embedding Model Choice

- **Model:** `all-MiniLM-L6-v2` (384-dim vectors)  
- **Why:** Runs entirely on CPU or 4GB VRAM GPU, 5x faster than large models, strong performance on retrieval benchmarks  
- **Alternative:** `bge-small-en-v1.5` if MiniLM underperforms on domain-specific docs

### FAISS Index Type

- **Index:** `IndexFlatL2` for dev, `IndexIVFFlat` for prod (faster at scale)  
- **Persistence:** FAISS index saved to disk per user namespace (`/faiss_indexes/{user_id}/`)  
- **Why not Pinecone/Weaviate?** No vendor lock-in, fully offline, simpler ops for this scale

### LLM via Ollama

- **Default model:** `mistral:7b-instruct` (good quality, fits 4GB VRAM with quantization)  
- **Fallback:** `llama3.2:3b` if VRAM constrained  
- **Ollama base URL:** `http://localhost:11434` (configurable via `.env`)

### Async Ingestion

- Document upload returns immediately with `{ doc_id, status: "processing" }`  
- Celery worker handles: parse → chunk → embed → store (can take 10–60s for large docs)  
- Status polling via `GET /documents/{doc_id}`

### RAG Prompt Template

You are a precise document assistant. Answer the question using ONLY the context below.

If the answer is not in the context, say "I don't have enough information in the uploaded documents."

Context:

{retrieved\_chunks}

Question: {user\_query}

Answer:

---

## Database Schema (PostgreSQL)

\-- Users

users: id, email, hashed\_password, created\_at

\-- Documents

documents: id, user\_id (FK), filename, file\_type, status 

           (pending|processing|ready|failed), chunk\_count, 

           uploaded\_at, processed\_at

\-- Chunks

chunks: id, document\_id (FK), chunk\_index, text, 

        embedding\_dim, faiss\_index\_id, created\_at

\-- Query History

queries: id, user\_id (FK), question, answer, 

         source\_doc\_ids (array), latency\_ms, created\_at

---

## Environment Variables (`.env`)

\# App

APP\_ENV=development

SECRET\_KEY=your-jwt-secret-key

ACCESS\_TOKEN\_EXPIRE\_MINUTES=30

\# Database

DATABASE\_URL=postgresql://postgres:password@localhost:5432/documind

\# Redis

REDIS\_URL=redis://localhost:6379/0

\# Ollama

OLLAMA\_BASE\_URL=http://localhost:11434

OLLAMA\_MODEL=mistral:7b-instruct

\# Embeddings

EMBEDDING\_MODEL=sentence-transformers/all-MiniLM-L6-v2

\# FAISS

FAISS\_INDEX\_DIR=./faiss\_indexes

\# File Upload

MAX\_FILE\_SIZE\_MB=20

ALLOWED\_FILE\_TYPES=pdf,docx

---

## Local Setup

\# 1\. Clone and create venv

python \-m venv venv && source venv/bin/activate

pip install \-r requirements.txt

\# 2\. Start Postgres \+ Redis via Docker

docker-compose up \-d postgres redis

\# 3\. Run DB migrations

alembic upgrade head

\# 4\. Start Ollama and pull model

ollama serve

ollama pull mistral:7b-instruct

\# 5\. Start Celery worker

celery \-A app.workers.ingestion\_worker worker \--loglevel=info

\# 6\. Start FastAPI

uvicorn app.main:app \--reload \--port 8000

---

## Testing

\# Run all tests

pytest tests/ \-v

\# Test just the ingestion pipeline

pytest tests/test\_ingestion.py \-v

\# Test query endpoint

pytest tests/test\_query.py \-v

---

## Performance Targets

| Metric | Target |
| :---- | :---- |
| Document ingestion (5-page PDF) | \< 15s |
| Query end-to-end latency | \< 3s (cached), \< 8s (cold) |
| FAISS retrieval (10K chunks) | \< 50ms |
| API uptime | 99%+ in local Docker |

---

## Known Constraints & TODOs

- [ ] Currently single-tenant FAISS (one index per user). Could unify with namespace filtering for multi-tenant.  
- [ ] No streaming response yet — Ollama supports it, endpoint can be upgraded to SSE  
- [ ] Image-heavy PDFs not supported (OCR via `pytesseract` planned)  
- [ ] No document update — delete \+ re-upload for now  
- [ ] Rate limiting is basic (Redis counter) — upgrade to sliding window if needed

---

## Interview Talking Points

When asked about this project, be ready to explain:

1. **Why RAG over fine-tuning?** — RAG is cheaper, updatable at runtime, and doesn't hallucinate facts from training. Fine-tuning doesn't add new knowledge, it changes behaviour.  
2. **Why FAISS over a vector DB?** — No vendor dependency, runs fully offline, IndexIVFFlat gives sub-millisecond ANN search up to \~1M vectors.  
3. **Chunking trade-offs** — Larger chunks \= more context but more noise. Smaller chunks \= precise retrieval but may lack context. Overlap prevents boundary artifacts.  
4. **Why Celery for ingestion?** — Upload endpoint must return fast (\<200ms). Embedding 50 chunks takes 5-30s. Async job queue decouples I/O-bound upload from CPU/GPU-bound embedding.  
5. **Security** — JWT auth, user-namespaced FAISS indexes (users can't query each other's docs), file type validation, size limits.

---

*Last updated: April 2026*  
