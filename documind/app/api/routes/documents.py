import os
from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.document import DocumentStatus
from app.schemas.document import UploadResponse, DocumentOut
from app.services.document_service import (
    save_upload,
    get_user_documents,
    get_document,
    delete_document,
)
from app.workers.ingestion_worker import ingest_document
from app.core.retrieval.faiss_store import delete_index

router = APIRouter(prefix="/documents", tags=["documents"])
UPLOAD_DIR = "./uploads"


@router.post("/upload", response_model=UploadResponse, status_code=202)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = save_upload(file, str(current_user.id), db)
    file_path = os.path.join(UPLOAD_DIR, str(current_user.id), f"{doc.id}.{doc.file_type}")
    ingest_document.delay(str(doc.id), file_path, str(current_user.id))
    return UploadResponse(doc_id=doc.id, status=DocumentStatus.pending, message="Document queued for processing")


@router.get("/", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_user_documents(db, str(current_user.id))


@router.get("/{doc_id}", response_model=DocumentOut)
def get_doc(doc_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_document(db, doc_id, str(current_user.id))


@router.delete("/{doc_id}", status_code=204)
def delete_doc(doc_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delete_document(db, doc_id, str(current_user.id))
    delete_index(str(current_user.id))
