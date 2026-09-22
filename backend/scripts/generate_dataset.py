"""
CLI Script to generate historical synthetic dataset for LandGuard AI ML Engine.
Usage: python backend/scripts/generate_dataset.py --records 12000
"""

import sys
import os
import argparse

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.ml.dataset import generate_historical_dataset


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic land acquisition dataset")
    parser.add_argument("--records", type=int, default=12000, help="Number of cases to generate (default: 12000)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed (default: 42)")
    args = parser.parse_args()

    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    out_csv = os.path.join(backend_dir, "data", "historical_land_acquisitions.csv")

    print(f"Generating {args.records} synthetic land acquisition cases (seed={args.seed})...")
    df = generate_historical_dataset(num_records=args.records, seed=args.seed, save_path=out_csv)
    print(f"Dataset generated successfully! Shape: {df.shape}")
    print(f"Delayed rate: {df['delayed'].mean()*100:.1f}%")
    print(f"Avg delay duration for delayed cases: {df[df['delayed'] == 1]['actual_delay_months'].mean():.2f} months")


if __name__ == "__main__":
    main()
