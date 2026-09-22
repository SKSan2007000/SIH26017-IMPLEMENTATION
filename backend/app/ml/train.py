"""
LandGuard AI — Model Training, Evaluation, and Serialization Pipeline
Trains Random Forest Classifier (Delay Prediction) and Random Forest Regressor (Delay Duration),
evaluates performance metrics, and saves production artifacts.
"""

import os
import json
import joblib
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)

from backend.app.ml.dataset import generate_historical_dataset
from backend.app.ml.preprocess import (
    create_preprocessor_pipeline,
    ALL_FEATURE_COLUMNS,
    NUMERICAL_FEATURES,
    CATEGORICAL_FEATURES,
)


def get_model_storage_dir() -> str:
    """Returns absolute path to backend/ml/models directory."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
    model_dir = os.path.join(backend_dir, "ml", "models")
    os.makedirs(model_dir, exist_ok=True)
    return model_dir


def train_and_evaluate_models(
    df: Optional[pd.DataFrame] = None,
    num_records: int = 12000,
    seed: int = 42,
    save_artifacts: bool = True,
) -> Dict[str, Any]:
    """
    Complete end-to-end training and validation workflow.
    """
    if df is None:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
        data_path = os.path.join(backend_dir, "data", "historical_land_acquisitions.csv")
        if os.path.exists(data_path):
            print(f"Loading existing historical dataset from {data_path}...")
            df = pd.read_csv(data_path)
        else:
            print(f"Generating synthetic dataset with {num_records} records...")
            df = generate_historical_dataset(num_records=num_records, seed=seed, save_path=data_path)

    X = df[ALL_FEATURE_COLUMNS]
    y_class = df["delayed"]
    y_reg = df["actual_delay_months"]

    # 1. Train / Test Split (Stratified on classification target)
    X_train, X_test, y_train_cls, y_test_cls, y_train_reg, y_test_reg = train_test_split(
        X, y_class, y_reg, test_size=0.20, random_state=seed, stratify=y_class
    )

    # 2. Fit Preprocessing Pipeline ONLY on training fold
    print("Fitting preprocessing pipeline...")
    preprocessor = create_preprocessor_pipeline()
    X_train_trans = preprocessor.fit_transform(X_train)
    X_test_trans = preprocessor.transform(X_test)

    # Extract transformed feature names for explainability
    cat_encoder = preprocessor.named_transformers_["cat"].named_steps["encoder"]
    encoded_cat_names = list(cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES))
    all_transformed_feature_names = NUMERICAL_FEATURES + encoded_cat_names

    # 3. Train & Compare Classification Models
    print("Training candidate classification models...")
    candidate_classifiers = {
        "RandomForestClassifier": RandomForestClassifier(
            n_estimators=100, max_depth=12, min_samples_split=5, random_state=seed, n_jobs=-1
        ),
        "GradientBoostingClassifier": GradientBoostingClassifier(
            n_estimators=100, max_depth=5, random_state=seed
        ),
        "LogisticRegression": LogisticRegression(
            max_iter=1000, random_state=seed
        ),
    }

    best_clf_name = "RandomForestClassifier"
    best_clf = candidate_classifiers[best_clf_name]
    best_clf_score = 0.0
    clf_eval_results = {}

    for name, clf in candidate_classifiers.items():
        clf.fit(X_train_trans, y_train_cls)
        y_pred = clf.predict(X_test_trans)
        y_prob = clf.predict_proba(X_test_trans)[:, 1] if hasattr(clf, "predict_proba") else y_pred

        acc = float(accuracy_score(y_test_cls, y_pred))
        prec = float(precision_score(y_test_cls, y_pred, zero_division=0))
        rec = float(recall_score(y_test_cls, y_pred, zero_division=0))
        f1 = float(f1_score(y_test_cls, y_pred, zero_division=0))
        auc = float(roc_auc_score(y_test_cls, y_prob))

        clf_eval_results[name] = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
            "roc_auc": round(auc, 4),
        }

    # Select RandomForest as primary baseline model per specification
    best_clf_name = "RandomForestClassifier"
    best_clf = candidate_classifiers[best_clf_name]
    best_clf_score = clf_eval_results[best_clf_name]["roc_auc"]
    print(f"Selected production classifier: {best_clf_name} (ROC-AUC: {best_clf_score:.4f}, Accuracy: {clf_eval_results[best_clf_name]['accuracy']*100:.2f}%)")

    # 4. Train & Compare Regression Models for Delay Duration
    print("Training candidate regression models...")
    candidate_regressors = {
        "RandomForestRegressor": RandomForestRegressor(
            n_estimators=100, max_depth=12, random_state=seed, n_jobs=-1
        ),
        "GradientBoostingRegressor": GradientBoostingRegressor(
            n_estimators=100, max_depth=5, random_state=seed
        ),
    }

    best_reg_name = "RandomForestRegressor"
    best_reg = candidate_regressors[best_reg_name]
    reg_eval_results = {}

    for name, reg in candidate_regressors.items():
        reg.fit(X_train_trans, y_train_reg)
        y_reg_pred = np.clip(reg.predict(X_test_trans), 0.0, 36.0)

        mae = float(mean_absolute_error(y_test_reg, y_reg_pred))
        mse = float(mean_squared_error(y_test_reg, y_reg_pred))
        rmse = float(np.sqrt(mse))
        r2 = float(r2_score(y_test_reg, y_reg_pred))

        reg_eval_results[name] = {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "r2": round(r2, 4),
        }

    print(f"Selected production regressor: {best_reg_name} (MAE: {reg_eval_results[best_reg_name]['mae']:.4f} mo, RMSE: {reg_eval_results[best_reg_name]['rmse']:.4f} mo, R²: {reg_eval_results[best_reg_name]['r2']:.4f})")

    # 5. Extract Feature Importances for Global XAI
    if hasattr(best_clf, "feature_importances_"):
        raw_importances = best_clf.feature_importances_
        feature_importance_dict = {
            name: round(float(imp), 5) for name, imp in zip(all_transformed_feature_names, raw_importances)
        }
        # Sort descending
        feature_importance_dict = dict(sorted(feature_importance_dict.items(), key=lambda x: x[1], reverse=True))
    else:
        feature_importance_dict = {}

    # 6. Assemble Metrics & Metadata Report
    metrics_summary = {
        "model_version": "1.0.0-rf",
        "training_date": datetime.now(timezone.utc).isoformat(),
        "total_dataset_records": len(df),
        "train_records": len(X_train),
        "test_records": len(X_test),
        "best_classifier": best_clf_name,
        "best_regressor": best_reg_name,
        "classification_metrics": clf_eval_results[best_clf_name],
        "regression_metrics": reg_eval_results[best_reg_name],
        "all_classifiers": clf_eval_results,
        "all_regressors": reg_eval_results,
        "top_feature_importances": dict(list(feature_importance_dict.items())[:10]),
    }

    # 7. Serialize Artifacts
    if save_artifacts:
        model_dir = get_model_storage_dir()
        joblib.dump(best_clf, os.path.join(model_dir, "classifier.joblib"))
        joblib.dump(best_reg, os.path.join(model_dir, "regressor.joblib"))
        joblib.dump(preprocessor, os.path.join(model_dir, "preprocessor.joblib"))

        with open(os.path.join(model_dir, "feature_names.json"), "w") as f:
            json.dump({
                "numerical_features": NUMERICAL_FEATURES,
                "categorical_features": CATEGORICAL_FEATURES,
                "transformed_feature_names": all_transformed_feature_names,
            }, f, indent=2)

        with open(os.path.join(model_dir, "metrics.json"), "w") as f:
            json.dump(metrics_summary, f, indent=2)

        print(f"Model artifacts and evaluation metrics saved to {model_dir}")

    return metrics_summary


if __name__ == "__main__":
    train_and_evaluate_models(num_records=12000, seed=42)
