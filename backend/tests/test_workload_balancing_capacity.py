"""
LandGuard AI - Workload Balancing & Officer Allocation Multi-Project Test Suite
Verifies:
1. Workload balancing across projects (Max 5 projects limit)
2. Capacity penalties: 4 projects (Near Capacity, -60 penalty), >=5 projects (At Capacity, -500 penalty)
3. Transparent score breakdown with exact points
4. Auto-assignment route /api/v1/operations/projects/{project_id}/auto-assign-officers
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
from backend.app.db.models.project import Project
from backend.app.services.assignment_service import (
    find_best_eligible_officer,
    get_officers_workload_status,
    assign_project_officers_automatically,
    MAX_CAPACITY,
)

client = TestClient(app)


def test_workload_capacity_and_scoring_breakdown():
    db = SessionLocal()
    unique_suffix = uuid.uuid4().hex[:6]
    district = f"Dist-{unique_suffix}"
    zone = f"Zone-{unique_suffix}"

    # Officer A: 1 project (Low workload)
    off_a = OfficerProfile(
        id=f"OFF-A-{unique_suffix}",
        name=f"Officer A (1 proj)",
        role="FIELD_OFFICER",
        district=district,
        zone=zone,
        is_available=True,
        current_workload=1,
        sla_compliance_pct=95.0,
        verification_accuracy_pct=95.0,
    )
    # Officer B: 3 projects (Medium workload)
    off_b = OfficerProfile(
        id=f"OFF-B-{unique_suffix}",
        name=f"Officer B (3 proj)",
        role="FIELD_OFFICER",
        district=district,
        zone=zone,
        is_available=True,
        current_workload=3,
        sla_compliance_pct=95.0,
        verification_accuracy_pct=95.0,
    )
    # Officer C: 4 projects (Near Capacity)
    off_c = OfficerProfile(
        id=f"OFF-C-{unique_suffix}",
        name=f"Officer C (4 proj)",
        role="FIELD_OFFICER",
        district=district,
        zone=zone,
        is_available=True,
        current_workload=4,
        sla_compliance_pct=95.0,
        verification_accuracy_pct=95.0,
    )
    # Officer D: 5 projects (At Capacity)
    off_d = OfficerProfile(
        id=f"OFF-D-{unique_suffix}",
        name=f"Officer D (5 proj)",
        role="FIELD_OFFICER",
        district=district,
        zone=zone,
        is_available=True,
        current_workload=5,
        sla_compliance_pct=95.0,
        verification_accuracy_pct=95.0,
    )
    db.add_all([off_a, off_b, off_c, off_d])
    db.commit()

    # 1. Best officer selected should be Officer A (lowest workload = 1)
    best_officer, reason, dist = find_best_eligible_officer(
        db, task_type="FIELD_VERIFICATION", district=district, zone=zone
    )
    assert best_officer.id == off_a.id, f"Expected Officer A, got {best_officer.name}"
    assert "Same Zone match +100" in reason
    assert "Same District match +60" in reason
    assert "Low workload (1/5 projects, -20)" in reason

    # 2. Check get_officers_workload_status
    officers_status = get_officers_workload_status(db, district=district)
    status_map = {o["id"]: o for o in officers_status}
    
    assert status_map[off_a.id]["capacity_status"] == "AVAILABLE"
    assert status_map[off_b.id]["capacity_status"] == "AVAILABLE"
    assert status_map[off_c.id]["capacity_status"] == "NEAR CAPACITY"
    assert status_map[off_d.id]["capacity_status"] == "AT CAPACITY"

    # 3. Test Auto Assign endpoint for a project in this district
    prj = Project(
        id=f"LG-PRJ-2026-TST-{unique_suffix}",
        name="Test Corridor Auto-Assign",
        type="Expressway",
        state="Tamil Nadu",
        district=district,
        status="Draft",
        start_location="Chennai",
        destination="Bengaluru",
        estimated_budget_cr=1250.0,
        target_completion="2027-12-31",
        coords=[[13.0827, 80.2707], [13.010, 80.180]],
    )
    db.add(prj)
    db.commit()

    res = client.post(
        f"/api/v1/operations/projects/{prj.id}/auto-assign-officers?district={district}&zone={zone}",
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert "team" in data
    assert data["team"]["fieldOfficer"]["id"] == off_a.id
    assert "allocationReason" in data["team"]["fieldOfficer"]

    db.close()
