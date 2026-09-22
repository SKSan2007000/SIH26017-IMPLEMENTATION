from typing import Optional
from pydantic import BaseModel, ConfigDict


class NotificationBase(BaseModel):
    title: Optional[str] = "Platform Notification"
    category: Optional[str] = "Critical Delay Risk"
    type: Optional[str] = "NOTICE"  # PROJECT_ASSIGNMENT, FIELD_VERIFICATION, DOCUMENT_PENDING, STAKEHOLDER_RESPONSE, NOTICE, RISK_INCREASE, PROJECT_DELAY
    severity: str = "High"  # 'Critical' | 'High' | 'Medium' | 'Low'
    priority: Optional[str] = "HIGH"  # 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    message: str
    action_url: Optional[str] = None
    project_id: Optional[str] = None
    parcel_id: Optional[str] = None
    recipient: Optional[str] = None
    channel: Optional[str] = "In-App"
    timestamp: Optional[str] = None
    read: bool = False


class NotificationCreate(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = "Platform Notification"
    category: Optional[str] = "Critical Delay Risk"
    type: Optional[str] = "NOTICE"
    severity: Optional[str] = "High"
    priority: Optional[str] = "HIGH"
    message: str
    action_url: Optional[str] = None
    project_id: Optional[str] = None
    parcel_id: Optional[str] = None
    recipient: Optional[str] = None
    channel: Optional[str] = "In-App"
    timestamp: Optional[str] = None
    read: Optional[bool] = False


class NotificationResponse(NotificationBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

