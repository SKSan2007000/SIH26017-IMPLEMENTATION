from typing import Optional
from pydantic import BaseModel


class CitizenReportBase(BaseModel):
    project_id: Optional[str] = None
    location: str
    description: str
    category: Optional[str] = "Boundary Grievance"
    report_type: Optional[str] = "Boundary Grievance"
    citizen_ref: Optional[str] = None
    has_photo: bool = False
    has_video: bool = False
    status: str = "Submitted"  # 'Submitted' | 'Under Review' | 'Verified' | 'Considered' | 'Planned' | 'Rejected'
    submitted_at: str
    response_note: Optional[str] = None


class CitizenReportCreate(BaseModel):
    id: Optional[str] = None
    project_id: Optional[str] = None
    location: str
    description: str
    category: Optional[str] = "Boundary Grievance"
    report_type: Optional[str] = "Boundary Grievance"
    citizen_ref: Optional[str] = None
    has_photo: Optional[bool] = False
    has_video: Optional[bool] = False
    status: Optional[str] = "Submitted"
    submitted_at: Optional[str] = None
    response_note: Optional[str] = None


class CitizenReportUpdate(BaseModel):
    status: Optional[str] = None
    response_note: Optional[str] = None


class CitizenReportResponse(CitizenReportBase):
    id: str

    class Config:
        from_attributes = True
