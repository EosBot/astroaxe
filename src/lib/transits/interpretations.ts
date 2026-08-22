import type { PrismaClient } from "@/generated/prisma/client";
import { z } from "zod";

import type { TransitSnapshot } from "@/domain/astrology/transits/contracts";
import { transitSnapshotSchema } from "@/domain/astrology/transits/contracts";

export const transitInterpretationSchema = z.object({
  transit: z.object({
    transitingBody: z.string(),
    natalBody: z.string(),
    type: z.string(),
    orb: z.number(),
    applying: z.boolean(),
    relativeIntensity: z.number(),
  }),
  content: z.object({
    title: z.string(),
    opening: z.string(),
    deepening: z.string(),
    technicalWhy: z.string(),
    reflectionPrompt: z.string(),
    practice: z.string(),
    version: z.string(),
    generationMethod: z.enum(["HUMAN", "AI_ASSISTED"]),
    author: z.object({ displayName: z.string(), attributionLine: z.string() }),
    reviewer: z.object({ displayName: z.string(), attributionLine: z.string() }),
  }),
});

export const transitReadingResponseSchema = z
  .object({
    snapshot: transitSnapshotSchema,
    interpretations: z.array(transitInterpretationSchema),
  })
  .strict();

export type TransitReadingResponse = z.infer<typeof transitReadingResponseSchema>;

export async function selectPublishedTransitInterpretations(
  prisma: PrismaClient,
  snapshot: TransitSnapshot,
  locale: string,
  now: Date,
): Promise<z.infer<typeof transitInterpretationSchema>[]> {
  const selected = await Promise.all(
    snapshot.aspects.slice(0, 5).map(async (transit) => {
      const content = await prisma.transitInterpretationTemplate.findFirst({
        where: {
          transitingBody: transit.transitingBody,
          natalBody: transit.natalBody,
          aspectType: transit.type,
          locale,
          status: "PUBLISHED",
          publishedAt: { lte: now },
        },
        orderBy: { publishedAt: "desc" },
        include: { author: true, reviewer: true },
      });
      if (!content?.reviewer) return null;
      return transitInterpretationSchema.parse({
        transit,
        content: {
          title: content.title,
          opening: content.opening,
          deepening: content.deepening,
          technicalWhy: content.technicalWhy,
          reflectionPrompt: content.reflectionPrompt,
          practice: content.practice,
          version: content.version,
          generationMethod: content.generationMethod,
          author: content.author,
          reviewer: content.reviewer,
        },
      });
    }),
  );
  return selected.filter((item): item is NonNullable<typeof item> => item !== null);
}
