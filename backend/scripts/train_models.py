"""
CLI Script to train and serialize ML models for LandGuard AI.
Usage: python backend/scripts/train_models.py --records 12000
"""

import sys
import os
import argparse
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.ml.train import train_and_evaluate_models


def main():
    parser = argparse.ArgumentParser(description="Train ML models for delay prediction")
    parser.add_argument("--records", type=int, default=12000, help="Number of records if generating dataset")
    parser.add_argument("--seed", type=int, default=42, help="Random seed (default: 42)")
    args = parser.parse_args()

    print("=" * 60)
    print("LANDGUARD AI — ML PREDICTIVE ENGINE TRAINING")
    print("=" * 60)
    metrics = train_and_evaluate_models(num_records=args.records, seed=args.seed, save_artifacts=True)
    
    print("\n--- Training Results ---")
    print(f"Total dataset: {metrics['total_dataset_records']} records (Train: {metrics['train_records']}, Test: {metrics['test_records']})")
    print(f"Best Classifier: {metrics['best_classifier']}")
    print(f"  Accuracy:  {metrics['classification_metrics']['accuracy']*100:.2f}%")
    print(f"  Precision: {metrics['classification_metrics']['precision']*100:.2f}%")
    print(f"  Recall:    {metrics['classification_metrics']['recall']*100:.2f}%")
    print(f"  F1-Score:  {metrics['classification_metrics']['f1']:.4f}")
    print(f"  ROC-AUC:   {metrics['classification_metrics']['roc_auc']:.4f}")
    print(f"Best Regressor:  {metrics['best_regressor']}")
    print(f"  MAE:       {metrics['regression_metrics']['mae']:.4f} months")
    print(f"  RMSE:      {metrics['regression_metrics']['rmse']:.4f} months")
    print(f"  R² Score:  {metrics['regression_metrics']['r2']:.4f}")
    print("=" * 60)


if __name__ == "__main__":
    main()
