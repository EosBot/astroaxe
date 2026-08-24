import { describe, expect, it } from "vitest";

import { calculateLunarReturn, calculateSolarReturn } from "./returns";

const location = {
  timezone: "America/Sao_Paulo",
  latitude: -23.55,
  longitude: -46.63,
  houseSystem: "placidus" as const,
};

describe("planetary returns", () => {
  it("finds the exact solar longitude in the requested year", () => {
    const result = calculateSolarReturn({
      ...location,
      year: 2026,
      birthDate: "1990-06-15",
      natalSunLongitude: 84.2,
    });
    expect(result.kind).toBe("solar");
    expect(result.instant.startsWith("2026-06")).toBe(true);
    expect(result.orb).toBeLessThan(0.0001);
    expect(result.planets).toHaveLength(10);
    expect(result.houses.cusps).toHaveLength(12);
  });

  it("finds a lunar return close to an explicit reference date", () => {
    const result = calculateLunarReturn({
      ...location,
      nearDate: "2026-08-24",
      natalMoonLongitude: 120,
    });
    expect(result.kind).toBe("lunar");
    expect(result.orb).toBeLessThan(0.0001);
  });
});
