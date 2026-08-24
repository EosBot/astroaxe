import { createHmac } from "node:crypto";

import { Temporal } from "@js-temporal/polyfill";
import { z } from "zod";

import { calculateWesternChart } from "@/domain/astrology/western";
import { sanitizeBirthData } from "@/lib/data-hygiene/birth-data";

import { regencyEvaluationCaseSchema, type RegencyEvaluationCase } from "./calibration";
import { extractRegencyAstrologicalFeatures } from "./features";
import { extractBirthRegencyTemporalFeatures } from "./temporal";

const rawCaseSchema = z
  .object({
    caseId: z.string().regex(/^case:[a-f0-9]{16,64}$/),
    partition: z.enum(["calibration", "validation"]),
    provenance: z.enum(["authorized_practitioner", "public_self_disclosure", "synthetic"]),
    expected: z
      .object({
        front: z.string().optional(),
        head: z.string().optional(),
        back: z.string().optional(),
        anyOf: z.array(z.string().min(1).max(120)).min(1).max(8).optional(),
      })
      .strict(),
    birth: z.unknown(),
    polarFallback: z.enum(["strict", "equinoctial_local_solar"]).default("strict"),
    evidence: z
      .object({
        regencyUrl: z.url(),
        regencyLocator: z.string().trim().min(1).max(500),
        natalUrl: z.url(),
        natalLocator: z.string().trim().min(1).max(500),
      })
      .strict(),
  })
  .strict();

export function prepareRegencyEvaluationCase(
  raw: unknown,
  today: Temporal.PlainDate,
  fingerprintSecret: string,
): RegencyEvaluationCase {
  if (fingerprintSecret.length < 32)
    throw new RangeError("O segredo deve ter ao menos 32 caracteres.");
  const input = rawCaseSchema.parse(raw);
  const birth = sanitizeBirthData(input.birth, today);
  const chart = calculateWesternChart(birth, fingerprintSecret);
  const temporal =
    birth.timePrecision === "known"
      ? extractBirthRegencyTemporalFeatures({
          jdUt: chart.jdUt,
          latitude: birth.latitude,
          longitude: birth.longitude,
          polarFallback: input.polarFallback,
        })
      : undefined;
  const prepared = {
    caseId: input.caseId,
    evidenceFingerprint: evidenceFingerprint(input.evidence, fingerprintSecret),
    partition: input.partition,
    provenance: input.provenance,
    timeQuality: birth.timePrecision,
    temporalMethod: temporal?.method ?? "not_applicable",
    expected: input.expected,
    astrologicalFeatures: extractRegencyAstrologicalFeatures(chart),
    ...(temporal === undefined || temporal.features.length === 0
      ? {}
      : { temporalFeatures: temporal.features }),
  };
  return regencyEvaluationCaseSchema.parse(prepared);
}

function evidenceFingerprint(
  evidence: z.infer<typeof rawCaseSchema>["evidence"],
  secret: string,
): string {
  const canonical = [
    evidence.regencyUrl,
    evidence.regencyLocator,
    evidence.natalUrl,
    evidence.natalLocator,
  ].join("\n");
  return createHmac("sha256", secret).update(canonical).digest("hex");
}
