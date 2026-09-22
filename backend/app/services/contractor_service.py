"""
LandGuard AI — Contractor Monitoring & Delay Alert Service
Manages contractor work packages, progress logs, photo/video evidence verification,
variance analysis, and automated construction delay alerts.
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.db.models.contractor import ContractorWorkPackage, ContractorProgressLog
from backend.app.db.models.project import Project
from backend.app.db.models.notification import Notification
from backend.app.db.models.audit import AuditLog


def create_work_package(
    db: Session,
    project_id: str,
    package_name: str,
    contractor_name: str,
    planned_progress_pct: float = 0.0,
    target_date: Optional[str] = None,
) -> ContractorWorkPackage:
    """
    Assigns a new infrastructure work package to an authorized contractor.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    now = datetime.now(timezone.utc)
    pkg_id = f"PKG-{project_id}-{uuid.uuid4().hex[:6].upper()}"

    pkg = ContractorWorkPackage(
        id=pkg_id,
        project_id=project_id,
        contractor_name=contractor_name,
        contractor_ref=f"EPC-{contractor_name[:6].upper()}",
        package_name=package_name,
        planned_progress_pct=planned_progress_pct,
        actual_progress_pct=0.0,
        variance_pct=-planned_progress_pct,
        status="IN_PROGRESS",
        delay_risk="LOW",
        assigned_date=now.strftime("%Y-%m-%d"),
        target_date=target_date or "2027-06-30",
    )
    db.add(pkg)

    # Audit log
    audit_entry = AuditLog(
        id=f"AUD-PKG-{uuid.uuid4().hex[:10]}",
        project_id=project_id,
        actor="Project Director",
        action="CONTRACTOR_ASSIGNED",
        entity="ContractorWorkPackage",
        entity_id=pkg.id,
        label=f"Work Package Assigned: {package_name}",
        category="System",
        details=f"Assigned to {contractor_name} for project {project_id}",
        time=now.strftime("%H:%M:%S"),
        date=now.strftime("%Y-%m-%d"),
    )
    db.add(audit_entry)

    db.commit()
    db.refresh(pkg)
    return pkg


def submit_contractor_progress(
    db: Session,
    package_id: str,
    reported_progress_pct: float,
    photo_evidence_ref: Optional[str] = None,
    video_evidence_ref: Optional[str] = None,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Records contractor progress update with photo/video evidence.
    Computes variance against planned progress and triggers construction delay alerts if behind.
    """
    pkg = db.query(ContractorWorkPackage).filter(ContractorWorkPackage.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail=f"Work package {package_id} not found")

    now = datetime.now(timezone.utc)
    log_id = f"CPL-{pkg.id}-{uuid.uuid4().hex[:6].upper()}"

    log = ContractorProgressLog(
        id=log_id,
        package_id=package_id,
        project_id=pkg.project_id,
        reported_progress_pct=reported_progress_pct,
        photo_evidence_ref=photo_evidence_ref or f"photo_const_{pkg.id.lower()}.jpg",
        video_evidence_ref=video_evidence_ref,
        notes=notes or "Routine foundation & pier construction progress submission",
        verification_status="SUBMITTED",
        reported_at=now,
    )
    db.add(log)

    pkg.actual_progress_pct = reported_progress_pct
    variance = round(reported_progress_pct - pkg.planned_progress_pct, 1)
    pkg.variance_pct = variance

    # Update delay risk & alert
    delay_alert_created = False
    if variance < -15.0:
        pkg.delay_risk = "CRITICAL"
        pkg.status = "DELAYED"
    elif variance < -5.0:
        pkg.delay_risk = "HIGH"
        pkg.status = "DELAYED"
    else:
        pkg.delay_risk = "LOW"
        pkg.status = "IN_PROGRESS"

    if variance < -5.0:
        delay_alert_created = True
        notif = Notification(
            id=f"NTF-CDELAY-{uuid.uuid4().hex[:10]}",
            category="Critical Delay Risk",
            type="CONSTRUCTION_DELAY",
            severity="Critical" if variance < -15.0 else "High",
            message=(
                f"Construction Delay Alert on {pkg.package_name} ({pkg.contractor_name}). "
                f"Variance: {variance}% behind schedule."
            ),
            project_id=pkg.project_id,
            recipient="Project Director & Field Engineer",
            channel="In-App",
            timestamp=now.isoformat(),
            read=False,
        )
        db.add(notif)

    # Sync project construction progress
    project = db.query(Project).filter(Project.id == pkg.project_id).first()
    if project:
        all_pkgs = db.query(ContractorWorkPackage).filter(ContractorWorkPackage.project_id == project.id).all()
        if all_pkgs:
            avg_const = sum(p.actual_progress_pct for p in all_pkgs) / len(all_pkgs)
            project.construction_progress = round(avg_const, 1)
            project.overall_progress = round((project.land_acquisition_progress * 0.6) + (project.construction_progress * 0.4), 1)

    db.commit()
    db.refresh(pkg)

    return {
        "logId": log.id,
        "packageId": pkg.id,
        "contractorName": pkg.contractor_name,
        "reportedProgressPct": reported_progress_pct,
        "plannedProgressPct": pkg.planned_progress_pct,
        "variancePct": pkg.variance_pct,
        "delayRisk": pkg.delay_risk,
        "delayAlertCreated": delay_alert_created,
        "photoEvidenceRef": log.photo_evidence_ref,
        "reportedAt": now.isoformat(),
    }


def verify_contractor_progress(
    db: Session,
    log_id: str,
    officer_id: str,
    decision: str = "VERIFIED",  # 'VERIFIED' | 'REWORK_REQUESTED'
) -> Dict[str, Any]:
    """
    Officer inspection and sign-off on contractor progress submission.
    """
    log = db.query(ContractorProgressLog).filter(ContractorProgressLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail=f"Progress log {log_id} not found")

    now = datetime.now(timezone.utc)
    log.verification_status = decision.upper()
    log.verified_by_officer_id = officer_id
    log.verified_at = now

    audit_entry = AuditLog(
        id=f"AUD-CPV-{uuid.uuid4().hex[:10]}",
        project_id=log.project_id,
        actor=officer_id,
        action="CONSTRUCTION_UPDATED",
        entity="ContractorProgressLog",
        entity_id=log.id,
        label=f"Contractor Progress Verified: {decision}",
        category="Verification",
        details=f"Progress submission {log.id} ({log.reported_progress_pct}%) verified by officer {officer_id}",
        time=now.strftime("%H:%M:%S"),
        date=now.strftime("%Y-%m-%d"),
    )
    db.add(audit_entry)

    db.commit()
    return {
        "logId": log.id,
        "verificationStatus": log.verification_status,
        "verifiedBy": officer_id,
        "verifiedAt": now.isoformat(),
    }
