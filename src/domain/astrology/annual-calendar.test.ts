import { describe, expect, it } from "vitest";

import { ANNUAL_CALENDAR_VERSION, calculateAnnualSkyCalendar } from "./annual-calendar";

describe("calculateAnnualSkyCalendar", () => {
  it("produces a deterministic chronological calendar with eclipses and stations", () => {
    const input = {
      year: 2026,
      latitude: -23.5505,
      longitude: -46.6333,
      natalPlanets: [
        { id: "sun", longitude: 150 },
        { id: "moon", longitude: 330 },
      ],
    };
    const first = calculateAnnualSkyCalendar(input);
    expect(first).toEqual(calculateAnnualSkyCalendar(input));
    expect(first.version).toBe(ANNUAL_CALENDAR_VERSION);
    expect(first.events.some(({ kind }) => kind === "solar_eclipse")).toBe(true);
    expect(first.events.some(({ kind }) => kind === "lunar_eclipse")).toBe(true);
    expect(first.events.some(({ kind }) => kind === "station")).toBe(true);
    expect(first.events.map(({ instant }) => instant).toSorted()).toEqual(
      first.events.map(({ instant }) => instant),
    );
  });

  it("keeps local eclipse visibility explicit", () => {
    const result = calculateAnnualSkyCalendar({
      year: 2026,
      latitude: -23.5505,
      longitude: -46.6333,
      natalPlanets: [],
    });
    const eclipses = result.events.filter(({ kind }) => kind !== "station");
    expect(eclipses.length).toBeGreaterThan(0);
    expect(
      eclipses.every(({ visibleFromProfile }) => typeof visibleFromProfile === "boolean"),
    ).toBe(true);
  });
});
