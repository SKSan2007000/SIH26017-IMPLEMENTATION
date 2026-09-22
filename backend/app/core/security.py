from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
from enum import Enum
import jwt
import bcrypt
from backend.app.core.config import settings


class UserRole(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    PROJECT_HEAD = "PROJECT_HEAD"
    DISTRICT_OFFICER = "DISTRICT_OFFICER"
    LAND_ACQUISITION_OFFICER = "LAND_ACQUISITION_OFFICER"
    FIELD_OFFICER = "FIELD_OFFICER"
    SUPERVISOR = "SUPERVISOR"
    CITIZEN = "CITIZEN"
    CONTRACTOR = "CONTRACTOR"


def create_access_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject), "role": role}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_bytes = plain_password.encode("utf-8")[:72]
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")
