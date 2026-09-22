"""
LandGuard AI — Pydantic Schemas for ML Predictive Engine
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    project_id: Optional[str] = None
    project_type: Optional[str] = "Expressway / Highway"
    state: Optional[str] = "Tamil Nadu"
    district: Optional[str] = "Chennai"
    land_area_acres: Optional[float] = 180.0
    affected_families: Optional[float] = 250.0
    affected_parcels: Optional[float] = 180.0
    project_complexity: Optional[int] = 3
    historical_performance_score: Optional[float] = 72.0
    compensation_completion_pct: Optional[float] = 55.0
    approval_completion_pct: Optional[float] = 60.0
    documentation_completion_pct: Optional[float] = 70.0
    possession_pct: Optional[float] = 45.0
    rehabilitation_progress_pct: Optional[float] = 40.0
    stakeholder_response_rate: Optional[float] = 75.0
    legal_disputes_count: Optional[int] = 2
    disputed_parcels_count: Optional[int] = 2
    pending_approvals_count: Optional[int] = 2
    incomplete_documents_count: Optional[int] = 30
    unresolved_grievances_count: Optional[int] = 2
    administrative_bottlenecks_score: Optional[float] = 40.0
    field_verification_delay_days: Optional[float] = 20.0
    planned_duration_months: Optional[float] = 24.0
    elapsed_duration_months: Optional[float] = 8.0
    avg_approval_time_days: Optional[float] = 45.0
    avg_verification_time_days: Optional[float] = 22.0
    avg_stakeholder_response_days: Optional[float] = 18.0
    route_affected_parcel_count: Optional[float] = 180.0
    route_land_area_acres: Optional[float] = 180.0
    route_affected_households: Optional[float] = 250.0
    route_complexity_score: Optional[float] = 3.0
    route_legal_dispute_exposure: Optional[float] = 15.0
    estimated_acquisition_cost_cr: Optional[float] = 2400.0


class PredictResponse(BaseModel):
    delay_probability: float
    risk_score: int
    risk_category: str
    expected_delay_months: float
    expected_delay_days: int
    model_version: str
    confidence_pct: int
    projectId: Optional[str] = None
    overallPct: int
    band: str
    predictedDelayLabel: str
    confidencePct: int
    trend: List[int]
    trendStatus: str
    categories: List[Dict[str, Any]]
    drivers: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    originalCompletionMonths: int
    predictedCompletionMonths: int


class ModelInfoResponse(BaseModel):
    model_version: str
    training_date: str
    total_dataset_records: int
    train_records: int
    test_records: int
    best_classifier: str
    best_regressor: str
    classification_metrics: Dict[str, float]
    regression_metrics: Dict[str, float]
    all_classifiers: Dict[str, Dict[str, float]]
    all_regressors: Dict[str, Dict[str, float]]
    top_feature_importances: Dict[str, float]


class TrainRequest(BaseModel):
    num_records: Optional[int] = 12000
    seed: Optional[int] = 42


class TrainResponse(BaseModel):
    status: str
    message: str
    metrics: Dict[str, Any]
