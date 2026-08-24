import { z } from "zod";

import { houseSystemSchema } from "@/domain/astrology/western/contracts";
import { planetPositionSchema } from "@/lib/maps/contracts";

export const planetaryReturnSchema = z.object({
  kind: z.enum(["solar", "lunar"]),
  version: z.string().min(1),
  instant: z.iso.datetime({ offset: true }),
  jdUt: z.number(),
  targetLongitude: z.number().min(0).max(360),
  achievedLongitude: z.number().min(0).max(360),
  orb: z.number().min(0),
  planets: z.array(planetPositionSchema),
  houses: z.object({
    cusps: z.array(z.number()).length(12),
    ascendant: z.number(),
    midheaven: z.number(),
    requestedSystem: houseSystemSchema,
    actualSystem: z.string().min(1),
  }),
});

export const planetaryReturnResponseSchema = z.object({
  returnChart: planetaryReturnSchema,
  annualCalendar: z
    .object({
      version: z.string().min(1),
      events: z.array(
        z.object({
          id: z.string().min(1),
          kind: z.enum(["solar_eclipse", "lunar_eclipse", "station"]),
          instant: z.iso.datetime({ offset: true }),
          title: z.string().min(1),
          detail: z.string().min(1),
          visibleFromProfile: z.boolean().nullable(),
          natalContact: z
            .object({
              body: z.string().min(1),
              aspect: z.enum(["conjunction", "square", "opposition"]),
              orb: z.number().nonnegative(),
            })
            .nullable(),
        }),
      ),
    })
    .optional(),
});
export type PlanetaryReturnResponse = z.infer<typeof planetaryReturnResponseSchema>;
