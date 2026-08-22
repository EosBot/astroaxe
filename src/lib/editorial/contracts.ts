import { z } from "zod";

import {
  evidenceKindSchema,
  sacredCategorySchema,
  safePublicCopySchema,
} from "@/lib/orixas/contracts";

export const editorialRoleSchema = z.enum(["AUTHOR", "REVIEWER", "ADMIN"]);
export const culturalSourceUsageStatusSchema = z.enum([
  "REFERENCE_ONLY",
  "CLAIM_ELIGIBLE",
  "WITHDRAWN",
]);

export const editorialActorSchema = z
  .object({
    id: z.uuid(),
    userId: z.uuid(),
    role: editorialRoleSchema,
  })
  .strict();

export const editorialReviewSchema = z
  .object({
    decision: z.enum(["APPROVED", "CHANGES_REQUESTED", "WITHDRAWN"]),
    note: z.string().trim().min(1).max(2_000).optional(),
  })
  .strict()
  .superRefine((review, context) => {
    if (review.decision !== "APPROVED" && review.note === undefined) {
      context.addIssue({
        code: "custom",
        path: ["note"],
        message: "Uma decisão de alteração ou retirada exige justificativa.",
      });
    }
  });

export const createCulturalSourceSchema = z
  .object({
    sourceKey: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().trim().min(1).max(300),
    url: z.url(),
    evidenceKind: evidenceKindSchema,
    usageStatus: culturalSourceUsageStatusSchema.default("REFERENCE_ONLY"),
    licenseNote: z.string().trim().min(1).max(500),
    accessedAt: z.iso.date(),
  })
  .strict();

const draftClaimSchema = z
  .object({
    sourceId: z.uuid(),
    claimKey: z.string().trim().min(1).max(120),
    predicate: z.string().trim().min(1).max(120),
    objectSummary: safePublicCopySchema.max(500),
    sourceLocator: z.string().trim().min(1).max(120).optional(),
    status: z.enum(["ACTIVE", "CONTESTED"]).default("ACTIVE"),
  })
  .strict();

export const createCulturalEntrySchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    displayName: z.string().trim().min(1).max(120),
    category: sacredCategorySchema,
    traditionId: z.string().trim().min(1).max(120),
    summary: safePublicCopySchema,
    editorialBody: safePublicCopySchema,
    version: z.string().trim().min(1).max(80),
    claims: z.array(draftClaimSchema).min(1).max(50),
  })
  .strict();

export type EditorialActor = z.infer<typeof editorialActorSchema>;
export type EditorialReview = z.infer<typeof editorialReviewSchema>;
