# DocuMind

A full-stack RAG (Retrieval-Augmented Generation) application that lets you upload documents and ask AI-powered questions about them. Answers are grounded in your actual document content using local LLM inference — no data leaves your machine.

## Features

- **Document upload** — PDF and DOCX support with async background processing
- **RAG queries** — semantic search over your documents, answered by a local LLM
- **Multi-document search** — queries run across all your ready documents at once
- **Query history** — every question and answer is stored and accessible
- **JWT authentication** — per-user document isolation with access + refresh tokens
- **Fully local** — embeddings and LLM inference run on your machine via Ollama

## Tech Stack

**Backend**
- FastAPI — REST API
- PostgreSQL — document metadata, users, query history
- Redis + Celery — async document ingestion queue
- FAISS — vector similarity search
- sentence-transformers (`all-MiniLM-L6-v2`) — document embeddings
- Ollama (Mistral 7B Instruct) — answer generation
- Alembic — database migrations

**Frontend**
- React 18 + Vite + TypeScript
- TailwindCSS
- React Router v6
- Axios with automatic JWT refresh

## Architecture

```
Upload → Celery Worker → Parse → Chunk → Embed → FAISS index
Query  → Embed question → FAISS search → Retrieve chunks → Ollama → Answer
```

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

## Project Structure

```
Documind/
├── documind/                  # Backend
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/        # auth, documents, query
│   │   ├── core/
│   │   │   ├── ingestion/     # parser, chunker, embedder
│   │   │   ├── retrieval/     # FAISS store + retriever
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
