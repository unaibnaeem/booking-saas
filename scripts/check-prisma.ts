import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

try {
  console.log("Connecting to PostgreSQL through Prisma...");

  const identity = await prisma.$queryRaw<
    Array<{
      current_user: string;
      current_database: string;
      is_superuser: string;
    }>
  >`
    SELECT
      current_user,
      current_database(),
      current_setting('is_superuser') AS is_superuser
  `;

  console.table(identity);

  const [users, organizations, memberships] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.member.count(),
  ]);

  console.log("Authentication table queries successful:");
  console.table([
    { table: "user", count: users },
    { table: "organization", count: organizations },
    { table: "member", count: memberships },
  ]);

  if (
    identity[0]?.current_user !== "bookwise_app" ||
    identity[0]?.current_database !== "bookwise" ||
    identity[0]?.is_superuser !== "off"
  ) {
    throw new Error("Unexpected database connection permissions.");
  }

  console.log("Prisma database verification successful.");
} catch (error) {
  console.error("Prisma database verification failed:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
