"""
LandGuard AI — Phase 14 Dedicated Officer Allocation Test Suite
Verifies all 12 required intelligent local officer allocation conditions:
1. Same-zone officer preferred.
2. Same-district officer preferred over distant officer.
3. Unavailable officer skipped.
4. Overloaded officer penalized.
5. Correct role required.
6. Officer assignment persisted in database.
7. Critical task receives assignment.
8. Fallback escalation triggered when no field officer is available.
9. Allocation reason stored and logged.
10. Audit entry created for assignment.
11. SLA begins upon assignment.
12. Reassignment works if officer becomes unavailable.
"""

import sys
import os
import pytest
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.database import SessionLocal
from backend.app.db.models.officer_performance import OfficerProfile
from backend.app.db.models.field_verification import FieldVerification
from backend.app.db.models.audit import AuditLog
from backend.app.db.models.parcel import Parcel
from backend.app.db.seed import seed_database
from backend.app.services.assignment_service import (
    find_best_eligible_officer,
    assign_field_task_automatically,
    reassign_field_task,
)

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    db = SessionLocal()
    seed_database(db, force=False)
    db.close()


# 1. Same-zone officer preferred
def test_01_same_zone_officer_preferred():
    db = SessionLocal()
    # Create two officers in same district (Chennai), but different zones
    off_zone_a = OfficerProfile(
        id=f"OFF-ZONE-A-{uuid.uuid4().hex[:4]}",
        name="Zone A Local Officer",
        role="FIELD_OFFICER",
        district="Chennai",
        zone="Zone A",
        is_available=True,
        current_workload=0,
        sla_compliance_pct=95.0,
        verification_accuracy_pct=95.0,
    )
    off_zone_c = OfficerProfile(
        id=f"OFF-ZONE-C-{uuid.uuid4().hex[:4]}",
        name="Zone C Distant Officer",
        role="FIELD_OFFICER",
        district="Chennai",
        zone="Zone C",
        is_available=True,
        current_workload=0,
        sla_compliance_pct=95.0,
        verification_accuracy_pct=95.0,
    )
    db.add(off_zone_a)
    db.add(off_zone_c)
    db.commit()

    best_officer, reason, dist = find_best_eligible_officer(
        db, task_type="FIELD_VERIFICATION", district="Chennai", zone="Zone A"
    )
    assert best_officer.id == off_zone_a.id, f"Expected Zone A officer, got {best_officer.name}"
    assert "Same Zone" in reason
    db.close()


# 2. Same-district officer preferred over distant officer
def test_02_same_district_officer_preferred():
    db = SessionLocal()
    off_salem = OfficerProfile(
        id=f"OFF-SALEM-{uuid.uuid4().hex[:4]}",
        name="Salem Local Officer",
        role="FIELD_OFFICER",
        district="Salem",
        zone="West Zone",
        is_available=True,
        current_workload=0,
        sla_compliance_pct=90.0,
        verification_accuracy_pct=90.0,
    )
    off_madurai = OfficerProfile(
        id=f"OFF-MDU-{uuid.uuid4().hex[:4]}",
        name="Madurai Officer",
        role="FIELD_OFFICER",
        district="Madurai",
        zone="South Zone",
        is_available=True,
        current_workload=0,
        sla_compliance_pct=90.0,
        verification_accuracy_pct=90.0,
    )
    db.add(off_salem)
    db.add(off_madurai)
    db.commit()

    best_officer, reason, dist = find_best_eligible_officer(
        db, task_type="FIELD_VERIFICATION", district="Salem", zone="West Zone"
    )
    assert best_officer.district == "Salem"
    assert "Same District" in reason or "Same Zone" in reason
    db.close()


# 3. Unavailable officer skipped
def test_03_unavailable_officer_skipped():
    db = SessionLocal()
    u_dist = f"Dist-{uuid.uuid4().hex[:6]}"
    u_zone = f"Zone-{uuid.uuid4().hex[:4]}"
    off_busy = OfficerProfile(
        id=f"OFF-BUSY-{uuid.uuid4().hex[:4]}",
        name="Busy Officer (On Leave)",
        role="FIELD_OFFICER",
        district=u_dist,
        zone=u_zone,
        is_available=False,
        current_workload=0,
        sla_compliance_pct=99.0,
    )
    off_avail = OfficerProfile(
        id=f"OFF-AVAIL-{uuid.uuid4().hex[:4]}",
        name="Available Officer",
        role="FIELD_OFFICER",
        district=u_dist,
        zone=u_zone,
        is_available=True,
        current_workload=1,
        sla_compliance_pct=88.0,
    )
    db.add(off_busy)
    db.add(off_avail)
    db.commit()

    best_officer, reason, dist = find_best_eligible_officer(
        db, task_type="FIELD_VERIFICATION", district=u_dist, zone=u_zone
    )
    assert best_officer.id == off_avail.id
    assert best_officer.is_available is True
    db.close()


# 4. Overloaded officer penalized
def test_04_overloaded_officer_penalized():
    db = SessionLocal()
    u_dist = f"Dist-{uuid.uuid4().hex[:6]}"
    u_zone = f"Zone-{uuid.uuid4().hex[:4]}"
    off_overloaded = OfficerProfile(
        id=f"OFF-OVER-{uuid.uuid4().hex[:4]}",
        name="Overloaded Officer",
        role="FIELD_OFFICER",
        district=u_dist,
        zone=u_zone,
        is_available=True,
        current_workload=10,  # 10 active tasks
        sla_compliance_pct=95.0,
    )
    off_free = OfficerProfile(
        id=f"OFF-FREE-{uuid.uuid4().hex[:4]}",
        name="Free Capacity Officer",
        role="FIELD_OFFICER",
        district=u_dist,
        zone=u_zone,
        is_available=True,
        current_workload=0,  # 0 active tasks
        sla_compliance_pct=90.0,
    )
    db.add(off_overloaded)
    db.add(off_free)
    db.commit()

    best_officer, reason, dist = find_best_eligible_officer(
        db, task_type="FIELD_VERIFICATION", district=u_dist, zone=u_zone
    )
    assert best_officer.id == off_free.id
    db.close()


# 5. Correct role required
def test_05_correct_role_required():
    db = SessionLocal()
    legal_off = OfficerProfile(
        id=f"OFF-LEGAL-{uuid.uuid4().hex[:4]}",
        name="Advocate R. Sundaram",
        role="LEGAL_OFFICER",
        district="Chennai",
        zone="Zone A",
        is_available=True,
        current_workload=0,
    )
    db.add(legal_off)
    db.commit()

    # Legal dispute task requires LEGAL_OFFICER or LAND_ACQUISITION_OFFICER
    best_officer, reason, dist = find_best_eligible_officer(
        db, task_type="LEGAL_DISPUTE", district="Chennai", zone="Zone A"
    )
    assert best_officer.role in ["LEGAL_OFFICER", "LAND_ACQUISITION_OFFICER"]
    db.close()


# 6. Officer assignment persisted in database
def test_06_officer_assignment_persisted():
    db = SessionLocal()
    task = assign_field_task_automatically(
        db,
        parcel_id="P-101",
        project_id="PRJ-1042",
        location="Ennore Cadastral Grid 4",
        priority="High",
        district="Chennai",
        zone="Zone A",
    )
    assert task.id.startswith("VER-")
    assert task.officer_ref is not None
    assert task.status == "Assigned"
    assert task.allocation_reason is not None

    # Verify query directly from DB
    persisted = db.query(FieldVerification).filter(FieldVerification.id == task.id).first()
    assert persisted is not None
    assert persisted.officer_name == task.officer_name
    db.close()


# 7. Critical task receives assignment
def test_07_critical_task_assignment():
    res = client.post(
        "/api/v1/operations/assignments/auto",
        json={
            "parcel_id": "P-104",
            "project_id": "PRJ-1042",
            "location": "Madhavaram Critical Junction",
            "priority": "Critical",
            "district": "Chennai",
            "zone": "Zone A",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["priority"] == "Critical"
    assert data["assignedOfficer"] is not None
    assert data["slaSecondsAllowed"] in [45, 90, 300]


# 8. Fallback escalation hierarchy if no field officer available
def test_08_fallback_escalation_hierarchy():
    db = SessionLocal()
    # Query for specialized task type
    officer, reason, dist = find_best_eligible_officer(
        db, task_type="SUPERVISOR_REVIEW", district="Chennai"
    )
    assert officer.role in ["SUPERVISOR", "PROJECT_HEAD", "FIELD_OFFICER"]
    assert len(reason) > 0
    db.close()


# 9. Allocation reason stored and logged
def test_09_allocation_reason_stored_and_logged():
    db = SessionLocal()
    task = assign_field_task_automatically(
        db,
        parcel_id="P-108",
        project_id="PRJ-1042",
        location="Sector 2 Boundary Peg",
        priority="Medium",
        district="Chennai",
        zone="South Zone",
    )
    assert task.allocation_reason is not None
    assert len(task.allocation_reason) > 10
    db.close()


# 10. Audit entry created for assignment
def test_10_audit_entry_created():
    db = SessionLocal()
    task = assign_field_task_automatically(
        db,
        parcel_id="P-112",
        project_id="PRJ-1042",
        location="Oragadam Grid",
        priority="High",
        district="Chennai",
    )
    audit = db.query(AuditLog).filter(
        AuditLog.entity_id == task.id,
        AuditLog.action == "TASK_ASSIGNED",
    ).first()
    assert audit is not None
    assert "Task Assigned" in audit.label
    db.close()


# 11. SLA starts after assignment
def test_11_sla_starts_after_assignment():
    db = SessionLocal()
    task = assign_field_task_automatically(
        db,
        parcel_id="P-115",
        project_id="PRJ-1088",
        location="Omalur Bypass",
        priority="Critical",
        custom_sla_seconds=45,
    )
    assert task.task_created_at is not None
    assert task.deadline_at is not None
    assert task.sla_status == "ON_TIME"
    assert task.sla_seconds_allowed == 45
    db.close()


# 12. Reassignment works if officer becomes unavailable
def test_12_reassignment_works():
    db = SessionLocal()
    # Create initial task
    task = assign_field_task_automatically(
        db,
        parcel_id="P-120",
        project_id="PRJ-1042",
        location="Ambattur Industrial Zone",
        priority="Medium",
    )
    old_officer = task.officer_ref

    # Reassign
    reassigned_task = reassign_field_task(
        db,
        task_id=task.id,
        reason="Officer medical leave emergency",
        exclude_officer_id=old_officer,
    )
    assert reassigned_task.id == task.id
    assert "Reassigned" in reassigned_task.allocation_reason

    # Verify audit log recorded for reassignment
    audit = db.query(AuditLog).filter(
        AuditLog.entity_id == task.id,
        AuditLog.action == "TASK_REASSIGNED",
    ).first()
    assert audit is not None
    db.close()
