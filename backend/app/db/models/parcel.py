from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.db.database import Base


class Parcel(Base):
    __tablename__ = "parcels"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    route_ids = Column(JSON, default=list)  # list of route IDs affecting this parcel
    coords = Column(JSON, nullable=False)  # [lon, lat] centroid
    polygon_coords = Column(JSON, nullable=True)  # [[lon, lat], ...] polygon boundary
    area_sq_ft = Column(Float, nullable=False)
    impact = Column(String, default="potential")  # 'unaffected' | 'potential' | 'affected' | 'high'
    land_type = Column(String, default="Private")  # 'Government' | 'Private'
    owner_ref = Column(String, nullable=False, index=True)  # e.g. "DEMO OWNER-024"
    verification = Column(String, default="PENDING")
    acquisition_status = Column(String, default="NOT STARTED")
    workflow_status = Column(String, default="IDENTIFIED", index=True)
    response_status = Column(String, default="PENDING")
    notification_status = Column(String, default="NOT SENT")
    documents_complete = Column(Integer, default=0)
    documents_required = Column(Integer, default=4)
    disputed = Column(Boolean, default=False)
    risk_contribution = Column(String, default="low")
    structures_present = Column(Boolean, default=False)
    structure_type = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="parcels")
    documents = relationship("Document", back_populates="parcel", cascade="all, delete-orphan")
    field_verifications = relationship("FieldVerification", back_populates="parcel", cascade="all, delete-orphan")
