from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    secret_key: str
    access_token_expire_minutes: int = 30
    database_url: str
    redis_url: str
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "mistral:7b-instruct"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    reranker_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    faiss_index_dir: str = "./faiss_indexes"
    max_file_size_mb: int = 20
    allowed_file_types: str = "pdf,docx"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
