"""
LandGuard AI — Daily Operations Portal & Daily Reporting Engine
Aggregates Today's Operational Queue (Critical, High, Pending, Overdue, Completed)
and generates daily executive summaries across projects, officers, acquisitions, and risk.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.app.db.models.project import Project
from backend.app.db.models.parcel import Parcel
from backend.app.db.models.field_verification import FieldVerification
from backend.app.db.models.document import Document
from backend.app.db.models.citizen_report import CitizenReport
from backend.app.db.models.risk import RiskPrediction
from backend.app.db.models.officer_performance import OfficerProfile
from backend.app.db.models.contractor import ContractorWorkPackage


def get_todays_operations_queue(db: Session, project_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Scans the entire operational database and returns Today's Operations categorized
    into Critical, High, Pending, Overdue, and Completed items.
    """
    now = datetime.now(timezone.utc)

    # 1. Query items
    tasks_query = db.query(FieldVerification)
    parcels_query = db.query(Parcel)
    docs_query = db.query(Document)
    grievances_query = db.query(CitizenReport)
    risks_query = db.query(RiskPrediction)

    if project_id:
        tasks_query = tasks_query.filter(FieldVerification.project_id == project_id)
        parcels_query = parcels_query.filter(Parcel.project_id == project_id)
        docs_query = docs_query.filter(Document.project_id == project_id)
        grievances_query = grievances_query.filter(CitizenReport.project_id == project_id)
        risks_query = risks_query.filter(RiskPrediction.project_id == project_id)

    tasks = tasks_query.all()
    parcels = parcels_query.all()
    docs = docs_query.all()
    grievances = grievances_query.all()
    risks = risks_query.all()

    critical_items = []
    high_items = []
    pending_items = []
    overdue_items = []
    completed_items = []

    # Process Tasks
    for t in tasks:
        is_overdue = False
        if t.deadline_at and t.status != "Verified":
            task_dl = t.deadline_at.replace(tzinfo=timezone.utc if t.deadline_at.tzinfo is None else None)
            if task_dl < now:
                is_overdue = True

        item = {
            "id": t.id,
            "type": "FIELD_TASK",
            "title": f"Field Verification on {t.parcel_id}",
            "location": t.location,
            "assignedOfficer": t.officer_name or t.officer_ref,
            "priority": t.priority,
            "status": t.status,
            "projectId": t.project_id,
            "parcelId": t.parcel_id,
            "deadline": t.deadline,
        }

        if t.status == "Verified":
            completed_items.append(item)
        elif is_overdue:
            overdue_items.append(item)
        elif t.priority == "Critical":
            critical_items.append(item)
        elif t.priority == "High":
            high_items.append(item)
        else:
            pending_items.append(item)

    # Process Disputed / High-Risk Parcels
    for p in parcels:
        if p.disputed or p.workflow_status == "DISPUTED":
            critical_items.append({
                "id": p.id,
                "type": "DISPUTED_PARCEL",
                "title": f"Title Dispute on Parcel {p.id} ({p.owner_ref})",
                "location": f"Area: {p.area_sq_ft} sq ft",
                "priority": "Critical",
                "status": "DISPUTED",
                "projectId": p.project_id,
                "parcelId": p.id,
            })
        elif p.workflow_status == "ACQUIRED":
            completed_items.append({
                "id": p.id,
                "type": "PARCEL_ACQUIRED",
                "title": f"Parcel {p.id} Acquired & Possessed",
                "status": "ACQUIRED",
                "projectId": p.project_id,
                "parcelId": p.id,
            })

    # Process Grievances
    for g in grievances:
        if g.status in ["Submitted", "Under Review"]:
            high_items.append({
                "id": g.id,
                "type": "CITIZEN_GRIEVANCE",
                "title": f"Citizen Grievance: {g.category}",
                "location": g.location,
                "priority": "High",
                "status": g.status,
                "projectId": g.project_id,
            })
        elif g.status == "Verified":
            completed_items.append({
                "id": g.id,
                "type": "GRIEVANCE_RESOLVED",
                "title": f"Grievance {g.id} Verified",
                "status": "Verified",
                "projectId": g.project_id,
            })

    # Process AI Risk Alerts
    for r in risks:
        if (r.risk_score or r.overall_pct or 0) >= 75:
            critical_items.append({
                "id": f"RISK-ALERT-{r.project_id}",
                "type": "CRITICAL_AI_RISK",
                "title": f"AI Forecast: {r.project_id} Critical Delay Risk ({r.overall_pct}%)",
                "priority": "Critical",
                "status": "ALERT",
                "projectId": r.project_id,
                "delayLabel": r.predicted_delay_label,
            })

    return {
        "date": now.strftime("%Y-%m-%d"),
        "totalOperationsCount": len(critical_items) + len(high_items) + len(pending_items) + len(overdue_items) + len(completed_items),
        "criticalCount": len(critical_items),
        "highCount": len(high_items),
        "pendingCount": len(pending_items),
        "overdueCount": len(overdue_items),
        "completedCount": len(completed_items),
        "critical": critical_items[:15],
        "high": high_items[:15],
        "pending": pending_items[:15],
        "overdue": overdue_items[:15],
        "completed": completed_items[:15],
    }


def generate_daily_executive_reports(db: Session) -> Dict[str, Any]:
    """
    Generates structured daily operational summaries:
    - Daily Project Summary
    - Daily Officer Summary
    - Daily Acquisition Summary
    - Daily Risk Summary
    """
    now = datetime.now(timezone.utc)
    projects = db.query(Project).all()
    officers = db.query(OfficerProfile).all()
    parcels = db.query(Parcel).all()
    tasks = db.query(FieldVerification).all()
    risks = db.query(RiskPrediction).all()
    contractors = db.query(ContractorWorkPackage).all()

    # 1. Project Summary
    project_summary = [
        {
            "projectId": p.id,
            "projectName": p.name,
            "state": p.state,
            "district": p.district,
            "workflowState": p.workflow_state or "PLANNING",
            "overallProgressPct": p.overall_progress or 25.0,
            "landAcquisitionProgressPct": p.land_acquisition_progress or 30.0,
            "constructionProgressPct": p.construction_progress or 0.0,
        }
        for p in projects
    ]

    # 2. Officer Summary
    officer_summary = [
        {
            "officerId": o.id,
            "officerName": o.name,
            "role": o.role,
            "district": o.district,
            "totalPoints": o.total_points or 0,
            "completedTasks": o.completed_tasks or 0,
            "onTimeRatePct": o.sla_compliance_pct or 92.0,
            "currentWorkload": o.current_workload or 0,
            "isAvailable": o.is_available,
        }
        for o in officers
    ]

    # 3. Acquisition Summary
    total_parcels = len(parcels)
    acquired_count = sum(1 for p in parcels if p.workflow_status == "ACQUIRED" or p.acquisition_status == "POSSESSED")
    compensated_count = sum(1 for p in parcels if p.workflow_status in ["COMPENSATION_COMPLETED", "ACQUIRED"])
    disputed_count = sum(1 for p in parcels if p.disputed or p.workflow_status == "DISPUTED")
    verified_count = sum(1 for p in parcels if p.verification == "VERIFIED")

    acquisition_summary = {
        "totalParcelsCount": total_parcels,
        "acquiredParcelsCount": acquired_count,
        "compensationCompletedCount": compensated_count,
        "verifiedParcelsCount": verified_count,
        "disputedParcelsCount": disputed_count,
        "acquisitionRatePct": round((acquired_count / max(1, total_parcels)) * 100.0, 1),
    }

    # 4. Risk Summary
    high_risk_projects = [r.project_id for r in risks if (r.risk_score or r.overall_pct or 0) >= 60]
    critical_risk_projects = [r.project_id for r in risks if (r.risk_score or r.overall_pct or 0) >= 75]
    avg_risk = round(sum(r.overall_pct or 0 for r in risks) / max(1, len(risks)), 1) if risks else 50.0

    risk_summary = {
        "averagePortfolioRiskPct": avg_risk,
        "criticalRiskProjectsCount": len(critical_risk_projects),
        "highRiskProjectsCount": len(high_risk_projects),
        "criticalProjects": critical_risk_projects,
        "activeAlertsCount": len(critical_risk_projects) + sum(1 for t in tasks if t.sla_status == "BREACHED"),
    }

    return {
        "reportDate": now.strftime("%Y-%m-%d"),
        "generatedAt": now.isoformat(),
        "dailyProjectSummary": project_summary,
        "dailyOfficerSummary": officer_summary,
        "dailyAcquisitionSummary": acquisition_summary,
        "dailyRiskSummary": risk_summary,
    }
