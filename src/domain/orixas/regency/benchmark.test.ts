import { describe, expect, it } from "vitest";

import { runRegencyComparativeBenchmark, runRegencyResearchBenchmark } from "./benchmark";

describe("regency research benchmark", () => {
  it("produces aggregate reports for isolated calibration and validation partitions", () => {
    const result = runRegencyResearchBenchmark({
      version: "synthetic-benchmark-1",
      cases: [
        evaluationCase("case:aaaaaaaaaaaaaaaa", "calibration"),
        evaluationCase("case:bbbbbbbbbbbbbbbb", "validation"),
      ],
    });

    expect(result.calibration).toMatchObject({ partition: "calibration", sampleSize: 1 });
    expect(result.validation).toMatchObject({ partition: "validation", sampleSize: 1 });
    expect(result.calibration.datasetVersion).toBe("synthetic-benchmark-1");
  });

  it("compares the frozen baseline with the composed v2 candidate", () => {
    const result = runRegencyComparativeBenchmark({
      version: "synthetic-benchmark-1",
      cases: [
        evaluationCase("case:aaaaaaaaaaaaaaaa", "calibration"),
        evaluationCase("case:bbbbbbbbbbbbbbbb", "validation"),
      ],
    });

    expect(result.baseline.matrixVersion).toBe("regency-matrix-0.1.0-research");
    expect(result.candidate).toMatchObject({
      matrixVersion: "regency-matrix-0.5.0-v3-questionnaire-research",
      configVersion: "regency-weights-0.3.0-astrology-primary",
    });
    expect(result.candidate.validation.sampleSize).toBe(result.baseline.validation.sampleSize);
    expect(result.dataset).toMatchObject({
      datasetVersion: "synthetic-benchmark-1",
      totalCases: 2,
      partitionCounts: { calibration: 1, validation: 1 },
    });
    expect(result.promotionAssessment.decision).toBe("insufficient_evidence");
  });
});

function evaluationCase(caseId: string, partition: "calibration" | "validation") {
  return {
    caseId,
    evidenceFingerprint: (partition === "calibration" ? "a" : "b").repeat(64),
    partition,
    provenance: "synthetic",
    timeQuality: "unknown",
    temporalMethod: "not_applicable",
    expected: { head: "orisa:oxala" },
    astrologicalFeatures: [
      {
        key: "planet:sun:sign:leo",
        category: "planet_sign",
        value: "leo",
        body: "sun",
        strength: 1,
        requiresBirthTime: false,
      },
    ],
  };
}
