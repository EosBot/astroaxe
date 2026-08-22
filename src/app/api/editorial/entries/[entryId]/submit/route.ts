import { NextRequest } from "next/server";
import { z } from "zod";

import { editorialTransitionResponse } from "@/lib/editorial/http";
import { editorialActorForRequest } from "@/lib/editorial/request-actor";
import { submitCulturalEntry } from "@/lib/editorial/workflow";
import { parseServerEnv } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import { isSameOrigin } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ entryId: string }> },
): Promise<Response> {
  if (!isSameOrigin(request, parseServerEnv().SITE_URL))
    return apiJson({ error: "Origem inválida." }, { status: 403 });
  const actor = await editorialActorForRequest(request);
  if (actor === null) return apiJson({ error: "Acesso editorial necessário." }, { status: 403 });
  const entryId = z.uuid().safeParse((await context.params).entryId);
  if (!entryId.success) return apiJson({ error: "Verbete inválido." }, { status: 400 });
  return editorialTransitionResponse(await submitCulturalEntry(getPrisma(), entryId.data, actor));
}
