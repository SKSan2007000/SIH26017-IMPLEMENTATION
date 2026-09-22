from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, JSON
from sqlalchemy.orm import relationship
from backend.app.db.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    type = Column(String, default="Expressway / Highway")
    state = Column(String, nullable=False, index=True)
    district = Column(String, nullable=False, index=True)
    status = Column(String, default="Land Acquisition")
    coords = Column(JSON, nullable=False)  # [lon, lat] centroid / start
    start_location = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    estimated_budget_cr = Column(Float, nullable=False)
    target_completion = Column(String, nullable=False)
    required_land_area_acres = Column(Float, default=150.0)
    current_stage_index = Column(Integer, default=3)
    bottleneck_stage_index = Column(Integer, default=4)
    selected_route_id = Column(String, nullable=True)
    parcels_count = Column(Integer, default=0)
    stakeholders_count = Column(Integer, default=0)
    
    # Phase 4 Workflow State Machine & Progress Metrics
    workflow_state = Column(String, default="PLANNING", index=True)
    overall_progress = Column(Float, default=25.0)
    land_acquisition_progress = Column(Float, default=30.0)
    construction_progress = Column(Float, default=0.0)
    
    # Extended Project Metadata & Corridor Specs
    description = Column(String, nullable=True)
    taluk = Column(String, nullable=True)
    city = Column(String, nullable=True)
    priority = Column(String, default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    corridor_length_km = Column(Float, nullable=True)
    right_of_way_m = Column(Float, nullable=True)
    
    # Assigned Officer References
    project_head_id = Column(String, nullable=True)
    district_officer_id = Column(String, nullable=True)
    lao_id = Column(String, nullable=True)
    field_officer_id = Column(String, nullable=True)
    supervisor_id = Column(String, nullable=True)
    active_contractor_id = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    routes = relationship("Route", back_populates="project", cascade="all, delete-orphan")
    parcels = relationship("Parcel", back_populates="project", cascade="all, delete-orphan")
    stakeholders = relationship("Stakeholder", back_populates="project", cascade="all, delete-orphan")
    field_verifications = relationship("FieldVerification", back_populates="project", cascade="all, delete-orphan")
    risk_prediction = relationship("RiskPrediction", back_populates="project", uselist=False, cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    citizen_reports = relationship("CitizenReport", back_populates="project", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", cascade="all, delete-orphan")
