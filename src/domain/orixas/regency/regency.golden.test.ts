import { describe, expect, it } from "vitest";

import type { WesternChartEnvelope } from "@/domain/astrology/western/contracts";

import { extractRegencyAstrologicalFeatures } from "./features";
import { regencyMatrix } from "./matrix";
import { regencyResearchConfig } from "./research-config";
import { scoreRegencies } from "./scorer";
import { extractRegencyTemporalFeatures } from "./temporal";

describe("regency research engine golden case", () => {
  it("freezes the 0.2 research behavior for a fully synthetic timed chart", () => {
    const result = scoreRegencies({
      matrix: regencyMatrix,
      config: regencyResearchConfig,
      astrologicalFeatures: extractRegencyAstrologicalFeatures(chart()),
      temporalFeatures: extractRegencyTemporalFeatures({
        scope: "birth",
        instant: "2000-01-02T06:10:00-03:00",
        intervalStart: "2000-01-02T06:00:00-03:00",
        intervalEnd: "2000-01-02T18:00:00-03:00",
        segment: "day",
        planetaryDayRuler: "sun",
      }),
    });

    expect(result.triad).toEqual({
      front: "orisa:oxala",
      head: "orisa:xango",
      back: "orisa:ogum",
    });
    expect(
      result.rankingsByRole.front.find(({ orisaId }) => orisaId === result.triad.front),
    ).toMatchObject({ rawScore: 14 });
    expect(
      result.rankingsByRole.head.find(({ orisaId }) => orisaId === result.triad.head),
    ).toMatchObject({ rawScore: 14 });
    expect(
      result.rankingsByRole.back.find(({ orisaId }) => orisaId === result.triad.back),
    ).toMatchObject({ rawScore: 4 });
  });
});

function chart(): WesternChartEnvelope {
  return {
    mode: "timed",
    engineVersion: "synthetic-engine",
    configVersion: "synthetic-config",
    inputFingerprint: "a".repeat(64),
    jdUt: 2_451_545,
    planets: [
      position("sun", 120, "Leo", 0),
      position("moon", 90, "Cancer", 0),
      position("mercury", 60, "Gemini", 0),
      position("venus", 30, "Taurus", 0),
      position("mars", 0, "Aries", 0),
      position("jupiter", 240, "Sagittarius", 0),
      position("saturn", 300, "Aquarius", 0, true),
      position("uranus", 305, "Aquarius", 5),
      position("neptune", 330, "Pisces", 0),
      position("pluto", 210, "Scorpio", 0),
    ],
    houses: {
      requestedSystem: "whole_sign",
      actualSystem: "whole_sign",
      cusps: Array.from({ length: 12 }, (_, index) => (120 + index * 30) % 360),
      ascendant: 120,
      midheaven: 30,
    },
    aspects: [],
    warnings: [],
  };
}

function position(
  id: string,
  longitude: number,
  sign: string,
  signDegree: number,
  retrograde = false,
) {
  return { id, longitude, latitude: 0, speed: retrograde ? -1 : 1, retrograde, sign, signDegree };
}
