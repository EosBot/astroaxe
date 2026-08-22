import { createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import type { NextRequest } from "next/server";

import { getPrisma } from "@/lib/prisma";

export const ACCOUNT_COOKIE_NAME = "astroaxe_session";
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const SCRYPT_KEY_LENGTH = 64;
const scrypt = promisify(nodeScrypt);

function tokenHash(token: string, secret: string): string {
  return createHmac("sha256", secret).update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, saltText, expectedText] = stored.split("$");
  if (algorithm !== "scrypt" || saltText === undefined || expectedText === undefined) return false;
  try {
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(expectedText, "base64url");
    if (salt.length !== 16 || expected.length !== SCRYPT_KEY_LENGTH) return false;
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function createAccountSession(
  userId: string,
  secret: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
  await getPrisma().accountSession.create({
    data: { userId, tokenHash: tokenHash(token, secret), expiresAt },
  });
  return { token, expiresAt };
}

export async function replacePasswordAndSessions(
  userId: string,
  passwordHash: string,
  secret: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
  await getPrisma().$transaction([
    getPrisma().user.update({ where: { id: userId }, data: { passwordHash } }),
    getPrisma().accountSession.deleteMany({ where: { userId } }),
    getPrisma().accountSession.create({
      data: { userId, tokenHash: tokenHash(token, secret), expiresAt },
    }),
  ]);
  return { token, expiresAt };
}

export async function resolveAccount(
  request: NextRequest,
  secret: string,
): Promise<{ id: string; email: string } | null> {
  const token = request.cookies.get(ACCOUNT_COOKIE_NAME)?.value;
  if (token === undefined) return null;
  const session = await getPrisma().accountSession.findFirst({
    where: { tokenHash: tokenHash(token, secret), expiresAt: { gt: new Date() } },
    select: { user: { select: { id: true, email: true } } },
  });
  return session?.user ?? null;
}

export async function revokeAccountSession(request: NextRequest, secret: string): Promise<void> {
  const token = request.cookies.get(ACCOUNT_COOKIE_NAME)?.value;
  if (token === undefined) return;
  await getPrisma().accountSession.deleteMany({ where: { tokenHash: tokenHash(token, secret) } });
}

export function accountCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ACCOUNT_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure}`;
}

export function clearAccountCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ACCOUNT_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function isSameOrigin(request: NextRequest, siteUrl: string): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return true;
  return origin === new URL(siteUrl).origin;
}
