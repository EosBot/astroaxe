import { describe, expect, it } from "vitest";

import type { WesternChartEnvelope } from "@/domain/astrology/western/contracts";

import { extractRegencyAstrologicalFeatures } from "./features";

describe("regency astrological feature extraction", () => {
  it("extracts sign, element, modality, decan and traditional dignity without birth time", () => {
    const features = extractRegencyAstrologicalFeatures(chart(false));
    expect(features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "planet:sun:sign:leo", requiresBirthTime: false }),
        expect.objectContaining({ key: "planet:sun:element:fire" }),
        expect.objectContaining({ key: "planet:sun:modality:fixed" }),
        expect.objectContaining({ key: "planet:sun:decan:2" }),
        expect.objectContaining({ key: "planet:sun:dignity:domicile" }),
        expect.objectContaining({ key: "planet:saturn:retrograde" }),
      ]),
    );
    expect(features.some(({ requiresBirthTime }) => requiresBirthTime)).toBe(false);
  });

  it("adds angles, houses, angularity and aspects only to a timed chart", () => {
    const features = extractRegencyAstrologicalFeatures(chart(true));
    expect(features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "angle:ascendant:sign:aries", requiresBirthTime: true }),
        expect.objectContaining({ key: "planet:sun:house:5", value: "5" }),
        expect.objectContaining({ key: "planet:moon:house:4", value: "4" }),
        expect.objectContaining({ key: "aspect:sun:trine:moon", strength: 0.8 }),
      ]),
    );
  });

  it("is deterministic regardless of input feature order", () => {
    const first = chart(true);
    const second = { ...first, planets: [...first.planets].reverse() };
    expect(extractRegencyAstrologicalFeatures(first)).toEqual(
      extractRegencyAstrologicalFeatures(second),
    );
  });
});

function chart(timed: boolean): WesternChartEnvelope {
  return {
    mode: timed ? "timed" : "untimed",
    engineVersion: "test-engine",
    configVersion: "test-config",
    inputFingerprint: "a".repeat(64),
    jdUt: 2_440_000,
    planets: [
      position("sun", 135, "Leo", 15, false),
      position("moon", 100, "Cancer", 10, false),
      position("saturn", 310, "Aquarius", 10, true),
    ],
    ...(timed
      ? {
          houses: {
            requestedSystem: "whole_sign",
            actualSystem: "whole_sign",
            cusps: Array.from({ length: 12 }, (_, index) => index * 30),
            ascendant: 5,
            midheaven: 275,
          },
          aspects: [{ a: "sun", b: "moon", type: "trine", orb: 2, strength: 0.8 }],
        }
      : {}),
    warnings: [],
  };
}

function position(
  id: string,
  longitude: number,
  sign: string,
  signDegree: number,
  retrograde: boolean,
) {
  return { id, longitude, latitude: 0, speed: 1, retrograde, sign, signDegree };
}
