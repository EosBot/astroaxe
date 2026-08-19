import { Temporal } from "@js-temporal/polyfill";
import { describe, expect, it } from "vitest";

import { sanitizeBirthData } from "@/lib/data-hygiene/birth-data";

import { calculateWesternChart, natalFingerprint } from "./index";

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
    expect(first.planets).toHaveLength(10);
    expect(first.houses?.cusps).toHaveLength(12);
    expect(first.planets.find((planet) => planet.id === "sun")?.longitude).toBeCloseTo(
      79.4918317,
      6,
    );
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
