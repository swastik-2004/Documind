import uuid
from sqlalchemy.orm import Session
from app.core.ingestion.embedder import embed_query
from app.core.retrieval.faiss_store import search
from app.models.chunk import Chunk


def retrieve_chunks(user_id: str, question: str, db: Session, k: int = 5) -> list[str]:
    query_vec = embed_query(question)
    chunk_ids = search(user_id, query_vec, k=k)
    if not chunk_ids:
        return []
    uuids = [uuid.UUID(cid) for cid in chunk_ids]
    chunks = db.query(Chunk).filter(Chunk.id.in_(uuids)).all()
    id_to_text = {str(c.id): c.text for c in chunks}
    return [id_to_text[cid] for cid in chunk_ids if cid in id_to_text]
