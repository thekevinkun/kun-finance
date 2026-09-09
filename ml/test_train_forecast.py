"""
test_train_forecast.py — test of each define functions on train_forecast.py

pytest auto-discovers any file matching test_*.py or *_test.py, and any
function inside it named test_*. No imports or registration needed —
just naming convention.
"""

# a command used to load the built-in os module,
import pytest

# Used for data manipulation, cleaning, and analysis
import pandas as pd

# Import the function we want to test from train.py
from train_forecast import (
    train_models,
    aggregate_daily,
    engineer_features,
    chronological_split,
)


# Test functions for train_forecast.py
def test_train_models_runs_without_error():
    train_models("e2d463a5-0c3d-4d32-ba25-3aa5e3d9de4d")


# Test aggregate_daily function to ensure it correctly sums income and expenses
def test_aggregate_daily_sums_income_and_expenses():
    # Create a sample DataFrame to simulate transaction data
    df = pd.DataFrame(
        [
            {"date": "2024-01-01", "amount": 100, "type": "income"},
            {"date": "2024-01-01", "amount": 50, "type": "income"},
            {"date": "2024-01-01", "amount": 30, "type": "expense"},
            {"date": "2024-01-02", "amount": 200, "type": "income"},
        ]
    )

    # Call the aggregate_daily function with the sample DataFrame
    result = aggregate_daily(df)

    # Check that the result is a DataFrame with the expected columns
    jan1 = result[result["date"] == "2024-01-01"].iloc[0]

    # Assert that the aggregated values are correct
    assert jan1["revenue"] == 150
    assert jan1["expenses"] == 30
    assert jan1["net_cash_flow"] == 120


# Test to check whether aggregate_daily fills in missing calendar dates with zero values
def test_aggregate_daily_fills_missing_calendar_date():
    df = pd.DataFrame(
        [
            {"date": "2024-01-01", "amount": 100, "type": "income"},
            {
                "date": "2024-01-03",
                "amount": 200,
                "type": "income",
            },  # Jan 2 has no transactions
        ]
    )
    result = aggregate_daily(df)
    assert (
        len(result) == 3
    )  # Jan 1, 2, 3 — Jan 2 must appear as a zero row, not be missing
    jan2 = result[result["date"] == "2024-01-02"].iloc[0]
    assert jan2["revenue"] == 0
    assert jan2["net_cash_flow"] == 0


# Test to check whether aggregate_daily handles income-only days correctly
def test_aggregate_daily_handles_income_only():
    df = pd.DataFrame([{"date": "2024-01-01", "amount": 100, "type": "income"}])
    result = aggregate_daily(df)
    assert "expenses" in result.columns
    assert result.iloc[0]["expenses"] == 0


# Test to check whether engineer_features() creates the lag correctly
def test_engineer_features_creates_correct_lag():
    df = pd.DataFrame(
        {
            "date": pd.date_range(
                "2024-01-01", periods=35
            ),  # We need more than 30 days to have some valid lag values
            "revenue": range(
                100, 135
            ),  # Create fake revenue in 35 numbers. Makes the lag easy to verify.
            "expenses": [10]
            * 35,  # Create the number 10, 35 times. Every day has $10 expenses.
            "net_cash_flow": [
                x - 10 for x in range(100, 135)
            ],  # Take every revenue number and subtract 10. Revenue-Expenses.
        }
    )
    result = engineer_features(df)

    # First valid row should be day 31 (index 30) — day 0's revenue is 100
    first_row = result.iloc[0]  # Get only the first row
    assert (
        first_row["revenue_lag_30"] == 100
    )  # Expect the first remaining row's revenue_lag_30 to equal 100.
    assert len(result) == 5  # 35 days - 30 dropped for lag_30


# Test to check whether chronological_split() splits the data correctly
def test_chronological_split_sizes_and_order():
    # Create a sample DataFrame with 100 days of data
    df = pd.DataFrame(
        {
            "date": pd.date_range("2024-01-01", periods=100),
            "net_cash_flow": range(100),
        }
    )

    # Call the chronological_split function with the sample DataFrame
    train, val, test = chronological_split(df)

    # Check the sizes of the splits
    assert len(train) == 72
    assert len(val) == 14
    assert len(test) == 14

    # no overlap, no gaps at the boundaries
    assert train["date"].max() < val["date"].min()
    assert val["date"].max() < test["date"].min()


# Test to check whether chronological_split() raises an error when there are insufficient rows
def test_chronological_split_raises_on_insufficient_rows():
    # Create a sample DataFrame with only 20 days of data, which is insufficient for the required splits
    df = pd.DataFrame(
        {
            "date": pd.date_range("2024-01-01", periods=20),
            "net_cash_flow": range(20),
        }
    )
    # Expect a ValueError to be raised due to insufficient rows for splitting
    with pytest.raises(ValueError):
        chronological_split(df)
