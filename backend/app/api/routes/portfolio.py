"""
LandGuard AI — Portfolio, Cross-Project Allocation & Network API Routes (Phase 6)
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.schemas.portfolio import (
    PortfolioSummaryResponse,
    OfficerCrossProjectWorkloadResponse,
    ContractorProjectView,
    ProjectAssignmentCreate,
    ProjectAssignmentResponse,
    ConnectivityGapResponse,
)
from backend.app.services.portfolio_service import (
    get_portfolio_summary,
    get_officer_cross_project_workload,
    get_contractor_projects,
    assign_user_to_project,
)
from backend.app.services.network_service import get_regional_road_network
from backend.app.db.models.design import ProjectAssignment

router = APIRouter(prefix="/portfolio", tags=["Multi-Project Portfolio & Workload Management"])


@router.get("/summary", response_model=PortfolioSummaryResponse)
def api_get_portfolio_summary(db: Session = Depends(get_db)):
    """Computes portfolio-wide KPIs across all active infrastructure projects."""
    return get_portfolio_summary(db)


@router.get("/officers/workload", response_model=List[OfficerCrossProjectWorkloadResponse])
def api_get_officer_workload(officer_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns cross-project workload and availability statistics for officers."""
    return get_officer_cross_project_workload(db, officer_id=officer_id)


@router.get("/contractor/projects", response_model=List[Dict[str, Any]])
def api_get_contractor_projects(
    contractor_name: str = Query("DEMO Infra Consortium"),
    db: Session = Depends(get_db),
):
    """Returns isolated project dashboard for authorized contractors."""
    return get_contractor_projects(db, contractor_name=contractor_name)


@router.get("/network/{project_id}")
def api_get_road_network(project_id: str):
    """Returns synthetic regional road network and identified connectivity gaps."""
    return get_regional_road_network(project_id)


@router.get("/assignments/{project_id}", response_model=List[ProjectAssignmentResponse])
def api_get_project_assignments(project_id: str, db: Session = Depends(get_db)):
    """Lists all user assignments for a project."""
    assignments = db.query(ProjectAssignment).filter(ProjectAssignment.project_id == project_id).all()
    return assignments


@router.post("/assignments/{project_id}", response_model=ProjectAssignmentResponse)
def api_create_project_assignment(
    project_id: str,
    req: ProjectAssignmentCreate,
    assigned_by: str = Query("System Administrator"),
    db: Session = Depends(get_db),
):
    """Admin Assignment Portal: Assigns an officer or contractor to a project."""
    return assign_user_to_project(
        db=db,
        project_id=project_id,
        user_id=req.user_id,
        user_name=req.user_name,
        role=req.role,
        designation=req.designation,
        assigned_by=assigned_by,
    )
