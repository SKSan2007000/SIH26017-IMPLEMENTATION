"""
LandGuard AI — Data Preprocessing Pipeline
Handles imputation, scaling, categorical encoding, and feature transformation
for both training and production inference.
"""

from typing import List, Tuple, Dict, Any, Optional
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder


NUMERICAL_FEATURES: List[str] = [
    "land_area_acres",
    "affected_families",
    "affected_parcels",
    "project_complexity",
    "historical_performance_score",
    "compensation_completion_pct",
    "approval_completion_pct",
    "documentation_completion_pct",
    "possession_pct",
    "rehabilitation_progress_pct",
    "stakeholder_response_rate",
    "legal_disputes_count",
    "disputed_parcels_count",
    "pending_approvals_count",
    "incomplete_documents_count",
    "unresolved_grievances_count",
    "administrative_bottlenecks_score",
    "field_verification_delay_days",
    "planned_duration_months",
    "elapsed_duration_months",
    "avg_approval_time_days",
    "avg_verification_time_days",
    "avg_stakeholder_response_days",
    "route_affected_parcel_count",
    "route_land_area_acres",
    "route_affected_households",
    "route_complexity_score",
    "route_legal_dispute_exposure",
    "estimated_acquisition_cost_cr",
]

CATEGORICAL_FEATURES: List[str] = [
    "project_type",
    "state",
    "district",
]

ALL_FEATURE_COLUMNS = NUMERICAL_FEATURES + CATEGORICAL_FEATURES


def create_preprocessor_pipeline() -> ColumnTransformer:
    """
    Constructs a scikit-learn ColumnTransformer for feature preprocessing.
    - Numerical: Impute with median -> Standard scale
    - Categorical: Impute with most frequent -> OneHotEncode with handle_unknown='ignore'
    """
    num_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    cat_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, NUMERICAL_FEATURES),
            ("cat", cat_pipeline, CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )

    return preprocessor


def prepare_features_for_inference(
    features_dict: Dict[str, Any],
    default_state: str = "Tamil Nadu",
    default_district: str = "Chennai",
    default_type: str = "Expressway / Highway",
) -> pd.DataFrame:
    """
    Standardizes a raw project feature dictionary into a single-row DataFrame
    matching the exact schema expected by the preprocessor.
    Fills in safe domain defaults for any omitted fields.
    """
    row: Dict[str, Any] = {}

    # Map possible alias names / nested keys
    total_parcels = float(features_dict.get("total_parcels", features_dict.get("affected_parcels", 25)))
    disputed_parcels = float(features_dict.get("disputed_parcels", features_dict.get("disputed_parcels_count", 0)))
    dispute_ratio = features_dict.get("dispute_ratio")
    if dispute_ratio is None:
        dispute_ratio = (disputed_parcels / max(1.0, total_parcels)) if total_parcels > 0 else 0.0

    if "documentation_completion_pct" in features_dict:
        doc_completion = float(features_dict["documentation_completion_pct"])
    elif "doc_completion_ratio" in features_dict:
        doc_completion = float(features_dict["doc_completion_ratio"]) * 100.0
    else:
        doc_completion = 65.0

    if "stakeholder_response_rate" in features_dict:
        sh_response_rate = float(features_dict["stakeholder_response_rate"])
    elif "stakeholder_friction_ratio" in features_dict:
        sh_response_rate = (1.0 - float(features_dict["stakeholder_friction_ratio"])) * 100.0
    else:
        sh_response_rate = 75.0

    comp_completion = float(features_dict.get("compensation_completion_pct", 55.0))
    appr_completion = float(features_dict.get("approval_completion_pct", 60.0))
    possession_pct = float(features_dict.get("possession_pct", min(comp_completion * 0.8, 85.0)))
    rehab_pct = float(features_dict.get("rehabilitation_progress_pct", min(comp_completion * 0.75, 80.0)))

    # Numerical features
    row["land_area_acres"] = float(features_dict.get("land_area_acres", features_dict.get("required_land_area_acres", 180.0)))
    row["affected_families"] = float(features_dict.get("affected_families", total_parcels * 1.3))
    row["affected_parcels"] = total_parcels
    row["project_complexity"] = float(features_dict.get("project_complexity", 3))
    row["historical_performance_score"] = float(features_dict.get("historical_performance_score", 72.0))
    row["compensation_completion_pct"] = comp_completion
    row["approval_completion_pct"] = appr_completion
    row["documentation_completion_pct"] = doc_completion
    row["possession_pct"] = possession_pct
    row["rehabilitation_progress_pct"] = rehab_pct
    row["stakeholder_response_rate"] = sh_response_rate
    
    legal_count = float(features_dict.get("legal_disputes_count", disputed_parcels))
    row["legal_disputes_count"] = legal_count
    row["disputed_parcels_count"] = float(features_dict.get("disputed_parcels_count", features_dict.get("disputed_parcels", legal_count)))
    row["pending_approvals_count"] = float(features_dict.get("pending_approvals_count", 3))
    row["incomplete_documents_count"] = float(features_dict.get("incomplete_documents_count", max(0, total_parcels * (1.0 - doc_completion / 100.0))))
    row["unresolved_grievances_count"] = float(features_dict.get("unresolved_grievances", features_dict.get("unresolved_grievances_count", 2)))
    row["administrative_bottlenecks_score"] = float(features_dict.get("administrative_bottlenecks_score", min(95.0, 25.0 + dispute_ratio * 100.0 + (100.0 - comp_completion) * 0.3)))
    row["field_verification_delay_days"] = float(features_dict.get("field_verification_delay_days", min(100.0, 10.0 + dispute_ratio * 80.0)))
    row["planned_duration_months"] = float(features_dict.get("planned_duration_months", 24.0))
    row["elapsed_duration_months"] = float(features_dict.get("elapsed_duration_months", 10.0))
    row["avg_approval_time_days"] = float(features_dict.get("avg_approval_time_days", 45.0))
    row["avg_verification_time_days"] = float(features_dict.get("avg_verification_time_days", 22.0))
    row["avg_stakeholder_response_days"] = float(features_dict.get("avg_stakeholder_response_days", 18.0))
    row["route_affected_parcel_count"] = float(features_dict.get("route_affected_parcel_count", total_parcels))
    row["route_land_area_acres"] = float(features_dict.get("route_land_area_acres", row["land_area_acres"]))
    row["route_affected_households"] = float(features_dict.get("route_affected_households", row["affected_families"]))
    row["route_complexity_score"] = float(features_dict.get("route_complexity_score", row["project_complexity"]))
    row["route_legal_dispute_exposure"] = float(features_dict.get("route_legal_dispute_exposure", min(100.0, dispute_ratio * 100.0)))
    row["estimated_acquisition_cost_cr"] = float(features_dict.get("estimated_acquisition_cost_cr", features_dict.get("estimated_budget_cr", 2400.0)))

    # Categorical features
    row["project_type"] = str(features_dict.get("project_type", features_dict.get("type", default_type)))
    row["state"] = str(features_dict.get("state", default_state))
    row["district"] = str(features_dict.get("district", default_district))

    return pd.DataFrame([row], columns=ALL_FEATURE_COLUMNS)
