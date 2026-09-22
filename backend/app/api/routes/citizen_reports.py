from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from backend.app.db.database import get_db
from backend.app.db.models.citizen_report import CitizenReport
from backend.app.schemas.citizen_report import CitizenReportCreate, CitizenReportUpdate
from backend.app.services.audit_service import log_audit_event

router = APIRouter()


def format_report_dict(r: CitizenReport) -> Dict[str, Any]:
    return {
        "id": r.id,
        "projectId": r.project_id,
        "location": r.location,
        "description": r.description,
        "category": r.category,
        "reportType": r.report_type or r.category,
        "citizenRef": r.citizen_ref or "DEMO CITIZEN",
        "hasPhoto": r.has_photo,
        "hasVideo": r.has_video,
        "status": r.status,
        "submittedAt": r.submitted_at,
        "timestamp": r.submitted_at,
        "responseNote": r.response_note,
    }


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
def list_citizen_reports(
    project_id: Optional[str] = None,
    category: Optional[str] = None,
    report_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(CitizenReport)
    if project_id:
        query = query.filter(CitizenReport.project_id == project_id)
    cat = category or report_type
    if cat:
        query = query.filter((CitizenReport.category == cat) | (CitizenReport.report_type == cat))
    reports = query.order_by(CitizenReport.created_at.desc()).all()
    return [format_report_dict(r) for r in reports]


@router.get("/{report_id}", response_model=Dict[str, Any])
def get_citizen_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(CitizenReport).filter(CitizenReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Citizen report {report_id} not found")
    return format_report_dict(report)


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_citizen_report(r_in: CitizenReportCreate, db: Session = Depends(get_db)):
    r_id = r_in.id or f"CR-{uuid.uuid4().hex[:4].upper()}"
    ts = r_in.submitted_at or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    report = CitizenReport(
        id=r_id,
        project_id=r_in.project_id,
        location=r_in.location,
        description=r_in.description,
        category=r_in.category or r_in.report_type or "Boundary Grievance",
        report_type=r_in.report_type or r_in.category or "Boundary Grievance",
        citizen_ref=r_in.citizen_ref or "DEMO CITIZEN",
        has_photo=r_in.has_photo or False,
        has_video=r_in.has_video or False,
        status=r_in.status or "Submitted",
        submitted_at=ts,
        response_note=r_in.response_note,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    if report.project_id:
        log_audit_event(
            db=db,
            project_id=report.project_id,
            actor=report.citizen_ref or "Citizen Portal",
            action="CITIZEN_GRIEVANCE_SUBMITTED",
            entity="CitizenReport",
            entity_id=r_id,
            label=f"Citizen report: {report.category}",
            category="System",
            details=f"Location: {report.location}, Description: {report.description[:60]}...",
        )

    return format_report_dict(report)


@router.put("/{report_id}", response_model=Dict[str, Any])
def update_citizen_report(report_id: str, r_in: CitizenReportUpdate, db: Session = Depends(get_db)):
    report = db.query(CitizenReport).filter(CitizenReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Citizen report {report_id} not found")

    data = r_in.model_dump(exclude_unset=True)
    for k, v in data.items():
        if hasattr(report, k):
            setattr(report, k, v)

    db.commit()
    db.refresh(report)
    return format_report_dict(report)
