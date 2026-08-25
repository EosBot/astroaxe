import { NextRequest } from "next/server";
import { z } from "zod";

import type { WesternChartEnvelope } from "@/domain/astrology/western/contracts";
import { extractRegencyAstrologicalFeatures } from "@/domain/orixas/regency/features";
import { extractRegencyNumerologicalFeatures } from "@/domain/orixas/regency/numerology";
import { PUBLIC_REGENCY_METHOD_VERSION } from "@/domain/orixas/regency/public-method";
import { assessRegencyRobustness } from "@/domain/orixas/regency/robustness";
import { scoreRegencies } from "@/domain/orixas/regency/scorer";
import { regencyV2Config } from "@/domain/orixas/regency/v2-config";
import { regencyV2Matrix } from "@/domain/orixas/regency/v2-matrix";
import { parseServerEnv } from "@/lib/env";
import { createMapResponseSchema } from "@/lib/maps/contracts";
import { AUTHORIAL_REGENCY_DISCLAIMER } from "@/lib/orixas/contracts";
import { publicRegencyResponseSchema } from "@/lib/orixas/public-regency";
import { getPrisma } from "@/lib/prisma";
import { resolveAccount } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";

const idSchema = z.uuid();
const chartSchema = createMapResponseSchema.shape.chart;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> },
): Promise<Response> {
  const env = parseServerEnv();
  const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
  if (account === null)
    return apiJson({ error: "Entre para abrir esta leitura." }, { status: 401 });
  const parsedId = idSchema.safeParse((await context.params).profileId);
  if (!parsedId.success) return apiJson({ error: "Mapa inválido." }, { status: 400 });
  const profile = await getPrisma().birthProfile.findFirst({
    where: { id: parsedId.data, userId: account.id },
    include: { chart: true },
  });
  if (profile?.chart === null || profile === null)
    return apiJson({ error: "Mapa não encontrado." }, { status: 404 });

  const chart = chartSchema.parse(profile.chart.result);
  const astrologicalFeatures = extractRegencyAstrologicalFeatures(toDomainChart(chart));
  const numerologicalFeatures = extractRegencyNumerologicalFeatures({
    birthDate: profile.birthDate.toISOString().slice(0, 10),
  });
  const input = {
    matrix: regencyV2Matrix,
    config: regencyV2Config,
    astrologicalFeatures,
    numerologicalFeatures,
  };
  const result = scoreRegencies(input);
  const robustness = assessRegencyRobustness(input);
  const response = publicRegencyResponseSchema.parse({
    methodVersion: PUBLIC_REGENCY_METHOD_VERSION,
    disclaimer: AUTHORIAL_REGENCY_DISCLAIMER,
    roles: Object.fromEntries(
      (["front", "head", "back"] as const).map((role) => [
        role,
        {
          selectedId: result.triad[role],
          candidates: result.rankingsByRole[role].slice(0, 3).map((candidate) => ({
            orisaId: candidate.orisaId,
            displayName: candidate.displayName,
            affinity: affinity(candidate.normalizedScore),
          })),
          stability: stability(robustness.roles[role]),
          ...(result.unresolvedRoles[role] === undefined
            ? {}
            : { unresolvedReason: result.unresolvedRoles[role].reason }),
        },
      ]),
    ),
  });
  return apiJson(response, { headers: { "Cache-Control": "private, no-store" } });
}

function affinity(score: number): "predominant" | "strong" | "present" | "subtle" {
  if (score >= 0.85) return "predominant";
  if (score >= 0.6) return "strong";
  if (score >= 0.35) return "present";
  return "subtle";
}

function stability(input: { eligible: boolean; topCandidateRetention: number }) {
  if (!input.eligible) return "unavailable" as const;
  if (input.topCandidateRetention >= 0.8) return "high" as const;
  if (input.topCandidateRetention >= 0.5) return "medium" as const;
  return "low" as const;
}

function toDomainChart(chart: z.infer<typeof chartSchema>): WesternChartEnvelope {
  const base = {
    mode: chart.mode,
    engineVersion: chart.engineVersion,
    configVersion: chart.configVersion,
    inputFingerprint: chart.inputFingerprint,
    jdUt: chart.jdUt,
    planets: chart.planets,
    aspects: chart.aspects ?? [],
    warnings: chart.warnings,
  };
  return chart.houses === undefined ? base : { ...base, houses: chart.houses };
}
