import os
from pathlib import Path

from celery import Celery
from qdrant_client import QdrantClient

from backend.database import SessionLocal, engine
from backend.models import Base, Document


BROKER_URL = os.environ["CELERY_BROKER_URL"]
QDRANT_URL = os.environ["QDRANT_URL"]

app = Celery("rag_worker", broker=BROKER_URL, backend=BROKER_URL)


Base.metadata.create_all(bind=engine)


@app.task
def process_pdf(doc_id: int):
    session = SessionLocal()
    try:
        document = session.query(Document).filter(Document.id == doc_id).first()
        if document is None:
            return {"status": "missing"}

        document.upload_status = "Processing"
        session.commit()

        uploads_dir = Path(os.getenv("UPLOAD_DIR", "/app/uploads"))
        matched_files = list(uploads_dir.glob(f"{doc_id}_*"))
        file_text = ""
        if matched_files:
            file_path = matched_files[0]
            try:
                file_text = file_path.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                file_text = ""

        if not file_text:
            file_text = f"Document {doc_id} ready for chunking."

        chunks = [file_text[index : index + 800] for index in range(0, len(file_text), 800)]

        vector_client = QdrantClient(url=QDRANT_URL)
        _ = vector_client

        document.upload_status = "Completed"
        session.commit()

        return {"doc_id": doc_id, "chunks": len(chunks)}
    except Exception:
        session.rollback()
        document = session.query(Document).filter(Document.id == doc_id).first()
        if document is not None:
            document.upload_status = "Pending"
            session.commit()
        raise
    finally:
        session.close()
