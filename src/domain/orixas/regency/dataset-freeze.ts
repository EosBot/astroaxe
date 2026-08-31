import { createHash } from "node:crypto";

import { canonicalize } from "@/domain/canonical-json";

import {
  regencyEvaluationDatasetSchema,
  type RegencyEvaluationDataset,
  type RegencyEvaluationResult,
} from "./calibration";
import type { RegencyRole } from "./scorer";

export const REGENCY_COMPARISON_VERSION = "regency-comparison-0.1.0";

export const regencyPromotionPolicy = {
  version: "regency-promotion-policy-0.1.0-research",
  minimumValidationLabels: { front: 30, head: 30, back: 30 },
  requiredRoles: ["front", "head"] as const,
  minimumTop1Gain: 0,
  minimumTop3Gain: 0,
  maximumUnresolvedRateIncrease: 0.05,
} as const;

export interface RegencyDatasetManifest {
  datasetVersion: string;
  datasetFingerprint: string;
  totalCases: number;
  partitionCounts: Record<"calibration" | "validation", number>;
  provenanceCounts: Record<RegencyEvaluationDataset["cases"][number]["provenance"], number>;
}

export interface RegencyPromotionAssessment {
  comparisonVersion: string;
  policyVersion: string;
  decision: "insufficient_evidence" | "eligible_for_cultural_review" | "not_eligible";
  roles: Record<
    RegencyRole,
    {
      sampleSize: number;
      status: "insufficient_sample" | "passes" | "fails" | "not_required";
      top1Gain: number | null;
      top3Gain: number | null;
      unresolvedRateIncrease: number | null;
    }
  >;
}

export function createRegencyDatasetManifest(rawDataset: unknown): RegencyDatasetManifest {
  const dataset = regencyEvaluationDatasetSchema.parse(rawDataset);
  return {
    datasetVersion: dataset.version,
    datasetFingerprint: createHash("sha256").update(canonicalDataset(dataset)).digest("hex"),
    totalCases: dataset.cases.length,
    partitionCounts: countValues(dataset.cases, "partition", ["calibration", "validation"]),
    provenanceCounts: countValues(dataset.cases, "provenance", [
      "authorized_practitioner",
      "public_self_disclosure",
      "synthetic",
    ]),
  };
}

export function assessRegencyPromotion(input: {
  baseline: RegencyEvaluationResult;
  experimental: RegencyEvaluationResult;
}): RegencyPromotionAssessment {
  if (
    input.baseline.partition !== "validation" ||
    input.experimental.partition !== "validation" ||
    input.baseline.datasetVersion !== input.experimental.datasetVersion
  )
    throw new RangeError("A promoção exige a mesma partição de validação e versão de dataset.");

  const roles = Object.fromEntries(
    (["front", "head", "back"] as const).map((role) => {
      const baseline = input.baseline.metricsByRole[role];
      const experimental = input.experimental.metricsByRole[role];
      const sampleSize = experimental.sampleSize;
      const required = regencyPromotionPolicy.requiredRoles.includes(role as "front" | "head");
      if (sampleSize < regencyPromotionPolicy.minimumValidationLabels[role])
        return [
          role,
          {
            sampleSize,
            status: required ? "insufficient_sample" : "not_required",
            top1Gain: metricDelta(experimental.accuracy, baseline.accuracy),
            top3Gain: metricDelta(experimental.top3Accuracy, baseline.top3Accuracy),
            unresolvedRateIncrease: metricDelta(
              experimental.unresolvedRate,
              baseline.unresolvedRate,
            ),
          },
        ];
      const top1Gain = metricDelta(experimental.accuracy, baseline.accuracy);
      const top3Gain = metricDelta(experimental.top3Accuracy, baseline.top3Accuracy);
      const unresolvedRateIncrease = metricDelta(
        experimental.unresolvedRate,
        baseline.unresolvedRate,
      );
      const passes =
        top1Gain !== null &&
        top1Gain >= regencyPromotionPolicy.minimumTop1Gain &&
        top3Gain !== null &&
        top3Gain >= regencyPromotionPolicy.minimumTop3Gain &&
        unresolvedRateIncrease !== null &&
        unresolvedRateIncrease <= regencyPromotionPolicy.maximumUnresolvedRateIncrease;
      return [
        role,
        {
          sampleSize,
          status: passes ? "passes" : "fails",
          top1Gain,
          top3Gain,
          unresolvedRateIncrease,
        },
      ];
    }),
  ) as RegencyPromotionAssessment["roles"];

  const requiredStatuses = regencyPromotionPolicy.requiredRoles.map((role) => roles[role].status);
  let decision: RegencyPromotionAssessment["decision"] = "not_eligible";
  if (requiredStatuses.includes("insufficient_sample")) decision = "insufficient_evidence";
  else if (requiredStatuses.every((status) => status === "passes"))
    decision = "eligible_for_cultural_review";
  return {
    comparisonVersion: REGENCY_COMPARISON_VERSION,
    policyVersion: regencyPromotionPolicy.version,
    decision,
    roles,
  };
}

function canonicalDataset(dataset: RegencyEvaluationDataset): string {
  return JSON.stringify(
    canonicalize({
      ...dataset,
      cases: [...dataset.cases].sort((a, b) => a.caseId.localeCompare(b.caseId)),
    }),
  );
}

function countValues<
  Item extends Record<Key, string>,
  Key extends keyof Item,
  Value extends Item[Key] & string,
>(items: Item[], key: Key, values: readonly Value[]): Record<Value, number> {
  return Object.fromEntries(
    values.map((value) => [value, items.filter((item) => item[key] === value).length]),
  ) as Record<Value, number>;
}

function metricDelta(current: number | null, baseline: number | null): number | null {
  return current === null || baseline === null ? null : current - baseline;
}
