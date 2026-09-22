"""
LandGuard AI — High-Performance Geospatial Intelligence & GeoJSON Engine
Provides comprehensive 2D GIS and 3D Digital Twin endpoints:
- GET /api/v1/projects/{project_id}/gis -> Full project corridor GeoJSON FeatureCollection
- GET /api/v1/parcels/{parcel_id}/risk -> Detailed parcel risk analytics & drivers
- POST /api/v1/parcels/{parcel_id}/assign-officer -> Assign field verification officer
- POST /api/v1/parcels/{parcel_id}/verify -> Field verification sign-off & risk recalculation
- GET /api/v1/routes/{route_id}/gis -> Route alignment GeoJSON
"""

from typing import List, Optional, Any, Dict
import math
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.db.models.project import Project
from backend.app.db.models.parcel import Parcel
from backend.app.db.models.route import Route
from backend.app.db.models.stakeholder import Stakeholder
from backend.app.db.models.field_verification import FieldVerification
from backend.app.db.models.risk import RiskPrediction
from backend.app.db.models.officer_performance import OfficerProfile
from backend.app.services.spatial_service import (
    compute_affected_parcels_for_route,
    meters_to_degrees_approx,
)
from backend.app.services.risk_service import recalculate_and_persist_project_risk
from backend.app.services.audit_service import log_audit_event

router = APIRouter()

RISK_HEX_MAP = {
    "critical": "#ef5b5b",
    "high": "#f0a742",
    "medium": "#e8d15c",
    "low": "#4fbf7c",
    "unaffected": "#4fbf7c",
    "potential": "#e8d15c",
    "affected": "#f0a742",
}

ROUTE_COLOR_MAP = {
    "Route A": "#38d3f0",
    "Route B": "#e8d15c",
    "Route C": "#4fbf7c",
    "Route D": "#f0a742",
}


def get_parcel_risk_color(parcel: Parcel) -> str:
    if parcel.disputed or parcel.risk_contribution == "critical":
        return "#ef5b5b"
    if parcel.impact == "high" or parcel.risk_contribution == "high":
        return "#ef5b5b"
    if parcel.impact == "affected" or parcel.risk_contribution == "medium":
        return "#f0a742"
    if parcel.impact == "potential":
        return "#e8d15c"
    return "#4fbf7c"


def generate_parcel_polygon_coords(centroid: List[float], area_sq_ft: float, seed: int = 1) -> List[List[float]]:
    """Generates a realistic 5-point closed polygon in [lon, lat] order around centroid."""
    cx, cy = centroid[0], centroid[1]
    side_meters = math.sqrt(max(100.0, area_sq_ft) * 0.0929) * 1.25
    deg_lat = (side_meters / 111320.0) * 0.5
    deg_lon = (side_meters / (111320.0 * max(0.2, math.cos(math.radians(cy))))) * 0.5

    j1 = 0.85 + ((seed * 17) % 30) / 100.0
    j2 = 0.85 + ((seed * 31) % 30) / 100.0
    j3 = 0.85 + ((seed * 47) % 30) / 100.0
    j4 = 0.85 + ((seed * 67) % 30) / 100.0

    return [
        [round(cx - deg_lon * j1, 6), round(cy - deg_lat * j2, 6)],
        [round(cx + deg_lon * j3, 6), round(cy - deg_lat * j1 * 0.9, 6)],
        [round(cx + deg_lon * j2 * 0.95, 6), round(cy + deg_lat * j4, 6)],
        [round(cx - deg_lon * j4 * 0.9, 6), round(cy + deg_lat * j3 * 1.05, 6)],
        [round(cx - deg_lon * j1, 6), round(cy - deg_lat * j2, 6)],  # Closed loop
    ]


def generate_corridor_ribbon_polygon(path: List[List[float]], width_meters: float = 32.0) -> List[List[float]]:
    """Creates a corridor buffer ribbon polygon around a route centerline."""
    if len(path) < 2:
        return []
    avg_lat = sum(p[1] for p in path) / len(path)
    buffer_deg = meters_to_degrees_approx(width_meters / 2.0, lat=avg_lat)

    left_side = []
    right_side = []

    for i in range(len(path)):
        cur = path[i]
        nxt = path[i + 1] if i + 1 < len(path) else path[i]
        prv = path[i - 1] if i > 0 else path[i]

        dx = nxt[0] - prv[0]
        dy = nxt[1] - prv[1]
        length = math.hypot(dx, dy) or 0.0001
        norm_x = -dy / length
        norm_y = dx / length

        left_side.append([round(cur[0] + norm_x * buffer_deg, 6), round(cur[1] + norm_y * buffer_deg, 6)])
        right_side.append([round(cur[0] - norm_x * buffer_deg, 6), round(cur[1] - norm_y * buffer_deg, 6)])

    polygon_coords = left_side + list(reversed(right_side))
    if polygon_coords:
        polygon_coords.append(polygon_coords[0])  # close ring
    return polygon_coords


def get_demo_landmarks(coords: List[float]) -> List[Dict[str, Any]]:
    """Generates synthetic infrastructure landmarks around project coordinates in India."""
    cx, cy = coords[0], coords[1]
    return [
        {
            "id": "INF-01",
            "name": "DEMO Government Secondary School",
            "type": "School",
            "icon": "🏫",
            "coords": [round(cx + 0.004, 6), round(cy + 0.006, 6)],
        },
        {
            "id": "INF-02",
            "name": "DEMO Primary Community Health Centre",
            "type": "Hospital",
            "icon": "🏥",
            "coords": [round(cx - 0.007, 6), round(cy + 0.005, 6)],
        },
        {
            "id": "INF-03",
            "name": "DEMO District Industrial Substation (66kV)",
            "type": "Utility",
            "icon": "⚡",
            "coords": [round(cx + 0.012, 6), round(cy - 0.008, 6)],
        },
        {
            "id": "INF-04",
            "name": "DEMO Freight Rail Intermodal Yard",
            "type": "Transport",
            "icon": "🚉",
            "coords": [round(cx - 0.015, 6), round(cy - 0.012, 6)],
        },
    ]


def get_demo_waterway(coords: List[float]) -> List[List[float]]:
    cx, cy = coords[0], coords[1]
    return [
        [round(cx - 0.035, 6), round(cy - 0.025, 6)],
        [round(cx - 0.018, 6), round(cy - 0.010, 6)],
        [round(cx + 0.005, 6), round(cy + 0.002, 6)],
        [round(cx + 0.022, 6), round(cy + 0.018, 6)],
        [round(cx + 0.038, 6), round(cy + 0.032, 6)],
    ]


def get_demo_railway(coords: List[float]) -> List[List[float]]:
    cx, cy = coords[0], coords[1]
    return [
        [round(cx - 0.030, 6), round(cy + 0.028, 6)],
        [round(cx - 0.014, 6), round(cy + 0.012, 6)],
        [round(cx + 0.008, 6), round(cy - 0.005, 6)],
        [round(cx + 0.026, 6), round(cy - 0.022, 6)],
    ]


@router.get("/projects/{project_id}/gis")
def get_project_gis_feature_collection(project_id: str, db: Session = Depends(get_db)):
    """
    Returns a unified GeoJSON FeatureCollection for the project containing:
    - Project Centroid
    - Candidate Route LineStrings (Route A, B, C, D)
    - Corridor Ribbon Polygons
    - Cadastral Land Parcel Polygons with real-time risk, owner, and verification properties
    - Infrastructure landmarks, waterways, railway lines
    - Critical delay risk zone buffer
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")

    routes = db.query(Route).filter(Route.project_id == project_id).all()
    parcels = db.query(Parcel).filter(Parcel.project_id == project_id).all()
    stakeholders = db.query(Stakeholder).filter(Stakeholder.project_id == project_id).all()
    verifications = db.query(FieldVerification).filter(FieldVerification.project_id == project_id).all()
    risk_pred = db.query(RiskPrediction).filter(RiskPrediction.project_id == project_id).first()

    stakeholder_map = {s.parcel_id: s for s in stakeholders}
    verification_map = {v.parcel_id: v for v in verifications}

    features = []
    p_coords = project.coords if isinstance(project.coords, list) and len(project.coords) >= 2 else [80.237, 13.087]

    # 1. Project Centroid Feature
    features.append({
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": p_coords},
        "properties": {
            "entityType": "PROJECT",
            "id": project.id,
            "name": project.name,
            "type": project.type,
            "state": project.state,
            "district": project.district,
            "status": project.status,
            "budgetCr": project.estimated_budget_cr,
            "targetCompletion": project.target_completion,
            "overallProgress": project.overall_progress or 30.0,
            "selectedRouteId": project.selected_route_id or (routes[0].id if routes else "RT-1042-C"),
        },
    })

    # 2. Risk Buffer Zone
    risk_score = risk_pred.overall_pct if risk_pred else 68
    risk_band = risk_pred.band if risk_pred else "high"
    buffer_radius_deg = 0.026
    buffer_circle = [
        [
            round(p_coords[0] + buffer_radius_deg * math.cos(math.radians(a)), 6),
            round(p_coords[1] + buffer_radius_deg * math.sin(math.radians(a)), 6),
        ]
        for a in range(0, 365, 10)
    ]
    features.append({
        "type": "Feature",
        "geometry": {"type": "Polygon", "coordinates": [buffer_circle]},
        "properties": {
            "entityType": "RISK_BUFFER",
            "id": f"risk-zone-{project.id}",
            "riskScore": risk_score,
            "riskBand": risk_band,
            "color": RISK_HEX_MAP.get(risk_band, "#ef5b5b"),
            "predictedDelay": risk_pred.predicted_delay_label if risk_pred else "+4.2 months",
        },
    })

    # 3. Waterway Channel & Railway Line
    features.append({
        "type": "Feature",
        "geometry": {"type": "LineString", "coordinates": get_demo_waterway(p_coords)},
        "properties": {
            "entityType": "WATERWAY",
            "id": f"waterway-{project.id}",
            "name": "DEMO Kosasthalaiyar Waterway Channel",
            "widthMeters": 45,
            "color": "#1b547d",
        },
    })

    features.append({
        "type": "Feature",
        "geometry": {"type": "LineString", "coordinates": get_demo_railway(p_coords)},
        "properties": {
            "entityType": "RAILWAY",
            "id": f"railway-{project.id}",
            "name": "DEMO Southern Railway Main Line",
            "widthMeters": 6,
            "color": "#e8d15c",
        },
    })

    # 4. Route Alignments & Corridor Ribbons
    for r in routes:
        r_path = r.path if isinstance(r.path, list) else []
        r_color = ROUTE_COLOR_MAP.get(r.label, "#38d3f0")
        is_selected = (r.id == project.selected_route_id) or r.ai_recommended

        # Centerline Feature
        features.append({
            "type": "Feature",
            "geometry": {"type": "LineString", "coordinates": r_path},
            "properties": {
                "entityType": "ROUTE",
                "id": r.id,
                "projectId": r.project_id,
                "label": r.label,
                "strategy": r.strategy,
                "distanceKm": r.distance_km,
                "affectedParcels": r.affected_parcels,
                "stakeholders": r.stakeholders,
                "estimatedCostCr": r.estimated_cost_cr,
                "estimatedDelayMonths": r.estimated_delay_months,
                "delayProbabilityPct": r.delay_probability_pct,
                "infrastructureImpact": r.infrastructure_impact,
                "overallScore": r.overall_score,
                "aiRecommended": r.ai_recommended,
                "isSelected": is_selected,
                "color": r_color,
                "corridorWidthMeters": r.corridor_width_meters or 32.0,
                "lanes": r.lanes or 6,
            },
        })

        # Corridor Ribbon Footprint
        ribbon_coords = generate_corridor_ribbon_polygon(r_path, width_meters=r.corridor_width_meters or 32.0)
        if ribbon_coords:
            features.append({
                "type": "Feature",
                "geometry": {"type": "Polygon", "coordinates": [ribbon_coords]},
                "properties": {
                    "entityType": "CORRIDOR_RIBBON",
                    "id": f"corridor-{r.id}",
                    "routeId": r.id,
                    "label": r.label,
                    "color": r_color,
                    "isSelected": is_selected,
                },
            })

    # 5. Cadastral Land Parcels
    for p_idx, p in enumerate(parcels):
        p_poly = (
            p.polygon_coords
            if isinstance(p.polygon_coords, list) and len(p.polygon_coords) >= 4
            else generate_parcel_polygon_coords(p.coords, p.area_sq_ft, seed=p_idx + 1)
        )
        p_color = get_parcel_risk_color(p)
        sh = stakeholder_map.get(p.id)
        fv = verification_map.get(p.id)

        # Estimate delay based on risk & dispute
        delay_mo = 5.8 if p.disputed else (4.1 if p.risk_contribution == "critical" else (2.8 if p.risk_contribution == "high" else 0.8))
        risk_score_calc = 88 if p.disputed else (79 if p.risk_contribution == "high" else (48 if p.risk_contribution == "medium" else 22))

        features.append({
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [p_poly]},
            "properties": {
                "entityType": "PARCEL",
                "id": p.id,
                "parcelId": p.id,
                "projectId": p.project_id,
                "routeIds": p.route_ids or [],
                "coords": p.coords,
                "areaSqFt": p.area_sq_ft,
                "impact": p.impact,
                "landType": p.land_type,
                "ownerRef": p.owner_ref,
                "stakeholderName": sh.name if sh else p.owner_ref,
                "verification": p.verification,
                "acquisitionStatus": p.acquisition_status,
                "responseStatus": p.response_status or "PENDING",
                "notificationStatus": p.notification_status or "SENT",
                "documentsComplete": p.documents_complete,
                "documentsRequired": p.documents_required,
                "disputed": p.disputed,
                "riskContribution": p.risk_contribution,
                "riskScore": risk_score_calc,
                "riskLevel": p.risk_contribution.upper(),
                "estimatedDelayMonths": delay_mo,
                "assignedOfficer": fv.officer_name if fv else ("R. Vignesh" if p_idx % 2 == 0 else "P. Ananthi"),
                "assignedOfficerRef": fv.officer_ref if fv else ("OFF-08" if p_idx % 2 == 0 else "OFF-12"),
                "structuresPresent": p.structures_present,
                "structureType": p.structure_type or ("Residential House" if p.structures_present else "None"),
                "color": p_color,
            },
        })

    # 6. Infrastructure Landmarks
    for item in get_demo_landmarks(p_coords):
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": item["coords"]},
            "properties": {
                "entityType": "INFRASTRUCTURE",
                "id": item["id"],
                "name": item["name"],
                "type": item["type"],
                "icon": item["icon"],
            },
        })

    # 7. Field Verification Points
    for v in verifications:
        v_parcel = next((p for p in parcels if p.id == v.parcel_id), None)
        v_coords = v_parcel.coords if v_parcel else p_coords
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": v_coords},
            "properties": {
                "entityType": "FIELD_VERIFICATION",
                "id": v.id,
                "parcelId": v.parcel_id,
                "officerName": v.officer_name,
                "officerRef": v.officer_ref,
                "location": v.location,
                "priority": v.priority,
                "status": v.status,
                "verificationStatus": v.verification_status,
            },
        })

    return {
        "type": "FeatureCollection",
        "metadata": {
            "projectId": project.id,
            "projectName": project.name,
            "state": project.state,
            "district": project.district,
            "status": project.status,
            "routesCount": len(routes),
            "parcelsCount": len(parcels),
            "selectedRouteId": project.selected_route_id,
            "overallRiskScore": risk_score,
            "isDemoDataset": True,
        },
        "features": features,
    }


@router.get("/parcels/{parcel_id}/risk")
def get_parcel_risk_analytics(parcel_id: str, db: Session = Depends(get_db)):
    """Returns granular parcel-level delay risk drivers, delay estimation, and recommendations."""
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Parcel {parcel_id} not found")

    sh = db.query(Stakeholder).filter(Stakeholder.parcel_id == parcel_id).first()
    fv = db.query(FieldVerification).filter(FieldVerification.parcel_id == parcel_id).first()

    risk_score = 88 if parcel.disputed else (79 if parcel.risk_contribution == "critical" else (52 if parcel.risk_contribution == "high" else (35 if parcel.risk_contribution == "medium" else 18)))
    est_delay = 5.8 if parcel.disputed else (4.1 if parcel.risk_contribution == "critical" else (2.4 if parcel.risk_contribution == "high" else 0.5))

    drivers = []
    if parcel.disputed:
        drivers.append({"factor": "Active Title / Boundary Dispute", "contribution": 45, "severity": "CRITICAL"})
    if parcel.structures_present:
        drivers.append({"factor": f"Dwelling Encroachment ({parcel.structure_type})", "contribution": 25, "severity": "HIGH"})
    if parcel.documents_complete < parcel.documents_required:
        drivers.append({"factor": f"Pending Statutory Records ({parcel.documents_complete}/{parcel.documents_required})", "contribution": 20, "severity": "MEDIUM"})
    if parcel.verification != "VERIFIED":
        drivers.append({"factor": "Field Peg-Survey Pending", "contribution": 10, "severity": "LOW"})

    return {
        "parcelId": parcel.id,
        "projectId": parcel.project_id,
        "ownerRef": parcel.owner_ref,
        "stakeholderName": sh.name if sh else parcel.owner_ref,
        "areaSqFt": parcel.area_sq_ft,
        "landType": parcel.land_type,
        "riskScore": risk_score,
        "riskBand": parcel.risk_contribution.upper(),
        "estimatedDelayMonths": est_delay,
        "verificationStatus": parcel.verification,
        "acquisitionStatus": parcel.acquisition_status,
        "disputed": parcel.disputed,
        "assignedOfficer": fv.officer_name if fv else "R. Vignesh",
        "assignedOfficerRef": fv.officer_ref if fv else "OFF-08",
        "drivers": drivers,
        "recommendations": [
            "Initiate expedited conciliation dialogue with landholder",
            "Dispatch senior cadastral surveyor for GPS peg re-confirmation",
            "Fast-track compensation valuation certificate clearance",
        ],
    }


@router.post("/parcels/{parcel_id}/assign-officer")
def assign_officer_to_parcel(parcel_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Assigns a field surveyor to a parcel's verification task."""
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Parcel {parcel_id} not found")

    officer_ref = payload.get("officerRef", "OFF-08")
    officer_name = payload.get("officerName", "R. Vignesh")

    # Update or create field verification record
    fv = db.query(FieldVerification).filter(FieldVerification.parcel_id == parcel_id).first()
    if fv:
        fv.officer_ref = officer_ref
        fv.officer_name = officer_name
        fv.status = "Assigned"
    else:
        fv = FieldVerification(
            id=f"VER-{parcel_id.replace('P-', '')}",
            parcel_id=parcel_id,
            project_id=parcel.project_id,
            officer_ref=officer_ref,
            officer_name=officer_name,
            location=f"Parcel {parcel_id} Survey Zone",
            priority="High" if parcel.disputed else "Medium",
            status="Assigned",
            verification_status="PENDING",
        )
        db.add(fv)

    log_audit_event(
        db=db,
        project_id=parcel.project_id,
        actor="District Collector",
        action="OFFICER_ASSIGNED",
        entity="Parcel",
        entity_id=parcel_id,
        label=f"Officer {officer_name} assigned to Parcel {parcel_id}",
        category="Verification",
        details=f"Field verification task assigned. Owner: {parcel.owner_ref}",
    )
    db.commit()

    return {
        "status": "SUCCESS",
        "parcelId": parcel_id,
        "officerRef": officer_ref,
        "officerName": officer_name,
        "message": f"Officer {officer_name} successfully assigned to parcel {parcel_id}",
    }


@router.post("/parcels/{parcel_id}/verify")
def verify_parcel_endpoint(parcel_id: str, payload: Dict[str, Any] = None, db: Session = Depends(get_db)):
    """Completes field verification for a parcel, recalculates project risk, and logs audit trail."""
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Parcel {parcel_id} not found")

    parcel.verification = "VERIFIED"
    parcel.documents_complete = parcel.documents_required
    if parcel.disputed:
        parcel.disputed = False  # Dispute resolved through verification
        parcel.risk_contribution = "low"
    else:
        parcel.risk_contribution = "low"

    # Update field verification record
    fv = db.query(FieldVerification).filter(FieldVerification.parcel_id == parcel_id).first()
    if fv:
        fv.status = "Verified"
        fv.verification_status = "VERIFIED"

    # Recalculate live project predictive risk
    updated_risk = recalculate_and_persist_project_risk(db, parcel.project_id)

    log_audit_event(
        db=db,
        project_id=parcel.project_id,
        actor="Senior Field Surveyor",
        action="PARCEL_VERIFIED",
        entity="Parcel",
        entity_id=parcel_id,
        label=f"Parcel {parcel_id} verified on-site",
        category="Verification",
        details=f"Peg-survey confirmed. New project risk score: {updated_risk['overallPct']}%",
    )
    db.commit()

    return {
        "status": "SUCCESS",
        "parcelId": parcel_id,
        "verification": "VERIFIED",
        "riskContribution": parcel.risk_contribution,
        "projectRisk": updated_risk,
        "message": f"Parcel {parcel_id} verified successfully.",
    }


@router.get("/routes/{route_id}/gis")
def get_route_gis_geometry(route_id: str, db: Session = Depends(get_db)):
    """Returns route alignment LineString and corridor ribbon polygon."""
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Route {route_id} not found")

    r_path = route.path if isinstance(route.path, list) else []
    ribbon = generate_corridor_ribbon_polygon(r_path, width_meters=route.corridor_width_meters or 32.0)

    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "LineString", "coordinates": r_path},
                "properties": {
                    "id": route.id,
                    "label": route.label,
                    "strategy": route.strategy,
                    "distanceKm": route.distance_km,
                    "estimatedCostCr": route.estimated_cost_cr,
                    "color": ROUTE_COLOR_MAP.get(route.label, "#38d3f0"),
                },
            },
            {
                "type": "Feature",
                "geometry": {"type": "Polygon", "coordinates": [ribbon]},
                "properties": {
                    "id": f"corridor-{route.id}",
                    "routeId": route.id,
                    "color": ROUTE_COLOR_MAP.get(route.label, "#38d3f0"),
                },
            },
        ],
    }
