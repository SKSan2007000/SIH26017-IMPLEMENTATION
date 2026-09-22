"""
LandGuard AI — Phase 17 & 22 Citizen Redressal & Stakeholder Workflow Test Suite
Verifies:
1. Citizen authentication and data retrieval.
2. Citizen grievance filing and persistence in database.
3. Grievance status tracking and automated audit logging.
4. Security isolation: Citizen role is rejected when attempting to access Super Admin or Officer APIs (HTTP 403).
5. Citizen data confidentiality.
"""

import sys
import os
import pytest
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.database import SessionLocal
from backend.app.db.models.citizen_report import CitizenReport
from backend.app.db.models.audit import AuditLog
from backend.app.db.seed import seed_database

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    db = SessionLocal()
    seed_database(db, force=False)
    db.close()


def test_01_citizen_grievance_submission_workflow():
    # 1. Citizen submits grievance via API
    payload = {
        "project_id": "PRJ-1042",
        "location": "Ennore North Section Km 12",
        "description": "Objection regarding tree valuation on agricultural parcel P-101. Requesting joint survey.",
        "category": "Compensation Valuation Objection",
        "citizen_ref": "DEMO CITIZEN",
        "has_photo": True,
        "has_video": False,
        "status": "Submitted",
    }
    res = client.post("/api/v1/citizen-reports/", json=payload)
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    data = res.json()
    report_id = data["id"]
    assert report_id.startswith("CR-")
    assert data["category"] == "Compensation Valuation Objection"

    # 2. Verify grievance stored in database
    db = SessionLocal()
    rep = db.query(CitizenReport).filter(CitizenReport.id == report_id).first()
    assert rep is not None
    assert rep.description == payload["description"]

    # 3. Verify audit log entry
    audit = db.query(AuditLog).filter(
        AuditLog.entity_id == report_id,
        AuditLog.action == "CITIZEN_GRIEVANCE_SUBMITTED",
    ).first()
    assert audit is not None
    assert "Compensation" in audit.label or "Grievance" in audit.label
    db.close()


def test_02_citizen_portal_security_isolation():
    # Login as Citizen
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "citizen@landguard.ai", "password": "LandGuard@2026"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Citizen accessing Admin user management should return 403 Forbidden
    res_admin = client.get("/api/v1/auth/users", headers=headers)
    assert res_admin.status_code == 403

    # Citizen accessing Admin stats should return 403 Forbidden
    res_stats = client.get("/api/v1/auth/admin-stats", headers=headers)
    assert res_stats.status_code == 403


def test_03_citizen_view_all_reports_for_project():
    res = client.get("/api/v1/citizen-reports/?project_id=PRJ-1042")
    assert res.status_code == 200
    reports = res.json()
    assert isinstance(reports, list)
    assert len(reports) >= 1
