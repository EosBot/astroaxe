import { describe, expect, it } from "vitest";

import type { RegencyEvaluationResult } from "./calibration";
import {
  assessRegencyPromotion,
  createRegencyDatasetManifest,
  REGENCY_COMPARISON_VERSION,
} from "./dataset-freeze";

describe("regency dataset freeze and promotion assessment", () => {
  it("produces an order-independent fingerprint and detects content changes", () => {
    const first = evaluationCase("case:aaaaaaaaaaaaaaaa", "calibration", "a");
    const second = evaluationCase("case:bbbbbbbbbbbbbbbb", "validation", "b");
    const forward = createRegencyDatasetManifest({ version: "frozen-1", cases: [first, second] });
    const reversed = createRegencyDatasetManifest({ version: "frozen-1", cases: [second, first] });
    const changed = createRegencyDatasetManifest({
      version: "frozen-1",
      cases: [first, { ...second, expected: { head: "orisa:xango" } }],
    });

    expect(forward.datasetFingerprint).toBe(reversed.datasetFingerprint);
    expect(changed.datasetFingerprint).not.toBe(forward.datasetFingerprint);
    expect(forward).toMatchObject({
      totalCases: 2,
      partitionCounts: { calibration: 1, validation: 1 },
      provenanceCounts: { synthetic: 2 },
    });
  });

  it("keeps small samples inconclusive and never promotes automatically", () => {
    const baseline = evaluationResult(10, 0.4, 0.6, 0.1);
    const experimental = evaluationResult(10, 0.6, 0.8, 0.1);

    expect(assessRegencyPromotion({ baseline, experimental })).toMatchObject({
      comparisonVersion: REGENCY_COMPARISON_VERSION,
      decision: "insufficient_evidence",
      roles: {
        front: { status: "insufficient_sample", top1Gain: expect.closeTo(0.2) },
        head: { status: "insufficient_sample", top3Gain: expect.closeTo(0.2) },
        back: { status: "not_required" },
      },
    });
  });

  it("marks sufficient gains only as eligible for cultural review", () => {
    const baseline = evaluationResult(30, 0.4, 0.6, 0.1);
    const experimental = evaluationResult(30, 0.5, 0.7, 0.12);

    expect(assessRegencyPromotion({ baseline, experimental }).decision).toBe(
      "eligible_for_cultural_review",
    );
  });

  it("rejects comparisons from different dataset versions", () => {
    expect(() =>
      assessRegencyPromotion({
        baseline: evaluationResult(30, 0.4, 0.6, 0.1),
        experimental: { ...evaluationResult(30, 0.5, 0.7, 0.1), datasetVersion: "other" },
      }),
    ).toThrow("A promoção exige a mesma partição de validação e versão de dataset.");
  });
});

function evaluationCase(
  caseId: string,
  partition: "calibration" | "validation",
  fingerprintCharacter: string,
) {
  return {
    caseId,
    evidenceFingerprint: fingerprintCharacter.repeat(64),
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

function evaluationResult(
  sampleSize: number,
  accuracy: number,
  top3Accuracy: number,
  unresolvedRate: number,
): RegencyEvaluationResult {
  const metric = {
    sampleSize,
    accuracy,
    confidenceInterval95: { lower: 0, upper: 1 },
    top3Accuracy,
    top3ConfidenceInterval95: { lower: 0, upper: 1 },
    unresolvedCount: Math.round(sampleSize * unresolvedRate),
    unresolvedRate,
  };
  return {
    evaluationVersion: "test",
    datasetVersion: "frozen-1",
    configVersion: "test",
    partition: "validation",
    sampleSize,
    metricsByRole: { front: metric, head: metric, back: metric },
    exactTriad: { sampleSize, accuracy, confidenceInterval95: { lower: 0, upper: 1 } },
    confusionByRole: { front: {}, head: {}, back: {} },
    strata: {
      byTimeQuality: {
        known: stratum(sampleSize, accuracy),
        unknown: stratum(0, null),
      },
      byTemporalMethod: {
        observed_solar: stratum(sampleSize, accuracy),
        equinoctial_local_solar_proxy: stratum(0, null),
        unavailable: stratum(0, null),
        not_applicable: stratum(0, null),
      },
      byProvenance: {
        authorized_practitioner: stratum(sampleSize, accuracy),
        public_self_disclosure: stratum(0, null),
        synthetic: stratum(0, null),
      },
    },
  };
}

function stratum(sampleSize: number, accuracy: number | null) {
  return {
    sampleSize,
    labelCount: sampleSize,
    knownRoleAccuracy: accuracy,
    confidenceInterval95: accuracy === null ? null : { lower: 0, upper: 1 },
  };
}
