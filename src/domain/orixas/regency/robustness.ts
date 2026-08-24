import type { RegencyMatrix } from "./contracts";
import type { RegencyAstrologicalFeature } from "./features";
import { scoreRegencies, type RegencyRole, type RegencyScoringConfig } from "./scorer";
import type { RegencyTemporalFeature } from "./temporal";

export const REGENCY_ROBUSTNESS_VERSION = "regency-robustness-0.1.0-beta";

export interface RegencyRoleRobustness {
  eligible: boolean;
  schoolCount: number;
  perturbationCount: number;
  topCandidateRetention: number;
  selectedCandidateRetention: number | null;
}

/**
 * Mede sensibilidade a uma família de evidência dominante. Cada execução remove
 * uma escola pública da matriz e repete o cálculo sem alterar pesos ou inputs.
 */
export function assessRegencyRobustness(input: {
  matrix: RegencyMatrix;
  config: RegencyScoringConfig;
  astrologicalFeatures: RegencyAstrologicalFeature[];
  temporalFeatures?: RegencyTemporalFeature[];
}): { version: string; roles: Record<RegencyRole, RegencyRoleRobustness> } {
  const baseline = scoreRegencies(input);
  const schools = [...new Set(input.matrix.claims.map(({ schoolId }) => schoolId))].sort((a, b) =>
    a.localeCompare(b),
  );
  const perturbations =
    schools.length < 2
      ? []
      : schools.map((schoolId) =>
          scoreRegencies({
            ...input,
            matrix: {
              ...input.matrix,
              claims: input.matrix.claims.filter((claim) => claim.schoolId !== schoolId),
            },
          }),
        );
  const roles = Object.fromEntries(
    (["front", "head", "back"] as const).map((role) => {
      const top = baseline.rankingsByRole[role][0]?.orisaId;
      const selected = baseline.triad[role];
      const retention = (candidate: string | null | undefined): number =>
        candidate === null || candidate === undefined || perturbations.length === 0
          ? 0
          : perturbations.filter((result) => result.rankingsByRole[role][0]?.orisaId === candidate)
              .length / perturbations.length;
      return [
        role,
        {
          eligible: schools.length >= 2,
          schoolCount: schools.length,
          perturbationCount: perturbations.length,
          topCandidateRetention: retention(top),
          selectedCandidateRetention: selected === null ? null : retention(selected),
        },
      ];
    }),
  ) as Record<RegencyRole, RegencyRoleRobustness>;
  return { version: REGENCY_ROBUSTNESS_VERSION, roles };
}
