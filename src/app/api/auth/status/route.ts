import { NextRequest } from "next/server";

import { parseServerEnv } from "@/lib/env";
import { resolveAccount } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";

export async function GET(request: NextRequest): Promise<Response> {
  const env = parseServerEnv();
  const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
  return apiJson({ authenticated: account !== null });
}
