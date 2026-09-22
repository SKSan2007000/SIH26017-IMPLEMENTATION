"""
LandGuard AI — Risk & Predictive Intelligence Routes
Exposes project delay risk, explainability, drivers, recommendations, and what-if simulation.
"""

from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.db.models.project import Project
from backend.app.db.models.risk import RiskPrediction, RiskFactor
from backend.app.schemas.risk import WhatIfRequest
from backend.app.services.risk_service import (
    recalculate_and_persist_project_risk,
    simulate_what_if_policy_interventions,
    extract_project_risk_features,
)
from backend.app.services.audit_service import log_audit_event

router = APIRouter()


def format_risk_dict(rp: RiskPrediction) -> Dict[str, Any]:
    return {
        "projectId": rp.project_id,
        "project_id": rp.project_id,
        "overallPct": rp.overall_pct,
        "band": rp.band,
        "predictedDelayLabel": rp.predicted_delay_label,
        "confidencePct": rp.confidence_pct,
        "trend": rp.trend or [],
        "trendStatus": rp.trend_status,
        "categories": rp.categories or [],
        "drivers": rp.drivers or [],
        "recommendations": rp.recommendations or [],
        "originalCompletionMonths": rp.original_completion_months,
        "predictedCompletionMonths": rp.predicted_completion_months,
        "delay_probability": rp.delay_probability if rp.delay_probability is not None else round(rp.overall_pct / 100.0, 2),
        "risk_score": rp.risk_score if rp.risk_score is not None else rp.overall_pct,
        "risk_category": rp.risk_category or rp.band.upper(),
        "expected_delay_months": rp.expected_delay_months if rp.expected_delay_months is not None else 3.5,
        "expected_delay_days": rp.expected_delay_days if rp.expected_delay_days is not None else 105,
        "model_version": rp.model_version or "1.0.0-rf",
    }


def format_factor_dict(rf: RiskFactor) -> Dict[str, Any]:
    return {
        "id": rf.id,
        "projectId": rf.project_id,
        "factorName": rf.factor_name,
        "category": rf.category,
        "score": rf.score,
        "weight": rf.weight,
        "description": rf.description,
        "mitigation": rf.mitigation,
    }


@router.get("/projects/{project_id}/risk", response_model=Dict[str, Any])
def get_project_risk(project_id: str, db: Session = Depends(get_db)):
    """
    Returns predictive risk intelligence for a project.
    Calculates dynamically with the trained AI model if no prediction is yet stored.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")

    rp = db.query(RiskPrediction).filter(RiskPrediction.project_id == project_id).first()
    if not rp or rp.delay_probability is None or not rp.recommendations:
        # Generate and persist live ML prediction
        return recalculate_and_persist_project_risk(db, project_id)
    return format_risk_dict(rp)


@router.get("/projects/{project_id}/risk/factors", response_model=List[Dict[str, Any]])
def get_project_risk_factors(project_id: str, db: Session = Depends(get_db)):
    """Returns ranked risk factors contributing to project delay."""
    factors = db.query(RiskFactor).filter(RiskFactor.project_id == project_id).all()
    if not factors:
        recalculate_and_persist_project_risk(db, project_id)
        factors = db.query(RiskFactor).filter(RiskFactor.project_id == project_id).all()
    return [format_factor_dict(f) for f in factors]


@router.get("/projects/{project_id}/risk/drivers", response_model=List[Dict[str, Any]])
def get_project_risk_drivers(project_id: str, db: Session = Depends(get_db)):
    """Returns top explainable AI delay drivers with contribution percentages."""
    rp = db.query(RiskPrediction).filter(RiskPrediction.project_id == project_id).first()
    if not rp or not rp.drivers:
        data = recalculate_and_persist_project_risk(db, project_id)
        return data["drivers"]
    return rp.drivers


@router.get("/projects/{project_id}/risk/explain", response_model=Dict[str, Any])
def explain_project_risk(project_id: str, db: Session = Depends(get_db)):
    """
    Explainability endpoint providing transparent insight into AI predictive risk scoring.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")

    features = extract_project_risk_features(db, project_id)
    rp = db.query(RiskPrediction).filter(RiskPrediction.project_id == project_id).first()
    if not rp or rp.delay_probability is None:
        rp_data = recalculate_and_persist_project_risk(db, project_id)
    else:
        rp_data = format_risk_dict(rp)

    return {
        "projectId": project_id,
        "projectName": project.name,
        "riskScore": rp_data["overallPct"],
        "riskBand": rp_data["band"],
        "predictedDelay": rp_data["predictedDelayLabel"],
        "confidence": rp_data["confidencePct"],
        "delay_probability": rp_data["delay_probability"],
        "risk_category": rp_data["risk_category"],
        "expected_delay_months": rp_data["expected_delay_months"],
        "features": features,
        "drivers": rp_data["drivers"],
        "categories": rp_data["categories"],
        "recommendations": rp_data.get("recommendations", []),
        "decisionSupportStatement": "AI PREDICTION · HUMAN DECISION REQUIRED — calibrated multi-feature early warning model.",
    }


@router.post("/projects/{project_id}/risk/recalculate", response_model=Dict[str, Any])
def recalculate_project_risk_endpoint(project_id: str, db: Session = Depends(get_db)):
    """Triggers live recalculation of AI predictive risk based on database state."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")

    result = recalculate_and_persist_project_risk(db, project_id)

    log_audit_event(
        db=db,
        project_id=project_id,
        actor="AI Predictive Engine",
        action="RISK_RECALCULATED",
        entity="RiskPrediction",
        entity_id=f"RISK-{project_id}",
        label=f"AI Delay Risk updated to {result['overallPct']}% ({result['band'].upper()})",
        category="Risk Assessment",
        details=f"Forecast: {result['predictedDelayLabel']}, Delay Prob: {result['delay_probability']}, Confidence: {result['confidencePct']}%",
    )

    return result


@router.post("/projects/{project_id}/what-if", response_model=List[Dict[str, Any]])
def run_what_if_simulation(project_id: str, req: WhatIfRequest, db: Session = Depends(get_db)):
    """Simulate What-If scenario with policy levers without altering database."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")
    return simulate_what_if_policy_interventions(db, project_id, req.leverIds)
