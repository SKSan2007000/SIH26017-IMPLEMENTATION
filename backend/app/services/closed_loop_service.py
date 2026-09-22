"""
LandGuard AI — Closed-Loop Risk-to-Action Automation Engine
Implements PREDICT -> ALERT -> ASSIGN -> ACT -> VERIFY -> UPDATE DATA -> RECALCULATE -> MEASURE IMPROVEMENT.
Tracks before/after risk scores, delay reductions, and intervention impact.
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.db.models.project import Project
from backend.app.db.models.parcel import Parcel
from backend.app.db.models.intervention import InterventionRecord
from backend.app.db.models.notification import Notification
from backend.app.db.models.audit import AuditLog
from backend.app.services.risk_service import recalculate_and_persist_project_risk, get_project_live_risk
from backend.app.services.incentive_service import award_officer_points


def execute_closed_loop_intervention(
    db: Session,
    project_id: str,
    action_type: str,
    target_parcel_ids: Optional[List[str]] = None,
    officer_id: Optional[str] = None,
    officer_name: Optional[str] = None,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Executes a corrective intervention, measures before-and-after ML delay risk,
    persists an InterventionRecord, and emits audit + notification events.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # 1. Capture BEFORE Risk Baseline
    risk_before_data = get_project_live_risk(db, project_id)
    risk_before = int(risk_before_data.get("risk_score", risk_before_data.get("overallPct", 75)))
    delay_before = float(risk_before_data.get("expected_delay_months", 4.5))

    # 2. Execute Data Mutation according to Action Type
    action_type_upper = action_type.upper()
    action_title = action_type.replace("_", " ").title()
    category = "General"

    if "DISPUTE" in action_type_upper or "MEDIATION" in action_type_upper:
        category = "Legal & Title"
        action_title = "Fast-Track Special RDO Title Mediation"
        # Resolve disputes on targeted parcels or all disputed parcels
        query = db.query(Parcel).filter(Parcel.project_id == project_id)
        if target_parcel_ids:
            query = query.filter(Parcel.id.in_(target_parcel_ids))
        else:
            query = query.filter(Parcel.disputed == True)

        for p in query.all():
            p.disputed = False
            p.workflow_status = "FIELD_VERIFIED"
            p.verification = "VERIFIED"

    elif "DOCUMENT" in action_type_upper or "OCR" in action_type_upper:
        category = "Documentation"
        action_title = "Automated Cadastral Document Verification & OCR"
        query = db.query(Parcel).filter(Parcel.project_id == project_id)
        if target_parcel_ids:
            query = query.filter(Parcel.id.in_(target_parcel_ids))
        for p in query.all():
            p.documents_complete = p.documents_required or 4
            p.workflow_status = "DOCUMENTS_VERIFIED"

    elif "COMPENSATION" in action_type_upper or "ESCROW" in action_type_upper:
        category = "Compensation"
        action_title = "Section 19/23 Award Finalization & Direct DBT Disbursal"
        query = db.query(Parcel).filter(Parcel.project_id == project_id)
        if target_parcel_ids:
            query = query.filter(Parcel.id.in_(target_parcel_ids))
        for p in query.all():
            p.acquisition_status = "COMPENSATED"
            p.workflow_status = "COMPENSATION_COMPLETED"

    elif "ACQUISITION" in action_type_upper or "POSSESSION" in action_type_upper:
        category = "Acquisition"
        action_title = "Section 38 Statutory Land Possession Handover"
        query = db.query(Parcel).filter(Parcel.project_id == project_id)
        if target_parcel_ids:
            query = query.filter(Parcel.id.in_(target_parcel_ids))
        for p in query.all():
            p.acquisition_status = "POSSESSED"
            p.workflow_status = "ACQUIRED"

    db.commit()

    # 3. Recalculate Live AI ML Risk (AFTER)
    risk_after_data = recalculate_and_persist_project_risk(db, project_id)
    risk_after = int(risk_after_data.get("risk_score", risk_after_data.get("overallPct", 45)))
    delay_after = float(risk_after_data.get("expected_delay_months", 1.8))

    improvement_points = max(0, risk_before - risk_after)
    saved_months = max(0.0, round(delay_before - delay_after, 1))

    now = datetime.now(timezone.utc)

    # 4. Record Intervention History
    intervention = InterventionRecord(
        id=f"INT-{project_id}-{uuid.uuid4().hex[:8].upper()}",
        project_id=project_id,
        action_title=action_title,
        action_category=category,
        risk_before=risk_before,
        risk_after=risk_after,
        delay_before_months=delay_before,
        delay_after_months=delay_after,
        improvement_points=improvement_points,
        officer_id=officer_id or "OFF-LEGAL-01",
        officer_name=officer_name or "Special Land Acquisition Cell",
        status="COMPLETED",
        notes=notes or f"Closed-loop intervention resolved bottlenecks. Risk dropped from {risk_before}% to {risk_after}%.",
        created_at=now,
        completed_at=now,
    )
    db.add(intervention)

    # 5. Award Officer Performance Points
    if officer_id:
        award_officer_points(
            db,
            officer_id=officer_id,
            action_type="DISPUTE_RESOLUTION" if category == "Legal & Title" else "CRITICAL_TASK_COMPLETION",
            project_id=project_id,
            custom_points=20,
            reason=f"Executed closed-loop action '{action_title}' reducing risk by {improvement_points} pts",
        )

    # 6. Record Audit Log
    audit_entry = AuditLog(
        id=f"AUD-INT-{uuid.uuid4().hex[:10]}",
        project_id=project_id,
        actor=officer_name or "Operational Command",
        action="INTERVENTION_COMPLETED",
        entity="Project",
        entity_id=project_id,
        label=f"Intervention: {action_title}",
        category="Risk Assessment",
        details=f"Risk reduced from {risk_before}% to {risk_after}% (-{improvement_points} pts, saved {saved_months} mo)",
        time=now.strftime("%H:%M:%S"),
        date=now.strftime("%Y-%m-%d"),
    )
    db.add(audit_entry)

    # 7. Notification
    notif = Notification(
        id=f"NTF-INT-{uuid.uuid4().hex[:10]}",
        category="Critical Delay Risk",
        type="RISK_RECALCULATED",
        severity="Low",
        message=f"Intervention '{action_title}' completed on {project.name}. Risk reduced: {risk_before}% -> {risk_after}% (-{improvement_points} pts)",
        project_id=project_id,
        recipient="Project Director",
        channel="In-App",
        timestamp=now.isoformat(),
        read=False,
    )
    db.add(notif)

    db.commit()

    return {
        "interventionId": intervention.id,
        "projectId": project_id,
        "actionTitle": action_title,
        "category": category,
        "riskBefore": risk_before,
        "riskAfter": risk_after,
        "improvementPoints": improvement_points,
        "delayBeforeMonths": delay_before,
        "delayAfterMonths": delay_after,
        "savedTimelineMonths": saved_months,
        "officerName": intervention.officer_name,
        "completedAt": now.isoformat(),
    }


def get_project_intervention_history(db: Session, project_id: str) -> List[Dict[str, Any]]:
    """
    Returns historical before/after intervention impact records for a project.
    """
    records = (
        db.query(InterventionRecord)
        .filter(InterventionRecord.project_id == project_id)
        .order_by(InterventionRecord.created_at.desc())
        .all()
    )

    return [
        {
            "id": r.id,
            "projectId": r.project_id,
            "actionTitle": r.action_title,
            "category": r.action_category,
            "riskBefore": r.risk_before,
            "riskAfter": r.risk_after,
            "improvementPoints": r.improvement_points,
            "delayBeforeMonths": r.delay_before_months,
            "delayAfterMonths": r.delay_after_months,
            "officerName": r.officer_name,
            "status": r.status,
            "completedAt": r.completed_at.isoformat() if r.completed_at else None,
        }
        for r in records
    ]
