"""
LandGuard AI — Portfolio, Cross-Project Assignment & Network Schemas (Phase 6)
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class PortfolioSummaryResponse(BaseModel):
    total_projects: int
    active_projects: int
    planning_projects: int
    high_risk_projects: int
    critical_projects: int
    under_construction_projects: int
    completed_projects: int
    overdue_projects: int
    total_estimated_budget_cr: float
    total_land_impact_acres: float
    total_affected_parcels: int
    total_stakeholders: int
    overall_portfolio_risk_pct: int
    portfolio_risk_band: str
    projects_breakdown: List[Dict[str, Any]]


class ProjectAssignmentCreate(BaseModel):
    user_id: str
    user_name: str
    role: str
    designation: Optional[str] = None


class ProjectAssignmentResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    user_name: str
    role: str
    designation: Optional[str]
    assigned_at: datetime
    assigned_by: str
    status: str
    cross_project_load_weight: float

    class Config:
        from_attributes = True


class OfficerCrossProjectWorkloadResponse(BaseModel):
    officer_id: str
    officer_name: str
    role: str
    active_projects: List[Dict[str, Any]]
    total_assigned_projects: int
    total_pending_tasks: int
    total_critical_tasks: int
    total_overdue_tasks: int
    total_completed_tasks: int
    sla_compliance_pct: int
    incentive_points: int
    cross_project_workload_index: float  # 0.0 - 1.0
    availability_status: str  # Available, Moderate Load, Near Capacity, Overloaded


class ContractorProjectView(BaseModel):
    project_id: str
    project_name: str
    assigned_work_packages_count: int
    overall_progress_pct: float
    land_acquisition_status: str
    approved_design_id: Optional[str]
    approved_design_name: Optional[str]
    active_change_requests_count: int
    delay_variance_pct: float
    pending_inspections_count: int


class RoadNetworkFeature(BaseModel):
    id: str
    name: str
    type: str  # HIGHWAY, MAJOR_ROAD, LOCAL_ROAD, RAILWAY, RIVER, INDUSTRIAL_HUB, URBAN_HUB
    coordinates: Any
    properties: Dict[str, Any] = Field(default_factory=dict)


class ConnectivityGapResponse(BaseModel):
    id: str
    region: str
    description: str
    gap_type: str  # MISSING_DIRECT_LINK, CONGESTION_CHOKEPOINT, INDUSTRIAL_ACCESS
    existing_travel_time_min: int
    potential_travel_time_min: int
    estimated_socio_economic_benefit_cr: float
    predicted_acquisition_difficulty: str  # Low, Medium, High
    proposed_corridor_coordinates: List[List[float]]
