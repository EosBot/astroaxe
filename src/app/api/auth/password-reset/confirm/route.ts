import { NextRequest } from "next/server";
import { z } from "zod";

import { accountTokenMatches, parseAccountToken } from "@/lib/auth/account-token";
import { passwordResetSchema } from "@/lib/auth/contracts";
import { parseServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma";
import {
  accountCookie,
  createAccountSessionMaterial,
  hashPassword,
  isSameOrigin,
} from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";

export async function POST(request: NextRequest): Promise<Response> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return apiJson({ error: "Envie os dados como JSON." }, { status: 415 });
  try {
    const env = parseServerEnv();
    if (!isSameOrigin(request, env.SITE_URL))
      return apiJson({ error: "Origem inválida." }, { status: 403 });
    const input = passwordResetSchema.parse(await request.json());
    const parsedToken = parseAccountToken(input.token);
    if (parsedToken === null) return invalidToken();
    const prisma = getPrisma();
    const now = new Date();
    const stored = await prisma.accountToken.findUnique({ where: { id: parsedToken.id } });
    if (
      stored?.purpose !== "PASSWORD_RESET" ||
      stored.usedAt !== null ||
      stored.expiresAt <= now ||
      !accountTokenMatches(parsedToken.tokenHash, stored.tokenHash)
    )
      return invalidToken();

    const passwordHash = await hashPassword(input.newPassword);
    const session = createAccountSessionMaterial(env.AUTH_SESSION_SECRET, now);
    const consumed = await prisma.$transaction(async (tx) => {
      const claimed = await tx.accountToken.updateMany({
        where: { id: stored.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) return false;
      await tx.user.update({ where: { id: stored.userId }, data: { passwordHash } });
      await tx.accountSession.deleteMany({ where: { userId: stored.userId } });
      await tx.accountSession.create({
        data: {
          userId: stored.userId,
          tokenHash: session.tokenHash,
          expiresAt: session.expiresAt,
        },
      });
      return true;
    });
    if (!consumed) return invalidToken();
    const response = apiJson({ message: "Senha redefinida com segurança." });
    response.headers.set("Set-Cookie", accountCookie(session.token));
    return response;
  } catch (error) {
    if (error instanceof z.ZodError)
      return apiJson(
        { error: "Use um link válido e uma senha com pelo menos 12 caracteres." },
        { status: 400 },
      );
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "password reset confirmation failed",
    );
    return apiJson({ error: "Não foi possível redefinir a senha agora." }, { status: 503 });
  }
}

function invalidToken(): Response {
  return apiJson({ error: "Este link é inválido, expirou ou já foi usado." }, { status: 400 });
}
