import numpy as np
from sentence_transformers import SentenceTransformer
from app.config import settings

_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.embedding_model)
    return _model


def embed_chunks(chunks: list[str]) -> np.ndarray:
    return _get_model().encode(chunks, convert_to_numpy=True, show_progress_bar=False)


def embed_query(query: str) -> np.ndarray:
    return _get_model().encode([query], convert_to_numpy=True, show_progress_bar=False)[0]
