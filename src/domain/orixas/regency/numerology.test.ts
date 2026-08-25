import { describe, expect, it } from "vitest";

import { extractRegencyNumerologicalFeatures } from "./numerology";

describe("regency numerology research lenses", () => {
  it("preserves the full reduction trail for the 1-16 and 1-9 variants", () => {
    expect(extractRegencyNumerologicalFeatures({ birthDate: "1989-12-16" })).toEqual([
      expect.objectContaining({
        lensId: "date-digit-sum-1-16-repeated",
        rawDigitSum: 37,
        reductionSteps: [37, 10],
        value: "10",
      }),
      expect.objectContaining({
        lensId: "date-digital-root-1-9",
        rawDigitSum: 37,
        reductionSteps: [37, 10, 1],
        value: "1",
      }),
    ]);
  });

  it("does not depend on birth time or implicit clocks", () => {
    expect(extractRegencyNumerologicalFeatures({ birthDate: "2000-01-01" })).toEqual([
      expect.objectContaining({ value: "4", requiresBirthTime: false }),
      expect.objectContaining({ value: "4", requiresBirthTime: false }),
    ]);
  });

  it("rejects impossible calendar dates", () => {
    expect(() => extractRegencyNumerologicalFeatures({ birthDate: "2025-02-29" })).toThrow();
  });

  it("exposes the observed structural asymmetry of the 1-16 reduction", () => {
    const counts = Array.from({ length: 17 }, () => 0);
    for (let year = 1900; year <= 2099; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
        for (let day = 1; day <= days; day += 1) {
          const birthDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const [feature] = extractRegencyNumerologicalFeatures({ birthDate });
          const index = Number(feature?.value);
          counts[index] = (counts[index] ?? 0) + 1;
        }
      }
    }

    expect(counts[1]).toBe(0);
    expect(counts.slice(1).reduce((total, count) => total + count, 0)).toBe(73_049);
    expect(Math.max(...counts.slice(1))).toBeGreaterThan(7 * Math.min(...counts.slice(2)));
  });
});
