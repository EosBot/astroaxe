import { regencyMatrixSchema, type RegencyMatrix } from "./contracts";
import { correspondenceResearchSources } from "./correspondence-research-sources";
import { regencyMatrix } from "./matrix";
import { generatedSymbolicCorrespondences } from "./symbolic-catalog";

export const EXPERIMENTAL_REGENCY_MATRIX_VERSION = "regency-matrix-0.2.0-derived-research";

export const experimentalRegencyMatrix: RegencyMatrix = regencyMatrixSchema.parse({
  ...regencyMatrix,
  version: EXPERIMENTAL_REGENCY_MATRIX_VERSION,
  sources: [
    ...regencyMatrix.sources,
    ...correspondenceResearchSources.map((source) => ({
      id: source.id,
      title: source.title,
      url: source.url,
      locator: "Inventário de atributos culturais para revisão",
      evidenceKind: evidenceKind(source.publisherType),
    })),
  ],
  claims: [
    ...regencyMatrix.claims,
    ...generatedSymbolicCorrespondences.map((candidate) => ({
      id: `claim:${candidate.id}`,
      targetId: candidate.targetId,
      schoolId: "astroaxe-symbolic-generation",
      factor: candidate.factor,
      values: candidate.values,
      evidenceTrack: candidate.evidenceTrack,
      sourceIds: candidate.culturalSourceIds,
      attributeClaimIds: candidate.attributeClaimIds,
      derivationRuleId: candidate.derivationRuleId,
      convergenceStrength: candidate.convergenceStrength,
      algorithmWeight: null,
    })),
  ],
});

function evidenceKind(
  publisherType: (typeof correspondenceResearchSources)[number]["publisherType"],
): RegencyMatrix["sources"][number]["evidenceKind"] {
  if (publisherType === "practitioner_or_community") return "community_primary";
  if (publisherType === "museum_or_cultural_institute") return "institutional_inventory";
  return "scholarly_analysis";
}
