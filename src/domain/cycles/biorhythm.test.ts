import { describe, expect, it } from "vitest";

import { calculateBiorhythm, calculateBiorhythmCompatibility } from "./biorhythm";

describe("calculateBiorhythm", () => {
  it("is deterministic for an explicit pair of dates", () => {
    const first = calculateBiorhythm("2000-01-01", "2000-01-24");
    const second = calculateBiorhythm("2000-01-01", "2000-01-24");
    expect(first).toEqual(second);
    expect(first.daysLived).toBe(23);
    expect(first.cycles[0]?.value).toBeCloseTo(0, 10);
    expect(first.secondaryCycles.map(({ label }) => label)).toEqual([
      "Domínio",
      "Paixão",
      "Sabedoria",
    ]);
    expect(first.timeline).toHaveLength(61);
    expect(first.timeline[30]?.physical).toBeCloseTo(first.cycles[0]?.value ?? 1, 10);
    expect(first.criticalDays.length).toBeGreaterThan(0);
  });

  it("rejects a reference before birth", () => {
    expect(() => calculateBiorhythm("2000-01-02", "2000-01-01")).toThrow(RangeError);
  });

  it("compares two dates without treating compatibility as fate", () => {
    const result = calculateBiorhythmCompatibility("2000-01-01", "2001-02-03", "2026-08-24");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.cycles).toHaveLength(3);
  });
});
