import { createHmac } from "node:crypto";

import { Temporal } from "@js-temporal/polyfill";
import { Engine, julianDay } from "caelus";
import { embeddedData } from "caelus/data-embedded";

import type { PlanetPosition } from "@/domain/astrology/western/contracts";
import { ASTRO_ENGINE_VERSION } from "@/domain/astrology/western";
import {
  transitSnapshotSchema,
  type TransitAspect,
  type TransitSnapshot,
  type TransitWindow,
} from "./contracts";

export const TRANSIT_CONFIG_VERSION = "transits-2026-08-19-window-1";

const TRANSITING_BODIES = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"] as const;
const ASPECTS = [
  { type: "conjunction", angle: 0, maxOrb: 8 },
  { type: "sextile", angle: 60, maxOrb: 5 },
  { type: "square", angle: 90, maxOrb: 7 },
  { type: "trine", angle: 120, maxOrb: 7 },
  { type: "opposition", angle: 180, maxOrb: 8 },
] as const;
const engine = new Engine(embeddedData);
const JULIAN_UNIX_EPOCH = 2_440_587.5;
const MILLISECONDS_PER_DAY = 86_400_000;
const WINDOW_SEARCH: Readonly<Record<string, { stepDays: number; horizonDays: number }>> = {
  moon: { stepDays: 1 / 24, horizonDays: 4 },
  sun: { stepDays: 1 / 4, horizonDays: 16 },
  mercury: { stepDays: 1 / 4, horizonDays: 45 },
  venus: { stepDays: 1 / 4, horizonDays: 60 },
  mars: { stepDays: 1 / 2, horizonDays: 180 },
  jupiter: { stepDays: 1, horizonDays: 500 },
  saturn: { stepDays: 1, horizonDays: 900 },
};

export function calculateTransitSnapshot(input: {
  instant: string;
  natalInputFingerprint: string;
  natalPlanets: PlanetPosition[];
  fingerprintSecret: string;
}): TransitSnapshot {
  const instant = Temporal.Instant.from(input.instant);
  const utc = instant.toZonedDateTimeISO("UTC");
  const jdUt = julianDay(utc.year, utc.month, utc.day, utc.hour, utc.minute, utc.second);
  const aspects = TRANSITING_BODIES.flatMap((transitingBody) => {
    const transit = engine.position(transitingBody, jdUt);
    const later = engine.position(transitingBody, jdUt + 1 / 24);
    return input.natalPlanets.flatMap((natal) => {
      const separation = angularDistance(transit.lon, natal.longitude);
      const match = ASPECTS.map((aspect) => ({
        ...aspect,
        orb: Math.abs(separation - aspect.angle),
      })).find((aspect) => aspect.orb <= aspect.maxOrb);
      if (match === undefined) return [];
      const laterOrb = Math.abs(angularDistance(later.lon, natal.longitude) - match.angle);
      return [
        {
          transitingBody,
          natalBody: natal.id,
          type: match.type,
          exactAngle: match.angle,
          orb: match.orb,
          applying: laterOrb < match.orb,
          relativeIntensity: Math.max(0, 1 - match.orb / match.maxOrb),
        },
      ];
    });
  }).sort((left, right) => right.relativeIntensity - left.relativeIntensity);
  const windows = aspects
    .slice(0, 5)
    .map((aspect) => calculateTransitWindow(jdUt, aspect, input.natalPlanets))
    .filter((window): window is TransitWindow => window !== null);

  const canonicalInstant = instant.toString();
  const snapshotFingerprint = createHmac("sha256", input.fingerprintSecret)
    .update(
      `${ASTRO_ENGINE_VERSION}|${TRANSIT_CONFIG_VERSION}|${input.natalInputFingerprint}|${canonicalInstant}`,
    )
    .digest("hex");
  return transitSnapshotSchema.parse({
    kind: "transit_snapshot",
    instant: canonicalInstant,
    engineVersion: ASTRO_ENGINE_VERSION,
    configVersion: TRANSIT_CONFIG_VERSION,
    natalInputFingerprint: input.natalInputFingerprint,
    snapshotFingerprint,
    aspects,
    windows,
  });
}

export function calculateTransitWindow(
  referenceJdUt: number,
  aspect: TransitAspect,
  natalPlanets: PlanetPosition[],
): TransitWindow | null {
  const natal = natalPlanets.find((planet) => planet.id === aspect.natalBody);
  const definition = ASPECTS.find((candidate) => candidate.type === aspect.type);
  const search = WINDOW_SEARCH[aspect.transitingBody];
  if (natal === undefined || definition === undefined || search === undefined) return null;

  const orbAt = (jdUt: number) =>
    Math.abs(
      angularDistance(engine.position(aspect.transitingBody, jdUt).lon, natal.longitude) -
        definition.angle,
    );
  const startsJd = findWindowEdge(referenceJdUt, -1, definition.maxOrb, search, orbAt);
  const endsJd = findWindowEdge(referenceJdUt, 1, definition.maxOrb, search, orbAt);
  if (startsJd === null || endsJd === null) return null;
  const peaksJd = findPeak(startsJd, endsJd, search.stepDays, orbAt);

  return {
    transitingBody: aspect.transitingBody,
    natalBody: aspect.natalBody,
    type: aspect.type,
    startsAt: instantFromJulianDay(startsJd),
    peaksAt: instantFromJulianDay(peaksJd),
    endsAt: instantFromJulianDay(endsJd),
    peakOrb: orbAt(peaksJd),
  };
}

function findWindowEdge(
  referenceJdUt: number,
  direction: -1 | 1,
  maxOrb: number,
  search: { stepDays: number; horizonDays: number },
  orbAt: (jdUt: number) => number,
): number | null {
  let inside = referenceJdUt;
  for (let elapsed = search.stepDays; elapsed <= search.horizonDays; elapsed += search.stepDays) {
    const candidate = referenceJdUt + direction * elapsed;
    if (orbAt(candidate) <= maxOrb) {
      inside = candidate;
      continue;
    }
    let outside = candidate;
    for (let iteration = 0; iteration < 32; iteration += 1) {
      const midpoint = (inside + outside) / 2;
      if (orbAt(midpoint) <= maxOrb) inside = midpoint;
      else outside = midpoint;
    }
    return inside;
  }
  return null;
}

function findPeak(
  startsJd: number,
  endsJd: number,
  stepDays: number,
  orbAt: (jdUt: number) => number,
): number {
  let bestJd = startsJd;
  let bestOrb = orbAt(startsJd);
  for (let candidate = startsJd + stepDays; candidate < endsJd; candidate += stepDays) {
    const orb = orbAt(candidate);
    if (orb < bestOrb) {
      bestJd = candidate;
      bestOrb = orb;
    }
  }
  const halfStep = stepDays / 2;
  let left = Math.max(startsJd, bestJd - halfStep);
  let right = Math.min(endsJd, bestJd + halfStep);
  for (let iteration = 0; iteration < 40; iteration += 1) {
    const firstThird = left + (right - left) / 3;
    const secondThird = right - (right - left) / 3;
    if (orbAt(firstThird) <= orbAt(secondThird)) right = secondThird;
    else left = firstThird;
  }
  return (left + right) / 2;
}

function instantFromJulianDay(jdUt: number): string {
  const epochMilliseconds = Math.round((jdUt - JULIAN_UNIX_EPOCH) * MILLISECONDS_PER_DAY);
  return Temporal.Instant.fromEpochMilliseconds(epochMilliseconds).toString();
}

function angularDistance(first: number, second: number): number {
  const distance = Math.abs(first - second) % 360;
  return Math.min(distance, 360 - distance);
}
