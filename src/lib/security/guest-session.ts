import { createHmac, randomBytes } from "node:crypto";

import type { NextRequest } from "next/server";

import { getPrisma } from "@/lib/prisma";

export const GUEST_COOKIE_NAME = "astroaxe_guest";
const SESSION_DAYS = 1;

function tokenHash(token: string, secret: string): string {
  return createHmac("sha256", secret).update(token).digest("hex");
}

export async function findGuestSession(
  request: NextRequest,
  secret: string,
): Promise<{ id: string } | null> {
  const currentToken = request.cookies.get(GUEST_COOKIE_NAME)?.value;
  if (currentToken === undefined) return null;
  return getPrisma().guestSession.findFirst({
    where: { tokenHash: tokenHash(currentToken, secret), expiresAt: { gt: new Date() } },
    select: { id: true },
  });
}

export async function resolveGuestSession(
  request: NextRequest,
  secret: string,
): Promise<{ id: string; newToken?: string }> {
  const prisma = getPrisma();
  const current = await findGuestSession(request, secret);
  if (current !== null) return current;

  const newToken = randomBytes(32).toString("base64url");
  const session = await prisma.guestSession.create({
    data: {
      tokenHash: tokenHash(newToken, secret),
      expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
    },
    select: { id: true },
  });
  return { ...session, newToken };
}

export function guestCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${GUEST_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}${secure}`;
}
