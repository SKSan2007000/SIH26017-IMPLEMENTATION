from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class AuditLogBase(BaseModel):
    project_id: str
    user_id: Optional[str] = None
    actor: str
    action: str  # PROJECT_CREATED, ROUTE_CREATED, PARCEL_VERIFIED, DOCUMENT_UPLOADED, NOTICE_SENT, FIELD_VERIFIED, PROJECT_APPROVED
    entity: str
    entity_id: str
    label: str
    category: Optional[str] = "System"
    details: Optional[str] = None
    extra_metadata: Optional[Dict[str, Any]] = None
    time: Optional[str] = None
    date: Optional[str] = None


class AuditLogCreate(AuditLogBase):
    id: Optional[str] = None


class AuditLogResponse(AuditLogBase):
    id: str
    timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True
