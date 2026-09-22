from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.db.database import Base


class FieldVerification(Base):
    __tablename__ = "field_verifications"

    id = Column(String, primary_key=True, index=True)
    parcel_id = Column(String, ForeignKey("parcels.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    officer_ref = Column(String, nullable=False)
    officer_name = Column(String, nullable=True)
    location = Column(String, nullable=False)
    priority = Column(String, default="Medium")  # 'Low' | 'Medium' | 'High' | 'Critical'
    deadline = Column(String, nullable=False)
    status = Column(String, default="Assigned")  # 'Assigned' | 'In Progress' | 'Awaiting Supervisor Verification' | 'Verified' | 'Revisit Requested'
    verification_status = Column(String, default="PENDING")  # 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED'
    gps_captured = Column(Boolean, default=True)
    gps_coordinates = Column(JSON, nullable=True)  # [lon, lat]
    photos_count = Column(Integer, default=0)
    videos_count = Column(Integer, default=0)
    photo_evidence_ref = Column(String, nullable=True)
    video_evidence_ref = Column(String, nullable=True)
    observation = Column(Text, nullable=True)
    supervisor_decision = Column(String, nullable=True)  # 'APPROVED' | 'REJECTED' | 'REVISIT_REQUESTED' | 'PENDING'
    assigned_date = Column(String, nullable=True)
    completed_date = Column(String, nullable=True)
    
    # Phase 4 SLA & Escalation Tracking
    task_created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    accepted_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    deadline_at = Column(DateTime, nullable=True)
    response_time_seconds = Column(Float, nullable=True)
    completion_time_seconds = Column(Float, nullable=True)
    sla_status = Column(String, default="ON_TIME")  # 'ON_TIME' | 'NEAR_BREACH' | 'BREACHED'
    sla_seconds_allowed = Column(Integer, default=300)  # default 300s (or 45s demo)
    escalation_level = Column(String, default="NONE")  # 'NONE' | 'SUPERVISOR' | 'DISTRICT_OFFICER' | 'PROJECT_HEAD'
    escalated_at = Column(DateTime, nullable=True)
    escalation_reason = Column(String, nullable=True)
    
    # Intelligent Local Officer Allocation Metadata
    allocation_reason = Column(String, nullable=True)
    officer_zone = Column(String, nullable=True)
    officer_district = Column(String, nullable=True)
    proximity_km = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    parcel = relationship("Parcel", back_populates="field_verifications")
    project = relationship("Project", back_populates="field_verifications")
