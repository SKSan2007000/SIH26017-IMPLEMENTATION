from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from backend.app.db.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, default="Platform Notification")
    category = Column(String, default="Critical Delay Risk")
    type = Column(String, default="NOTICE")  # PROJECT_ASSIGNMENT, FIELD_VERIFICATION, DOCUMENT_PENDING, STAKEHOLDER_RESPONSE, NOTICE, RISK_INCREASE, PROJECT_DELAY
    severity = Column(String, default="High")  # 'Critical' | 'High' | 'Medium' | 'Low'
    priority = Column(String, default="HIGH")  # 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    message = Column(String, nullable=False)
    action_url = Column(String, nullable=True)  # Deep-link navigation URL
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    parcel_id = Column(String, nullable=True)
    recipient = Column(String, nullable=True)
    channel = Column(String, default="In-App")  # 'In-App' | 'SMS' | 'Email'
    timestamp = Column(String, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

