from typing import Generator, Optional, List, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.core.security import UserRole
from backend.app.db.database import get_db
from backend.app.db.models.user import User

security_scheme = HTTPBearer(auto_error=False)


def normalize_role(role_val: Union[str, UserRole]) -> str:
    """Normalizes role strings and enums to standard uppercase format (e.g. 'super_admin' -> 'SUPER_ADMIN')."""
    if isinstance(role_val, UserRole):
        return role_val.value.upper()
    return str(role_val).strip().upper().replace(" ", "_")


def get_current_user(
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> Optional[User]:
    if not credentials:
        return None
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except (jwt.PyJWTError, ValidationError, Exception):
        return None

    user = db.query(User).filter(User.id == user_id).first()
    return user


def get_current_active_user(
    current_user: Optional[User] = Depends(get_current_user),
) -> User:
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account")
    return current_user


def require_roles(allowed_roles: Union[List[Union[str, UserRole]], Union[str, UserRole]]):
    """Reusable dependency to verify the current authenticated user has one of the allowed roles."""
    if not isinstance(allowed_roles, list):
        roles_list = [allowed_roles]
    else:
        roles_list = allowed_roles

    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        allowed_normalized = [normalize_role(r) for r in roles_list]
        user_role_normalized = normalize_role(current_user.role)
        
        # SUPER_ADMIN retains universal administrative clearance
        if user_role_normalized not in allowed_normalized and user_role_normalized != UserRole.SUPER_ADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {allowed_normalized}, Current: {user_role_normalized}",
            )
        return current_user

    return role_checker


def require_role(role: Union[str, UserRole, List[Union[str, UserRole]]]):
    """Alias dependency for singular/multi-role checks e.g. require_role('super_admin'), require_role(UserRole.PROJECT_HEAD)."""
    return require_roles(role)
