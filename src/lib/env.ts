import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  GUEST_SESSION_SECRET: z.string().min(32),
  AUTH_SESSION_SECRET: z.string().min(32),
  FINGERPRINT_SECRET: z.string().min(32),
  NOMINATIM_USER_AGENT: z.string().min(10),
  SITE_URL: z.url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  return serverEnvSchema.parse(source);
}
