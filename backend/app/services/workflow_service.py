"""
LandGuard AI — Workflow State Machine Service
Enforces strict 15-state project lifecycle transitions, parcel workflow states,
progress calculations, and audit logging.
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.app.db.models.project import Project
from backend.app.db.models.parcel import Parcel
from backend.app.db.models.audit import AuditLog
from backend.app.db.models.notification import Notification


PROJECT_WORKFLOW_STATES: List[str] = [
    "DRAFT",
    "PLANNING",
    "ROUTE_ANALYSIS",
    "ROUTE_APPROVAL",
    "LAND_IDENTIFICATION",
    "STAKEHOLDER_NOTIFICATION",
    "FIELD_VERIFICATION",
    "DOCUMENT_VERIFICATION",
    "COMPENSATION",
    "ACQUISITION",
    "CONSTRUCTION",
    "MONITORING",
    "FINAL_VERIFICATION",
    "COMPLETED",
    "CLOSED",
]

# Valid transition map (Source -> Allowed Destinations)
VALID_PROJECT_TRANSITIONS: Dict[str, List[str]] = {
    "DRAFT": ["PLANNING"],
    "PLANNING": ["ROUTE_ANALYSIS"],
    "ROUTE_ANALYSIS": ["ROUTE_APPROVAL", "PLANNING"],
    "ROUTE_APPROVAL": ["LAND_IDENTIFICATION", "ROUTE_ANALYSIS"],
    "LAND_IDENTIFICATION": ["STAKEHOLDER_NOTIFICATION", "ROUTE_APPROVAL"],
    "STAKEHOLDER_NOTIFICATION": ["FIELD_VERIFICATION", "LAND_IDENTIFICATION"],
    "FIELD_VERIFICATION": ["DOCUMENT_VERIFICATION", "STAKEHOLDER_NOTIFICATION"],
    "DOCUMENT_VERIFICATION": ["COMPENSATION", "FIELD_VERIFICATION"],
    "COMPENSATION": ["ACQUISITION", "DOCUMENT_VERIFICATION"],
    "ACQUISITION": ["CONSTRUCTION", "COMPENSATION"],
    "CONSTRUCTION": ["MONITORING", "ACQUISITION"],
    "MONITORING": ["FINAL_VERIFICATION", "CONSTRUCTION"],
    "FINAL_VERIFICATION": ["COMPLETED", "MONITORING"],
    "COMPLETED": ["CLOSED"],
    "CLOSED": [],
}

PARCEL_WORKFLOW_STATES: List[str] = [
    "IDENTIFIED",
    "NOTICE_PENDING",
    "NOTICE_SENT",
    "OWNER_RESPONDED",
    "FIELD_VERIFICATION_PENDING",
    "FIELD_VERIFIED",
    "DOCUMENTS_PENDING",
    "DOCUMENTS_VERIFIED",
    "COMPENSATION_PENDING",
    "COMPENSATION_COMPLETED",
    "ACQUISITION_PENDING",
    "ACQUIRED",
    "DISPUTED",
    "ON_HOLD",
]

# Progress mapping according to project workflow states
STATE_PROGRESS_MAP: Dict[str, Tuple[float, float, float]] = {
    # (overall_progress, land_acq_progress, construction_progress)
    "DRAFT": (0.0, 0.0, 0.0),
    "PLANNING": (5.0, 0.0, 0.0),
    "ROUTE_ANALYSIS": (15.0, 5.0, 0.0),
    "ROUTE_APPROVAL": (25.0, 10.0, 0.0),
    "LAND_IDENTIFICATION": (35.0, 20.0, 0.0),
    "STAKEHOLDER_NOTIFICATION": (45.0, 35.0, 0.0),
    "FIELD_VERIFICATION": (55.0, 50.0, 0.0),
    "DOCUMENT_VERIFICATION": (65.0, 65.0, 0.0),
    "COMPENSATION": (75.0, 80.0, 0.0),
    "ACQUISITION": (85.0, 95.0, 5.0),
    "CONSTRUCTION": (90.0, 100.0, 30.0),
    "MONITORING": (93.0, 100.0, 65.0),
    "FINAL_VERIFICATION": (97.0, 100.0, 90.0),
    "COMPLETED": (100.0, 100.0, 100.0),
    "CLOSED": (100.0, 100.0, 100.0),
}


def transition_project_state(
    db: Session,
    project_id: str,
    target_state: str,
    actor_name: str = "Project Director",
    actor_role: str = "PROJECT_HEAD",
    notes: Optional[str] = None,
    force: bool = False,
) -> Dict[str, Any]:
    """
    Transitions a project to a new workflow state, validating state machine rules,
    updating progress metrics, creating an AuditLog entry, and emitting a notification.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    target_state = target_state.upper()
    if target_state not in PROJECT_WORKFLOW_STATES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid target state '{target_state}'. Must be one of {PROJECT_WORKFLOW_STATES}",
        )

    current_state = (project.workflow_state or "PLANNING").upper()

    # Validate transition
    allowed = VALID_PROJECT_TRANSITIONS.get(current_state, [])
    if not force and target_state != current_state and target_state not in allowed:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid workflow transition: Cannot move from '{current_state}' to '{target_state}'. "
                f"Allowed transitions: {allowed}"
            ),
        )

    old_state = current_state
    project.workflow_state = target_state

    # Update progress metrics
    progress_tuple = STATE_PROGRESS_MAP.get(target_state, (project.overall_progress, project.land_acquisition_progress, project.construction_progress))
    project.overall_progress = progress_tuple[0]
    project.land_acquisition_progress = progress_tuple[1]
    project.construction_progress = progress_tuple[2]

    # Map to legacy stage index for backwards compatibility with UI
    stage_idx = min(len(PROJECT_WORKFLOW_STATES) - 1, PROJECT_WORKFLOW_STATES.index(target_state))
    project.current_stage_index = min(8, stage_idx)

    # Record immutable audit log
    audit_entry = AuditLog(
        id=f"AUD-WF-{uuid.uuid4().hex[:10]}",
        project_id=project_id,
        actor=actor_name,
        action="PROJECT_STATE_TRANSITION",
        entity="Project",
        entity_id=project_id,
        label=f"Workflow Transition: {old_state} -> {target_state}",
        category="System",
        details=notes or f"Project state transitioned by {actor_name} ({actor_role})",
        time=datetime.now(timezone.utc).strftime("%H:%M:%S"),
        date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    )
    db.add(audit_entry)

    # Emit notification
    notif = Notification(
        id=f"NTF-WF-{uuid.uuid4().hex[:10]}",
        category="System",
        type="PROJECT_STATE_CHANGED",
        severity="Medium" if target_state not in ["COMPLETED", "CLOSED"] else "Low",
        message=f"Project {project.name} advanced to state: {target_state}",
        project_id=project_id,
        recipient="Project Team",
        channel="In-App",
        timestamp=datetime.now(timezone.utc).isoformat(),
        read=False,
    )
    db.add(notif)

    db.commit()
    db.refresh(project)

    return {
        "projectId": project.id,
        "projectName": project.name,
        "previousState": old_state,
        "currentState": project.workflow_state,
        "overallProgress": project.overall_progress,
        "landAcquisitionProgress": project.land_acquisition_progress,
        "constructionProgress": project.construction_progress,
        "transitionTimestamp": datetime.now(timezone.utc).isoformat(),
        "auditLogId": audit_entry.id,
    }


def update_parcel_workflow_status(
    db: Session,
    parcel_id: str,
    target_status: str,
    actor_name: str = "Land Acquisition Officer",
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Updates the acquisition workflow status of a single cadastral parcel.
    Synchronizes legacy verification/acquisition_status and records audit logs.
    """
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel {parcel_id} not found")

    target_status = target_status.upper()
    if target_status not in PARCEL_WORKFLOW_STATES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid parcel status '{target_status}'. Must be one of {PARCEL_WORKFLOW_STATES}",
        )

    old_status = parcel.workflow_status or "IDENTIFIED"
    parcel.workflow_status = target_status

    # Synchronize legacy columns for backwards compatibility with GIS
    if target_status in ["FIELD_VERIFIED", "DOCUMENTS_VERIFIED", "ACQUIRED"]:
        parcel.verification = "VERIFIED"
    elif target_status == "DISPUTED":
        parcel.disputed = True
        parcel.verification = "REJECTED"
    elif target_status in ["NOTICE_SENT", "OWNER_RESPONDED"]:
        parcel.notification_status = "SENT"
        if target_status == "OWNER_RESPONDED":
            parcel.response_status = "RECEIVED"

    if target_status == "COMPENSATION_COMPLETED":
        parcel.acquisition_status = "COMPENSATED"
    elif target_status == "ACQUIRED":
        parcel.acquisition_status = "POSSESSED"
        parcel.impact = "affected"

    # Audit log
    audit_entry = AuditLog(
        id=f"AUD-P-{uuid.uuid4().hex[:10]}",
        project_id=parcel.project_id,
        actor=actor_name,
        action="PARCEL_STATUS_UPDATE",
        entity="Parcel",
        entity_id=parcel_id,
        label=f"Parcel {parcel_id} Status: {old_status} -> {target_status}",
        category="Verification",
        details=notes or f"Parcel status updated to {target_status} by {actor_name}",
        time=datetime.now(timezone.utc).strftime("%H:%M:%S"),
        date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    )
    db.add(audit_entry)

    db.commit()
    db.refresh(parcel)

    return {
        "parcelId": parcel.id,
        "projectId": parcel.project_id,
        "previousStatus": old_status,
        "currentStatus": parcel.workflow_status,
        "verification": parcel.verification,
        "acquisitionStatus": parcel.acquisition_status,
        "disputed": parcel.disputed,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }


def calculate_project_actual_progress(db: Session, project_id: str) -> Dict[str, Any]:
    """
    Calculates dynamic project progress based on real cadastral parcel completions,
    contractor work package logs, and workflow state.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    parcels = db.query(Parcel).filter(Parcel.project_id == project_id).all()
    total_parcels = len(parcels)

    if total_parcels > 0:
        verified_count = sum(1 for p in parcels if p.workflow_status in ["FIELD_VERIFIED", "DOCUMENTS_VERIFIED", "COMPENSATION_COMPLETED", "ACQUIRED"])
        compensated_count = sum(1 for p in parcels if p.workflow_status in ["COMPENSATION_COMPLETED", "ACQUIRED"])
        acquired_count = sum(1 for p in parcels if p.workflow_status == "ACQUIRED")
        disputed_count = sum(1 for p in parcels if p.workflow_status == "DISPUTED" or p.disputed)

        acq_pct = round((acquired_count * 0.5 + compensated_count * 0.3 + verified_count * 0.2) / total_parcels * 100.0, 1)
    else:
        acq_pct = 20.0
        disputed_count = 0

    # Base workflow state progress
    base_overall, base_acq, base_const = STATE_PROGRESS_MAP.get(project.workflow_state or "PLANNING", (25.0, 30.0, 0.0))

    final_acq_pct = round(max(base_acq, acq_pct), 1)
    final_const_pct = round(project.construction_progress or base_const, 1)
    final_overall_pct = round((final_acq_pct * 0.6) + (final_const_pct * 0.4), 1)

    project.overall_progress = final_overall_pct
    project.land_acquisition_progress = final_acq_pct
    project.construction_progress = final_const_pct
    db.commit()

    return {
        "projectId": project.id,
        "workflowState": project.workflow_state,
        "overallProgressPct": final_overall_pct,
        "landAcquisitionProgressPct": final_acq_pct,
        "constructionProgressPct": final_const_pct,
        "totalParcels": total_parcels,
        "disputedParcels": disputed_count,
    }
