"""
Skeleton for generating synthetic demo transaction data.

Purpose: Will eventually create realistic-looking transaction histories
(revenue, payroll, rent, supplier payments) for 3 demo businesses, spanning
12 months, so the ML models below have something to train on.

Right now this is just a skeleton: it runs, prints progress, but doesn't
generate real data yet. That comes in Phase 3 (see progress-tracker.md).
"""


# `def` declares a function — Python's equivalent of TypeScript's `function`.
# No curly braces: Python uses indentation (4 spaces) to define code blocks.
def generate_demo_data():
    # print() is Python's console.log()
    print("Generating demo data... (not implemented yet)")


# This is a Python idiom you'll see constantly: it means
# "only run the code below if this file is executed directly,
# not if it's imported by another file." Similar in spirit to
# checking `require.main === module` in Node.js.
if __name__ == "__main__":
    generate_demo_data()
