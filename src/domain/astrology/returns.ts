import { Temporal } from "@js-temporal/polyfill";
import { Engine, julianDay } from "caelus";
import { embeddedData } from "caelus/data-embedded";

import type { PlanetPosition } from "./western/contracts";

export const RETURN_CONFIG_VERSION = "planetary-returns-1.0.0";

const engine = new Engine(embeddedData);
const RETURN_BODIES = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
] as const;
const JULIAN_UNIX_EPOCH = 2_440_587.5;
const MILLISECONDS_PER_DAY = 86_400_000;

export interface PlanetaryReturn {
  kind: "solar" | "lunar";
  version: string;
  instant: string;
  jdUt: number;
  targetLongitude: number;
  achievedLongitude: number;
  orb: number;
  planets: PlanetPosition[];
  houses: {
    cusps: number[];
    ascendant: number;
    midheaven: number;
    requestedSystem: string;
    actualSystem: string;
  };
}

export function calculateSolarReturn(input: {
  year: number;
  birthDate: string;
  timezone: string;
  latitude: number;
  longitude: number;
  houseSystem: "placidus" | "whole_sign";
  natalSunLongitude: number;
}): PlanetaryReturn {
  const birth = Temporal.PlainDate.from(input.birthDate);
  const expected = Temporal.ZonedDateTime.from(
    `${input.year}-${pad(birth.month)}-${pad(birth.day)}T12:00:00[${input.timezone}]`,
    { disambiguation: "reject" },
  ).toInstant();
  return calculateReturn({
    kind: "solar",
    body: "sun",
    centerJdUt: instantToJulianDay(expected),
    searchDays: 3,
    stepDays: 0.25,
    targetLongitude: input.natalSunLongitude,
    latitude: input.latitude,
    longitude: input.longitude,
    houseSystem: input.houseSystem,
  });
}

export function calculateLunarReturn(input: {
  nearDate: string;
  timezone: string;
  latitude: number;
  longitude: number;
  houseSystem: "placidus" | "whole_sign";
  natalMoonLongitude: number;
}): PlanetaryReturn {
  const expected = Temporal.ZonedDateTime.from(`${input.nearDate}T12:00:00[${input.timezone}]`, {
    disambiguation: "reject",
  }).toInstant();
  return calculateReturn({
    kind: "lunar",
    body: "moon",
    centerJdUt: instantToJulianDay(expected),
    searchDays: 15,
    stepDays: 0.25,
    targetLongitude: input.natalMoonLongitude,
    latitude: input.latitude,
    longitude: input.longitude,
    houseSystem: input.houseSystem,
  });
}

function calculateReturn(input: {
  kind: "solar" | "lunar";
  body: "sun" | "moon";
  centerJdUt: number;
  searchDays: number;
  stepDays: number;
  targetLongitude: number;
  latitude: number;
  longitude: number;
  houseSystem: "placidus" | "whole_sign";
}): PlanetaryReturn {
  let bestJd = input.centerJdUt - input.searchDays;
  let bestOrb = orbAt(input.body, bestJd, input.targetLongitude);
  for (
    let candidate = bestJd + input.stepDays;
    candidate <= input.centerJdUt + input.searchDays;
    candidate += input.stepDays
  ) {
    const orb = orbAt(input.body, candidate, input.targetLongitude);
    if (orb < bestOrb) {
      bestJd = candidate;
      bestOrb = orb;
    }
  }
  let left = bestJd - input.stepDays;
  let right = bestJd + input.stepDays;
  for (let iteration = 0; iteration < 64; iteration += 1) {
    const firstThird = left + (right - left) / 3;
    const secondThird = right - (right - left) / 3;
    if (
      orbAt(input.body, firstThird, input.targetLongitude) <=
      orbAt(input.body, secondThird, input.targetLongitude)
    )
      right = secondThird;
    else left = firstThird;
  }
  const jdUt = (left + right) / 2;
  const instant = instantFromJulianDay(jdUt);
  const utc = Temporal.Instant.from(instant).toZonedDateTimeISO("UTC");
  const chart = engine.chart(
    utc.year,
    utc.month,
    utc.day,
    utc.hour,
    utc.minute,
    utc.second,
    input.latitude,
    input.longitude,
    { houseSystem: input.houseSystem, bodies: [...RETURN_BODIES] },
  );
  const achievedLongitude = engine.position(input.body, jdUt).lon;
  return {
    kind: input.kind,
    version: RETURN_CONFIG_VERSION,
    instant,
    jdUt,
    targetLongitude: input.targetLongitude,
    achievedLongitude,
    orb: angularDistance(achievedLongitude, input.targetLongitude),
    planets: RETURN_BODIES.flatMap((body) => {
      const value = chart.bodies[body];
      return value === undefined
        ? []
        : [
            {
              id: body,
              longitude: value.lon,
              latitude: value.lat,
              speed: value.speed,
              retrograde: value.retrograde,
              sign: value.sign,
              signDegree: value.signDeg,
            },
          ];
    }),
    houses: {
      cusps: chart.cusps,
      ascendant: chart.angles.asc,
      midheaven: chart.angles.mc,
      requestedSystem: chart.houseSystemRequested,
      actualSystem: chart.houseSystem,
    },
  };
}

function orbAt(body: "sun" | "moon", jdUt: number, target: number): number {
  return angularDistance(engine.position(body, jdUt).lon, target);
}

function instantToJulianDay(instant: Temporal.Instant): number {
  const utc = instant.toZonedDateTimeISO("UTC");
  return julianDay(utc.year, utc.month, utc.day, utc.hour, utc.minute, utc.second);
}

function instantFromJulianDay(jdUt: number): string {
  return Temporal.Instant.fromEpochMilliseconds(
    Math.round((jdUt - JULIAN_UNIX_EPOCH) * MILLISECONDS_PER_DAY),
  ).toString();
}

function angularDistance(first: number, second: number): number {
  const distance = Math.abs(first - second) % 360;
  return Math.min(distance, 360 - distance);
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
