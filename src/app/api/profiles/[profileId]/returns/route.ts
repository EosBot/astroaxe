import { NextRequest } from "next/server";
import { z } from "zod";

import { calculateAnnualSkyCalendar } from "@/domain/astrology/annual-calendar";
import { calculateLunarReturn, calculateSolarReturn } from "@/domain/astrology/returns";
import { houseSystemSchema } from "@/domain/astrology/western/contracts";
import { createMapResponseSchema } from "@/lib/maps/contracts";
import { parseServerEnv } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import { planetaryReturnResponseSchema } from "@/lib/returns/contracts";
import { resolveAccount } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";

const requestSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("solar"),
    year: z.coerce.number().int().min(1900).max(2200),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    timezone: z.string().min(1).max(100),
  }),
  z.object({ kind: z.literal("lunar"), date: z.iso.date() }),
]);
const profileIdSchema = z.uuid();
const chartSchema = createMapResponseSchema.shape.chart;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> },
): Promise<Response> {
  const env = parseServerEnv();
  const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
  if (account === null)
    return apiJson({ error: "Entre para calcular seus retornos." }, { status: 401 });
  const profileId = profileIdSchema.safeParse((await context.params).profileId);
  const query = requestSchema.safeParse({
    kind: request.nextUrl.searchParams.get("kind"),
    year: request.nextUrl.searchParams.get("year"),
    date: request.nextUrl.searchParams.get("date"),
    latitude: request.nextUrl.searchParams.get("latitude"),
    longitude: request.nextUrl.searchParams.get("longitude"),
    timezone: request.nextUrl.searchParams.get("timezone"),
  });
  if (!profileId.success || !query.success)
    return apiJson({ error: "Parâmetros do retorno inválidos." }, { status: 400 });
  const profile = await getPrisma().birthProfile.findFirst({
    where: { id: profileId.data, userId: account.id },
    select: {
      birthDate: true,
      timezone: true,
      latitude: true,
      longitude: true,
      chart: { select: { result: true } },
    },
  });
  if (!profile?.chart) return apiJson({ error: "Mapa não encontrado." }, { status: 404 });
  const natal = chartSchema.parse(profile.chart.result);
  const common = {
    timezone: profile.timezone,
    latitude: Number(profile.latitude),
    longitude: Number(profile.longitude),
    houseSystem: houseSystemSchema.parse(natal.houses?.requestedSystem ?? "placidus"),
  };
  const returnChart =
    query.data.kind === "solar"
      ? calculateSolarReturn({
          ...common,
          latitude: query.data.latitude,
          longitude: query.data.longitude,
          timezone: query.data.timezone,
          year: query.data.year,
          birthDate: profile.birthDate.toISOString().slice(0, 10),
          natalSunLongitude: requireLongitude(natal.planets, "sun"),
        })
      : calculateLunarReturn({
          ...common,
          nearDate: query.data.date,
          natalMoonLongitude: requireLongitude(natal.planets, "moon"),
        });
  const annualCalendar =
    query.data.kind === "solar"
      ? calculateAnnualSkyCalendar({
          year: query.data.year,
          latitude: query.data.latitude,
          longitude: query.data.longitude,
          natalPlanets: natal.planets,
        })
      : undefined;
  return apiJson(planetaryReturnResponseSchema.parse({ returnChart, annualCalendar }));
}

function requireLongitude(planets: Array<{ id: string; longitude: number }>, body: string): number {
  const planet = planets.find(({ id }) => id === body);
  if (planet === undefined) throw new Error(`natal_${body}_missing`);
  return planet.longitude;
}
