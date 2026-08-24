import { z } from "zod";

export const planetPositionSchema = z.object({
  id: z.string(),
  longitude: z.number(),
  latitude: z.number(),
  speed: z.number(),
  retrograde: z.boolean(),
  sign: z.string(),
  signDegree: z.number(),
});

export const createMapResponseSchema = z.object({
  profileId: z.uuid(),
  chartId: z.uuid(),
  chart: z.object({
    mode: z.enum(["timed", "untimed"]),
    engineVersion: z.string(),
    configVersion: z.string(),
    inputFingerprint: z.string().length(64),
    jdUt: z.number(),
    planets: z.array(planetPositionSchema).min(10).max(13),
    aspects: z
      .array(
        z.object({
          a: z.string(),
          b: z.string(),
          type: z.string(),
          orb: z.number().nonnegative(),
          strength: z.number().min(0).max(1),
        }),
      )
      .optional(),
    houses: z
      .object({
        requestedSystem: z.string(),
        actualSystem: z.string(),
        cusps: z.array(z.number()).length(12),
        ascendant: z.number(),
        midheaven: z.number(),
      })
      .optional(),
    warnings: z.array(z.string()),
  }),
});

export type CreateMapResponse = z.infer<typeof createMapResponseSchema>;

export const geocodingResponseSchema = z.object({
  places: z.array(
    z.object({
      label: z.string(),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      timezone: z.string(),
    }),
  ),
});

export type PlaceCandidate = z.infer<typeof geocodingResponseSchema>["places"][number];
