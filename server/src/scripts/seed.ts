import fs from "fs";
import path from "path";
import { db } from "../lib/db";
import { hashPassword } from "../lib/bcrypt";
import { User, Business } from "@prisma/client";

// Describes one row from ml/data/transactions.json — NOT a database row.
// Note: business_id is a placeholder slug here, and temp_id only exists
// so we can link anomalies to the exact transaction that spawned it.
type DemoTransaction = {
  business_id: "restaurant_demo" | "salon_demo" | "contractor_demo";
  temp_id: number;
  date: string;
  amount: number;
  category: string;
  description: string;
  type: string;
};

// Describes one row from ml/data/anomalies_ground_truth.json
type DemoAnomaly = {
  temp_id: number;
  anomaly_type: string;
};

// Helper to read and parse JSON files safely.
// <T> lets each call site say exactly what shape it expects back,
// instead of everything downstream being `any`.
const loadJsonFile = <T>(fileName: string): T => {
  const filePath = path.join(__dirname, fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
};

// Delete the old demo data before creating new data
// Idempotency - catch duplicate data by runnin npm run seed twice
const deleteAll = async () => {
  // Only delete users and its business that is in our demo here
  // We don't want to accidentaly delete all users in our db
  await db.user.deleteMany({
    where: {
      email: {
        in: [
          "rhayanasafaelia@gmail.com",
          "blackmamba@gmail.com",
          "pacocorleone@gmail.com",
        ],
      },
    },
  });
};

// Function to SEED USERS
const seedUsers = async (): Promise<User[]> => {
  // Create 3 users
  const collectUsers = [
    {
      email: "rhayanasafaelia@gmail.com",
      passwordHash: await hashPassword("Rayya123"),
      name: "Rayya",
    },
    {
      email: "blackmamba@gmail.com",
      passwordHash: await hashPassword("Mamba123"),
      name: "Mamba",
    },
    {
      email: "pacocorleone@gmail.com",
      passwordHash: await hashPassword("Paco123"),
      name: "Paco",
    },
  ];

  // Create users basket to be append from prisma return
  const users: User[] = [];

  console.log("Seeding Users data...");
  for (const u of collectUsers) {
    const createdUser = await db.user.create({
      data: u,
    });

    // Append to users basket return user from prisma
    users.push(createdUser);
  }

  return users;
};

// Function to SEED BUSINESSES
const seedBusinesses = async (users: User[]): Promise<Business[]> => {
  // Get 3 users separately to pass the possibly undefined
  const rayya = users[0];
  const mamba = users[1];
  const paco = users[2];

  // Ensure that we have 3 users to create businesses
  if (!rayya || !mamba || !paco) {
    throw new Error(
      "Missing users for seeding businesses. Ensure that seedUsers() returns 3 users.",
    );
  }

  // Create 3 business with our seeded users
  const collectBusinesses = [
    { userId: rayya.id, name: "Warung Bu Rayya", type: "restaurant" },
    { userId: mamba.id, name: "Salon Mamba", type: "salon" },
    { userId: paco.id, name: "CV Bangun Paco", type: "contractor" },
  ];

  // Create businesses basket to be append from prisma return
  const businesses: Business[] = [];

  console.log("Seeding Businesses data...");
  for (const b of collectBusinesses) {
    const createdBusiness = await db.business.create({
      data: b,
    });

    // Append to businesses basket return business from prisma
    businesses.push(createdBusiness);
  }

  return businesses;
};

// Turns an anomaly_type into the severity + human-readable explanation
// our Anomaly table actually expects
const describeAnomaly = (anomalyType: string) => {
  switch (anomalyType) {
    case "high_outlier":
      return {
        severity: "high",
        explanation:
          "Amount significantly above historical average for this category.",
      };
    case "duplicate":
      return {
        severity: "medium",
        explanation:
          "Possible duplicate charge — same vendor, amount, and date as another transaction.",
      };
    case "new_vendor":
      return {
        severity: "medium",
        explanation:
          "Payment to a vendor not seen before in this business's history.",
      };
    default:
      return { severity: "low", explanation: "Unusual pattern detected." };
  }
};

// Mapping of business_id from transactions.json to the index of the businesses array
const BUSINESS_MAP: Record<DemoTransaction["business_id"], number> = {
  restaurant_demo: 0,
  salon_demo: 1,
  contractor_demo: 2,
};

// Function to SEED TRANSACTIONS and ANOMALIES
const seedTransactionsAndAnomalies = async (businesses: Business[]) => {
  // Get data from transactions.json by the help of our load helper
  const collectTransactions = loadJsonFile<DemoTransaction[]>(
    "../../../ml/data/transactions.json",
  );

  // Get data from anomalies_ground_truth.json by the help of our load helper
  const collectAnomalies = loadJsonFile<DemoAnomaly[]>(
    "../../../ml/data/anomalies_ground_truth.json",
  );

  console.log("Seeding Transactions and Anomalies data...");
  for (const t of collectTransactions) {
    // Map the business_id from the transaction to the corresponding index in the businesses array
    const businessIndex = BUSINESS_MAP[t.business_id];

    // If the business_id from the transaction doesn't match any known business, skip this transaction
    if (businessIndex === undefined) {
      console.warn(
        `Transaction skipped: Unknown business_id "${t.business_id}"`,
      );
      continue;
    }

    // Strip fields prisma doesn't know
    const { temp_id, business_id, ...transactionData } = t;

    // Create the transaction in the database, linking it to the correct business
    const createdTransaction = await db.transaction.create({
      data: {
        ...transactionData,
        businessId: businesses[businessIndex]!.id,
        date: new Date(t.date),
      },
    });

    // Find the corresponding anomaly for this transaction, if any
    const matchedAnomaly = collectAnomalies.find((a) => a.temp_id === temp_id);

    // If an anomaly is found, describe it and create an entry in the Anomaly table
    if (matchedAnomaly) {
      // Describe the anomaly to get severity and explanation
      const { severity, explanation } = describeAnomaly(
        matchedAnomaly.anomaly_type,
      );

      // Create the anomaly in the database, linking it to the correct business and transaction
      await db.anomaly.create({
        data: {
          businessId: businesses[businessIndex]!.id,
          transactionId: createdTransaction.id,
          anomalyType: matchedAnomaly.anomaly_type,
          severity,
          explanation,
          flaggedAmount: t.amount,
        },
      });
    }
  }
};

// Main function to orchestrate the seeding process
const main = async () => {
  // Delete old demo data first to avoid duplicate
  console.log("Cleaning up database...");
  await deleteAll();

  // Create users first
  const users = await seedUsers();

  // Create businesses by sending collected users
  const businesses = await seedBusinesses(users);

  // Create Transactions and its Anomalies by sending collected businesses
  await seedTransactionsAndAnomalies(businesses);

  // Count transactions and anomalies for log information
  // Only reached if every step above completed without throwing
  const transactionCount = await db.transaction.count();
  const anomalyCount = await db.anomaly.count();

  console.log("✅ Seeding complete!");
  console.log(`   ${users.length} users, ${businesses.length} businesses`);
  console.log(`   ${transactionCount} transactions, ${anomalyCount} anomalies`);
};

// Execute the main function and handle any errors
main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Seeding failed:", error);
    await db.$disconnect();
    process.exit(1);
  });
