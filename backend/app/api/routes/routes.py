"""
LandGuard AI — Route Intelligence Routes
Provides route alignment management, spatial parcel intersection,
and AI multi-criteria route evaluation.
"""

from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from backend.app.db.database import get_db
from backend.app.db.models.project import Project
from backend.app.db.models.route import Route
from backend.app.db.models.parcel import Parcel
from backend.app.schemas.route import RouteCreate
from backend.app.services.spatial_service import check_route_parcel_spatial_intersection
from backend.app.services.audit_service import log_audit_event
from backend.app.services.risk_service import extract_project_risk_features
from backend.app.ml.route_eval import evaluate_and_rank_routes

router = APIRouter()


def format_route_dict(r: Route) -> Dict[str, Any]:
    return {
        "id": r.id,
        "projectId": r.project_id,
        "label": r.label,
        "strategy": r.strategy,
        "path": r.path,
        "distanceKm": r.distance_km,
        "affectedParcels": r.affected_parcels,
        "affectedParcelIds": r.affected_parcel_ids or [],
        "stakeholders": r.stakeholders,
        "estimatedCostCr": r.estimated_cost_cr,
        "estimatedDelayMonths": r.estimated_delay_months,
        "delayProbabilityPct": r.delay_probability_pct,
        "infrastructureImpact": r.infrastructure_impact,
        "overallScore": r.overall_score,
        "aiRecommended": r.ai_recommended,
        "corridorWidthMeters": r.corridor_width_meters,
        "lanes": r.lanes,
    }


@router.get("/projects/{project_id}/routes", response_model=List[Dict[str, Any]])
def list_project_routes(project_id: str, db: Session = Depends(get_db)):
    routes = db.query(Route).filter(Route.project_id == project_id).all()
    return [format_route_dict(r) for r in routes]


@router.get("/routes/{route_id}", response_model=Dict[str, Any])
def get_route_by_id(route_id: str, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Route {route_id} not found")
    return format_route_dict(route)


@router.post("/projects/{project_id}/routes/evaluate", response_model=List[Dict[str, Any]])
def evaluate_project_routes_endpoint(project_id: str, db: Session = Depends(get_db)):
    """
    Evaluates candidate routes (Route A, B, C, D) using the ML model,
    calculates route-specific delay probabilities, and ranks them
    by multi-criteria objective optimization.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")

    routes = db.query(Route).filter(Route.project_id == project_id).all()
    if not routes:
        return []

    project_features = extract_project_risk_features(db, project_id)
    raw_routes = [format_route_dict(r) for r in routes]
    evaluated = evaluate_and_rank_routes(project_features, raw_routes)

    # Update DB records with calibrated AI metrics
    for ev in evaluated:
        r_db = db.query(Route).filter(Route.id == ev["id"]).first()
        if r_db:
            r_db.delay_probability_pct = ev["delayProbabilityPct"]
            r_db.estimated_delay_months = ev["estimatedDelayMonths"]
            r_db.overall_score = ev["overallScore"]
            r_db.ai_recommended = ev["aiRecommended"]

    db.commit()

    return evaluated


@router.post("/projects/{project_id}/routes", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_project_route(project_id: str, route_in: RouteCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")

    r_id = route_in.id or f"RT-{project_id.replace('PRJ-', '')}-{uuid.uuid4().hex[:3].upper()}"

    # Calculate intersecting parcels spatially if not explicitly given
    parcels = db.query(Parcel).filter(Parcel.project_id == project_id).all()
    affected_ids = route_in.affected_parcel_ids or []
    if not affected_ids and route_in.path:
        for p in parcels:
            is_aff, _, _ = check_route_parcel_spatial_intersection(
                route_path=route_in.path,
                parcel_coords=p.coords,
                parcel_polygon=p.polygon_coords,
                corridor_width_meters=route_in.corridor_width_meters or 32.0,
            )
            if is_aff:
                affected_ids.append(p.id)

    route = Route(
        id=r_id,
        project_id=project_id,
        label=route_in.label,
        strategy=route_in.strategy,
        path=route_in.path,
        distance_km=route_in.distance_km,
        affected_parcels=len(affected_ids) or route_in.affected_parcels,
        affected_parcel_ids=affected_ids,
        stakeholders=route_in.stakeholders or len(affected_ids),
        estimated_cost_cr=route_in.estimated_cost_cr,
        estimated_delay_months=route_in.estimated_delay_months,
        delay_probability_pct=route_in.delay_probability_pct,
        infrastructure_impact=route_in.infrastructure_impact,
        overall_score=route_in.overall_score,
        ai_recommended=route_in.ai_recommended,
        corridor_width_meters=route_in.corridor_width_meters,
        lanes=route_in.lanes,
    )
    db.add(route)
    db.commit()
    db.refresh(route)

    log_audit_event(
        db=db,
        project_id=project_id,
        actor="GIS Team",
        action="ROUTE_CREATED",
        entity="Route",
        entity_id=r_id,
        label=f"Route alignment '{route.label}' added",
        category="Route Selection",
        details=f"Distance: {route.distance_km}km, Estimated Cost: ₹{route.estimated_cost_cr}Cr, Affected Parcels: {len(affected_ids)}",
    )

    return format_route_dict(route)


@router.get("/projects/{project_id}/recommendations", response_model=List[Dict[str, Any]])
def get_recommendations(project_id: str, db: Session = Depends(get_db)):
    routes = db.query(Route).filter(Route.project_id == project_id, Route.ai_recommended == True).all()
    if not routes:
        routes = db.query(Route).filter(Route.project_id == project_id).order_by(Route.overall_score.desc()).limit(1).all()
    return [format_route_dict(r) for r in routes]
