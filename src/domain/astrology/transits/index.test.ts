import { describe, expect, it } from "vitest";

import type { PlanetPosition } from "@/domain/astrology/western/contracts";
import { calculateTransitSnapshot } from ".";

describe("transit snapshots", () => {
  it("is deterministic for the same instant, natal chart and versions", () => {
    const input = fixture();
    const first = calculateTransitSnapshot(input);
    const second = calculateTransitSnapshot(input);
    expect(second).toEqual(first);
    expect(first.aspects.length).toBeGreaterThan(0);
    expect(first.aspects[0]?.relativeIntensity).toBeGreaterThanOrEqual(
      first.aspects.at(-1)?.relativeIntensity ?? 0,
    );
    expect(first.windows.length).toBeGreaterThan(0);
    expect(first.windows).toMatchInlineSnapshot(`
      [
        {
          "endsAt": "2026-08-31T09:16:31.734Z",
          "natalBody": "body-5",
          "peakOrb": 5.025214022680302e-9,
          "peaksAt": "2026-08-23T02:18:49.552Z",
          "startsAt": "2026-08-14T18:45:35.724Z",
          "transitingBody": "sun",
          "type": "conjunction",
        },
        {
          "endsAt": "2026-08-30T08:26:41.805Z",
          "natalBody": "body-1",
          "peakOrb": 2.333365500817308e-9,
          "peaksAt": "2026-08-23T02:18:49.552Z",
          "startsAt": "2026-08-15T19:43:57.841Z",
          "transitingBody": "sun",
          "type": "trine",
        },
        {
          "endsAt": "2026-08-30T08:26:41.805Z",
          "natalBody": "body-2",
          "peakOrb": 2.333365500817308e-9,
          "peaksAt": "2026-08-23T02:18:49.552Z",
          "startsAt": "2026-08-15T19:43:57.841Z",
          "transitingBody": "sun",
          "type": "square",
        },
        {
          "endsAt": "2026-08-30T08:26:41.805Z",
          "natalBody": "body-8",
          "peakOrb": 2.333365500817308e-9,
          "peaksAt": "2026-08-23T02:18:49.552Z",
          "startsAt": "2026-08-15T19:43:57.841Z",
          "transitingBody": "sun",
          "type": "square",
        },
        {
          "endsAt": "2026-08-30T08:26:41.805Z",
          "natalBody": "body-9",
          "peakOrb": 2.333365500817308e-9,
          "peaksAt": "2026-08-23T02:18:49.552Z",
          "startsAt": "2026-08-15T19:43:57.841Z",
          "transitingBody": "sun",
          "type": "trine",
        },
      ]
    `);
  });

  it("changes the snapshot fingerprint when the instant changes", () => {
    const first = calculateTransitSnapshot(fixture());
    const second = calculateTransitSnapshot({ ...fixture(), instant: "2026-08-20T12:00:00Z" });
    expect(second.snapshotFingerprint).not.toBe(first.snapshotFingerprint);
  });
});

function fixture() {
  return {
    instant: "2026-08-19T12:00:00Z",
    natalInputFingerprint: "a".repeat(64),
    fingerprintSecret: "test-secret",
    natalPlanets: Array.from({ length: 10 }, (_, index): PlanetPosition => ({
      id: index === 0 ? "sun" : `body-${index}`,
      longitude: index * 30,
      latitude: 0,
      speed: 1,
      retrograde: false,
      sign: "Aries",
      signDegree: 0,
    })),
  };
}
