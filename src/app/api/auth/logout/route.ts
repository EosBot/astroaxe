import { NextRequest } from "next/server";

import { parseServerEnv } from "@/lib/env";
import { clearAccountCookie, isSameOrigin, revokeAccountSession } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";

export async function POST(request: NextRequest): Promise<Response> {
  const env = parseServerEnv();
  if (!isSameOrigin(request, env.SITE_URL))
    return apiJson({ error: "Origem inválida." }, { status: 403 });
  await revokeAccountSession(request, env.AUTH_SESSION_SECRET);
  const response = apiJson({ ok: true });
  response.headers.set("Set-Cookie", clearAccountCookie());
  return response;
}
