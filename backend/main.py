import os
import re
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func

from backend.database import Base, SessionLocal, engine
from backend.models import Document
from backend.worker import process_pdf


app = FastAPI(title="Enterprise RAG Pipeline")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


def _sanitize_filename(filename: str) -> str:
    base_name = os.path.basename(filename)
    sanitized = re.sub(r"[^A-Za-z0-9._-]+", "_", base_name).strip("._")
    return sanitized or "upload.bin"


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/v1/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    db = SessionLocal()
    try:
        document = Document(filename=file.filename, upload_status="Pending")
        db.add(document)
        db.commit()
        db.refresh(document)

        uploads_dir = Path(os.getenv("UPLOAD_DIR", "/app/uploads"))
        uploads_dir.mkdir(parents=True, exist_ok=True)
        safe_name = _sanitize_filename(file.filename)
        destination = uploads_dir / f"{document.id}_{safe_name}"

        contents = await file.read()
        destination.write_bytes(contents)

        process_pdf.delay(document.id)

        return {"id": document.id}
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        db.close()


@app.get("/api/v1/documents")
def list_documents():
    db = SessionLocal()
    try:
        documents = db.query(Document).order_by(Document.created_at.desc()).all()
        return [
            {
                "id": document.id,
                "filename": document.filename,
                "upload_status": document.upload_status,
                "created_at": document.created_at.isoformat() if document.created_at else None,
            }
            for document in documents
        ]
    finally:
        db.close()


@app.get("/api/v1/documents/{doc_id}")
def get_document(doc_id: int):
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == doc_id).first()
        if document is None:
            raise HTTPException(status_code=404, detail="Document not found")

        return {
            "id": document.id,
            "filename": document.filename,
            "upload_status": document.upload_status,
            "created_at": document.created_at.isoformat() if document.created_at else None,
        }
    finally:
        db.close()


@app.get("/api/v1/summary")
def documents_summary():
    db = SessionLocal()
    try:
        grouped = (
            db.query(Document.upload_status, func.count(Document.id))
            .group_by(Document.upload_status)
            .all()
        )

        summary = {"Pending": 0, "Processing": 0, "Completed": 0}
        for status, count in grouped:
            summary[status] = int(count)

        summary["Total"] = sum(summary.values())
        return summary
    finally:
        db.close()