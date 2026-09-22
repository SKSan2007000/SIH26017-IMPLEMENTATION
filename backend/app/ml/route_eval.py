"""
LandGuard AI — Route-Wise Multi-Criteria Risk Evaluator
Evaluates candidate highway/rail corridor alignments using the trained ML model
to assess delay probability, cost impact, and identify the optimal trade-off alignment.
"""

from typing import Dict, Any, List
from backend.app.ml.predict import predict_project_risk


def evaluate_route_candidate_risk(
    project_features: Dict[str, Any],
    route_data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Evaluates a single route candidate using its unique spatial & acquisition attributes.
    """
    # Clone and override project features with route-specific metrics
    route_features = {
        **project_features,
        "affected_parcels": route_data.get("affected_parcels", route_data.get("affectedParcels", 20)),
        "total_parcels": route_data.get("affected_parcels", route_data.get("affectedParcels", 20)),
        "affected_families": route_data.get("stakeholders", route_data.get("affected_families", 25)),
        "land_area_acres": float(route_data.get("distance_km", route_data.get("distanceKm", 40.0))) * 3.5,
        "estimated_budget_cr": float(route_data.get("estimated_cost_cr", route_data.get("estimatedCostCr", 2500.0))),
        "estimated_acquisition_cost_cr": float(route_data.get("estimated_cost_cr", route_data.get("estimatedCostCr", 2500.0))),
        "route_complexity_score": float(route_data.get("route_complexity_score", 3.0)),
        "route_legal_dispute_exposure": float(route_data.get("legal_dispute_exposure", 15.0)),
    }

    pred = predict_project_risk(route_features)

    return {
        "id": route_data.get("id"),
        "label": route_data.get("label"),
        "strategy": route_data.get("strategy"),
        "distanceKm": route_data.get("distance_km", route_data.get("distanceKm", 40.0)),
        "affectedParcels": route_features["affected_parcels"],
        "stakeholders": route_features["affected_families"],
        "estimatedCostCr": route_features["estimated_acquisition_cost_cr"],
        "delayProbabilityPct": int(round(pred["delay_probability"] * 100)),
        "riskScore": pred["risk_score"],
        "riskCategory": pred["risk_category"],
        "estimatedDelayMonths": pred["expected_delay_months"],
    }


def evaluate_and_rank_routes(
    project_features: Dict[str, Any],
    routes: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Evaluates multiple candidate routes (Route A, B, C, D) and determines the
    AI-recommended alignment based on objective multi-criteria optimization.
    """
    evaluated = []
    for r in routes:
        eval_res = evaluate_route_candidate_risk(project_features, r)
        
        # Multi-Criteria Scoring (0-100, Higher = Better)
        # 1. Delay Risk Inversion (40% weight) -> Lower risk is better
        delay_score = max(0, 100 - eval_res["riskScore"])
        
        # 2. Cost Efficiency (25% weight)
        cost_val = eval_res["estimatedCostCr"]
        cost_score = max(20, min(100, int(100 - (cost_val / 80.0))))
        
        # 3. Parcel / Land Impact (20% weight) -> Fewer affected parcels is better
        parcel_cnt = eval_res["affectedParcels"]
        parcel_score = max(10, min(100, int(100 - (parcel_cnt * 3.0))))
        
        # 4. Social / Stakeholder Ease (15% weight)
        sh_cnt = eval_res["stakeholders"]
        sh_score = max(15, min(100, int(100 - (sh_cnt * 2.0))))

        overall_score = int(round(
            delay_score * 0.40 +
            cost_score * 0.25 +
            parcel_score * 0.20 +
            sh_score * 0.15
        ))

        eval_res["overallScore"] = max(35, min(96, overall_score))
        eval_res["path"] = r.get("path", [])
        eval_res["infrastructureImpact"] = r.get("infrastructure_impact", r.get("infrastructureImpact", "Medium"))
        eval_res["corridorWidthMeters"] = r.get("corridor_width_meters", r.get("corridorWidthMeters", 32.0))
        eval_res["lanes"] = r.get("lanes", 6)
        evaluated.append(eval_res)

    # Find the best route with the highest overall score
    best_route_id = max(evaluated, key=lambda x: x["overallScore"])["id"]
    for e in evaluated:
        e["aiRecommended"] = (e["id"] == best_route_id)

    return evaluated
