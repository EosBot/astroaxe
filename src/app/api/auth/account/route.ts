import { NextRequest } from "next/server";
import { z } from "zod";

import { deleteAccountSchema } from "@/lib/auth/contracts";
import { parseServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma";
import {
  clearAccountCookie,
  isSameOrigin,
  resolveAccount,
  verifyPassword,
} from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";

export async function GET(request: NextRequest): Promise<Response> {
  const env = parseServerEnv();
  const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
  if (account === null) return apiJson({ error: "Sessão necessária." }, { status: 401 });
  const user = await getPrisma().user.findUnique({
    where: { id: account.id },
    select: { email: true, emailVerifiedAt: true },
  });
  if (user === null) return apiJson({ error: "Sessão necessária." }, { status: 401 });
  return apiJson({
    email: user.email,
    emailVerified: user.emailVerifiedAt !== null,
  });
}

export async function DELETE(request: NextRequest): Promise<Response> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return apiJson({ error: "Envie os dados como JSON." }, { status: 415 });
  try {
    const env = parseServerEnv();
    if (!isSameOrigin(request, env.SITE_URL))
      return apiJson({ error: "Origem inválida." }, { status: 403 });
    const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
    if (account === null) return apiJson({ error: "Sessão necessária." }, { status: 401 });
    const payload = deleteAccountSchema.parse(await request.json());
    const user = await getPrisma().user.findUnique({
      where: { id: account.id },
      select: { passwordHash: true },
    });
    if (user === null || !(await verifyPassword(payload.currentPassword, user.passwordHash)))
      return apiJson({ error: "Senha atual inválida." }, { status: 401 });
    await getPrisma().user.delete({ where: { id: account.id } });
    const response = apiJson({ ok: true });
    response.headers.set("Set-Cookie", clearAccountCookie());
    return response;
  } catch (error) {
    if (error instanceof z.ZodError)
      return apiJson({ error: "Digite EXCLUIR e informe sua senha atual." }, { status: 400 });
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "account deletion failed",
    );
    return apiJson({ error: "Não foi possível excluir a conta agora." }, { status: 503 });
  }
}
