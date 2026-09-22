"""
LandGuard AI — Phase 6 Multi-Project, Multi-Design & Contractor Portfolio Test Suite
Validates:
1. Multi-Project Portfolio Aggregation & KPIs
2. Multi-Design AI Candidate Generation & Dynamic Scoring (No hardcoding)
3. Design Versioning (v1, v2, v3...)
4. 2-4 Design Comparison Matrix & Dynamic Ranking
5. Design Package Release & EPC Contractor Workflow
6. Contractor Change Requests & AI Impact Analysis
7. Officer Review & Version Promotion
8. Cross-Project Officer Workload Index & Smart Allocation
9. Isolated Contractor Dashboards
10. Regional Road Network Topology & Connectivity Gaps
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.app.main import app
from backend.app.db.database import SessionLocal, Base, engine
from backend.app.db.seed import seed_database
from backend.app.db.models.design import Design, DesignVersion, DesignChangeRequest, DesignPackage, ProjectAssignment
from backend.app.db.models.project import Project
from backend.app.services.design_service import (
    generate_ai_designs,
    recalculate_design_metrics,
    create_design_version,
    compare_designs,
    approve_design_version,
    create_design_change_request,
    review_design_change_request,
)
from backend.app.services.portfolio_service import (
    get_portfolio_summary,
    get_officer_cross_project_workload,
    get_contractor_projects,
    assign_user_to_project,
)
from backend.app.services.network_service import get_regional_road_network

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db, force=True)
    db.close()
    yield


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


# ----------------------------------------------------------------------
# 1. MULTI-PROJECT PORTFOLIO TESTS
# ----------------------------------------------------------------------

def test_portfolio_summary_service(db: Session):
    summary = get_portfolio_summary(db)
    assert summary["total_projects"] >= 5
    assert summary["total_estimated_budget_cr"] > 10000.0
    assert summary["total_affected_parcels"] > 50
    assert "projects_breakdown" in summary
    assert len(summary["projects_breakdown"]) >= 5


def test_portfolio_summary_api():
    res = client.get("/api/v1/portfolio/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_projects"] >= 5
    assert data["overall_portfolio_risk_pct"] > 0
    assert "projects_breakdown" in data


# ----------------------------------------------------------------------
# 2. MULTI-DESIGN GENERATION & DYNAMIC EVALUATION
# ----------------------------------------------------------------------

def test_generate_ai_designs_service(db: Session):
    designs = generate_ai_designs(db, project_id="PRJ-1088", count=4)
    assert len(designs) == 4
    strategies = [d["strategy"] for d in designs]
    assert "Existing Corridor Upgrade" in strategies
    assert "Northern Bypass" in strategies

    # Check that each design has a version 1
    for d in designs:
        assert d["current_version_number"] == 1
        assert len(d["versions"]) == 1
        v = d["versions"][0]
        assert v["length_km"] > 0
        assert v["overall_score"] > 0


def test_generate_ai_designs_api():
    res = client.post("/api/v1/designs/generate", json={"project_id": "PRJ-1092", "count": 4})
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 4
    assert data[0]["project_id"] == "PRJ-1092"


def test_dynamic_recalculation_no_hardcoding(db: Session):
    # Test short corridor vs long corridor
    short_geom = [[80.237, 13.087], [80.245, 13.095]]
    long_geom = [[80.237, 13.087], [80.250, 13.110], [80.290, 13.180], [80.350, 13.250]]

    metrics_short = recalculate_design_metrics(db, "PRJ-1042", short_geom, 32.0, "Short")
    metrics_long = recalculate_design_metrics(db, "PRJ-1042", long_geom, 32.0, "Long")

    assert metrics_long["length_km"] > metrics_short["length_km"]
    assert metrics_long["estimated_cost_cr"] > metrics_short["estimated_cost_cr"]
    # Dynamic scoring guarantees distinct metric scores without hardcoding
    assert metrics_short["overall_score"] != metrics_long["overall_score"]


def test_recalculate_api():
    res = client.post(
        "/api/v1/designs/recalculate/PRJ-1042",
        json={
            "route_geometry": [[80.22, 13.04], [80.26, 13.12], [80.30, 13.20]],
            "corridor_width_meters": 45.0,
            "strategy": "Expressway Bypass",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["length_km"] > 0
    assert data["estimated_cost_cr"] > 0
    assert data["overall_score"] > 0


# ----------------------------------------------------------------------
# 3. DESIGN VERSIONING & IMMUTABILITY
# ----------------------------------------------------------------------

def test_design_version_creation_progression(db: Session):
    # Retrieve Design A
    design = db.query(Design).filter(Design.project_id == "PRJ-1042", Design.label == "Design A").first()
    assert design is not None
    initial_ver = design.current_version_number

    new_geom = [[80.230, 13.080], [80.250, 13.110], [80.270, 13.150]]
    v2 = create_design_version(
        db=db,
        design_id=design.id,
        route_geometry=new_geom,
        created_by="R. Vignesh (Field Surveyor)",
        source="OFFICER_MODIFIED",
        notes="Shifted to bypass residential enclave.",
    )

    assert v2["version_number"] == initial_ver + 1
    assert v2["source"] == "OFFICER_MODIFIED"
    assert design.current_version_number == initial_ver + 1


def test_get_project_designs_with_versions_api():
    res = client.get("/api/v1/designs/project/PRJ-1042")
    assert res.status_code == 200
    designs = res.json()
    assert len(designs) >= 4
    design_a = next(d for d in designs if d["label"] == "Design A")
    assert len(design_a["versions"]) >= 2


# ----------------------------------------------------------------------
# 4. MULTI-DESIGN COMPARISON MATRIX
# ----------------------------------------------------------------------

def test_compare_designs_service(db: Session):
    comparison = compare_designs(db, "PRJ-1042")
    assert "compared_designs" in comparison
    assert len(comparison["compared_designs"]) >= 4
    assert comparison["recommended_design_id"] is not None

    # Check ranking weights presence
    weights = comparison["ranking_criteria"]
    assert weights["delay_risk_weight"] == 0.35
    assert weights["cost_efficiency_weight"] == 0.25
    assert weights["land_impact_weight"] == 0.20


def test_compare_designs_api():
    res = client.post("/api/v1/designs/project/PRJ-1042/compare")
    assert res.status_code == 200
    data = res.json()
    assert len(data["compared_designs"]) >= 4
    assert any(d["aiRecommended"] is True for d in data["compared_designs"])


# ----------------------------------------------------------------------
# 5. DESIGN APPROVAL & EPC CONTRACTOR PACKAGE
# ----------------------------------------------------------------------

def test_approve_design_package_service(db: Session):
    design = db.query(Design).filter(Design.project_id == "PRJ-1042", Design.label == "Design D").first()
    res = approve_design_version(db, design.id, approved_by="Dr. A. Sundaram (Project Director)")
    assert res["status"] == "SUCCESS"
    assert "package_number" in res

    pkg = db.query(DesignPackage).filter(DesignPackage.design_id == design.id).first()
    assert pkg is not None
    assert pkg.package_number.startswith("DPKG-PRJ-1042")
    assert "CONCEPTUAL / SIMULATION" in pkg.disclaimer


def test_get_design_package_api():
    res = client.get("/api/v1/designs/DSG-PRJ-1042-D/package")
    assert res.status_code == 200
    data = res.json()
    assert data["package_number"] == "DPKG-PRJ-1042-v1"
    assert "specs" in data
    assert data["specs"]["corridorWidthMeters"] == 32.0


# ----------------------------------------------------------------------
# 6. CONTRACTOR CHANGE REQUEST WORKFLOW & AI IMPACT
# ----------------------------------------------------------------------

def test_contractor_change_request_workflow(db: Session):
    design = db.query(Design).filter(Design.project_id == "PRJ-1042", Design.label == "Design D").first()
    req = create_design_change_request(
        db=db,
        project_id="PRJ-1042",
        design_id=design.id,
        title="Viaduct Pier 14-22 Realignment",
        reason="Encountered underground hard rock strata requiring 25m offset.",
        contractor_id="con-01",
        contractor_name="Larsen & Toubro Infra Consortium",
        requested_modifications={"offsetMeters": 25.0, "shift": "East"},
        proposed_geometry=[[80.237, 13.087], [80.252, 13.125], [80.285, 13.195]],
    )

    assert req["id"].startswith("CR-PRJ-1042")
    assert req["officer_review_status"] == "PENDING"
    assert "ai_impact_analysis" in req
    assert "costDeltaCr" in req["ai_impact_analysis"]

    # Review Change Request (Approve & Create v2)
    review = review_design_change_request(
        db=db,
        request_id=req["id"],
        status="APPROVED",
        officer_comment="Approved with foundation cost reduction.",
        reviewer_name="Dr. A. Sundaram",
    )
    assert review["status"] == "APPROVED"
    assert review["new_version"] is not None


def test_change_request_api_lifecycle():
    # Submit CR
    post_res = client.post(
        "/api/v1/designs/DSG-PRJ-1042-D/change-requests?project_id=PRJ-1042",
        json={
            "title": "Soil Settlement Adjustment at Km 18",
            "reason": "Wetland canal buffer requires viaduct grade elevation.",
            "contractor_id": "con-01",
            "contractor_name": "Larsen & Toubro Infra",
            "requested_modifications": {"elevationMeters": 4.5},
            "proposed_geometry": [[80.237, 13.087], [80.260, 13.140], [80.290, 13.210]],
        },
    )
    assert post_res.status_code == 200
    cr_data = post_res.json()
    cr_id = cr_data["id"]

    # Get CR list
    list_res = client.get("/api/v1/designs/project/PRJ-1042/change-requests")
    assert list_res.status_code == 200
    all_crs = list_res.json()
    assert any(c["id"] == cr_id for c in all_crs)


# ----------------------------------------------------------------------
# 7. CROSS-PROJECT OFFICER WORKLOAD & SMART ALLOCATION
# ----------------------------------------------------------------------

def test_officer_workload_index(db: Session):
    officers = get_officer_cross_project_workload(db)
    assert len(officers) >= 2
    for o in officers:
        assert "cross_project_workload_index" in o
        assert "availability_status" in o
        assert o["total_assigned_projects"] >= 0


def test_officer_workload_api():
    res = client.get("/api/v1/portfolio/officers/workload")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 2
    assert "officer_name" in data[0]


# ----------------------------------------------------------------------
# 8. CONTRACTOR DASHBOARDS & ISOLATION
# ----------------------------------------------------------------------

def test_contractor_project_views(db: Session):
    projs = get_contractor_projects(db, "Larsen & Toubro Infra Consortium")
    assert len(projs) >= 1
    assert projs[0]["project_id"] in ["PRJ-1042", "PRJ-1015"]
    assert "workPackages" in projs[0]


def test_contractor_project_api():
    res = client.get("/api/v1/portfolio/contractor/projects?contractor_name=Larsen+%26+Toubro+Infra+Consortium")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1


# ----------------------------------------------------------------------
# 9. REGIONAL ROAD NETWORK & CONNECTIVITY GAPS
# ----------------------------------------------------------------------

def test_road_network_and_gaps(db: Session):
    net = get_regional_road_network("PRJ-1042")
    assert len(net["features"]) >= 5
    types = [f["type"] for f in net["features"]]
    assert "HIGHWAY" in types
    assert "RAILWAY" in types

    gaps = net["connectivityGaps"]
    assert len(gaps) >= 2
    assert gaps[0]["estimated_socio_economic_benefit_cr"] > 0


def test_road_network_api():
    res = client.get("/api/v1/portfolio/network/PRJ-1042")
    assert res.status_code == 200
    data = res.json()
    assert len(data["features"]) >= 5
    assert len(data["connectivityGaps"]) >= 2


# ----------------------------------------------------------------------
# 10. PROJECT ASSIGNMENT & AUDIT
# ----------------------------------------------------------------------

def test_project_assignment_lifecycle(db: Session):
    asn = assign_user_to_project(
        db=db,
        project_id="PRJ-1088",
        user_id="usr-test-99",
        user_name="K. Meenakshi (DEMO)",
        role="FIELD_OFFICER",
        designation="Junior Cadastral Surveyor",
        assigned_by="Project Director",
    )
    assert asn["project_id"] == "PRJ-1088"
    assert asn["user_name"] == "K. Meenakshi (DEMO)"


def test_project_assignment_api():
    res = client.get("/api/v1/portfolio/assignments/PRJ-1042")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 2
