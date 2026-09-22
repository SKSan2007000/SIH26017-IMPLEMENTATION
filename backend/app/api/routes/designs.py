"""
LandGuard AI — Multi-Design & Versioning API Routes (Phase 6)
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.schemas.design import (
    DesignResponse,
    DesignGenerateRequest,
    DesignVersionCreate,
    DesignVersionResponse,
    DesignRecalculateRequest,
    DesignRecalculateResponse,
    DesignComparisonResponse,
    DesignChangeRequestCreate,
    DesignChangeRequestReview,
    DesignChangeRequestResponse,
    DesignPackageResponse,
)
from backend.app.services.design_service import (
    get_project_designs,
    generate_ai_designs,
    create_design_version,
    recalculate_design_metrics,
    compare_designs,
    approve_design_version,
    get_design_package,
    create_design_change_request,
    review_design_change_request,
)
from backend.app.db.models.design import Design, DesignChangeRequest

router = APIRouter(prefix="/designs", tags=["Multi-Design & Versioning Engine"])


@router.get("/project/{project_id}", response_model=List[Dict[str, Any]])
def api_get_project_designs(project_id: str, db: Session = Depends(get_db)):
    """Retrieves all candidate designs and version histories for a project."""
    return get_project_designs(db, project_id)


@router.post("/generate", response_model=List[Dict[str, Any]])
def api_generate_ai_designs(req: DesignGenerateRequest, db: Session = Depends(get_db)):
    """AI Generation Engine: Dynamically generates candidate design alternatives."""
    return generate_ai_designs(db, project_id=req.project_id, count=req.count)


@router.post("/project/{project_id}/compare", response_model=DesignComparisonResponse)
def api_compare_project_designs(
    project_id: str,
    design_ids: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
):
    """Multi-Design Comparison Engine: Compares 2, 3, or 4 designs with dynamic ranking."""
    return compare_designs(db, project_id=project_id, design_ids=design_ids)


@router.post("/recalculate/{project_id}", response_model=DesignRecalculateResponse)
def api_recalculate_design(
    project_id: str,
    req: DesignRecalculateRequest,
    db: Session = Depends(get_db),
):
    """
    Officer Redesign Engine: Instantly recalculates land impact, cost, time,
    and ML delay risk for modified alignment geometry without saving.
    """
    res = recalculate_design_metrics(
        db=db,
        project_id=project_id,
        route_geometry=req.route_geometry,
        corridor_width_meters=req.corridor_width_meters or 32.0,
        strategy=req.strategy,
    )
    return res


@router.post("/{design_id}/versions", response_model=Dict[str, Any])
def api_create_design_version(
    design_id: str,
    req: DesignVersionCreate,
    db: Session = Depends(get_db),
):
    """Officer Redesign Engine: Saves a new immutable version of an existing design."""
    return create_design_version(
        db=db,
        design_id=design_id,
        route_geometry=req.route_geometry,
        created_by=req.created_by,
        source=req.source,
        notes=req.notes,
        corridor_width_meters=req.corridor_width_meters or 32.0,
    )


@router.post("/{design_id}/approve")
def api_approve_design(
    design_id: str,
    version_id: Optional[str] = None,
    approved_by: str = "Dr. A. Sundaram (Project Director)",
    db: Session = Depends(get_db),
):
    """Approves a design version and generates the release package for EPC contractors."""
    return approve_design_version(db, design_id=design_id, version_id=version_id, approved_by=approved_by)


@router.get("/{design_id}/package", response_model=DesignPackageResponse)
def api_get_design_package(design_id: str, db: Session = Depends(get_db)):
    """Retrieves the official approved engineering design package for a design."""
    return get_design_package(db, design_id=design_id)


@router.post("/{design_id}/change-requests", response_model=Dict[str, Any])
def api_create_change_request(
    design_id: str,
    req: DesignChangeRequestCreate,
    project_id: str = Query(...),
    db: Session = Depends(get_db),
):
    """Contractor Workflow: Submits a design change request with AI impact analysis."""
    return create_design_change_request(
        db=db,
        project_id=project_id,
        design_id=design_id,
        title=req.title,
        reason=req.reason,
        contractor_id=req.contractor_id,
        contractor_name=req.contractor_name,
        requested_modifications=req.requested_modifications,
        proposed_geometry=req.proposed_geometry,
    )


@router.get("/project/{project_id}/change-requests", response_model=List[Dict[str, Any]])
def api_list_project_change_requests(project_id: str, db: Session = Depends(get_db)):
    """Lists all design change requests for a project."""
    crs = db.query(DesignChangeRequest).filter(DesignChangeRequest.project_id == project_id).all()
    return [
        {
            "id": c.id,
            "project_id": c.project_id,
            "design_id": c.design_id,
            "version_id": c.version_id,
            "contractor_id": c.contractor_id,
            "contractor_name": c.contractor_name,
            "title": c.title,
            "reason": c.reason,
            "requested_modifications": c.requested_modifications,
            "proposed_geometry": c.proposed_geometry,
            "officer_review_status": c.officer_review_status,
            "officer_comment": c.officer_comment,
            "ai_impact_analysis": c.ai_impact_analysis,
            "created_at": c.created_at.isoformat() if c.created_at else "",
            "reviewed_at": c.reviewed_at.isoformat() if c.reviewed_at else None,
            "reviewed_by": c.reviewed_by,
        }
        for c in crs
    ]


@router.post("/change-requests/{request_id}/review", response_model=Dict[str, Any])
def api_review_change_request(
    request_id: str,
    review: DesignChangeRequestReview,
    db: Session = Depends(get_db),
):
    """Officer Review: Approves or rejects a contractor design change request."""
    return review_design_change_request(
        db=db,
        request_id=request_id,
        status=review.officer_review_status,
        officer_comment=review.officer_comment,
        reviewer_name=review.reviewer_name,
    )
