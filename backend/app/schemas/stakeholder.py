from typing import List, Optional
from pydantic import BaseModel, Field


class StakeholderBase(BaseModel):
    ref: str
    name: Optional[str] = None
    project_id: str
    parcel_id: str
    parcel_ids: List[str] = Field(default_factory=list)
    contact_ref: Optional[str] = None
    status: str = "Pending"
    response_status: str = "PENDING"
    notification_status: str = "NOT SENT"
    documents_complete: bool = False
    documents_count: int = 0
    documents_required: int = 4
    compensation_status: str = "Not Initiated"
    last_contact: Optional[str] = None
    preferred_language: Optional[str] = "Tamil"


class StakeholderCreate(StakeholderBase):
    id: Optional[str] = None


class StakeholderUpdate(BaseModel):
    status: Optional[str] = None
    response_status: Optional[str] = None
    notification_status: Optional[str] = None
    compensation_status: Optional[str] = None
    documents_complete: Optional[bool] = None


class StakeholderResponse(StakeholderBase):
    id: str

    class Config:
        from_attributes = True
