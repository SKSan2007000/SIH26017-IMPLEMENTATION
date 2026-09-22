from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.db.database import Base


class Stakeholder(Base):
    __tablename__ = "stakeholders"

    id = Column(String, primary_key=True, index=True)
    ref = Column(String, nullable=False, index=True)  # e.g. "DEMO OWNER-024"
    name = Column(String, nullable=True)  # fictional demo label
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    parcel_id = Column(String, nullable=False)  # primary parcel
    parcel_ids = Column(JSON, default=list)  # all associated parcels
    contact_ref = Column(String, nullable=True)  # fictional demo contact
    status = Column(String, default="Pending")
    response_status = Column(String, default="PENDING")
    notification_status = Column(String, default="NOT SENT")
    documents_complete = Column(Boolean, default=False)
    documents_count = Column(Integer, default=0)
    documents_required = Column(Integer, default=4)
    compensation_status = Column(String, default="Not Initiated")
    last_contact = Column(String, nullable=True)
    preferred_language = Column(String, default="Tamil")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="stakeholders")
