import { createHmac } from "node:crypto";

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
  isSameOrigin,
  verifyPassword,
} from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";
import { checkJsonRequest } from "@/lib/security/json-body";

export async function POST(request: NextRequest): Promise<Response> {
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
    const credentials = credentialsSchema.parse(await request.json());
    const rateKey = createHmac("sha256", env.AUTH_SESSION_SECRET)
      .update(credentials.email)
      .digest("hex");
    if (!(await enforceRateLimit(`v1:rate:login:${rateKey}`, 8, 300)))
      return apiJson({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
      select: { id: true, email: true, passwordHash: true },
    });
    if (user === null || !(await verifyPassword(credentials.password, user.passwordHash)))
      return apiJson({ error: "Email ou senha inválidos." }, { status: 401 });
    const session = await createAccountSession(user.id, env.AUTH_SESSION_SECRET);
    const response = apiJson({ user: { email: user.email } });
    response.headers.append("Set-Cookie", accountCookie(session.token));
    return response;
  } catch (error) {
    if (error instanceof z.ZodError)
      return apiJson({ error: "Revise email e senha." }, { status: 400 });
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "login failed",
    );
    return apiJson({ error: "Não foi possível entrar agora." }, { status: 503 });
  }
}
