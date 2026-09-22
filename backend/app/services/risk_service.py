"""
LandGuard AI — Risk Service Layer
Bridges live database state (parcels, stakeholders, documents, field verification, grievances)
with the trained ML predictive intelligence engine.
"""

from typing import List, Dict, Any, Optional
import math
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.app.db.models.project import Project
from backend.app.db.models.parcel import Parcel
from backend.app.db.models.stakeholder import Stakeholder
from backend.app.db.models.document import Document
from backend.app.db.models.field_verification import FieldVerification
from backend.app.db.models.citizen_report import CitizenReport
from backend.app.db.models.risk import RiskPrediction, RiskFactor

from backend.app.ml.predict import predict_project_risk
from backend.app.ml.simulate import simulate_what_if_interventions


def extract_project_risk_features(db: Session, project_id: str) -> Dict[str, Any]:
    """
    Extracts numerical and categorical features from the live database
    to feed the AI predictive risk engine.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return {}

    parcels = db.query(Parcel).filter(Parcel.project_id == project_id).all()
    stakeholders = db.query(Stakeholder).filter(Stakeholder.project_id == project_id).all()
    documents = db.query(Document).filter(Document.project_id == project_id).all()
    field_cases = db.query(FieldVerification).filter(FieldVerification.project_id == project_id).all()
    grievances = db.query(CitizenReport).filter(CitizenReport.project_id == project_id).all()

    total_parcels = max(1, len(parcels))
    disputed_parcels = sum(1 for p in parcels if p.disputed or p.response_status == "DISPUTED")
    dispute_ratio = disputed_parcels / total_parcels

    structures_count = sum(1 for p in parcels if p.structures_present)
    structure_ratio = structures_count / total_parcels

    # Document completion ratio
    total_docs = max(1, len(documents))
    verified_docs = sum(1 for d in documents if d.status == "Verified" or d.verification_status == "VERIFIED")
    doc_completion_ratio = verified_docs / total_docs

    # Stakeholder friction
    total_sh = max(1, len(stakeholders))
    unresponsive_sh = sum(1 for s in stakeholders if s.response_status in ("UNRESPONSIVE", "DISPUTED") or s.status == "Disputed")
    stakeholder_friction_ratio = unresponsive_sh / total_sh

    # Field verification backlog
    total_ver = max(1, len(field_cases))
    pending_ver = sum(1 for f in field_cases if f.status not in ("Verified", "Approved"))
    field_backlog_ratio = pending_ver / total_ver

    # Citizen grievance count
    unresolved_grievances = sum(1 for g in grievances if g.status in ("Submitted", "Under Review"))

    return {
        "project_id": project_id,
        "project_name": project.name,
        "project_type": project.type or "Expressway / Highway",
        "state": project.state or "Tamil Nadu",
        "district": project.district or "Chennai",
        "land_area_acres": float(project.required_land_area_acres or 200.0),
        "estimated_budget_cr": float(project.estimated_budget_cr or 2500.0),
        "current_stage_index": project.current_stage_index or 3,
        "bottleneck_stage_index": project.bottleneck_stage_index or 4,
        "total_parcels": total_parcels,
        "affected_parcels": total_parcels,
        "disputed_parcels": disputed_parcels,
        "disputed_parcels_count": disputed_parcels,
        "legal_disputes_count": disputed_parcels,
        "dispute_ratio": dispute_ratio,
        "structures_count": structures_count,
        "structure_ratio": structure_ratio,
        "total_docs": total_docs,
        "verified_docs": verified_docs,
        "doc_completion_ratio": doc_completion_ratio,
        "documentation_completion_pct": round(doc_completion_ratio * 100.0, 1),
        "total_stakeholders": total_sh,
        "affected_families": max(total_sh, int(total_parcels * 1.3)),
        "unresponsive_stakeholders": unresponsive_sh,
        "stakeholder_friction_ratio": stakeholder_friction_ratio,
        "stakeholder_response_rate": round((1.0 - stakeholder_friction_ratio) * 100.0, 1),
        "total_verifications": total_ver,
        "pending_verifications": pending_ver,
        "field_backlog_ratio": field_backlog_ratio,
        "unresolved_grievances": unresolved_grievances,
        "unresolved_grievances_count": unresolved_grievances,
        "planned_duration_months": 24.0,
        "compensation_completion_pct": 55.0 if dispute_ratio < 0.15 else 35.0,
        "approval_completion_pct": max(20.0, 80.0 - (unresolved_grievances * 8.0)),
        "administrative_bottlenecks_score": min(95.0, 30.0 + (dispute_ratio * 120.0)),
        "field_verification_delay_days": min(120.0, pending_ver * 18.0 + 10.0),
    }


def calculate_predictive_risk_model(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes production ML inference on extracted features.
    """
    if not features:
        return {
            "overall_pct": 50,
            "band": "medium",
            "predicted_delay_label": "+3.5 months",
            "confidence_pct": 85,
            "categories": [],
            "drivers": [],
            "recommendations": [],
            "original_completion_months": 24,
            "predicted_completion_months": 28,
            "delay_probability": 0.50,
            "risk_score": 50,
            "risk_category": "MEDIUM",
            "expected_delay_months": 3.5,
            "expected_delay_days": 105,
        }

    return predict_project_risk(features)


def recalculate_and_persist_project_risk(db: Session, project_id: str) -> Dict[str, Any]:
    """Recalculates risk for a project using the ML model and updates the database record."""
    features = extract_project_risk_features(db, project_id)
    risk_output = calculate_predictive_risk_model(features)

    rp = db.query(RiskPrediction).filter(RiskPrediction.project_id == project_id).first()
    if not rp:
        rp = RiskPrediction(
            id=f"RISK-{project_id}",
            project_id=project_id,
            overall_pct=risk_output["overallPct"],
            band=risk_output["band"],
            predicted_delay_label=risk_output["predictedDelayLabel"],
            confidence_pct=risk_output["confidencePct"],
            trend=risk_output["trend"],
            trend_status=risk_output["trendStatus"],
            categories=risk_output["categories"],
            drivers=risk_output["drivers"],
            original_completion_months=risk_output["originalCompletionMonths"],
            predicted_completion_months=risk_output["predictedCompletionMonths"],
            delay_probability=risk_output["delay_probability"],
            risk_score=risk_output["risk_score"],
            risk_category=risk_output["risk_category"],
            expected_delay_months=risk_output["expected_delay_months"],
            expected_delay_days=risk_output["expected_delay_days"],
            model_version=risk_output.get("model_version", "1.0.0-rf"),
            recommendations=risk_output.get("recommendations", []),
            prediction_metadata={"features": features},
        )
        db.add(rp)
    else:
        rp.overall_pct = risk_output["overallPct"]
        rp.band = risk_output["band"]
        rp.predicted_delay_label = risk_output["predictedDelayLabel"]
        rp.confidence_pct = risk_output["confidencePct"]
        rp.trend = risk_output["trend"]
        rp.trend_status = risk_output["trendStatus"]
        rp.categories = risk_output["categories"]
        rp.drivers = risk_output["drivers"]
        rp.original_completion_months = risk_output["originalCompletionMonths"]
        rp.predicted_completion_months = risk_output["predictedCompletionMonths"]
        rp.delay_probability = risk_output["delay_probability"]
        rp.risk_score = risk_output["risk_score"]
        rp.risk_category = risk_output["risk_category"]
        rp.expected_delay_months = risk_output["expected_delay_months"]
        rp.expected_delay_days = risk_output["expected_delay_days"]
        rp.model_version = risk_output.get("model_version", "1.0.0-rf")
        rp.recommendations = risk_output.get("recommendations", [])
        rp.prediction_metadata = {"features": features}
        rp.predicted_at = datetime.now(timezone.utc)

    # Refresh / update RiskFactor records
    db.query(RiskFactor).filter(RiskFactor.project_id == project_id).delete()
    
    # Add top factors derived from explainability
    for idx, d in enumerate(risk_output.get("drivers", [])):
        rf = RiskFactor(
            id=f"RF-{project_id}-{idx+1:02d}",
            project_id=project_id,
            prediction_id=rp.id,
            factor_name=d.get("label", "Key Delay Factor"),
            category="Legal" if "Dispute" in d.get("label", "") else ("Documentation" if "Document" in d.get("label", "") else "Administrative"),
            score=float(risk_output["risk_score"]),
            weight=float(d.get("contributionPct", 20) / 20.0),
            description=f"Identified as major delay driver contributing +{d.get('contributionPct')}% to overall risk score.",
            mitigation="Implement prioritized AI corrective action.",
        )
        db.add(rf)

    db.commit()
    db.refresh(rp)

    return {
        "projectId": rp.project_id,
        "overallPct": rp.overall_pct,
        "band": rp.band,
        "predictedDelayLabel": rp.predicted_delay_label,
        "confidencePct": rp.confidence_pct,
        "trend": rp.trend,
        "trendStatus": rp.trend_status,
        "categories": rp.categories,
        "drivers": rp.drivers,
        "recommendations": rp.recommendations or [],
        "originalCompletionMonths": rp.original_completion_months,
        "predictedCompletionMonths": rp.predicted_completion_months,
        "delay_probability": rp.delay_probability,
        "risk_score": rp.risk_score,
        "risk_category": rp.risk_category,
        "expected_delay_months": rp.expected_delay_months,
        "expected_delay_days": rp.expected_delay_days,
        "model_version": rp.model_version,
    }


def get_project_live_risk(db: Session, project_id: str) -> Dict[str, Any]:
    """Retrieves current risk prediction record or calculates live if not present."""
    rp = db.query(RiskPrediction).filter(RiskPrediction.project_id == project_id).first()
    if rp:
        return {
            "projectId": rp.project_id,
            "overallPct": rp.overall_pct,
            "band": rp.band,
            "predictedDelayLabel": rp.predicted_delay_label,
            "confidencePct": rp.confidence_pct,
            "trend": rp.trend,
            "trendStatus": rp.trend_status,
            "categories": rp.categories,
            "drivers": rp.drivers,
            "recommendations": rp.recommendations or [],
            "originalCompletionMonths": rp.original_completion_months,
            "predictedCompletionMonths": rp.predicted_completion_months,
            "delay_probability": rp.delay_probability or round(rp.overall_pct / 100.0, 2),
            "risk_score": rp.risk_score or rp.overall_pct,
            "risk_category": rp.risk_category or rp.band.upper(),
            "expected_delay_months": rp.expected_delay_months or 3.5,
            "expected_delay_days": rp.expected_delay_days or 105,
            "model_version": rp.model_version or "1.0.0-rf",
        }
    return recalculate_and_persist_project_risk(db, project_id)


def simulate_what_if_policy_interventions(
    db: Session,
    project_id: str,
    active_lever_ids: List[str]
) -> List[Dict[str, Any]]:
    """
    Evaluates policy levers against the trained predictive risk model.
    """
    features = extract_project_risk_features(db, project_id)
    return simulate_what_if_interventions(features, active_lever_ids)
