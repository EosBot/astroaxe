import { createHmac } from "node:crypto";

import { Temporal } from "@js-temporal/polyfill";
import { julianDay } from "caelus";
import { NextRequest } from "next/server";
import { z } from "zod";

import { evaluateElections } from "@/domain/astrology/elections";
import { seededElectionProfiles } from "@/domain/astrology/elections/profiles";
import { buildPublicTimingReading } from "@/domain/astrology/elections/public-observation";
import { resolvePlanetaryHourAt } from "@/domain/astrology/planetary-hours";
import { parseServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/rate-limit";
import { apiJson } from "@/lib/security/headers";

/**
 * Leitura cerimonial de um momento.
 *
 * Sem conta e sem persistência: o instante e o lugar entram na requisição,
 * produzem a observação e não são gravados nem registrados em log. Não há dado
 * natal aqui — é um momento e um lugar quaisquer, escolhidos por quem pergunta.
 *
 * A resposta depende inteiramente dos parâmetros da consulta, e é por lê-los que
 * o Next já a trata como dinâmica — nenhuma outra rota do projeto declara
 * `force-dynamic`, e esta não precisa ser a exceção.
 *
 * Rota pública sem conta, como o geocoding — e por isso com o mesmo limite por
 * cliente. Cada chamada calcula efemérides, então sem limite ela é um convite a
 * consumir CPU do servidor de graça. O cliente é identificado por HMAC do IP
 * encaminhado, e nunca pelo IP em claro.
 */
const requestSchema = z
  .object({
    instant: z.iso.datetime({ offset: true }),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    /**
     * Longitudes eclípticas do Sol e da Lua.
     *
     * Opcionais de propósito: sem elas as regras lunares ficam `unavailable` com o
     * motivo declarado, que é melhor do que supor uma fase.
     */
    sunLongitude: z.coerce.number().min(0).max(360).optional(),
    moonLongitude: z.coerce.number().min(0).max(360).optional(),
    polarFallback: z.enum(["strict", "equinoctial_local_solar"]).default("strict"),
  })
  .strict();

export async function GET(request: NextRequest): Promise<Response> {
  const env = parseServerEnv();
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const clientKey = createHmac("sha256", env.GUEST_SESSION_SECRET)
    .update(forwarded)
    .digest("hex")
    .slice(0, 24);
  try {
    if (!(await enforceRateLimit(`v1:rate:timing:${clientKey}`, 30, 60)))
      return apiJson({ error: "Muitas leituras. Aguarde um minuto." }, { status: 429 });
  } catch (error) {
    // Redis fora do ar não pode virar porta aberta: falha fechada.
    logger.warn(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "ceremonial timing rate limit unavailable",
    );
    return apiJson({ error: "A leitura está temporariamente indisponível." }, { status: 503 });
  }

  const query = request.nextUrl.searchParams;
  const parsed = requestSchema.safeParse({
    instant: query.get("instant"),
    latitude: query.get("latitude"),
    longitude: query.get("longitude"),
    ...(query.get("sunLongitude") === null ? {} : { sunLongitude: query.get("sunLongitude") }),
    ...(query.get("moonLongitude") === null ? {} : { moonLongitude: query.get("moonLongitude") }),
    ...(query.get("polarFallback") === null ? {} : { polarFallback: query.get("polarFallback") }),
  });
  if (!parsed.success)
    return apiJson({ error: "Momento ou lugar inválido para a leitura." }, { status: 400 });

  const { instant, latitude, longitude, polarFallback, sunLongitude, moonLongitude } = parsed.data;
  const utc = Temporal.Instant.from(instant).toZonedDateTimeISO("UTC");
  const jdUt = julianDay(utc.year, utc.month, utc.day, utc.hour, utc.minute, utc.second);

  const moment = {
    jdUt,
    latitude,
    longitude,
    polarFallback,
    ...(sunLongitude === undefined ? {} : { sunLongitude }),
    ...(moonLongitude === undefined ? {} : { moonLongitude }),
  };

  return apiJson(
    buildPublicTimingReading({
      resolution: resolvePlanetaryHourAt({ jdUt, latitude, longitude, polarFallback }),
      observations: evaluateElections({ profiles: [...seededElectionProfiles], moment }),
    }),
  );
}
