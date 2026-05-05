from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.query import QueryRequest, QueryResponse, QueryHistoryOut
from app.services.query_service import answer_question, get_history

router = APIRouter(prefix="/query", tags=["query"])


@router.post("/", response_model=QueryResponse)
def query(body: QueryRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = answer_question(str(current_user.id), body.question, db, k=body.k)
    return QueryResponse(**result)


@router.get("/history", response_model=list[QueryHistoryOut])
def history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_history(str(current_user.id), db)
