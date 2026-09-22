"""
LandGuard AI — Design & Versioning Schemas (Phase 6)
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class DesignVersionBase(BaseModel):
    version_number: int
    created_by: str
    source: str = "AI_GENERATED"
    route_geometry: List[List[float]]
    length_km: float
    land_impact_acres: float
    affected_parcels_count: int = 0
    affected_parcel_ids: List[str] = Field(default_factory=list)
    stakeholders_count: int = 0
    estimated_cost_cr: float
    estimated_duration_months: float = 18.0
    delay_risk_pct: int = 25
    connectivity_score: int = 85
    construction_complexity: str = "Medium"
    overall_score: int = 85
    status: str = "SUBMITTED"
    approval_status: str = "PENDING"
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    notes: Optional[str] = None
    visual_url: Optional[str] = None


class DesignVersionCreate(BaseModel):
    route_geometry: List[List[float]]
    created_by: str = "Authorized Officer"
    source: str = "OFFICER_MODIFIED"
    notes: Optional[str] = None
    corridor_width_meters: Optional[float] = 32.0


class DesignVersionResponse(DesignVersionBase):
    id: str
    design_id: str
    project_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class DesignBase(BaseModel):
    project_id: str
    route_id: Optional[str] = None
    name: str
    label: str
    strategy: str
    current_version_number: int = 1
    status: str = "AI_GENERATED"
    connectivity_score: int = 80
    construction_complexity: str = "Medium"
    is_approved: bool = False


class DesignResponse(DesignBase):
    id: str
    created_at: datetime
    updated_at: datetime
    versions: List[DesignVersionResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class DesignGenerateRequest(BaseModel):
    project_id: str
    count: int = 4
    preferred_strategy: Optional[str] = None
    max_budget_cr: Optional[float] = None


class DesignRecalculateRequest(BaseModel):
    route_geometry: List[List[float]]
    corridor_width_meters: Optional[float] = 32.0
    strategy: Optional[str] = None


class DesignRecalculateResponse(BaseModel):
    length_km: float
    land_impact_acres: float
    affected_parcels_count: int
    affected_parcel_ids: List[str]
    stakeholders_count: int
    estimated_cost_cr: float
    estimated_duration_months: float
    delay_risk_pct: int
    connectivity_score: int
    construction_complexity: str
    overall_score: int
    ai_recommendation_reason: str


class DesignComparisonResponse(BaseModel):
    project_id: str
    compared_designs: List[Dict[str, Any]]
    recommended_design_id: str
    ranking_criteria: Dict[str, float]


class DesignChangeRequestCreate(BaseModel):
    title: str
    reason: str
    contractor_id: str
    contractor_name: str
    requested_modifications: Dict[str, Any] = Field(default_factory=dict)
    proposed_geometry: Optional[List[List[float]]] = None


class DesignChangeRequestReview(BaseModel):
    officer_review_status: str  # APPROVED, REJECTED, REVISION_REQUESTED
    officer_comment: str
    reviewer_name: str = "Project Director"


class DesignChangeRequestResponse(BaseModel):
    id: str
    project_id: str
    design_id: str
    version_id: str
    contractor_id: str
    contractor_name: str
    title: str
    reason: str
    requested_modifications: Dict[str, Any]
    proposed_geometry: Optional[List[List[float]]]
    officer_review_status: str
    officer_comment: Optional[str]
    ai_impact_analysis: Dict[str, Any]
    created_at: datetime
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[str]

    class Config:
        from_attributes = True


class DesignPackageResponse(BaseModel):
    id: str
    project_id: str
    design_id: str
    version_id: str
    package_number: str
    title: str
    approved_by: str
    approved_at: datetime
    specs: Dict[str, Any]
    officer_instructions: str
    documents_count: int
    disclaimer: str
    access_log: List[Dict[str, Any]]

    class Config:
        from_attributes = True
