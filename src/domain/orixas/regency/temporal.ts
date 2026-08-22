import { z } from "zod";
import { Engine, planetaryHour } from "caelus";
import { embeddedData } from "caelus/data-embedded";

export const REGENCY_TEMPORAL_VERSION = "regency-temporal-0.2.0";

const classicalPlanets = ["saturn", "jupiter", "mars", "sun", "venus", "mercury", "moon"] as const;
const weekdayRulers = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"] as const;

const planetSchema = z.enum(classicalPlanets);
const engine = new Engine(embeddedData);

export const planetaryHourContextSchema = z
  .object({
    scope: z.enum(["birth", "reading"]),
    instant: z.iso.datetime({ offset: true }),
    intervalStart: z.iso.datetime({ offset: true }),
    intervalEnd: z.iso.datetime({ offset: true }),
    segment: z.enum(["day", "night"]),
    planetaryDayRuler: planetSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const instant = Date.parse(value.instant);
    const start = Date.parse(value.intervalStart);
    const end = Date.parse(value.intervalEnd);
    if (!(start <= instant && instant < end))
      context.addIssue({
        code: "custom",
        path: ["instant"],
        message: "O instante deve pertencer ao intervalo solar informado.",
      });
    if (end <= start)
      context.addIssue({
        code: "custom",
        path: ["intervalEnd"],
        message: "O fim do intervalo solar deve ser posterior ao início.",
      });
  });

export type PlanetaryHourContext = z.infer<typeof planetaryHourContextSchema>;

export interface RegencyTemporalFeature {
  key: string;
  category: "planetary_day" | "planetary_hour" | "solar_segment";
  value: string;
  scope: "birth" | "reading";
  hourNumber?: number;
  intervalProgress?: number;
}

export interface RegencyTemporalExtraction {
  features: RegencyTemporalFeature[];
  method: "observed_solar" | "equinoctial_local_solar_proxy" | "unavailable";
  limitation?: "solar_interval_unavailable";
}

export function extractBirthRegencyTemporalFeatures(input: {
  jdUt: number;
  latitude: number;
  longitude: number;
  polarFallback?: "strict" | "equinoctial_local_solar";
}): RegencyTemporalExtraction {
  const parsed = z
    .object({
      jdUt: z.number(),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      polarFallback: z.enum(["strict", "equinoctial_local_solar"]).default("strict"),
    })
    .strict()
    .parse(input);
  const hour = planetaryHour(engine, parsed.jdUt, parsed.latitude, parsed.longitude);
  if (hour === null) {
    if (parsed.polarFallback === "equinoctial_local_solar")
      return equinoctialLocalSolarProxy(parsed.jdUt, parsed.longitude);
    return { features: [], method: "unavailable", limitation: "solar_interval_unavailable" };
  }
  const hourNumber = hour.hour > 12 ? hour.hour - 12 : hour.hour;
  const intervalProgress = (parsed.jdUt - hour.start) / (hour.end - hour.start);
  return {
    method: "observed_solar",
    features: [
      {
        key: `birth:planetary-day:${hour.dayRuler}`,
        category: "planetary_day",
        value: hour.dayRuler,
        scope: "birth",
      },
      {
        key: `birth:planetary-hour:${hourNumber}:${hour.ruler}`,
        category: "planetary_hour",
        value: hour.ruler,
        scope: "birth",
        hourNumber,
        intervalProgress,
      },
      {
        key: `birth:solar-segment:${hour.kind}`,
        category: "solar_segment",
        value: hour.kind,
        scope: "birth",
      },
    ],
  };
}

function equinoctialLocalSolarProxy(jdUt: number, longitude: number): RegencyTemporalExtraction {
  const millisecondsPerDay = 86_400_000;
  const unixEpochJulianDay = 2_440_587.5;
  const localSolarMilliseconds =
    (jdUt - unixEpochJulianDay) * millisecondsPerDay + (longitude / 360) * millisecondsPerDay;
  const localSolar = new Date(localSolarMilliseconds);
  const decimalHour =
    localSolar.getUTCHours() + localSolar.getUTCMinutes() / 60 + localSolar.getUTCSeconds() / 3_600;
  const segment = decimalHour >= 6 && decimalHour < 18 ? "day" : "night";
  const belongsToPreviousDay = decimalHour < 6;
  const weekday = mod(localSolar.getUTCDay() - (belongsToPreviousDay ? 1 : 0), 7);
  const dayRuler = weekdayRulers[weekday] ?? "sun";
  let elapsed = decimalHour + 6;
  if (segment === "day") elapsed = decimalHour - 6;
  else if (decimalHour >= 18) elapsed = decimalHour - 18;
  const hourNumber = Math.floor(elapsed) + 1;
  const sequenceOffset = segment === "day" ? hourNumber - 1 : 12 + hourNumber - 1;
  const ruler =
    classicalPlanets[
      mod(classicalPlanets.indexOf(dayRuler) + sequenceOffset, classicalPlanets.length)
    ] ?? dayRuler;
  return {
    method: "equinoctial_local_solar_proxy",
    limitation: "solar_interval_unavailable",
    features: [
      {
        key: `birth:planetary-day:${dayRuler}`,
        category: "planetary_day",
        value: dayRuler,
        scope: "birth",
      },
      {
        key: `birth:planetary-hour:${hourNumber}:${ruler}`,
        category: "planetary_hour",
        value: ruler,
        scope: "birth",
        hourNumber,
        intervalProgress: elapsed % 1,
      },
      {
        key: `birth:solar-segment:${segment}`,
        category: "solar_segment",
        value: segment,
        scope: "birth",
      },
    ],
  };
}

/**
 * Extrai a hora planetária a partir de um intervalo solar já calculado pela
 * boundary astronômica. Dia: nascer ao pôr do sol. Noite: pôr ao nascer seguinte.
 */
export function extractRegencyTemporalFeatures(raw: unknown): RegencyTemporalFeature[] {
  const context = planetaryHourContextSchema.parse(raw);
  const start = Date.parse(context.intervalStart);
  const end = Date.parse(context.intervalEnd);
  const instant = Date.parse(context.instant);
  const progress = (instant - start) / (end - start);
  const hourNumber = Math.min(12, Math.floor(progress * 12) + 1);
  const dayRulerIndex = classicalPlanets.indexOf(context.planetaryDayRuler);
  const sequenceOffset = context.segment === "day" ? hourNumber - 1 : 12 + hourNumber - 1;
  const hourRuler =
    classicalPlanets[mod(dayRulerIndex + sequenceOffset, classicalPlanets.length)] ??
    context.planetaryDayRuler;

  return [
    {
      key: `${context.scope}:planetary-day:${context.planetaryDayRuler}`,
      category: "planetary_day",
      value: context.planetaryDayRuler,
      scope: context.scope,
    },
    {
      key: `${context.scope}:planetary-hour:${hourNumber}:${hourRuler}`,
      category: "planetary_hour",
      value: hourRuler,
      scope: context.scope,
      hourNumber,
      intervalProgress: progress,
    },
    {
      key: `${context.scope}:solar-segment:${context.segment}`,
      category: "solar_segment",
      value: context.segment,
      scope: context.scope,
    },
  ];
}

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
