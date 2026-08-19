import { z } from "zod";

export const houseSystemSchema = z.enum(["placidus", "whole_sign"]);

export const birthDataSchema = z
  .object({
    date: z.iso.date(),
    time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .optional(),
    timePrecision: z.enum(["known", "unknown"]),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    timezone: z.string().min(1).max(100),
    location: z.string().min(2).max(200),
    houseSystem: houseSystemSchema.default("placidus"),
  })
  .superRefine((value, context) => {
    if (value.timePrecision === "known" && value.time === undefined) {
      context.addIssue({
        code: "custom",
        path: ["time"],
        message: "Hora obrigatoria quando a precisao e conhecida.",
      });
    }
    if (value.timePrecision === "unknown" && value.time !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["time"],
        message: "Nao informe hora quando a precisao e desconhecida.",
      });
    }
  });

export type BirthData = z.infer<typeof birthDataSchema>;

export interface SanitizedBirthData extends BirthData {
  location: string;
  quality: {
    timeKnown: boolean;
    normalized: true;
  };
}

export interface PlanetPosition {
  id: string;
  longitude: number;
  latitude: number;
  speed: number;
  retrograde: boolean;
  sign: string;
  signDegree: number;
}

export interface WesternChartEnvelope {
  mode: "timed" | "untimed";
  engineVersion: string;
  configVersion: string;
  inputFingerprint: string;
  jdUt: number;
  planets: PlanetPosition[];
  houses?: {
    requestedSystem: string;
    actualSystem: string;
    cusps: number[];
    ascendant: number;
    midheaven: number;
  };
  aspects?: Array<{ a: string; b: string; type: string; orb: number; strength: number }>;
  uncertainty?: {
    reason: "unknown_birth_time";
    referenceInstant: "local_noon";
    moonLongitudeRange: { start: number; end: number };
  };
  warnings: string[];
}
