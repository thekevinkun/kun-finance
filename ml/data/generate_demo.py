"""
Generates 12 months of synthetic transaction data for 3 demo businesses,
each with a distinct cash flow shape (restaurant, salon, contractor).

Output:
  - transactions.json           -> what actually gets seeded into Postgres
  - anomalies_ground_truth.json -> our own answer key, NOT seeded, used later
                                    to check if the anomaly detection model
                                    (Isolation Forest) actually catches what
                                    we planted on purpose

business_id fields here are placeholder slugs (e.g. "restaurant_demo"), not
real UUIDs. seed.ts creates the real Business rows first, gets back their
UUIDs, then swaps these slugs for the real IDs before inserting.

HOW TO RUN IN TERMINAL:
# Check the salon's weekend effect is real — compare a weekday to a weekend
python3 -c "
    import json
    data = json.load(open('transactions.json'))
    salon = [t for t in data if t['business_id'] == 'salon_demo' and t['category'] == 'revenue']
    for t in salon[:10]:
        print(t['date'], t['amount'])
"

# Check the contractor's lumpiness — revenue should be a handful of huge numbers, not steady
python3 -c "
    import json
    data = json.load(open('transactions.json'))
    contractor_rev = [t['amount'] for t in data if t['business_id'] == 'contractor_demo' and t['category'] == 'revenue']
    print('count:', len(contractor_rev))
    print('min:', min(contractor_rev), 'max:', max(contractor_rev))
"

# See the anomalies we planted, clearly labeled
cat anomalies_ground_truth.json | python3 -m json.tool
"""

import random
import json
import os
from datetime import date, timedelta

# Config: the 3 demo businesses #

BUSINESSES = [
    {"slug": "restaurant_demo", "name": "Warung Bu Rayya", "type": "restaurant"},
    {"slug": "salon_demo", "name": "Salon Mamba", "type": "salon"},
    {"slug": "contractor_demo", "name": "CV Bangun Paco", "type": "contractor"},
]

# Salon revenue multiplier per day of week (Python: Monday=0 ... Sunday=6).
# This is what makes the salon's cash flow visibly different from the
# restaurant's — a real weekly cycle, not random noise.
SALON_WEEKDAY_MULTIPLIER = {0: 0.8, 1: 0.8, 2: 1.0, 3: 1.2, 4: 1.6, 5: 2.4, 6: 2.0}


# Shared helper: recurring monthly expenses (rent, payroll, etc.) #


def add_monthly_expense(
    transactions,
    slug,
    start_date,
    end_date,
    target_day,
    jitter_days,
    amount_range,
    category,
    description,
):
    """
    Adds one expense transaction per month, landing near `target_day` of
    the month but shifted by a random amount (the "jitter"). This is what
    makes payroll land on the 23rd one month and the 27th the next,
    instead of suspiciously always the exact same date — real businesses
    don't pay on a perfectly fixed schedule.
    """
    current = date(start_date.year, start_date.month, 1)
    while current <= end_date:
        jitter = random.randint(-jitter_days, jitter_days)
        payment_date = date(current.year, current.month, target_day) + timedelta(
            days=jitter
        )

        if start_date <= payment_date <= end_date:
            transactions.append(
                {
                    "business_id": slug,
                    "date": payment_date.isoformat(),
                    "amount": random.randint(*amount_range),
                    "category": category,
                    "description": description,
                    "type": "expense",
                }
            )

        # Move to the first day of the next month
        current = (
            date(current.year + 1, 1, 1)
            if current.month == 12
            else date(current.year, current.month + 1, 1)
        )


# Archetype 1: Restaurant - Warung Bu Rayya #


def generate_restaurant_transactions(slug, start_date, num_days):
    """
    Daily cash revenue (customers pay every day), boosted on weekends.
    Supplier payments roughly every 2 weeks. Payroll + rent monthly.
    """
    transactions = []
    end_date = start_date + timedelta(days=num_days)

    for i in range(num_days):
        current_date = start_date + timedelta(days=i)
        is_weekend = current_date.weekday() >= 5  # Saturday or Sunday

        base_revenue = 1_800_000
        weekend_boost = 700_000 if is_weekend else 0
        noise = random.randint(-200_000, 200_000)  # day-to-day randomness

        transactions.append(
            {
                "business_id": slug,
                "date": current_date.isoformat(),
                "amount": base_revenue + weekend_boost + noise,
                "category": "revenue",
                "description": "Daily Sales",
                "type": "income",
            }
        )

        # Supplier payment roughly every 14 days (not perfectly regular)
        if i % 14 == 0:
            jitter = random.randint(-2, 2)
            payment_date = current_date + timedelta(days=jitter)
            if start_date <= payment_date <= end_date:
                transactions.append(
                    {
                        "business_id": slug,
                        "date": payment_date.isoformat(),
                        "amount": random.randint(3_000_000, 6_000_000),
                        "category": "supplier",
                        "description": "PT Supplier Utama",
                        "type": "expense",
                    }
                )

    add_monthly_expense(
        transactions,
        slug,
        start_date,
        end_date,
        target_day=25,
        jitter_days=2,
        amount_range=(4_500_000, 5_500_000),
        category="payroll",
        description="Employee Salaries",
    )
    add_monthly_expense(
        transactions,
        slug,
        start_date,
        end_date,
        target_day=5,
        jitter_days=1,
        amount_range=(3_000_000, 3_500_000),
        category="rent",
        description="Sewa Gedung (Rent)",
    )
    add_monthly_expense(
        transactions,
        slug,
        start_date,
        end_date,
        target_day=20,
        jitter_days=1,
        amount_range=(700_000, 1_000_000),
        category="utilities",
        description="PLN (Electricity)",
    )

    return transactions


# Archetype 2: Salon - Salon Mamba #


def generate_salon_transactions(slug, start_date, num_days):
    """
    Revenue driven almost entirely by day-of-week (quiet Mon-Wed, busy
    Fri-Sun). Same monthly fixed costs as restaurant, plus a recurring
    beauty-products supply order.
    """
    transactions = []
    end_date = start_date + timedelta(days=num_days)
    base_revenue = 2_000_000

    for i in range(num_days):
        current_date = start_date + timedelta(days=i)
        multiplier = SALON_WEEKDAY_MULTIPLIER[current_date.weekday()]
        noise = random.randint(-150_000, 150_000)

        transactions.append(
            {
                "business_id": slug,
                "date": current_date.isoformat(),
                "amount": int(base_revenue * multiplier) + noise,
                "category": "revenue",
                "description": "Daily Sales",
                "type": "income",
            }
        )

    add_monthly_expense(
        transactions,
        slug,
        start_date,
        end_date,
        target_day=25,
        jitter_days=2,
        amount_range=(4_000_000, 5_000_000),
        category="payroll",
        description="Employee Salaries",
    )
    add_monthly_expense(
        transactions,
        slug,
        start_date,
        end_date,
        target_day=5,
        jitter_days=1,
        amount_range=(3_000_000, 3_500_000),
        category="rent",
        description="Sewa Gedung (Rent)",
    )
    add_monthly_expense(
        transactions,
        slug,
        start_date,
        end_date,
        target_day=10,
        jitter_days=3,
        amount_range=(1_500_000, 2_500_000),
        category="supplier",
        description="Beauty Products Supplier",
    )
    add_monthly_expense(
        transactions,
        slug,
        start_date,
        end_date,
        target_day=18,
        jitter_days=1,
        amount_range=(500_000, 800_000),
        category="utilities",
        description="PLN (Electricity)",
    )

    return transactions


# Archetype 3: Contractor / Trading - CV Bangun Paco #


def generate_contractor_transactions(slug, start_date, num_days):
    """
    Revenue is lumpy: a handful of large invoice payments per month,
    instead of small daily amounts. Expenses are irregular materials
    purchases plus office rent and occasional equipment buys.
    """
    transactions = []
    end_date = start_date + timedelta(days=num_days)

    # Lumpy invoice income: 1-3 big payments per month, on random days
    current = date(start_date.year, start_date.month, 1)
    while current <= end_date:
        num_invoices = random.randint(1, 3)
        for _ in range(num_invoices):
            day_offset = random.randint(0, 27)
            invoice_date = current + timedelta(days=day_offset)
            if start_date <= invoice_date <= end_date:
                transactions.append(
                    {
                        "business_id": slug,
                        "date": invoice_date.isoformat(),
                        "amount": random.randint(40_000_000, 150_000_000),
                        "category": "revenue",
                        "description": "Client Invoice Payment",
                        "type": "income",
                    }
                )
        current = (
            date(current.year + 1, 1, 1)
            if current.month == 12
            else date(current.year, current.month + 1, 1)
        )

    # Irregular materials purchases, roughly every 3-7 days (not fixed)
    cursor_day = 0
    while cursor_day < num_days:
        purchase_date = start_date + timedelta(days=cursor_day)
        transactions.append(
            {
                "business_id": slug,
                "date": purchase_date.isoformat(),
                "amount": random.randint(500_000, 3_000_000),
                "category": "materials",
                "description": "Building Materials Supplier",
                "type": "expense",
            }
        )
        cursor_day += random.randint(3, 7)  # next purchase 3-7 days later

    # Occasional equipment purchase: ~30% chance each month
    current = date(start_date.year, start_date.month, 1)
    while current <= end_date:
        if random.random() < 0.3:
            day_offset = random.randint(0, 27)
            purchase_date = current + timedelta(days=day_offset)
            if start_date <= purchase_date <= end_date:
                transactions.append(
                    {
                        "business_id": slug,
                        "date": purchase_date.isoformat(),
                        "amount": random.randint(5_000_000, 20_000_000),
                        "category": "equipment",
                        "description": "Tool & Equipment Purchase",
                        "type": "expense",
                    }
                )
        current = (
            date(current.year + 1, 1, 1)
            if current.month == 12
            else date(current.year, current.month + 1, 1)
        )

    add_monthly_expense(
        transactions,
        slug,
        start_date,
        end_date,
        target_day=1,
        jitter_days=2,
        amount_range=(2_000_000, 2_500_000),
        category="rent",
        description="Office Rent",
    )

    return transactions


# Anomaly injection (with a ground-truth answer key) #


def inject_anomalies(transactions, slug):
    """
    Deliberately corrupts a few normal transactions so we have KNOWN
    anomalies to test the Isolation Forest model against later (Phase 4).
    Without ground truth, we'd have no way to tell if the model is any
    good — we'd just be guessing whether its flags look reasonable.
    """
    ground_truth = []
    own_transactions = [t for t in transactions if t["business_id"] == slug]

    # 1. High outlier: take a normal recurring expense and inflate it hard
    spike_candidates = [
        t
        for t in own_transactions
        if t["category"] in ("utilities", "supplier", "materials")
    ]
    if spike_candidates:
        target = random.choice(spike_candidates)
        target["amount"] = int(target["amount"] * random.uniform(4, 6))
        ground_truth.append({**target, "anomaly_type": "high_outlier"})

    # 2. Duplicate charge: same vendor, same amount, same day, charged twice
    expense_candidates = [t for t in own_transactions if t["type"] == "expense"]
    if expense_candidates:
        duplicate = dict(
            random.choice(expense_candidates)
        )  # copy, don't mutate original
        transactions.append(duplicate)
        ground_truth.append({**duplicate, "anomaly_type": "duplicate"})

    # 3. New vendor: a one-off large expense that never appears again
    if own_transactions:
        sample_date = random.choice(own_transactions)["date"]
        new_vendor_txn = {
            "business_id": slug,
            "date": sample_date,
            "amount": random.randint(8_000_000, 15_000_000),
            "category": "other",
            "description": "Unrecognized Vendor XYZ",
            "type": "expense",
        }
        transactions.append(new_vendor_txn)
        ground_truth.append({**new_vendor_txn, "anomaly_type": "new_vendor"})

    return ground_truth


# Orchestration #


def main():
    end_date = date.today()
    start_date = end_date - timedelta(days=360)
    num_days = 360

    generators = {
        "restaurant_demo": generate_restaurant_transactions,
        "salon_demo": generate_salon_transactions,
        "contractor_demo": generate_contractor_transactions,
    }

    all_transactions = []
    all_ground_truth = []

    for slug, generator_fn in generators.items():
        business_transactions = generator_fn(slug, start_date, num_days)
        ground_truth = inject_anomalies(business_transactions, slug)
        all_transactions.extend(business_transactions)
        all_ground_truth.extend(ground_truth)

    all_transactions.sort(
        key=lambda t: t["date"]
    )  # chronological, easier to read/debug

    output_dir = os.path.dirname(__file__)
    with open(os.path.join(output_dir, "transactions.json"), "w") as f:
        json.dump(all_transactions, f, indent=2)

    with open(os.path.join(output_dir, "anomalies_ground_truth.json"), "w") as f:
        json.dump(all_ground_truth, f, indent=2)

    print(
        f"Generated {len(all_transactions)} transactions across {len(generators)} businesses."
    )
    print(
        f"Injected {len(all_ground_truth)} known anomalies -> see anomalies_ground_truth.json"
    )


if __name__ == "__main__":
    main()
