import type { NextRequest } from "next/server";

import type { EditorialActor } from "@/lib/editorial/contracts";
import { parseServerEnv } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import { resolveAccount } from "@/lib/security/account";
import { resolveEditorialActor } from "@/lib/editorial/authorization";

export async function editorialActorForRequest(
  request: NextRequest,
): Promise<EditorialActor | null> {
  const account = await resolveAccount(request, parseServerEnv().AUTH_SESSION_SECRET);
  if (account === null) return null;
  return resolveEditorialActor(getPrisma(), account.id);
}
