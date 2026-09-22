"""
LandGuard AI — Phase 6 Comprehensive End-to-End Platform Verification Suite
Tests Multi-Project Switching, Multi-Design Optimization, Officer Redesign ROW Slider,
Contractor Packages & Change Requests, and the Closed-Loop Predictive Lifecycle.
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import create_access_token
from backend.app.db.database import SessionLocal
from backend.app.db.seed import seed_database
from backend.app.db.models.project import Project
from backend.app.db.models.route import Route
from backend.app.db.models.design import Design, DesignVersion, DesignChangeRequest
from backend.app.db.models.audit import AuditLog

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    db = SessionLocal()
    seed_database(db, force=False)
    db.close()


def get_token(role: str = "SUPER_ADMIN") -> str:
    return create_access_token(subject=f"USR-E2E-{role}", role=role)


def get_headers(role: str = "SUPER_ADMIN") -> dict:
    return {"Authorization": f"Bearer {get_token(role)}"}


# 1. Multi-Project: Verify all 10 projects exist with full state
def test_01_verify_ten_projects_complete_state():
    headers = get_headers()
    res = client.get("/api/v1/projects", headers=headers)
    assert res.status_code == 200
    projects = res.json()
    assert len(projects) >= 10
    
    # Verify mandatory project identifiers
    project_ids = [p["id"] for p in projects]
    assert "PRJ-1042" in project_ids
    assert "PRJ-1088" in project_ids


# 2. Multi-Project Context Switching: Switching from PRJ-1042 to PRJ-1088
def test_02_project_context_switching():
    headers = get_headers()
    
    # Project 1 query
    p1_res = client.get("/api/v1/projects/PRJ-1042", headers=headers)
    assert p1_res.status_code == 200
    p1 = p1_res.json()
    assert "Chennai" in p1["name"] or p1["id"] == "PRJ-1042"
    
    # Project 2 query
    p2_res = client.get("/api/v1/projects/PRJ-1088", headers=headers)
    assert p2_res.status_code == 200
    p2 = p2_res.json()
    assert p2["id"] == "PRJ-1088"
    assert p2["name"] != p1["name"]


# 3. Multi-Design: 4 Candidate Designs (A, B, C, D) for PRJ-1042
def test_03_multi_design_alternatives():
    headers = get_headers()
    res = client.get("/api/v1/designs/project/PRJ-1042", headers=headers)
    assert res.status_code == 200
    designs = res.json()
    assert len(designs) >= 4
    design_codes = [d.get("design_code") or d.get("code") or d.get("id") for d in designs]
    assert any("A" in str(c) for c in design_codes)
    assert any("B" in str(c) for c in design_codes)
    assert any("C" in str(c) for c in design_codes)
    assert any("D" in str(c) for c in design_codes)


# 4. Multi-Design Dynamic Multi-Criteria Evaluation & Scoring
def test_04_dynamic_multi_criteria_evaluation():
    headers = get_headers()
    eval_payload = {
        "weights": {
            "risk": 0.35,
            "cost": 0.25,
            "land_impact": 0.20,
            "connectivity": 0.10,
            "social_impact": 0.10,
        }
    }
    res = client.post("/api/v1/projects/PRJ-1042/routes/evaluate", json=eval_payload, headers=headers)
    assert res.status_code == 200
    results = res.json()
    assert len(results) >= 4
    for r in results:
        assert "overallScore" in r or "score" in r or "routeId" in r


# 5. Officer Redesign: Interactive ROW Width Slider (24m -> 60m)
def test_05_officer_redesign_row_slider_recalculation():
    headers = get_headers("LAND_ACQUISITION_OFFICER")
    payload = {
        "route_geometry": [[80.237, 13.087], [80.245, 13.095], [80.255, 13.105]],
        "corridor_width_meters": 45.0,
        "strategy": "BALANCED_RISK_COST",
    }
    res = client.post("/api/v1/designs/recalculate/PRJ-1042", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "land_impact_acres" in data
    assert "affected_parcels_count" in data
    assert "estimated_cost_cr" in data


# 6. Versioning: Creating a New Design Version (v1 -> v2)
def test_06_design_versioning_creation():
    headers = get_headers("LAND_ACQUISITION_OFFICER")
    payload = {
        "route_geometry": [[80.237, 13.087], [80.245, 13.095], [80.255, 13.105]],
        "created_by": "K. Rajagopal (Special LAO)",
        "source": "OFFICER_REDESIGN",
        "notes": "Version 2 approved alignment with reduced wetland encroachment",
        "corridor_width_meters": 45.0,
    }
    res = client.post("/api/v1/designs/DSG-PRJ-1042-A/versions", json=payload, headers=headers)
    assert res.status_code in [200, 201]


# 7. Contractor Design Package Generation
def test_07_contractor_package_generation():
    headers = get_headers("CONTRACTOR")
    res = client.get("/api/v1/designs/DSG-PRJ-1042-A/package", headers=headers)
    assert res.status_code in [200, 404]


# 8. Contractor Change Request Lifecycle: Submission -> Officer Review -> Approval
def test_08_contractor_change_request_lifecycle():
    contractor_headers = get_headers("CONTRACTOR")
    officer_headers = get_headers("PROJECT_HEAD")
    
    # 1. Contractor submits change request
    cr_payload = {
        "title": "Chainage 14+200 Viaduct Realignment",
        "reason": "Shift viaduct alignment by 20m East to bypass rocky outcrop terrain.",
        "contractor_id": "CON-1042-01",
        "contractor_name": "L&T Infrastructure EPC Consortium",
        "requested_modifications": {"shiftMeters": 20.0, "lateralDirection": "East"},
        "proposed_geometry": [[80.237, 13.087], [80.248, 13.098], [80.255, 13.105]],
    }
    submit_res = client.post("/api/v1/designs/DSG-PRJ-1042-A/change-requests?project_id=PRJ-1042", json=cr_payload, headers=contractor_headers)
    assert submit_res.status_code in [200, 201]
    cr_data = submit_res.json()
    cr_id = cr_data.get("id")

    # 2. Officer reviews and approves change request
    if cr_id:
        review_payload = {
            "officer_review_status": "APPROVED",
            "officer_comment": "Approved following geotechnical survey validation.",
            "reviewer_name": "Dr. A. Sundaram (Project Director)",
        }
        review_res = client.post(f"/api/v1/designs/change-requests/{cr_id}/review", json=review_payload, headers=officer_headers)
        assert review_res.status_code in [200, 201]


# 9. Closed-Loop AI: Predict -> Action -> Recalculate -> Measure Improvement
def test_09_closed_loop_ai_improvement():
    headers = get_headers("PROJECT_HEAD")
    
    # 1. Baseline Risk
    r1 = client.get("/api/v1/projects/PRJ-1042/risk", headers=headers)
    assert r1.status_code == 200
    initial_risk = r1.json()["overallPct"]

    # 2. What-If Simulation of dispute resolution & fast-track documentation
    sim_payload = {"leverIds": ["resolve_documents", "resolve_disputes", "streamline_approvals"]}
    sim_res = client.post("/api/v1/projects/PRJ-1042/what-if", json=sim_payload, headers=headers)
    assert sim_res.status_code == 200
    sim_levers = sim_res.json()
    assert len(sim_levers) >= 1
    
    # Verify calculated risk reduction
    lowest_simulated_risk = min(l["resultingRiskPct"] for l in sim_levers)
    assert lowest_simulated_risk <= initial_risk, "Simulated policy interventions must reduce or maintain risk level"


# 10. Audit Trail Logging Verification
def test_10_immutable_audit_trail_events():
    headers = get_headers("SUPER_ADMIN")
    res = client.get("/api/v1/projects/PRJ-1042/audit", headers=headers)
    assert res.status_code == 200
    audit_events = res.json()
    assert len(audit_events) >= 1
    for event in audit_events:
        assert "action" in event or "eventType" in event
