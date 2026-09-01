import { Temporal } from "@js-temporal/polyfill";
import { julianDay } from "caelus";
import { NextRequest } from "next/server";
import { z } from "zod";

import { evaluateElections } from "@/domain/astrology/elections";
import { seededElectionProfiles } from "@/domain/astrology/elections/profiles";
import { buildPublicTimingReading } from "@/domain/astrology/elections/public-observation";
import { resolvePlanetaryHourAt } from "@/domain/astrology/planetary-hours";
import { apiJson } from "@/lib/security/headers";

/**
 * Leitura cerimonial de um momento.
 *
 * Sem conta e sem persistência: o instante e o lugar entram na requisição,
 * produzem a observação e não são gravados nem registrados em log. Não há dado
 * natal aqui — é um momento e um lugar quaisquer, escolhidos por quem pergunta.
 *
 * Dinâmica e sem cache: a resposta depende inteiramente dos parâmetros, e um
 * cache por rota devolveria a leitura de outro momento.
 */
export const dynamic = "force-dynamic";

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

export function GET(request: NextRequest): Response {
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
