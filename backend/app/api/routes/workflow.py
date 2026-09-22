from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.schemas.operational import (
    ProjectStateTransitionRequest,
    ProjectStateTransitionResponse,
    ParcelWorkflowUpdateRequest,
    ParcelWorkflowUpdateResponse,
)
from backend.app.services.workflow_service import (
    transition_project_state,
    update_parcel_workflow_status,
    calculate_project_actual_progress,
    PROJECT_WORKFLOW_STATES,
    PARCEL_WORKFLOW_STATES,
)

router = APIRouter(prefix="/workflow", tags=["Operational Workflow"])


@router.get("/states")
def get_available_workflow_states() -> Dict[str, Any]:
    """Returns all recognized project and parcel workflow states."""
    return {
        "projectWorkflowStates": PROJECT_WORKFLOW_STATES,
        "parcelWorkflowStates": PARCEL_WORKFLOW_STATES,
    }


@router.post("/projects/{project_id}/transition", response_model=ProjectStateTransitionResponse)
def api_transition_project_state(
    project_id: str,
    req: ProjectStateTransitionRequest,
    db: Session = Depends(get_db),
):
    """
    Controlled project state machine transition endpoint.
    Validates state machine transition rules and updates progress.
    """
    return transition_project_state(
        db,
        project_id=project_id,
        target_state=req.target_state,
        actor_name=req.actor_name or "Project Director",
        actor_role=req.actor_role or "PROJECT_HEAD",
        notes=req.notes,
        force=req.force or False,
    )


@router.get("/projects/{project_id}/progress")
def api_get_project_progress(
    project_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Calculates live project, land acquisition, and construction progress from workflow data."""
    return calculate_project_actual_progress(db, project_id)


@router.put("/parcels/{parcel_id}/status", response_model=ParcelWorkflowUpdateResponse)
def api_update_parcel_status(
    parcel_id: str,
    req: ParcelWorkflowUpdateRequest,
    db: Session = Depends(get_db),
):
    """Updates a cadastral parcel acquisition state in the operational workflow."""
    return update_parcel_workflow_status(
        db,
        parcel_id=parcel_id,
        target_status=req.target_status,
        actor_name=req.actor_name or "Land Acquisition Officer",
        notes=req.notes,
    )
