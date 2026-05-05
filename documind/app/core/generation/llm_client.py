import httpx
from app.config import settings


def generate(prompt: str) -> str:
    url = f"{settings.ollama_base_url}/api/generate"
    payload = {"model": settings.ollama_model, "prompt": prompt, "stream": False}
    with httpx.Client(timeout=60.0) as client:
        response = client.post(url, json=payload)
        if not response.is_success:
            raise RuntimeError(f"Ollama error {response.status_code}: {response.text}")
        response.raise_for_status()
    return response.json()["response"].strip()
