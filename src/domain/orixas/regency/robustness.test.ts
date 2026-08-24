import { describe, expect, it } from "vitest";

import { regencyMatrix } from "./matrix";
import { regencyResearchConfig } from "./research-config";
import { assessRegencyRobustness, REGENCY_ROBUSTNESS_VERSION } from "./robustness";

describe("regency robustness", () => {
  it("repeats the score after leaving each evidence school out", () => {
    const result = assessRegencyRobustness({
      matrix: regencyMatrix,
      config: regencyResearchConfig,
      astrologicalFeatures: [
        {
          key: "planet:sun:sign:gemini",
          category: "planet_sign",
          value: "gemini",
          body: "sun",
          strength: 1,
          requiresBirthTime: false,
        },
      ],
    });

    expect(result.version).toBe(REGENCY_ROBUSTNESS_VERSION);
    expect(result.roles.front.schoolCount).toBeGreaterThanOrEqual(2);
    expect(result.roles.front.perturbationCount).toBe(result.roles.front.schoolCount);
    expect(result.roles.front.topCandidateRetention).toBeGreaterThanOrEqual(0);
    expect(result.roles.front.topCandidateRetention).toBeLessThanOrEqual(1);
  });

  it("marks a matrix with too few independent schools as ineligible", () => {
    const result = assessRegencyRobustness({
      matrix: { ...regencyMatrix, claims: regencyMatrix.claims.slice(0, 1) },
      config: regencyResearchConfig,
      astrologicalFeatures: [],
    });

    expect(result.roles.head.eligible).toBe(false);
  });
});
