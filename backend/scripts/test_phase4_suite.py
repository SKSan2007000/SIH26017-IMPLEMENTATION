"""
LandGuard AI — Phase 4 Operational Verification Suite Runner
Executes 41 automated tests covering all Phase 4 operational requirements.
"""

import sys
import os
from datetime import datetime, timezone
from fastapi.testclient import TestClient

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.main import app
from backend.app.db.database import SessionLocal
from backend.app.db.seed import seed_database
from backend.tests.test_phase4_operations import (
    test_01_project_state_machine_valid_transition,
    test_02_project_state_machine_invalid_transition_rejected,
    test_03_project_state_machine_all_15_states_defined,
    test_04_project_state_machine_audit_logging,
    test_05_parcel_workflow_status_transition,
    test_06_parcel_workflow_verified_sync,
    test_07_parcel_workflow_disputed_sync,
    test_08_parcel_workflow_acquired_sync,
    test_09_officer_assignment_best_match,
    test_10_officer_auto_assignment_dispatch,
    test_11_officer_assignment_generates_notification,
    test_12_task_acceptance_records_response_time,
    test_13_task_completion_records_evidence,
    test_14_task_supervisor_review_approval,
    test_15_task_escalation_advances_tier,
    test_16_task_multi_tier_escalation_to_district_officer,
    test_17_officer_point_award_positive,
    test_18_officer_point_deduction_sla_breach,
    test_19_officer_leaderboard_ranked_output,
    test_20_todays_operations_queue,
    test_21_daily_operational_reporting,
    test_22_government_alerts_endpoint,
    test_23_notifications_dispatch_and_fetch,
    test_24_notification_mark_as_read,
    test_25_citizen_grievance_submission,
    test_26_citizen_grievance_status_update,
    test_27_document_registration_and_workflow,
    test_28_document_verification_update,
    test_29_closed_loop_dispute_intervention,
    test_30_closed_loop_intervention_history,
    test_31_project_progress_dynamic_calculation,
    test_32_contractor_work_package_creation,
    test_33_contractor_progress_submission_with_variance,
    test_34_contractor_progress_officer_verification,
    test_35_stakeholder_benefit_registration,
    test_36_stakeholder_benefits_list,
    test_37_audit_trail_chronological_query,
    test_38_audit_log_explicit_event_creation,
    test_39_rbac_login_token_generation,
    test_40_rbac_authenticated_profile,
    test_41_end_to_end_operational_scenario,
)


def run_phase4_suite():
    print("=" * 65)
    print("LANDGUARD AI — PHASE 4 OPERATIONAL WORKFLOW & AUTOMATION SUITE")
    print("=" * 65)

    db = SessionLocal()
    seed_database(db, force=True)
    db.close()

    tests = [
        ("01. Project State Machine: Valid Transition", test_01_project_state_machine_valid_transition),
        ("02. Project State Machine: Invalid Transition Rejected", test_02_project_state_machine_invalid_transition_rejected),
        ("03. Project State Machine: All 15 States Registered", test_03_project_state_machine_all_15_states_defined),
        ("04. Project State Machine: Audit Trail Logging", test_04_project_state_machine_audit_logging),
        ("05. Parcel Workflow: Status Transition", test_05_parcel_workflow_status_transition),
        ("06. Parcel Workflow: Verified Synchronization", test_06_parcel_workflow_verified_sync),
        ("07. Parcel Workflow: Disputed Synchronization", test_07_parcel_workflow_disputed_sync),
        ("08. Parcel Workflow: Acquired & Possessed Synchronization", test_08_parcel_workflow_acquired_sync),
        ("09. Officer Auto-Assignment: Optimal Match Algorithm", test_09_officer_assignment_best_match),
        ("10. Officer Auto-Assignment: Field Dispatch Execution", test_10_officer_auto_assignment_dispatch),
        ("11. Officer Auto-Assignment: System Notification", test_11_officer_assignment_generates_notification),
        ("12. SLA Timer: Task Acceptance & Response Timer", test_12_task_acceptance_records_response_time),
        ("13. SLA Timer: Task Completion & Evidence Submission", test_13_task_completion_records_evidence),
        ("14. Supervisor Review: Task Verification & Sign-off", test_14_task_supervisor_review_approval),
        ("15. Escalation Engine: Tier 1 to Supervisor Escalation", test_15_task_escalation_advances_tier),
        ("16. Escalation Engine: Multi-Tier District Officer Escalation", test_16_task_multi_tier_escalation_to_district_officer),
        ("17. Officer Incentives: Performance Points Award", test_17_officer_point_award_positive),
        ("18. Officer Incentives: SLA Breach Penalty Deduction", test_18_officer_point_deduction_sla_breach),
        ("19. Officer Performance: Operational Leaderboard", test_19_officer_leaderboard_ranked_output),
        ("20. Daily Operations: Today's Work Queue", test_20_todays_operations_queue),
        ("21. Daily Reporting: Structured Executive Summaries", test_21_daily_operational_reporting),
        ("22. Government Alerts: Authority Escalation System", test_22_government_alerts_endpoint),
        ("23. Notifications Engine: Centralized Dispatch & Feed", test_23_notifications_dispatch_and_fetch),
        ("24. Notifications Engine: Mark Read Lifecycle", test_24_notification_mark_as_read),
        ("25. Citizen Grievances: Case Submission & ID", test_25_citizen_grievance_submission),
        ("26. Citizen Grievances: Investigation & Resolution", test_26_citizen_grievance_status_update),
        ("27. Documents Workflow: Record Registration", test_27_document_registration_and_workflow),
        ("28. Documents Workflow: OCR & Title Chain Verification", test_28_document_verification_update),
        ("29. Closed-Loop AI: Dispute Mediation Intervention", test_29_closed_loop_dispute_intervention),
        ("30. Closed-Loop AI: Before/After Risk History Tracking", test_30_closed_loop_intervention_history),
        ("31. Dynamic Progress: Stage-Weighted Progress Calculation", test_31_project_progress_dynamic_calculation),
        ("32. Contractor Monitoring: Work Package Assignment", test_32_contractor_work_package_creation),
        ("33. Contractor Monitoring: Progress Variance & Delay Alert", test_33_contractor_progress_submission_with_variance),
        ("34. Contractor Monitoring: Officer Inspection Sign-off", test_34_contractor_progress_officer_verification),
        ("35. Stakeholder Benefits: Demo Participation Enrollment", test_35_stakeholder_benefit_registration),
        ("36. Stakeholder Benefits: Active Benefit Ledger", test_36_stakeholder_benefits_list),
        ("37. Audit Trail: Chronological Project Event Log", test_37_audit_trail_chronological_query),
        ("38. Audit Trail: Explicit Milestone Event Recording", test_38_audit_log_explicit_event_creation),
        ("39. RBAC Security: JWT Token Generation", test_39_rbac_login_token_generation),
        ("40. RBAC Security: Role-Authenticated Profile Query", test_40_rbac_authenticated_profile),
        ("41. Complete End-to-End Operational Lifecycle Scenario", test_41_end_to_end_operational_scenario),
    ]

    passed = 0
    for label, t_func in tests:
        try:
            t_func()
            print(f" [PASS] {label}")
            passed += 1
        except Exception as e:
            print(f" [FAIL] {label} -> {e}")
            raise e

    print("=" * 65)
    print(f"ALL {passed}/{len(tests)} PHASE 4 OPERATIONAL TESTS PASSED PERFECTLY!")
    print("=" * 65)


if __name__ == "__main__":
    run_phase4_suite()
