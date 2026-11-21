import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

import { env } from "../env";

const globalForPrisma = globalThis as typeof globalThis & {
  bookwisePrisma?: PrismaClient;
  bookwisePrismaAdapter?: PrismaPg;
};

const adapter =
  globalForPrisma.bookwisePrismaAdapter ??
  new PrismaPg({
    connectionString: env.DATABASE_URL,
  });

export const prisma =
  globalForPrisma.bookwisePrisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.bookwisePrisma = prisma;
  globalForPrisma.bookwisePrismaAdapter = adapter;
}
