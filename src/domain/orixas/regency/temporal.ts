import { z } from "zod";

import {
  classicalPlanetSchema,
  resolvePlanetaryHourAt,
  resolvePlanetaryHourInInterval,
  type PlanetaryHourReading,
} from "@/domain/astrology/planetary-hours";

/**
 * Adaptador de regências sobre o domínio neutro de horas planetárias.
 *
 * O cálculo — sequência caldaica, intervalo solar observado e proxy equinocial —
 * vive em `src/domain/astrology/planetary-hours` e não conhece Orixás. Aqui só
 * se traduz o resultado para o vocabulário de feature do scorer. Manter os dois
 * separados é o que permite usar hora planetária em eleições cerimoniais sem
 * arrastar junto o modelo de regências.
 */
export const REGENCY_TEMPORAL_VERSION = "regency-temporal-0.2.0";

export const planetaryHourContextSchema = z
  .object({
    scope: z.enum(["birth", "reading"]),
    instant: z.iso.datetime({ offset: true }),
    intervalStart: z.iso.datetime({ offset: true }),
    intervalEnd: z.iso.datetime({ offset: true }),
    segment: z.enum(["day", "night"]),
    planetaryDayRuler: classicalPlanetSchema,
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
  const resolution = resolvePlanetaryHourAt(input);
  if (resolution.reading === undefined)
    return {
      features: [],
      method: resolution.method,
      ...(resolution.limitation === undefined ? {} : { limitation: resolution.limitation }),
    };
  return {
    method: resolution.method,
    ...(resolution.limitation === undefined ? {} : { limitation: resolution.limitation }),
    features: toFeatures(resolution.reading, "birth"),
  };
}

/**
 * Extrai a hora planetária a partir de um intervalo solar já calculado pela
 * boundary astronômica. Dia: nascer ao pôr do sol. Noite: pôr ao nascer seguinte.
 */
export function extractRegencyTemporalFeatures(raw: unknown): RegencyTemporalFeature[] {
  const context = planetaryHourContextSchema.parse(raw);
  const reading = resolvePlanetaryHourInInterval({
    instant: context.instant,
    intervalStart: context.intervalStart,
    intervalEnd: context.intervalEnd,
    segment: context.segment,
    dayRuler: context.planetaryDayRuler,
  });
  return toFeatures(reading, context.scope);
}

/** Traduz uma leitura neutra para as três features que o scorer consome. */
function toFeatures(
  reading: PlanetaryHourReading,
  scope: "birth" | "reading",
): RegencyTemporalFeature[] {
  return [
    {
      key: `${scope}:planetary-day:${reading.dayRuler}`,
      category: "planetary_day",
      value: reading.dayRuler,
      scope,
    },
    {
      key: `${scope}:planetary-hour:${reading.hourNumber}:${reading.hourRuler}`,
      category: "planetary_hour",
      value: reading.hourRuler,
      scope,
      hourNumber: reading.hourNumber,
      intervalProgress: reading.intervalProgress,
    },
    {
      key: `${scope}:solar-segment:${reading.segment}`,
      category: "solar_segment",
      value: reading.segment,
      scope,
    },
  ];
}
