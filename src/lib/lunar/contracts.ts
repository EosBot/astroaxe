import { z } from "zod";

import { planetPositionSchema } from "@/lib/maps/contracts";
import { planetaryReturnSchema } from "@/lib/returns/contracts";
import { transitAspectSchema } from "@/domain/astrology/transits/contracts";

const lunarPhaseSchema = z.object({
  id: z.enum([
    "new",
    "crescent",
    "first_quarter",
    "gibbous",
    "full",
    "disseminating",
    "last_quarter",
    "balsamic",
  ]),
  label: z.string().min(1),
  angle: z.number().min(0).max(360),
});

export const lunarDashboardSchema = z.object({
  version: z.string().min(1),
  referenceInstant: z.iso.datetime({ offset: true }),
  natalPhase: lunarPhaseSchema,
  natalMansion: z.object({
    system: z.literal("arabic_tropical_28"),
    number: z.number().int().min(1).max(28),
    degreeWithin: z.number().min(0),
  }),
  progressed: z.object({
    jdUt: z.number(),
    symbolicDate: z.iso.date(),
    moon: planetPositionSchema,
    sun: planetPositionSchema,
    moonHouse: z.number().int().min(1).max(12).nullable(),
    phase: lunarPhaseSchema,
  }),
  voidOfCourse: z.object({
    active: z.boolean(),
    sign: z.string().min(1),
    ingressAt: z.iso.datetime({ offset: true }),
    nextApplyingAspect: z
      .object({
        body: z.string().min(1),
        type: z.string().min(1),
        exactAt: z.iso.datetime({ offset: true }),
      })
      .nullable(),
  }),
});

export const lunarModuleResponseSchema = z.object({
  dashboard: lunarDashboardSchema,
  lunarReturn: planetaryReturnSchema,
  transits: z.array(transitAspectSchema),
});

export type LunarModuleResponse = z.infer<typeof lunarModuleResponseSchema>;
