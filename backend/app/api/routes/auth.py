import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
import uuid
from backend.app.db.database import get_db, init_db, engine
from backend.app.db.models.user import User
from backend.app.db.models.project import Project
from backend.app.db.models.parcel import Parcel
from backend.app.db.models.field_verification import FieldVerification
from backend.app.db.models.notification import Notification
from backend.app.db.models.citizen_report import CitizenReport
from backend.app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    LoginRequest,
    ResetPasswordRequest,
    AdminStatsResponse,
)
from backend.app.schemas.token import Token, UserAuthInfo
from backend.app.core.security import verify_password, get_password_hash, create_access_token, UserRole
from backend.app.api.deps import get_current_active_user, require_roles, require_role

logger = logging.getLogger("landguard.auth")

router = APIRouter()


@router.options("/login", include_in_schema=False)
def options_login():
    return Response(status_code=200)


@router.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    if not req.email or not req.email.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is required")
    if not req.password or not req.password.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password is required")

    clean_email = req.email.lower().strip()
    logger.info(f"POST /api/v1/auth/login received for {clean_email}")

    user = None
    try:
        user = db.query(User).filter(User.email == clean_email).first()
    except Exception as e:
        logger.error(f"Database query error during login for {clean_email}: {e}", exc_info=True)
        # Attempt recovery if database was not initialized
        try:
            init_db(engine)
            user = db.query(User).filter(User.email == clean_email).first()
        except Exception as retry_err:
            logger.error(f"Database recovery failed: {retry_err}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connectivity issue. Please try again shortly.",
            )

    # If demo user is requested but not yet in DB, trigger idempotent seed
    if not user and clean_email in [
        "admin@landguard.ai",
        "admin@landguard.gov.in",
        "projecthead@landguard.ai",
        "head@landguard.ai",
        "head@landguard.gov.in",
        "district@landguard.ai",
        "district@landguard.gov.in",
        "acquisition@landguard.ai",
        "lao@landguard.ai",
        "lao@landguard.gov.in",
        "field@landguard.ai",
        "field@landguard.gov.in",
        "supervisor@landguard.ai",
        "supervisor@landguard.gov.in",
        "citizen@landguard.ai",
        "citizen@landguard.demo",
        "citizen@landguard.gov.in",
        "contractor@landguard.ai",
        "contractor@landguard.demo",
        "contractor@landguard.gov.in",
    ]:
        try:
            from backend.app.db.seed import seed_database
            logger.info(f"Demo user {clean_email} missing. Seeding database...")
            seed_database(db, force=False)
            user = db.query(User).filter(User.email == clean_email).first()
        except Exception as seed_err:
            logger.error(f"Error seeding demo user: {seed_err}", exc_info=True)

    if not user or not verify_password(req.password, user.hashed_password):
        logger.warning(f"Failed authentication attempt for {clean_email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        logger.warning(f"Login rejected for inactive user {clean_email}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account")

    token = create_access_token(subject=user.id, role=user.role)
    logger.info(f"User {user.email} (role: {user.role}) authenticated successfully")

    user_info = UserAuthInfo(
        id=user.id,
        name=user.full_name,
        email=user.email,
        role=user.role,
        designation=user.designation,
        department=user.department,
        district=user.district,
        zone=user.zone,
    )

    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        user=user_info,
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.post("/logout")
@router.get("/logout")
def logout():
    return {"status": "success", "message": "Logged out successfully"}


@router.post("/register", response_model=UserResponse)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    # Role check: Public signup MUST NOT allow staff/admin roles
    role_val = user_in.role.value if isinstance(user_in.role, UserRole) else str(user_in.role)
    allowed_public_roles = [UserRole.CITIZEN.value, UserRole.CONTRACTOR.value]
    if role_val not in allowed_public_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public registration is only permitted for Citizens and Contractors. Staff roles must be provisioned by an Administrator.",
        )

    # Password policy check: Minimum 8 characters
    if not user_in.password or len(user_in.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long.",
        )

    existing = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        id=f"USR-{uuid.uuid4().hex[:8].upper()}",
        email=user_in.email.lower().strip(),
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=role_val,
        designation=user_in.designation or ("Citizen Representative" if role_val == UserRole.CITIZEN.value else "Contractor Representative"),
        department=user_in.department or ("Citizen Services" if role_val == UserRole.CITIZEN.value else "Infrastructure Contracting"),
        phone=user_in.phone or "+91 90000-00000",
        district=user_in.district,
        zone=user_in.zone,
        address=user_in.address,
        is_active=user_in.is_active,
        is_superuser=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# --- ADMIN USER MANAGEMENT ENDPOINTS ---

@router.get("/users", response_model=List[UserResponse])
def list_users(
    search: Optional[str] = Query(None, description="Search by name or email"),
    role: Optional[str] = Query(None, description="Filter by role"),
    status: Optional[str] = Query(None, description="Filter active/inactive"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN])),
):
    """Admin endpoint to retrieve all registered users."""
    query = db.query(User)
    if search:
        s = f"%{search.lower().strip()}%"
        query = query.filter((User.full_name.ilike(s)) | (User.email.ilike(s)))
    if role and role != "all":
        query = query.filter(User.role == role)
    if status and status != "all":
        is_act = (status.lower() == "active" or status.lower() == "true")
        query = query.filter(User.is_active == is_act)

    users = query.order_by(User.created_at.desc()).all()
    return users


@router.post("/users", response_model=UserResponse)
def admin_create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN])),
):
    """Admin endpoint to create a new user and assign any role."""
    existing = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

    role_val = user_in.role.value if isinstance(user_in.role, UserRole) else str(user_in.role)
    user = User(
        id=f"USR-{uuid.uuid4().hex[:8].upper()}",
        email=user_in.email.lower().strip(),
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=role_val,
        designation=user_in.designation or role_val.replace("_", " ").title(),
        department=user_in.department or "Land Administration & Infrastructure",
        phone=user_in.phone or "+91 94440-00000",
        district=user_in.district or "Chennai",
        zone=user_in.zone or "Zone A",
        address=user_in.address,
        is_active=user_in.is_active,
        is_superuser=(role_val == UserRole.SUPER_ADMIN.value),
    )
    db.add(user)
    db.flush()

    # If created user is an operational staff officer, sync/create OfficerProfile for auto-allocation
    from backend.app.db.models.officer_performance import OfficerProfile
    if role_val in [
        UserRole.FIELD_OFFICER.value,
        UserRole.LAND_ACQUISITION_OFFICER.value,
        UserRole.SUPERVISOR.value,
        UserRole.DISTRICT_OFFICER.value,
        "SURVEY_OFFICER",
        "LEGAL_OFFICER",
    ]:
        existing_profile = db.query(OfficerProfile).filter(
            (OfficerProfile.user_id == user.id) | (OfficerProfile.name == user.full_name)
        ).first()
        if not existing_profile:
            officer_prof = OfficerProfile(
                id=f"OFF-{user.id.replace('USR-', '')}",
                user_id=user.id,
                name=user.full_name,
                role=role_val,
                district=user.district or "Chennai",
                zone=user.zone or "Zone A",
                total_points=100,
                completed_tasks=0,
                on_time_tasks=0,
                avg_response_time_sec=120.0,
                verification_accuracy_pct=95.0,
                sla_compliance_pct=92.0,
                is_available=user.is_active,
                current_workload=0,
                active_district=user.district or "Chennai",
                points_tier="Gold",
            )
            db.add(officer_prof)

    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=UserResponse)
def admin_update_user(
    user_id: str,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN])),
):
    """Admin endpoint to update user details, role, or active status."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.designation is not None:
        user.designation = user_in.designation
    if user_in.department is not None:
        user.department = user_in.department
    if user_in.phone is not None:
        user.phone = user_in.phone
    if user_in.district is not None:
        user.district = user_in.district
    if user_in.zone is not None:
        user.zone = user_in.zone
    if user_in.address is not None:
        user.address = user_in.address
    if user_in.role is not None:
        role_val = user_in.role.value if isinstance(user_in.role, UserRole) else str(user_in.role)
        user.role = role_val
        user.is_superuser = (role_val == UserRole.SUPER_ADMIN.value)
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)

    # Sync corresponding OfficerProfile if present
    from backend.app.db.models.officer_performance import OfficerProfile
    prof = db.query(OfficerProfile).filter(
        (OfficerProfile.user_id == user.id) | (OfficerProfile.name == user.full_name)
    ).first()
    if prof:
        if user_in.full_name is not None:
            prof.name = user_in.full_name
        if user_in.district is not None:
            prof.district = user_in.district
            prof.active_district = user_in.district
        if user_in.zone is not None:
            prof.zone = user_in.zone
        if user_in.role is not None:
            prof.role = user.role
        if user_in.is_active is not None:
            prof.is_available = user_in.is_active

    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/reset-password")
def admin_reset_password(
    user_id: str,
    req: ResetPasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN])),
):
    """Admin endpoint to reset a user's password."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"status": "success", "message": f"Password reset for {user.email}"}


@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN])),
):
    """Admin endpoint to deactivate or delete a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Don't hard-delete default admin, deactivate instead
    if user.email in ["admin@landguard.ai", "admin@landguard.gov.in"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete root system administrator")

    db.delete(user)
    db.commit()
    return {"status": "success", "message": f"User {user_id} deleted"}


@router.get("/admin-stats", response_model=AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN])),
):
    """Summary metrics for the Super Admin control center."""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_projects = db.query(Project).count()
    
    # Calculate high risk metrics
    critical_parcels = db.query(Parcel).filter(Parcel.risk_contribution == "critical").count()
    pending_approvals = db.query(FieldVerification).filter(
        FieldVerification.status.in_(["Awaiting Supervisor Verification", "Assigned", "In Progress"])
    ).count()
    open_incidents = db.query(CitizenReport).filter(CitizenReport.status != "Resolved").count()
    system_alerts = db.query(Notification).filter(Notification.read == False).count()
    
    return AdminStatsResponse(
        total_users=total_users or 8,
        active_users=active_users or 8,
        total_projects=total_projects or 10,
        high_risk_projects=3,
        critical_parcels=critical_parcels or 18,
        pending_approvals=pending_approvals or 12,
        open_incidents=open_incidents or 6,
        system_alerts=system_alerts or 5,
    )

