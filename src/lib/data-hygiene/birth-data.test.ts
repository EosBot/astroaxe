import { Temporal } from "@js-temporal/polyfill";
import { describe, expect, it } from "vitest";

import { sanitizeBirthData } from "./birth-data";

const today = Temporal.PlainDate.from("2026-08-19");

describe("sanitizeBirthData", () => {
  it("rejects dates outside the supported range", () => {
    const base = {
      timePrecision: "unknown",
      latitude: 0,
      longitude: 0,
      timezone: "UTC",
      location: "Recife",
      houseSystem: "placidus",
    };
    expect(() => sanitizeBirthData({ ...base, date: "1899-12-31" }, today)).toThrow(RangeError);
    expect(() => sanitizeBirthData({ ...base, date: "2026-08-20" }, today)).toThrow(RangeError);
  });

  it("rejects an invalid timezone and contradictory time precision", () => {
    expect(() =>
      sanitizeBirthData(
        {
          date: "2000-01-01",
          timePrecision: "unknown",
          time: "12:00",
          latitude: 0,
          longitude: 0,
          timezone: "UTC",
          location: "Recife",
        },
        today,
      ),
    ).toThrow();
    expect(() =>
      sanitizeBirthData(
        {
          date: "2000-01-01",
          timePrecision: "unknown",
          latitude: 0,
          longitude: 0,
          timezone: "Not/AZone",
          location: "Recife",
        },
        today,
      ),
    ).toThrow();
  });

  it("requires a time when precision is known", () => {
    expect(() =>
      sanitizeBirthData(
        {
          date: "2000-01-01",
          timePrecision: "known",
          latitude: 0,
          longitude: 0,
          timezone: "UTC",
          location: "Recife",
        },
        today,
      ),
    ).toThrow();
  });
});
