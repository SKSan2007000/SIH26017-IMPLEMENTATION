from datetime import datetime, timezone
import os
import uuid
import shutil
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.db.models.field_verification import FieldVerification
from backend.app.db.models.government_alert import GovernmentAlert
from backend.app.db.models.stakeholder_benefit import StakeholderBenefitRecord
from backend.app.schemas.operational import (
    OfficerAutoAssignRequest,
    TaskAcceptRequest,
    TaskCompleteRequest,
    TaskSupervisorReviewRequest,
    TaskEscalateRequest,
    OfficerAwardPointsRequest,
    ClosedLoopInterventionRequest,
    ClosedLoopInterventionResponse,
    StakeholderBenefitCreateRequest,
)
from backend.app.services.assignment_service import (
    assign_field_task_automatically,
    get_officers_workload_status,
    assign_project_officers_automatically,
)
from backend.app.services.escalation_service import check_and_escalate_task, scan_and_process_all_overdue_tasks
from backend.app.services.incentive_service import award_officer_points, get_officer_leaderboard
from backend.app.services.closed_loop_service import execute_closed_loop_intervention, get_project_intervention_history
from backend.app.services.daily_ops_service import get_todays_operations_queue, generate_daily_executive_reports
from backend.app.services.workflow_service import update_parcel_workflow_status

router = APIRouter(prefix="/operations", tags=["Daily Operations & Automation"])

EVIDENCE_UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "uploads", "evidence"))
os.makedirs(EVIDENCE_UPLOAD_DIR, exist_ok=True)


# 1. DAILY OPERATIONS QUEUE & REPORTS
@router.get("/today")
def api_get_todays_operations(
    project_id: Optional[str] = Query(None, description="Optional project filter"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Returns Today's Operations queue (Critical, High, Pending, Overdue, Completed)."""
    return get_todays_operations_queue(db, project_id=project_id)


@router.get("/daily-summary")
def api_get_daily_summary(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Generates structured daily executive operational reports."""
    return generate_daily_executive_reports(db)


# 2. AUTOMATIC OFFICER ALLOCATION & WORKLOAD DIRECTORY
@router.get("/officers/workload-status")
def api_get_officers_workload_status(
    max_capacity: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Returns officer cadre workload balancing directory with capacity statuses."""
    return get_officers_workload_status(db, max_capacity=max_capacity)


@router.post("/projects/{project_id}/auto-assign-officers")
def api_auto_assign_project_officers(
    project_id: str,
    district: Optional[str] = Query(None),
    zone: Optional[str] = Query(None),
    max_capacity: int = Query(5),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """AI assigns local officers (Field, Supervisor, LAO) to an entire project with workload balancing."""
    return assign_project_officers_automatically(
        db, project_id=project_id, district=district, zone=zone, max_capacity=max_capacity
    )


@router.post("/assignments/auto")
def api_auto_assign_field_task(
    req: OfficerAutoAssignRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Automatically assigns a field verification task to the optimal local officer."""
    task = assign_field_task_automatically(
        db,
        parcel_id=req.parcel_id,
        project_id=req.project_id,
        location=req.location,
        priority=req.priority or "Medium",
        district=req.district,
        zone=req.zone,
        coords=req.coords,
        task_type=req.task_type or "FIELD_VERIFICATION",
        custom_sla_seconds=req.custom_sla_seconds,
    )
    return {
        "taskId": task.id,
        "parcelId": task.parcel_id,
        "projectId": task.project_id,
        "assignedOfficer": task.officer_name,
        "officerRef": task.officer_ref,
        "officerZone": task.officer_zone,
        "officerDistrict": task.officer_district,
        "proximityKm": task.proximity_km,
        "allocationReason": task.allocation_reason,
        "priority": task.priority,
        "deadline": task.deadline,
        "status": task.status,
        "slaSecondsAllowed": task.sla_seconds_allowed,
    }


@router.post("/tasks/{task_id}/upload-evidence")
async def api_upload_task_evidence(
    task_id: str,
    file: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    observation: Optional[str] = Form(None),
    officer_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Uploads real photo evidence, saves file to disk, records GPS and metadata."""
    task = db.query(FieldVerification).filter(FieldVerification.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    ext = os.path.splitext(file.filename or "evidence.jpg")[1]
    saved_filename = f"evidence_{task_id}_{uuid.uuid4().hex[:6]}{ext}"
    saved_path = os.path.join(EVIDENCE_UPLOAD_DIR, saved_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size_kb = round(os.path.getsize(saved_path) / 1024, 1)
    now = datetime.now(timezone.utc)

    # Update task record
    task.photo_evidence_ref = f"/uploads/evidence/{saved_filename}"
    task.photos_count = (task.photos_count or 0) + 1
    if latitude is not None and longitude is not None:
        task.gps_captured = True
        task.gps_coordinates = [longitude, latitude]
    if observation:
        task.observation = observation

    db.commit()
    db.refresh(task)

    return {
        "taskId": task.id,
        "filename": saved_filename,
        "fileUrl": task.photo_evidence_ref,
        "fileSizeKb": file_size_kb,
        "gpsCoordinates": task.gps_coordinates,
        "photosCount": task.photos_count,
        "uploadedAt": now.isoformat(),
        "status": "SUCCESS",
    }


@router.post("/tasks/{task_id}/reassign")
def api_reassign_task(
    task_id: str,
    reason: Optional[str] = Query("Officer unavailable / reassignment requested"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Reassigns a field verification task to an available alternate officer."""
    from backend.app.services.assignment_service import reassign_field_task
    task = reassign_field_task(db, task_id=task_id, reason=reason)
    return {
        "taskId": task.id,
        "assignedOfficer": task.officer_name,
        "officerRef": task.officer_ref,
        "officerZone": task.officer_zone,
        "officerDistrict": task.officer_district,
        "allocationReason": task.allocation_reason,
        "status": task.status,
    }


# 3. TASK ACCEPTANCE, COMPLETION, REVIEW & ESCALATION
@router.post("/tasks/{task_id}/accept")
def api_accept_task(
    task_id: str,
    req: TaskAcceptRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Officer accepts assigned task and starts SLA response timer."""
    task = db.query(FieldVerification).filter(FieldVerification.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    now = datetime.now(timezone.utc)
    task.accepted_at = now
    task.status = "In Progress"
    task.verification_status = "IN_PROGRESS"

    # Calculate response time
    if task.task_created_at:
        created_utc = task.task_created_at.replace(tzinfo=timezone.utc if task.task_created_at.tzinfo is None else None)
        task.response_time_seconds = round((now - created_utc).total_seconds(), 1)

    db.commit()
    return {
        "taskId": task.id,
        "status": task.status,
        "acceptedAt": now.isoformat(),
        "responseTimeSeconds": task.response_time_seconds,
    }


@router.post("/tasks/{task_id}/complete")
def api_complete_task(
    task_id: str,
    req: TaskCompleteRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Officer submits field evidence (GPS, photos, observations) and completes task."""
    task = db.query(FieldVerification).filter(FieldVerification.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    now = datetime.now(timezone.utc)
    task.completed_at = now
    task.status = "Awaiting Supervisor Verification"
    task.verification_status = "PENDING"
    task.completed_date = now.strftime("%Y-%m-%d")

    if req.gps_coordinates:
        task.gps_captured = True
        task.gps_coordinates = req.gps_coordinates
    if req.photo_evidence_ref:
        task.photo_evidence_ref = req.photo_evidence_ref
        task.photos_count = (task.photos_count or 0) + 1
    if req.video_evidence_ref:
        task.video_evidence_ref = req.video_evidence_ref
        task.videos_count = (task.videos_count or 0) + 1
    if req.observation:
        task.observation = req.observation

    # Calculate completion time & SLA compliance
    if task.task_created_at:
        created_utc = task.task_created_at.replace(tzinfo=timezone.utc if task.task_created_at.tzinfo is None else None)
        task.completion_time_seconds = round((now - created_utc).total_seconds(), 1)
        if task.sla_seconds_allowed and task.completion_time_seconds > task.sla_seconds_allowed:
            task.sla_status = "BREACHED"
        else:
            task.sla_status = "ON_TIME"

    db.commit()

    return {
        "taskId": task.id,
        "status": task.status,
        "completedAt": now.isoformat(),
        "completionTimeSeconds": task.completion_time_seconds,
        "slaStatus": task.sla_status,
        "gpsCaptured": task.gps_captured,
        "photoEvidenceRef": task.photo_evidence_ref,
    }


@router.post("/tasks/{task_id}/review")
def api_supervisor_review(
    task_id: str,
    req: TaskSupervisorReviewRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Supervisor reviews and signs off on field verification submission."""
    task = db.query(FieldVerification).filter(FieldVerification.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    decision = req.decision.upper()
    task.supervisor_decision = decision

    if decision == "APPROVED":
        task.status = "Verified"
        task.verification_status = "VERIFIED"
        # Update parcel status
        update_parcel_workflow_status(db, task.parcel_id, "FIELD_VERIFIED", actor_name=f"Supervisor ({req.supervisor_id})")
        # Award officer performance points
        award_officer_points(
            db,
            officer_id=task.officer_ref,
            action_type="ON_TIME_VERIFICATION" if task.sla_status == "ON_TIME" else "VALID_EVIDENCE",
            task_id=task.id,
            project_id=task.project_id,
            custom_points=15 if task.priority in ["High", "Critical"] else 10,
        )
    elif decision == "REJECTED":
        task.status = "Assigned"
        task.verification_status = "REJECTED"
        award_officer_points(db, officer_id=task.officer_ref, action_type="REJECTED_VERIFICATION", task_id=task.id, project_id=task.project_id)
    else:  # REVISIT_REQUESTED
        task.status = "Revisit Requested"

    db.commit()
    db.refresh(task)

    return {
        "taskId": task.id,
        "supervisorDecision": task.supervisor_decision,
        "status": task.status,
        "verificationStatus": task.verification_status,
    }


@router.post("/tasks/{task_id}/escalate")
def api_escalate_task(
    task_id: str,
    req: TaskEscalateRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Manually or rule-based escalation of a task up the 4-tier hierarchy."""
    return check_and_escalate_task(
        db,
        task_id=task_id,
        trigger_reason=req.trigger_reason or "MANUAL_ESCALATION",
        custom_details=req.custom_details,
    )


@router.post("/tasks/scan-overdue")
def api_scan_overdue_tasks(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Scans all active tasks and escalates overdue cases."""
    results = scan_and_process_all_overdue_tasks(db)
    return {
        "scannedAt": datetime.now(timezone.utc).isoformat(),
        "escalatedCount": len(results),
        "escalations": results,
    }


# 4. OFFICER LEADERBOARD & INCENTIVES
@router.get("/officers/leaderboard")
def api_get_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Returns ranked operational officer leaderboard."""
    return get_officer_leaderboard(db, limit=limit)


@router.post("/officers/award-points")
def api_award_points(
    req: OfficerAwardPointsRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Manually or rule-based point awards to an officer profile."""
    return award_officer_points(
        db,
        officer_id=req.officer_id if hasattr(req, "officer_id") else "OFF-DEMO-01",
        action_type=req.action_type,
        task_id=req.task_id,
        project_id=req.project_id,
        custom_points=req.custom_points,
        reason=req.reason,
    )


# 5. CLOSED-LOOP RISK TO ACTION AUTOMATION
@router.post("/closed-loop/intervene", response_model=ClosedLoopInterventionResponse)
def api_execute_intervention(
    req: ClosedLoopInterventionRequest,
    db: Session = Depends(get_db),
):
    """Executes a closed-loop corrective action, measures before/after risk, and persists history."""
    return execute_closed_loop_intervention(
        db,
        project_id=req.project_id if hasattr(req, "project_id") else "PRJ-1042",
        action_type=req.action_type,
        target_parcel_ids=req.target_parcel_ids,
        officer_id=req.officer_id,
        officer_name=req.officer_name,
        notes=req.notes,
    )


@router.get("/closed-loop/history/{project_id}")
def api_get_intervention_history(
    project_id: str,
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Returns before/after risk intervention history demonstrating measurable impact."""
    return get_project_intervention_history(db, project_id)


# 6. GOVERNMENT ALERTS
@router.get("/alerts/government")
def api_get_government_alerts(
    status: Optional[str] = Query(None, description="Filter by 'ACTIVE' | 'RESOLVED'"),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Returns authority-level government escalation alerts."""
    query = db.query(GovernmentAlert)
    if status:
        query = query.filter(GovernmentAlert.status == status.upper())
    alerts = query.order_by(GovernmentAlert.created_at.desc()).all()

    return [
        {
            "id": a.id,
            "projectId": a.project_id,
            "projectName": a.project_name,
            "riskScore": a.risk_score,
            "reason": a.reason,
            "affectedArea": a.affected_area,
            "affectedParcelsCount": a.affected_parcels_count,
            "affectedPopulation": a.affected_population,
            "recommendedAction": a.recommended_action,
            "responsibleAuthority": a.responsible_authority,
            "severity": a.severity,
            "status": a.status,
            "demoFlag": a.demo_flag,
            "createdAt": a.created_at.isoformat() if a.created_at else None,
        }
        for a in alerts
    ]


# 7. STAKEHOLDER BENEFIT / PARTICIPATION
@router.post("/benefits/register")
def api_register_stakeholder_benefit(
    req: StakeholderBenefitCreateRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Registers a stakeholder for demo project participation / work package."""
    now = datetime.now(timezone.utc)
    rec = StakeholderBenefitRecord(
        id=f"BEN-{req.stakeholder_id}-{now.strftime('%H%M%S')}",
        stakeholder_id=req.stakeholder_id,
        project_id=req.project_id,
        owner_ref=req.owner_ref,
        category=req.category or "Field Support",
        status="ACTIVE",
        stipend_amount_inr=req.stipend_amount_inr or 15000.0,
        start_date=req.start_date or now.strftime("%Y-%m-%d"),
        end_date=req.end_date,
        notes=req.notes or "Local survey & field logistics facilitation participation",
        created_at=now,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return {
        "benefitId": rec.id,
        "stakeholderId": rec.stakeholder_id,
        "ownerRef": rec.owner_ref,
        "benefitType": rec.benefit_type,
        "category": rec.category,
        "status": rec.status,
        "stipendAmountInr": rec.stipend_amount_inr,
        "registeredAt": now.isoformat(),
    }


@router.get("/benefits")
def api_list_benefits(
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Lists stakeholder participation / employment benefits."""
    query = db.query(StakeholderBenefitRecord)
    if project_id:
        query = query.filter(StakeholderBenefitRecord.project_id == project_id)
    records = query.all()

    return [
        {
            "id": b.id,
            "stakeholderId": b.stakeholder_id,
            "projectId": b.project_id,
            "ownerRef": b.owner_ref,
            "benefitType": b.benefit_type,
            "category": b.category,
            "status": b.status,
            "stipendAmountInr": b.stipend_amount_inr,
            "startDate": b.start_date,
            "createdAt": b.created_at.isoformat() if b.created_at else None,
        }
        for b in records
    ]


# 8. SAFE DEMONSTRATION RESET
@router.post("/demo/reset")
def api_reset_demo_data(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Safely resets and reseeds the demonstration dataset with clean synthetic state.
    Restricted for competition judging and live demonstration purposes.
    """
    from backend.app.db.seed import seed_database
    seed_database(db, force=True)
    return {
        "status": "SUCCESS",
        "message": "Demo database successfully reset and re-seeded with pristine state.",
        "demoFlag": "DEMO / SIMULATION MODE",
        "resetTimestamp": datetime.now(timezone.utc).isoformat(),
    }
