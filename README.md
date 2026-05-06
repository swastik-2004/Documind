# DocuMind

A full-stack RAG (Retrieval-Augmented Generation) application that lets you upload documents and ask AI-powered questions about them. Answers are grounded in your actual document content using local LLM inference — no data leaves your machine.

## Features

- **Document upload** — PDF and DOCX support with async background processing
- **Two-stage retrieval** — bi-encoder FAISS search followed by cross-encoder reranking
- **Multi-document search** — queries run across all your ready documents at once
- **Query history** — every question and answer is stored and accessible
- **JWT authentication** — per-user document isolation with access + refresh tokens
- **Fully local** — embeddings, reranker, and LLM inference all run on your machine

## Tech Stack

**Backend**
- FastAPI — REST API
- PostgreSQL — document metadata, users, query history
- Redis + Celery — async document ingestion queue
- FAISS (`IndexFlatL2`) — exact L2 vector search
- sentence-transformers (`all-MiniLM-L6-v2`) — bi-encoder embeddings (384-dim)
- sentence-transformers (`ms-marco-MiniLM-L-6-v2`) — cross-encoder reranker (PyTorch)
- Ollama (Mistral 7B Instruct) — answer generation
- Alembic — database migrations

**Frontend**
- React 18 + Vite + TypeScript
- TailwindCSS
- React Router v6
- Axios with automatic JWT refresh

## Architecture

```
Upload → Celery Worker → Parse → Chunk (512 chars, 64 overlap) → Embed (384-dim) → FAISS index

Query  → Embed question
       → FAISS search (top 3k candidates, bi-encoder)
       → Cross-encoder rerank (PyTorch, ms-marco)
       → Top k chunks → Ollama prompt → Answer
```

### Chunking Strategy

Documents are split using `RecursiveCharacterTextSplitter`:

| Parameter | Value | Reason |
|---|---|---|
| `chunk_size` | 512 chars | Fits within MiniLM-L6-v2's 256-token context without truncation |
| `chunk_overlap` | 64 chars | ~12% overlap preserves sentence continuity across boundaries |
| `length_function` | `len` | Character count, consistent across languages |

The recursive splitter tries to split on `\n\n`, then `\n`, then spaces, then characters — preserving semantic boundaries wherever possible.

### Two-Stage Retrieval

| Stage | Model | Speed | Accuracy |
|---|---|---|---|
| Bi-encoder (FAISS) | `all-MiniLM-L6-v2` | Fast — encodes query once, dot-product over index | Approximate |
| Cross-encoder (reranker) | `ms-marco-MiniLM-L-6-v2` | Slower — scores every (query, chunk) pair jointly | High |

FAISS retrieves `k × 3` candidates; the cross-encoder reranks them and returns the top `k`. This is the standard two-stage retrieval pattern used in production search systems.

## Prerequisites

- Python 3.10+
- Node.js 18+
- Docker + Docker Compose (for PostgreSQL and Redis)
- [Ollama](https://ollama.ai) with Mistral 7B pulled:
  ```bash
  ollama pull mistral:7b-instruct
  ```

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/swastik-2004/Documind.git
cd Documind
```

### 2. Backend

```bash
cd documind

# Copy and fill in environment variables
cp .env.example .env

# Start PostgreSQL and Redis
docker compose up -d

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the API server
uvicorn app.main:app --reload --port 8000

# In a separate terminal, start the Celery worker
celery -A app.workers.ingestion_worker worker --loglevel=info
```

### 3. Frontend

```bash
cd documind-ui
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment Variables

Create `documind/.env` from `.env.example`:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `SECRET_KEY` | JWT signing secret | — |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `7` |
| `OLLAMA_BASE_URL` | Ollama API URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | Model name | `mistral:7b-instruct` |
| `RERANKER_MODEL` | Cross-encoder model | `cross-encoder/ms-marco-MiniLM-L-6-v2` |
| `UPLOAD_DIR` | Directory for uploaded files | `uploads/` |
| `FAISS_INDEX_DIR` | Directory for FAISS indexes | `faiss_indexes/` |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/login` | Get JWT tokens |
| `POST` | `/auth/refresh` | Refresh access token |
| `GET` | `/documents/` | List user's documents |
| `POST` | `/documents/upload` | Upload a document |
| `GET` | `/documents/{id}` | Get document details |
| `DELETE` | `/documents/{id}` | Delete a document |
| `POST` | `/query/` | Ask a question |
| `GET` | `/query/history` | Get query history |

## Benchmarks

Tested on a single PDF document (~2 pages), Mistral 7B Instruct via Ollama, CPU cross-encoder reranking, RTX GPU for Ollama inference.

### Query latency

| Query type | Example | Latency |
|---|---|---|
| Simple | "What is this document about?" | 27.3s (cold) |
| Specific fact | "What accuracy did the model achieve?" | 5.8s |
| Complex | "Summarise all the projects" | 6.3s |

Latency is almost entirely Ollama generation time. Retrieval breakdown:

| Stage | Component | Time |
|---|---|---|
| Embedding | `all-MiniLM-L6-v2` (384-dim) | ~50ms |
| FAISS search | `IndexFlatL2`, exact L2, k×3 candidates | <10ms |
| Cross-encoder rerank | `ms-marco-MiniLM-L-6-v2`, CPU | ~200–400ms |
| Generation | Mistral 7B Instruct via Ollama | 5–25s |

First query after server start is slower (~27s) due to Ollama model loading into VRAM. Subsequent queries are warm (~5–8s for short answers).

### Document processing

| Stage | Time (2-page PDF) |
|---|---|
| Parse + chunk | <1s |
| Embed all chunks | 1–3s |
| FAISS index write | <1s |
| **Total ingestion** | **~5s** |

## Project Structure

```
Documind/
├── documind/                  # Backend
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/        # auth, documents, query
│   │   ├── core/
│   │   │   ├── ingestion/     # parser, chunker, embedder
│   │   │   ├── retrieval/     # FAISS store, retriever, cross-encoder reranker
│   │   │   └── generation/    # Ollama client + prompt builder
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── services/          # Business logic
│   │   └── workers/           # Celery ingestion worker
│   ├── alembic/               # Database migrations
│   ├── tests/
│   ├── docker-compose.yml
│   └── requirements.txt
└── documind-ui/               # Frontend
    └── src/
        ├── api/               # Axios API client
        ├── components/        # Navbar, UploadZone, DocumentCard, etc.
        ├── context/           # Auth context + JWT state
        ├── pages/             # Login, Register, Dashboard, QueryPage
        └── types/             # TypeScript types
```

## Running Tests

```bash
cd documind
pytest tests/
```
