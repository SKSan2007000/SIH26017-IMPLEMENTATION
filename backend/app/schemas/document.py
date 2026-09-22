from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class DocumentBase(BaseModel):
    parcel_id: str
    project_id: Optional[str] = None
    stakeholder_id: Optional[str] = None
    type: str = "Ownership"  # 'Ownership' | 'Survey' | 'Compensation' | 'Legal' | 'Approval' | 'Project'
    status: str = "Uploaded"  # 'Uploaded' | 'Processing' | 'Verified' | 'Rejected' | 'Missing'
    verification_status: Optional[str] = "PENDING"
    file_size: Optional[str] = "2.4 MB"
    ocr: Optional[Dict[str, Any]] = None


class DocumentCreate(BaseModel):
    id: Optional[str] = None
    parcel_id: str
    project_id: Optional[str] = None
    stakeholder_id: Optional[str] = None
    type: str = "Ownership"
    status: Optional[str] = "Uploaded"
    verification_status: Optional[str] = "PENDING"
    file_size: Optional[str] = "2.4 MB"
    ocr: Optional[Dict[str, Any]] = None


class DocumentUpdate(BaseModel):
    status: Optional[str] = None
    verification_status: Optional[str] = None
    ocr: Optional[Dict[str, Any]] = None


class DocumentResponse(DocumentBase):
    id: str
    uploaded_at: Optional[datetime] = None

    class Config:
        from_attributes = True
