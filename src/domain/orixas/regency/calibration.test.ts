import { describe, expect, it } from "vitest";

import { evaluateRegencyConfig, type RegencyEvaluationCase } from "./calibration";
import { regencyMatrix } from "./matrix";
import { regencyResearchConfig } from "./research-config";

const minimalFeatures = [
  {
    key: "planet:sun:sign:leo",
    category: "planet_sign" as const,
    value: "leo",
    body: "sun",
    strength: 1,
    requiresBirthTime: false,
  },
];

describe("regency configuration evaluation", () => {
  it("reports role, exact-triad and confusion metrics only for the selected partition", () => {
    const predicted = { head: "orisa:oxala" };
    const cases: RegencyEvaluationCase[] = [
      evaluationCase("case:aaaaaaaaaaaaaaaa", "calibration", predicted),
      evaluationCase("case:bbbbbbbbbbbbbbbb", "validation", predicted),
      evaluationCase("case:cccccccccccccccc", "validation", {
        ...predicted,
        head: "orisa:xango",
      }),
    ];
    const result = evaluateRegencyConfig({
      matrix: regencyMatrix,
      config: regencyResearchConfig,
      datasetVersion: "synthetic-1",
      cases,
      partition: "validation",
    });

    expect(result.sampleSize).toBe(2);
    expect(result.metricsByRole).toMatchObject({
      front: { sampleSize: 0, accuracy: null, confidenceInterval95: null },
      head: {
        sampleSize: 2,
        accuracy: 0.5,
        top3Accuracy: 0.5,
        unresolvedCount: 0,
        unresolvedRate: 0,
      },
      back: { sampleSize: 0, accuracy: null, confidenceInterval95: null },
    });
    expect(result.metricsByRole.head.confidenceInterval95).toEqual({
      lower: expect.closeTo(0.0945, 3),
      upper: expect.closeTo(0.9055, 3),
    });
    expect(result.exactTriad).toEqual({
      sampleSize: 0,
      accuracy: null,
      confidenceInterval95: null,
    });
    expect(result.confusionByRole.head["orisa:xango"]?.["orisa:oxala"]).toBe(1);
    expect(result.strata.byTimeQuality.unknown).toMatchObject({
      sampleSize: 2,
      labelCount: 2,
      knownRoleAccuracy: 0.5,
    });
    expect(result.strata.byTemporalMethod.not_applicable).toMatchObject({
      sampleSize: 2,
      labelCount: 2,
      knownRoleAccuracy: 0.5,
    });
    expect(result.strata.byTemporalMethod.equinoctial_local_solar_proxy).toEqual({
      sampleSize: 0,
      labelCount: 0,
      knownRoleAccuracy: null,
      confidenceInterval95: null,
    });
    expect(result.strata.byProvenance.synthetic).toMatchObject({
      sampleSize: 2,
      labelCount: 2,
      knownRoleAccuracy: 0.5,
    });
  });

  it("refuses evaluation of an empty partition", () => {
    expect(() =>
      evaluateRegencyConfig({
        matrix: regencyMatrix,
        config: regencyResearchConfig,
        datasetVersion: "synthetic-1",
        cases: [
          evaluationCase("case:aaaaaaaaaaaaaaaa", "calibration", {
            front: "orisa:exu",
            head: "orisa:oxala",
            back: "orisa:ogum",
          }),
        ],
        partition: "validation",
      }),
    ).toThrow("Não há casos na partição validation.");
  });

  it("rejects evidence leakage between calibration and validation", () => {
    expect(() =>
      evaluateRegencyConfig({
        matrix: regencyMatrix,
        config: regencyResearchConfig,
        datasetVersion: "leakage-1",
        cases: [
          evaluationCase("case:aaaaaaaaaaaaaaaa", "calibration", { head: "orisa:oxala" }),
          {
            ...evaluationCase("case:bbbbbbbbbbbbbbbb", "validation", { head: "orisa:oxala" }),
            evidenceFingerprint: "a".repeat(64),
          },
        ],
        partition: "validation",
      }),
    ).toThrow("A mesma cadeia de evidência não pode atravessar calibração e validação.");
  });

  it("scores partial public labels without inventing the missing roles", () => {
    const result = evaluateRegencyConfig({
      matrix: regencyMatrix,
      config: regencyResearchConfig,
      datasetVersion: "partial-1",
      cases: [
        {
          ...evaluationCase("case:dddddddddddddddd", "validation", {
            head: "orisa:oxala",
          }),
        },
      ],
      partition: "validation",
    });

    expect(result.metricsByRole).toMatchObject({
      front: { sampleSize: 0, accuracy: null },
      head: { sampleSize: 1, accuracy: 1, top3Accuracy: 1 },
      back: { sampleSize: 0, accuracy: null },
    });
    expect(result.exactTriad).toEqual({
      sampleSize: 0,
      accuracy: null,
      confidenceInterval95: null,
    });
  });

  it("measures public unordered Orixá sets without assigning a role", () => {
    const result = evaluateRegencyConfig({
      matrix: regencyMatrix,
      config: regencyResearchConfig,
      datasetVersion: "unordered-public-1",
      cases: [
        evaluationCase("case:eeeeeeeeeeeeeeee", "validation", {
          anyOf: ["orisa:oxala"],
        }),
      ],
      partition: "validation",
    });

    expect(result.metricsByRole.head.sampleSize).toBe(0);
    expect(result.exactTriad.sampleSize).toBe(0);
    expect(result.unorderedLabels).toMatchObject({
      sampleSize: 1,
      labelCount: 1,
      selectedTriadCoverage: 1,
      top3AnyRoleCoverage: 1,
    });
  });
});

function evaluationCase(
  caseId: string,
  partition: "calibration" | "validation",
  expected: RegencyEvaluationCase["expected"],
): RegencyEvaluationCase {
  return {
    caseId,
    evidenceFingerprint: (partition === "calibration" ? "a" : "b").repeat(64),
    partition,
    provenance: "synthetic",
    timeQuality: "unknown",
    temporalMethod: "not_applicable",
    expected,
    astrologicalFeatures: minimalFeatures,
  };
}
