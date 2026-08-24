import { describe, expect, it } from "vitest";

import {
  calculateLunarDashboard,
  LUNAR_DASHBOARD_VERSION,
  phaseFromLongitudes,
  tropicalArabicMansion,
} from "./lunar";

describe("lunar dashboard", () => {
  it("classifies the eight natal phases around their centers", () => {
    expect(phaseFromLongitudes(0, 0).id).toBe("new");
    expect(phaseFromLongitudes(0, 90).id).toBe("first_quarter");
    expect(phaseFromLongitudes(0, 180).id).toBe("full");
    expect(phaseFromLongitudes(0, 315).id).toBe("balsamic");
  });

  it("keeps the tropical Arabic mansion system explicit", () => {
    expect(tropicalArabicMansion(0)).toEqual({
      system: "arabic_tropical_28",
      number: 1,
      degreeWithin: 0,
    });
    expect(tropicalArabicMansion(359.99).number).toBe(28);
  });

  it("calculates a deterministic progressed moon, natal phase and void status", () => {
    const input = {
      birthDate: "1990-06-15",
      natalJdUt: 2_447_357,
      natalSunLongitude: 84,
      natalMoonLongitude: 350,
      natalHouseCusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      referenceInstant: "2026-08-24T12:00:00Z",
    };
    const first = calculateLunarDashboard(input);
    expect(first).toEqual(calculateLunarDashboard(input));
    expect(first.version).toBe(LUNAR_DASHBOARD_VERSION);
    expect(first.progressed.moonHouse).toBeGreaterThanOrEqual(1);
    expect(first.progressed.moonHouse).toBeLessThanOrEqual(12);
    expect(first.voidOfCourse.ingressAt).toMatch(/^2026-/);
  });

  it("omits a progressed house when the natal time is unavailable", () => {
    const result = calculateLunarDashboard({
      birthDate: "2000-01-01",
      natalJdUt: 2_451_544.5,
      natalSunLongitude: 280,
      natalMoonLongitude: 220,
      referenceInstant: "2026-08-24T00:00:00Z",
    });
    expect(result.progressed.moonHouse).toBeNull();
  });
});
