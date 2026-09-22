from datetime import datetime
from typing import Optional, Union
from pydantic import BaseModel, EmailStr
from backend.app.core.security import UserRole


class UserBase(BaseModel):
    email: str
    full_name: str
    role: UserRole = UserRole.FIELD_OFFICER
    designation: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    district: Optional[str] = None
    zone: Optional[str] = None
    address: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    district: Optional[str] = None
    zone: Optional[str] = None
    address: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: str
    created_at: Optional[Union[datetime, str]] = None
    updated_at: Optional[Union[datetime, str]] = None

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str


class ResetPasswordRequest(BaseModel):
    new_password: str


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_projects: int
    high_risk_projects: int
    critical_parcels: int
    pending_approvals: int
    open_incidents: int
    system_alerts: int

