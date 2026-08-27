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
        // Toda claim ativa precisa de locator. O status de elegibilidade da fonte saiu
        // com o modelo de direitos por obra; a posição citável continua obrigatória.
        none: { status: { in: ["ACTIVE", "CONTESTED"] }, sourceLocator: null },
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
        select: { sourceLocator: true },
      },
    },
  });
  if (entry === null) return { status: "not_found" };
  if (entry.authorId !== actor.id) return { status: "forbidden" };
  if (entry.claims.length === 0) return { status: "missing_claims" };
  if (entry.claims.some((claim) => claim.sourceLocator === null))
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
          },
        },
      },
    });
    if (entry === null) return { status: "not_found" };
    // Autoria e revisão podem ser a mesma pessoa. A regra oposta vinha do modelo em que
    // publicar dependia de aprovação externa (BLUEPRINT §5.0); num projeto de uma pessoa
    // ela só se satisfazia com uma segunda conta assinando a própria revisão, o que
    // transformava a garantia numa ficção registrada no banco.
    if (review.decision !== "WITHDRAWN" && entry.status !== "IN_REVIEW")
      return { status: "invalid_state" };
    if (review.decision === "WITHDRAWN" && entry.status !== "PUBLISHED")
      return { status: "invalid_state" };
    if (review.decision === "APPROVED" && entry.claims.length === 0)
      return { status: "missing_claims" };
    // A exigência de locator permanece: uma afirmação material aponta para uma posição
    // citável, e sem isso não há como reestudar o ponto quando a leitura se mostrar errada.
    // O status de elegibilidade da fonte saiu junto com o modelo de direitos por obra.
    if (
      review.decision === "APPROVED" &&
      entry.claims.some((claim) => claim.sourceLocator === null)
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
