import { listPublishedCulturalEntries } from "@/lib/cultural-content/public-entry";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma";
import { apiJson } from "@/lib/security/headers";

export async function GET(): Promise<Response> {
  try {
    return apiJson(await listPublishedCulturalEntries(getPrisma(), new Date()));
  } catch (error) {
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "published cultural collection lookup failed",
    );
    return apiJson({ error: "Não foi possível abrir o acervo agora." }, { status: 503 });
  }
}
