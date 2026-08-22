import { Prisma } from "@/generated/prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

import { createCulturalEntrySchema } from "@/lib/editorial/contracts";
import { editorialActorForRequest } from "@/lib/editorial/request-actor";
import { parseServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma";
import { isSameOrigin } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";

export async function POST(request: NextRequest): Promise<Response> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return apiJson({ error: "Envie os dados como JSON." }, { status: 415 });
  if (!isSameOrigin(request, parseServerEnv().SITE_URL))
    return apiJson({ error: "Origem inválida." }, { status: 403 });
  const actor = await editorialActorForRequest(request);
  if (actor === null || actor.role === "REVIEWER")
    return apiJson({ error: "Permissão de autoria necessária." }, { status: 403 });

  try {
    const { claims, ...input } = createCulturalEntrySchema.parse(await request.json());
    const entry = await getPrisma().culturalEntry.create({
      data: {
        ...input,
        authorId: actor.id,
        claims: {
          create: claims.map((claim) => ({ ...claim, sourceLocator: claim.sourceLocator ?? null })),
        },
      },
      select: { id: true, slug: true, version: true, status: true },
    });
    return apiJson(entry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError)
      return apiJson({ error: "Revise o verbete e suas claims." }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      return apiJson({ error: "Esta versão do verbete já existe." }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003")
      return apiJson({ error: "Uma das fontes não existe." }, { status: 400 });
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "cultural entry creation failed",
    );
    return apiJson({ error: "Não foi possível criar o verbete agora." }, { status: 503 });
  }
}
