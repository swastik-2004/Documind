from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from app.models.document import DocumentStatus


class UploadResponse(BaseModel):
    doc_id: UUID
    status: DocumentStatus
    message: str


class DocumentOut(BaseModel):
    id: UUID
    filename: str
    file_type: str
    status: DocumentStatus
    chunk_count: int
    uploaded_at: datetime
    processed_at: datetime | None = None

    model_config = {"from_attributes": True}
