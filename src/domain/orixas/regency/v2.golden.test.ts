import { describe, expect, it } from "vitest";

import { extractRegencyNumerologicalFeatures } from "./numerology";
import { assessRegencyRobustness } from "./robustness";
import { scoreRegencies } from "./scorer";
import { regencyV2Config } from "./v2-config";
import { regencyV2Matrix, REGENCY_V2_MATRIX_VERSION } from "./v2-matrix";

describe("regency v2 research golden case", () => {
  const input = {
    matrix: regencyV2Matrix,
    config: regencyV2Config,
    astrologicalFeatures: [],
    numerologicalFeatures: extractRegencyNumerologicalFeatures({ birthDate: "1989-12-16" }),
  };

  it("freezes the composed matrix and lens-aware score", () => {
    const result = scoreRegencies(input);
    expect(result.configVersion).toBe("regency-weights-0.1.0-v2-research");
    expect(regencyV2Matrix.version).toBe(REGENCY_V2_MATRIX_VERSION);
    expect(result.rankingsByRole.head[0]).toMatchObject({ orisaId: "orisa:oxala", rawScore: 2 });
    expect(result.rankingsByRole.head[0]?.contributions).toHaveLength(1);
  });

  it("runs leave-one-school-out with numerological features", () => {
    const result = assessRegencyRobustness(input);
    expect(result.roles.head.eligible).toBe(true);
    expect(result.roles.head.perturbationCount).toBe(result.roles.head.schoolCount);
  });
});
