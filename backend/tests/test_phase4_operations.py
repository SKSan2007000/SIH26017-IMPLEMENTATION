"""
LandGuard AI — Phase 4 Operational Workflow & Automation Test Suite
Contains 40+ automated backend and operational tests covering:
- 15-state Project State Machine
- 14-state Parcel Workflow
- Automatic Officer Assignment Engine
- SLA Timer & 4-Tier Escalation Hierarchy
- Officer Incentive Scoring & Points Ledger
- Operational Leaderboard
- Today's Operations Queue
- Daily Operational Reporting
- Government / Authority Alerts
- Centralized Notification Engine
- Citizen Grievance Workflow
- Document Lifecycle & OCR
- Evidence Management (GPS/Photo/Video)
- Closed-Loop Risk-to-Action Automation
- Before / After Risk Tracking
- Project Dynamic Progress Calculation
- Contractor Work Package & Delay Alerts
- Immutable Audit Logging
- RBAC Security & Authorization
- Complete End-to-End Operational Lifecycle
"""

import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.db.database import SessionLocal, Base, engine
from backend.app.db.seed import seed_database
from backend.app.db.models import (
    Project, Parcel, Stakeholder, FieldVerification, Document,
    CitizenReport, Notification, RiskPrediction, RiskFactor, AuditLog,
    OfficerProfile, OfficerScore, ContractorWorkPackage, ContractorProgressLog,
    InterventionRecord, GovernmentAlert, StakeholderBenefitRecord
)
from backend.app.services.workflow_service import (
    transition_project_state, update_parcel_workflow_status, calculate_project_actual_progress,
    PROJECT_WORKFLOW_STATES, PARCEL_WORKFLOW_STATES
)
from backend.app.services.assignment_service import find_best_eligible_officer, assign_field_task_automatically
from backend.app.services.escalation_service import check_and_escalate_task, scan_and_process_all_overdue_tasks
from backend.app.services.incentive_service import award_officer_points, get_officer_leaderboard
from backend.app.services.closed_loop_service import execute_closed_loop_intervention, get_project_intervention_history
from backend.app.services.daily_ops_service import get_todays_operations_queue, generate_daily_executive_reports
from backend.app.services.contractor_service import create_work_package, submit_contractor_progress, verify_contractor_progress

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_database():
    """Seeds the database cleanly for isolated test runs."""
    db = SessionLocal()
    seed_database(db, force=True)
    db.close()


# ==========================================
# 1. PROJECT WORKFLOW STATE MACHINE TESTS
# ==========================================

def test_01_project_state_machine_valid_transition():
    db = SessionLocal()
    try:
        res = transition_project_state(db, "PRJ-1042", "ROUTE_ANALYSIS", actor_name="Director")
        assert res["currentState"] == "ROUTE_ANALYSIS"
        assert res["overallProgress"] == 15.0
        assert res["auditLogId"] is not None
    finally:
        db.close()


def test_02_project_state_machine_invalid_transition_rejected():
    db = SessionLocal()
    try:
        with pytest.raises(Exception):
            # Cannot jump directly from ROUTE_ANALYSIS to COMPLETED
            transition_project_state(db, "PRJ-1042", "COMPLETED", force=False)
    finally:
        db.close()


def test_03_project_state_machine_all_15_states_defined():
    assert len(PROJECT_WORKFLOW_STATES) == 15
    assert "DRAFT" in PROJECT_WORKFLOW_STATES
    assert "ROUTE_APPROVAL" in PROJECT_WORKFLOW_STATES
    assert "COMPENSATION" in PROJECT_WORKFLOW_STATES
    assert "CLOSED" in PROJECT_WORKFLOW_STATES


def test_04_project_state_machine_audit_logging():
    db = SessionLocal()
    try:
        transition_project_state(db, "PRJ-1088", "ROUTE_ANALYSIS", actor_name="Test Director")
        log = db.query(AuditLog).filter(
            AuditLog.project_id == "PRJ-1088",
            AuditLog.action == "PROJECT_STATE_TRANSITION"
        ).first()
        assert log is not None
        assert "ROUTE_ANALYSIS" in log.label
    finally:
        db.close()


# ==========================================
# 2. PARCEL-LEVEL WORKFLOW TESTS
# ==========================================

def test_05_parcel_workflow_status_transition():
    db = SessionLocal()
    try:
        res = update_parcel_workflow_status(db, "P-101", "NOTICE_SENT", actor_name="LAO Officer")
        assert res["currentStatus"] == "NOTICE_SENT"
        assert res["parcelId"] == "P-101"
    finally:
        db.close()


def test_06_parcel_workflow_verified_sync():
    db = SessionLocal()
    try:
        res = update_parcel_workflow_status(db, "P-102", "FIELD_VERIFIED")
        assert res["currentStatus"] == "FIELD_VERIFIED"
        assert res["verification"] == "VERIFIED"
    finally:
        db.close()


def test_07_parcel_workflow_disputed_sync():
    db = SessionLocal()
    try:
        res = update_parcel_workflow_status(db, "P-103", "DISPUTED")
        assert res["currentStatus"] == "DISPUTED"
        assert res["disputed"] is True
    finally:
        db.close()


def test_08_parcel_workflow_acquired_sync():
    db = SessionLocal()
    try:
        res = update_parcel_workflow_status(db, "P-104", "ACQUIRED")
        assert res["currentStatus"] == "ACQUIRED"
        assert res["acquisitionStatus"] == "POSSESSED"
    finally:
        db.close()


# ==========================================
# 3. AUTOMATIC OFFICER ASSIGNMENT TESTS
# ==========================================

def test_09_officer_assignment_best_match():
    db = SessionLocal()
    try:
        officer = find_best_eligible_officer(db, task_type="FIELD_VERIFICATION", district="Chennai", priority="High")
        assert officer is not None
        assert officer.role in ["FIELD_OFFICER", "SURVEY_OFFICER"]
    finally:
        db.close()


def test_10_officer_auto_assignment_dispatch():
    db = SessionLocal()
    try:
        task = assign_field_task_automatically(
            db, parcel_id="P-105", project_id="PRJ-1042", location="Ennore North Peg 12", priority="High"
        )
        assert task.id is not None
        assert task.officer_ref is not None
        assert task.status == "Assigned"
        assert task.sla_seconds_allowed == 90
    finally:
        db.close()


def test_11_officer_assignment_generates_notification():
    db = SessionLocal()
    try:
        task = assign_field_task_automatically(
            db, parcel_id="P-106", project_id="PRJ-1042", location="Sector 4 Bridge", priority="Critical"
        )
        notif = db.query(Notification).filter(Notification.parcel_id == "P-106").first()
        assert notif is not None
        assert notif.type == "FIELD_TASK_ASSIGNED"
    finally:
        db.close()


# ==========================================
# 4. SLA TIMER & ESCALATION ENGINE TESTS
# ==========================================

def test_12_task_acceptance_records_response_time():
    res = client.post("/api/v1/operations/tasks/VER-01/accept", json={"officer_id": "OFF-01"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "In Progress"
    assert "acceptedAt" in data


def test_13_task_completion_records_evidence():
    res = client.post("/api/v1/operations/tasks/VER-01/complete", json={
        "officer_id": "OFF-01",
        "gps_coordinates": [80.2707, 13.0827],
        "photo_evidence_ref": "photo_survey_ver01.jpg",
        "observation": "Cadastral boundary verified with DGPS peg marker",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "Awaiting Supervisor Verification"
    assert data["gpsCaptured"] is True


def test_14_task_supervisor_review_approval():
    res = client.post("/api/v1/operations/tasks/VER-01/review", json={
        "supervisor_id": "OFF-06",
        "decision": "APPROVED",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "Verified"
    assert data["verificationStatus"] == "VERIFIED"


def test_15_task_escalation_advances_tier():
    db = SessionLocal()
    try:
        esc = check_and_escalate_task(db, "VER-02", trigger_reason="SLA_BREACH")
        assert esc["currentLevel"] == "SUPERVISOR"
        assert esc["slaStatus"] == "BREACHED"
        assert esc["notificationId"] is not None
    finally:
        db.close()


def test_16_task_multi_tier_escalation_to_district_officer():
    db = SessionLocal()
    try:
        esc1 = check_and_escalate_task(db, "VER-03", trigger_reason="UNRESOLVED_DISPUTE")
        esc2 = check_and_escalate_task(db, "VER-03", trigger_reason="REPEATED_FAILURE")
        assert esc2["currentLevel"] == "DISTRICT_OFFICER"
        assert esc2["governmentAlertId"] is not None
    finally:
        db.close()


# ==========================================
# 5. INCENTIVE & LEADERBOARD TESTS
# ==========================================

def test_17_officer_point_award_positive():
    db = SessionLocal()
    try:
        res = award_officer_points(db, "OFF-01", "ON_TIME_VERIFICATION", custom_points=10)
        assert res["pointsAwarded"] == 10
        assert res["newTotalPoints"] >= 10
    finally:
        db.close()


def test_18_officer_point_deduction_sla_breach():
    db = SessionLocal()
    try:
        res = award_officer_points(db, "OFF-02", "SLA_BREACH", custom_points=-10)
        assert res["pointsAwarded"] == -10
    finally:
        db.close()


def test_19_officer_leaderboard_ranked_output():
    res = client.get("/api/v1/operations/officers/leaderboard")
    assert res.status_code == 200
    lb = res.json()
    assert len(lb) >= 4
    assert lb[0]["rank"] == 1
    assert lb[0]["totalPoints"] >= lb[-1]["totalPoints"]


# ==========================================
# 6. DAILY OPERATIONS PORTAL & REPORTS
# ==========================================

def test_20_todays_operations_queue():
    res = client.get("/api/v1/operations/today")
    assert res.status_code == 200
    data = res.json()
    assert "criticalCount" in data
    assert "highCount" in data
    assert "pendingCount" in data
    assert "completedCount" in data
    assert len(data["critical"]) >= 0


def test_21_daily_operational_reporting():
    res = client.get("/api/v1/operations/daily-summary")
    assert res.status_code == 200
    report = res.json()
    assert "dailyProjectSummary" in report
    assert "dailyOfficerSummary" in report
    assert "dailyAcquisitionSummary" in report
    assert "dailyRiskSummary" in report
    assert len(report["dailyProjectSummary"]) >= 5


# ==========================================
# 7. GOVERNMENT ALERTS TESTS
# ==========================================

def test_22_government_alerts_endpoint():
    res = client.get("/api/v1/operations/alerts/government")
    assert res.status_code == 200
    alerts = res.json()
    assert len(alerts) >= 1
    assert alerts[0]["demoFlag"] == "DEMO GOVERNMENT ALERT"
    assert alerts[0]["severity"] in ["CRITICAL", "HIGH", "EMERGENCY"]


# ==========================================
# 8. CENTRALIZED NOTIFICATIONS TESTS
# ==========================================

def test_23_notifications_dispatch_and_fetch():
    res = client.get("/api/v1/notifications")
    assert res.status_code == 200
    notifs = res.json()
    assert len(notifs) >= 5
    assert "type" in notifs[0]
    assert "severity" in notifs[0]


def test_24_notification_mark_as_read():
    db = SessionLocal()
    try:
        n = db.query(Notification).first()
        res = client.put(f"/api/v1/notifications/{n.id}/read")
        assert res.status_code == 200
        assert res.json()["read"] is True
    finally:
        db.close()


# ==========================================
# 9. CITIZEN GRIEVANCE WORKFLOW TESTS
# ==========================================

def test_25_citizen_grievance_submission():
    res = client.post("/api/v1/citizen-reports", json={
        "project_id": "PRJ-1042",
        "location": "Omalur Bypass Km 12",
        "description": "Irrigation channel access requested near survey plot 42",
        "category": "Access Road Request",
        "has_photo": True,
        "has_video": False,
    })
    assert res.status_code in [200, 201]
    data = res.json()
    assert data["status"] == "Submitted"
    assert data["id"].startswith("CR-")


def test_26_citizen_grievance_status_update():
    res = client.put("/api/v1/citizen-reports/CR-01", json={
        "status": "Verified",
        "response_note": "Drainage culvert redesign approved by engineering team",
    })
    assert res.status_code == 200
    assert res.json()["status"] == "Verified"


# ==========================================
# 10. DOCUMENT WORKFLOW & OCR TESTS
# ==========================================

def test_27_document_registration_and_workflow():
    res = client.post("/api/v1/documents", json={
        "parcel_id": "P-101",
        "project_id": "PRJ-1042",
        "type": "Ownership",
        "file_name": "title_deed_p101.pdf",
        "file_size": "2.4 MB",
    })
    assert res.status_code in [200, 201]
    doc = res.json()
    assert doc["status"] in ["Uploaded", "Processing", "Verified"]


def test_28_document_verification_update():
    db = SessionLocal()
    try:
        d = db.query(Document).first()
        res = client.put(f"/api/v1/documents/{d.id}", json={
            "status": "Verified",
            "remarks": "Automated OCR verified 15-year chain of title",
        })
        assert res.status_code == 200
        assert res.json()["status"] == "Verified"
    finally:
        db.close()


# ==========================================
# 11. CLOSED-LOOP RISK TO ACTION AUTOMATION
# ==========================================

def test_29_closed_loop_dispute_intervention():
    res = client.post("/api/v1/operations/closed-loop/intervene", json={
        "project_id": "PRJ-1042",
        "action_type": "DISPUTE_MEDIATION",
        "officer_name": "Special LAO Cell",
        "notes": "Convene Special RDO fast-track hearing",
    })
    assert res.status_code == 200
    data = res.json()
    assert "riskBefore" in data
    assert "riskAfter" in data
    assert "improvementPoints" in data
    assert data["actionTitle"] == "Fast-Track Special RDO Title Mediation"


def test_30_closed_loop_intervention_history():
    res = client.get("/api/v1/operations/closed-loop/history/PRJ-1042")
    assert res.status_code == 200
    history = res.json()
    assert isinstance(history, list)
    assert len(history) >= 1
    assert "riskBefore" in history[0]
    assert "improvementPoints" in history[0]


# ==========================================
# 12. PROJECT PROGRESS CALCULATION TESTS
# ==========================================

def test_31_project_progress_dynamic_calculation():
    res = client.get("/api/v1/workflow/projects/PRJ-1042/progress")
    assert res.status_code == 200
    prog = res.json()
    assert "overallProgressPct" in prog
    assert "landAcquisitionProgressPct" in prog
    assert "constructionProgressPct" in prog
    assert prog["overallProgressPct"] >= 0.0


# ==========================================
# 13. CONTRACTOR MONITORING & DELAY ALERTS
# ==========================================

def test_32_contractor_work_package_creation():
    res = client.post("/api/v1/contractors/packages", json={
        "project_id": "PRJ-1042",
        "package_name": "Package 3: Highway Interchange Structure",
        "contractor_name": "NCC Infrastructure Ltd",
        "planned_progress_pct": 25.0,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["contractorName"] == "NCC Infrastructure Ltd"


def test_33_contractor_progress_submission_with_variance():
    db = SessionLocal()
    try:
        pkg = db.query(ContractorWorkPackage).first()
        res = client.post(f"/api/v1/contractors/packages/{pkg.id}/progress", json={
            "reported_progress_pct": 35.0,
            "photo_evidence_ref": "photo_bridge_pier_04.jpg",
            "notes": "Girder launching completed on piers 12-18",
        })
        assert res.status_code == 200
        data = res.json()
        assert data["reportedProgressPct"] == 35.0
        assert "variancePct" in data
    finally:
        db.close()


def test_34_contractor_progress_officer_verification():
    db = SessionLocal()
    try:
        # Create a log first
        pkg = db.query(ContractorWorkPackage).first()
        log_res = submit_contractor_progress(db, pkg.id, reported_progress_pct=40.0)
        
        ver_res = verify_contractor_progress(db, log_res["logId"], officer_id="OFF-01", decision="VERIFIED")
        assert ver_res["verificationStatus"] == "VERIFIED"
    finally:
        db.close()


# ==========================================
# 14. STAKEHOLDER BENEFIT & PARTICIPATION
# ==========================================

def test_35_stakeholder_benefit_registration():
    res = client.post("/api/v1/operations/benefits/register", json={
        "stakeholder_id": "SH-001",
        "project_id": "PRJ-1042",
        "owner_ref": "DEMO OWNER-001",
        "category": "Field Support",
        "stipend_amount_inr": 15000.0,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["benefitType"] == "DEMO PARTICIPATION / EMPLOYMENT BENEFIT"
    assert data["status"] == "ACTIVE"


def test_36_stakeholder_benefits_list():
    res = client.get("/api/v1/operations/benefits")
    assert res.status_code == 200
    bens = res.json()
    assert len(bens) >= 1
    assert bens[0]["benefitType"] == "DEMO PARTICIPATION / EMPLOYMENT BENEFIT"


# ==========================================
# 15. AUDIT TRAIL IMMUTABILITY & LOGGING
# ==========================================

def test_37_audit_trail_chronological_query():
    res = client.get("/api/v1/projects/PRJ-1042/audit")
    assert res.status_code == 200
    logs = res.json()
    assert len(logs) >= 3
    assert "action" in logs[0]
    assert "time" in logs[0]


def test_38_audit_log_explicit_event_creation():
    res = client.post("/api/v1/audit-logs", json={
        "project_id": "PRJ-1042",
        "actor": "Project Director",
        "action": "ROUTE_APPROVED",
        "entity": "Route",
        "entity_id": "RT-1042-C",
        "label": "Route C Selected",
        "category": "Route Selection",
        "details": "AI-optimized Route C approved after multi-criteria scoring",
    })
    assert res.status_code in [200, 201]
    assert res.json()["action"] == "ROUTE_APPROVED"


# ==========================================
# 16. RBAC SECURITY & ROLE BOUNDARIES
# ==========================================

def test_39_rbac_login_token_generation():
    res = client.post("/api/v1/auth/login", json={
        "email": "head@landguard.gov.in",
        "password": "LandGuard@2026",
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "PROJECT_HEAD"


def test_40_rbac_authenticated_profile():
    # Login as Field Officer
    login_res = client.post("/api/v1/auth/login", json={
        "email": "field@landguard.gov.in",
        "password": "LandGuard@2026",
    })
    token = login_res.json()["access_token"]
    
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    user = res.json()
    assert user["role"] == "FIELD_OFFICER"


# ==========================================
# 17. COMPLETE END-TO-END OPERATIONAL DEMO
# ==========================================

def test_41_end_to_end_operational_scenario():
    """
    Simulates the complete lifecycle:
    Project Creation -> Route Analysis -> Route Approval -> Land Identification ->
    Auto Task Assignment -> Field Evidence Submission -> Supervisor Review ->
    Closed-Loop Intervention -> Construction Monitoring -> Final Project Closure.
    """
    db = SessionLocal()
    try:
        # 1. Advance project through route planning
        transition_project_state(db, "PRJ-1042", "ROUTE_ANALYSIS", actor_name="Director")
        transition_project_state(db, "PRJ-1042", "ROUTE_APPROVAL", actor_name="Director")
        
        # 2. Advance to LAND_IDENTIFICATION
        transition_project_state(db, "PRJ-1042", "LAND_IDENTIFICATION", actor_name="Director")
        
        # 3. Auto-assign field task
        task = assign_field_task_automatically(db, "P-101", "PRJ-1042", "Corridor Peg 01", priority="High")
        
        # 4. Accept task
        task.accepted_at = datetime.now(timezone.utc)
        task.status = "In Progress"
        
        # 5. Complete with GPS
        task.completed_at = datetime.now(timezone.utc)
        task.gps_captured = True
        task.status = "Awaiting Supervisor Verification"
        
        # 6. Supervisor Approves
        task.supervisor_decision = "APPROVED"
        task.status = "Verified"
        update_parcel_workflow_status(db, "P-101", "ACQUIRED")
        
        # 7. Execute Closed-Loop Intervention (reduces risk)
        interv = execute_closed_loop_intervention(db, "PRJ-1042", "DISPUTE_MEDIATION")
        assert interv["riskAfter"] <= interv["riskBefore"]
        
        # 8. Advance through remaining workflow states to COMPLETED
        transition_project_state(db, "PRJ-1042", "STAKEHOLDER_NOTIFICATION", actor_name="Director")
        transition_project_state(db, "PRJ-1042", "FIELD_VERIFICATION", actor_name="Director")
        transition_project_state(db, "PRJ-1042", "DOCUMENT_VERIFICATION", actor_name="Director")
        transition_project_state(db, "PRJ-1042", "COMPENSATION", actor_name="Director")
        transition_project_state(db, "PRJ-1042", "ACQUISITION", actor_name="Director")
        transition_project_state(db, "PRJ-1042", "CONSTRUCTION", actor_name="Director")
        transition_project_state(db, "PRJ-1042", "MONITORING", actor_name="Director")
        transition_project_state(db, "PRJ-1042", "FINAL_VERIFICATION", actor_name="Director")
        final_res = transition_project_state(db, "PRJ-1042", "COMPLETED", actor_name="Director")
        assert final_res["currentState"] == "COMPLETED"
        assert final_res["overallProgress"] == 100.0
        
        # 9. Close Project
        close_res = transition_project_state(db, "PRJ-1042", "CLOSED", actor_name="Director")
        assert close_res["currentState"] == "CLOSED"
    finally:
        db.close()
