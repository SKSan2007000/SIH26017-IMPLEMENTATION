from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, JSON
from backend.app.db.database import Base


class ContractorWorkPackage(Base):
    __tablename__ = "contractor_work_packages"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    contractor_name = Column(String, nullable=False, index=True)
    contractor_ref = Column(String, nullable=False)
    package_name = Column(String, nullable=False)  # e.g., "Package 1: Earthwork & Viaduct Foundations"
    planned_progress_pct = Column(Float, default=0.0)
    actual_progress_pct = Column(Float, default=0.0)
    variance_pct = Column(Float, default=0.0)  # actual - planned (negative = delayed)
    status = Column(String, default="IN_PROGRESS")  # 'ASSIGNED', 'IN_PROGRESS', 'MILESTONE_REACHED', 'DELAYED', 'COMPLETED'
    delay_risk = Column(String, default="LOW")  # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    assigned_date = Column(String, nullable=True)
    target_date = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class ContractorProgressLog(Base):
    __tablename__ = "contractor_progress_logs"

    id = Column(String, primary_key=True, index=True)
    package_id = Column(String, ForeignKey("contractor_work_packages.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String, nullable=False, index=True)
    reported_progress_pct = Column(Float, nullable=False)
    photo_evidence_ref = Column(String, nullable=True)
    video_evidence_ref = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    verified_by_officer_id = Column(String, nullable=True)
    verification_status = Column(String, default="SUBMITTED")  # 'SUBMITTED', 'VERIFIED', 'REWORK_REQUESTED'
    reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    verified_at = Column(DateTime, nullable=True)
