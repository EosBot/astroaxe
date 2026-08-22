import { z } from "zod";

const jsonValueSchema = z.json();
type JsonValue = z.infer<typeof jsonValueSchema>;

const chartVersionSchema = z
  .object({
    engineVersion: z.string(),
    configVersion: z.string(),
    calculationMode: z.string(),
    result: z.json(),
    recordedAt: z.iso.datetime(),
    reason: z.string().optional(),
  })
  .strict();

const journalRevisionSchema = z
  .object({
    content: z.string(),
    supersededAt: z.iso.datetime(),
  })
  .strict();

export const accountExportSchema = z
  .object({
    format: z.literal("astroaxe-account-export"),
    version: z.literal(1),
    exportedAt: z.iso.datetime(),
    account: z
      .object({
        email: z.email(),
        createdAt: z.iso.datetime(),
      })
      .strict(),
    profiles: z.array(
      z
        .object({
          id: z.uuid(),
          displayName: z.string(),
          birthDate: z.iso.date(),
          birthTime: z.string().nullable(),
          timePrecision: z.enum(["KNOWN", "UNKNOWN"]),
          latitude: z.number(),
          longitude: z.number(),
          timezone: z.string(),
          location: z.string(),
          createdAt: z.iso.datetime(),
          chart: chartVersionSchema.nullable(),
          chartRevisions: z.array(chartVersionSchema),
          journal: z.array(
            z
              .object({
                id: z.uuid(),
                date: z.iso.date(),
                content: z.string(),
                createdAt: z.iso.datetime(),
                updatedAt: z.iso.datetime(),
                revisions: z.array(journalRevisionSchema),
              })
              .strict(),
          ),
        })
        .strict(),
    ),
  })
  .strict();

export type AccountExport = z.infer<typeof accountExportSchema>;

export function sanitizeChartResult(value: unknown): JsonValue {
  return removeInternalFields(jsonValueSchema.parse(value));
}

function removeInternalFields(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(removeInternalFields);
  if (value === null || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "inputFingerprint")
      .map(([key, nestedValue]) => [key, removeInternalFields(nestedValue)]),
  );
}
