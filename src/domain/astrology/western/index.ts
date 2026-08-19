import { createHmac } from "node:crypto";

import { Temporal } from "@js-temporal/polyfill";
import { Engine, julianDay } from "caelus";
import { embeddedData } from "caelus/data-embedded";

import type { PlanetPosition, SanitizedBirthData, WesternChartEnvelope } from "./contracts";

export const ASTRO_ENGINE_VERSION = "caelus-0.24.1";
export const ASTRO_CONFIG_VERSION = "western-2026-08-19";

const CORE_BODIES = [
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
const engine = new Engine(embeddedData);

function toInstant(data: SanitizedBirthData, time: string): Temporal.Instant {
  return Temporal.ZonedDateTime.from(`${data.date}T${time}:00[${data.timezone}]`, {
    disambiguation: "reject",
  }).toInstant();
}

function instantParts(instant: Temporal.Instant) {
  const utc = instant.toZonedDateTimeISO("UTC");
  return {
    year: utc.year,
    month: utc.month,
    day: utc.day,
    hour: utc.hour,
    minute: utc.minute,
    second: utc.second,
  };
}

function toJulianDay(instant: Temporal.Instant): number {
  const p = instantParts(instant);
  return julianDay(p.year, p.month, p.day, p.hour, p.minute, p.second);
}

function position(id: string, jdUt: number): PlanetPosition {
  const value = engine.position(id, jdUt);
  return {
    id,
    longitude: value.lon,
    latitude: value.lat,
    speed: value.speed,
    retrograde: value.retrograde,
    sign: value.sign,
    signDegree: value.signDeg,
  };
}

export function natalFingerprint(data: SanitizedBirthData, secret: string): string {
  const canonical = [
    ASTRO_ENGINE_VERSION,
    ASTRO_CONFIG_VERSION,
    data.date,
    data.time ?? "unknown",
    data.timezone,
    data.latitude.toFixed(6),
    data.longitude.toFixed(6),
    data.houseSystem,
  ].join("|");
  return createHmac("sha256", secret).update(canonical).digest("hex");
}

export function calculateWesternChart(
  data: SanitizedBirthData,
  fingerprintSecret: string,
): WesternChartEnvelope {
  const fingerprint = natalFingerprint(data, fingerprintSecret);
  if (data.timePrecision === "unknown") {
    const noon = toInstant(data, "12:00");
    const start = toInstant(data, "00:00");
    const nextDate = Temporal.PlainDate.from(data.date).add({ days: 1 });
    const end = toInstant({ ...data, date: nextDate.toString() }, "00:00");
    const jdUt = toJulianDay(noon);
    return {
      mode: "untimed",
      engineVersion: ASTRO_ENGINE_VERSION,
      configVersion: ASTRO_CONFIG_VERSION,
      inputFingerprint: fingerprint,
      jdUt,
      planets: CORE_BODIES.map((body) => position(body, jdUt)),
      uncertainty: {
        reason: "unknown_birth_time",
        referenceInstant: "local_noon",
        moonLongitudeRange: {
          start: engine.position("moon", toJulianDay(start)).lon,
          end: engine.position("moon", toJulianDay(end)).lon,
        },
      },
      warnings: [
        "Hora desconhecida: casas, Ascendente, Meio do Ceu e aspectos dependentes de angulos foram omitidos.",
      ],
    };
  }

  const instant = toInstant(data, data.time ?? "12:00");
  const p = instantParts(instant);
  const chart = engine.chart(
    p.year,
    p.month,
    p.day,
    p.hour,
    p.minute,
    p.second,
    data.latitude,
    data.longitude,
    { houseSystem: data.houseSystem },
  );
  const planets = CORE_BODIES.flatMap((body) => {
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
  });

  return {
    mode: "timed",
    engineVersion: ASTRO_ENGINE_VERSION,
    configVersion: ASTRO_CONFIG_VERSION,
    inputFingerprint: fingerprint,
    jdUt: chart.jdUt,
    planets,
    houses: {
      requestedSystem: chart.houseSystemRequested,
      actualSystem: chart.houseSystem,
      cusps: chart.cusps,
      ascendant: chart.angles.asc,
      midheaven: chart.angles.mc,
    },
    aspects: chart.aspects.map((aspect) => ({
      a: aspect.a,
      b: aspect.b,
      type: aspect.aspect,
      orb: aspect.orb,
      strength: aspect.strength,
    })),
    warnings: chart.warnings.map((warning) => warning.text),
  };
}
