"""
train_forecast.py — Data preparation pipeline for cash flow forecasting.

Purpose: Load per-transaction data, aggregate into daily revenue/expenses/
net_cash_flow, engineer time-series features (day-of-week, day-of-month,
lag features), and split chronologically into train/validation/test sets.
Model training (Gradient Boosting Regressor) is not yet implemented — see
Phase 4 checklist in progress-tracker.md.

Accepts a --business argument so it can be run per-business,
e.g. `python train_forecast.py --business demo_restaurant`.
"""

# a command used to load the built-in os module,
# which allows your Python script to interact directly with the underlying operating system
import os

# `argparse` is Python's built-in library for reading command-line flags,
# similar to reading `process.argv` in Node but with structure and validation built in.
import argparse

# Industry standard for managing configurations and protecting sensitive credentials like API keys
from dotenv import load_dotenv

# Used for data manipulation, cleaning, and analysis before model training
import pandas as pd

# Open-source database toolkit and Object-Relational Mapper (ORM) for Python
# It allows to interact with relational databases (like PostgreSQL) using Python code instead of writing raw SQL
from sqlalchemy import create_engine, text

## 1. Load env + connect to DB

# Load the environment variables from the .env file
load_dotenv()


# Create a SQLAlchemy engine to connect to the database
def get_engine():
    """Create a SQLAlchemy engine on demand, not at import time.

    Keeping this lazy means importing this module — which pytest does just to
    discover tests — never requires DATABASE_URL to exist. The engine is only
    built when something that actually needs the DB (query_transactions) runs.
    """
    db_url = os.getenv("DATABASE_URL")
    if db_url is None:
        raise RuntimeError("DATABASE_URL is not set — check your .env file")
    return create_engine(db_url)


## 2. query_transactions(business_id) -> raw per-transaction rows
def query_transactions(business_id: str):
    # Connect to the database
    engine = get_engine()

    # Define the raw SQL query with parameterized placholder
    query = text("""
        SELECT date, amount, type 
        FROM transactions 
        WHERE business_id = :business_id
    """)

    # Execute and fetch all raw rows
    with engine.connect() as connection:
        result = connection.execute(query, {"business_id": business_id})

        # Return a list of Row objects by converting it first from list of Dict
        return [dict(row._mapping) for row in result]


## 3. aggregate_daily to sum income - expenses to find net cash flow
def aggregate_daily(df: pd.DataFrame):
    # Convert the 'date' column to datetime format
    df["date"] = pd.to_datetime(df["date"])

    # get transacation by day with income-expenses (Jan1/Jan2)
    # group by business_id and date, sum income and expense separately
    # turn type of income and expense into individual column
    summary = df.groupby(["date", "type"])["amount"].sum().unstack(fill_value=0)

    # print("Summary GROUP BY: ", summary)

    # Create complete date range from min to max date in the DataFrame
    full_date_range = pd.date_range(
        start=summary.index.min(), end=summary.index.max(), freq="D"
    )

    # Fill missing dates with 0 for income and expense
    summary = summary.reindex(full_date_range, fill_value=0)

    # Set the date column as the index
    # This because pd.date_range(...) produces an index with no .name
    summary.index.name = "date"

    # Makes sure income + expense columns exist even if they were not present in the original data
    if "income" not in summary.columns:
        summary["income"] = 0
    if "expense" not in summary.columns:
        summary["expense"] = 0

    # Add and calculate net cash flow
    # Give the income as revenue column substract by expense as expenses column
    # If it doesn't exist, use 0.
    summary["net_cash_flow"] = summary.get("income", 0) - summary.get("expense", 0)
    summary = summary.rename(columns={"income": "revenue", "expense": "expenses"})

    # tidies up the stray "type" label pandas leaves on the column index
    summary.columns.name = None

    # print("Summary NET CASH FLOW: ", summary)

    # Turn date back into normal column
    summary = summary.reset_index()

    # print("Summary RESET DATE: ", summary)

    return summary


## 4. engineer_features(df) -> day_of_week, day_of_month, lag_7, lag_30, etc.
def engineer_features(df: pd.DataFrame):
    # before conversion — likely 'object'
    # print(df["date"].dtype)

    # Convert the 'date' column to datetime format
    df["date"] = pd.to_datetime(df["date"])

    # after — 'datetime64[ns]'
    # print(df["date"].dtype)

    # Sort the DataFrame by date
    df = df.sort_values("date")

    # print("Data AFTER SORT BY DATE: ", df)

    # Create lag features for 7 and 30 days of revenue
    df["revenue_lag_7"] = df["revenue"].shift(7)
    df["revenue_lag_30"] = df["revenue"].shift(30)

    # Create lag features for 7 and 30 days of expenses
    df["expenses_lag_7"] = df["expenses"].shift(7)
    df["expenses_lag_30"] = df["expenses"].shift(30)

    # Create lag features for 7 and 30 days of net_cash_flow
    df["net_cash_flow_lag_7"] = df["net_cash_flow"].shift(7)
    df["net_cash_flow_lag_30"] = df["net_cash_flow"].shift(30)

    # print("Data AFTER CREATE LAGS: ", df)

    # Create day of week and day of month features
    df["day_of_week"] = df["date"].dt.dayofweek
    df["day_of_month"] = df["date"].dt.day

    # print("Data AFTER CREATE WEEK AND DAY of MONTH: ", df)

    # Drop rows with NaN values (first 30 days will have NaN in lag features)
    df = df.dropna()

    # print("Data AFTER DROP NaN: ", df)

    return df


## 5. chronological_split(df) -> train / val / test
# Train = everything before the validation window
# Validation = the 14 days immediately before the test
# Test = the most recent 14 days
def chronological_split(df: pd.DataFrame):
    # Convert date to datetime and sort by date first
    # Doing it again after engineer_features to protect the sort by itself
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")

    # Define split days
    test_days = 14

    # Calculate the indices for splitting
    total_len = len(df)  # Get the len of usable days
    # print("Total len: ", total_len)

    # Check if there are enough rows to split into train, validation, and test sets
    # both holdout windows + at least 1 row to train on
    min_required = test_days * 2 + 1
    if total_len < min_required:
        raise ValueError(
            f"Not enough rows to split: {total_len} available, "
            f"{min_required} required for {test_days}-day validation and test windows."
        )

    train_end = (
        total_len - test_days * 2
    )  # eg. 330 usable days. 330 - 14*2 = train end at day/row 302
    val_end = (
        train_end + test_days
    )  # eg. start at row 302 of train_end, move 14 days/rows. 302 + 14 = at rows 316

    # Slice the data chronologically
    train_df = df.iloc[:train_end]
    val_df = df.iloc[train_end:val_end]
    test_df = df.iloc[val_end:]

    # Print the sizes of the splits for verification
    # print(f"Train: {len(train_df)} | Val: {len(val_df)} | Test: {len(test_df)}")

    # Check that the splits are in chronological order
    # print("Train dates:", train_df["date"].min(), "to", train_df["date"].max())
    # print("Val dates:", val_df["date"].min(), "to", val_df["date"].max())
    # print("Test dates:", test_df["date"].min(), "to", test_df["date"].max())

    return train_df, val_df, test_df


## 6. train models
def train_models(business_id: str):
    # Minimum number of days required to train the model, including:
    # 30 days for lag warmup, 28 days for validation/test holdouts,
    # and a usable training window of at least 32 days (to have enough data to train the model)
    MIN_DAYS_REQUIRED = 90

    # Get the transactions of the business
    transactions = query_transactions(business_id)
    # print("Transactions: ", transactions)

    # Convert list of dictionaries first to DataFrame for Pandas work
    transactions_df = pd.DataFrame(transactions)

    # Get the daily aggregates of the transactions
    aggregate_transactions = aggregate_daily(transactions_df)
    # print("Aggregate: ", aggregate_transactions)

    # Check whether enough data exists to create lag features
    if len(aggregate_transactions) < MIN_DAYS_REQUIRED:
        raise ValueError(
            f"Not enough data to train business {business_id}: "
            f"{len(aggregate_transactions)} days available, {MIN_DAYS_REQUIRED} required "
            f"(30 for lag warmup + 28 for validation/test holdouts + a usable training window)."
        )

    # Engineer features (lags, day-of-week, day-of-month)
    transactions_features = engineer_features(aggregate_transactions)

    # Split the data into train, validation, and test sets
    train, val, test = chronological_split(transactions_features)


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
