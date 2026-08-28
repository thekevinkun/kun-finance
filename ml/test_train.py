"""
test_train.py — Sanity-check test to confirm pytest is wired up correctly.

pytest auto-discovers any file matching test_*.py or *_test.py, and any
function inside it named test_*. No imports or registration needed —
just naming convention.
"""

# Import the function we want to test from train.py
from train import train_models


def test_train_models_runs_without_error():
    # Since train_models() currently just prints a message (no real logic yet),
    # this test only confirms it CAN be called without throwing an exception.
    # We'll expand this once train_models() actually does something to assert on.
    train_models("demo_restaurant")
    # No assert needed yet — if the line above didn't raise, the test passes.
    # A bare function call with no assertion is a weak test, but appropriate
    # for a skeleton function with no real behavior yet.
