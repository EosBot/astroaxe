import { createHmac } from "node:crypto";

import { NextRequest } from "next/server";
import { z } from "zod";

import { changePasswordSchema } from "@/lib/auth/contracts";
import { parseServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  accountCookie,
  hashPassword,
  isSameOrigin,
  replacePasswordAndSessions,
  resolveAccount,
  verifyPassword,
} from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";
import { checkJsonRequest } from "@/lib/security/json-body";

export async function PUT(request: NextRequest): Promise<Response> {
  // Corpo sem teto deixa a rota aberta a pedido enorme, e estas respondem
  // sem sessão nenhuma.
  const body = checkJsonRequest(request, 4096);
  if (!body.ok) return apiJson({ error: "Pedido inválido." }, { status: body.status });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return apiJson({ error: "Envie os dados como JSON." }, { status: 415 });
  try {
    const env = parseServerEnv();
    if (!isSameOrigin(request, env.SITE_URL))
      return apiJson({ error: "Origem inválida." }, { status: 403 });
    const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
    if (account === null) return apiJson({ error: "Sessão necessária." }, { status: 401 });
    const rateKey = createHmac("sha256", env.AUTH_SESSION_SECRET).update(account.id).digest("hex");
    if (!(await enforceRateLimit(`v1:rate:password:${rateKey}`, 5, 900)))
      return apiJson({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
    const payload = changePasswordSchema.parse(await request.json());
    const user = await getPrisma().user.findUnique({
      where: { id: account.id },
      select: { passwordHash: true },
    });
    if (user === null || !(await verifyPassword(payload.currentPassword, user.passwordHash)))
      return apiJson({ error: "Senha atual inválida." }, { status: 401 });
    const passwordHash = await hashPassword(payload.newPassword);
    const session = await replacePasswordAndSessions(
      account.id,
      passwordHash,
      env.AUTH_SESSION_SECRET,
    );
    const response = apiJson({ ok: true });
    response.headers.set("Set-Cookie", accountCookie(session.token));
    return response;
  } catch (error) {
    if (error instanceof z.ZodError)
      return apiJson({ error: "Revise as senhas informadas." }, { status: 400 });
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "password change failed",
    );
    return apiJson({ error: "Não foi possível trocar a senha agora." }, { status: 503 });
  }
}
