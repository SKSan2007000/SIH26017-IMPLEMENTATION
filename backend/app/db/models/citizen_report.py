from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.db.database import Base


class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    location = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, default="Boundary Grievance")
    report_type = Column(String, default="Boundary Grievance")
    citizen_ref = Column(String, nullable=True, index=True)  # DEMO Citizen Reference
    has_photo = Column(Boolean, default=False)
    has_video = Column(Boolean, default=False)
    status = Column(String, default="Submitted")  # 'Submitted' | 'Under Review' | 'Verified' | 'Considered' | 'Planned' | 'Rejected'
    submitted_at = Column(String, nullable=False)
    response_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="citizen_reports")
