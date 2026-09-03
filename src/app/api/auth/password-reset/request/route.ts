import { createHmac, randomUUID } from "node:crypto";

import { NextRequest } from "next/server";
import { z } from "zod";

import { createAccountToken } from "@/lib/auth/account-token";
import { emailRequestSchema } from "@/lib/auth/contracts";
import { parseServerEnv } from "@/lib/env";
import { PASSWORD_RESET_TEMPLATE_VERSION, RECOVERY_EMAIL_KIND } from "@/lib/email/template";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";
import { checkJsonRequest } from "@/lib/security/json-body";

const GENERIC_MESSAGE = "Se a conta existir, enviaremos as instruções para redefinir a senha.";

export async function POST(request: NextRequest): Promise<Response> {
  // Corpo sem teto deixa a rota aberta a pedido enorme, e estas respondem
  // sem sessão nenhuma.
  const body = checkJsonRequest(request, 2048);
  if (!body.ok) return apiJson({ error: "Pedido inválido." }, { status: body.status });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return apiJson({ error: "Envie os dados como JSON." }, { status: 415 });
  try {
    const env = parseServerEnv();
    if (!isSameOrigin(request, env.SITE_URL))
      return apiJson({ error: "Origem inválida." }, { status: 403 });
    const { email } = emailRequestSchema.parse(await request.json());
    const rateKey = createHmac("sha256", env.AUTH_SESSION_SECRET).update(email).digest("hex");
    if (!(await enforceRateLimit(`v1:rate:password-reset:${rateKey}`, 5, 900)))
      return apiJson({ message: GENERIC_MESSAGE }, { status: 202 });

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (user !== null) {
      const now = new Date();
      const tokenId = randomUUID();
      const token = createAccountToken(tokenId, "PASSWORD_RESET", env.AUTH_SESSION_SECRET, now);
      await prisma.$transaction(async (tx) => {
        await tx.accountToken.updateMany({
          where: { userId: user.id, purpose: "PASSWORD_RESET", usedAt: null },
          data: { usedAt: now },
        });
        await tx.accountToken.create({
          data: {
            id: tokenId,
            userId: user.id,
            purpose: "PASSWORD_RESET",
            tokenHash: token.tokenHash,
            expiresAt: token.expiresAt,
          },
        });
        await tx.emailOutbox.create({
          data: {
            userId: user.id,
            accountTokenId: tokenId,
            kind: RECOVERY_EMAIL_KIND,
            templateVersion: PASSWORD_RESET_TEMPLATE_VERSION,
            idempotencyKey: `password-reset:${tokenId}:${PASSWORD_RESET_TEMPLATE_VERSION}`,
          },
        });
      });
    }
    return apiJson({ message: GENERIC_MESSAGE }, { status: 202 });
  } catch (error) {
    if (error instanceof z.ZodError)
      return apiJson({ error: "Informe um email válido." }, { status: 400 });
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "password reset request failed",
    );
    return apiJson({ error: "Não foi possível processar o pedido agora." }, { status: 503 });
  }
}
