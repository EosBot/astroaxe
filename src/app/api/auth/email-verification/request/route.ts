import { createHmac, randomUUID } from "node:crypto";

import { NextRequest } from "next/server";

import { createAccountToken } from "@/lib/auth/account-token";
import { parseServerEnv } from "@/lib/env";
import { VERIFICATION_EMAIL_KIND, VERIFICATION_TEMPLATE_VERSION } from "@/lib/email/template";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isSameOrigin, resolveAccount } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";
import { checkJsonRequest } from "@/lib/security/json-body";

export async function POST(request: NextRequest): Promise<Response> {
  // Corpo sem teto deixa a rota aberta a pedido enorme, e estas respondem
  // sem sessão nenhuma.
  const body = checkJsonRequest(request, 2048);
  if (!body.ok) return apiJson({ error: "Pedido inválido." }, { status: body.status });
  try {
    const env = parseServerEnv();
    if (!isSameOrigin(request, env.SITE_URL))
      return apiJson({ error: "Origem inválida." }, { status: 403 });
    const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
    if (account === null) return apiJson({ error: "Sessão necessária." }, { status: 401 });
    const rateKey = createHmac("sha256", env.AUTH_SESSION_SECRET).update(account.id).digest("hex");
    if (!(await enforceRateLimit(`v1:rate:email-verification:${rateKey}`, 3, 900)))
      return apiJson({ error: "Aguarde antes de pedir outro link." }, { status: 429 });
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: account.id },
      select: { id: true, emailVerifiedAt: true },
    });
    if (user === null) return apiJson({ error: "Sessão necessária." }, { status: 401 });
    if (user.emailVerifiedAt !== null) return apiJson({ message: "Email já confirmado." });

    const now = new Date();
    const tokenId = randomUUID();
    const token = createAccountToken(tokenId, "EMAIL_VERIFICATION", env.AUTH_SESSION_SECRET, now);
    await prisma.$transaction(async (tx) => {
      await tx.accountToken.updateMany({
        where: { userId: user.id, purpose: "EMAIL_VERIFICATION", usedAt: null },
        data: { usedAt: now },
      });
      await tx.accountToken.create({
        data: {
          id: tokenId,
          userId: user.id,
          purpose: "EMAIL_VERIFICATION",
          tokenHash: token.tokenHash,
          expiresAt: token.expiresAt,
        },
      });
      await tx.emailOutbox.create({
        data: {
          userId: user.id,
          accountTokenId: tokenId,
          kind: VERIFICATION_EMAIL_KIND,
          templateVersion: VERIFICATION_TEMPLATE_VERSION,
          idempotencyKey: `email-verification:${tokenId}:${VERIFICATION_TEMPLATE_VERSION}`,
        },
      });
    });
    return apiJson({ message: "Enviamos um novo link de confirmação." }, { status: 202 });
  } catch (error) {
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "email verification request failed",
    );
    return apiJson({ error: "Não foi possível enviar outro link agora." }, { status: 503 });
  }
}
