from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.db.database import Base


class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    overall_pct = Column(Integer, nullable=False)
    band = Column(String, default="medium")  # 'critical' | 'high' | 'medium' | 'low'
    predicted_delay_label = Column(String, default="+4 months")
    confidence_pct = Column(Integer, default=85)
    trend = Column(JSON, default=list)  # historical list e.g. [40, 52, 65, 78]
    trend_status = Column(String, default="Escalating")
    categories = Column(JSON, default=list)  # list of {name: str, pct: int}
    drivers = Column(JSON, default=list)  # list of {label: str, contributionPct: int}
    original_completion_months = Column(Integer, default=24)
    predicted_completion_months = Column(Integer, default=31)
    delay_probability = Column(Float, default=0.50)
    risk_score = Column(Integer, default=50)
    risk_category = Column(String, default="MEDIUM")  # 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    expected_delay_months = Column(Float, default=3.5)
    expected_delay_days = Column(Integer, default=105)
    model_version = Column(String, default="1.0.0-rf")
    recommendations = Column(JSON, default=list)  # list of actionable recommendation objects
    prediction_metadata = Column(JSON, default=dict)
    predicted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="risk_prediction")
    factors = relationship("RiskFactor", back_populates="prediction", cascade="all, delete-orphan")


class RiskFactor(Base):
    __tablename__ = "risk_factors"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_id = Column(String, ForeignKey("risk_predictions.id", ondelete="CASCADE"), nullable=True)
    factor_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    score = Column(Float, default=50.0)
    weight = Column(Float, default=1.0)
    description = Column(String, nullable=True)
    mitigation = Column(String, nullable=True)

    prediction = relationship("RiskPrediction", back_populates="factors")
