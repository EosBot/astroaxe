import { describe, expect, it } from "vitest";

import { extractRegencyNumerologicalFeatures } from "./numerology";
import { numerologyResearchMatrix } from "./numerology-matrix";
import { scoreRegencies } from "./scorer";
import { regencyV2Config } from "./v2-config";

describe("numerological research matrix", () => {
  it("keeps the editorial mapping in its own evidence track and school", () => {
    const claims = numerologyResearchMatrix.claims.filter(
      (claim) => claim.evidenceTrack === "numerological_mapping",
    );

    expect(claims).toHaveLength(32);
    expect(new Set(claims.map(({ schoolId }) => schoolId))).toEqual(
      new Set(["astrocentro-date-sum-2026"]),
    );
    expect(claims.find(({ id }) => id.endsWith(":8:oxala"))?.manifestation?.facetId).toBe(
      "oxaguian",
    );
  });

  it("adds an explainable numerological contribution without replacing the baseline matrix", () => {
    const result = scoreRegencies({
      matrix: numerologyResearchMatrix,
      config: regencyV2Config,
      astrologicalFeatures: [],
      numerologicalFeatures: extractRegencyNumerologicalFeatures({ birthDate: "1989-12-16" }),
    });

    const head = result.rankingsByRole.head[0];
    expect(head?.orisaId).toBe("orisa:oxala");
    expect(head?.rawScore).toBe(2);
    expect(head?.contributions).toEqual([
      expect.objectContaining({
        evidenceTrack: "numerological_mapping",
        featureKey: "numerology:date-digit-sum-1-16-repeated:10",
        schoolId: "astrocentro-date-sum-2026",
      }),
    ]);
    expect(numerologyResearchMatrix.version).not.toBe("regency-matrix-0.1.0-research");
  });
});
