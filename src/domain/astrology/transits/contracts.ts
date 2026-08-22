import { z } from "zod";

export const transitAspectSchema = z
  .object({
    transitingBody: z.string().min(1),
    natalBody: z.string().min(1),
    type: z.enum(["conjunction", "sextile", "square", "trine", "opposition"]),
    exactAngle: z.number(),
    orb: z.number().min(0),
    applying: z.boolean(),
    relativeIntensity: z.number().min(0).max(1),
  })
  .strict();

export const transitWindowSchema = z
  .object({
    transitingBody: z.string().min(1),
    natalBody: z.string().min(1),
    type: z.enum(["conjunction", "sextile", "square", "trine", "opposition"]),
    startsAt: z.iso.datetime({ offset: true }),
    peaksAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    peakOrb: z.number().min(0),
  })
  .strict()
  .refine(
    ({ startsAt, peaksAt, endsAt }) => startsAt <= peaksAt && peaksAt <= endsAt,
    "O pico precisa estar contido na janela do trânsito.",
  );

export const transitSnapshotSchema = z
  .object({
    kind: z.literal("transit_snapshot"),
    instant: z.iso.datetime({ offset: true }),
    engineVersion: z.string().min(1),
    configVersion: z.string().min(1),
    natalInputFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    snapshotFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    aspects: z.array(transitAspectSchema),
    windows: z.array(transitWindowSchema).max(5).default([]),
  })
  .strict();

export type TransitSnapshot = z.infer<typeof transitSnapshotSchema>;
export type TransitAspect = z.infer<typeof transitAspectSchema>;
export type TransitWindow = z.infer<typeof transitWindowSchema>;
