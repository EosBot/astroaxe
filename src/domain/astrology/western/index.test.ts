import { Temporal } from "@js-temporal/polyfill";
import { describe, expect, it } from "vitest";

import { sanitizeBirthData } from "@/lib/data-hygiene/birth-data";

import { calculateWesternChart, natalFingerprint } from "./index";
import { zodiacPlacement } from "./zodiac";

const today = Temporal.PlainDate.from("2026-08-19");
const fingerprintSecret = "test-fingerprint-secret-at-least-32-chars";

describe("western astrology engine", () => {
  it("produces a deterministic timed chart from local civil time", () => {
    const input = sanitizeBirthData(
      {
        date: "1990-06-10",
        time: "11:30",
        timePrecision: "known",
        latitude: 27.95,
        longitude: -82.46,
        timezone: "America/New_York",
        location: "Tampa",
        houseSystem: "placidus",
      },
      today,
    );
    const first = calculateWesternChart(input, fingerprintSecret);
    const second = calculateWesternChart(input, fingerprintSecret);

    expect(first).toEqual(second);
    expect(first.mode).toBe("timed");
    expect(first.planets).toHaveLength(13);
    expect(first.planets.map(({ id }) => id)).toEqual(
      expect.arrayContaining(["chiron", "true_node", "mean_lilith"]),
    );
    expect(first.houses?.cusps).toHaveLength(12);
    expect(first.planets.find((planet) => planet.id === "sun")?.longitude).toBeCloseTo(
      79.4918317,
      6,
    );
    expect(first.planets.find((planet) => planet.id === "sun")).toMatchObject({
      sign: "Gemini",
      signDegree: expect.closeTo(19.491831725875016, 10),
    });
    expect(first.planets.find((planet) => planet.id === "moon")).toMatchObject({
      sign: "Capricorn",
      signDegree: expect.closeTo(13.791980705887795, 10),
    });
    expect(first.houses?.ascendant).toBeCloseTo(143.814163, 6);
    expect(zodiacPlacement(first.houses?.ascendant ?? Number.NaN)).toEqual({
      sign: "Leão",
      signDegree: expect.closeTo(23.81416305663564, 10),
    });
  });

  it("normalizes longitudes at the zodiac boundaries", () => {
    expect(zodiacPlacement(360)).toEqual({ sign: "Áries", signDegree: 0 });
    expect(zodiacPlacement(-0.5)).toEqual({ sign: "Peixes", signDegree: 29.5 });
  });

  it("omits time-sensitive houses when birth time is unknown", () => {
    const input = sanitizeBirthData(
      {
        date: "1990-06-10",
        timePrecision: "unknown",
        latitude: -23.5505,
        longitude: -46.6333,
        timezone: "America/Sao_Paulo",
        location: "  Sao\u200B Paulo  ",
        houseSystem: "placidus",
      },
      today,
    );
    const result = calculateWesternChart(input, fingerprintSecret);

    expect(result.mode).toBe("untimed");
    expect(result.houses).toBeUndefined();
    expect(result.aspects).toBeUndefined();
    expect(result.uncertainty?.reason).toBe("unknown_birth_time");
    expect(input.location).toBe("Sao Paulo");
    expect(natalFingerprint(input, fingerprintSecret)).toHaveLength(64);
  });
});
