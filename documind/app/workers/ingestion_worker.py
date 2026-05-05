import numpy as np
from datetime import datetime, timezone
from celery import Celery
from sqlalchemy.orm import Session
from app.config import settings
from app.database import SessionLocal
from app.models.document import Document, DocumentStatus
from app.models.chunk import Chunk
from app.core.ingestion.parser import parse_pdf, parse_docx
from app.core.ingestion.chunker import chunk_text
from app.core.ingestion.embedder import embed_chunks
from app.core.retrieval.faiss_store import add_vectors

celery_app = Celery("documind", broker=settings.redis_url, backend=settings.redis_url)


@celery_app.task(bind=True, max_retries=3)
def ingest_document(self, doc_id: str, file_path: str, user_id: str):
    db: Session = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            return

        doc.status = DocumentStatus.processing
        db.commit()

        ext = file_path.rsplit(".", 1)[-1].lower()
        raw_text = parse_pdf(file_path) if ext == "pdf" else parse_docx(file_path)
        chunks = chunk_text(raw_text)
        vectors = embed_chunks(chunks)

        chunk_ids = []
        for i, (text, vec) in enumerate(zip(chunks, vectors)):
            chunk = Chunk(document_id=doc_id, chunk_index=i, text=text, embedding_dim=vec.shape[0])
            db.add(chunk)
            db.flush()
            chunk_ids.append(str(chunk.id))

        add_vectors(user_id, np.array(vectors), chunk_ids)

        doc.status = DocumentStatus.ready
        doc.chunk_count = len(chunks)
        doc.processed_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as exc:
        db.rollback()
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = DocumentStatus.failed
            db.commit()
        raise self.retry(exc=exc, countdown=5)
    finally:
        db.close()
