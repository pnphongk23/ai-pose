import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_PATH: z.string().min(1),
  ADMIN_SECRET: z.string().min(1),
  COMMUNITY_UPLOAD_DIR: z.string().min(1).default("data/community"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10)
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(overrides?: Record<string, string | undefined>): AppEnv {
  if (!overrides && cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse({
    NODE_ENV: overrides?.NODE_ENV ?? process.env.NODE_ENV,
    PORT: overrides?.PORT ?? process.env.PORT,
    DATABASE_PATH: overrides?.DATABASE_PATH ?? process.env.DATABASE_PATH,
    ADMIN_SECRET: overrides?.ADMIN_SECRET ?? process.env.ADMIN_SECRET,
    COMMUNITY_UPLOAD_DIR: overrides?.COMMUNITY_UPLOAD_DIR ?? process.env.COMMUNITY_UPLOAD_DIR,
    RATE_LIMIT_WINDOW_MS: overrides?.RATE_LIMIT_WINDOW_MS ?? process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX: overrides?.RATE_LIMIT_MAX ?? process.env.RATE_LIMIT_MAX
  });

  if (!parsed.success) {
    const errors = parsed.error.issues.map((item) => `${item.path.join(".")}: ${item.message}`);
    throw new Error(`Invalid environment variables:\n${errors.join("\n")}`);
  }

  if (!overrides) {
    cachedEnv = parsed.data;
  }

  return parsed.data;
}

export function resetEnvCache(): void {
  cachedEnv = null;
}
