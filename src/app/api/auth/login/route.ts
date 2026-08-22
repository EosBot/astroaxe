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
import { findGuestSession, GUEST_COOKIE_NAME } from "@/lib/security/guest-session";
import { apiJson } from "@/lib/security/headers";

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
    if (!(await enforceRateLimit(`v1:rate:login:${rateKey}`, 8, 300)))
      return apiJson({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
      select: { id: true, email: true, passwordHash: true },
    });
    if (user === null || !(await verifyPassword(credentials.password, user.passwordHash)))
      return apiJson({ error: "Email ou senha inválidos." }, { status: 401 });
    const guest = await findGuestSession(request, env.GUEST_SESSION_SECRET);
    const claimed =
      guest === null
        ? { count: 0 }
        : await prisma.birthProfile.updateMany({
            where: { guestSessionId: guest.id, userId: null },
            data: { guestSessionId: null, userId: user.id },
          });
    const session = await createAccountSession(user.id, env.AUTH_SESSION_SECRET);
    const response = apiJson({ user: { email: user.email }, claimedProfiles: claimed.count });
    response.headers.append("Set-Cookie", accountCookie(session.token));
    response.headers.append(
      "Set-Cookie",
      `${GUEST_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    );
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
