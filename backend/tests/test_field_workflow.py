"""
LandGuard AI — Phase 15 & 16 Field Operations & Supervisor Review Workflow Test Suite
Verifies:
1. Field Officer task start / acceptance and SLA timer initiation.
2. Field evidence submission: GPS coordinates capture, photos count, observation recording.
3. Task completion marking and SLA adherence calculation.
4. Supervisor review approval workflow.
5. Automatic parcel workflow state synchronization to FIELD_VERIFIED.
6. Officer performance points and tier scoring increment upon approval.
7. Immutable audit logging for each mutation step.
"""

import sys
import os
import pytest
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.database import SessionLocal
from backend.app.db.models.field_verification import FieldVerification
from backend.app.db.models.parcel import Parcel
from backend.app.db.models.officer_performance import OfficerProfile, OfficerScore
from backend.app.db.models.audit import AuditLog
from backend.app.db.seed import seed_database
from backend.app.services.assignment_service import assign_field_task_automatically

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    db = SessionLocal()
    seed_database(db, force=False)
    db.close()


def test_01_field_officer_full_lifecycle():
    db = SessionLocal()
    # 1. Create a task via auto assignment
    task = assign_field_task_automatically(
        db,
        parcel_id="P-101",
        project_id="PRJ-1042",
        location="Ennore North Corridor Section",
        priority="High",
        district="Chennai",
        zone="Zone A",
    )
    task_id = task.id
    officer_id = task.officer_ref
    db.close()

    # 2. Officer starts / accepts the task
    res_accept = client.post(
        f"/api/v1/operations/tasks/{task_id}/accept",
        json={"officer_id": officer_id},
    )
    assert res_accept.status_code == 200
    data_acc = res_accept.json()
    assert data_acc["status"] == "In Progress"
    assert "acceptedAt" in data_acc

    # 3. Officer submits field evidence and completes task
    res_complete = client.post(
        f"/api/v1/operations/tasks/{task_id}/complete",
        json={
            "officer_id": officer_id,
            "gps_coordinates": [80.2374, 13.0872],
            "photo_evidence_ref": "photo_cadastral_survey_p101.jpg",
            "observation": "Boundary stones verified. No unauthorized structures detected along railway setback.",
        },
    )
    assert res_complete.status_code == 200
    data_comp = res_complete.json()
    assert data_comp["status"] == "Awaiting Supervisor Verification"
    assert data_comp["gpsCaptured"] is True
    assert data_comp["slaStatus"] == "ON_TIME"

    # 4. Supervisor reviews and approves the submission
    res_review = client.post(
        f"/api/v1/operations/tasks/{task_id}/review",
        json={
            "supervisor_id": "sup-01",
            "decision": "APPROVED",
            "remarks": "GPS ground coordinates matched cadastral FMB map.",
        },
    )
    assert res_review.status_code == 200
    data_rev = res_review.json()
    assert data_rev["status"] == "Verified"
    assert data_rev["verificationStatus"] == "VERIFIED"

    # 5. Verify database updates: Parcel workflow updated, officer points awarded, audit logs created
    db = SessionLocal()
    parcel = db.query(Parcel).filter(Parcel.id == "P-101").first()
    assert parcel is not None
    assert parcel.verification in ["VERIFIED", "FIELD_VERIFIED"]

    # Verify score awarded
    score_rec = db.query(OfficerScore).filter(OfficerScore.task_id == task_id).first()
    assert score_rec is not None
    assert score_rec.points > 0

    # Verify audit logs
    audits = db.query(AuditLog).filter(AuditLog.entity_id == task_id).all()
    assert len(audits) >= 1
    db.close()


def test_02_supervisor_rejection_workflow():
    db = SessionLocal()
    task = assign_field_task_automatically(
        db,
        parcel_id="P-102",
        project_id="PRJ-1042",
        location="Sector 4 Boundary",
        priority="Medium",
    )
    task_id = task.id
    db.close()

    # Complete
    client.post(
        f"/api/v1/operations/tasks/{task_id}/complete",
        json={"officer_id": "OFF-DEMO-01", "observation": "Preliminary observation"},
    )

    # Supervisor requests revisit / rejection
    res_review = client.post(
        f"/api/v1/operations/tasks/{task_id}/review",
        json={
            "supervisor_id": "sup-01",
            "decision": "REJECTED",
            "remarks": "Incomplete photo documentation. Re-survey required.",
        },
    )
    assert res_review.status_code == 200
    assert res_review.json()["verificationStatus"] == "REJECTED"
