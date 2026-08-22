import { z } from "zod";

import { birthDataSchema } from "@/domain/astrology/western/contracts";

export const updateProfileSchema = birthDataSchema.extend({
  displayName: z.string().trim().min(1).max(100),
});

export const profileRecordSchema = z.object({
  id: z.uuid(),
  displayName: z.string(),
  date: z.iso.date(),
  time: z.string().nullable(),
  timePrecision: z.enum(["known", "unknown"]),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  location: z.string(),
  updatedAt: z.iso.datetime(),
  chart: z.object({
    mode: z.enum(["timed", "untimed"]),
    sunSign: z.string(),
    moonSign: z.string().optional(),
    ascendant: z.number().optional(),
  }),
});

export const profilesResponseSchema = z.object({ profiles: z.array(profileRecordSchema) });
export type ProfileRecord = z.infer<typeof profileRecordSchema>;
