import { Temporal } from "@js-temporal/polyfill";
import { describe, expect, it } from "vitest";

import { prepareRegencyEvaluationCase } from "./case-preparation";

const secret = "s".repeat(32);

describe("regency evaluation case preparation", () => {
  it("removes natal data and evidence URLs from an untimed partial-label case", () => {
    const prepared = prepareRegencyEvaluationCase(
      rawCase(),
      Temporal.PlainDate.from("2026-08-20"),
      secret,
    );

    expect(prepared).toMatchObject({
      caseId: "case:aaaaaaaaaaaaaaaa",
      timeQuality: "unknown",
      temporalMethod: "not_applicable",
      expected: { head: "orisa:oya" },
    });
    expect(prepared.evidenceFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(prepared)).not.toContain("2000-01-02");
    expect(JSON.stringify(prepared)).not.toContain("example.invalid");
    expect(prepared.astrologicalFeatures.some(({ requiresBirthTime }) => requiresBirthTime)).toBe(
      false,
    );
  });

  it("is deterministic for the same evidence and secret", () => {
    const today = Temporal.PlainDate.from("2026-08-20");
    expect(prepareRegencyEvaluationCase(rawCase(), today, secret)).toEqual(
      prepareRegencyEvaluationCase(rawCase(), today, secret),
    );
  });
});

function rawCase() {
  return {
    caseId: "case:aaaaaaaaaaaaaaaa",
    partition: "calibration",
    provenance: "public_self_disclosure",
    expected: { head: "orisa:oya" },
    birth: {
      date: "2000-01-02",
      timePrecision: "unknown",
      latitude: -12.6,
      longitude: -38.97,
      timezone: "America/Bahia",
      location: "Synthetic city",
      houseSystem: "placidus",
    },
    evidence: {
      regencyUrl: "https://example.invalid/regency",
      regencyLocator: "Synthetic declaration",
      natalUrl: "https://example.invalid/natal",
      natalLocator: "Synthetic birth record",
    },
  };
}
