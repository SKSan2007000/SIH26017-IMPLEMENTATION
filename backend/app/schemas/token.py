from typing import Optional, Dict, Any
from pydantic import BaseModel


class UserAuthInfo(BaseModel):
    id: str
    name: str
    email: str
    role: str
    designation: Optional[str] = None
    department: Optional[str] = None
    district: Optional[str] = None
    zone: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    email: str
    full_name: str
    user: Optional[UserAuthInfo] = None


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
