// Prisma client singleton, shared across the app.
// Prisma 7 requires an explicit driver adapter for the database connection.
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const db = new PrismaClient({ adapter });
