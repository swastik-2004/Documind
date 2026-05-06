import torch
from sentence_transformers import CrossEncoder
from app.config import settings

_reranker: CrossEncoder | None= None

def _get_reranker() -> CrossEncoder:
    global _reranker
    if _reranker is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _reranker = CrossEncoder(settings.reranker_model, device=device)
    return _reranker

def rerank(query:str, texts: list[str], top_k:int)->list[str]:
    if not texts or len(texts)<=top_k:
        return texts
    model= _get_reranker()
    pairs=[[query,text] for text in texts]
    scores:list[float] = model.predict(pairs).tolist()
    ranked = sorted(zip(scores, texts), key=lambda x: x[0], reverse=True)
    return [text for _, text in ranked[:top_k]]