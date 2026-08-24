import { z } from "zod";

import { materializeSecretFiles } from "./config/read-secret";

const SECRET_ENVIRONMENT_VARIABLES = [
  "DATABASE_URL",
  "REDIS_URL",
  "GUEST_SESSION_SECRET",
  "AUTH_SESSION_SECRET",
  "FINGERPRINT_SECRET",
  "SMTP_PASSWORD",
] as const;

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
  return serverEnvSchema.parse(materializeSecretFiles(source, SECRET_ENVIRONMENT_VARIABLES));
}

const emailEnvSchema = z
  .object({
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535),
    SMTP_SECURE: z.enum(["true", "false"]).transform((value) => value === "true"),
    SMTP_USER: emptyStringAsUndefined(z.string().min(1).optional()),
    SMTP_PASSWORD: emptyStringAsUndefined(z.string().min(1).optional()),
    EMAIL_FROM: z.email(),
    EMAIL_FROM_NAME: z.string().min(1).max(100).default("AstroAxe"),
  })
  .refine((env) => Boolean(env.SMTP_USER) === Boolean(env.SMTP_PASSWORD), {
    message: "SMTP_USER and SMTP_PASSWORD must be configured together",
  });

export type EmailEnv = z.infer<typeof emailEnvSchema>;

export function parseEmailEnv(source: NodeJS.ProcessEnv = process.env): EmailEnv {
  return emailEnvSchema.parse(materializeSecretFiles(source, SECRET_ENVIRONMENT_VARIABLES));
}

function emptyStringAsUndefined<T extends z.ZodType>(schema: T) {
  return z.preprocess((value) => (value === "" ? undefined : value), schema);
}
