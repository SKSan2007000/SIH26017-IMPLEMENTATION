from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


class ProjectBase(BaseModel):
    name: str
    type: str = "Expressway / Highway"
    state: str
    district: str
    status: str = "Land Acquisition"
    coords: Optional[List[float]] = Field(default=None, description="[longitude, latitude]")
    start_location: Optional[str] = "Origin Point"
    destination: Optional[str] = "Destination Point"
    estimated_budget_cr: Optional[float] = 850.0
    target_completion: Optional[str] = "2028-12-31"
    required_land_area_acres: float = 150.0
    current_stage_index: int = 3
    bottleneck_stage_index: int = 4
    selected_route_id: Optional[str] = None
    
    # Extended fields
    description: Optional[str] = None
    taluk: Optional[str] = None
    city: Optional[str] = None
    priority: Optional[str] = "HIGH"
    corridor_length_km: Optional[float] = None
    right_of_way_m: Optional[float] = None
    project_head_id: Optional[str] = None
    district_officer_id: Optional[str] = None
    lao_id: Optional[str] = None
    field_officer_id: Optional[str] = None
    supervisor_id: Optional[str] = None
    active_contractor_id: Optional[str] = None


class ProjectCreate(BaseModel):
    id: Optional[str] = None
    project_code: Optional[str] = None
    name: str
    type: Optional[str] = None
    project_type: Optional[str] = None
    description: Optional[str] = None
    state: str
    district: str
    taluk: Optional[str] = None
    city: Optional[str] = None
    project_value: Optional[float] = None
    estimated_budget_cr: Optional[float] = None
    land_required_acres: Optional[float] = None
    required_land_area_acres: Optional[float] = None
    target_completion_date: Optional[str] = None
    target_completion: Optional[str] = None
    priority: Optional[str] = "HIGH"
    start_location: Optional[str] = None
    end_location: Optional[str] = None
    destination: Optional[str] = None
    corridor_length_km: Optional[float] = None
    right_of_way_m: Optional[float] = None
    coords: Optional[List[float]] = None
    status: Optional[str] = "Planning"
    auto_assign_team: Optional[bool] = True
    current_stage_index: Optional[int] = 0
    bottleneck_stage_index: Optional[int] = 1
    selected_route_id: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    estimated_budget_cr: Optional[float] = None
    target_completion: Optional[str] = None
    current_stage_index: Optional[int] = None
    bottleneck_stage_index: Optional[int] = None
    selected_route_id: Optional[str] = None
    priority: Optional[str] = None
    workflow_state: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: str
    parcels_count: int = 0
    stakeholders_count: int = 0
    workflow_state: Optional[str] = "PLANNING"
    overall_progress: Optional[float] = 25.0
    land_acquisition_progress: Optional[float] = 30.0
    construction_progress: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
