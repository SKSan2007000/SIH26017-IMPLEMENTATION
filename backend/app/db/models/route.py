from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.db.database import Base


class Route(Base):
    __tablename__ = "routes"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String, nullable=False)  # 'Route A', 'Route B', etc.
    strategy = Column(String, nullable=False)
    path = Column(JSON, nullable=False)  # list of [lon, lat] points
    distance_km = Column(Float, nullable=False)
    affected_parcels = Column(Integer, default=0)
    affected_parcel_ids = Column(JSON, default=list)
    stakeholders = Column(Integer, default=0)
    estimated_cost_cr = Column(Float, nullable=False)
    estimated_delay_months = Column(Integer, default=0)
    delay_probability_pct = Column(Integer, default=0)
    infrastructure_impact = Column(String, default="Medium")
    overall_score = Column(Integer, default=75)
    ai_recommended = Column(Boolean, default=False)
    corridor_width_meters = Column(Float, default=32.0)
    lanes = Column(Integer, default=6)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="routes")
