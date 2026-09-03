import { z } from "zod";

const booleanString = z
  .union([z.boolean(), z.string()])
  .transform((value) => {
    if (typeof value === "boolean") {
      return value;
    }

    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "off", ""].includes(normalized)) {
      return false;
    }

    throw new Error(`Invalid boolean value: ${value}`);
  });

const developmentFallbacks = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/cafegames?schema=public",
  AUTH_SECRET: "development-auth-secret-1234567890",
  AUTH_PEPPER: "development-pepper-123456",
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().default(developmentFallbacks.DATABASE_URL),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(5).default(1),
  DB_POOL_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1000).default(5_000),
  DB_POOL_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(1000).default(5_000),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).default("gemini-flash-latest"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters.")
    .default(developmentFallbacks.AUTH_SECRET),
  AUTH_PEPPER: z
    .string()
    .min(16, "AUTH_PEPPER must be at least 16 characters.")
    .default(developmentFallbacks.AUTH_PEPPER),
  ENABLE_GOOGLE_OAUTH: booleanString.default(false),
  AUTH_GOOGLE_ID: z.string().min(1, "AUTH_GOOGLE_ID is required.").optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1, "AUTH_GOOGLE_SECRET is required.").optional(),
});

const parsedEnv = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL ?? developmentFallbacks.DATABASE_URL,
  DB_POOL_MAX: process.env.DB_POOL_MAX ?? "1",
  DB_POOL_IDLE_TIMEOUT_MS: process.env.DB_POOL_IDLE_TIMEOUT_MS ?? "5000",
  DB_POOL_CONNECTION_TIMEOUT_MS: process.env.DB_POOL_CONNECTION_TIMEOUT_MS ?? "5000",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-flash-latest",
  AUTH_SECRET:
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : developmentFallbacks.AUTH_SECRET),
  AUTH_PEPPER:
    process.env.AUTH_PEPPER ??
    (process.env.NODE_ENV === "production" ? undefined : developmentFallbacks.AUTH_PEPPER),
  ENABLE_GOOGLE_OAUTH: process.env.ENABLE_GOOGLE_OAUTH ?? "false",
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
});

if (process.env.NODE_ENV === "production") {
  if (!process.env.AUTH_SECRET || !process.env.AUTH_PEPPER) {
    throw new Error(
      "Missing required production env vars: AUTH_SECRET and AUTH_PEPPER. Add them to your deployment environment.",
    );
  }
}

export const env = parsedEnv;
