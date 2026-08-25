import { z } from "zod";

export const regencyEntitySchema = z
  .object({
    id: z.string().regex(/^(orisa|umbanda-line|nkisi):[a-z0-9-]+$/),
    kind: z.enum(["orisa", "umbanda_line", "nkisi"]),
    canonicalName: z.string().trim().min(1).max(80),
    aliases: z.array(z.string().trim().min(1).max(80)).max(12),
    eligibleForRegency: z.boolean(),
  })
  .strict()
  .superRefine((entity, context) => {
    const prefixes = { orisa: "orisa:", nkisi: "nkisi:", umbanda_line: "umbanda-line:" } as const;
    const expectedPrefix = prefixes[entity.kind];
    if (!entity.id.startsWith(expectedPrefix))
      context.addIssue({
        code: "custom",
        path: ["id"],
        message: "O prefixo do ID deve preservar a categoria da entidade.",
      });
    if (entity.kind !== "orisa" && entity.eligibleForRegency)
      context.addIssue({
        code: "custom",
        path: ["eligibleForRegency"],
        message: "Somente Orixas podem concorrer aos tres papeis de regencia.",
      });
  });

export const correspondenceSourceSchema = z
  .object({
    id: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(300),
    url: z.url(),
    locator: z.string().trim().min(1).max(160),
    evidenceKind: z.enum([
      "community_primary",
      "scholarly_analysis",
      "institutional_inventory",
      "product_editorial",
    ]),
  })
  .strict();

const correspondenceClaimBaseSchema = z
  .object({
    id: z.string().trim().min(1).max(120),
    targetId: z.string().regex(/^(orisa|umbanda-line|nkisi):[a-z0-9-]+$/),
    schoolId: z.string().trim().min(1).max(120),
    factor: z.enum([
      "planet",
      "zodiac_sign",
      "element",
      "modality",
      "house",
      "angle",
      "decan",
      "dignity",
      "retrograde",
      "aspect",
      "angularity",
      "planetary_day",
      "planetary_hour",
      "birth_number",
    ]),
    values: z.array(z.string().trim().min(1).max(40)).min(1).max(12),
    manifestation: z
      .object({
        facetId: z.string().regex(/^[a-z0-9-]+$/),
        label: z.string().trim().min(1).max(100),
        description: z.string().trim().min(1).max(500),
      })
      .strict()
      .optional(),
  })
  .strict();

const publishedCorrespondenceClaimSchema = correspondenceClaimBaseSchema.extend({
  evidenceTrack: z.literal("published_correspondence"),
  sourceId: z.string().trim().min(1).max(120),
  algorithmWeight: z.null(),
});

const derivedCorrespondenceClaimSchema = correspondenceClaimBaseSchema.extend({
  evidenceTrack: z.literal("derived_symbolic_hypothesis"),
  sourceIds: z.array(z.string().trim().min(1).max(120)).min(1).max(8),
  attributeClaimIds: z
    .array(z.string().regex(/^attribute:[a-z0-9-:]+$/))
    .min(1)
    .max(8),
  derivationRuleId: z.string().regex(/^derivation:[a-z0-9-:]+$/),
  convergenceStrength: z.number().min(0).max(1),
  algorithmWeight: z.null(),
});

const numerologicalMappingClaimSchema = correspondenceClaimBaseSchema.extend({
  evidenceTrack: z.literal("numerological_mapping"),
  sourceId: z.string().trim().min(1).max(120),
  lensId: z.string().regex(/^[a-z0-9-]+$/),
  algorithmWeight: z.null(),
});

export const correspondenceClaimSchema = z.discriminatedUnion("evidenceTrack", [
  publishedCorrespondenceClaimSchema,
  derivedCorrespondenceClaimSchema,
  numerologicalMappingClaimSchema,
]);

export const regencyMatrixSchema = z
  .object({
    version: z.string().trim().min(1).max(80),
    status: z.literal("research"),
    entities: z.array(regencyEntitySchema).min(3).max(40),
    sources: z.array(correspondenceSourceSchema).min(1).max(100),
    claims: z.array(correspondenceClaimSchema).min(1).max(500),
  })
  .strict()
  .superRefine((matrix, context) => {
    const entityIds = new Set(matrix.entities.map((entity) => entity.id));
    const sourceIds = new Set(matrix.sources.map((source) => source.id));
    const claimIds = new Set<string>();
    matrix.claims.forEach((claim, index) => {
      if (!entityIds.has(claim.targetId))
        context.addIssue({
          code: "custom",
          path: ["claims", index, "targetId"],
          message: "A entidade da correspondencia deve existir na ontologia.",
        });
      const claimSourceIds =
        claim.evidenceTrack === "derived_symbolic_hypothesis" ? claim.sourceIds : [claim.sourceId];
      if (claimSourceIds.some((sourceId) => !sourceIds.has(sourceId)))
        context.addIssue({
          code: "custom",
          path: ["claims", index, "sourceId"],
          message: "A fonte da correspondencia deve existir na matriz.",
        });
      if (claimIds.has(claim.id))
        context.addIssue({
          code: "custom",
          path: ["claims", index, "id"],
          message: "Cada claim deve ter um ID unico.",
        });
      claimIds.add(claim.id);
    });
  });

export type RegencyEntity = z.infer<typeof regencyEntitySchema>;
export type RegencyMatrix = z.infer<typeof regencyMatrixSchema>;
