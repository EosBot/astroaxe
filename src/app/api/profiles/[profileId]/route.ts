import { NextRequest } from "next/server";
import { Temporal } from "@js-temporal/polyfill";
import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

import { calculateWesternChart } from "@/domain/astrology/western";
import { sanitizeBirthData } from "@/lib/data-hygiene/birth-data";
import { parseServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/profiles/contracts";
import { isSameOrigin, resolveAccount } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";

const idSchema = z.uuid();

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> },
): Promise<Response> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return apiJson({ error: "Envie os dados como JSON." }, { status: 415 });
  try {
    const env = parseServerEnv();
    if (!isSameOrigin(request, env.SITE_URL))
      return apiJson({ error: "Origem inválida." }, { status: 403 });
    const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
    if (account === null)
      return apiJson({ error: "Entre para recalcular este mapa." }, { status: 401 });
    const profileId = idSchema.parse((await context.params).profileId);
    const payload = updateProfileSchema.parse(await request.json());
    const { displayName, ...birthInput } = payload;
    const birthData = sanitizeBirthData(birthInput, Temporal.Now.plainDateISO("UTC"));
    const chart = calculateWesternChart(birthData, env.FINGERPRINT_SECRET);
    const result = inputJsonObject(chart);
    const prisma = getPrisma();
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.birthProfile.findFirst({
        where: { id: profileId, userId: account.id },
        include: { chart: true },
      });
      if (current?.chart === null || current === null) return null;
      await tx.natalChartRevision.create({
        data: {
          natalChartId: current.chart.id,
          inputFingerprint: current.chart.inputFingerprint,
          engineVersion: current.chart.engineVersion,
          configVersion: current.chart.configVersion,
          calculationMode: current.chart.calculationMode,
          result: inputJsonObject(current.chart.result),
          reason: "PROFILE_RECALCULATION",
        },
      });
      await tx.birthProfile.update({
        where: { id: current.id },
        data: {
          displayName,
          birthDate: new Date(`${birthData.date}T00:00:00.000Z`),
          birthTime: birthData.time ?? null,
          timePrecision: birthData.timePrecision === "known" ? "KNOWN" : "UNKNOWN",
          latitude: birthData.latitude,
          longitude: birthData.longitude,
          timezone: birthData.timezone,
          location: birthData.location,
          chart: {
            update: {
              inputFingerprint: chart.inputFingerprint,
              engineVersion: chart.engineVersion,
              configVersion: chart.configVersion,
              calculationMode: chart.mode,
              result,
            },
          },
        },
      });
      return { profileId: current.id, chartId: current.chart.id };
    });
    if (updated === null) return apiJson({ error: "Mapa não encontrado." }, { status: 404 });
    return apiJson({ ...updated, chart });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RangeError)
      return apiJson({ error: "Revise os dados informados." }, { status: 400 });
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "profile recalculation failed",
    );
    return apiJson({ error: "Não foi possível recalcular este mapa agora." }, { status: 503 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> },
): Promise<Response> {
  const env = parseServerEnv();
  if (!isSameOrigin(request, env.SITE_URL))
    return apiJson({ error: "Origem inválida." }, { status: 403 });
  const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
  if (account === null) return apiJson({ error: "Entre para excluir este mapa." }, { status: 401 });
  const parsedId = idSchema.safeParse((await context.params).profileId);
  if (!parsedId.success) return apiJson({ error: "Mapa inválido." }, { status: 400 });
  const deleted = await getPrisma().birthProfile.deleteMany({
    where: { id: parsedId.data, userId: account.id },
  });
  if (deleted.count === 0) return apiJson({ error: "Mapa não encontrado." }, { status: 404 });
  return new Response(null, { status: 204 });
}

function inputJsonObject(value: unknown): Prisma.InputJsonObject {
  const parsed = z.json().parse(value);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed))
    throw new TypeError("Chart result must be a JSON object.");
  return parsed;
}
