"""
LandGuard AI — Multi-Design, Versioning, and Project Assignment Models (Phase 6)
All data in this model represents synthetic/fictional demonstration data.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from backend.app.db.database import Base


class Design(Base):
    __tablename__ = "designs"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    route_id = Column(String, nullable=True, index=True)
    name = Column(String, nullable=False)
    label = Column(String, nullable=False)  # 'Design A', 'Design B', 'Design C', etc.
    strategy = Column(String, nullable=False)  # 'Existing Corridor Upgrade', 'Northern Bypass', etc.
    current_version_number = Column(Integer, default=1)
    status = Column(String, default="AI_GENERATED", index=True)  # DRAFT, AI_GENERATED, OFFICER_MODIFIED, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, ARCHIVED
    connectivity_score = Column(Integer, default=80)
    construction_complexity = Column(String, default="Medium")  # Low, Medium, High, Very High
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    project = relationship("Project", backref="designs")
    versions = relationship("DesignVersion", back_populates="design", cascade="all, delete-orphan", order_by="DesignVersion.version_number")
    change_requests = relationship("DesignChangeRequest", back_populates="design", cascade="all, delete-orphan")


class DesignVersion(Base):
    __tablename__ = "design_versions"

    id = Column(String, primary_key=True, index=True)
    design_id = Column(String, ForeignKey("designs.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String, nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    created_by = Column(String, nullable=False)  # 'AI Engine', 'R. Vignesh (Senior Field Officer)', etc.
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    source = Column(String, default="AI_GENERATED")  # AI_GENERATED, OFFICER_MODIFIED, CONTRACTOR_CHANGE_REQUEST
    route_geometry = Column(JSON, nullable=False)  # [[lon, lat], ...]
    length_km = Column(Float, nullable=False)
    land_impact_acres = Column(Float, nullable=False)
    affected_parcels_count = Column(Integer, default=0)
    affected_parcel_ids = Column(JSON, default=list)
    stakeholders_count = Column(Integer, default=0)
    estimated_cost_cr = Column(Float, nullable=False)
    estimated_duration_months = Column(Float, default=18.0)
    delay_risk_pct = Column(Integer, default=25)
    connectivity_score = Column(Integer, default=85)
    construction_complexity = Column(String, default="Medium")
    overall_score = Column(Integer, default=85)
    status = Column(String, default="SUBMITTED")  # DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, ARCHIVED
    approval_status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    visual_url = Column(String, nullable=True)

    design = relationship("Design", back_populates="versions")


class DesignChangeRequest(Base):
    __tablename__ = "design_change_requests"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    design_id = Column(String, ForeignKey("designs.id", ondelete="CASCADE"), nullable=False, index=True)
    version_id = Column(String, nullable=False)
    contractor_id = Column(String, nullable=False)
    contractor_name = Column(String, nullable=False)
    title = Column(String, nullable=False)
    reason = Column(Text, nullable=False)
    requested_modifications = Column(JSON, default=dict)
    proposed_geometry = Column(JSON, nullable=True)
    officer_review_status = Column(String, default="PENDING", index=True)  # PENDING, APPROVED, REJECTED, REVISION_REQUESTED
    officer_comment = Column(Text, nullable=True)
    ai_impact_analysis = Column(JSON, default=dict)  # {"costDeltaCr": +15.0, "riskDeltaPct": -8, "timeDeltaMonths": -1.5}
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String, nullable=True)

    design = relationship("Design", back_populates="change_requests")


class ProjectAssignment(Base):
    __tablename__ = "project_assignments"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, nullable=False, index=True)
    user_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # PROJECT_HEAD, DISTRICT_OFFICER, LAO, FIELD_OFFICER, SUPERVISOR, CONTRACTOR
    designation = Column(String, nullable=True)
    assignment_score = Column(Float, nullable=True)
    assignment_reason = Column(Text, nullable=True)
    score_breakdown = Column(JSON, nullable=True)
    capacity_status = Column(String, default="AVAILABLE")  # AVAILABLE, NEAR CAPACITY, AT CAPACITY
    assigned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    assigned_by = Column(String, default="System Administrator")
    status = Column(String, default="ACTIVE")  # ACTIVE, INACTIVE
    cross_project_load_weight = Column(Float, default=1.0)


class DesignPackage(Base):
    __tablename__ = "design_packages"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    design_id = Column(String, ForeignKey("designs.id", ondelete="CASCADE"), nullable=False, index=True)
    version_id = Column(String, nullable=False)
    package_number = Column(String, nullable=False, unique=True)
    title = Column(String, nullable=False)
    approved_by = Column(String, nullable=False)
    approved_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    specs = Column(JSON, nullable=False)
    officer_instructions = Column(Text, nullable=False)
    documents_count = Column(Integer, default=5)
    disclaimer = Column(String, default="CONCEPTUAL / SIMULATION — NOT A CERTIFIED ENGINEERING DRAWING")
    access_log = Column(JSON, default=list)
