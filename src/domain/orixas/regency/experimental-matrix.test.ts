import { describe, expect, it } from "vitest";

import type { RegencyAstrologicalFeature } from "./features";
import { experimentalRegencyConfig } from "./experimental-config";
import { experimentalRegencyMatrix } from "./experimental-matrix";
import { eligibleRegencyEntities } from "./matrix";
import { scoreRegencies } from "./scorer";

describe("experimental derived regency matrix", () => {
  it("adds auditable derived claims without removing published claims", () => {
    const derived = experimentalRegencyMatrix.claims.filter(
      ({ evidenceTrack }) => evidenceTrack === "derived_symbolic_hypothesis",
    );
    const targets = new Set(derived.map(({ targetId }) => targetId));

    expect(derived).toHaveLength(112);
    expect(targets.size).toBe(eligibleRegencyEntities().length);
    expect(
      experimentalRegencyMatrix.claims.some(
        ({ evidenceTrack }) => evidenceTrack === "published_correspondence",
      ),
    ).toBe(true);
  });

  it("applies convergence strength only as an explicit derived evidence multiplier", () => {
    const result = scoreRegencies({
      matrix: experimentalRegencyMatrix,
      config: experimentalRegencyConfig,
      astrologicalFeatures: earthFeatures(),
    });
    const onile = result.rankingsByRole.front.find(({ orisaId }) => orisaId === "orisa:onile");
    const derivedContribution = onile?.contributions.find(
      ({ evidenceTrack }) => evidenceTrack === "derived_symbolic_hypothesis",
    );

    expect(derivedContribution).toMatchObject({
      ruleId: "front-derived-element",
      evidenceMultiplier: 0.35,
      amount: 0.7,
    });
    expect(
      result.rankingsByRole.front
        .flatMap(({ contributions }) => contributions)
        .filter(({ evidenceTrack }) => evidenceTrack === "published_correspondence")
        .every(({ evidenceMultiplier }) => evidenceMultiplier === 1),
    ).toBe(true);
  });
});

function earthFeatures(): RegencyAstrologicalFeature[] {
  return [
    {
      key: "angle:ascendant:element:earth",
      category: "element",
      value: "earth",
      strength: 1,
      requiresBirthTime: true,
    },
    {
      key: "angle:imum_coeli:element:earth",
      category: "element",
      value: "earth",
      strength: 1,
      requiresBirthTime: true,
    },
    {
      key: "planet:sun:element:earth",
      category: "element",
      value: "earth",
      body: "sun",
      strength: 1,
      requiresBirthTime: false,
    },
  ];
}
