import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base
from app.dependencies import get_db

TEST_DB_URL = "sqlite:///./test.db"
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
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_register(client):
    r = client.post("/auth/register", json={"email": "test@example.com", "password": "secret"})
    assert r.status_code == 201


def test_register_duplicate(client):
    client.post("/auth/register", json={"email": "test@example.com", "password": "secret"})
    r = client.post("/auth/register", json={"email": "test@example.com", "password": "secret"})
    assert r.status_code == 400


def test_login(client):
    client.post("/auth/register", json={"email": "test@example.com", "password": "secret"})
    r = client.post("/auth/login", json={"email": "test@example.com", "password": "secret"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_login_wrong_password(client):
    client.post("/auth/register", json={"email": "test@example.com", "password": "secret"})
    r = client.post("/auth/login", json={"email": "test@example.com", "password": "wrong"})
    assert r.status_code == 401


def test_protected_route_without_token(client):
    r = client.get("/documents/")
    assert r.status_code == 403
