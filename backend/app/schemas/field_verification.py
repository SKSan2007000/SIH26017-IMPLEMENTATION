from typing import Optional, List, Any
from pydantic import BaseModel


class FieldVerificationBase(BaseModel):
    parcel_id: str
    project_id: str
    officer_ref: str
    officer_name: Optional[str] = None
    location: str
    priority: str = "Medium"  # 'Low' | 'Medium' | 'High' | 'Critical'
    deadline: str
    status: str = "Assigned"  # 'Assigned' | 'In Progress' | 'Awaiting Supervisor Verification' | 'Verified' | 'Revisit Requested'
    verification_status: Optional[str] = "PENDING"
    gps_captured: bool = True
    gps_coordinates: Optional[List[float]] = None
    photos_count: int = 0
    videos_count: int = 0
    photo_evidence_ref: Optional[str] = None
    video_evidence_ref: Optional[str] = None
    observation: Optional[str] = None
    supervisor_decision: Optional[str] = None
    assigned_date: Optional[str] = None
    completed_date: Optional[str] = None


class FieldVerificationCreate(BaseModel):
    id: Optional[str] = None
    parcel_id: str
    project_id: str
    officer_ref: str
    officer_name: Optional[str] = None
    location: str
    priority: Optional[str] = "Medium"
    deadline: str
    status: Optional[str] = "Assigned"
    verification_status: Optional[str] = "PENDING"
    gps_captured: Optional[bool] = True
    gps_coordinates: Optional[List[float]] = None
    photos_count: Optional[int] = 0
    videos_count: Optional[int] = 0
    photo_evidence_ref: Optional[str] = None
    video_evidence_ref: Optional[str] = None
    observation: Optional[str] = None
    supervisor_decision: Optional[str] = None
    assigned_date: Optional[str] = None
    completed_date: Optional[str] = None


class FieldVerificationUpdate(BaseModel):
    officer_ref: Optional[str] = None
    officer_name: Optional[str] = None
    status: Optional[str] = None
    verification_status: Optional[str] = None
    supervisor_decision: Optional[str] = None
    gps_coordinates: Optional[List[float]] = None
    photos_count: Optional[int] = None
    videos_count: Optional[int] = None
    photo_evidence_ref: Optional[str] = None
    video_evidence_ref: Optional[str] = None
    observation: Optional[str] = None
    completed_date: Optional[str] = None


class FieldVerificationResponse(FieldVerificationBase):
    id: str

    class Config:
        from_attributes = True
