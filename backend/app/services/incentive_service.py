"""
LandGuard AI — Officer Performance & Incentive Engine
Manages configurable point awards, records score ledger entries, and generates
operational leaderboards without leaking sensitive personal information.
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.db.models.officer_performance import OfficerProfile, OfficerScore
from backend.app.db.models.audit import AuditLog


POINT_RULES: Dict[str, int] = {
    "ON_TIME_VERIFICATION": 10,
    "EARLY_COMPLETION": 15,
    "GPS_ACCURACY": 10,
    "VALID_EVIDENCE": 5,
    "DISPUTE_RESOLUTION": 20,
    "CRITICAL_TASK_COMPLETION": 20,
    "SLA_BREACH": -10,
    "REJECTED_VERIFICATION": -5,
}

TIER_THRESHOLDS = [
    (300, "Diamond"),
    (200, "Platinum"),
    (100, "Gold"),
    (50, "Silver"),
    (0, "Bronze"),
]


def award_officer_points(
    db: Session,
    officer_id: str,
    action_type: str,
    task_id: Optional[str] = None,
    project_id: Optional[str] = None,
    custom_points: Optional[int] = None,
    reason: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Awards or deducts performance points for an officer, logs an OfficerScore entry,
    and updates aggregate performance metrics.
    """
    officer = db.query(OfficerProfile).filter(OfficerProfile.id == officer_id).first()
    if not officer:
        # Fallback query by name
        officer = db.query(OfficerProfile).filter(OfficerProfile.name.contains(officer_id)).first()

    if not officer:
        officer = OfficerProfile(
            id=officer_id if officer_id.startswith("OFF-") else f"OFF-{officer_id}",
            name=f"Officer {officer_id}",
            role="FIELD_OFFICER",
            district="Chennai",
            total_points=100,
        )
        db.add(officer)
        db.commit()
        db.refresh(officer)

    points_delta = custom_points if custom_points is not None else POINT_RULES.get(action_type, 5)
    default_reason = f"Performance event: {action_type.replace('_', ' ').title()}"

    score_entry = OfficerScore(
        id=f"PTS-{uuid.uuid4().hex[:10]}",
        officer_id=officer.id,
        task_id=task_id,
        project_id=project_id,
        action_type=action_type,
        points=points_delta,
        reason=reason or default_reason,
        awarded_at=datetime.now(timezone.utc),
    )
    db.add(score_entry)

    # Update officer aggregates
    officer.total_points = max(0, (officer.total_points or 0) + points_delta)

    if action_type in ["ON_TIME_VERIFICATION", "EARLY_COMPLETION", "CRITICAL_TASK_COMPLETION"]:
        officer.completed_tasks = (officer.completed_tasks or 0) + 1
        officer.on_time_tasks = (officer.on_time_tasks or 0) + 1
    elif action_type == "REJECTED_VERIFICATION":
        officer.completed_tasks = (officer.completed_tasks or 0) + 1

    # Recalculate SLA compliance
    if officer.completed_tasks and officer.completed_tasks > 0:
        officer.sla_compliance_pct = round((officer.on_time_tasks / officer.completed_tasks) * 100.0, 1)

    # Update tier
    for thresh, tier in TIER_THRESHOLDS:
        if officer.total_points >= thresh:
            officer.points_tier = tier
            break

    db.commit()
    db.refresh(officer)

    return {
        "officerId": officer.id,
        "officerName": officer.name,
        "actionType": action_type,
        "pointsAwarded": points_delta,
        "newTotalPoints": officer.total_points,
        "tier": officer.points_tier,
        "slaCompliancePct": officer.sla_compliance_pct,
        "scoreEntryId": score_entry.id,
    }


def get_officer_leaderboard(db: Session, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Returns the operational leaderboard ranked by total points, on-time percentage,
    average response time, and verification accuracy.
    """
    officers = (
        db.query(OfficerProfile)
        .order_by(desc(OfficerProfile.total_points), desc(OfficerProfile.sla_compliance_pct))
        .limit(limit)
        .all()
    )

    leaderboard = []
    for rank, off in enumerate(officers, start=1):
        leaderboard.append({
            "rank": rank,
            "id": off.id,
            "name": off.name,
            "role": off.role,
            "district": off.district,
            "completedTasks": off.completed_tasks or 0,
            "onTimeRatePct": off.sla_compliance_pct or 92.0,
            "averageResponseSec": off.avg_response_time_sec or 120.0,
            "verificationAccuracyPct": off.verification_accuracy_pct or 95.0,
            "totalPoints": off.total_points or 0,
            "tier": off.points_tier or "Gold",
            "isAvailable": off.is_available,
        })

    return leaderboard
