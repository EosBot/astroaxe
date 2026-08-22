import type { PrismaClient } from "@/generated/prisma/client";
import {
  publicCulturalCollectionSchema,
  publicCulturalEntrySchema,
  type PublicCulturalCollection,
  type PublicCulturalEntry,
} from "@/lib/cultural-content/contracts";
import { SYMBOLIC_RESONANCE_DISCLAIMER } from "@/lib/orixas/contracts";

export async function findPublishedCulturalEntry(
  prisma: PrismaClient,
  slug: string,
  now: Date,
): Promise<PublicCulturalEntry | null> {
  const entry = await prisma.culturalEntry.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { lte: now } },
    orderBy: { publishedAt: "desc" },
    include: {
      author: true,
      reviewer: true,
      claims: {
        where: { status: { in: ["ACTIVE", "CONTESTED"] } },
        orderBy: { claimKey: "asc" },
        include: { source: true },
      },
    },
  });
  if (!entry?.reviewer || !entry.publishedAt) return null;
  return serializePublicEntry({ ...entry, reviewer: entry.reviewer });
}

export async function listPublishedCulturalEntries(
  prisma: PrismaClient,
  now: Date,
): Promise<PublicCulturalCollection> {
  const entries = await prisma.culturalEntry.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: now } },
    orderBy: [{ displayName: "asc" }, { publishedAt: "desc" }],
    distinct: ["slug"],
    include: {
      author: true,
      reviewer: true,
      claims: {
        where: { status: { in: ["ACTIVE", "CONTESTED"] } },
        orderBy: { claimKey: "asc" },
        include: { source: true },
      },
    },
  });

  return publicCulturalCollectionSchema.parse({
    entries: entries.flatMap((entry) =>
      entry.reviewer !== null && entry.publishedAt !== null
        ? [serializePublicEntry({ ...entry, reviewer: entry.reviewer })]
        : [],
    ),
  });
}

function publicContributor(contributor: { displayName: string; attributionLine: string }): {
  displayName: string;
  attributionLine: string;
} {
  return {
    displayName: contributor.displayName,
    attributionLine: contributor.attributionLine,
  };
}

type EntryWithPublicationRelations = {
  slug: string;
  displayName: string;
  category: string;
  traditionId: string;
  summary: string;
  editorialBody: string;
  version: string;
  publishedAt: Date | null;
  author: { displayName: string; attributionLine: string };
  reviewer: { displayName: string; attributionLine: string };
  claims: Array<{
    claimKey: string;
    predicate: string;
    objectSummary: string;
    sourceLocator: string | null;
    status: string;
    source: {
      title: string;
      url: string;
      evidenceKind: string;
      licenseNote: string;
      accessedAt: Date;
    };
  }>;
};

function serializePublicEntry(entry: EntryWithPublicationRelations): PublicCulturalEntry {
  if (entry.publishedAt === null) throw new Error("published cultural entry is missing timestamp");

  return publicCulturalEntrySchema.parse({
    kind: "reviewed_cultural_content",
    disclaimer: SYMBOLIC_RESONANCE_DISCLAIMER,
    slug: entry.slug,
    displayName: entry.displayName,
    category: entry.category,
    traditionId: entry.traditionId,
    summary: entry.summary,
    editorialBody: entry.editorialBody,
    version: entry.version,
    publishedAt: entry.publishedAt.toISOString(),
    author: publicContributor(entry.author),
    reviewer: publicContributor(entry.reviewer),
    claims: entry.claims.map((claim) => ({
      claimKey: claim.claimKey,
      predicate: claim.predicate,
      objectSummary: claim.objectSummary,
      sourceLocator: claim.sourceLocator,
      status: claim.status.toLocaleLowerCase("en-US"),
      source: {
        title: claim.source.title,
        url: claim.source.url,
        evidenceKind: claim.source.evidenceKind,
        licenseNote: claim.source.licenseNote,
        accessedAt: claim.source.accessedAt.toISOString().slice(0, 10),
      },
    })),
  });
}
