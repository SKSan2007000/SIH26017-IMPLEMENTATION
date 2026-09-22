from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.db.models.contractor import ContractorWorkPackage, ContractorProgressLog
from backend.app.schemas.operational import (
    ContractorPackageCreateRequest,
    ContractorProgressSubmitRequest,
    ContractorProgressVerifyRequest,
)
from backend.app.services.contractor_service import (
    create_work_package,
    submit_contractor_progress,
    verify_contractor_progress,
)

router = APIRouter(tags=["Contractor Monitoring"])


@router.get("/contractors/packages")
@router.get("/contractors/work-packages")
@router.get("/contractor/packages")
@router.get("/contractor/work-packages")
def api_list_work_packages(
    project_id: Optional[str] = Query(None, description="Optional project filter"),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Lists infrastructure contractor work packages with variance and delay risk."""
    query = db.query(ContractorWorkPackage)
    if project_id:
        query = query.filter(ContractorWorkPackage.project_id == project_id)
    pkgs = query.all()

    return [
        {
            "id": p.id,
            "projectId": p.project_id,
            "contractorName": p.contractor_name,
            "contractorRef": p.contractor_ref,
            "packageName": p.package_name,
            "plannedProgressPct": p.planned_progress_pct,
            "actualProgressPct": p.actual_progress_pct,
            "variancePct": p.variance_pct,
            "status": p.status,
            "delayRisk": p.delay_risk,
            "assignedDate": p.assigned_date,
            "targetDate": p.target_date,
        }
        for p in pkgs
    ]


@router.post("/contractors/packages")
@router.post("/contractor/packages")
def api_create_work_package(
    req: ContractorPackageCreateRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Creates and assigns a new contractor work package."""
    pkg = create_work_package(
        db,
        project_id=req.project_id,
        package_name=req.package_name,
        contractor_name=req.contractor_name,
        planned_progress_pct=req.planned_progress_pct or 0.0,
        target_date=req.target_date,
    )
    return {
        "id": pkg.id,
        "projectId": pkg.project_id,
        "contractorName": pkg.contractor_name,
        "packageName": pkg.package_name,
        "status": pkg.status,
        "plannedProgressPct": pkg.planned_progress_pct,
    }


@router.post("/contractors/packages/{package_id}/progress")
@router.post("/contractor/packages/{package_id}/progress")
def api_submit_progress(
    package_id: str,
    req: ContractorProgressSubmitRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Contractor submits milestone progress with photo/video evidence."""
    return submit_contractor_progress(
        db,
        package_id=package_id,
        reported_progress_pct=req.reported_progress_pct,
        photo_evidence_ref=req.photo_evidence_ref,
        video_evidence_ref=req.video_evidence_ref,
        notes=req.notes,
    )


@router.post("/contractors/logs/{log_id}/verify")
@router.post("/contractor/logs/{log_id}/verify")
def api_verify_progress_log(
    log_id: str,
    req: ContractorProgressVerifyRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Officer inspects and verifies contractor milestone submission."""
    return verify_contractor_progress(
        db,
        log_id=log_id,
        officer_id=req.officer_id,
        decision=req.decision or "VERIFIED",
    )
