import type { PrismaClient } from "@/generated/prisma/client";
import { canReview } from "@/lib/editorial/authorization";
import type { EditorialActor, EditorialReview } from "@/lib/editorial/contracts";

export type EditorialTransitionResult =
  | { status: "updated"; entryStatus: "IN_REVIEW" | "PUBLISHED" | "DRAFT" | "WITHDRAWN" }
  | {
      status: "forbidden" | "not_found" | "invalid_state" | "missing_claims" | "ineligible_sources";
    };

export async function submitCulturalEntry(
  prisma: PrismaClient,
  entryId: string,
  actor: EditorialActor,
): Promise<EditorialTransitionResult> {
  const updated = await prisma.culturalEntry.updateMany({
    where: {
      id: entryId,
      authorId: actor.id,
      status: "DRAFT",
      claims: {
        some: { status: { in: ["ACTIVE", "CONTESTED"] } },
        none: {
          status: { in: ["ACTIVE", "CONTESTED"] },
          OR: [{ sourceLocator: null }, { source: { usageStatus: { not: "CLAIM_ELIGIBLE" } } }],
        },
      },
    },
    data: { status: "IN_REVIEW", reviewerId: null, reviewedAt: null, publishedAt: null },
  });
  if (updated.count === 1) return { status: "updated", entryStatus: "IN_REVIEW" };

  const entry = await prisma.culturalEntry.findUnique({
    where: { id: entryId },
    select: {
      authorId: true,
      status: true,
      claims: {
        where: { status: { in: ["ACTIVE", "CONTESTED"] } },
        select: { sourceLocator: true, source: { select: { usageStatus: true } } },
      },
    },
  });
  if (entry === null) return { status: "not_found" };
  if (entry.authorId !== actor.id) return { status: "forbidden" };
  if (entry.claims.length === 0) return { status: "missing_claims" };
  if (
    entry.claims.some(
      (claim) => claim.sourceLocator === null || claim.source.usageStatus !== "CLAIM_ELIGIBLE",
    )
  )
    return { status: "ineligible_sources" };
  return { status: "invalid_state" };
}

export async function reviewCulturalEntry(
  prisma: PrismaClient,
  entryId: string,
  actor: EditorialActor,
  review: EditorialReview,
  now: Date,
): Promise<EditorialTransitionResult> {
  if (!canReview(actor)) return { status: "forbidden" };

  return prisma.$transaction(async (tx) => {
    const entry = await tx.culturalEntry.findUnique({
      where: { id: entryId },
      select: {
        authorId: true,
        status: true,
        claims: {
          where: { status: { in: ["ACTIVE", "CONTESTED"] } },
          select: {
            id: true,
            sourceLocator: true,
            source: { select: { usageStatus: true } },
          },
        },
      },
    });
    if (entry === null) return { status: "not_found" };
    if (entry.authorId === actor.id) return { status: "forbidden" };
    if (review.decision !== "WITHDRAWN" && entry.status !== "IN_REVIEW")
      return { status: "invalid_state" };
    if (review.decision === "WITHDRAWN" && entry.status !== "PUBLISHED")
      return { status: "invalid_state" };
    if (review.decision === "APPROVED" && entry.claims.length === 0)
      return { status: "missing_claims" };
    if (
      review.decision === "APPROVED" &&
      entry.claims.some(
        (claim) => claim.sourceLocator === null || claim.source.usageStatus !== "CLAIM_ELIGIBLE",
      )
    )
      return { status: "ineligible_sources" };

    await tx.culturalReview.create({
      data: {
        entryId,
        reviewerId: actor.id,
        decision: review.decision,
        note: review.note ?? null,
      },
    });

    const entryStatus = decisionStatus(review.decision);
    await tx.culturalEntry.update({
      where: { id: entryId },
      data: {
        status: entryStatus,
        reviewerId: actor.id,
        reviewedAt: now,
        publishedAt: review.decision === "APPROVED" ? now : null,
      },
    });
    return { status: "updated", entryStatus };
  });
}

function decisionStatus(
  decision: EditorialReview["decision"],
): "PUBLISHED" | "DRAFT" | "WITHDRAWN" {
  if (decision === "APPROVED") return "PUBLISHED";
  if (decision === "WITHDRAWN") return "WITHDRAWN";
  return "DRAFT";
}
