from typing import List, Optional
from pydantic import BaseModel, Field


class ParcelBase(BaseModel):
    project_id: str
    route_ids: List[str] = Field(default_factory=list)
    coords: List[float] = Field(..., description="[longitude, latitude] centroid")
    polygon_coords: Optional[List[List[float]]] = Field(None, description="Boundary polygon coords")
    area_sq_ft: float
    impact: str = "potential"  # 'unaffected' | 'potential' | 'affected' | 'high'
    land_type: str = "Private"  # 'Government' | 'Private'
    owner_ref: str  # e.g. "DEMO OWNER-024"
    verification: str = "PENDING"
    acquisition_status: str = "NOT STARTED"
    response_status: Optional[str] = "PENDING"
    notification_status: Optional[str] = "NOT SENT"
    documents_complete: int = 0
    documents_required: int = 4
    disputed: bool = False
    risk_contribution: str = "low"
    structures_present: Optional[bool] = False
    structure_type: Optional[str] = None


class ParcelCreate(ParcelBase):
    id: Optional[str] = None


class ParcelUpdate(BaseModel):
    verification: Optional[str] = None
    acquisition_status: Optional[str] = None
    response_status: Optional[str] = None
    notification_status: Optional[str] = None
    documents_complete: Optional[int] = None
    disputed: Optional[bool] = None
    risk_contribution: Optional[str] = None


class ParcelResponse(ParcelBase):
    id: str

    class Config:
        from_attributes = True
