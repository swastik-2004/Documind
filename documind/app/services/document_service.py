import os
import shutil
from uuid import UUID
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.config import settings
from app.models.document import Document, DocumentStatus

UPLOAD_DIR = "./uploads"


def _validate_file(file: UploadFile):
    ext = file.filename.rsplit(".", 1)[-1].lower()
    allowed = settings.allowed_file_types.split(",")
    if ext not in allowed:
        raise HTTPException(400, f"File type .{ext} not allowed")


def save_upload(file: UploadFile, user_id: str, db: Session) -> Document:
    _validate_file(file)
    ext = file.filename.rsplit(".", 1)[-1].lower()
    doc = Document(user_id=user_id, filename=file.filename, file_type=ext)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    dest_dir = os.path.join(UPLOAD_DIR, user_id)
    os.makedirs(dest_dir, exist_ok=True)
    dest = os.path.join(dest_dir, f"{doc.id}.{ext}")
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return doc


def get_user_documents(db: Session, user_id: str) -> list[Document]:
    return db.query(Document).filter(Document.user_id == user_id).all()


def get_document(db: Session, doc_id: UUID, user_id: str) -> Document:
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    return doc


def delete_document(db: Session, doc_id: UUID, user_id: str):
    doc = get_document(db, doc_id, user_id)
    db.delete(doc)
    db.commit()
