import { describe, expect, it } from "vitest";

import type { RegencyMatrix } from "./contracts";
import type { RegencyAstrologicalFeature } from "./features";
import { scoreRegencies, type RegencyScoringConfig } from "./scorer";
import { astroAxePublicDecisionPolicy } from "./decision-policy";

describe("regency scorer", () => {
  it("keeps contributions explainable and abstains from substantively tied roles", () => {
    const result = scoreRegencies({
      matrix: matrix(),
      config: config(),
      astrologicalFeatures: features(),
    });

    expect(result.triad).toEqual({
      front: "orisa:alpha",
      head: null,
      back: null,
    });
    expect(result.unresolvedRoles).toMatchObject({
      head: { reason: "tradition_confirmation_required" },
      back: { reason: "tradition_confirmation_required" },
    });
    expect(result.rankingsByRole.front[0]).toMatchObject({
      orisaId: "orisa:alpha",
      normalizedScore: 1,
      evidenceBreadth: 2,
    });
    expect(result.rankingsByRole.front[0]?.contributions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          claimId: "claim:alpha:sun:a",
          featureKey: "planet:sun:sign:leo",
        }),
      ]),
    );
  });

  it("uses evidence breadth and stable IDs as deterministic tie-breakers", () => {
    const first = scoreRegencies({
      matrix: matrix(),
      config: config(),
      astrologicalFeatures: features(),
    });
    const second = scoreRegencies({
      matrix: { ...matrix(), claims: [...matrix().claims].reverse() },
      config: { ...config(), rules: [...config().rules].reverse() },
      astrologicalFeatures: [...features()].reverse(),
    });

    expect(second).toEqual(first);
  });

  it("can activate a sourced facet through a planetary reading hour", () => {
    const sourceMatrix = matrix();
    sourceMatrix.claims.push({
      id: "claim:alpha:reading-sun",
      targetId: "orisa:alpha",
      schoolId: "school:ceremonial-structure",
      factor: "planet",
      values: ["sun"],
      evidenceTrack: "published_correspondence",
      sourceId: "source:test",
      algorithmWeight: null,
      manifestation: { facetId: "sovereign", label: "Soberana", description: "Faceta sintética." },
    });
    const temporalConfig: RegencyScoringConfig = {
      ...config(),
      rules: [
        ...config().rules,
        {
          id: "front-reading-hour",
          role: "front",
          claimFactor: "planet",
          featureCategory: "planetary_hour",
          matchMode: "planetary_resonance",
          temporalScope: "reading",
          weight: 3,
          structuralSourceIds: ["source:heptameron"],
        },
      ],
    };
    const result = scoreRegencies({
      matrix: sourceMatrix,
      config: temporalConfig,
      astrologicalFeatures: features(),
      temporalFeatures: [
        {
          key: "reading:planetary-hour:1:sun",
          category: "planetary_hour",
          value: "sun",
          scope: "reading",
        },
      ],
    });

    expect(result.rankingsByRole.front[0]?.contributions).toEqual(
      expect.arrayContaining([expect.objectContaining({ facetId: "sovereign", amount: 3 })]),
    );
  });

  it("leaves the ancestral role unresolved instead of filling it without enough evidence", () => {
    const base = config();
    const result = scoreRegencies({
      matrix: matrix(),
      config: {
        ...base,
        selectionMinimums: {
          ...base.selectionMinimums,
          back: { minimumRawScore: 100, minimumEvidenceBreadth: 1 },
        },
      },
      astrologicalFeatures: features(),
    });

    expect(result.triad.back).toBeNull();
    expect(result.unresolvedRoles.back).toMatchObject({
      reason: "insufficient_score",
      bestRawScore: 2,
    });
  });

  it("requires tradition confirmation instead of resolving a substantive tie by ID", () => {
    const tiedMatrix = matrix();
    tiedMatrix.claims.push({
      id: "claim:beta:sun:a",
      targetId: "orisa:beta",
      schoolId: "school:a",
      factor: "planet",
      values: ["sun"],
      evidenceTrack: "published_correspondence",
      sourceId: "source:test",
      algorithmWeight: null,
    });
    tiedMatrix.claims.push({
      id: "claim:beta:sun:b",
      targetId: "orisa:beta",
      schoolId: "school:b",
      factor: "planet",
      values: ["sun"],
      evidenceTrack: "published_correspondence",
      sourceId: "source:test",
      algorithmWeight: null,
    });
    const result = scoreRegencies({
      matrix: tiedMatrix,
      config: config(),
      astrologicalFeatures: features(),
    });

    expect(result.triad.front).toBeNull();
    expect(result.unresolvedRoles.front?.reason).toBe("tradition_confirmation_required");
    expect(result.decisionPolicyVersion).toBe(astroAxePublicDecisionPolicy.version);
  });
});

function config(): RegencyScoringConfig {
  return {
    version: "test-config-1",
    status: "research",
    decisionPolicy: astroAxePublicDecisionPolicy,
    selectionMinimums: {
      front: { minimumRawScore: 1, minimumEvidenceBreadth: 1 },
      head: { minimumRawScore: 1, minimumEvidenceBreadth: 1 },
      back: { minimumRawScore: 1, minimumEvidenceBreadth: 1 },
    },
    structuralSources: [
      {
        id: "source:heptameron",
        title: "Heptameron",
        url: "https://example.invalid/heptameron",
        locator: "synthetic fixture",
        tradition: "ceremonial",
      },
    ],
    rules: [
      {
        id: "front-planet-sign",
        role: "front",
        claimFactor: "planet",
        featureCategory: "planet_sign",
        weight: 2,
        structuralSourceIds: ["source:heptameron"],
      },
      {
        id: "head-sign",
        role: "head",
        claimFactor: "zodiac_sign",
        featureCategory: "planet_sign",
        weight: 2,
        structuralSourceIds: ["source:heptameron"],
      },
      {
        id: "back-sign",
        role: "back",
        claimFactor: "zodiac_sign",
        featureCategory: "planet_sign",
        weight: 2,
        structuralSourceIds: ["source:heptameron"],
      },
    ],
  };
}

function features(): RegencyAstrologicalFeature[] {
  return [
    {
      key: "planet:sun:sign:leo",
      category: "planet_sign",
      value: "leo",
      body: "sun",
      strength: 1,
      requiresBirthTime: false,
    },
    {
      key: "planet:moon:sign:cancer",
      category: "planet_sign",
      value: "cancer",
      body: "moon",
      strength: 1,
      requiresBirthTime: false,
    },
    {
      key: "planet:mars:sign:aries",
      category: "planet_sign",
      value: "aries",
      body: "mars",
      strength: 1,
      requiresBirthTime: false,
    },
  ];
}

function matrix(): RegencyMatrix {
  const claim = (
    id: string,
    targetId: string,
    schoolId: string,
    factor: "planet" | "zodiac_sign",
    values: string[],
  ) => ({
    id,
    targetId,
    schoolId,
    factor,
    values,
    evidenceTrack: "published_correspondence" as const,
    sourceId: "source:test",
    algorithmWeight: null,
  });
  return {
    version: "test-matrix-1",
    status: "research",
    entities: [
      {
        id: "orisa:alpha",
        kind: "orisa",
        canonicalName: "Alpha",
        aliases: [],
        eligibleForRegency: true,
      },
      {
        id: "orisa:beta",
        kind: "orisa",
        canonicalName: "Beta",
        aliases: [],
        eligibleForRegency: true,
      },
      {
        id: "orisa:gamma",
        kind: "orisa",
        canonicalName: "Gamma",
        aliases: [],
        eligibleForRegency: true,
      },
    ],
    sources: [
      {
        id: "source:test",
        title: "Synthetic source",
        url: "https://example.invalid/source",
        locator: "fixture",
        evidenceKind: "community_primary",
      },
    ],
    claims: [
      claim("claim:alpha:sun:a", "orisa:alpha", "school:a", "planet", ["sun"]),
      claim("claim:alpha:sun:b", "orisa:alpha", "school:b", "planet", ["sun"]),
      claim("claim:beta:moon", "orisa:beta", "school:a", "zodiac_sign", ["cancer"]),
      claim("claim:gamma:mars", "orisa:gamma", "school:a", "zodiac_sign", ["aries"]),
    ],
  };
}
