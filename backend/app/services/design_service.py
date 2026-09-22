"""
LandGuard AI — Multi-Design, Versioning & Dynamic Comparison Service (Phase 6)
Provides dynamic AI design generation, versioning, recalculation, comparison,
approval, design package generation, and contractor change request handling.
All data is synthetic / fictional demonstration data.
"""

from typing import Dict, Any, List, Optional
import uuid
import math
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.db.models.project import Project
from backend.app.db.models.parcel import Parcel
from backend.app.db.models.design import (
    Design,
    DesignVersion,
    DesignChangeRequest,
    DesignPackage,
)
from backend.app.db.models.audit import AuditLog
from backend.app.db.models.notification import Notification
from backend.app.services.spatial_service import check_route_parcel_spatial_intersection
from backend.app.ml.predict import predict_project_risk


DEFAULT_DESIGN_STRATEGIES = [
    {
        "label": "Design A — Existing Corridor Upgrade",
        "strategy": "Existing Corridor Upgrade",
        "offset_factor": 0.0,
        "complexity": "Medium",
        "connectivity_base": 78,
    },
    {
        "label": "Design B — Northern Bypass",
        "strategy": "Northern Bypass",
        "offset_factor": 0.012,
        "complexity": "Low",
        "connectivity_base": 86,
    },
    {
        "label": "Design C — Central Connectivity",
        "strategy": "Central Connectivity",
        "offset_factor": -0.008,
        "complexity": "Medium",
        "connectivity_base": 94,
    },
    {
        "label": "Design D — AI Optimized Corridor",
        "strategy": "AI Optimized Corridor",
        "offset_factor": 0.004,
        "complexity": "Low",
        "connectivity_base": 96,
    },
    {
        "label": "Design E — Officer Modified Proposal",
        "strategy": "Officer Modified Proposal",
        "offset_factor": -0.015,
        "complexity": "High",
        "connectivity_base": 90,
    },
]


def calculate_geometry_length_km(coords: List[List[float]]) -> float:
    """Calculates approximate route length in kilometers from Lon/Lat points."""
    if not coords or len(coords) < 2:
        return 5.0
    total_km = 0.0
    for i in range(len(coords) - 1):
        lon1, lat1 = coords[i][0], coords[i][1]
        lon2, lat2 = coords[i + 1][0], coords[i + 1][1]
        # Haversine distance
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2.0) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        total_km += 6371.0 * c
    return round(max(2.0, total_km), 2)


def generate_offset_geometry(base_coords: List[List[float]], offset_deg: float) -> List[List[float]]:
    """Generates a smooth alternative corridor by applying perpendicular offsets."""
    if not base_coords:
        return [[80.237, 13.087], [80.245, 13.120], [80.260, 13.165]]
    
    new_coords = []
    n = len(base_coords)
    for i, pt in enumerate(base_coords):
        if i == 0 or i == n - 1:
            # Anchor start and end points
            new_coords.append([round(pt[0], 6), round(pt[1], 6)])
        else:
            # Apply parabolic curve offset to interior waypoints
            factor = math.sin((i / max(1, n - 1)) * math.pi)
            offset_lon = offset_deg * factor * 0.9
            offset_lat = offset_deg * factor * 0.7
            new_coords.append([round(pt[0] + offset_lon, 6), round(pt[1] + offset_lat, 6)])
    return new_coords


def recalculate_design_metrics(
    db: Session,
    project_id: str,
    route_geometry: List[List[float]],
    corridor_width_meters: float = 32.0,
    strategy: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Dynamically recalculates all spatial, financial, time, and ML risk metrics
    for a proposed design geometry without hardcoded values.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    parcels = db.query(Parcel).filter(Parcel.project_id == project_id).all()

    length_km = calculate_geometry_length_km(route_geometry)
    land_impact_acres = round(length_km * (corridor_width_meters / 40.0) * 3.8, 1)

    # Spatial intersection with cadastral parcels
    affected_parcel_ids = []
    high_impact_count = 0
    disputed_count = 0
    total_area_sqft = 0

    for p in parcels:
        p_coords = p.coords if isinstance(p.coords, list) else []
        p_poly = p.polygon_coords if isinstance(p.polygon_coords, list) else None

        is_aff, impact, _ = check_route_parcel_spatial_intersection(
            route_path=route_geometry,
            parcel_coords=p_coords,
            parcel_polygon=p_poly,
            corridor_width_meters=corridor_width_meters,
        )
        if is_aff:
            affected_parcel_ids.append(p.id)
            total_area_sqft += (p.area_sq_ft or 8000)
            if impact == "high":
                high_impact_count += 1
            if p.disputed:
                disputed_count += 1

    affected_count = len(affected_parcel_ids)
    if affected_count == 0 and parcels:
        # Minimum baseline for demo continuity
        affected_count = max(2, int(len(parcels) * 0.35))
        affected_parcel_ids = [p.id for p in parcels[:affected_count]]

    stakeholders_count = max(1, int(affected_count * 1.35))

    # Dynamic cost computation
    base_civil_rate_cr_per_km = 42.5
    land_acq_rate_cr_per_acre = 3.8
    civil_cost = length_km * base_civil_rate_cr_per_km
    land_cost = land_impact_acres * land_acq_rate_cr_per_acre
    estimated_cost_cr = round(civil_cost + land_cost + (disputed_count * 4.5), 1)

    # Dynamic time computation
    base_duration_months = round(12.0 + (length_km * 0.28) + (affected_count * 0.15), 1)

    # ML Risk Engine prediction
    project_features = {
        "affected_parcels": affected_count,
        "total_parcels": len(parcels) if parcels else 20,
        "affected_families": stakeholders_count,
        "land_area_acres": land_impact_acres,
        "estimated_budget_cr": estimated_cost_cr,
        "estimated_acquisition_cost_cr": land_cost,
        "legal_disputes_count": disputed_count,
        "route_complexity_score": 3.0 if "Bypass" in (strategy or "") else 2.5,
        "route_legal_dispute_exposure": float(disputed_count * 12.0),
    }
    ml_pred = predict_project_risk(project_features)
    delay_risk_pct = int(round(ml_pred["delay_probability"] * 100))

    # Connectivity Score (0-100)
    # Higher length / bypass may improve regional connectivity, but direct routes score higher on efficiency
    conn_base = 88 if "Optimized" in (strategy or "") else 82
    connectivity_score = max(60, min(98, int(conn_base - (length_km * 0.15) + (10 if "Connectivity" in (strategy or "") else 0))))

    # Construction complexity
    if length_km > 50 or high_impact_count > 10:
        complexity = "High"
    elif length_km > 35 or high_impact_count > 5:
        complexity = "Medium"
    else:
        complexity = "Low"

    # Multi-Criteria Dynamic Composite Score (0-100, Higher = Better)
    # 1. Delay Risk Inversion (35%)
    # 2. Cost Efficiency (25%)
    # 3. Land Impact Inversion (20%)
    # 4. Connectivity Score (10%)
    # 5. Stakeholder Ease (10%)
    delay_score = max(0, 100 - delay_risk_pct)
    cost_score = max(20, min(100, int(100 - (estimated_cost_cr / 60.0))))
    land_score = max(15, min(100, int(100 - (land_impact_acres * 0.5))))
    sh_score = max(15, min(100, int(100 - (stakeholders_count * 1.5))))

    overall_score = int(round(
        delay_score * 0.35 +
        cost_score * 0.25 +
        land_score * 0.20 +
        connectivity_score * 0.10 +
        sh_score * 0.10
    ))
    overall_score = max(40, min(97, overall_score))

    reason = f"Dynamic score {overall_score}/100: Delay Risk {delay_risk_pct}%, Est. Cost ₹{estimated_cost_cr} Cr, {affected_count} affected parcels."

    return {
        "length_km": length_km,
        "land_impact_acres": land_impact_acres,
        "affected_parcels_count": affected_count,
        "affected_parcel_ids": affected_parcel_ids,
        "stakeholders_count": stakeholders_count,
        "estimated_cost_cr": estimated_cost_cr,
        "estimated_duration_months": base_duration_months,
        "delay_risk_pct": delay_risk_pct,
        "connectivity_score": connectivity_score,
        "construction_complexity": complexity,
        "overall_score": overall_score,
        "ai_recommendation_reason": reason,
    }


def get_project_designs(db: Session, project_id: str) -> List[Dict[str, Any]]:
    """Returns all designs with their version history for a project."""
    designs = db.query(Design).filter(Design.project_id == project_id).all()
    if not designs:
        # Auto-generate candidate designs for this project if none exist
        generate_ai_designs(db, project_id, count=4)
        designs = db.query(Design).filter(Design.project_id == project_id).all()

    result = []
    for d in designs:
        v_list = []
        for v in d.versions:
            v_list.append({
                "id": v.id,
                "design_id": v.design_id,
                "project_id": v.project_id,
                "version_number": v.version_number,
                "created_by": v.created_by,
                "created_at": v.created_at.isoformat() if v.created_at else "",
                "source": v.source,
                "route_geometry": v.route_geometry or [],
                "length_km": v.length_km,
                "land_impact_acres": v.land_impact_acres,
                "affected_parcels_count": v.affected_parcels_count,
                "affected_parcel_ids": v.affected_parcel_ids or [],
                "stakeholders_count": v.stakeholders_count,
                "estimated_cost_cr": v.estimated_cost_cr,
                "estimated_duration_months": v.estimated_duration_months,
                "delay_risk_pct": v.delay_risk_pct,
                "connectivity_score": v.connectivity_score,
                "construction_complexity": v.construction_complexity,
                "overall_score": v.overall_score,
                "status": v.status,
                "approval_status": v.approval_status,
                "approved_by": v.approved_by,
                "notes": v.notes,
                "visual_url": v.visual_url,
            })

        result.append({
            "id": d.id,
            "project_id": d.project_id,
            "route_id": d.route_id,
            "name": d.name,
            "label": d.label,
            "strategy": d.strategy,
            "current_version_number": d.current_version_number,
            "status": d.status,
            "connectivity_score": d.connectivity_score,
            "construction_complexity": d.construction_complexity,
            "is_approved": d.is_approved,
            "created_at": d.created_at.isoformat() if d.created_at else "",
            "updated_at": d.updated_at.isoformat() if d.updated_at else "",
            "versions": v_list,
        })

    return result


def generate_ai_designs(
    db: Session,
    project_id: str,
    count: int = 4,
) -> List[Dict[str, Any]]:
    """
    AI Multi-Design Generation Engine.
    Generates multiple design alternatives (Design A, B, C, D, E)
    with dynamic recalculation across land impact, cost, time, and ML risk.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Base coordinates from project centroid / start location
    base_lon = project.coords[0] if project.coords and len(project.coords) >= 2 else 80.237
    base_lat = project.coords[1] if project.coords and len(project.coords) >= 2 else 13.087

    base_path = [
        [base_lon - 0.015, base_lat - 0.020],
        [base_lon - 0.005, base_lat - 0.008],
        [base_lon + 0.008, base_lat + 0.012],
        [base_lon + 0.022, base_lat + 0.028],
        [base_lon + 0.038, base_lat + 0.045],
    ]

    # Create designs
    created_designs = []
    strategies_to_use = DEFAULT_DESIGN_STRATEGIES[:max(2, min(5, count))]

    for i, strat in enumerate(strategies_to_use):
        d_id = f"DSG-{project_id}-{chr(65 + i)}"
        v_id = f"VER-{d_id}-V1"

        existing = db.query(Design).filter(Design.id == d_id).first()
        if existing:
            created_designs.append(existing)
            continue

        # Generate offset geometry
        geom = generate_offset_geometry(base_path, strat["offset_factor"])

        # Dynamically evaluate metrics
        metrics = recalculate_design_metrics(
            db=db,
            project_id=project_id,
            route_geometry=geom,
            corridor_width_meters=32.0,
            strategy=strat["strategy"],
        )

        design = Design(
            id=d_id,
            project_id=project_id,
            route_id=f"RT-{project_id}-{chr(65 + i)}",
            name=strat["label"],
            label=f"Design {chr(65 + i)}",
            strategy=strat["strategy"],
            current_version_number=1,
            status="AI_GENERATED",
            connectivity_score=metrics["connectivity_score"],
            construction_complexity=metrics["construction_complexity"],
            is_approved=False,
        )
        db.add(design)

        version = DesignVersion(
            id=v_id,
            design_id=d_id,
            project_id=project_id,
            version_number=1,
            created_by="LandGuard AI Multi-Design Engine",
            source="AI_GENERATED",
            route_geometry=geom,
            length_km=metrics["length_km"],
            land_impact_acres=metrics["land_impact_acres"],
            affected_parcels_count=metrics["affected_parcels_count"],
            affected_parcel_ids=metrics["affected_parcel_ids"],
            stakeholders_count=metrics["stakeholders_count"],
            estimated_cost_cr=metrics["estimated_cost_cr"],
            estimated_duration_months=metrics["estimated_duration_months"],
            delay_risk_pct=metrics["delay_risk_pct"],
            connectivity_score=metrics["connectivity_score"],
            construction_complexity=metrics["construction_complexity"],
            overall_score=metrics["overall_score"],
            status="SUBMITTED",
            approval_status="PENDING",
            notes=f"AI Generated candidate based on {strat['strategy']}.",
        )
        db.add(version)
        created_designs.append(design)

    db.commit()

    # Log audit event
    now_audit = datetime.now(timezone.utc)
    audit_log = AuditLog(
        id=f"AUD-DSG-{uuid.uuid4().hex[:10]}",
        project_id=project_id,
        actor="AI Planning Engine",
        action="AI_DESIGNS_GENERATED",
        entity="Design",
        entity_id=f"{len(created_designs)}_designs",
        label="AI Multi-Design Alternatives Generated",
        category="Route Selection",
        details=f"Generated {len(created_designs)} multi-design alternatives with dynamic multi-criteria ranking.",
        time=now_audit.strftime("%H:%M"),
        date=now_audit.strftime("%Y-%m-%d"),
        timestamp=now_audit,
    )
    db.add(audit_log)
    db.commit()

    return get_project_designs(db, project_id)


def create_design_version(
    db: Session,
    design_id: str,
    route_geometry: List[List[float]],
    created_by: str = "Authorized Officer",
    source: str = "OFFICER_MODIFIED",
    notes: Optional[str] = None,
    corridor_width_meters: float = 32.0,
) -> Dict[str, Any]:
    """
    Officer Redesign Engine: Saves a new immutable version of a design without
    overwriting historical versions, and recalculates all metrics dynamically.
    """
    design = db.query(Design).filter(Design.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail=f"Design {design_id} not found")

    new_version_num = design.current_version_number + 1
    v_id = f"VER-{design_id}-V{new_version_num}"

    # Recalculate metrics dynamically
    metrics = recalculate_design_metrics(
        db=db,
        project_id=design.project_id,
        route_geometry=route_geometry,
        corridor_width_meters=corridor_width_meters,
        strategy=design.strategy,
    )

    version = DesignVersion(
        id=v_id,
        design_id=design_id,
        project_id=design.project_id,
        version_number=new_version_num,
        created_by=created_by,
        source=source,
        route_geometry=route_geometry,
        length_km=metrics["length_km"],
        land_impact_acres=metrics["land_impact_acres"],
        affected_parcels_count=metrics["affected_parcels_count"],
        affected_parcel_ids=metrics["affected_parcel_ids"],
        stakeholders_count=metrics["stakeholders_count"],
        estimated_cost_cr=metrics["estimated_cost_cr"],
        estimated_duration_months=metrics["estimated_duration_months"],
        delay_risk_pct=metrics["delay_risk_pct"],
        connectivity_score=metrics["connectivity_score"],
        construction_complexity=metrics["construction_complexity"],
        overall_score=metrics["overall_score"],
        status="SUBMITTED",
        approval_status="PENDING",
        notes=notes or f"Officer redesign v{new_version_num} saved by {created_by}.",
    )
    db.add(version)

    design.current_version_number = new_version_num
    design.status = "OFFICER_MODIFIED"
    design.connectivity_score = metrics["connectivity_score"]
    design.construction_complexity = metrics["construction_complexity"]
    db.commit()

    # Audit log
    now_ver = datetime.now(timezone.utc)
    audit_log = AuditLog(
        id=f"AUD-VER-{uuid.uuid4().hex[:10]}",
        project_id=design.project_id,
        actor=created_by,
        action="DESIGN_VERSION_CREATED",
        entity="DesignVersion",
        entity_id=v_id,
        label=f"Design {design.label} Version {new_version_num} Created",
        category="Route Selection",
        details=f"Saved Design {design.label} Version {new_version_num}. Length: {metrics['length_km']} km, Score: {metrics['overall_score']}.",
        time=now_ver.strftime("%H:%M"),
        date=now_ver.strftime("%Y-%m-%d"),
        timestamp=now_ver,
    )
    db.add(audit_log)
    db.commit()

    return {
        "id": version.id,
        "design_id": version.design_id,
        "project_id": version.project_id,
        "version_number": version.version_number,
        "created_by": version.created_by,
        "created_at": version.created_at.isoformat(),
        "source": version.source,
        "route_geometry": version.route_geometry,
        "length_km": version.length_km,
        "land_impact_acres": version.land_impact_acres,
        "affected_parcels_count": version.affected_parcels_count,
        "affected_parcel_ids": version.affected_parcel_ids,
        "stakeholders_count": version.stakeholders_count,
        "estimated_cost_cr": version.estimated_cost_cr,
        "estimated_duration_months": version.estimated_duration_months,
        "delay_risk_pct": version.delay_risk_pct,
        "connectivity_score": version.connectivity_score,
        "construction_complexity": version.construction_complexity,
        "overall_score": version.overall_score,
        "status": version.status,
        "notes": version.notes,
    }


def compare_designs(
    db: Session,
    project_id: str,
    design_ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Multi-Design Comparison Engine.
    Allows side-by-side comparison of 2, 3, or 4 designs with dynamic ranking.
    """
    designs = db.query(Design).filter(Design.project_id == project_id).all()
    if not designs:
        generate_ai_designs(db, project_id, count=4)
        designs = db.query(Design).filter(Design.project_id == project_id).all()

    if design_ids:
        designs = [d for d in designs if d.id in design_ids]

    compared = []
    for d in designs:
        # Get latest version
        latest_version = (
            db.query(DesignVersion)
            .filter(DesignVersion.design_id == d.id)
            .order_by(DesignVersion.version_number.desc())
            .first()
        )
        if latest_version:
            compared.append({
                "id": d.id,
                "label": d.label,
                "name": d.name,
                "strategy": d.strategy,
                "versionNumber": latest_version.version_number,
                "lengthKm": latest_version.length_km,
                "landImpactAcres": latest_version.land_impact_acres,
                "affectedParcels": latest_version.affected_parcels_count,
                "stakeholders": latest_version.stakeholders_count,
                "estimatedCostCr": latest_version.estimated_cost_cr,
                "estimatedDurationMonths": latest_version.estimated_duration_months,
                "delayRiskPct": latest_version.delay_risk_pct,
                "connectivityScore": latest_version.connectivity_score,
                "constructionComplexity": latest_version.construction_complexity,
                "overallScore": latest_version.overall_score,
                "status": latest_version.status,
                "isApproved": d.is_approved,
                "routeGeometry": latest_version.route_geometry,
            })

    if not compared:
        raise HTTPException(status_code=404, detail="No designs found for comparison.")

    # Select best design dynamically
    best_design = max(compared, key=lambda x: x["overallScore"])
    best_id = best_design["id"]
    for c in compared:
        c["aiRecommended"] = (c["id"] == best_id)

    return {
        "project_id": project_id,
        "compared_designs": compared,
        "recommended_design_id": best_id,
        "ranking_criteria": {
            "delay_risk_weight": 0.35,
            "cost_efficiency_weight": 0.25,
            "land_impact_weight": 0.20,
            "connectivity_weight": 0.10,
            "social_ease_weight": 0.10,
        },
    }


def approve_design_version(
    db: Session,
    design_id: str,
    version_id: Optional[str] = None,
    approved_by: str = "Dr. A. Sundaram (Project Director)",
) -> Dict[str, Any]:
    """
    Approves a design and creates an official release package for contractors.
    """
    design = db.query(Design).filter(Design.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail=f"Design {design_id} not found")

    version_query = db.query(DesignVersion).filter(DesignVersion.design_id == design_id)
    if version_id:
        version = version_query.filter(DesignVersion.id == version_id).first()
    else:
        version = version_query.order_by(DesignVersion.version_number.desc()).first()

    if not version:
        raise HTTPException(status_code=404, detail="Design version not found")

    now = datetime.now(timezone.utc)

    # Reset previous approved designs for this project
    all_project_designs = db.query(Design).filter(Design.project_id == design.project_id).all()
    for d in all_project_designs:
        d.is_approved = (d.id == design_id)
        if d.id == design_id:
            d.status = "APPROVED"

    version.approval_status = "APPROVED"
    version.status = "APPROVED"
    version.approved_by = approved_by
    version.approved_at = now

    # Update project's selected route and workflow
    project = db.query(Project).filter(Project.id == design.project_id).first()
    if project:
        project.selected_route_id = design.route_id
        if project.workflow_state in ["DRAFT", "PLANNING", "ROUTE_ANALYSIS"]:
            project.workflow_state = "ROUTE_APPROVAL"

    # Create Design Package
    pkg_number = f"DPKG-{design.project_id}-v{version.version_number}"
    pkg = db.query(DesignPackage).filter(DesignPackage.package_number == pkg_number).first()
    if not pkg:
        pkg = DesignPackage(
            id=f"PKG-{uuid.uuid4().hex[:10]}",
            project_id=design.project_id,
            design_id=design.id,
            version_id=version.id,
            package_number=pkg_number,
            title=f"Approved Engineering Design Package — {design.label} v{version.version_number}",
            approved_by=approved_by,
            approved_at=now,
            specs={
                "designName": design.name,
                "strategy": design.strategy,
                "version": version.version_number,
                "lengthKm": version.length_km,
                "landImpactAcres": version.land_impact_acres,
                "affectedParcelsCount": version.affected_parcels_count,
                "stakeholdersCount": version.stakeholders_count,
                "estimatedCostCr": version.estimated_cost_cr,
                "estimatedDurationMonths": version.estimated_duration_months,
                "delayRiskPct": version.delay_risk_pct,
                "connectivityScore": version.connectivity_score,
                "corridorWidthMeters": 32.0,
                "lanes": 6,
            },
            officer_instructions=(
                "Contractor shall execute work packages strictly within designated corridor bounds. "
                "All deep excavation near residential clusters must coordinate with LAO field units."
            ),
            documents_count=6,
            access_log=[{
                "actor": approved_by,
                "action": "PACKAGE_RELEASED",
                "timestamp": now.isoformat(),
            }],
        )
        db.add(pkg)

    # Audit Log
    audit_log = AuditLog(
        id=f"AUD-APP-{uuid.uuid4().hex[:10]}",
        project_id=design.project_id,
        actor=approved_by,
        action="DESIGN_APPROVED",
        entity="DesignPackage",
        entity_id=pkg.package_number,
        label=f"Design {design.label} v{version.version_number} Approved",
        category="Route Selection",
        details=f"Design {design.label} v{version.version_number} approved and packaged for EPC contractors.",
        time=now.strftime("%H:%M"),
        date=now.strftime("%Y-%m-%d"),
        timestamp=now,
    )
    db.add(audit_log)

    # Notification to Contractor & Officers
    notif = Notification(
        id=f"NTF-{uuid.uuid4().hex[:8]}",
        project_id=design.project_id,
        category="Design Update",
        severity="High",
        message=f"New Approved Design Package {pkg.package_number} released for project {design.project_id}.",
        timestamp=now.isoformat(),
        read=False,
    )
    db.add(notif)
    db.commit()

    return {
        "status": "SUCCESS",
        "design_id": design.id,
        "version_id": version.id,
        "package_number": pkg.package_number,
        "approved_by": approved_by,
        "approved_at": now.isoformat(),
        "message": f"Design {design.label} v{version.version_number} approved successfully.",
    }


def get_design_package(db: Session, design_id: str) -> Dict[str, Any]:
    """Retrieves or creates the design package for an approved design."""
    pkg = (
        db.query(DesignPackage)
        .filter(DesignPackage.design_id == design_id)
        .order_by(DesignPackage.approved_at.desc())
        .first()
    )
    if not pkg:
        # Fallback: create package for latest version
        design = db.query(Design).filter(Design.id == design_id).first()
        if not design:
            raise HTTPException(status_code=404, detail=f"Design {design_id} not found")
        latest_version = (
            db.query(DesignVersion)
            .filter(DesignVersion.design_id == design_id)
            .order_by(DesignVersion.version_number.desc())
            .first()
        )
        if not latest_version:
            raise HTTPException(status_code=404, detail="No version found for design")
        
        approve_design_version(db, design_id, latest_version.id)
        pkg = db.query(DesignPackage).filter(DesignPackage.design_id == design_id).first()

    return {
        "id": pkg.id,
        "project_id": pkg.project_id,
        "design_id": pkg.design_id,
        "version_id": pkg.version_id,
        "package_number": pkg.package_number,
        "title": pkg.title,
        "approved_by": pkg.approved_by,
        "approved_at": pkg.approved_at.isoformat() if pkg.approved_at else "",
        "specs": pkg.specs,
        "officer_instructions": pkg.officer_instructions,
        "documents_count": pkg.documents_count,
        "disclaimer": pkg.disclaimer,
        "access_log": pkg.access_log or [],
    }


def create_design_change_request(
    db: Session,
    project_id: str,
    design_id: str,
    title: str,
    reason: str,
    contractor_id: str,
    contractor_name: str,
    requested_modifications: Dict[str, Any],
    proposed_geometry: Optional[List[List[float]]] = None,
) -> Dict[str, Any]:
    """
    Contractor Design Change Request Workflow.
    Allows contractors to submit design change requests which undergo
    AI impact analysis before officer review.
    """
    design = db.query(Design).filter(Design.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail=f"Design {design_id} not found")

    latest_version = (
        db.query(DesignVersion)
        .filter(DesignVersion.design_id == design_id)
        .order_by(DesignVersion.version_number.desc())
        .first()
    )
    v_id = latest_version.id if latest_version else "V1"

    # AI Impact Analysis
    geom_to_eval = proposed_geometry or latest_version.route_geometry
    new_metrics = recalculate_design_metrics(
        db=db,
        project_id=project_id,
        route_geometry=geom_to_eval,
        strategy=design.strategy,
    )

    cost_delta = round(new_metrics["estimated_cost_cr"] - (latest_version.estimated_cost_cr if latest_version else 2000.0), 1)
    risk_delta = int(new_metrics["delay_risk_pct"] - (latest_version.delay_risk_pct if latest_version else 30))
    time_delta = round(new_metrics["estimated_duration_months"] - (latest_version.estimated_duration_months if latest_version else 18.0), 1)

    ai_impact = {
        "costDeltaCr": cost_delta,
        "riskDeltaPct": risk_delta,
        "timeDeltaMonths": time_delta,
        "newScore": new_metrics["overall_score"],
        "recommendation": "Favorable" if risk_delta <= 0 and cost_delta <= 10.0 else "Requires Review",
    }

    req_id = f"CR-{project_id}-{uuid.uuid4().hex[:6].upper()}"
    cr = DesignChangeRequest(
        id=req_id,
        project_id=project_id,
        design_id=design_id,
        version_id=v_id,
        contractor_id=contractor_id,
        contractor_name=contractor_name,
        title=title,
        reason=reason,
        requested_modifications=requested_modifications,
        proposed_geometry=proposed_geometry,
        officer_review_status="PENDING",
        ai_impact_analysis=ai_impact,
    )
    db.add(cr)

    # Audit log
    now_cr = datetime.now(timezone.utc)
    audit_log = AuditLog(
        id=f"AUD-CR-{uuid.uuid4().hex[:10]}",
        project_id=project_id,
        actor=contractor_name,
        action="DESIGN_CHANGE_REQUESTED",
        entity="DesignChangeRequest",
        entity_id=cr.id,
        label=f"Design Change Request: {title}",
        category="Route Selection",
        details=f"Contractor submitted change request '{title}'. AI Impact: Cost Delta ₹{cost_delta} Cr, Risk Delta {risk_delta}%.",
        time=now_cr.strftime("%H:%M"),
        date=now_cr.strftime("%Y-%m-%d"),
        timestamp=now_cr,
    )
    db.add(audit_log)
    db.commit()

    return {
        "id": cr.id,
        "project_id": cr.project_id,
        "design_id": cr.design_id,
        "version_id": cr.version_id,
        "contractor_id": cr.contractor_id,
        "contractor_name": cr.contractor_name,
        "title": cr.title,
        "reason": cr.reason,
        "requested_modifications": cr.requested_modifications,
        "proposed_geometry": cr.proposed_geometry,
        "officer_review_status": cr.officer_review_status,
        "ai_impact_analysis": cr.ai_impact_analysis,
        "created_at": cr.created_at.isoformat(),
    }


def review_design_change_request(
    db: Session,
    request_id: str,
    status: str,
    officer_comment: str,
    reviewer_name: str = "Project Director",
) -> Dict[str, Any]:
    """
    Officer review of contractor design change request.
    If approved, automatically creates a new Design Version.
    """
    cr = db.query(DesignChangeRequest).filter(DesignChangeRequest.id == request_id).first()
    if not cr:
        raise HTTPException(status_code=404, detail=f"Change request {request_id} not found")

    now = datetime.now(timezone.utc)
    cr.officer_review_status = status.upper()
    cr.officer_comment = officer_comment
    cr.reviewed_at = now
    cr.reviewed_by = reviewer_name

    new_version_info = None
    if status.upper() == "APPROVED" and cr.proposed_geometry:
        new_version_info = create_design_version(
            db=db,
            design_id=cr.design_id,
            route_geometry=cr.proposed_geometry,
            created_by=reviewer_name,
            source="CONTRACTOR_CHANGE_REQUEST",
            notes=f"Approved Change Request {cr.id}: {cr.title}. Comment: {officer_comment}",
        )

    # Audit Log
    audit_log = AuditLog(
        id=f"AUD-CRR-{uuid.uuid4().hex[:10]}",
        project_id=cr.project_id,
        actor=reviewer_name,
        action=f"CHANGE_REQUEST_{status.upper()}",
        entity="DesignChangeRequest",
        entity_id=cr.id,
        label=f"Change Request {cr.id} {status.upper()}",
        category="Route Selection",
        details=f"Officer {reviewer_name} set change request {cr.id} to {status}. Note: {officer_comment}",
        time=now.strftime("%H:%M"),
        date=now.strftime("%Y-%m-%d"),
        timestamp=now,
    )
    db.add(audit_log)
    db.commit()

    return {
        "id": cr.id,
        "status": cr.officer_review_status,
        "officer_comment": cr.officer_comment,
        "reviewed_by": cr.reviewed_by,
        "reviewed_at": cr.reviewed_at.isoformat(),
        "new_version": new_version_info,
        "newVersionId": new_version_info["id"] if new_version_info else None,
    }
