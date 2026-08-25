import { z } from "zod";

import { regencyMatrixSchema, type RegencyMatrix } from "./contracts";
import type { RegencyAstrologicalFeature } from "./features";
import type { RegencyTemporalFeature } from "./temporal";
import type { RegencyNumerologicalFeature } from "./numerology";
import { regencyDecisionPolicySchema } from "./decision-policy";

export const REGENCY_SCORER_VERSION = "regency-scorer-0.5.0-research";

const roleSchema = z.enum(["front", "head", "back"]);
const featureCategorySchema = z.enum([
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
  "planetary_day",
  "planetary_hour",
  "solar_segment",
  "birth_number",
]);

export const regencyScoringConfigSchema = z
  .object({
    version: z.string().trim().min(1).max(80),
    status: z.literal("research"),
    decisionPolicy: regencyDecisionPolicySchema,
    structuralSources: z
      .array(
        z
          .object({
            id: z.string().regex(/^source:[a-z0-9-:]+$/),
            title: z.string().trim().min(1).max(300),
            url: z.url().optional(),
            localPath: z
              .string()
              .regex(/^docs\/[a-z0-9_./-]+\.md$/)
              .optional(),
            locator: z.string().trim().min(1).max(200),
            tradition: z.enum([
              "astrology",
              "ceremonial",
              "angelical",
              "goetia",
              "numerology",
              "product_hypothesis",
            ]),
          })
          .strict()
          .refine((source) => source.url !== undefined || source.localPath !== undefined, {
            message: "A fonte estrutural precisa de URL ou caminho documental local.",
          }),
      )
      .min(1)
      .max(100),
    selectionMinimums: z
      .record(
        roleSchema,
        z
          .object({
            minimumRawScore: z.number().positive().max(100),
            minimumEvidenceBreadth: z.number().int().positive().max(20),
          })
          .strict(),
      )
      .refine((minimums) => roleSchema.options.every((role) => minimums[role] !== undefined), {
        message: "Todos os papéis precisam de critérios mínimos de seleção.",
      }),
    rules: z
      .array(
        z
          .object({
            id: z.string().regex(/^[a-z0-9-]+$/),
            role: roleSchema,
            claimFactor: z.enum([
              "planet",
              "zodiac_sign",
              "element",
              "modality",
              "house",
              "angle",
              "decan",
              "dignity",
              "retrograde",
              "aspect",
              "angularity",
              "planetary_day",
              "planetary_hour",
              "birth_number",
            ]),
            featureCategory: featureCategorySchema,
            matchMode: z.enum(["direct", "planetary_resonance"]).optional(),
            featureKeyPrefix: z.string().trim().min(1).max(100).optional(),
            weight: z.number().positive().max(100),
            temporalScope: z.enum(["birth", "reading"]).optional(),
            structuralSourceIds: z.array(z.string()).min(1).max(8),
          })
          .strict(),
      )
      .min(1)
      .max(200),
  })
  .strict()
  .superRefine((config, context) => {
    const ids = new Set<string>();
    const sourceIds = new Set(config.structuralSources.map(({ id }) => id));
    config.rules.forEach((rule, index) => {
      if (ids.has(rule.id))
        context.addIssue({
          code: "custom",
          path: ["rules", index, "id"],
          message: "ID duplicado.",
        });
      ids.add(rule.id);
      const temporal = ["planetary_day", "planetary_hour", "solar_segment"].includes(
        rule.featureCategory,
      );
      if (rule.temporalScope !== undefined && !temporal)
        context.addIssue({
          code: "custom",
          path: ["rules", index, "temporalScope"],
          message: "Escopo temporal só pode ser aplicado a uma feature temporal.",
        });
      if (
        rule.matchMode === "planetary_resonance" &&
        (rule.claimFactor !== "planet" ||
          !["planetary_day", "planetary_hour"].includes(rule.featureCategory))
      )
        context.addIssue({
          code: "custom",
          path: ["rules", index, "matchMode"],
          message: "Ressonância planetária exige claim planetário e dia ou hora planetária.",
        });
      rule.structuralSourceIds.forEach((sourceId) => {
        if (!sourceIds.has(sourceId))
          context.addIssue({
            code: "custom",
            path: ["rules", index, "structuralSourceIds"],
            message: "A fonte estrutural da regra deve existir na configuração.",
          });
      });
    });
  });

export type RegencyRole = z.infer<typeof roleSchema>;
export type RegencyScoringConfig = z.infer<typeof regencyScoringConfigSchema>;

type ScorableFeature =
  RegencyAstrologicalFeature | RegencyTemporalFeature | RegencyNumerologicalFeature;

export interface RegencyContribution {
  ruleId: string;
  claimId: string;
  schoolId: string;
  featureKey: string;
  amount: number;
  evidenceMultiplier: number;
  evidenceTrack: RegencyMatrix["claims"][number]["evidenceTrack"];
  structuralSourceIds: string[];
  facetId?: string;
}

export interface RegencyCandidateScore {
  orisaId: string;
  displayName: string;
  rawScore: number;
  normalizedScore: number;
  evidenceBreadth: number;
  contributions: RegencyContribution[];
}

export interface RegencyScoringResult {
  scorerVersion: string;
  configVersion: string;
  decisionPolicyVersion: string;
  triad: Record<RegencyRole, string | null>;
  unresolvedRoles: Partial<
    Record<
      RegencyRole,
      { reason: UnresolvedReason; bestRawScore: number; bestEvidenceBreadth: number }
    >
  >;
  rankingsByRole: Record<RegencyRole, RegencyCandidateScore[]>;
}

export function scoreRegencies(input: {
  matrix: RegencyMatrix;
  config: RegencyScoringConfig;
  astrologicalFeatures: RegencyAstrologicalFeature[];
  temporalFeatures?: RegencyTemporalFeature[];
  numerologicalFeatures?: RegencyNumerologicalFeature[];
}): RegencyScoringResult {
  const matrix = regencyMatrixSchema.parse(input.matrix);
  const config = regencyScoringConfigSchema.parse(input.config);
  const features: ScorableFeature[] = [
    ...input.astrologicalFeatures,
    ...(input.temporalFeatures ?? []),
    ...(input.numerologicalFeatures ?? []),
  ];
  const candidates = matrix.entities.filter((entity) => entity.eligibleForRegency);
  if (candidates.length < 3)
    throw new RangeError("A tríade exige pelo menos três Orixás elegíveis.");

  const rankingsByRole = Object.fromEntries(
    roleSchema.options.map((role) => [
      role,
      rankCandidates(role, candidates, matrix, config, features),
    ]),
  ) as Record<RegencyRole, RegencyCandidateScore[]>;

  const selection = selectAvailableTriad(rankingsByRole, config.selectionMinimums);
  return {
    scorerVersion: REGENCY_SCORER_VERSION,
    configVersion: config.version,
    decisionPolicyVersion: config.decisionPolicy.version,
    triad: selection.triad,
    unresolvedRoles: selection.unresolvedRoles,
    rankingsByRole,
  };
}

function rankCandidates(
  role: RegencyRole,
  candidates: RegencyMatrix["entities"],
  matrix: RegencyMatrix,
  config: RegencyScoringConfig,
  features: ScorableFeature[],
): RegencyCandidateScore[] {
  const scores = candidates.map((entity) => scoreCandidate(role, entity, matrix, config, features));
  const maximum = Math.max(...scores.map(({ rawScore }) => rawScore), 0);
  return scores
    .map((score) => ({
      ...score,
      normalizedScore: maximum === 0 ? 0 : score.rawScore / maximum,
    }))
    .sort(compareCandidates);
}

function scoreCandidate(
  role: RegencyRole,
  entity: RegencyMatrix["entities"][number],
  matrix: RegencyMatrix,
  config: RegencyScoringConfig,
  features: ScorableFeature[],
): RegencyCandidateScore {
  const contributions = matrix.claims
    .filter((claim) => claim.targetId === entity.id)
    .flatMap((claim) => contributionsForClaim(role, claim, config, features))
    .sort(compareContributions);
  return {
    orisaId: entity.id,
    displayName: entity.canonicalName,
    rawScore: contributions.reduce((total, item) => total + item.amount, 0),
    normalizedScore: 0,
    evidenceBreadth: new Set(contributions.map(({ schoolId }) => schoolId)).size,
    contributions,
  };
}

function contributionsForClaim(
  role: RegencyRole,
  claim: RegencyMatrix["claims"][number],
  config: RegencyScoringConfig,
  features: ScorableFeature[],
): RegencyContribution[] {
  const applicableRules = config.rules.filter(
    (rule) => rule.role === role && rule.claimFactor === claim.factor,
  );
  return applicableRules.flatMap((rule) =>
    features
      .filter((feature) => matches(rule, claim, feature))
      .map((feature) => contribution(rule, claim, feature)),
  );
}

function compareContributions(left: RegencyContribution, right: RegencyContribution): number {
  return `${left.claimId}:${left.featureKey}:${left.ruleId}`.localeCompare(
    `${right.claimId}:${right.featureKey}:${right.ruleId}`,
  );
}

function matches(
  rule: RegencyScoringConfig["rules"][number],
  claim: RegencyMatrix["claims"][number],
  feature: ScorableFeature,
): boolean {
  if (feature.category !== rule.featureCategory) return false;
  if (rule.featureKeyPrefix !== undefined && !feature.key.startsWith(rule.featureKeyPrefix))
    return false;
  if (
    rule.temporalScope !== undefined &&
    "scope" in feature &&
    feature.scope !== rule.temporalScope
  )
    return false;
  if (
    claim.evidenceTrack === "numerological_mapping" &&
    (!("lensId" in feature) || feature.lensId !== claim.lensId)
  )
    return false;
  if (rule.matchMode === "planetary_resonance") return claim.values.includes(feature.value);
  if (rule.claimFactor === "planet")
    return "body" in feature && feature.body !== undefined && claim.values.includes(feature.body);
  return claim.values.includes(feature.value);
}

function contribution(
  rule: RegencyScoringConfig["rules"][number],
  claim: RegencyMatrix["claims"][number],
  feature: ScorableFeature,
): RegencyContribution {
  const evidenceMultiplier =
    claim.evidenceTrack === "derived_symbolic_hypothesis" ? claim.convergenceStrength : 1;
  return {
    ruleId: rule.id,
    claimId: claim.id,
    schoolId: claim.schoolId,
    featureKey: feature.key,
    amount: rule.weight * ("strength" in feature ? feature.strength : 1) * evidenceMultiplier,
    evidenceMultiplier,
    evidenceTrack: claim.evidenceTrack,
    structuralSourceIds: [...rule.structuralSourceIds].sort((left, right) =>
      left.localeCompare(right),
    ),
    ...(claim.manifestation === undefined ? {} : { facetId: claim.manifestation.facetId }),
  };
}

function compareCandidates(left: RegencyCandidateScore, right: RegencyCandidateScore): number {
  return (
    right.rawScore - left.rawScore ||
    right.evidenceBreadth - left.evidenceBreadth ||
    strongest(right) - strongest(left) ||
    left.orisaId.localeCompare(right.orisaId)
  );
}

function strongest(candidate: RegencyCandidateScore): number {
  return Math.max(0, ...candidate.contributions.map(({ amount }) => amount));
}

type UnresolvedReason =
  | "insufficient_score"
  | "insufficient_evidence_breadth"
  | "distinct_candidate_unavailable"
  | "tradition_confirmation_required";

function selectAvailableTriad(
  rankings: Record<RegencyRole, RegencyCandidateScore[]>,
  minimums: RegencyScoringConfig["selectionMinimums"],
): Pick<RegencyScoringResult, "triad" | "unresolvedRoles"> {
  const eligible = Object.fromEntries(
    roleSchema.options.map((role) => [
      role,
      rankings[role].filter(
        (candidate) =>
          candidate.rawScore >= minimums[role].minimumRawScore &&
          candidate.evidenceBreadth >= minimums[role].minimumEvidenceBreadth,
      ),
    ]),
  ) as Record<RegencyRole, RegencyCandidateScore[]>;
  const confirmationRequired = Object.fromEntries(
    roleSchema.options.map((role) => [role, hasSubstantiveTie(eligible[role])]),
  ) as Record<RegencyRole, boolean>;
  for (const role of roleSchema.options) {
    if (confirmationRequired[role]) eligible[role] = [];
  }
  const best = findBestTriad(eligible);
  if (best === undefined) throw new RangeError("Não foi possível avaliar os papéis de regência.");
  const triad = { front: best.ids[0], head: best.ids[1], back: best.ids[2] };
  const unresolvedRoles = Object.fromEntries(
    roleSchema.options.flatMap((role) => {
      if (triad[role] !== null) return [];
      const top = rankings[role][0];
      const reason = unresolvedReason(role, top, confirmationRequired, minimums);
      return [
        [
          role,
          {
            reason,
            bestRawScore: top?.rawScore ?? 0,
            bestEvidenceBreadth: top?.evidenceBreadth ?? 0,
          },
        ],
      ];
    }),
  );
  return { triad, unresolvedRoles };
}

type TriadCandidate = {
  ids: [string | null, string | null, string | null];
  score: number;
  breadth: number;
};

function findBestTriad(eligible: Record<RegencyRole, RegencyCandidateScore[]>): TriadCandidate {
  let best: TriadCandidate | undefined;
  for (const front of [...eligible.front, null]) {
    for (const head of [...eligible.head, null]) {
      if (front?.orisaId === head?.orisaId && front !== null) continue;
      best = evaluateBackCandidates(front, head, eligible.back, best);
    }
  }
  if (best === undefined) throw new RangeError("Não foi possível avaliar os papéis de regência.");
  return best;
}

function evaluateBackCandidates(
  front: RegencyCandidateScore | null,
  head: RegencyCandidateScore | null,
  backs: RegencyCandidateScore[],
  currentBest: TriadCandidate | undefined,
): TriadCandidate | undefined {
  let best = currentBest;
  for (const back of [...backs, null]) {
    if (back !== null && (back.orisaId === front?.orisaId || back.orisaId === head?.orisaId))
      continue;
    const candidate = triadCandidate(front, head, back);
    if (best === undefined || compareTriads(candidate, best) < 0) best = candidate;
  }
  return best;
}

function triadCandidate(
  front: RegencyCandidateScore | null,
  head: RegencyCandidateScore | null,
  back: RegencyCandidateScore | null,
): TriadCandidate {
  return {
    ids: [front?.orisaId ?? null, head?.orisaId ?? null, back?.orisaId ?? null],
    score: (front?.rawScore ?? 0) + (head?.rawScore ?? 0) + (back?.rawScore ?? 0),
    breadth:
      (front?.evidenceBreadth ?? 0) + (head?.evidenceBreadth ?? 0) + (back?.evidenceBreadth ?? 0),
  };
}

function unresolvedReason(
  role: RegencyRole,
  top: RegencyCandidateScore | undefined,
  confirmationRequired: Record<RegencyRole, boolean>,
  minimums: RegencyScoringConfig["selectionMinimums"],
): UnresolvedReason {
  if (confirmationRequired[role]) return "tradition_confirmation_required";
  if ((top?.rawScore ?? 0) < minimums[role].minimumRawScore) return "insufficient_score";
  if ((top?.evidenceBreadth ?? 0) < minimums[role].minimumEvidenceBreadth)
    return "insufficient_evidence_breadth";
  return "distinct_candidate_unavailable";
}

function hasSubstantiveTie(candidates: RegencyCandidateScore[]): boolean {
  const [first, second] = candidates;
  if (first === undefined || second === undefined) return false;
  return (
    first.rawScore === second.rawScore &&
    first.evidenceBreadth === second.evidenceBreadth &&
    strongest(first) === strongest(second)
  );
}

function compareTriads(left: TriadCandidate, right: TriadCandidate): number {
  return (
    right.score - left.score ||
    right.breadth - left.breadth ||
    left.ids
      .map((id) => id ?? "~")
      .join(":")
      .localeCompare(right.ids.map((id) => id ?? "~").join(":"))
  );
}
