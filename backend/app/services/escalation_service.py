"""
LandGuard AI — SLA Timer & 4-Tier Escalation Engine
Monitors task response timers, detects SLA breaches, and executes multi-tier
authority escalations (Officer -> Supervisor -> District Officer -> Project Head).
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.app.db.models.field_verification import FieldVerification
from backend.app.db.models.notification import Notification
from backend.app.db.models.audit import AuditLog
from backend.app.db.models.government_alert import GovernmentAlert
from backend.app.db.models.project import Project


ESCALATION_HIERARCHY = [
    "NONE",
    "SUPERVISOR",
    "DISTRICT_OFFICER",
    "PROJECT_HEAD",
]

ESCALATION_TARGET_ROLES = {
    "SUPERVISOR": "Cadastral Supervisor (Review)",
    "DISTRICT_OFFICER": "District Collector / Special DRO",
    "PROJECT_HEAD": "Project Director & SLAC Secretariat",
}


def check_and_escalate_task(
    db: Session,
    task_id: str,
    trigger_reason: str = "SLA_BREACH",
    custom_details: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Evaluates a specific task for SLA breach or operational escalation trigger,
    advances the escalation level up the hierarchy, creates notifications and audit logs.
    """
    task = db.query(FieldVerification).filter(FieldVerification.id == task_id).first()
    if not task:
        return {"error": f"Task {task_id} not found"}

    now = datetime.now(timezone.utc)
    current_level = task.escalation_level or "NONE"
    curr_idx = ESCALATION_HIERARCHY.index(current_level) if current_level in ESCALATION_HIERARCHY else 0

    next_idx = min(len(ESCALATION_HIERARCHY) - 1, curr_idx + 1)
    next_level = ESCALATION_HIERARCHY[next_idx]

    task.escalation_level = next_level
    task.escalated_at = now
    task.escalation_reason = trigger_reason
    task.sla_status = "BREACHED"

    target_recipient = ESCALATION_TARGET_ROLES.get(next_level, "Senior Authority")

    # 1. Create Escalation Notification
    notif = Notification(
        id=f"NTF-ESC-{uuid.uuid4().hex[:10]}",
        category="Critical Delay Risk",
        type="ESCALATION",
        severity="Critical" if next_level in ["DISTRICT_OFFICER", "PROJECT_HEAD"] else "High",
        message=(
            f"[ESCALATION LEVEL {next_idx}: {next_level}] Task {task.id} on parcel {task.parcel_id} "
            f"escalated to {target_recipient}. Trigger: {trigger_reason}."
        ),
        project_id=task.project_id,
        parcel_id=task.parcel_id,
        recipient=target_recipient,
        channel="In-App",
        timestamp=now.isoformat(),
        read=False,
    )
    db.add(notif)

    # 2. Record Immutable Audit Log
    audit_entry = AuditLog(
        id=f"AUD-ESC-{uuid.uuid4().hex[:10]}",
        project_id=task.project_id,
        actor="Automated Escalation Engine",
        action="ESCALATED",
        entity="FieldVerification",
        entity_id=task.id,
        label=f"Escalated to {next_level}: {trigger_reason}",
        category="System",
        details=custom_details or f"Task escalated from {current_level} to {next_level}. Trigger: {trigger_reason}",
        time=now.strftime("%H:%M:%S"),
        date=now.strftime("%Y-%m-%d"),
    )
    db.add(audit_entry)

    # 3. If escalated to PROJECT_HEAD or critical trigger, create a Government Alert
    gov_alert_id = None
    if next_level in ["DISTRICT_OFFICER", "PROJECT_HEAD"] or trigger_reason == "CRITICAL_AI_RISK":
        project = db.query(Project).filter(Project.id == task.project_id).first()
        prj_name = project.name if project else "Infrastructure Corridor"
        gov_alert = GovernmentAlert(
            id=f"GOV-ALT-{uuid.uuid4().hex[:10]}",
            project_id=task.project_id,
            project_name=prj_name,
            risk_score=85,
            reason=f"Operational escalation on parcel {task.parcel_id}: {trigger_reason}",
            affected_area=task.location or "Corridor Alignment Peg",
            affected_parcels_count=1,
            affected_population=5,
            recommended_action=f"Immediate intervention by {target_recipient} to resolve bottleneck.",
            responsible_authority=target_recipient,
            severity="CRITICAL",
            status="ACTIVE",
            created_at=now,
        )
        db.add(gov_alert)
        gov_alert_id = gov_alert.id

    db.commit()
    db.refresh(task)

    return {
        "taskId": task.id,
        "previousLevel": current_level,
        "currentLevel": task.escalation_level,
        "targetRecipient": target_recipient,
        "triggerReason": trigger_reason,
        "slaStatus": task.sla_status,
        "escalatedAt": now.isoformat(),
        "notificationId": notif.id,
        "auditLogId": audit_entry.id,
        "governmentAlertId": gov_alert_id,
    }


def scan_and_process_all_overdue_tasks(db: Session) -> List[Dict[str, Any]]:
    """
    Scans all active field tasks whose deadline_at has passed and triggers escalations.
    """
    now = datetime.now(timezone.utc)
    active_tasks = (
        db.query(FieldVerification)
        .filter(
            FieldVerification.status.in_(["Assigned", "In Progress", "Awaiting Supervisor Verification"]),
            FieldVerification.verification_status != "VERIFIED",
        )
        .all()
    )

    escalated_results = []
    for t in active_tasks:
        if t.deadline_at and t.deadline_at.replace(tzinfo=timezone.utc if t.deadline_at.tzinfo is None else None) < now:
            res = check_and_escalate_task(db, t.id, trigger_reason="SLA_BREACH")
            escalated_results.append(res)

    return escalated_results
