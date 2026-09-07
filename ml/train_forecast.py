"""
train.py — Skeleton for the model training pipeline.

Purpose: Will eventually load transaction data, engineer features,
train a Gradient Boosting Regressor (forecasting) and an Isolation Forest
(anomaly detection), then save both as .pkl files. See Phase 4.

Accepts a --business argument so it can be run per-business,
e.g. `python train.py --business demo_restaurant`.
"""

# `argparse` is Python's built-in library for reading command-line flags,
# similar to reading `process.argv` in Node but with structure and validation built in.
import argparse


def train_models(business_id: str):
    # The `: str` here is a type hint — optional in Python, but good practice.
    # Unlike TypeScript, Python does NOT enforce this at runtime; it's purely
    # documentation + editor/linter support (mypy can check it, but plain
    # Python will happily ignore a wrong type).
    print(f"Training models for business: {business_id} (not implemented yet)")
    # f"..." is an f-string — Python's version of a TypeScript template literal `${}`.


if __name__ == "__main__":
    # ArgumentParser reads flags like --business from the command line
    parser = argparse.ArgumentParser(description="Train forecasting and anomaly models")
    parser.add_argument(
        "--business",
        type=str,
        required=True,
        help="Business ID to train models for (e.g. demo_restaurant)",
    )
    args = parser.parse_args()

    train_models(args.business)
