from typing import List, Optional
from pydantic import BaseModel, Field


class RouteBase(BaseModel):
    project_id: str
    label: str  # 'Route A', 'Route B', 'Route C', 'Route D'
    strategy: str
    path: List[List[float]] = Field(..., description="List of [lon, lat] points")
    distance_km: float
    affected_parcels: int = 0
    affected_parcel_ids: Optional[List[str]] = []
    stakeholders: int = 0
    estimated_cost_cr: float
    estimated_delay_months: int = 0
    delay_probability_pct: int = 0
    infrastructure_impact: str = "Medium"
    overall_score: int = 75
    ai_recommended: bool = False
    corridor_width_meters: Optional[float] = 32.0
    lanes: Optional[int] = 6


class RouteCreate(RouteBase):
    id: Optional[str] = None


class RouteResponse(RouteBase):
    id: str

    class Config:
        from_attributes = True
