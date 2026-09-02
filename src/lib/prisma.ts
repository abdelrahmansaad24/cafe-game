import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

const pgPool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: env.DB_POOL_MAX,
    idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: env.DB_POOL_CONNECTION_TIMEOUT_MS,
  });

const adapter = new PrismaPg(pgPool);

// If the in-memory cached prisma instance is missing newly added models, invalidate it
if (
  globalForPrisma.prisma &&
  (!("screwRoom" in globalForPrisma.prisma) ||
    !("unoRoom" in globalForPrisma.prisma) ||
    !("dominoRoom" in globalForPrisma.prisma) ||
    !("bekasaRoom" in globalForPrisma.prisma) ||
    !("blinkRoom" in globalForPrisma.prisma))
) {
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pgPool;
}
