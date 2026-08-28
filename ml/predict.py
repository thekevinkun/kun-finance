"""
predict.py — Skeleton for running trained models to generate predictions.

Purpose: Will eventually load the .pkl model files train.py produces,
generate a 30-day cash flow forecast, run anomaly detection on historical
transactions, and store both results in PostgreSQL. See Phase 4.
"""

import argparse


def predict(business_id: str):
    print(f"Generating predictions for business: {business_id} (not implemented yet)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate forecasts and anomaly detections"
    )
    parser.add_argument(
        "--business",
        type=str,
        required=True,
        help="Business ID to generate predictions for",
    )
    args = parser.parse_args()

    predict(args.business)
