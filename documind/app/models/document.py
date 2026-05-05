import uuid
import enum
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class DocumentStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    ready = "ready"
    failed = "failed"


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.pending)
    chunk_count = Column(Integer, default=0)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="documents")
    chunks = relationship("Chunk", back_populates="document")
