from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from backend.app.db.database import get_db
from backend.app.db.models.stakeholder import Stakeholder
from backend.app.db.models.document import Document
from backend.app.schemas.stakeholder import StakeholderCreate, StakeholderUpdate
from backend.app.services.audit_service import log_audit_event

router = APIRouter()


def format_stakeholder_dict(s: Stakeholder) -> Dict[str, Any]:
    return {
        "id": s.id,
        "ref": s.ref,
        "name": s.name or s.ref,
        "projectId": s.project_id,
        "parcelId": s.parcel_id,
        "parcelIds": s.parcel_ids or [s.parcel_id],
        "contactRef": s.contact_ref,
        "status": s.status,
        "responseStatus": s.response_status,
        "notificationStatus": s.notification_status,
        "documentsComplete": s.documents_complete,
        "documentsCount": s.documents_count,
        "documentsRequired": s.documents_required,
        "compensationStatus": s.compensation_status,
        "lastContact": s.last_contact,
        "preferredLanguage": s.preferred_language,
    }


def format_document_dict(d: Document) -> Dict[str, Any]:
    return {
        "id": d.id,
        "parcelId": d.parcel_id,
        "projectId": d.project_id,
        "stakeholderId": d.stakeholder_id,
        "type": d.type,
        "status": d.status,
        "verificationStatus": d.verification_status,
        "uploadedAt": d.uploaded_at.isoformat() if d.uploaded_at else None,
        "fileSize": d.file_size,
        "ocr": d.ocr,
    }


@router.get("/projects/{project_id}/stakeholders", response_model=List[Dict[str, Any]])
def list_project_stakeholders(project_id: str, db: Session = Depends(get_db)):
    stakeholders = db.query(Stakeholder).filter(Stakeholder.project_id == project_id).all()
    return [format_stakeholder_dict(s) for s in stakeholders]


@router.get("/stakeholders/{stakeholder_id}", response_model=Dict[str, Any])
def get_stakeholder(stakeholder_id: str, db: Session = Depends(get_db)):
    s = db.query(Stakeholder).filter(Stakeholder.id == stakeholder_id).first()
    if not s:
        # Also allow lookup by ref
        s = db.query(Stakeholder).filter(Stakeholder.ref == stakeholder_id).first()
    if not s:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Stakeholder {stakeholder_id} not found")
    return format_stakeholder_dict(s)


@router.get("/stakeholders/{stakeholder_id}/documents", response_model=List[Dict[str, Any]])
def get_stakeholder_documents(stakeholder_id: str, db: Session = Depends(get_db)):
    s = db.query(Stakeholder).filter(Stakeholder.id == stakeholder_id).first()
    if not s:
        s = db.query(Stakeholder).filter(Stakeholder.ref == stakeholder_id).first()
    if not s:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Stakeholder {stakeholder_id} not found")

    docs = db.query(Document).filter(
        (Document.stakeholder_id == s.id) |
        (Document.parcel_id == s.parcel_id) |
        (Document.stakeholder_id == s.ref)
    ).all()
    return [format_document_dict(d) for d in docs]


@router.post("/projects/{project_id}/stakeholders", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_stakeholder(project_id: str, s_in: StakeholderCreate, db: Session = Depends(get_db)):
    s_id = s_in.id or f"SH-{uuid.uuid4().hex[:4].upper()}"
    s = Stakeholder(
        id=s_id,
        ref=s_in.ref,
        name=s_in.name,
        project_id=project_id,
        parcel_id=s_in.parcel_id,
        parcel_ids=s_in.parcel_ids or [s_in.parcel_id],
        contact_ref=s_in.contact_ref,
        status=s_in.status,
        response_status=s_in.response_status,
        notification_status=s_in.notification_status,
        documents_complete=s_in.documents_complete,
        documents_count=s_in.documents_count,
        documents_required=s_in.documents_required,
        compensation_status=s_in.compensation_status,
        last_contact=s_in.last_contact,
        preferred_language=s_in.preferred_language,
    )
    db.add(s)
    db.commit()
    db.refresh(s)

    log_audit_event(
        db=db,
        project_id=project_id,
        actor="LAO Division",
        action="STAKEHOLDER_ENROLLED",
        entity="Stakeholder",
        entity_id=s_id,
        label=f"Stakeholder {s.ref} recorded",
        category="Compensation",
        details=f"Parcel: {s.parcel_id}, Status: {s.status}",
    )

    return format_stakeholder_dict(s)


@router.put("/stakeholders/{stakeholder_id}", response_model=Dict[str, Any])
def update_stakeholder(stakeholder_id: str, s_in: StakeholderUpdate, db: Session = Depends(get_db)):
    s = db.query(Stakeholder).filter(Stakeholder.id == stakeholder_id).first()
    if not s:
        s = db.query(Stakeholder).filter(Stakeholder.ref == stakeholder_id).first()
    if not s:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Stakeholder {stakeholder_id} not found")

    prev_notif = s.notification_status
    data = s_in.model_dump(exclude_unset=True)
    for k, v in data.items():
        if hasattr(s, k):
            setattr(s, k, v)

    db.commit()
    db.refresh(s)

    if s.notification_status != prev_notif and s.notification_status in ("SENT", "DELIVERED"):
        log_audit_event(
            db=db,
            project_id=s.project_id,
            actor="LAO Officer",
            action="NOTICE_SENT",
            entity="Stakeholder",
            entity_id=s.id,
            label=f"Statutory Notice dispatched to {s.ref}",
            category="Compensation",
            details=f"Notification status: {s.notification_status}",
        )

    return format_stakeholder_dict(s)
