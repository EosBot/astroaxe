import { Temporal } from "@js-temporal/polyfill";
import type { Prisma } from "@/generated/prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

import { birthDataSchema } from "@/domain/astrology/western/contracts";
import { calculateWesternChart } from "@/domain/astrology/western";
import { sanitizeBirthData } from "@/lib/data-hygiene/birth-data";
import { parseServerEnv } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { resolveAccount } from "@/lib/security/account";
import { guestCookie, resolveGuestSession } from "@/lib/security/guest-session";
import { apiJson } from "@/lib/security/headers";

const createMapSchema = birthDataSchema.extend({
  displayName: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u),
});

export async function POST(request: NextRequest): Promise<Response> {
  const invalidRequest = validateMapRequest(request);
  if (invalidRequest !== null) return invalidRequest;

  try {
    const env = parseServerEnv();
    const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
    const guest =
      account === null ? await resolveGuestSession(request, env.GUEST_SESSION_SECRET) : null;
    const ownerId = account?.id ?? guest?.id;
    if (ownerId === undefined) throw new TypeError("Map owner could not be resolved.");
    const allowed = await enforceRateLimit(`v1:rate:maps:${ownerId}`, 5, 60);
    if (!allowed)
      return apiJson({ error: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });

    const payload = createMapSchema.parse(await request.json());
    const { displayName, ...birthInput } = payload;
    const today = Temporal.Now.plainDateISO("UTC");
    const birthData = sanitizeBirthData(birthInput, today);
    const chart = calculateWesternChart(birthData, env.FINGERPRINT_SECRET);
    const result = z.json().parse(chart);
    if (result === null || typeof result !== "object" || Array.isArray(result)) {
      throw new TypeError("Chart result must be a JSON object.");
    }
    const persistedResult: Prisma.InputJsonObject = result;
    const prisma = getPrisma();

    const stored = await prisma.birthProfile.create({
      data: {
        guestSessionId: guest?.id ?? null,
        userId: account?.id ?? null,
        displayName,
        birthDate: new Date(`${birthData.date}T00:00:00.000Z`),
        birthTime: birthData.time ?? null,
        timePrecision: birthData.timePrecision === "known" ? "KNOWN" : "UNKNOWN",
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezone: birthData.timezone,
        location: birthData.location,
        chart: {
          create: {
            inputFingerprint: chart.inputFingerprint,
            engineVersion: chart.engineVersion,
            configVersion: chart.configVersion,
            calculationMode: chart.mode,
            result: persistedResult,
          },
        },
      },
      select: { id: true, chart: { select: { id: true } } },
    });

    const response = apiJson(
      { profileId: stored.id, chartId: stored.chart?.id, chart },
      { status: 201 },
    );
    if (guest?.newToken !== undefined)
      response.headers.append("Set-Cookie", guestCookie(guest.newToken));
    return response;
  } catch (error) {
    return mapCreationError(error);
  }
}

function validateMapRequest(request: NextRequest): Response | null {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return apiJson({ error: "Envie os dados como JSON." }, { status: 415 });
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(contentLength) || contentLength > 16_384)
    return apiJson({ error: "Payload excede o limite permitido." }, { status: 413 });
  return null;
}

function mapCreationError(error: unknown): Response {
  if (error instanceof z.ZodError || error instanceof RangeError)
    return apiJson(
      {
        error: "Revise os dados informados.",
        details: error instanceof z.ZodError ? error.issues : undefined,
      },
      { status: 400 },
    );
  logger.error(
    { errorType: error instanceof Error ? error.name : "UnknownError" },
    "map creation failed",
  );
  return apiJson({ error: "Nao foi possivel calcular o mapa agora." }, { status: 503 });
}
