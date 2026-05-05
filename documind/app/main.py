from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, documents, query
from app.api.middleware import RateLimitMiddleware

app = FastAPI(title="DocuMind", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.add_middleware(RateLimitMiddleware)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(query.router)


@app.get("/health")
def health():
    return {"status": "ok"}
