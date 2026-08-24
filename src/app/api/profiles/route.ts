import { NextRequest } from "next/server";

import { createMapResponseSchema } from "@/lib/maps/contracts";
import { parseServerEnv } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import { profilesResponseSchema, type ProfileRecord } from "@/lib/profiles/contracts";
import { resolveAccount } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";

const chartSchema = createMapResponseSchema.shape.chart;

export async function GET(request: NextRequest): Promise<Response> {
  const env = parseServerEnv();
  const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
  if (account === null) return apiJson({ error: "Entre para ver seus mapas." }, { status: 401 });
  const profiles = await getPrisma().birthProfile.findMany({
    where: { userId: account.id },
    orderBy: { createdAt: "asc" },
    include: { chart: true },
  });
  const response = profilesResponseSchema.parse({
    profiles: profiles.flatMap((profile): ProfileRecord[] => {
      if (profile.chart === null) return [];
      const chart = chartSchema.parse(profile.chart.result);
      const sun = chart.planets.find((planet) => planet.id === "sun");
      if (sun === undefined) return [];
      const moon = chart.planets.find((planet) => planet.id === "moon");
      return [
        {
          id: profile.id,
          displayName: profile.displayName,
          date: profile.birthDate.toISOString().slice(0, 10),
          time: profile.birthTime,
          timePrecision: profile.timePrecision === "KNOWN" ? "known" : "unknown",
          latitude: Number(profile.latitude),
          longitude: Number(profile.longitude),
          timezone: profile.timezone,
          location: profile.location,
          updatedAt: profile.chart.updatedAt.toISOString(),
          chart: {
            mode: chart.mode,
            sunSign: sun.sign,
            ...(moon === undefined ? {} : { moonSign: moon.sign }),
            ...(chart.houses === undefined ? {} : { ascendant: chart.houses.ascendant }),
            natal: chart,
          },
        },
      ];
    }),
  });
  return apiJson(response);
}
