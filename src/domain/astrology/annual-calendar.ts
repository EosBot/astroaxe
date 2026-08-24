import {
  Engine,
  julianDay,
  lunarEclipseLocal,
  lunarEclipses,
  solarEclipseLocal,
  solarEclipses,
  stations,
} from "caelus";
import { embeddedData } from "caelus/data-embedded";

export const ANNUAL_CALENDAR_VERSION = "annual-sky-calendar-1.0.0";

const engine = new Engine(embeddedData);
const RETROGRADE_BODIES = [
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

export interface AnnualSkyEvent {
  id: string;
  kind: "solar_eclipse" | "lunar_eclipse" | "station";
  instant: string;
  title: string;
  detail: string;
  visibleFromProfile: boolean | null;
  natalContact: {
    body: string;
    aspect: "conjunction" | "square" | "opposition";
    orb: number;
  } | null;
}

export function calculateAnnualSkyCalendar(input: {
  year: number;
  latitude: number;
  longitude: number;
  natalPlanets: ReadonlyArray<{ id: string; longitude: number }>;
}): { version: string; events: AnnualSkyEvent[] } {
  const start = julianDay(input.year, 1, 1);
  const end = julianDay(input.year + 1, 1, 1);
  const solarEvents = solarEclipses(engine, start, end).map((event) => {
    const local = solarEclipseLocal(engine, event.tMax, input.latitude, input.longitude);
    return createEclipseEvent({
      kind: "solar_eclipse",
      jdUt: event.tMax,
      title: `Eclipse solar ${translateEclipseType(event.type)}`,
      detail:
        local.type === "none"
          ? "O eclipse ocorre globalmente, mas não será visível no local deste mapa."
          : `Visível no local do mapa como eclipse ${translateEclipseType(local.type)}, com ${Math.round(local.obscuration * 100)}% de obscurecimento máximo.`,
      visible: local.type !== "none",
      triggerLongitude: engine.position("sun", event.tMax).lon,
      natalPlanets: input.natalPlanets,
    });
  });
  const lunarEvents = lunarEclipses(engine, start, end).map((event) => {
    const local = lunarEclipseLocal(engine, event.tMax, input.latitude, input.longitude);
    return createEclipseEvent({
      kind: "lunar_eclipse",
      jdUt: event.tMax,
      title: `Eclipse lunar ${translateEclipseType(event.type)}`,
      detail: local.visible
        ? `Visível no local do mapa, com a Lua a ${local.altitude.toFixed(1)}° de altitude no auge.`
        : "A Lua estará abaixo do horizonte no local deste mapa durante o auge.",
      visible: local.visible,
      triggerLongitude: engine.position("moon", event.tMax).lon,
      natalPlanets: input.natalPlanets,
    });
  });
  const stationEvents = RETROGRADE_BODIES.flatMap((body) =>
    stations(engine, body, start, end).map(([jdUt, direction]) => ({
      id: `${body}-${direction}-${jdUt.toFixed(5)}`,
      kind: "station" as const,
      instant: instantFromJulianDay(jdUt),
      title: `${bodyName(body)} fica ${direction === "retrograde" ? "retrógrado" : "direto"}`,
      detail:
        direction === "retrograde"
          ? "Uma fase de revisão começa: retome decisões, mensagens e compromissos ligados a este planeta antes de acelerar."
          : "A revisão alcança um ponto de virada; movimentos reconsiderados podem ganhar direção progressiva.",
      visibleFromProfile: null,
      natalContact: closestNatalContact(engine.position(body, jdUt).lon, input.natalPlanets, 3),
    })),
  );
  return {
    version: ANNUAL_CALENDAR_VERSION,
    events: [...solarEvents, ...lunarEvents, ...stationEvents].sort((a, b) =>
      a.instant.localeCompare(b.instant),
    ),
  };
}

function createEclipseEvent(input: {
  kind: "solar_eclipse" | "lunar_eclipse";
  jdUt: number;
  title: string;
  detail: string;
  visible: boolean;
  triggerLongitude: number;
  natalPlanets: ReadonlyArray<{ id: string; longitude: number }>;
}): AnnualSkyEvent {
  return {
    id: `${input.kind}-${input.jdUt.toFixed(5)}`,
    kind: input.kind,
    instant: instantFromJulianDay(input.jdUt),
    title: input.title,
    detail: input.detail,
    visibleFromProfile: input.visible,
    natalContact: closestNatalContact(input.triggerLongitude, input.natalPlanets, 4),
  };
}

function closestNatalContact(
  longitude: number,
  natalPlanets: ReadonlyArray<{ id: string; longitude: number }>,
  maximumOrb: number,
): AnnualSkyEvent["natalContact"] {
  let closest: AnnualSkyEvent["natalContact"] = null;
  for (const planet of natalPlanets) {
    for (const [aspect, angle] of [
      ["conjunction", 0],
      ["square", 90],
      ["opposition", 180],
    ] as const) {
      const orb = Math.abs(angularDistance(longitude, planet.longitude) - angle);
      if (orb <= maximumOrb && (closest === null || orb < closest.orb)) {
        closest = { body: planet.id, aspect, orb };
      }
    }
  }
  return closest;
}

function angularDistance(first: number, second: number): number {
  const distance = Math.abs(first - second) % 360;
  return Math.min(distance, 360 - distance);
}

function instantFromJulianDay(jdUt: number): string {
  return new Date(Math.round((jdUt - JULIAN_UNIX_EPOCH) * MILLISECONDS_PER_DAY)).toISOString();
}

function translateEclipseType(type: string): string {
  const names: Readonly<Record<string, string>> = {
    total: "total",
    partial: "parcial",
    penumbral: "penumbral",
    annular: "anular",
    hybrid: "híbrido",
  };
  return names[type] ?? type;
}

function bodyName(body: string): string {
  const names: Readonly<Record<string, string>> = {
    mercury: "Mercúrio",
    venus: "Vênus",
    mars: "Marte",
    jupiter: "Júpiter",
    saturn: "Saturno",
    uranus: "Urano",
    neptune: "Netuno",
    pluto: "Plutão",
  };
  return names[body] ?? body;
}
