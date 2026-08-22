import { describe, expect, it } from "vitest";
import { julianDay } from "caelus";

import {
  extractBirthRegencyTemporalFeatures,
  extractRegencyTemporalFeatures,
  planetaryHourContextSchema,
} from "./temporal";

describe("regency temporal features", () => {
  it("starts Sunday daytime with the Sun and advances through the Chaldean order", () => {
    const first = extractRegencyTemporalFeatures({
      scope: "birth",
      instant: "2026-08-23T09:10:00-03:00",
      intervalStart: "2026-08-23T09:00:00-03:00",
      intervalEnd: "2026-08-23T21:00:00-03:00",
      segment: "day",
      planetaryDayRuler: "sun",
    });
    const second = extractRegencyTemporalFeatures({
      scope: "birth",
      instant: "2026-08-23T10:10:00-03:00",
      intervalStart: "2026-08-23T09:00:00-03:00",
      intervalEnd: "2026-08-23T21:00:00-03:00",
      segment: "day",
      planetaryDayRuler: "sun",
    });

    expect(first[1]).toMatchObject({ category: "planetary_hour", value: "sun", hourNumber: 1 });
    expect(second[1]).toMatchObject({
      category: "planetary_hour",
      value: "venus",
      hourNumber: 2,
    });
  });

  it("continues the sequence into variable nighttime hours", () => {
    const features = extractRegencyTemporalFeatures({
      scope: "reading",
      instant: "2026-08-23T21:10:00-03:00",
      intervalStart: "2026-08-23T21:00:00-03:00",
      intervalEnd: "2026-08-24T06:00:00-03:00",
      segment: "night",
      planetaryDayRuler: "sun",
    });

    expect(features[1]).toMatchObject({
      category: "planetary_hour",
      value: "jupiter",
      hourNumber: 1,
    });
  });

  it("rejects an instant outside the supplied solar interval", () => {
    expect(
      planetaryHourContextSchema.safeParse({
        scope: "reading",
        instant: "2026-08-23T08:00:00-03:00",
        intervalStart: "2026-08-23T09:00:00-03:00",
        intervalEnd: "2026-08-23T21:00:00-03:00",
        segment: "day",
        planetaryDayRuler: "sun",
      }).success,
    ).toBe(false);
  });

  it("derives natal day and hour from the existing astronomical engine", () => {
    const result = extractBirthRegencyTemporalFeatures({
      jdUt: julianDay(2026, 8, 23, 12, 0, 0),
      latitude: -23.5505,
      longitude: -46.6333,
    });

    expect(result.limitation).toBeUndefined();
    expect(result.method).toBe("observed_solar");
    expect(result.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "birth:planetary-day:sun",
          category: "planetary_day",
          value: "sun",
        }),
        expect.objectContaining({ category: "planetary_hour", scope: "birth" }),
        expect.objectContaining({ category: "solar_segment", value: "day" }),
      ]),
    );
  });

  it("returns an explicit limitation when a solar interval is unavailable", () => {
    const result = extractBirthRegencyTemporalFeatures({
      jdUt: julianDay(2026, 6, 21, 12, 0, 0),
      latitude: 90,
      longitude: 0,
    });

    expect(result).toEqual({
      features: [],
      method: "unavailable",
      limitation: "solar_interval_unavailable",
    });
  });

  it("offers an explicit equinoctial local-solar proxy for polar continuity", () => {
    const result = extractBirthRegencyTemporalFeatures({
      jdUt: julianDay(2026, 6, 21, 12, 0, 0),
      latitude: 90,
      longitude: 0,
      polarFallback: "equinoctial_local_solar",
    });

    expect(result).toMatchObject({
      method: "equinoctial_local_solar_proxy",
      limitation: "solar_interval_unavailable",
    });
    expect(result.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "birth:planetary-day:sun" }),
        expect.objectContaining({
          key: "birth:planetary-hour:7:mars",
          hourNumber: 7,
          intervalProgress: 0,
        }),
        expect.objectContaining({ key: "birth:solar-segment:day" }),
      ]),
    );
  });
});
