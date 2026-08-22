import { Prisma } from "@/generated/prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

import { createCulturalSourceSchema } from "@/lib/editorial/contracts";
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
  if (actor === null) return apiJson({ error: "Acesso editorial necessário." }, { status: 403 });

  try {
    const input = createCulturalSourceSchema.parse(await request.json());
    const source = await getPrisma().culturalSource.create({
      data: { ...input, accessedAt: new Date(`${input.accessedAt}T00:00:00.000Z`) },
      select: { id: true, sourceKey: true },
    });
    return apiJson(source, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError)
      return apiJson({ error: "Revise a fonte e a licença informadas." }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      return apiJson({ error: "Esta fonte já foi cadastrada." }, { status: 409 });
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "cultural source creation failed",
    );
    return apiJson({ error: "Não foi possível cadastrar a fonte agora." }, { status: 503 });
  }
}
