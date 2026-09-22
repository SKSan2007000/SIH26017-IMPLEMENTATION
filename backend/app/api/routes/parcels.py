from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from backend.app.db.database import get_db
from backend.app.db.models.parcel import Parcel
from backend.app.db.models.route import Route
from backend.app.schemas.parcel import ParcelCreate, ParcelUpdate
from backend.app.services.spatial_service import compute_affected_parcels_for_route
from backend.app.services.audit_service import log_audit_event

router = APIRouter()


def format_parcel_dict(p: Parcel) -> Dict[str, Any]:
    return {
        "id": p.id,
        "projectId": p.project_id,
        "routeIds": p.route_ids or [],
        "coords": p.coords,
        "polygonCoords": p.polygon_coords,
        "areaSqFt": p.area_sq_ft,
        "impact": p.impact,
        "landType": p.land_type,
        "ownerRef": p.owner_ref,
        "verification": p.verification,
        "acquisitionStatus": p.acquisition_status,
        "responseStatus": p.response_status or "PENDING",
        "notificationStatus": p.notification_status or "NOT SENT",
        "documentsComplete": p.documents_complete,
        "documentsRequired": p.documents_required,
        "disputed": p.disputed,
        "riskContribution": p.risk_contribution,
        "structuresPresent": p.structures_present,
        "structureType": p.structure_type,
    }


@router.get("/projects/{project_id}/parcels", response_model=List[Dict[str, Any]])
def list_project_parcels(project_id: str, db: Session = Depends(get_db)):
    parcels = db.query(Parcel).filter(Parcel.project_id == project_id).all()
    return [format_parcel_dict(p) for p in parcels]


@router.get("/routes/{route_id}/affected-parcels", response_model=List[Dict[str, Any]])
def get_affected_parcels_spatial(route_id: str, db: Session = Depends(get_db)):
    """
    Computes affected parcels for the route using real PostGIS / Shapely spatial corridor buffer intersection.
    Returns: parcel ID, geometry, area, impact, risk, stakeholder ID.
    """
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Route {route_id} not found")

    parcels = db.query(Parcel).filter(Parcel.project_id == route.project_id).all()
    affected = compute_affected_parcels_for_route(route, parcels)
    return affected


@router.get("/routes/{route_id}/parcels", response_model=List[Dict[str, Any]])
def list_parcels_by_route(route_id: str, db: Session = Depends(get_db)):
    """Frontend compatibility endpoint for route parcels."""
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Route {route_id} not found")

    parcels = db.query(Parcel).filter(Parcel.project_id == route.project_id).all()
    affected_spatial = compute_affected_parcels_for_route(route, parcels)
    affected_ids = {item["id"] for item in affected_spatial}

    matched_parcels = [p for p in parcels if p.id in affected_ids]
    return [format_parcel_dict(p) for p in matched_parcels]


@router.get("/parcels/{parcel_id}", response_model=Dict[str, Any])
def get_parcel(parcel_id: str, db: Session = Depends(get_db)):
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Parcel {parcel_id} not found")
    return format_parcel_dict(parcel)


@router.post("/projects/{project_id}/parcels", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_parcel(project_id: str, parcel_in: ParcelCreate, db: Session = Depends(get_db)):
    p_id = parcel_in.id or f"P-{uuid.uuid4().hex[:4].upper()}"
    parcel = Parcel(
        id=p_id,
        project_id=project_id,
        route_ids=parcel_in.route_ids,
        coords=parcel_in.coords,
        polygon_coords=parcel_in.polygon_coords,
        area_sq_ft=parcel_in.area_sq_ft,
        impact=parcel_in.impact,
        land_type=parcel_in.land_type,
        owner_ref=parcel_in.owner_ref,
        verification=parcel_in.verification,
        acquisition_status=parcel_in.acquisition_status,
        response_status=parcel_in.response_status or "PENDING",
        notification_status=parcel_in.notification_status or "NOT SENT",
        documents_complete=parcel_in.documents_complete,
        documents_required=parcel_in.documents_required,
        disputed=parcel_in.disputed,
        risk_contribution=parcel_in.risk_contribution,
        structures_present=parcel_in.structures_present,
        structure_type=parcel_in.structure_type,
    )
    db.add(parcel)
    db.commit()
    db.refresh(parcel)

    log_audit_event(
        db=db,
        project_id=project_id,
        actor="Cadastral Team",
        action="PARCEL_CREATED",
        entity="Parcel",
        entity_id=p_id,
        label=f"Parcel {p_id} registered",
        category="Verification",
        details=f"Owner: {parcel.owner_ref}, Area: {parcel.area_sq_ft} sq ft, Land: {parcel.land_type}",
    )

    return format_parcel_dict(parcel)


@router.put("/parcels/{parcel_id}", response_model=Dict[str, Any])
def update_parcel(parcel_id: str, parcel_in: ParcelUpdate, db: Session = Depends(get_db)):
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Parcel {parcel_id} not found")

    prev_verification = parcel.verification
    update_data = parcel_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if hasattr(parcel, k):
            setattr(parcel, k, v)

    db.commit()
    db.refresh(parcel)

    if parcel.verification != prev_verification and parcel.verification == "VERIFIED":
        log_audit_event(
            db=db,
            project_id=parcel.project_id,
            actor="LAO Officer",
            action="PARCEL_VERIFIED",
            entity="Parcel",
            entity_id=parcel_id,
            label=f"Parcel {parcel_id} field-verified",
            category="Verification",
            details=f"Status changed to VERIFIED. Owner: {parcel.owner_ref}",
        )

    return format_parcel_dict(parcel)
