import { NextRequest } from "next/server";
import { z } from "zod";

import { accountTokenMatches, parseAccountToken } from "@/lib/auth/account-token";
import { accountTokenSchema } from "@/lib/auth/contracts";
import { parseServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma";
import { isSameOrigin } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";
import { checkJsonRequest } from "@/lib/security/json-body";

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
    const { token } = accountTokenSchema.parse(await request.json());
    const parsedToken = parseAccountToken(token);
    if (parsedToken === null) return invalidToken();
    const prisma = getPrisma();
    const now = new Date();
    const stored = await prisma.accountToken.findUnique({ where: { id: parsedToken.id } });
    if (
      stored?.purpose !== "EMAIL_VERIFICATION" ||
      stored.usedAt !== null ||
      stored.expiresAt <= now ||
      !accountTokenMatches(parsedToken.tokenHash, stored.tokenHash)
    )
      return invalidToken();
    const confirmed = await prisma.$transaction(async (tx) => {
      const claimed = await tx.accountToken.updateMany({
        where: { id: stored.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) return false;
      await tx.user.update({
        where: { id: stored.userId },
        data: { emailVerifiedAt: now },
      });
      return true;
    });
    if (!confirmed) return invalidToken();
    return apiJson({ message: "Email confirmado." });
  } catch (error) {
    if (error instanceof z.ZodError) return invalidToken();
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "email verification confirmation failed",
    );
    return apiJson({ error: "Não foi possível confirmar o email agora." }, { status: 503 });
  }
}

function invalidToken(): Response {
  return apiJson({ error: "Este link é inválido, expirou ou já foi usado." }, { status: 400 });
}
