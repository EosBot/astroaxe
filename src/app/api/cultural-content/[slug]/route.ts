import { NextRequest } from "next/server";

import { culturalEntrySlugSchema } from "@/lib/cultural-content/contracts";
import { findPublishedCulturalEntry } from "@/lib/cultural-content/public-entry";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma";
import { apiJson } from "@/lib/security/headers";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const slug = culturalEntrySlugSchema.safeParse((await context.params).slug);
  if (!slug.success) return apiJson({ error: "Conteúdo inválido." }, { status: 400 });

  try {
    const entry = await findPublishedCulturalEntry(getPrisma(), slug.data, new Date());
    if (entry === null) return apiJson({ error: "Conteúdo não encontrado." }, { status: 404 });
    return apiJson(entry);
  } catch (error) {
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "published cultural content lookup failed",
    );
    return apiJson({ error: "Não foi possível abrir este conteúdo agora." }, { status: 503 });
  }
}
