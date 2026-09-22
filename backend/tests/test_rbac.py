"""
LandGuard AI — Comprehensive Role-Based Access Control (RBAC) Test Suite
Tests authorization, route gating, permission enforcement, and 403 Forbidden handling
across all 8 supported roles in the LandGuard platform.
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import create_access_token, UserRole
from backend.app.db.database import SessionLocal
from backend.app.db.models.user import User
from backend.app.db.seed import seed_database

client = TestClient(app)

ALL_ROLES = [
    "SUPER_ADMIN",
    "PROJECT_HEAD",
    "DISTRICT_OFFICER",
    "LAND_ACQUISITION_OFFICER",
    "FIELD_OFFICER",
    "SUPERVISOR",
    "CITIZEN",
    "CONTRACTOR",
]


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    db = SessionLocal()
    seed_database(db, force=False)
    db.close()


ROLE_EMAILS = {
    "SUPER_ADMIN": "admin@landguard.ai",
    "PROJECT_HEAD": "head@landguard.ai",
    "DISTRICT_OFFICER": "district@landguard.ai",
    "LAND_ACQUISITION_OFFICER": "lao@landguard.ai",
    "FIELD_OFFICER": "field@landguard.ai",
    "SUPERVISOR": "supervisor@landguard.ai",
    "CITIZEN": "citizen@landguard.ai",
    "CONTRACTOR": "contractor@landguard.ai",
}


def get_headers_for_role(role: str) -> dict:
    email = ROLE_EMAILS.get(role, "admin@landguard.ai")
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    db.close()
    user_id = user.id if user else f"USR-{role}"
    token = create_access_token(subject=user_id, role=role)
    return {"Authorization": f"Bearer {token}"}


# 1. Super Admin access to Admin User Management
def test_01_super_admin_can_access_user_management():
    headers = get_headers_for_role("SUPER_ADMIN")
    res = client.get("/api/v1/auth/users", headers=headers)
    assert res.status_code == 200


# 2. Non-admin roles blocked from Admin User Management (HTTP 403)
@pytest.mark.parametrize("role", [
    "PROJECT_HEAD",
    "DISTRICT_OFFICER",
    "LAND_ACQUISITION_OFFICER",
    "FIELD_OFFICER",
    "SUPERVISOR",
    "CITIZEN",
    "CONTRACTOR",
])
def test_02_non_admin_blocked_from_user_management(role):
    headers = get_headers_for_role(role)
    res = client.get("/api/v1/auth/users", headers=headers)
    assert res.status_code == 403, f"Role {role} should be forbidden from user management"


# 3. Super Admin access to Admin Stats
def test_03_super_admin_can_access_admin_stats():
    headers = get_headers_for_role("SUPER_ADMIN")
    res = client.get("/api/v1/auth/admin-stats", headers=headers)
    assert res.status_code == 200


# 4. Non-admin roles blocked from Admin Stats (HTTP 403)
@pytest.mark.parametrize("role", [
    "FIELD_OFFICER",
    "CITIZEN",
    "CONTRACTOR",
])
def test_04_unauthorized_roles_blocked_from_admin_stats(role):
    headers = get_headers_for_role(role)
    res = client.get("/api/v1/auth/admin-stats", headers=headers)
    assert res.status_code == 403


# 5. Field Officer can access assigned field verifications
def test_05_field_officer_access_field_verifications():
    headers = get_headers_for_role("FIELD_OFFICER")
    res = client.get("/api/v1/field-verifications", headers=headers)
    assert res.status_code == 200


# 6. Citizen access to Citizen Grievance Reports
def test_06_citizen_can_submit_grievance():
    headers = get_headers_for_role("CITIZEN")
    payload = {
        "project_id": "PRJ-1042",
        "parcel_id": "P-101",
        "citizen_name": "Demo Citizen Grievant",
        "category": "Land Boundary Clarification",
        "description": "Requesting clarification on surveyed boundary coordinates for Survey Plot 101.",
        "location": "Near Village Gateway",
    }
    res = client.post("/api/v1/citizen-reports", json=payload, headers=headers)
    assert res.status_code in [200, 201]


# 7. Contractor Work Package viewing
def test_07_contractor_work_package_access():
    headers = get_headers_for_role("CONTRACTOR")
    res = client.get("/api/v1/contractor/work-packages", headers=headers)
    assert res.status_code in [200, 404]  # 200 if endpoint active or empty package


# 8. All roles can access public project metadata
@pytest.mark.parametrize("role", ALL_ROLES)
def test_08_all_roles_can_read_projects(role):
    headers = get_headers_for_role(role)
    res = client.get("/api/v1/projects", headers=headers)
    assert res.status_code == 200
    projects = res.json()
    assert len(projects) >= 10


# 9. All roles can read risk predictions
@pytest.mark.parametrize("role", ALL_ROLES)
def test_09_all_roles_can_read_project_risk(role):
    headers = get_headers_for_role(role)
    res = client.get("/api/v1/projects/PRJ-1042/risk", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "overallPct" in data
    assert "band" in data
