import { z } from "zod";

import {
  evidenceKindSchema,
  sacredCategorySchema,
  safePublicCopySchema,
  SYMBOLIC_RESONANCE_DISCLAIMER,
} from "@/lib/orixas/contracts";

export const culturalEntrySlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const culturalClaimStatusSchema = z.enum(["active", "contested"]);

const publicContributorSchema = z
  .object({
    displayName: z.string().trim().min(1).max(120),
    attributionLine: z.string().trim().min(1).max(300),
  })
  .strict();

const publicSourceSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    url: z.url(),
    evidenceKind: evidenceKindSchema,
    licenseNote: z.string().trim().min(1).max(500),
    accessedAt: z.iso.date(),
  })
  .strict();

const publicCulturalClaimSchema = z
  .object({
    claimKey: z.string().trim().min(1).max(120),
    predicate: z.string().trim().min(1).max(120),
    objectSummary: safePublicCopySchema.max(500),
    sourceLocator: z.string().trim().min(1).max(120).nullable(),
    status: culturalClaimStatusSchema,
    source: publicSourceSchema,
  })
  .strict();

export const publicCulturalEntrySchema = z
  .object({
    kind: z.literal("reviewed_cultural_content"),
    disclaimer: z.literal(SYMBOLIC_RESONANCE_DISCLAIMER),
    slug: culturalEntrySlugSchema,
    displayName: z.string().trim().min(1).max(120),
    category: sacredCategorySchema,
    traditionId: z.string().trim().min(1).max(120),
    summary: safePublicCopySchema.max(2_000),
    editorialBody: safePublicCopySchema.max(12_000),
    version: z.string().trim().min(1).max(80),
    publishedAt: z.iso.datetime({ offset: true }),
    author: publicContributorSchema,
    reviewer: publicContributorSchema,
    claims: z.array(publicCulturalClaimSchema).min(1).max(50),
  })
  .strict();

export type PublicCulturalEntry = z.infer<typeof publicCulturalEntrySchema>;

export const publicCulturalCollectionSchema = z
  .object({
    entries: z.array(publicCulturalEntrySchema).max(100),
  })
  .strict();

export type PublicCulturalCollection = z.infer<typeof publicCulturalCollectionSchema>;
