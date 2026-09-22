"""
LandGuard AI — Phase 3 Comprehensive ML & API Automated Test Suite
Tests dataset generation, preprocessing, model training, inference,
explainability, recommendations, what-if simulation, route evaluation, and FastAPI endpoints.
"""

import sys
import os
import pytest
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.ml.dataset import generate_historical_dataset
from backend.app.ml.preprocess import (
    create_preprocessor_pipeline,
    prepare_features_for_inference,
    NUMERICAL_FEATURES,
    CATEGORICAL_FEATURES,
    ALL_FEATURE_COLUMNS,
)
from backend.app.ml.train import train_and_evaluate_models, get_model_storage_dir
from backend.app.ml.predict import predict_project_risk, get_or_load_models
from backend.app.ml.explain import compute_feature_contributions
from backend.app.ml.recommend import generate_risk_recommendations
from backend.app.ml.simulate import simulate_what_if_interventions, simulate_combined_what_if
from backend.app.ml.route_eval import evaluate_route_candidate_risk, evaluate_and_rank_routes
from backend.app.db.database import SessionLocal
from backend.app.db.models.project import Project
from backend.app.db.models.risk import RiskPrediction, RiskFactor
from backend.app.services.risk_service import recalculate_and_persist_project_risk

client = TestClient(app)


# 1. DATASET GENERATION TESTS
def test_dataset_generation_scale_and_schema():
    df = generate_historical_dataset(num_records=500, seed=123)
    assert len(df) == 500, f"Expected 500 records, got {len(df)}"
    assert "delayed" in df.columns
    assert "actual_delay_months" in df.columns
    assert "actual_delay_days" in df.columns
    for col in ALL_FEATURE_COLUMNS:
        assert col in df.columns, f"Missing feature column: {col}"


def test_dataset_correlation_and_physics():
    df = generate_historical_dataset(num_records=2000, seed=42)
    # High disputes should correlate positively with delay
    high_disputes = df[df["legal_disputes_count"] > 15]
    low_disputes = df[df["legal_disputes_count"] <= 3]
    assert high_disputes["delayed"].mean() > low_disputes["delayed"].mean(), "Physics check: High legal disputes must increase delay rate"
    
    # High compensation completion should correlate negatively with delay
    high_comp = df[df["compensation_completion_pct"] > 80.0]
    low_comp = df[df["compensation_completion_pct"] < 30.0]
    assert low_comp["delayed"].mean() > high_comp["delayed"].mean(), "Physics check: Low compensation completion must increase delay rate"


# 2. PREPROCESSING PIPELINE TESTS
def test_preprocessing_pipeline_fit_transform():
    df = generate_historical_dataset(num_records=200, seed=99)
    X = df[ALL_FEATURE_COLUMNS]
    prep = create_preprocessor_pipeline()
    X_trans = prep.fit_transform(X)
    assert X_trans.shape[0] == 200
    assert not np.isnan(X_trans).any(), "Preprocessed output should have zero NaNs"


def test_prepare_features_for_inference_defaults():
    raw = {"disputed_parcels": 4, "total_parcels": 20}
    df_inf = prepare_features_for_inference(raw)
    assert df_inf.shape == (1, len(ALL_FEATURE_COLUMNS))
    assert df_inf["disputed_parcels_count"].iloc[0] == 4
    assert df_inf["affected_parcels"].iloc[0] == 20


# 3. MODEL TRAINING & ARTIFACT SERIALIZATION TESTS
def test_model_training_and_metrics_evaluation():
    metrics = train_and_evaluate_models(num_records=1500, seed=42, save_artifacts=False)
    assert "classification_metrics" in metrics
    assert "regression_metrics" in metrics
    cls_m = metrics["classification_metrics"]
    reg_m = metrics["regression_metrics"]
    
    assert cls_m["accuracy"] > 0.85, f"Accuracy too low: {cls_m['accuracy']}"
    assert cls_m["roc_auc"] > 0.90, f"ROC-AUC too low: {cls_m['roc_auc']}"
    assert cls_m["f1"] > 0.80, f"F1 too low: {cls_m['f1']}"
    assert reg_m["mae"] < 2.5, f"MAE too high: {reg_m['mae']}"
    assert reg_m["rmse"] < 3.0, f"RMSE too high: {reg_m['rmse']}"
    assert reg_m["r2"] > 0.60, f"R2 too low: {reg_m['r2']}"


def test_saved_model_artifacts_integrity():
    models = get_or_load_models()
    assert models["classifier"] is not None
    assert models["regressor"] is not None
    assert models["preprocessor"] is not None
    assert isinstance(models["metrics"], dict)


# 4. INFERENCE ENGINE & PREDICTION TESTS
def test_prediction_engine_valid_ranges():
    features = {
        "legal_disputes_count": 8,
        "disputed_parcels_count": 8,
        "total_parcels": 30,
        "compensation_completion_pct": 30.0,
        "documentation_completion_pct": 45.0,
        "pending_approvals_count": 4,
    }
    res = predict_project_risk(features)
    assert 0.0 <= res["delay_probability"] <= 1.0
    assert 0 <= res["risk_score"] <= 100
    assert res["risk_category"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert res["expected_delay_months"] >= 0.0
    assert res["expected_delay_days"] >= 0
    assert len(res["categories"]) > 0
    assert len(res["drivers"]) > 0
    assert len(res["recommendations"]) > 0


def test_risk_categorization_brackets():
    # Extreme high risk scenario
    high_risk_feats = {
        "legal_disputes_count": 25,
        "disputed_parcels_count": 30,
        "total_parcels": 35,
        "compensation_completion_pct": 10.0,
        "documentation_completion_pct": 15.0,
        "pending_approvals_count": 8,
        "field_verification_delay_days": 90.0,
    }
    res_high = predict_project_risk(high_risk_feats)
    assert res_high["risk_category"] in ["HIGH", "CRITICAL"]
    assert res_high["risk_score"] >= 65

    # Extreme low risk scenario
    low_risk_feats = {
        "legal_disputes_count": 0,
        "disputed_parcels_count": 0,
        "total_parcels": 20,
        "compensation_completion_pct": 98.0,
        "documentation_completion_pct": 98.0,
        "pending_approvals_count": 0,
        "field_verification_delay_days": 2.0,
        "stakeholder_response_rate": 98.0,
    }
    res_low = predict_project_risk(low_risk_feats)
    assert res_low["risk_category"] in ["LOW", "MEDIUM"]
    assert res_low["risk_score"] < 40


# 5. EXPLAINABLE AI & RECOMMENDATION TESTS
def test_explainable_ai_drivers_derivation():
    features = {
        "legal_disputes_count": 10,
        "disputed_parcels_count": 10,
        "total_parcels": 20,
        "compensation_completion_pct": 25.0,
    }
    categories, drivers = compute_feature_contributions(features, {}, risk_score=80)
    assert len(categories) == 5
    assert len(drivers) <= 3
    driver_labels = [d["label"] for d in drivers]
    assert any("Dispute" in lbl or "Compensation" in lbl for lbl in driver_labels)


def test_dynamic_ai_recommendations():
    features = {
        "legal_disputes_count": 6,
        "disputed_parcels_count": 6,
        "documentation_completion_pct": 30.0,
        "compensation_completion_pct": 20.0,
        "pending_approvals_count": 4,
    }
    recs = generate_risk_recommendations(features, risk_score=85)
    assert len(recs) >= 3
    rec_cats = [r["category"] for r in recs]
    assert "Legal & Title" in rec_cats or "Compensation" in rec_cats or "Documentation" in rec_cats


# 6. WHAT-IF SIMULATION TESTS
def test_what_if_simulation_reduces_risk():
    base_features = {
        "legal_disputes_count": 15,
        "disputed_parcels_count": 15,
        "total_parcels": 30,
        "compensation_completion_pct": 35.0,
        "documentation_completion_pct": 40.0,
        "pending_approvals_count": 4,
    }
    res = simulate_what_if_interventions(base_features, ["resolve_disputes", "resolve_documents"])
    assert len(res) == 5
    
    # Check resolve disputes lever
    disp_lever = next(r for r in res if r["id"] == "resolve_disputes")
    assert disp_lever["resultingRiskPct"] < disp_lever["baseRiskPct"]
    assert disp_lever["reductionPct"] > 0


def test_what_if_combined_simulation():
    base_features = {
        "legal_disputes_count": 10,
        "disputed_parcels_count": 10,
        "total_parcels": 30,
        "compensation_completion_pct": 30.0,
        "documentation_completion_pct": 35.0,
    }
    combined = simulate_combined_what_if(base_features, ["resolve_disputes", "resolve_documents", "alternate_route"])
    assert combined["simulated"]["risk_score"] < combined["baseline"]["risk_score"]
    assert combined["simulated"]["risk_reduction_pct"] > 0
    assert combined["is_simulated"] is True


# 7. ROUTE-WISE MULTI-CRITERIA EVALUATION TESTS
def test_route_wise_evaluation_and_ranking():
    project_features = {"district": "Chennai", "project_type": "Expressway / Highway"}
    candidate_routes = [
        {"id": "RT-A", "label": "Route A", "distance_km": 42.0, "affected_parcels": 35, "stakeholders": 40, "estimated_cost_cr": 4800.0, "legal_dispute_exposure": 35.0},
        {"id": "RT-B", "label": "Route B", "distance_km": 38.0, "affected_parcels": 28, "stakeholders": 32, "estimated_cost_cr": 4200.0, "legal_dispute_exposure": 25.0},
        {"id": "RT-C", "label": "Route C", "distance_km": 39.5, "affected_parcels": 12, "stakeholders": 15, "estimated_cost_cr": 4350.0, "legal_dispute_exposure": 5.0},
        {"id": "RT-D", "label": "Route D", "distance_km": 46.0, "affected_parcels": 45, "stakeholders": 55, "estimated_cost_cr": 5400.0, "legal_dispute_exposure": 40.0},
    ]
    ranked = evaluate_and_rank_routes(project_features, candidate_routes)
    assert len(ranked) == 4
    for r in ranked:
        assert "riskScore" in r
        assert "delayProbabilityPct" in r
        assert "overallScore" in r
        assert "aiRecommended" in r
    
    # Exactly one route must be recommended
    recs = [r for r in ranked if r["aiRecommended"]]
    assert len(recs) == 1, "Exactly one route must be designated aiRecommended"


# 8. FASTAPI ENDPOINT INTEGRATION TESTS
def test_api_project_risk_endpoint():
    res = client.get("/api/v1/projects/PRJ-1042/risk")
    assert res.status_code == 200
    data = res.json()
    assert "overallPct" in data
    assert "band" in data
    assert "predictedDelayLabel" in data
    assert "delay_probability" in data
    assert "risk_score" in data
    assert "risk_category" in data
    assert "expected_delay_months" in data
    assert len(data["drivers"]) > 0


def test_api_project_risk_factors_endpoint():
    res = client.get("/api/v1/projects/PRJ-1042/risk/factors")
    assert res.status_code == 200
    factors = res.json()
    assert isinstance(factors, list)
    assert len(factors) >= 1
    assert "factorName" in factors[0]


def test_api_project_risk_drivers_endpoint():
    res = client.get("/api/v1/projects/PRJ-1042/risk/drivers")
    assert res.status_code == 200
    drivers = res.json()
    assert isinstance(drivers, list)
    assert len(drivers) >= 1
    assert "label" in drivers[0]
    assert "contributionPct" in drivers[0]


def test_api_project_risk_explain_endpoint():
    res = client.get("/api/v1/projects/PRJ-1042/risk/explain")
    assert res.status_code == 200
    exp = res.json()
    assert exp["projectId"] == "PRJ-1042"
    assert "decisionSupportStatement" in exp
    assert "features" in exp
    assert "drivers" in exp


def test_api_project_risk_recalculate_endpoint():
    res = client.post("/api/v1/projects/PRJ-1042/risk/recalculate")
    assert res.status_code == 200
    data = res.json()
    assert "overallPct" in data
    assert "delay_probability" in data


def test_api_project_what_if_endpoint():
    res = client.post("/api/v1/projects/PRJ-1042/what-if", json={
        "leverIds": ["resolve_disputes", "resolve_documents"]
    })
    assert res.status_code == 200
    levers = res.json()
    assert len(levers) >= 3
    assert any(l["isActive"] for l in levers)


def test_api_routes_evaluate_endpoint():
    res = client.post("/api/v1/projects/PRJ-1042/routes/evaluate")
    assert res.status_code == 200
    routes = res.json()
    assert len(routes) == 4
    assert any(r["aiRecommended"] for r in routes)


def test_api_ml_predict_endpoint():
    res = client.post("/api/v1/ml/predict", json={
        "legal_disputes_count": 5,
        "disputed_parcels_count": 5,
        "total_parcels": 20,
        "compensation_completion_pct": 40.0,
        "documentation_completion_pct": 50.0,
    })
    assert res.status_code == 200
    data = res.json()
    assert "delay_probability" in data
    assert "risk_score" in data
    assert "risk_category" in data
    assert "expected_delay_months" in data


def test_api_ml_model_info_endpoint():
    res = client.get("/api/v1/ml/model-info")
    assert res.status_code == 200
    info = res.json()
    assert "model_version" in info
    assert "classification_metrics" in info
    assert "regression_metrics" in info
    assert "top_feature_importances" in info


def test_api_ml_simulate_endpoint():
    res = client.post("/api/v1/ml/simulate", json={
        "features": {
            "legal_disputes_count": 10,
            "disputed_parcels_count": 10,
            "total_parcels": 25,
            "compensation_completion_pct": 25.0,
        },
        "lever_ids": ["resolve_disputes", "more_field_officers"],
    })
    assert res.status_code == 200
    sim = res.json()
    assert "baseline" in sim
    assert "simulated" in sim
    assert sim["is_simulated"] is True


def test_database_risk_prediction_persistence():
    db = SessionLocal()
    try:
        recalculate_and_persist_project_risk(db, "PRJ-1042")
        rp = db.query(RiskPrediction).filter(RiskPrediction.project_id == "PRJ-1042").first()
        assert rp is not None
        assert rp.delay_probability is not None
        assert rp.risk_score is not None
        assert rp.risk_category in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        assert rp.expected_delay_months is not None
        assert isinstance(rp.recommendations, list)
    finally:
        db.close()


def run_all_tests():
    print("=" * 60)
    print("LANDGUARD AI — PHASE 3 AI/ML AUTOMATED VERIFICATION SUITE")
    print("=" * 60)
    
    tests = [
        ("1. Dataset Scale & Schema", test_dataset_generation_scale_and_schema),
        ("2. Dataset Correlation & Domain Physics", test_dataset_correlation_and_physics),
        ("3. Preprocessing Pipeline Fit/Transform", test_preprocessing_pipeline_fit_transform),
        ("4. Feature Standardization & Mapping", test_prepare_features_for_inference_defaults),
        ("5. Model Training & Metrics Thresholds", test_model_training_and_metrics_evaluation),
        ("6. Serialized Model Artifacts Integrity", test_saved_model_artifacts_integrity),
        ("7. Prediction Engine Output Ranges", test_prediction_engine_valid_ranges),
        ("8. Risk Categorization (LOW/MED/HIGH/CRITICAL)", test_risk_categorization_brackets),
        ("9. Explainable AI Driver Breakdown", test_explainable_ai_drivers_derivation),
        ("10. Dynamic AI Recommendations Engine", test_dynamic_ai_recommendations),
        ("11. What-If Single Lever Simulation", test_what_if_simulation_reduces_risk),
        ("12. What-If Multi-Lever Simulation", test_what_if_combined_simulation),
        ("13. Route-wise Multi-Criteria Ranking", test_route_wise_evaluation_and_ranking),
        ("14. GET /api/v1/projects/{id}/risk", test_api_project_risk_endpoint),
        ("15. GET /api/v1/projects/{id}/risk/factors", test_api_project_risk_factors_endpoint),
        ("16. GET /api/v1/projects/{id}/risk/drivers", test_api_project_risk_drivers_endpoint),
        ("17. GET /api/v1/projects/{id}/risk/explain", test_api_project_risk_explain_endpoint),
        ("18. POST /api/v1/projects/{id}/risk/recalculate", test_api_project_risk_recalculate_endpoint),
        ("19. POST /api/v1/projects/{id}/what-if", test_api_project_what_if_endpoint),
        ("20. POST /api/v1/projects/{id}/routes/evaluate", test_api_routes_evaluate_endpoint),
        ("21. POST /api/v1/ml/predict", test_api_ml_predict_endpoint),
        ("22. GET /api/v1/ml/model-info", test_api_ml_model_info_endpoint),
        ("23. POST /api/v1/ml/simulate", test_api_ml_simulate_endpoint),
        ("24. Database Model Persistence & Integrity", test_database_risk_prediction_persistence),
    ]

    passed = 0
    for name, t_func in tests:
        try:
            t_func()
            print(f" [PASS] {name}")
            passed += 1
        except Exception as e:
            print(f" [FAIL] {name} -> {e}")
            raise e

    print("=" * 60)
    print(f"ALL {passed}/{len(tests)} PHASE 3 ML VERIFICATION TESTS PASSED PERFECTLY!")
    print("=" * 60)


if __name__ == "__main__":
    run_all_tests()
