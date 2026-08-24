import { z } from "zod";

import type { RegencyMatrix } from "./contracts";
import type { RegencyAstrologicalFeature } from "./features";
import { scoreRegencies, type RegencyRole, type RegencyScoringConfig } from "./scorer";
import type { RegencyTemporalFeature } from "./temporal";

export const REGENCY_EVALUATION_VERSION = "regency-evaluation-0.4.0";

const temporalMethodSchema = z.enum([
  "observed_solar",
  "equinoctial_local_solar_proxy",
  "unavailable",
  "not_applicable",
]);

const roleLabelsSchema = z
  .object({
    front: z.string().optional(),
    head: z.string().optional(),
    back: z.string().optional(),
    anyOf: z.array(z.string().min(1).max(120)).min(1).max(8).optional(),
  })
  .strict()
  .refine(
    ({ front, head, back, anyOf }) =>
      front !== undefined || head !== undefined || back !== undefined || anyOf !== undefined,
    { message: "O caso precisa de ao menos um rótulo autodeclarado ou autorizado." },
  )
  .transform(({ front, head, back, anyOf }) => ({
    ...(front === undefined ? {} : { front }),
    ...(head === undefined ? {} : { head }),
    ...(back === undefined ? {} : { back }),
    ...(anyOf === undefined ? {} : { anyOf: [...new Set(anyOf)] }),
  }));

const astrologicalFeatureSchema = z
  .object({
    key: z.string().min(1).max(200),
    category: z.enum([
      "planet_sign",
      "element",
      "modality",
      "decan",
      "retrograde",
      "dignity",
      "house",
      "angle",
      "angularity",
      "aspect",
    ]),
    value: z.string().min(1).max(100),
    body: z.string().min(1).max(100).optional(),
    strength: z.number().min(0).max(1),
    requiresBirthTime: z.boolean(),
  })
  .strict()
  .transform(({ body, ...feature }) => (body === undefined ? feature : { ...feature, body }));

const temporalFeatureSchema = z
  .object({
    key: z.string().min(1).max(200),
    category: z.enum(["planetary_day", "planetary_hour", "solar_segment"]),
    value: z.string().min(1).max(100),
    scope: z.enum(["birth", "reading"]),
    hourNumber: z.number().int().min(1).max(12).optional(),
    intervalProgress: z.number().min(0).max(1).optional(),
  })
  .strict()
  .transform(({ hourNumber, intervalProgress, ...feature }) => ({
    ...feature,
    ...(hourNumber === undefined ? {} : { hourNumber }),
    ...(intervalProgress === undefined ? {} : { intervalProgress }),
  }));

export const regencyEvaluationCaseSchema = z
  .object({
    caseId: z.string().regex(/^case:[a-f0-9]{16,64}$/),
    evidenceFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    partition: z.enum(["calibration", "validation"]),
    provenance: z.enum(["authorized_practitioner", "public_self_disclosure", "synthetic"]),
    timeQuality: z.enum(["known", "unknown"]),
    temporalMethod: temporalMethodSchema,
    expected: roleLabelsSchema,
    astrologicalFeatures: z.array(astrologicalFeatureSchema).min(1).max(500),
    temporalFeatures: z.array(temporalFeatureSchema).max(10).optional(),
  })
  .strict()
  .superRefine((evaluationCase, context) => {
    if (
      evaluationCase.timeQuality === "unknown" &&
      evaluationCase.temporalMethod !== "not_applicable"
    )
      context.addIssue({
        code: "custom",
        path: ["temporalMethod"],
        message: "Hora desconhecida exige método temporal não aplicável.",
      });
    if (
      evaluationCase.timeQuality === "known" &&
      evaluationCase.temporalMethod === "not_applicable"
    )
      context.addIssue({
        code: "custom",
        path: ["temporalMethod"],
        message: "Hora conhecida exige registrar o método temporal ou sua indisponibilidade.",
      });
  })
  .transform(({ temporalFeatures, ...evaluationCase }) => ({
    ...evaluationCase,
    ...(temporalFeatures === undefined ? {} : { temporalFeatures }),
  }));

export const regencyEvaluationDatasetSchema = z
  .object({
    version: z.string().trim().min(1).max(80),
    cases: z.array(regencyEvaluationCaseSchema).min(1).max(10_000),
  })
  .strict()
  .superRefine((dataset, context) => {
    const ids = new Set<string>();
    const evidencePartitions = new Map<string, "calibration" | "validation">();
    dataset.cases.forEach((item, index) => {
      if (ids.has(item.caseId))
        context.addIssue({
          code: "custom",
          path: ["cases", index, "caseId"],
          message: "Cada caso deve possuir ID opaco único.",
        });
      ids.add(item.caseId);
      const existingPartition = evidencePartitions.get(item.evidenceFingerprint);
      if (existingPartition !== undefined && existingPartition !== item.partition)
        context.addIssue({
          code: "custom",
          path: ["cases", index, "evidenceFingerprint"],
          message: "A mesma cadeia de evidência não pode atravessar calibração e validação.",
        });
      evidencePartitions.set(item.evidenceFingerprint, item.partition);
    });
  });

export interface RegencyEvaluationCase {
  caseId: string;
  evidenceFingerprint: string;
  partition: "calibration" | "validation";
  provenance: "authorized_practitioner" | "public_self_disclosure" | "synthetic";
  timeQuality: "known" | "unknown";
  temporalMethod: z.infer<typeof temporalMethodSchema>;
  expected: Partial<Record<RegencyRole, string>> & { anyOf?: string[] };
  astrologicalFeatures: RegencyAstrologicalFeature[];
  temporalFeatures?: RegencyTemporalFeature[];
}

export type RegencyEvaluationDataset = z.infer<typeof regencyEvaluationDatasetSchema>;

export interface RegencyEvaluationResult {
  evaluationVersion: string;
  datasetVersion: string;
  configVersion: string;
  partition: "calibration" | "validation";
  sampleSize: number;
  metricsByRole: Record<RegencyRole, RoleMetric>;
  exactTriad: {
    sampleSize: number;
    accuracy: number | null;
    confidenceInterval95: ConfidenceInterval | null;
  };
  unorderedLabels: {
    sampleSize: number;
    labelCount: number;
    selectedTriadCoverage: number | null;
    selectedTriadConfidenceInterval95: ConfidenceInterval | null;
    top3AnyRoleCoverage: number | null;
    top3AnyRoleConfidenceInterval95: ConfidenceInterval | null;
  };
  confusionByRole: Record<RegencyRole, Record<string, Record<string, number>>>;
  strata: {
    byTimeQuality: Record<"known" | "unknown", EvaluationStratum>;
    byTemporalMethod: Record<z.infer<typeof temporalMethodSchema>, EvaluationStratum>;
    byProvenance: Record<RegencyEvaluationCase["provenance"], EvaluationStratum>;
  };
}

interface EvaluationStratum {
  sampleSize: number;
  labelCount: number;
  knownRoleAccuracy: number | null;
  confidenceInterval95: ConfidenceInterval | null;
}

interface RoleMetric {
  sampleSize: number;
  accuracy: number | null;
  confidenceInterval95: ConfidenceInterval | null;
  top3Accuracy: number | null;
  top3ConfidenceInterval95: ConfidenceInterval | null;
  unresolvedCount: number;
  unresolvedRate: number | null;
}

interface ConfidenceInterval {
  lower: number;
  upper: number;
}

export function evaluateRegencyConfig(input: {
  matrix: RegencyMatrix;
  config: RegencyScoringConfig;
  datasetVersion: string;
  cases: RegencyEvaluationCase[];
  partition: "calibration" | "validation";
}): RegencyEvaluationResult {
  regencyEvaluationDatasetSchema.parse({ version: input.datasetVersion, cases: input.cases });
  const cases = input.cases.filter(({ partition }) => partition === input.partition);
  if (cases.length === 0) throw new RangeError(`Não há casos na partição ${input.partition}.`);
  const roleCounters = counters(["front", "head", "back"] as const);
  const confusionByRole = {
    front: {},
    head: {},
    back: {},
  } satisfies Record<RegencyRole, Record<string, Record<string, number>>>;
  const timeQualityCounts = counters(["known", "unknown"] as const);
  const temporalMethodCounts = counters(temporalMethodSchema.options);
  const provenanceCounts = counters([
    "authorized_practitioner",
    "public_self_disclosure",
    "synthetic",
  ] as const);
  let exact = 0;
  let completeCases = 0;
  let unorderedCases = 0;
  let unorderedLabels = 0;
  let unorderedSelected = 0;
  let unorderedTop3 = 0;

  for (const item of cases) {
    const outcome = evaluateCase(item, input.matrix, input.config, roleCounters, confusionByRole);
    if (outcome.knownLabels === 3) {
      completeCases += 1;
      if (outcome.allKnownRolesCorrect) exact += 1;
    }
    if (outcome.unorderedLabelCount > 0) {
      unorderedCases += 1;
      unorderedLabels += outcome.unorderedLabelCount;
      unorderedSelected += outcome.unorderedSelected;
      unorderedTop3 += outcome.unorderedTop3;
    }
    recordCase(
      timeQualityCounts[item.timeQuality],
      outcome.knownLabels,
      outcome.correctKnownLabels,
    );
    recordCase(
      temporalMethodCounts[item.temporalMethod],
      outcome.knownLabels,
      outcome.correctKnownLabels,
    );
    recordCase(provenanceCounts[item.provenance], outcome.knownLabels, outcome.correctKnownLabels);
  }

  return {
    evaluationVersion: REGENCY_EVALUATION_VERSION,
    datasetVersion: input.datasetVersion,
    configVersion: input.config.version,
    partition: input.partition,
    sampleSize: cases.length,
    metricsByRole: {
      front: roleMetric(roleCounters.front),
      head: roleMetric(roleCounters.head),
      back: roleMetric(roleCounters.back),
    },
    exactTriad: {
      sampleSize: completeCases,
      accuracy: completeCases === 0 ? null : exact / completeCases,
      confidenceInterval95: wilsonInterval(exact, completeCases),
    },
    unorderedLabels: {
      sampleSize: unorderedCases,
      labelCount: unorderedLabels,
      selectedTriadCoverage: unorderedLabels === 0 ? null : unorderedSelected / unorderedLabels,
      selectedTriadConfidenceInterval95: wilsonInterval(unorderedSelected, unorderedLabels),
      top3AnyRoleCoverage: unorderedLabels === 0 ? null : unorderedTop3 / unorderedLabels,
      top3AnyRoleConfidenceInterval95: wilsonInterval(unorderedTop3, unorderedLabels),
    },
    confusionByRole,
    strata: {
      byTimeQuality: summarizeCounters(timeQualityCounts),
      byTemporalMethod: summarizeCounters(temporalMethodCounts),
      byProvenance: summarizeCounters(provenanceCounts),
    },
  };
}

function evaluateCase(
  item: RegencyEvaluationCase,
  matrix: RegencyMatrix,
  config: RegencyScoringConfig,
  roleCounters: Record<RegencyRole, OutcomeCounter>,
  confusionByRole: Record<RegencyRole, Record<string, Record<string, number>>>,
): {
  knownLabels: number;
  correctKnownLabels: number;
  allKnownRolesCorrect: boolean;
  unorderedLabelCount: number;
  unorderedSelected: number;
  unorderedTop3: number;
} {
  const scoring = scoreRegencies({
    matrix,
    config,
    astrologicalFeatures: item.astrologicalFeatures,
    ...(item.temporalFeatures === undefined ? {} : { temporalFeatures: item.temporalFeatures }),
  });
  const predicted = scoring.triad;
  let knownLabels = 0;
  let correctKnownLabels = 0;
  let allKnownRolesCorrect = true;
  for (const role of ["front", "head", "back"] as const) {
    const expected = item.expected[role];
    if (expected === undefined) continue;
    knownLabels += 1;
    const correct = predicted[role] === expected;
    const top3Correct = scoring.rankingsByRole[role]
      .slice(0, 3)
      .some(({ orisaId }) => orisaId === expected);
    recordLabel(roleCounters[role], correct, top3Correct, predicted[role] === null);
    if (correct) correctKnownLabels += 1;
    else allKnownRolesCorrect = false;
    incrementConfusion(confusionByRole[role], expected, predicted[role] ?? "unresolved");
  }
  const selectedIds = new Set(Object.values(predicted).filter((id) => id !== null));
  const top3Ids = new Set(
    Object.values(scoring.rankingsByRole)
      .flatMap((ranking) => ranking.slice(0, 3))
      .map(({ orisaId }) => orisaId),
  );
  const unordered = item.expected.anyOf ?? [];
  return {
    knownLabels,
    correctKnownLabels,
    allKnownRolesCorrect,
    unorderedLabelCount: unordered.length,
    unorderedSelected: unordered.filter((id) => selectedIds.has(id)).length,
    unorderedTop3: unordered.filter((id) => top3Ids.has(id)).length,
  };
}

function counters<const T extends readonly string[]>(keys: T): Record<T[number], OutcomeCounter> {
  return Object.fromEntries(
    keys.map((key) => [
      key,
      {
        sampleSize: 0,
        labelCount: 0,
        correctLabels: 0,
        top3CorrectLabels: 0,
        unresolvedLabels: 0,
      },
    ]),
  ) as Record<T[number], OutcomeCounter>;
}

interface OutcomeCounter {
  sampleSize: number;
  labelCount: number;
  correctLabels: number;
  top3CorrectLabels: number;
  unresolvedLabels: number;
}

function recordCase(counter: OutcomeCounter, labelCount: number, correctLabels: number): void {
  counter.sampleSize += 1;
  counter.labelCount += labelCount;
  counter.correctLabels += correctLabels;
}

function recordLabel(
  counter: OutcomeCounter,
  correct: boolean,
  top3Correct: boolean,
  unresolved: boolean,
): void {
  counter.sampleSize += 1;
  counter.labelCount += 1;
  if (correct) counter.correctLabels += 1;
  if (top3Correct) counter.top3CorrectLabels += 1;
  if (unresolved) counter.unresolvedLabels += 1;
}

function roleMetric(counter: OutcomeCounter): RoleMetric {
  return {
    sampleSize: counter.sampleSize,
    accuracy: counter.sampleSize === 0 ? null : counter.correctLabels / counter.sampleSize,
    confidenceInterval95: wilsonInterval(counter.correctLabels, counter.sampleSize),
    top3Accuracy: counter.sampleSize === 0 ? null : counter.top3CorrectLabels / counter.sampleSize,
    top3ConfidenceInterval95: wilsonInterval(counter.top3CorrectLabels, counter.sampleSize),
    unresolvedCount: counter.unresolvedLabels,
    unresolvedRate: counter.sampleSize === 0 ? null : counter.unresolvedLabels / counter.sampleSize,
  };
}

function summarizeCounters<T extends string>(
  values: Record<T, OutcomeCounter>,
): Record<T, EvaluationStratum> {
  return Object.fromEntries(
    Object.entries<OutcomeCounter>(values).map(([key, value]) => [
      key,
      {
        sampleSize: value.sampleSize,
        labelCount: value.labelCount,
        knownRoleAccuracy: value.labelCount === 0 ? null : value.correctLabels / value.labelCount,
        confidenceInterval95: wilsonInterval(value.correctLabels, value.labelCount),
      },
    ]),
  ) as Record<T, EvaluationStratum>;
}

function wilsonInterval(successes: number, sampleSize: number): ConfidenceInterval | null {
  if (sampleSize === 0) return null;
  const z95 = 1.959963984540054;
  const proportion = successes / sampleSize;
  const denominator = 1 + z95 ** 2 / sampleSize;
  const center = (proportion + z95 ** 2 / (2 * sampleSize)) / denominator;
  const margin =
    (z95 / denominator) *
    Math.sqrt((proportion * (1 - proportion) + z95 ** 2 / (4 * sampleSize)) / sampleSize);
  return { lower: Math.max(0, center - margin), upper: Math.min(1, center + margin) };
}

function incrementConfusion(
  matrix: Record<string, Record<string, number>>,
  expected: string,
  predicted: string,
): void {
  const row = matrix[expected] ?? {};
  row[predicted] = (row[predicted] ?? 0) + 1;
  matrix[expected] = row;
}
