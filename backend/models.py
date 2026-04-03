from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from backend.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    upload_status = Column(String(50), nullable=False, default="Pending")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
