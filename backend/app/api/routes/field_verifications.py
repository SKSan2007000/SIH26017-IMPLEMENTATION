from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from backend.app.db.database import get_db
from backend.app.db.models.field_verification import FieldVerification
from backend.app.db.models.parcel import Parcel
from backend.app.schemas.field_verification import FieldVerificationCreate, FieldVerificationUpdate
from backend.app.services.audit_service import log_audit_event

router = APIRouter()


def format_verification_dict(v: FieldVerification) -> Dict[str, Any]:
    return {
        "id": v.id,
        "parcelId": v.parcel_id,
        "projectId": v.project_id,
        "officerRef": v.officer_ref,
        "officerName": v.officer_name or v.officer_ref,
        "location": v.location,
        "priority": v.priority,
        "deadline": v.deadline,
        "status": v.status,
        "verificationStatus": v.verification_status,
        "gpsCaptured": v.gps_captured,
        "gpsCoordinates": v.gps_coordinates,
        "photosCount": v.photos_count,
        "videosCount": v.videos_count,
        "photoEvidenceRef": v.photo_evidence_ref,
        "videoEvidenceRef": v.video_evidence_ref,
        "observation": v.observation,
        "supervisorDecision": v.supervisor_decision,
        "assignedDate": v.assigned_date,
        "completedDate": v.completed_date,
    }


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
def list_field_verifications(
    projectId: Optional[str] = None,
    project_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    officer_ref: Optional[str] = None,
    db: Session = Depends(get_db),
):
    pid = projectId or project_id
    query = db.query(FieldVerification)
    if pid:
        query = query.filter(FieldVerification.project_id == pid)
    if status_filter:
        query = query.filter(FieldVerification.status == status_filter)
    if officer_ref:
        query = query.filter(FieldVerification.officer_ref == officer_ref)
    cases = query.order_by(FieldVerification.created_at.desc()).all()
    return [format_verification_dict(c) for c in cases]


@router.get("/{verification_id}", response_model=Dict[str, Any])
def get_field_verification(verification_id: str, db: Session = Depends(get_db)):
    case = db.query(FieldVerification).filter(FieldVerification.id == verification_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Verification case {verification_id} not found")
    return format_verification_dict(case)


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_field_verification(c_in: FieldVerificationCreate, db: Session = Depends(get_db)):
    c_id = c_in.id or f"VER-{uuid.uuid4().hex[:4].upper()}"
    case = FieldVerification(
        id=c_id,
        parcel_id=c_in.parcel_id,
        project_id=c_in.project_id,
        officer_ref=c_in.officer_ref,
        officer_name=c_in.officer_name,
        location=c_in.location,
        priority=c_in.priority or "Medium",
        deadline=c_in.deadline,
        status=c_in.status or "Assigned",
        verification_status=c_in.verification_status or "PENDING",
        gps_captured=c_in.gps_captured if c_in.gps_captured is not None else True,
        gps_coordinates=c_in.gps_coordinates,
        photos_count=c_in.photos_count or 0,
        videos_count=c_in.videos_count or 0,
        photo_evidence_ref=c_in.photo_evidence_ref,
        video_evidence_ref=c_in.video_evidence_ref,
        observation=c_in.observation,
        supervisor_decision=c_in.supervisor_decision,
        assigned_date=c_in.assigned_date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        completed_date=c_in.completed_date,
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    log_audit_event(
        db=db,
        project_id=c_in.project_id,
        actor=case.officer_name or case.officer_ref,
        action="FIELD_TASK_ASSIGNED",
        entity="FieldVerification",
        entity_id=c_id,
        label=f"Field verification task created for Parcel {case.parcel_id}",
        category="Verification",
        details=f"Location: {case.location}, Officer: {case.officer_ref}, Priority: {case.priority}",
    )

    return format_verification_dict(case)


@router.put("/{verification_id}", response_model=Dict[str, Any])
def update_field_verification(verification_id: str, c_in: FieldVerificationUpdate, db: Session = Depends(get_db)):
    case = db.query(FieldVerification).filter(FieldVerification.id == verification_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Verification case {verification_id} not found")

    prev_status = case.status
    data = c_in.model_dump(exclude_unset=True)
    for k, v in data.items():
        if hasattr(case, k):
            setattr(case, k, v)

    db.commit()
    db.refresh(case)

    if case.status != prev_status and case.status in ("Verified", "Awaiting Supervisor Verification"):
        # Auto-update parcel verification status if verified
        if case.status == "Verified":
            parcel = db.query(Parcel).filter(Parcel.id == case.parcel_id).first()
            if parcel:
                parcel.verification = "VERIFIED"
                db.commit()

        log_audit_event(
            db=db,
            project_id=case.project_id,
            actor=case.officer_name or case.officer_ref,
            action="FIELD_VERIFIED" if case.status == "Verified" else "FIELD_EVIDENCE_SUBMITTED",
            entity="FieldVerification",
            entity_id=verification_id,
            label=f"Field inspection for Parcel {case.parcel_id} {case.status.lower()}",
            category="Verification",
            details=f"Photos: {case.photos_count}, Videos: {case.videos_count}, Decision: {case.supervisor_decision or 'None'}",
        )

    return format_verification_dict(case)
