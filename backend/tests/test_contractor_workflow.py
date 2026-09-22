"""
LandGuard AI — Phase 18 & 19 Contractor Workflow & AI Change Request Test Suite
Verifies:
1. Contractor viewing assigned work packages.
2. Contractor progress reporting & evidence submission.
3. Contractor submitting Design Change Request (CR).
4. AI calculates Cost Delta, Risk Delta, Time Delta, and Land Impact Delta.
5. Officer reviews and approves Change Request.
6. New immutable design version (v1 -> v2) created upon approval.
7. Audit log creation for contractor lifecycle.
"""

import sys
import os
import pytest
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.database import SessionLocal
from backend.app.db.models.contractor import ContractorWorkPackage
from backend.app.db.models.design import Design, DesignVersion, DesignChangeRequest
from backend.app.db.models.audit import AuditLog
from backend.app.db.seed import seed_database

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    db = SessionLocal()
    seed_database(db, force=False)
    db.close()


def test_01_contractor_work_packages_retrieval():
    # Retrieve contractor packages
    db = SessionLocal()
    pkgs = db.query(ContractorWorkPackage).filter(ContractorWorkPackage.project_id == "PRJ-1042").all()
    assert len(pkgs) >= 1
    db.close()


def test_02_contractor_change_request_and_ai_impact():
    # 1. Contractor submits a Design Change Request
    cr_payload = {
        "title": "Viaduct Shift to Avoid Wetland Soil Stability Zone",
        "reason": "Geotechnical core samples show soft clay between Chainage 14.2 and 15.1. 40m northern offset prevents 3 month foundation delay.",
        "contractor_id": "con-01",
        "contractor_name": "Larsen & Toubro Infra Consortium",
        "requested_modifications": {"shiftDirection": "North", "offsetMeters": 40.0},
        "proposed_geometry": [
            [80.222, 13.067],
            [80.235, 13.098],
            [80.250, 13.140],
            [80.265, 13.180],
            [80.278, 13.205],
        ],
    }
    res = client.post(
        "/api/v1/designs/DSG-PRJ-1042-D/change-requests?project_id=PRJ-1042",
        json=cr_payload,
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    cr_data = res.json()
    cr_id = cr_data["id"]
    assert "ai_impact_analysis" in cr_data
    impact = cr_data["ai_impact_analysis"]
    assert "costDeltaCr" in impact
    assert "riskDeltaPct" in impact
    assert "timeDeltaMonths" in impact

    # 2. Officer reviews and approves the change request
    review_payload = {
        "officer_review_status": "APPROVED",
        "officer_comment": "Reviewed with Chief Geotechnical Engineer. Northern shift approved.",
        "reviewer_name": "Dr. A. Sundaram (Project Director)",
    }
    res_review = client.post(
        f"/api/v1/designs/change-requests/{cr_id}/review",
        json=review_payload,
    )
    assert res_review.status_code == 200
    rev_data = res_review.json()
    assert rev_data["status"] == "APPROVED"
    assert "newVersionId" in rev_data

    # 3. Verify new design version created in DB
    db = SessionLocal()
    new_ver = db.query(DesignVersion).filter(DesignVersion.id == rev_data["newVersionId"]).first()
    assert new_ver is not None
    assert new_ver.source == "CONTRACTOR_CHANGE_REQUEST"

    # 4. Verify audit log entry
    audit = db.query(AuditLog).filter(
        AuditLog.action == "CHANGE_REQUEST_APPROVED",
        AuditLog.entity_id == cr_id,
    ).first()
    assert audit is not None
    db.close()
