from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from backend.app.db.database import Base


class StakeholderBenefitRecord(Base):
    __tablename__ = "stakeholder_benefit_records"

    id = Column(String, primary_key=True, index=True)
    stakeholder_id = Column(String, ForeignKey("stakeholders.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_ref = Column(String, nullable=False, index=True)
    benefit_type = Column(String, default="DEMO PARTICIPATION / EMPLOYMENT BENEFIT")
    category = Column(String, default="Field Support")  # 'Field Support', 'Survey Assistance', 'Approved Local Work', 'Contractor Work Package'
    status = Column(String, default="ACTIVE")  # 'REGISTERED', 'APPROVED', 'ACTIVE', 'COMPLETED'
    stipend_amount_inr = Column(Float, default=15000.0)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
