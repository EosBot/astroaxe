import { NextRequest } from "next/server";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";

import type { WesternChartEnvelope } from "@/domain/astrology/western/contracts";
import { extractRegencyAstrologicalFeatures } from "@/domain/orixas/regency/features";
import { extractRegencyNumerologicalFeatures } from "@/domain/orixas/regency/numerology";
import {
  REGENCY_QUESTIONNAIRE_VERSION,
  extractRegencyQuestionnaireFeatures,
  regencyQuestionnaireSubmissionSchema,
} from "@/domain/orixas/regency/questionnaire";
import { describeRegencyFactors } from "@/domain/orixas/regency/public-factors";
import { PUBLIC_REGENCY_METHOD_VERSION } from "@/domain/orixas/regency/public-method";
import { assessRegencyRobustness } from "@/domain/orixas/regency/robustness";
import { scoreRegencies } from "@/domain/orixas/regency/scorer";
import { regencyV2Config } from "@/domain/orixas/regency/v2-config";
import { regencyV2Matrix } from "@/domain/orixas/regency/v2-matrix";
import { parseServerEnv } from "@/lib/env";
import { createMapResponseSchema } from "@/lib/maps/contracts";
import { AUTHORIAL_REGENCY_DISCLAIMER } from "@/lib/orixas/contracts";
import { publicRegencyResponseSchema } from "@/lib/orixas/public-regency";
import { regencyFeedbackInputSchema } from "@/lib/orixas/regency-feedback";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma";
import { isSameOrigin, resolveAccount } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";
import { checkJsonRequest } from "@/lib/security/json-body";

const idSchema = z.uuid();
const chartSchema = createMapResponseSchema.shape.chart;
const feedbackDeleteQuerySchema = z.object({
  methodVersion: z.literal(PUBLIC_REGENCY_METHOD_VERSION),
  questionnaireVersion: z.literal(REGENCY_QUESTIONNAIRE_VERSION),
});

export async function GET(): Promise<Response> {
  return apiJson(
    { error: "Responda ao questionário antes de calcular a tríade." },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> },
): Promise<Response> {
  const env = parseServerEnv();
  if (!isSameOrigin(request, env.SITE_URL))
    return apiJson({ error: "Origem inválida." }, { status: 403 });
  const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
  if (account === null)
    return apiJson({ error: "Entre para abrir esta leitura." }, { status: 401 });
  const parsedId = idSchema.safeParse((await context.params).profileId);
  if (!parsedId.success) return apiJson({ error: "Mapa inválido." }, { status: 400 });

  const bodyCheck = checkJsonRequest(request);
  if (!bodyCheck.ok)
    return apiJson({ error: "Envie as respostas em JSON." }, { status: bodyCheck.status });
  const body = regencyQuestionnaireSubmissionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!body.success)
    return apiJson({ error: "Questionário incompleto ou inválido." }, { status: 400 });

  const profile = await getPrisma().birthProfile.findFirst({
    where: { id: parsedId.data, userId: account.id },
    include: { chart: true },
  });
  if (profile?.chart === null || profile === null)
    return apiJson({ error: "Mapa não encontrado." }, { status: 404 });

  const calculated = tryCalculateRegency(profile.chart.result, profile.birthDate, body.data);
  if (!calculated.ok)
    return apiJson({ error: "Não foi possível calcular sua leitura agora." }, { status: 503 });
  return apiJson(calculated.response, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> },
): Promise<Response> {
  const env = parseServerEnv();
  if (!isSameOrigin(request, env.SITE_URL))
    return apiJson({ error: "Origem inválida." }, { status: 403 });
  const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
  if (account === null)
    return apiJson({ error: "Entre para enviar sua avaliação." }, { status: 401 });
  const parsedId = idSchema.safeParse((await context.params).profileId);
  if (!parsedId.success) return apiJson({ error: "Mapa inválido." }, { status: 400 });
  const bodyCheck = checkJsonRequest(request);
  if (!bodyCheck.ok)
    return apiJson({ error: "Envie a avaliação em JSON." }, { status: bodyCheck.status });
  const body = regencyFeedbackInputSchema.safeParse(await request.json().catch(() => null));
  if (!body.success)
    return apiJson({ error: "Avaliação incompleta ou inválida." }, { status: 400 });
  const profile = await getPrisma().birthProfile.findFirst({
    where: { id: parsedId.data, userId: account.id },
    include: { chart: true },
  });
  if (profile?.chart === null || profile === null)
    return apiJson({ error: "Mapa não encontrado." }, { status: 404 });
  const validIds = new Set(
    regencyV2Matrix.entities
      .filter(({ eligibleForRegency }) => eligibleForRegency)
      .map(({ id }) => id),
  );
  const corrections = body.data.correctedTriad;
  if (
    corrections !== undefined &&
    Object.values(corrections).some((id) => id !== null && !validIds.has(id))
  )
    return apiJson({ error: "A correção contém um Orixá desconhecido." }, { status: 400 });

  const calculated = tryCalculateRegency(
    profile.chart.result,
    profile.birthDate,
    body.data.questionnaire,
  );
  if (!calculated.ok)
    return apiJson({ error: "Não foi possível registrar sua avaliação agora." }, { status: 503 });
  const { result } = calculated;
  try {
    await getPrisma().regencyFeedback.upsert({
      where: {
        birthProfileId_methodVersion_questionnaireVersion: {
          birthProfileId: profile.id,
          methodVersion: body.data.methodVersion,
          questionnaireVersion: body.data.questionnaire.version,
        },
      },
      create: feedbackData(profile.id, body.data, result),
      update: feedbackData(profile.id, body.data, result),
    });
    return apiJson(
      { saved: true },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "regency feedback upsert failed",
    );
    return apiJson({ error: "Não foi possível guardar sua avaliação agora." }, { status: 503 });
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
  if (account === null)
    return apiJson({ error: "Entre para remover sua avaliação." }, { status: 401 });
  const parsedId = idSchema.safeParse((await context.params).profileId);
  if (!parsedId.success) return apiJson({ error: "Mapa inválido." }, { status: 400 });
  const query = feedbackDeleteQuerySchema.safeParse({
    methodVersion: new URL(request.url).searchParams.get("methodVersion"),
    questionnaireVersion: new URL(request.url).searchParams.get("questionnaireVersion"),
  });
  if (!query.success) return apiJson({ error: "Avaliação inválida." }, { status: 400 });

  const deleted = await getPrisma().regencyFeedback.deleteMany({
    where: {
      birthProfileId: parsedId.data,
      birthProfile: { userId: account.id },
      methodVersion: query.data.methodVersion,
      questionnaireVersion: query.data.questionnaireVersion,
    },
  });
  if (deleted.count === 0) return apiJson({ error: "Avaliação não encontrada." }, { status: 404 });
  return new Response(null, { status: 204 });
}

function tryCalculateRegency(
  chartResult: unknown,
  birthDate: Date,
  questionnaire: z.infer<typeof regencyQuestionnaireSubmissionSchema>,
):
  | {
      ok: true;
      response: ReturnType<typeof calculateRegency>["response"];
      result: ReturnType<typeof calculateRegency>["result"];
    }
  | { ok: false } {
  try {
    const { response, result } = calculateRegency(chartResult, birthDate, questionnaire);
    return { ok: true, response, result };
  } catch (error) {
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "regency calculation failed",
    );
    return { ok: false };
  }
}

function calculateRegency(
  chartResult: unknown,
  birthDate: Date,
  questionnaire: z.infer<typeof regencyQuestionnaireSubmissionSchema>,
) {
  const chart = chartSchema.parse(chartResult);
  const astrologicalFeatures = extractRegencyAstrologicalFeatures(toDomainChart(chart));
  const numerologicalFeatures = extractRegencyNumerologicalFeatures({
    birthDate: birthDate.toISOString().slice(0, 10),
  });
  const questionnaireFeatures = extractRegencyQuestionnaireFeatures(questionnaire);
  const input = {
    matrix: regencyV2Matrix,
    config: regencyV2Config,
    astrologicalFeatures,
    numerologicalFeatures,
    questionnaireFeatures,
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
          determiningFactors: determiningFactors(result, role),
          stability: stability(robustness.roles[role]),
          ...(result.unresolvedRoles[role] === undefined
            ? {}
            : { unresolvedReason: result.unresolvedRoles[role].reason }),
        },
      ]),
    ),
  });
  return { response, result };
}

function feedbackData(
  profileId: string,
  feedback: z.infer<typeof regencyFeedbackInputSchema>,
  result: ReturnType<typeof scoreRegencies>,
) {
  return {
    birthProfileId: profileId,
    methodVersion: feedback.methodVersion,
    matrixVersion: regencyV2Matrix.version,
    configVersion: result.configVersion,
    scorerVersion: result.scorerVersion,
    questionnaireVersion: feedback.questionnaire.version,
    questionnaireAnswers: feedback.questionnaire.answers,
    predictedTriad: result.triad,
    verdict: feedback.verdict,
    knowsOrisas: feedback.knowsOrisas,
    correctedTriad: feedback.correctedTriad ?? Prisma.DbNull,
    confirmationBasis: feedback.confirmationBasis,
    comment: feedback.comment ?? null,
    consentVersion: feedback.consentVersion,
  };
}

/**
 * Fatores do candidato efetivamente escolhido.
 *
 * Papel em aberto não tem fatores determinantes: listar os do primeiro
 * colocado sugeriria uma conclusão que o método justamente não tomou.
 */
function determiningFactors(
  result: ReturnType<typeof scoreRegencies>,
  role: "front" | "head" | "back",
): string[] {
  const selectedId = result.triad[role];
  if (selectedId === null) return [];
  const selected = result.rankingsByRole[role].find(
    (candidate) => candidate.orisaId === selectedId,
  );
  return selected === undefined ? [] : describeRegencyFactors(selected.contributions);
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
