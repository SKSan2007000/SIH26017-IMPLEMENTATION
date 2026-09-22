from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from backend.app.db.database import Base


class GovernmentAlert(Base):
    __tablename__ = "government_alerts"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    project_name = Column(String, nullable=False)
    risk_score = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)
    affected_area = Column(String, nullable=False)
    affected_parcels_count = Column(Integer, default=0)
    affected_population = Column(Integer, default=0)
    recommended_action = Column(Text, nullable=False)
    responsible_authority = Column(String, default="District Revenue Administration & NHAI Special Cell")
    severity = Column(String, default="CRITICAL")  # 'EMERGENCY' | 'CRITICAL' | 'HIGH'
    status = Column(String, default="ACTIVE")  # 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'
    demo_flag = Column(String, default="DEMO GOVERNMENT ALERT")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    acknowledged_at = Column(DateTime, nullable=True)
