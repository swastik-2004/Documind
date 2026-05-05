import time
import json
import redis
from sqlalchemy.orm import Session
from app.config import settings
from app.models.query_history import QueryHistory
from app.models.chunk import Chunk
from app.core.retrieval.retriever import retrieve_chunks
from app.core.generation.llm_client import generate
from app.core.generation.prompt import build_rag_prompt

_redis = redis.from_url(settings.redis_url)
CACHE_TTL = 300


def _cache_key(user_id: str, question: str) -> str:
    return f"query:{user_id}:{hash(question)}"


def answer_question(user_id: str, question: str, db: Session, k: int = 5) -> dict:
    cache_key = _cache_key(user_id, question)
    cached = _redis.get(cache_key)
    if cached:
        return json.loads(cached)

    start = time.time()
    chunks = retrieve_chunks(user_id, question, db, k=k)
    if not chunks:
        answer = "I don't have enough information in the uploaded documents."
    else:
        prompt = build_rag_prompt(chunks, question)
        answer = generate(prompt)
    latency_ms = int((time.time() - start) * 1000)

    source_doc_ids = []
    if chunks:
        rows = db.query(Chunk).filter(Chunk.text.in_(set(chunks))).all()
        source_doc_ids = list({str(r.document_id) for r in rows})

    record = QueryHistory(
        user_id=user_id,
        question=question,
        answer=answer,
        source_doc_ids=source_doc_ids,
        latency_ms=latency_ms,
    )
    db.add(record)
    db.commit()

    result = {"answer": answer, "source_doc_ids": source_doc_ids, "latency_ms": latency_ms}
    _redis.setex(cache_key, CACHE_TTL, json.dumps(result))
    return result


def get_history(user_id: str, db: Session) -> list[QueryHistory]:
    return (
        db.query(QueryHistory)
        .filter(QueryHistory.user_id == user_id)
        .order_by(QueryHistory.created_at.desc())
        .all()
    )
