from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class QueryRequest(BaseModel):
    question: str
    k: int = 5


class QueryResponse(BaseModel):
    answer: str
    source_doc_ids: list[UUID]
    latency_ms: int


class QueryHistoryOut(BaseModel):
    id: UUID
    question: str
    answer: str
    latency_ms: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
