import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base
from app.dependencies import get_db

TEST_DB_URL = "sqlite:///./test_query.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def auth_client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        c.post("/auth/register", json={"email": "q@example.com", "password": "pass"})
        r = c.post("/auth/login", json={"email": "q@example.com", "password": "pass"})
        token = r.json()["access_token"]
        c.headers.update({"Authorization": f"Bearer {token}"})
        yield c
    app.dependency_overrides.clear()


def test_query_no_documents(auth_client):
    with patch("app.services.query_service._redis") as mock_redis:
        mock_redis.get.return_value = None
        mock_redis.setex = MagicMock()
        r = auth_client.post("/query/", json={"question": "What is this about?"})
    assert r.status_code == 200
    data = r.json()
    assert "answer" in data
    assert "I don't have enough information" in data["answer"]


def test_query_history_empty(auth_client):
    r = auth_client.get("/query/history")
    assert r.status_code == 200
    assert r.json() == []
