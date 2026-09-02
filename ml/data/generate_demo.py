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

# Lets Python roll dice
# Give me a random number between 100 and 200
import random

# Lets Python create JSON files
import json

# Lets Python work with folders/files
import os

# Lets Python understand dates
from datetime import date, timedelta

# Config: the 3 demo businesses
# These are the businesses that exist in our fake world
BUSINESSES = [
    {"slug": "restaurant_demo", "name": "Warung Bu Rayya", "type": "restaurant"},
    {"slug": "salon_demo", "name": "Salon Mamba", "type": "salon"},
    {"slug": "contractor_demo", "name": "CV Bangun Paco", "type": "contractor"},
]

# Salon revenue multiplier per day of week (Python: Monday=0 ... Sunday=6).
# This is what makes the salon's cash flow visibly different from the
# restaurant's — a real weekly cycle, not random noise.
# 0 Monday     → 80% of normal
# 1 Tuesday    → 80%
# 2 Wednesday  → 100%
# 3 Thursday   → 120%
# 4 Friday     → 160%
# 5 Saturday   → 240%
# 6 Sunday     → 200%
SALON_WEEKDAY_MULTIPLIER = {0: 0.8, 1: 0.8, 2: 1.0, 3: 1.2, 4: 1.6, 5: 2.4, 6: 2.0}


# Shared helper: recurring monthly expenses (rent, payroll, etc.)


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

    # Start looking at the first day of the starting month
    current = date(start_date.year, start_date.month, 1)

    # Keep doing this while we haven't reached the end
    while current <= end_date:
        # Let's payroll normally happens on 25th
        # Python rolls the dice: -2, -1, 0, +1, +2
        # But Python might choose: 23rd 24th 25th 26th 27th
        jitter = random.randint(-jitter_days, jitter_days)

        # If target day = 25 and jitter = -2
        # Then 25 - 2 = 23
        # So payroll happens on the 23rd.
        payment_date = date(current.year, current.month, target_day) + timedelta(
            days=jitter
        )

        # Put one transaction into 'transactions' box
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

    # First, give this restaurant an empty basket
    transactions = []

    # Figure out when the simulation ends
    # If start = Jan 1, num_days = 360
    # Then end = about December 27
    end_date = start_date + timedelta(days=num_days)

    # Do this once for every day
    # i is basically, "which day are we currently on?""
    for i in range(num_days):
        # Take the starting date and move forward i days
        # i = 0 → Jan 1
        # i = 1 → Jan 2
        current_date = start_date + timedelta(days=i)

        # Get weekend
        # 5 is Saturday or 6 is Sunday
        is_weekend = current_date.weekday() >= 5

        # Define base revenue
        # Normal day is 1.800.000
        base_revenue = 1_800_000

        # If weekend, add 700.000. Otherwise, none
        weekend_boost = 700_000 if is_weekend else 0

        # day-to-day randomness
        # "Let's make today's sales a little unpredictable."
        # Like: Base:  Rp1.8M
        #       Noise: -Rp100K
        #       Actual: Rp1.7M
        # This is to mimick that businesses aren't perfectly identical every day.
        noise = random.randint(-200_000, 200_000)

        # Create transactions by adding it to basket
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
        # 14 % 14 = 0 = Day 14 🔔
        # 28 % 14 = 0 = Day 28 🔔
        # 42 % 14 = 0 = Day 42 🔔
        # 56 % 14 = 0 = Day 56 🔔
        # "Every 14 days, pay the supplier."
        if i % 14 == 0:
            # Supplier payment gets jitter too
            # Real life isn't perfectly scheduled
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

    # The salon is almost the same machine as the restaurant above
    # But instead of daily (monday 1.8m, tuesday 1.8m ... saturday 2.5m)
    # We uses SALON_WEEKDAY_MULTIPLIER define above
    # Monday
    # Rp2M × 0.8 = Rp1.6M
    # Wednesday
    # Rp2M × 1.0 = Rp2M
    # Friday
    # Rp2M × 1.6 = Rp3.2M
    # Saturday
    # Rp2M × 2.4 = Rp4.8M
    # So the salon has a very visible weekly pattern.
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
    # Different that restaurant, contractor is flow is in big chunks of money
    # For example: each payment is between Rp40M and Rp150M
    # The contractor might get:
    # Jan 5   +Rp80M
    # Jan 21  +Rp120M
    # Feb 10  +Rp50M
    # Mar 3   +Rp140M
    # Mar 28  +Rp70M
    current = date(start_date.year, start_date.month, 1)
    while current <= end_date:
        # This month, randomly have 1–3 big customer payments.
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

    # Contractor expenses
    # Irregular materials purchases, roughly every 3-7 days (not fixed)

    # Start day from 0
    cursor_day = 0

    # Keep buying materials until the year is over.
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
        cursor_day += random.randint(
            3, 7
        )  # After buying something, wait 3–7 days before buying again

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
        # Let's say Electricity = Rp800K
        # Python chooses one transaction
        target = random.choice(spike_candidates)

        # Then multiply it by somewhere between 4× and 6×
        # So, Rp800K × 5 =Rp4M 🚨
        # This transaction is fake and abnormal
        target["amount"] = int(target["amount"] * random.uniform(4, 6))
        ground_truth.append({**target, "anomaly_type": "high_outlier"})

    # 2. Duplicate charge: same vendor, same amount, same day, charged twice
    # Python picks a normal expense
    # Aug 15 | Supplier | Rp5m
    expense_candidates = [t for t in own_transactions if t["type"] == "expense"]

    # Then makes a copy and adds the copy
    # Now:
    # Aug 15   Supplier   Rp5M
    # Aug 15   Supplier   Rp5M  🚨
    # "Why did this business pay the same thing twice?"
    if expense_candidates:
        duplicate = dict(
            random.choice(expense_candidates)
        )  # copy, don't mutate original
        transactions.append(duplicate)
        ground_truth.append({**duplicate, "anomaly_type": "duplicate"})

    # 3. New vendor: a one-off large expense that never appears again
    # Python creates mysterious vendor
    # Unrecognized Vendor XYZ with 8M–15M
    # IT creates like "Hey! Something you've never seen before suddenly took a lot of money."
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

    # ground_truth behave as the answer sheet
    # We save fake-weird-anomaly information in it
    # Then later we compare
    # AI's guess vs ground_truth (the answer sheet)
    # to see whether the AI was correct.
    return ground_truth


# Orchestration #


def main():
    # Generate the last 360 days of history.
    end_date = date.today()
    start_date = end_date - timedelta(days=360)
    num_days = 360

    # Dicitionary of machines we define above
    generators = {
        "restaurant_demo": generate_restaurant_transactions,
        "salon_demo": generate_salon_transactions,
        "contractor_demo": generate_contractor_transactions,
    }

    all_transactions = []
    all_ground_truth = []

    # Go through every business.
    for slug, generator_fn in generators.items():
        # generator_fn means: "Whichever generator belongs to this business."
        # So like when we're processing: restaurant_demo
        # Python effectively does: generate_restaurant_transactions
        business_transactions = generator_fn(slug, start_date, num_days)
        ground_truth = inject_anomalies(business_transactions, slug)
        all_transactions.extend(business_transactions)
        all_ground_truth.extend(ground_truth)

    # Sorted in chronological, easier to read/debug
    all_transactions.sort(key=lambda t: t["date"])

    # Take all our fake transactions and put them into transactions.json.
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
