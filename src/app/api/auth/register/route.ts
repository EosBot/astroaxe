import { createHmac, randomUUID } from "node:crypto";

import { Prisma } from "@/generated/prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

import { credentialsSchema } from "@/lib/auth/contracts";
import { parseServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  accountCookie,
  createAccountSession,
  hashPassword,
  isSameOrigin,
} from "@/lib/security/account";
import { findGuestSession, GUEST_COOKIE_NAME } from "@/lib/security/guest-session";
import { apiJson } from "@/lib/security/headers";
import { WELCOME_EMAIL_KIND, WELCOME_TEMPLATE_VERSION } from "@/lib/email/template";
import { createAccountToken } from "@/lib/auth/account-token";

export async function POST(request: NextRequest): Promise<Response> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return apiJson({ error: "Envie os dados como JSON." }, { status: 415 });
  try {
    const env = parseServerEnv();
    if (!isSameOrigin(request, env.SITE_URL))
      return apiJson({ error: "Origem inválida." }, { status: 403 });
    const credentials = credentialsSchema.parse(await request.json());
    const rateKey = createHmac("sha256", env.AUTH_SESSION_SECRET)
      .update(credentials.email)
      .digest("hex");
    if (!(await enforceRateLimit(`v1:rate:register:${rateKey}`, 5, 900)))
      return apiJson({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
    const guest = await findGuestSession(request, env.GUEST_SESSION_SECRET);
    const passwordHash = await hashPassword(credentials.password);
    const now = new Date();
    const prisma = getPrisma();
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: credentials.email, passwordHash },
        select: { id: true, email: true },
      });
      const tokenId = randomUUID();
      const verification = createAccountToken(
        tokenId,
        "EMAIL_VERIFICATION",
        env.AUTH_SESSION_SECRET,
        now,
      );
      await tx.accountToken.create({
        data: {
          id: tokenId,
          userId: user.id,
          purpose: "EMAIL_VERIFICATION",
          tokenHash: verification.tokenHash,
          expiresAt: verification.expiresAt,
        },
      });
      const claimed =
        guest === null
          ? { count: 0 }
          : await tx.birthProfile.updateMany({
              where: { guestSessionId: guest.id, userId: null },
              data: { guestSessionId: null, userId: user.id },
            });
      await tx.emailOutbox.create({
        data: {
          userId: user.id,
          kind: WELCOME_EMAIL_KIND,
          templateVersion: WELCOME_TEMPLATE_VERSION,
          idempotencyKey: `account-welcome:${user.id}:${WELCOME_TEMPLATE_VERSION}`,
          accountTokenId: tokenId,
        },
      });
      return { user, claimedProfiles: claimed.count };
    });
    const session = await createAccountSession(created.user.id, env.AUTH_SESSION_SECRET);
    const response = apiJson(
      { user: { email: created.user.email }, claimedProfiles: created.claimedProfiles },
      { status: 201 },
    );
    response.headers.append("Set-Cookie", accountCookie(session.token));
    response.headers.append(
      "Set-Cookie",
      `${GUEST_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    );
    return response;
  } catch (error) {
    if (error instanceof z.ZodError)
      return apiJson(
        { error: "Use um email válido e uma senha com pelo menos 12 caracteres." },
        { status: 400 },
      );
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      return apiJson(
        { error: "Este email já possui uma conta. Entre para continuar." },
        { status: 409 },
      );
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "registration failed",
    );
    return apiJson({ error: "Não foi possível criar a conta agora." }, { status: 503 });
  }
}
