import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

export const accountTokenPurposeSchema = z.enum(["EMAIL_VERIFICATION", "PASSWORD_RESET"]);
export type AccountTokenPurpose = z.infer<typeof accountTokenPurposeSchema>;

const tokenSchema = z.string().regex(/^[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/);

const TOKEN_TTL_MS: Record<AccountTokenPurpose, number> = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000,
  PASSWORD_RESET: 30 * 60 * 1000,
};

export function createAccountToken(
  id: string,
  purpose: AccountTokenPurpose,
  secret: string,
  now: Date,
): { token: string; tokenHash: string; expiresAt: Date } {
  const token = formatAccountToken(id, purpose, secret);
  const verifier = token.slice(token.indexOf(".") + 1);
  return {
    token,
    tokenHash: hashVerifier(verifier),
    expiresAt: new Date(now.getTime() + TOKEN_TTL_MS[purpose]),
  };
}

export function formatAccountToken(
  id: string,
  purpose: AccountTokenPurpose,
  secret: string,
): string {
  return `${id}.${deriveVerifier(id, purpose, secret)}`;
}

export function parseAccountToken(
  token: string,
): { id: string; verifier: string; tokenHash: string } | null {
  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) return null;
  const separator = parsed.data.indexOf(".");
  const id = parsed.data.slice(0, separator);
  const verifier = parsed.data.slice(separator + 1);
  return { id, verifier, tokenHash: hashVerifier(verifier) };
}

export function accountTokenMatches(actualHash: string, expectedHash: string): boolean {
  const actual = Buffer.from(actualHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function deriveVerifier(id: string, purpose: AccountTokenPurpose, secret: string): string {
  return createHmac("sha256", secret).update(`${purpose}:${id}`).digest("base64url");
}

function hashVerifier(verifier: string): string {
  return createHash("sha256").update(verifier).digest("hex");
}
