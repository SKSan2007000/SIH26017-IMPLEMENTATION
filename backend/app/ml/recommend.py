"""
LandGuard AI — AI Actionable Recommendation Engine
Generates targeted, prioritized corrective actions based on detected
risk drivers and acquisition bottleneck features.
"""

from typing import Dict, Any, List


def generate_risk_recommendations(features: Dict[str, Any], risk_score: int) -> List[Dict[str, Any]]:
    """
    Evaluates project features and detected bottleneck thresholds to generate
    ranked, actionable recommendations.
    """
    recommendations = []

    # 1. Legal Disputes
    disputed_count = int(features.get("disputed_parcels_count", features.get("disputed_parcels", 0)))
    legal_count = int(features.get("legal_disputes_count", disputed_count))
    dispute_ratio = float(features.get("dispute_ratio", 0.0))
    if legal_count > 0 or dispute_ratio > 0.08:
        recommendations.append({
            "id": "REC-LEGAL",
            "category": "Legal & Title",
            "priority": "Critical" if (legal_count > 2 or dispute_ratio > 0.15) else "High",
            "title": "Prioritize Fast-Track Mediation for Disputed Parcels",
            "action": f"Convene Special Revenue Divisional Officer (RDO) sittings to resolve {max(1, legal_count)} active title claims and competing heir disputes.",
            "estimatedRiskReductionPct": min(22, max(8, int(legal_count * 3.5))),
            "affectedParcelsCount": max(1, disputed_count),
        })

    # 2. Documentation Completion
    doc_completion = float(features.get("documentation_completion_pct", features.get("doc_completion_ratio", 0.7) * 100.0))
    if doc_completion < 85.0:
        pending_docs_pct = int(100.0 - doc_completion)
        recommendations.append({
            "id": "REC-DOC",
            "category": "Documentation",
            "priority": "High" if doc_completion < 60.0 else "Medium",
            "title": "Enable AI Automated Document Verification & OCR",
            "action": f"Initiate automated cadastral OCR processing to resolve {pending_docs_pct}% pending survey and ownership record discrepancies.",
            "estimatedRiskReductionPct": min(18, max(6, int(pending_docs_pct * 0.25))),
            "affectedParcelsCount": int(features.get("total_parcels", 10) * (pending_docs_pct / 100.0)),
        })

    # 3. Compensation Disbursement
    comp_completion = float(features.get("compensation_completion_pct", 60.0))
    if comp_completion < 80.0:
        pending_comp_pct = int(100.0 - comp_completion)
        recommendations.append({
            "id": "REC-COMP",
            "category": "Compensation",
            "priority": "Critical" if comp_completion < 50.0 else "High",
            "title": "Expedite Compensation Escrow & Award Disbursals",
            "action": f"Fast-track Section 19/23 compensation awards and initiate Direct Benefit Transfer (DBT) to reduce {pending_comp_pct}% pending disbursal gap.",
            "estimatedRiskReductionPct": min(25, max(10, int(pending_comp_pct * 0.3))),
            "affectedParcelsCount": int(features.get("total_parcels", 10)),
        })

    # 4. Administrative Clearances / Approvals
    pending_appr = int(features.get("pending_approvals_count", 2))
    appr_time = float(features.get("avg_approval_time_days", 45.0))
    if pending_appr >= 2 or appr_time > 40.0:
        recommendations.append({
            "id": "REC-APPR",
            "category": "Statutory Approvals",
            "priority": "High" if pending_appr >= 3 else "Medium",
            "title": "Escalate Clearances to State Land Acquisition Committee (SLAC)",
            "action": f"Elevate {pending_appr} pending inter-departmental clearances (Forest/PWD/Canal) for single-window expedited approval.",
            "estimatedRiskReductionPct": min(16, max(6, pending_appr * 4)),
            "affectedParcelsCount": int(features.get("total_parcels", 10)),
        })

    # 5. Stakeholder Friction / Unresponsive Owners
    sh_rate = float(features.get("stakeholder_response_rate", 75.0))
    sh_friction = float(features.get("stakeholder_friction_ratio", (100.0 - sh_rate) / 100.0))
    if sh_rate < 80.0 or sh_friction > 0.15:
        recommendations.append({
            "id": "REC-STAKEHOLDER",
            "category": "Stakeholder Engagement",
            "priority": "High" if sh_rate < 65.0 else "Medium",
            "title": "Deploy Special Citizen Outreach & Notice Delivery Units",
            "action": "Deploy village-level field officers for in-person Section 11(1) notice explanation and grievance resolution.",
            "estimatedRiskReductionPct": min(15, max(5, int((100.0 - sh_rate) * 0.25))),
            "affectedParcelsCount": int(features.get("unresponsive_stakeholders", 3)),
        })

    # 6. Field Verification Backlog
    pending_ver = int(features.get("pending_verifications", 2))
    field_backlog = float(features.get("field_backlog_ratio", 0.3))
    if pending_ver > 1 or field_backlog > 0.25:
        recommendations.append({
            "id": "REC-FIELD",
            "category": "Field Verification",
            "priority": "Medium",
            "title": "Assign Dedicated GPS Mobile Survey Teams",
            "action": f"Deploy mobile cadastral survey teams to clear {pending_ver} pending on-ground parcel verification cases.",
            "estimatedRiskReductionPct": min(12, max(4, pending_ver * 3)),
            "affectedParcelsCount": pending_ver,
        })

    # Sort by priority and estimated reduction
    priority_order = {"Critical": 3, "High": 2, "Medium": 1, "Low": 0}
    recommendations.sort(key=lambda r: (priority_order.get(r["priority"], 0), r["estimatedRiskReductionPct"]), reverse=True)

    return recommendations
