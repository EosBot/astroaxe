import { Engine, planetaryHour } from "caelus";
import { embeddedData } from "caelus/data-embedded";
import { z } from "zod";

/**
 * Hora planetária, sem vínculo com Orixás.
 *
 * Este domínio calcula a sequência caldaica, os intervalos solares observados e
 * o proxy equinocial para latitudes onde o Sol não nasce ou não se põe. Ele não
 * conhece regências, papéis nem vocabulário de feature — quem precisa disso
 * adapta a saída, como faz `src/domain/orixas/regency/temporal.ts`.
 *
 * Puro e determinístico: recebe instante e lugar explicitamente e nunca lê o
 * relógio, a rede ou o ambiente. O mesmo instante devolve sempre o mesmo
 * resultado.
 */
export const PLANETARY_HOURS_VERSION = "planetary-hours-0.1.0";

/**
 * Ordem caldaica, do mais lento ao mais rápido. A sequência das horas percorre
 * esta lista; o regente do dia é o da primeira hora diurna.
 */
export const CLASSICAL_PLANETS = [
  "saturn",
  "jupiter",
  "mars",
  "sun",
  "venus",
  "mercury",
  "moon",
] as const;

/** Regentes dos dias da semana, de domingo a sábado. */
export const WEEKDAY_RULERS = [
  "sun",
  "moon",
  "mars",
  "mercury",
  "jupiter",
  "venus",
  "saturn",
] as const;

export const classicalPlanetSchema = z.enum(CLASSICAL_PLANETS);
export type ClassicalPlanet = z.infer<typeof classicalPlanetSchema>;
export type SolarSegment = "day" | "night";

/** Como o intervalo solar foi obtido — o resultado declara sua própria origem. */
export type PlanetaryHourMethod =
  "observed_solar" | "equinoctial_local_solar_proxy" | "unavailable";

export interface PlanetaryHourReading {
  dayRuler: ClassicalPlanet;
  hourRuler: ClassicalPlanet;
  /** 1 a 12 dentro do segmento. */
  hourNumber: number;
  segment: SolarSegment;
  /** Posição do instante dentro do intervalo, de 0 a 1. */
  intervalProgress: number;
}

export interface PlanetaryHourResolution {
  method: PlanetaryHourMethod;
  limitation?: "solar_interval_unavailable";
  reading?: PlanetaryHourReading;
}

const engine = new Engine(embeddedData);

const locationSchema = z
  .object({
    jdUt: z.number(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    polarFallback: z.enum(["strict", "equinoctial_local_solar"]).default("strict"),
  })
  .strict();

export type PlanetaryHourLocation = z.input<typeof locationSchema>;

/**
 * Regente de uma hora pela sequência caldaica.
 *
 * As horas noturnas continuam a contagem das doze diurnas, e é por isso que o
 * deslocamento noturno soma doze antes de percorrer a sequência.
 */
export function chaldeanHourRuler(
  dayRuler: ClassicalPlanet,
  segment: SolarSegment,
  hourNumber: number,
): ClassicalPlanet {
  const sequenceOffset = segment === "day" ? hourNumber - 1 : 12 + hourNumber - 1;
  const index = CLASSICAL_PLANETS.indexOf(dayRuler);
  return CLASSICAL_PLANETS[mod(index + sequenceOffset, CLASSICAL_PLANETS.length)] ?? dayRuler;
}

/**
 * Hora planetária no instante e lugar informados.
 *
 * Quando o Sol não nasce nem se põe, o intervalo solar não existe. O modo
 * `strict` devolve `unavailable` em vez de inventar um horário; o proxy
 * equinocial devolve uma leitura **rotulada como aproximação**, nunca
 * apresentada como observação.
 */
export function resolvePlanetaryHourAt(input: PlanetaryHourLocation): PlanetaryHourResolution {
  const parsed = locationSchema.parse(input);
  const hour = planetaryHour(engine, parsed.jdUt, parsed.latitude, parsed.longitude);
  if (hour === null) {
    if (parsed.polarFallback === "equinoctial_local_solar")
      return equinoctialLocalSolarProxy(parsed.jdUt, parsed.longitude);
    return { method: "unavailable", limitation: "solar_interval_unavailable" };
  }
  return {
    method: "observed_solar",
    reading: {
      dayRuler: hour.dayRuler as ClassicalPlanet,
      hourRuler: hour.ruler as ClassicalPlanet,
      hourNumber: hour.hour > 12 ? hour.hour - 12 : hour.hour,
      segment: hour.kind as SolarSegment,
      intervalProgress: (parsed.jdUt - hour.start) / (hour.end - hour.start),
    },
  };
}

const intervalSchema = z
  .object({
    instant: z.iso.datetime({ offset: true }),
    intervalStart: z.iso.datetime({ offset: true }),
    intervalEnd: z.iso.datetime({ offset: true }),
    segment: z.enum(["day", "night"]),
    dayRuler: classicalPlanetSchema,
  })
  .strict();

export type PlanetaryHourInterval = z.infer<typeof intervalSchema>;

/**
 * Hora planetária dentro de um intervalo solar já calculado.
 *
 * Dia é do nascer ao pôr do sol; noite é do pôr ao nascer seguinte. O intervalo
 * é dividido em doze partes iguais — horas desiguais, que é como a tradição as
 * conta.
 */
export function resolvePlanetaryHourInInterval(input: PlanetaryHourInterval): PlanetaryHourReading {
  // Valida a própria fronteira: os perfis de eleição chamam esta função direto,
  // não só o adaptador de regências, e ela não pode confiar que alguém já tenha
  // conferido o intervalo.
  const parsed = intervalSchema.parse(input);
  const start = Date.parse(parsed.intervalStart);
  const end = Date.parse(parsed.intervalEnd);
  const instant = Date.parse(parsed.instant);
  const intervalProgress = (instant - start) / (end - start);
  const hourNumber = Math.min(12, Math.floor(intervalProgress * 12) + 1);
  return {
    dayRuler: parsed.dayRuler,
    hourRuler: chaldeanHourRuler(parsed.dayRuler, parsed.segment, hourNumber),
    hourNumber,
    segment: parsed.segment,
    intervalProgress,
  };
}

/**
 * Aproximação para latitudes sem nascer ou pôr do sol.
 *
 * Assume dia e noite de doze horas iguais em torno do meio-dia solar local. É
 * uma convenção declarada, não uma observação, e o chamador recebe isso no
 * campo `method` para poder rotular a incerteza.
 */
function equinoctialLocalSolarProxy(jdUt: number, longitude: number): PlanetaryHourResolution {
  const millisecondsPerDay = 86_400_000;
  const unixEpochJulianDay = 2_440_587.5;
  const localSolar = new Date(
    (jdUt - unixEpochJulianDay) * millisecondsPerDay + (longitude / 360) * millisecondsPerDay,
  );
  const decimalHour =
    localSolar.getUTCHours() + localSolar.getUTCMinutes() / 60 + localSolar.getUTCSeconds() / 3_600;
  const segment: SolarSegment = decimalHour >= 6 && decimalHour < 18 ? "day" : "night";
  const belongsToPreviousDay = decimalHour < 6;
  const weekday = mod(localSolar.getUTCDay() - (belongsToPreviousDay ? 1 : 0), 7);
  const dayRuler = WEEKDAY_RULERS[weekday] ?? "sun";

  let elapsed = decimalHour + 6;
  if (segment === "day") elapsed = decimalHour - 6;
  else if (decimalHour >= 18) elapsed = decimalHour - 18;
  const hourNumber = Math.floor(elapsed) + 1;

  return {
    method: "equinoctial_local_solar_proxy",
    limitation: "solar_interval_unavailable",
    reading: {
      dayRuler,
      hourRuler: chaldeanHourRuler(dayRuler, segment, hourNumber),
      hourNumber,
      segment,
      intervalProgress: elapsed % 1,
    },
  };
}

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
