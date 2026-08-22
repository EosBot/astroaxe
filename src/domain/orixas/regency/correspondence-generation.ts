import { z } from "zod";

import type { RegencyEntity } from "./contracts";

export const SYMBOLIC_CORRESPONDENCE_GENERATOR_VERSION =
  "symbolic-correspondence-generator-0.2.0-research";

const factorSchema = z.enum(["planet", "zodiac_sign", "element", "modality", "house"]);

export const extractedSymbolicAttributeSchema = z
  .object({
    id: z.string().regex(/^attribute:[a-z0-9-:]+$/),
    targetId: z.string().regex(/^orisa:[a-z0-9-]+$/),
    axis: z.enum([
      "natural_domain",
      "social_function",
      "mythic_motif",
      "material_symbol",
      "movement_quality",
      "temporal_quality",
    ]),
    value: z.string().regex(/^[a-z0-9-]+$/),
    traditionId: z.string().trim().min(1).max(120),
    sourceIds: z
      .array(z.string().regex(/^source:[a-z0-9-:]+$/))
      .min(1)
      .max(8),
    status: z.literal("extracted_for_review"),
  })
  .strict();

export const symbolicDerivationRuleSchema = z
  .object({
    id: z.string().regex(/^derivation:[a-z0-9-:]+$/),
    requiredAttributeValues: z
      .array(z.string().regex(/^[a-z0-9-]+$/))
      .min(1)
      .max(8),
    factor: factorSchema,
    values: z
      .array(z.string().regex(/^[a-z0-9-]+$/))
      .min(1)
      .max(8),
    rationale: z.string().trim().min(1).max(500),
    structuralSourceIds: z
      .array(z.string().regex(/^source:[a-z0-9-:]+$/))
      .min(1)
      .max(8),
    status: z.literal("authorial_hypothesis"),
  })
  .strict()
  .refine(
    ({ requiredAttributeValues }) =>
      new Set(requiredAttributeValues).size === requiredAttributeValues.length,
    { message: "A regra não pode repetir um atributo obrigatório." },
  );

export const generatedCorrespondenceSchema = z
  .object({
    id: z.string().regex(/^generated:[a-z0-9-:]+$/),
    targetId: z.string().regex(/^orisa:[a-z0-9-]+$/),
    factor: factorSchema,
    values: z
      .array(z.string().regex(/^[a-z0-9-]+$/))
      .min(1)
      .max(8),
    attributeClaimIds: z
      .array(z.string().regex(/^attribute:[a-z0-9-:]+$/))
      .min(1)
      .max(8),
    derivationRuleId: z.string().regex(/^derivation:[a-z0-9-:]+$/),
    culturalSourceIds: z.array(z.string()).min(1).max(8),
    structuralSourceIds: z.array(z.string()).min(1).max(8),
    rationale: z.string().trim().min(1).max(500),
    derivationKind: z.enum(["single_attribute", "composite_convergence"]),
    convergenceStrength: z.number().min(0).max(1),
    evidenceTrack: z.literal("derived_symbolic_hypothesis"),
    generatorVersion: z.literal(SYMBOLIC_CORRESPONDENCE_GENERATOR_VERSION),
    status: z.literal("candidate"),
  })
  .strict();

export type ExtractedSymbolicAttribute = z.infer<typeof extractedSymbolicAttributeSchema>;
export type SymbolicDerivationRule = z.infer<typeof symbolicDerivationRuleSchema>;
export type GeneratedCorrespondence = z.infer<typeof generatedCorrespondenceSchema>;

export function generateSymbolicCorrespondences(input: {
  entities: RegencyEntity[];
  attributes: ExtractedSymbolicAttribute[];
  rules: SymbolicDerivationRule[];
}): GeneratedCorrespondence[] {
  const eligibleIds = new Set(
    input.entities.filter(({ eligibleForRegency }) => eligibleForRegency).map(({ id }) => id),
  );
  const attributes = input.attributes.map((attribute) =>
    extractedSymbolicAttributeSchema.parse(attribute),
  );
  const rules = input.rules.map((rule) => symbolicDerivationRuleSchema.parse(rule));
  const ruleIds = new Set<string>();
  for (const rule of rules) {
    if (ruleIds.has(rule.id)) throw new RangeError(`Duplicate derivation rule: ${rule.id}`);
    ruleIds.add(rule.id);
  }
  const attributeIds = new Set<string>();
  for (const attribute of attributes) {
    if (!eligibleIds.has(attribute.targetId))
      throw new RangeError(`Attribute target is not an eligible Orixa: ${attribute.targetId}`);
    if (attributeIds.has(attribute.id))
      throw new RangeError(`Duplicate attribute: ${attribute.id}`);
    attributeIds.add(attribute.id);
  }

  return [...eligibleIds]
    .flatMap((targetId) => generateForTarget(targetId, attributes, rules))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function generateForTarget(
  targetId: string,
  attributes: ExtractedSymbolicAttribute[],
  rules: SymbolicDerivationRule[],
): GeneratedCorrespondence[] {
  const targetAttributes = attributes.filter((attribute) => attribute.targetId === targetId);
  const byValue = new Map(targetAttributes.map((attribute) => [attribute.value, attribute]));
  return rules.flatMap((rule) => {
    const matched = rule.requiredAttributeValues.flatMap((value) => {
      const attribute = byValue.get(value);
      return attribute === undefined ? [] : [attribute];
    });
    if (matched.length !== rule.requiredAttributeValues.length) return [];
    const culturalSourceIds = [...new Set(matched.flatMap(({ sourceIds }) => sourceIds))].sort(
      (left, right) => left.localeCompare(right),
    );
    const axes = new Set(matched.map(({ axis }) => axis));
    const convergenceStrength = Number(
      Math.min(0.9, 0.35 + (matched.length - 1) * 0.2 + (axes.size - 1) * 0.05).toFixed(2),
    );
    return [
      generatedCorrespondenceSchema.parse({
        id: `generated:${targetId.slice(6)}:${rule.id.slice(11)}`,
        targetId,
        factor: rule.factor,
        values: rule.values,
        attributeClaimIds: matched
          .map(({ id }) => id)
          .sort((left, right) => left.localeCompare(right)),
        derivationRuleId: rule.id,
        culturalSourceIds,
        structuralSourceIds: rule.structuralSourceIds,
        rationale: rule.rationale,
        derivationKind: matched.length === 1 ? "single_attribute" : "composite_convergence",
        convergenceStrength,
        evidenceTrack: "derived_symbolic_hypothesis",
        generatorVersion: SYMBOLIC_CORRESPONDENCE_GENERATOR_VERSION,
        status: "candidate",
      }),
    ];
  });
}

export function generatedCoverage(input: {
  entities: RegencyEntity[];
  correspondences: GeneratedCorrespondence[];
}): { coveredCandidateIds: string[]; uncoveredCandidateIds: string[] } {
  const generatedTargets = new Set(input.correspondences.map(({ targetId }) => targetId));
  const eligibleIds = input.entities
    .filter(({ eligibleForRegency }) => eligibleForRegency)
    .map(({ id }) => id)
    .sort((left, right) => left.localeCompare(right));
  return {
    coveredCandidateIds: eligibleIds.filter((id) => generatedTargets.has(id)),
    uncoveredCandidateIds: eligibleIds.filter((id) => !generatedTargets.has(id)),
  };
}

export interface GeneratedCorrespondenceReport {
  candidateCount: number;
  compositeCount: number;
  coverage: ReturnType<typeof generatedCoverage>;
  candidatesByTarget: Record<string, number>;
  divergentFactorsByTarget: Record<string, string[]>;
}

export function analyzeGeneratedCorrespondences(input: {
  entities: RegencyEntity[];
  correspondences: GeneratedCorrespondence[];
}): GeneratedCorrespondenceReport {
  const correspondences = input.correspondences.map((item) =>
    generatedCorrespondenceSchema.parse(item),
  );
  const candidatesByTarget: Record<string, number> = {};
  const valueSetsByTargetFactor = new Map<string, Set<string>>();
  for (const item of correspondences) {
    candidatesByTarget[item.targetId] = (candidatesByTarget[item.targetId] ?? 0) + 1;
    const key = `${item.targetId}|${item.factor}`;
    const valueSets = valueSetsByTargetFactor.get(key) ?? new Set<string>();
    valueSets.add([...item.values].sort((left, right) => left.localeCompare(right)).join("+"));
    valueSetsByTargetFactor.set(key, valueSets);
  }
  const divergentFactorsByTarget: Record<string, string[]> = {};
  for (const [key, valueSets] of valueSetsByTargetFactor) {
    if (valueSets.size < 2) continue;
    const [targetId, factor] = key.split("|");
    if (targetId === undefined || factor === undefined) continue;
    const factors = divergentFactorsByTarget[targetId] ?? [];
    factors.push(factor);
    divergentFactorsByTarget[targetId] = factors;
  }
  for (const factors of Object.values(divergentFactorsByTarget))
    factors.sort((left, right) => left.localeCompare(right));
  return {
    candidateCount: correspondences.length,
    compositeCount: correspondences.filter(
      ({ derivationKind }) => derivationKind === "composite_convergence",
    ).length,
    coverage: generatedCoverage({ entities: input.entities, correspondences }),
    candidatesByTarget: Object.fromEntries(
      Object.entries(candidatesByTarget).sort(([left], [right]) => left.localeCompare(right)),
    ),
    divergentFactorsByTarget: Object.fromEntries(
      Object.entries(divergentFactorsByTarget).sort(([left], [right]) => left.localeCompare(right)),
    ),
  };
}
