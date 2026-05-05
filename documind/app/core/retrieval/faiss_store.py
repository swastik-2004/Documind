import os
import numpy as np
import faiss
from app.config import settings


def _index_path(user_id: str) -> str:
    return os.path.join(settings.faiss_index_dir, user_id, "index.faiss")


def _map_path(user_id: str) -> str:
    return os.path.join(settings.faiss_index_dir, user_id, "id_map.npy")


def _ensure_dir(user_id: str):
    os.makedirs(os.path.dirname(_index_path(user_id)), exist_ok=True)


def _load_or_create(user_id: str) -> tuple[faiss.IndexFlatL2, list]:
    ipath = _index_path(user_id)
    mpath = _map_path(user_id)
    if os.path.exists(ipath):
        index = faiss.read_index(ipath)
        id_map = list(np.load(mpath, allow_pickle=True))
    else:
        index = faiss.IndexFlatL2(384)
        id_map = []
    return index, id_map


def _save(user_id: str, index: faiss.IndexFlatL2, id_map: list):
    _ensure_dir(user_id)
    faiss.write_index(index, _index_path(user_id))
    np.save(_map_path(user_id), np.array(id_map, dtype=object))


def add_vectors(user_id: str, vectors: np.ndarray, chunk_ids: list[str]):
    index, id_map = _load_or_create(user_id)
    index.add(vectors.astype(np.float32))
    id_map.extend(chunk_ids)
    _save(user_id, index, id_map)


def search(user_id: str, query_vector: np.ndarray, k: int = 5) -> list[str]:
    if not os.path.exists(_index_path(user_id)):
        return []
    index, id_map = _load_or_create(user_id)
    if index.ntotal == 0:
        return []
    k = min(k, index.ntotal)
    _, indices = index.search(query_vector.reshape(1, -1).astype(np.float32), k)
    return [id_map[i] for i in indices[0] if i != -1]


def delete_index(user_id: str):
    for path in (_index_path(user_id), _map_path(user_id)):
        if os.path.exists(path):
            os.remove(path)
