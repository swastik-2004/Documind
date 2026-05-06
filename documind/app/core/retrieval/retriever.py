import uuid
from sqlalchemy.orm import Session
from app.core.ingestion.embedder import embed_query
from app.core.retrieval.faiss_store import search
from app.core.retrieval.reranker import rerank
from app.models.chunk import Chunk


def retrieve_chunks(user_id: str, question: str, db: Session, k: int = 5) -> list[str]:
    query_vec = embed_query(question)
    candidates = search(user_id, query_vec, k=k*3)
    if not candidates:
        return []
    uuids = [uuid.UUID(cid) for cid in candidates]
    chunks = db.query(Chunk).filter(Chunk.id.in_(uuids)).all()
    id_to_text = {str(c.id): c.text for c in chunks}
    texts = [id_to_text[cid] for cid in candidates if cid in id_to_text]
    return rerank(question, texts, top_k=k)

