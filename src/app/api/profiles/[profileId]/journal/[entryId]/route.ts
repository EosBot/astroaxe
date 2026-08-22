import { NextRequest } from "next/server";
import { z } from "zod";

import { parseServerEnv } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import { isSameOrigin, resolveAccount } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";

const paramsSchema = z.object({ profileId: z.uuid(), entryId: z.uuid() });

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ profileId: string; entryId: string }> },
): Promise<Response> {
  const env = parseServerEnv();
  if (!isSameOrigin(request, env.SITE_URL))
    return apiJson({ error: "Origem inválida." }, { status: 403 });
  const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
  if (account === null)
    return apiJson({ error: "Entre para excluir esta reflexão." }, { status: 401 });
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return apiJson({ error: "Reflexão inválida." }, { status: 400 });
  const deleted = await getPrisma().journalEntry.deleteMany({
    where: {
      id: parsed.data.entryId,
      birthProfileId: parsed.data.profileId,
      birthProfile: { userId: account.id },
    },
  });
  if (deleted.count === 0) return apiJson({ error: "Reflexão não encontrada." }, { status: 404 });
  return new Response(null, { status: 204 });
}
