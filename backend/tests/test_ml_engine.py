"""
Pytest suite for LandGuard AI ML Predictive Analytics Engine
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.scripts.test_ml_suite import (
    test_dataset_generation_scale_and_schema,
    test_dataset_correlation_and_physics,
    test_preprocessing_pipeline_fit_transform,
    test_prepare_features_for_inference_defaults,
    test_model_training_and_metrics_evaluation,
    test_saved_model_artifacts_integrity,
    test_prediction_engine_valid_ranges,
    test_risk_categorization_brackets,
    test_explainable_ai_drivers_derivation,
    test_dynamic_ai_recommendations,
    test_what_if_simulation_reduces_risk,
    test_what_if_combined_simulation,
    test_route_wise_evaluation_and_ranking,
    test_api_project_risk_endpoint,
    test_api_project_risk_factors_endpoint,
    test_api_project_risk_drivers_endpoint,
    test_api_project_risk_explain_endpoint,
    test_api_project_risk_recalculate_endpoint,
    test_api_project_what_if_endpoint,
    test_api_routes_evaluate_endpoint,
    test_api_ml_predict_endpoint,
    test_api_ml_model_info_endpoint,
    test_api_ml_simulate_endpoint,
    test_database_risk_prediction_persistence,
)
