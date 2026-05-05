"""Run with: python -m scripts.seed_db from the documind/ directory."""
from app.database import SessionLocal, engine
from app.models import User, Document, DocumentStatus
from app.database import Base
from app.services.auth_service import hash_password

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "dev@example.com").first()
        if existing:
            print("Seed data already present.")
            return

        user = User(email="dev@example.com", hashed_password=hash_password("devpassword"))
        db.add(user)
        db.commit()
        db.refresh(user)

        doc = Document(
            user_id=user.id,
            filename="sample.pdf",
            file_type="pdf",
            status=DocumentStatus.ready,
            chunk_count=0,
        )
        db.add(doc)
        db.commit()

        print(f"Seeded user: dev@example.com / devpassword")
        print(f"Seeded document id: {doc.id}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
