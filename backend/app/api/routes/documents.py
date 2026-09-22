from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from backend.app.db.database import get_db
from backend.app.db.models.document import Document
from backend.app.db.models.parcel import Parcel
from backend.app.schemas.document import DocumentCreate, DocumentUpdate
from backend.app.services.audit_service import log_audit_event

router = APIRouter()


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


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
def list_documents(
    project_id: Optional[str] = None,
    parcel_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Document)
    if project_id:
        query = query.filter(Document.project_id == project_id)
    if parcel_id:
        query = query.filter(Document.parcel_id == parcel_id)
    if status_filter:
        query = query.filter(Document.status == status_filter)
    docs = query.order_by(Document.uploaded_at.desc()).all()
    return [format_document_dict(d) for d in docs]


@router.get("/{document_id}", response_model=Dict[str, Any])
def get_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document {document_id} not found")
    return format_document_dict(doc)


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_document(doc_in: DocumentCreate, db: Session = Depends(get_db)):
    d_id = doc_in.id or f"DOC-{uuid.uuid4().hex[:4].upper()}"

    # Auto-resolve project_id from parcel if not provided
    p_id = doc_in.project_id
    if not p_id:
        parcel = db.query(Parcel).filter(Parcel.id == doc_in.parcel_id).first()
        if parcel:
            p_id = parcel.project_id

    doc = Document(
        id=d_id,
        parcel_id=doc_in.parcel_id,
        project_id=p_id,
        stakeholder_id=doc_in.stakeholder_id,
        type=doc_in.type or "Ownership",
        status=doc_in.status or "Uploaded",
        verification_status=doc_in.verification_status or "PENDING",
        file_size=doc_in.file_size or "2.4 MB",
        ocr=doc_in.ocr,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    if p_id:
        log_audit_event(
            db=db,
            project_id=p_id,
            actor="LAO Officer",
            action="DOCUMENT_UPLOADED",
            entity="Document",
            entity_id=d_id,
            label=f"{doc.type} Document uploaded for Parcel {doc.parcel_id}",
            category="Document Review",
            details=f"File size: {doc.file_size}, Status: {doc.status}",
        )

    return format_document_dict(doc)


@router.put("/{document_id}", response_model=Dict[str, Any])
def update_document(document_id: str, doc_in: DocumentUpdate, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document {document_id} not found")

    data = doc_in.model_dump(exclude_unset=True)
    for k, v in data.items():
        if hasattr(doc, k):
            setattr(doc, k, v)

    db.commit()
    db.refresh(doc)

    if doc.project_id:
        log_audit_event(
            db=db,
            project_id=doc.project_id,
            actor="Document Officer",
            action="DOCUMENT_VERIFIED" if doc.status == "Verified" else "DOCUMENT_UPDATED",
            entity="Document",
            entity_id=document_id,
            label=f"Document {document_id} status changed to {doc.status}",
            category="Document Review",
            details=f"Verification status: {doc.verification_status}",
        )

    return format_document_dict(doc)
