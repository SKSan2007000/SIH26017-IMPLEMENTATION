from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, JSON
from backend.app.db.database import Base


class InterventionRecord(Base):
    __tablename__ = "intervention_records"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    action_title = Column(String, nullable=False)
    action_category = Column(String, nullable=False)  # 'Legal & Title', 'Documentation', 'Compensation', 'Approval', etc.
    risk_before = Column(Integer, nullable=False)
    risk_after = Column(Integer, nullable=False)
    delay_before_months = Column(Float, nullable=False)
    delay_after_months = Column(Float, nullable=False)
    improvement_points = Column(Integer, nullable=False)  # risk_before - risk_after
    officer_id = Column(String, nullable=True)
    officer_name = Column(String, nullable=True)
    status = Column(String, default="COMPLETED")  # 'PENDING', 'IN_PROGRESS', 'COMPLETED'
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
