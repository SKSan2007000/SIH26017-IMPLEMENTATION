from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.db.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True)
    parcel_id = Column(String, ForeignKey("parcels.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    stakeholder_id = Column(String, nullable=True, index=True)
    type = Column(String, default="Ownership")  # 'Ownership' | 'Survey' | 'Compensation' | 'Legal' | 'Approval' | 'Project'
    status = Column(String, default="Uploaded")  # 'Uploaded' | 'Processing' | 'Verified' | 'Rejected' | 'Missing'
    verification_status = Column(String, default="PENDING")  # 'PENDING' | 'VERIFIED' | 'REJECTED'
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    file_size = Column(String, default="2.4 MB")
    ocr = Column(JSON, nullable=True)  # {extractedFields: dict, confidencePct: float, humanVerified: bool}

    parcel = relationship("Parcel", back_populates="documents")
    project = relationship("Project", back_populates="documents")
