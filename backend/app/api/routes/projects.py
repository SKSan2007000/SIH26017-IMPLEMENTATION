from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import uuid
from backend.app.db.database import get_db
from backend.app.db.models.project import Project
from backend.app.db.models.parcel import Parcel
from backend.app.db.models.stakeholder import Stakeholder
from backend.app.db.models.route import Route
from backend.app.schemas.project import ProjectCreate, ProjectUpdate
from backend.app.api.deps import require_roles, get_current_user
from backend.app.core.security import UserRole
from backend.app.services.audit_service import log_audit_event

router = APIRouter()


def format_project_dict(p: Project) -> Dict[str, Any]:
    return {
        "id": p.id,
        "name": p.name,
        "type": p.type,
        "description": p.description or f"{p.type} project corridor in {p.district}, {p.state}.",
        "state": p.state,
        "district": p.district,
        "taluk": p.taluk,
        "city": p.city,
        "status": p.status,
        "priority": p.priority or "HIGH",
        "coords": p.coords,
        "startLocation": p.start_location,
        "destination": p.destination,
        "estimatedBudgetCr": p.estimated_budget_cr,
        "targetCompletion": p.target_completion,
        "requiredLandAreaAcres": p.required_land_area_acres,
        "corridorLengthKm": p.corridor_length_km or 48.5,
        "rightOfWayM": p.right_of_way_m or 60.0,
        "currentStageIndex": p.current_stage_index,
        "bottleneckStageIndex": p.bottleneck_stage_index,
        "selectedRouteId": p.selected_route_id,
        "projectHeadId": p.project_head_id,
        "districtOfficerId": p.district_officer_id,
        "laoId": p.lao_id,
        "fieldOfficerId": p.field_officer_id,
        "supervisorId": p.supervisor_id,
        "activeContractorId": p.active_contractor_id,
        "workflowState": p.workflow_state or "PLANNING",
        "overallProgress": p.overall_progress or 25.0,
        "landAcquisitionProgress": p.land_acquisition_progress or 30.0,
        "constructionProgress": p.construction_progress or 0.0,
        "parcelsCount": len(p.parcels) if p.parcels else p.parcels_count,
        "stakeholdersCount": len(p.stakeholders) if p.stakeholders else p.stakeholders_count,
        "createdAt": p.created_at.isoformat() if p.created_at else None,
        "updatedAt": p.updated_at.isoformat() if p.updated_at else None,
    }


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
def list_projects(
    state: Optional[str] = None,
    district: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Project)
    if state:
        query = query.filter(Project.state.ilike(f"%{state}%"))
    if district:
        query = query.filter(Project.district.ilike(f"%{district}%"))
    projects = query.all()
    return [format_project_dict(p) for p in projects]


@router.get("/{project_id}", response_model=Dict[str, Any])
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")
    return format_project_dict(project)


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
):
    from backend.app.services.design_service import generate_ai_designs
    from backend.app.services.assignment_service import assign_project_officers_automatically
    from backend.app.db.models.notification import Notification
    from datetime import datetime, timezone

    # Resolve project ID/code
    p_id = (project_in.id or project_in.project_code or "").strip()
    if p_id:
        existing = db.query(Project).filter(Project.id == p_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Project code '{p_id}' already exists in database. Please specify a unique project code."
            )
    else:
        existing_count = db.query(Project).count()
        p_id = f"LG-PRJ-2026-{str(existing_count + 1).zfill(3)}"

    # Geographic coordinates fallback based on district
    p_district = (project_in.district or "Chennai").strip()
    p_state = (project_in.state or "Tamil Nadu").strip()

    coords = project_in.coords
    if not coords or len(coords) < 2:
        district_coords_map = {
            "chennai": [80.2707, 13.0827],
            "salem": [78.1460, 11.6643],
            "coimbatore": [76.9558, 11.0168],
            "madurai": [78.1198, 9.9252],
            "tiruchirappalli": [78.7047, 10.7905],
            "kanchipuram": [79.7036, 12.8342],
            "bengaluru": [77.5946, 12.9716],
            "vellore": [79.1325, 12.9165],
        }
        coords = district_coords_map.get(p_district.lower(), [80.22, 13.12])

    p_name = project_in.name.strip()
    p_type = project_in.project_type or project_in.type or "Highway Corridor"
    p_budget = project_in.estimated_budget_cr or project_in.project_value or 850.0
    p_acres = project_in.required_land_area_acres or project_in.land_required_acres or 145.0
    p_target = project_in.target_completion or project_in.target_completion_date or "2028-12-31"
    p_start = project_in.start_location or f"{p_district} Central"
    p_end = project_in.destination or project_in.end_location or f"{p_district} Industrial Node"

    project = Project(
        id=p_id,
        name=p_name,
        type=p_type,
        description=project_in.description or f"{p_type} corridor in {p_district}, {p_state}.",
        state=p_state,
        district=p_district,
        taluk=project_in.taluk or f"{p_district} Taluk",
        city=project_in.city or p_district,
        priority=project_in.priority or "HIGH",
        status="Planning",
        coords=coords,
        start_location=p_start,
        destination=p_end,
        estimated_budget_cr=p_budget,
        target_completion=p_target,
        required_land_area_acres=p_acres,
        corridor_length_km=project_in.corridor_length_km or 45.0,
        right_of_way_m=project_in.right_of_way_m or 60.0,
        current_stage_index=project_in.current_stage_index or 0,
        bottleneck_stage_index=project_in.bottleneck_stage_index or 1,
        selected_route_id=project_in.selected_route_id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Auto-generate 4 AI Design Alternatives for the new project corridor
    try:
        generate_ai_designs(db, project_id=p_id, count=4)
    except Exception as e:
        pass

    # Create Initial Audit & Notification
    now = datetime.now(timezone.utc)
    notif = Notification(
        id=f"NTF-PRJ-{uuid.uuid4().hex[:8]}",
        project_id=p_id,
        category="Project Intake",
        severity="Medium",
        message=f"New project {project.name} ({p_id}) initiated in {project.district}. 4 AI candidate alignments computed.",
        timestamp=now.isoformat(),
        read=False,
    )
    db.add(notif)

    log_audit_event(
        db=db,
        project_id=p_id,
        actor="Super Admin",
        action="PROJECT_CREATED",
        entity="Project",
        entity_id=p_id,
        label=f"Project {project.name} initialized",
        category="System",
        details=f"Created {project.type} project in {project.district}, {project.state}. Budget: ₹{project.estimated_budget_cr} Cr, Land: {project.required_land_area_acres} Acres.",
    )
    db.commit()

    # Automatically run 6-Role Team Assignment Engine if requested (default True)
    team_result = None
    if project_in.auto_assign_team:
        try:
            team_result = assign_project_officers_automatically(
                db=db,
                project_id=p_id,
                district=p_district,
                project_type=p_type,
            )
        except Exception as e:
            team_result = {"error": str(e)}

    formatted = format_project_dict(project)
    if team_result and "team" in team_result:
        formatted["team"] = team_result["team"]
        formatted["allocationDetails"] = team_result.get("team")
        formatted["status"] = "TEAM_ASSIGNED"

    return formatted


@router.post("/{project_id}/auto-assign-team", response_model=Dict[str, Any])
def api_auto_assign_team(
    project_id: str,
    district: Optional[str] = Query(None),
    zone: Optional[str] = Query(None),
    max_capacity: int = Query(5),
    db: Session = Depends(get_db),
):
    """Triggers/Re-runs automatic AI team assignment across all 6 core project roles."""
    from backend.app.services.assignment_service import assign_project_officers_automatically
    return assign_project_officers_automatically(
        db=db,
        project_id=project_id,
        district=district,
        zone=zone,
        max_capacity=max_capacity,
    )


@router.get("/{project_id}/team", response_model=Dict[str, Any])
def api_get_project_team(project_id: str, db: Session = Depends(get_db)):
    """Returns all current project team assignments, role profiles, and capacity statuses."""
    from backend.app.services.assignment_service import get_project_team_details
    return get_project_team_details(db, project_id=project_id)


@router.get("/{project_id}/allocation-details", response_model=Dict[str, Any])
def api_get_allocation_details(project_id: str, db: Session = Depends(get_db)):
    """Returns transparent mathematical breakdown, scoring, and explainability for judge review."""
    from backend.app.services.assignment_service import get_project_allocation_details
    return get_project_allocation_details(db, project_id=project_id)


@router.put("/{project_id}", response_model=Dict[str, Any])
def update_project(
    project_id: str,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")

    update_data = project_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if hasattr(project, field):
            setattr(project, field, val)

    db.commit()
    db.refresh(project)

    log_audit_event(
        db=db,
        project_id=project_id,
        actor="Super Admin",
        action="PROJECT_APPROVED" if project.status == "Approved" else "PROJECT_UPDATED",
        entity="Project",
        entity_id=project_id,
        label=f"Project {project_id} status updated to {project.status}",
        category="System",
        details=f"Updated project stage/attributes",
    )

    return format_project_dict(project)
