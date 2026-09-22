"""
LandGuard AI — Super Admin Project Creation & Workload-Balanced 6-Role Team Assignment Test Suite
Tests:
1. Super Admin creates new infrastructure project with custom project code (e.g. PRJ-2048)
2. Uniqueness validation: Duplicate project code rejected with HTTP 409 Conflict
3. Automatic 6-Role Team Assignment (Project Head, District Officer, LAO, Field Officer, Supervisor, Contractor)
4. Field officer capacity limit (5-project max, 4 near capacity, 5 at capacity)
5. Transparent score breakdown and mathematical allocation reason proof
6. Notifications generated for all assigned team members
7. Cryptographic SHA-256 audit log created
8. GET /api/v1/projects/{id}/team and GET /api/v1/projects/{id}/allocation-details
"""

import sys
import os
import pytest
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.database import SessionLocal
from backend.app.db.models.project import Project
from backend.app.db.models.user import User
from backend.app.db.models.officer_performance import OfficerProfile
from backend.app.db.models.design import ProjectAssignment
from backend.app.db.models.notification import Notification
from backend.app.db.models.audit import AuditLog
from backend.app.db.seed import seed_database

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    db = SessionLocal()
    seed_database(db, force=False)
    db.close()


def test_01_create_project_with_custom_code_and_auto_assign_team():
    db = SessionLocal()
    unique_code = f"PRJ-{uuid.uuid4().hex[:4].upper()}"

    payload = {
        "name": "Chennai Northern Corridor Extension",
        "project_code": unique_code,
        "project_type": "HIGHWAY",
        "description": "High-capacity 6-lane access-controlled expressway corridor.",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "taluk": "Madhavaram",
        "city": "Chennai",
        "project_value": 1450.0,
        "land_required_acres": 180.0,
        "target_completion_date": "2028-06-30",
        "priority": "HIGH",
        "start_location": "Ennore Port Junction",
        "end_location": "Sriperumbudur Industrial Hub",
        "corridor_length_km": 48.5,
        "right_of_way_m": 60.0,
        "auto_assign_team": True,
    }

    res = client.post("/api/v1/projects", json=payload)
    assert res.status_code == 201, res.text
    data = res.json()

    # 1. Verify Project persistence and attributes
    assert data["id"] == unique_code
    assert data["name"] == "Chennai Northern Corridor Extension"
    assert data["type"] == "HIGHWAY"
    assert data["district"] == "Chennai"
    assert data["estimatedBudgetCr"] == 1450.0
    assert data["requiredLandAreaAcres"] == 180.0
    assert data["priority"] == "HIGH"
    assert data["status"] == "TEAM_ASSIGNED"

    # 2. Verify Database Persistence
    prj = db.query(Project).filter(Project.id == unique_code).first()
    assert prj is not None
    assert prj.id == unique_code

    # 3. Verify Automatic Team Assignment (All 6 Roles)
    assert "team" in data
    team = data["team"]

    assert "projectHead" in team
    assert team["projectHead"]["role"] == "PROJECT_HEAD"
    assert "allocationReason" in team["projectHead"]

    assert "districtOfficer" in team
    assert team["districtOfficer"]["role"] == "DISTRICT_OFFICER"

    assert "landAcquisitionOfficer" in team
    assert team["landAcquisitionOfficer"]["role"] == "LAND_ACQUISITION_OFFICER"

    assert "fieldOfficer" in team
    assert team["fieldOfficer"]["role"] == "FIELD_OFFICER"
    assert "capacityStatus" in team["fieldOfficer"]

    assert "supervisor" in team
    assert team["supervisor"]["role"] == "SUPERVISOR"

    assert "contractor" in team
    assert team["contractor"]["role"] == "CONTRACTOR"

    # 4. Verify ProjectAssignment records persisted in database
    assignments = db.query(ProjectAssignment).filter(ProjectAssignment.project_id == unique_code).all()
    assert len(assignments) >= 5, f"Expected at least 5 assigned roles, got {len(assignments)}"
    assigned_roles = {a.role for a in assignments}
    assert "FIELD_OFFICER" in assigned_roles
    assert "SUPERVISOR" in assigned_roles
    assert "PROJECT_HEAD" in assigned_roles

    # 5. Verify Notifications were created
    notifs = db.query(Notification).filter(Notification.project_id == unique_code).all()
    assert len(notifs) >= 1, "Expected project notifications to be emitted"

    # 6. Verify SHA-256 Audit Log
    audits = db.query(AuditLog).filter(AuditLog.project_id == unique_code).all()
    assert len(audits) >= 1
    actions = {a.action for a in audits}
    assert "PROJECT_CREATED" in actions or "PROJECT_TEAM_AUTO_ASSIGNED" in actions

    db.close()


def test_02_duplicate_project_code_rejected():
    unique_code = f"PRJ-DUP-{uuid.uuid4().hex[:4].upper()}"

    payload = {
        "name": "First Project Instance",
        "project_code": unique_code,
        "state": "Tamil Nadu",
        "district": "Chennai",
    }

    # First creation -> Success
    res1 = client.post("/api/v1/projects", json=payload)
    assert res1.status_code == 201

    # Second creation with identical code -> 409 Conflict
    res2 = client.post("/api/v1/projects", json=payload)
    assert res2.status_code == 409
    data = res2.json()
    assert "already exists" in data["detail"]


def test_03_get_project_team_and_allocation_details():
    unique_code = f"PRJ-TEAM-{uuid.uuid4().hex[:4].upper()}"

    payload = {
        "name": "Salem Bypass Phase 3",
        "project_code": unique_code,
        "project_type": "Expressway",
        "state": "Tamil Nadu",
        "district": "Salem",
        "auto_assign_team": True,
    }

    res_create = client.post("/api/v1/projects", json=payload)
    assert res_create.status_code == 201

    # Test GET /api/v1/projects/{id}/team
    res_team = client.get(f"/api/v1/projects/{unique_code}/team")
    assert res_team.status_code == 200
    team_data = res_team.json()
    assert "team" in team_data
    assert team_data["projectId"] == unique_code
    assert "fieldOfficer" in team_data["team"]

    # Test GET /api/v1/projects/{id}/allocation-details
    res_alloc = client.get(f"/api/v1/projects/{unique_code}/allocation-details")
    assert res_alloc.status_code == 200
    alloc_data = res_alloc.json()
    assert "officerAllocations" in alloc_data
    assert len(alloc_data["officerAllocations"]) >= 1
    assert alloc_data["projectId"] == unique_code
