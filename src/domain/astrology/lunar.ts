import { Temporal } from "@js-temporal/polyfill";
import { Engine, julianDay } from "caelus";
import { embeddedData } from "caelus/data-embedded";

import type { PlanetPosition } from "./western/contracts";

export const LUNAR_DASHBOARD_VERSION = "lunar-dashboard-1.0.0";

const engine = new Engine(embeddedData);
const TRANSITING_BODIES = ["sun", "mercury", "venus", "mars", "jupiter", "saturn"] as const;
const ASPECT_ANGLES = [0, 60, 90, 120, 180] as const;
const TROPICAL_YEAR_DAYS = 365.2422;
const JULIAN_UNIX_EPOCH = 2_440_587.5;
const MILLISECONDS_PER_DAY = 86_400_000;

export interface LunarPhaseReading {
  id:
    | "new"
    | "crescent"
    | "first_quarter"
    | "gibbous"
    | "full"
    | "disseminating"
    | "last_quarter"
    | "balsamic";
  label: string;
  angle: number;
}

export interface LunarDashboard {
  version: string;
  referenceInstant: string;
  natalPhase: LunarPhaseReading;
  natalMansion: { system: "arabic_tropical_28"; number: number; degreeWithin: number };
  progressed: {
    jdUt: number;
    symbolicDate: string;
    moon: PlanetPosition;
    sun: PlanetPosition;
    moonHouse: number | null;
    phase: LunarPhaseReading;
  };
  voidOfCourse: {
    active: boolean;
    sign: string;
    ingressAt: string;
    nextApplyingAspect: { body: string; type: string; exactAt: string } | null;
  };
}

export function calculateLunarDashboard(input: {
  birthDate: string;
  natalJdUt: number;
  natalSunLongitude: number;
  natalMoonLongitude: number;
  natalHouseCusps?: number[];
  referenceInstant: string;
}): LunarDashboard {
  const reference = Temporal.Instant.from(input.referenceInstant);
  const birth = Temporal.PlainDate.from(input.birthDate);
  const referenceDate = reference.toZonedDateTimeISO("UTC").toPlainDate();
  const daysLived = birth.until(referenceDate, { largestUnit: "days" }).days;
  if (daysLived < 0) throw new RangeError("A referência lunar deve ser posterior ao nascimento.");
  const progressedJdUt = input.natalJdUt + daysLived / TROPICAL_YEAR_DAYS;
  const progressedMoon = planetAt("moon", progressedJdUt);
  const progressedSun = planetAt("sun", progressedJdUt);
  const referenceJdUt = instantToJulianDay(reference);
  return {
    version: LUNAR_DASHBOARD_VERSION,
    referenceInstant: reference.toString(),
    natalPhase: phaseFromLongitudes(input.natalSunLongitude, input.natalMoonLongitude),
    natalMansion: tropicalArabicMansion(input.natalMoonLongitude),
    progressed: {
      jdUt: progressedJdUt,
      symbolicDate: instantFromJulianDay(progressedJdUt).slice(0, 10),
      moon: progressedMoon,
      sun: progressedSun,
      moonHouse:
        input.natalHouseCusps === undefined
          ? null
          : houseForLongitude(progressedMoon.longitude, input.natalHouseCusps),
      phase: phaseFromLongitudes(progressedSun.longitude, progressedMoon.longitude),
    },
    voidOfCourse: calculateVoidOfCourse(referenceJdUt),
  };
}

export function phaseFromLongitudes(
  sunLongitude: number,
  moonLongitude: number,
): LunarPhaseReading {
  const angle = normalize(moonLongitude - sunLongitude);
  const phases = [
    ["new", "Lua Nova", 0],
    ["crescent", "Lua Crescente inicial", 45],
    ["first_quarter", "Quarto Crescente", 90],
    ["gibbous", "Lua Gibosa crescente", 135],
    ["full", "Lua Cheia", 180],
    ["disseminating", "Lua Disseminante", 225],
    ["last_quarter", "Quarto Minguante", 270],
    ["balsamic", "Lua Balsâmica", 315],
  ] as const;
  const index = Math.floor(normalize(angle + 22.5) / 45) % phases.length;
  const selected = phases[index];
  if (selected === undefined) throw new Error("lunar_phase_missing");
  return { id: selected[0], label: selected[1], angle };
}

export function tropicalArabicMansion(longitude: number): {
  system: "arabic_tropical_28";
  number: number;
  degreeWithin: number;
} {
  const size = 360 / 28;
  const normalized = normalize(longitude);
  return {
    system: "arabic_tropical_28",
    number: Math.floor(normalized / size) + 1,
    degreeWithin: normalized % size,
  };
}

function calculateVoidOfCourse(jdUt: number): LunarDashboard["voidOfCourse"] {
  const moon = engine.position("moon", jdUt);
  const nextBoundary = (Math.floor(normalize(moon.lon) / 30) + 1) * 30;
  const ingressJd = findLongitudeCrossing("moon", normalize(nextBoundary), jdUt, jdUt + 3);
  const applying = findNextLunarAspect(jdUt, ingressJd);
  return {
    active: applying === null,
    sign: zodiacSign(moon.lon),
    ingressAt: instantFromJulianDay(ingressJd),
    nextApplyingAspect: applying,
  };
}

function findNextLunarAspect(
  startJd: number,
  endJd: number,
): LunarDashboard["voidOfCourse"]["nextApplyingAspect"] {
  let best: { body: string; type: string; exactAt: string; jdUt: number } | null = null;
  for (const body of TRANSITING_BODIES) {
    for (const angle of ASPECT_ANGLES) {
      const exactJd = findAspectMinimum(body, angle, startJd, endJd);
      if (exactJd === null || (best !== null && exactJd >= best.jdUt)) continue;
      best = {
        body,
        type: aspectName(angle),
        exactAt: instantFromJulianDay(exactJd),
        jdUt: exactJd,
      };
    }
  }
  return best === null ? null : { body: best.body, type: best.type, exactAt: best.exactAt };
}

function findAspectMinimum(
  body: string,
  angle: number,
  startJd: number,
  endJd: number,
): number | null {
  const step = 1 / 48;
  let bestJd = startJd;
  let bestOrb = aspectOrb(body, angle, startJd);
  for (let candidate = startJd + step; candidate <= endJd; candidate += step) {
    const orb = aspectOrb(body, angle, candidate);
    if (orb < bestOrb) {
      bestOrb = orb;
      bestJd = candidate;
    }
  }
  if (bestOrb > 1.5 || bestJd <= startJd + step || bestJd >= endJd - step) return null;
  let left = bestJd - step;
  let right = bestJd + step;
  for (let iteration = 0; iteration < 48; iteration += 1) {
    const first = left + (right - left) / 3;
    const second = right - (right - left) / 3;
    if (aspectOrb(body, angle, first) <= aspectOrb(body, angle, second)) right = second;
    else left = first;
  }
  const exactJd = (left + right) / 2;
  return aspectOrb(body, angle, exactJd) < 0.02 ? exactJd : null;
}

function aspectOrb(body: string, angle: number, jdUt: number): number {
  const moon = engine.position("moon", jdUt).lon;
  const planet = engine.position(body, jdUt).lon;
  return Math.abs(angularDistance(moon, planet) - angle);
}

function findLongitudeCrossing(
  body: string,
  target: number,
  startJd: number,
  endJd: number,
): number {
  let left = startJd;
  let leftDistance = signedLongitudeDistance(engine.position(body, left).lon, target);
  for (let right = startJd + 1 / 24; right <= endJd; right += 1 / 24) {
    const rightDistance = signedLongitudeDistance(engine.position(body, right).lon, target);
    if (leftDistance <= 0 && rightDistance >= 0) {
      let upper = right;
      for (let iteration = 0; iteration < 48; iteration += 1) {
        const midpoint = (left + upper) / 2;
        if (signedLongitudeDistance(engine.position(body, midpoint).lon, target) >= 0)
          upper = midpoint;
        else left = midpoint;
      }
      return (left + upper) / 2;
    }
    left = right;
    leftDistance = rightDistance;
  }
  throw new Error("lunar_ingress_not_found");
}

function houseForLongitude(longitude: number, cusps: number[]): number {
  if (cusps.length !== 12) throw new RangeError("São necessárias doze cúspides natais.");
  for (let index = 0; index < cusps.length; index += 1) {
    const start = normalize(cusps[index] ?? 0);
    const end = normalize(cusps[(index + 1) % 12] ?? 0);
    const position = normalize(longitude);
    const inside =
      start < end ? position >= start && position < end : position >= start || position < end;
    if (inside) return index + 1;
  }
  throw new Error("progressed_moon_house_not_found");
}

function planetAt(body: "sun" | "moon", jdUt: number): PlanetPosition {
  const value = engine.position(body, jdUt);
  return {
    id: body,
    longitude: value.lon,
    latitude: value.lat,
    speed: value.speed,
    retrograde: value.retrograde,
    sign: zodiacSign(value.lon),
    signDegree: normalize(value.lon) % 30,
  };
}

function instantToJulianDay(instant: Temporal.Instant): number {
  const utc = instant.toZonedDateTimeISO("UTC");
  return julianDay(utc.year, utc.month, utc.day, utc.hour, utc.minute, utc.second);
}

function instantFromJulianDay(jdUt: number): string {
  return new Date(Math.round((jdUt - JULIAN_UNIX_EPOCH) * MILLISECONDS_PER_DAY)).toISOString();
}

function signedLongitudeDistance(longitude: number, target: number): number {
  return ((normalize(longitude) - normalize(target) + 540) % 360) - 180;
}

function angularDistance(first: number, second: number): number {
  const distance = Math.abs(first - second) % 360;
  return Math.min(distance, 360 - distance);
}

function normalize(value: number): number {
  return ((value % 360) + 360) % 360;
}

function aspectName(angle: number): string {
  const names: Readonly<Record<number, string>> = {
    0: "conjunção",
    60: "sextil",
    90: "quadratura",
    120: "trígono",
    180: "oposição",
  };
  return names[angle] ?? `${angle}°`;
}

function zodiacSign(longitude: number): string {
  return (
    [
      "Áries",
      "Touro",
      "Gêmeos",
      "Câncer",
      "Leão",
      "Virgem",
      "Libra",
      "Escorpião",
      "Sagitário",
      "Capricórnio",
      "Aquário",
      "Peixes",
    ][Math.floor(normalize(longitude) / 30)] ?? "Áries"
  );
}
