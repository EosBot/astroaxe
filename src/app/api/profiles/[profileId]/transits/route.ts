import { NextRequest } from "next/server";
import { z } from "zod";

import { createMapResponseSchema } from "@/lib/maps/contracts";
import { parseServerEnv } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import { authorizeFeature } from "@/lib/access/guard";
import { apiJson } from "@/lib/security/headers";
import { dailyTransitSnapshot } from "@/lib/transits/daily";
import { selectPublishedTransitInterpretations } from "@/lib/transits/interpretations";

const paramsSchema = z.object({ profileId: z.uuid(), date: z.iso.date() });
const chartSchema = createMapResponseSchema.shape.chart;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> },
): Promise<Response> {
  const env = parseServerEnv();
  // O nível de acesso decide, e não a mera presença de sessão: assim o dia
  // do paywall muda o catálogo, e não esta rota.
  const grant = await authorizeFeature(request, "transits", { requireSameOrigin: false });
  if (grant instanceof Response) return grant;
  const account = { id: grant.userId as string };
  const parsed = paramsSchema.safeParse({
    profileId: (await context.params).profileId,
    date: request.nextUrl.searchParams.get("date"),
  });
  if (!parsed.success) return apiJson({ error: "Data ou perfil inválido." }, { status: 400 });
  const profile = await getPrisma().birthProfile.findFirst({
    where: { id: parsed.data.profileId, userId: account.id },
    select: { timezone: true, chart: { select: { inputFingerprint: true, result: true } } },
  });
  if (!profile?.chart) return apiJson({ error: "Mapa não encontrado." }, { status: 404 });
  const natal = chartSchema.parse(profile.chart.result);
  const snapshot = await dailyTransitSnapshot({
    date: parsed.data.date,
    timezone: profile.timezone,
    natalInputFingerprint: profile.chart.inputFingerprint,
    natalPlanets: natal.planets,
    fingerprintSecret: env.FINGERPRINT_SECRET,
  });
  const interpretations = await selectPublishedTransitInterpretations(
    getPrisma(),
    snapshot,
    "pt-BR",
    new Date(),
  );
  return apiJson({ snapshot, interpretations });
}
