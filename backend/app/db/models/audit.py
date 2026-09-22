from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from backend.app.db.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor = Column(String, nullable=False)
    action = Column(String, nullable=False)  # PROJECT_CREATED, ROUTE_CREATED, PARCEL_VERIFIED, DOCUMENT_UPLOADED, NOTICE_SENT, FIELD_VERIFIED, PROJECT_APPROVED
    entity = Column(String, nullable=False)  # 'Project', 'Route', 'Parcel', 'Document', 'FieldVerification', etc.
    entity_id = Column(String, nullable=False)
    label = Column(String, nullable=False)
    category = Column(String, default="System")  # 'Route Selection' | 'Risk Assessment' | 'Verification' | 'Document Review' | 'Compensation' | 'System'
    details = Column(Text, nullable=True)
    extra_metadata = Column(JSON, nullable=True)
    time = Column(String, nullable=False)
    date = Column(String, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
