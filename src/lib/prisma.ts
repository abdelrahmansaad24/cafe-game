import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

import { env } from "@/lib/env";

interface PrismaGlobalSingleton {
  prisma?: PrismaClient;
  pgPool?: Pool;
}

const globalForPrisma = globalThis as unknown as PrismaGlobalSingleton;

function initPrismaSingleton(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString: env.DATABASE_URL,
      max: env.DB_POOL_MAX ?? 1,
      idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT_MS ?? 5000,
      connectionTimeoutMillis: env.DB_POOL_CONNECTION_TIMEOUT_MS ?? 5000,
      allowExitOnIdle: true,
    });

  pool.on("error", (err) => {
    console.error("Unexpected error on idle pg client in pool:", err);
  });

  globalForPrisma.pgPool = pool;

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  // Always bind to globalThis across both dev and prod environments
  globalForPrisma.prisma = client;

  return client;
}

export const prisma = initPrismaSingleton();

