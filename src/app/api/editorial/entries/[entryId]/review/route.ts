import { NextRequest } from "next/server";
import { z } from "zod";

import { editorialReviewSchema } from "@/lib/editorial/contracts";
import { editorialTransitionResponse } from "@/lib/editorial/http";
import { editorialActorForRequest } from "@/lib/editorial/request-actor";
import { reviewCulturalEntry } from "@/lib/editorial/workflow";
import { parseServerEnv } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import { isSameOrigin } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ entryId: string }> },
): Promise<Response> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return apiJson({ error: "Envie a revisão como JSON." }, { status: 415 });
  if (!isSameOrigin(request, parseServerEnv().SITE_URL))
    return apiJson({ error: "Origem inválida." }, { status: 403 });
  const actor = await editorialActorForRequest(request);
  if (actor === null) return apiJson({ error: "Acesso editorial necessário." }, { status: 403 });
  const entryId = z.uuid().safeParse((await context.params).entryId);
  if (!entryId.success) return apiJson({ error: "Verbete inválido." }, { status: 400 });
  const review = editorialReviewSchema.safeParse(await request.json());
  if (!review.success) return apiJson({ error: "Revisão inválida." }, { status: 400 });
  return editorialTransitionResponse(
    await reviewCulturalEntry(getPrisma(), entryId.data, actor, review.data, new Date()),
  );
}
