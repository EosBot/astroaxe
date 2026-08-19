import { createHmac } from "node:crypto";

import type { NextRequest } from "next/server";
import { z } from "zod";

import { parseServerEnv } from "@/lib/env";
import { searchBirthplaces } from "@/lib/geocoding/nominatim";
import { logger } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/rate-limit";
import { apiJson } from "@/lib/security/headers";

const querySchema = z.string().trim().min(2).max(120);

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const query = querySchema.parse(request.nextUrl.searchParams.get("q"));
    const env = parseServerEnv();
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const clientKey = createHmac("sha256", env.GUEST_SESSION_SECRET)
      .update(forwarded)
      .digest("hex")
      .slice(0, 24);
    if (!(await enforceRateLimit(`v1:rate:geo:${clientKey}`, 10, 60))) {
      return apiJson({ error: "Muitas buscas. Aguarde um minuto." }, { status: 429 });
    }
    return apiJson({ places: await searchBirthplaces(query, env.NOMINATIM_USER_AGENT) });
  } catch (error) {
    if (error instanceof z.ZodError)
      return apiJson({ error: "Digite ao menos dois caracteres." }, { status: 400 });
    logger.warn(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "geocoding failed",
    );
    return apiJson(
      { error: "A busca de cidades esta temporariamente indisponivel." },
      { status: 503 },
    );
  }
}
