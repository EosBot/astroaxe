import { NextRequest } from "next/server";
import { Temporal } from "@js-temporal/polyfill";
import { z } from "zod";

import { calculateLunarDashboard } from "@/domain/astrology/lunar";
import { calculateLunarReturn } from "@/domain/astrology/returns";
import { calculateTransitSnapshot } from "@/domain/astrology/transits";
import { houseSystemSchema } from "@/domain/astrology/western/contracts";
import { parseServerEnv } from "@/lib/env";
import { lunarModuleResponseSchema } from "@/lib/lunar/contracts";
import { createMapResponseSchema } from "@/lib/maps/contracts";
import { getPrisma } from "@/lib/prisma";
import { authorizeFeature } from "@/lib/access/guard";
import { apiJson } from "@/lib/security/headers";

const requestSchema = z.object({
  profileId: z.uuid(),
  instant: z.iso.datetime({ offset: true }),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  timezone: z.string().min(1).max(100),
});
const chartSchema = createMapResponseSchema.shape.chart;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> },
): Promise<Response> {
  const env = parseServerEnv();
  // O nível de acesso decide, e não a mera presença de sessão: assim o dia
  // do paywall muda o catálogo, e não esta rota.
  const grant = await authorizeFeature(request, "lunar", { requireSameOrigin: false });
  if (grant instanceof Response) return grant;
  const account = { id: grant.userId as string };
  const parsed = requestSchema.safeParse({
    profileId: (await context.params).profileId,
    instant: request.nextUrl.searchParams.get("instant"),
    latitude: request.nextUrl.searchParams.get("latitude"),
    longitude: request.nextUrl.searchParams.get("longitude"),
    timezone: request.nextUrl.searchParams.get("timezone"),
  });
  if (!parsed.success) return apiJson({ error: "Referência lunar inválida." }, { status: 400 });
  const profile = await getPrisma().birthProfile.findFirst({
    where: { id: parsed.data.profileId, userId: account.id },
    select: {
      birthDate: true,
      chart: { select: { inputFingerprint: true, result: true } },
    },
  });
  if (!profile?.chart) return apiJson({ error: "Mapa não encontrado." }, { status: 404 });
  const natal = chartSchema.parse(profile.chart.result);
  const sun = requirePlanet(natal.planets, "sun");
  const moon = requirePlanet(natal.planets, "moon");
  const dashboard = calculateLunarDashboard({
    birthDate: profile.birthDate.toISOString().slice(0, 10),
    natalJdUt: natal.jdUt,
    natalSunLongitude: sun.longitude,
    natalMoonLongitude: moon.longitude,
    ...(natal.houses === undefined ? {} : { natalHouseCusps: natal.houses.cusps }),
    referenceInstant: parsed.data.instant,
  });
  const localDate = Temporal.Instant.from(parsed.data.instant)
    .toZonedDateTimeISO(parsed.data.timezone)
    .toPlainDate()
    .toString();
  const lunarReturn = calculateLunarReturn({
    nearDate: localDate,
    timezone: parsed.data.timezone,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    houseSystem: houseSystemSchema.parse(natal.houses?.requestedSystem ?? "placidus"),
    natalMoonLongitude: moon.longitude,
  });
  const snapshot = calculateTransitSnapshot({
    instant: parsed.data.instant,
    natalInputFingerprint: profile.chart.inputFingerprint,
    natalPlanets: natal.planets,
    fingerprintSecret: env.FINGERPRINT_SECRET,
  });
  return apiJson(
    lunarModuleResponseSchema.parse({
      dashboard,
      lunarReturn,
      transits: snapshot.aspects.filter(({ transitingBody }) => transitingBody === "moon"),
    }),
  );
}

function requirePlanet(
  planets: Array<{ id: string; longitude: number }>,
  body: string,
): { longitude: number } {
  const planet = planets.find(({ id }) => id === body);
  if (planet === undefined) throw new Error(`natal_${body}_missing`);
  return planet;
}
