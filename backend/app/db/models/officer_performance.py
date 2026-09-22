from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from backend.app.db.database import Base


class OfficerProfile(Base):
    __tablename__ = "officer_profiles"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=True, index=True)
    name = Column(String, nullable=False, index=True)
    role = Column(String, default="FIELD_OFFICER")
    district = Column(String, nullable=False, index=True)
    zone = Column(String, default="South Zone")
    total_points = Column(Integer, default=100)
    completed_tasks = Column(Integer, default=0)
    on_time_tasks = Column(Integer, default=0)
    avg_response_time_sec = Column(Float, default=120.0)
    verification_accuracy_pct = Column(Float, default=95.0)
    sla_compliance_pct = Column(Float, default=92.0)
    is_available = Column(Boolean, default=True)
    current_workload = Column(Integer, default=0)
    active_district = Column(String, nullable=True)
    points_tier = Column(String, default="Gold")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class OfficerScore(Base):
    __tablename__ = "officer_scores"

    id = Column(String, primary_key=True, index=True)
    officer_id = Column(String, ForeignKey("officer_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(String, nullable=True, index=True)
    project_id = Column(String, nullable=True, index=True)
    action_type = Column(String, nullable=False)  # 'ON_TIME_VERIFICATION', 'EARLY_COMPLETION', 'GPS_ACCURACY', etc.
    points = Column(Integer, nullable=False)  # positive or negative delta
    reason = Column(String, nullable=False)
    awarded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
