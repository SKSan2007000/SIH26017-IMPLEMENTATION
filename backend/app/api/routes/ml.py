"""
LandGuard AI — ML Engine API Endpoints
Provides direct access to model diagnostics, inference, what-if simulations, and retraining.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from backend.app.schemas.ml import (
    PredictRequest,
    PredictResponse,
    ModelInfoResponse,
    TrainRequest,
    TrainResponse,
)
from backend.app.ml.predict import predict_project_risk, get_or_load_models
from backend.app.ml.train import train_and_evaluate_models
from backend.app.ml.simulate import simulate_what_if_interventions, simulate_combined_what_if


router = APIRouter()


@router.post("/predict", response_model=Dict[str, Any])
def predict_features(request: PredictRequest):
    """
    Direct ML inference endpoint.
    Accepts arbitrary structured project/corridor features and returns
    calibrated delay probability, risk score, expected delay duration, XAI drivers, and recommendations.
    """
    features = request.model_dump(exclude_unset=True)
    return predict_project_risk(features)


@router.get("/model-info", response_model=Dict[str, Any])
def get_model_information():
    """
    Returns active ML model metadata, versioning, training timestamps,
    feature importance rankings, and full validation metrics.
    """
    models = get_or_load_models()
    metrics = models.get("metrics", {})
    if not metrics:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model metrics metadata not loaded.",
        )
    return metrics


@router.post("/train", response_model=Dict[str, Any])
def trigger_model_retraining(req: TrainRequest = TrainRequest()):
    """
    Triggers model retraining against dataset with specified record count and seed.
    Re-evaluates validation metrics and serializes updated model artifacts.
    """
    try:
        metrics = train_and_evaluate_models(
            num_records=req.num_records or 12000,
            seed=req.seed or 42,
            save_artifacts=True,
        )
        return {
            "status": "success",
            "message": f"Retraining completed successfully on {metrics['total_dataset_records']} records.",
            "metrics": metrics,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retraining failed: {str(e)}",
        )


@router.post("/simulate", response_model=Dict[str, Any])
def simulate_policy_scenarios(payload: Dict[str, Any]):
    """
    Simulates policy interventions on a provided feature set without mutating database state.
    """
    features = payload.get("features", {})
    levers = payload.get("lever_ids", payload.get("leverIds", []))
    return simulate_combined_what_if(features, levers)
