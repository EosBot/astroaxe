import type { PrismaClient } from "@/generated/prisma/client";
import { describe, expect, it, vi } from "vitest";

import type { EditorialActor } from "@/lib/editorial/contracts";
import { reviewCulturalEntry, submitCulturalEntry } from "@/lib/editorial/workflow";

const author: EditorialActor = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  userId: "123e4567-e89b-42d3-a456-426614174001",
  role: "AUTHOR",
};
const reviewer: EditorialActor = {
  id: "123e4567-e89b-42d3-a456-426614174002",
  userId: "123e4567-e89b-42d3-a456-426614174003",
  role: "REVIEWER",
};

describe("editorial workflow", () => {
  it("allows the author to submit a sourced draft", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const result = await submitCulturalEntry(
      { culturalEntry: { updateMany } } as unknown as PrismaClient,
      "123e4567-e89b-42d3-a456-426614174004",
      author,
    );
    expect(result).toEqual({ status: "updated", entryStatus: "IN_REVIEW" });
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ authorId: author.id }) }),
    );
  });

  it("explains why a draft cannot be submitted", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      authorId: author.id,
      status: "DRAFT",
      claims: [],
    });
    const prisma = {
      culturalEntry: { updateMany: vi.fn().mockResolvedValue({ count: 0 }), findUnique },
    } as unknown as PrismaClient;
    await expect(submitCulturalEntry(prisma, entryId(), author)).resolves.toEqual({
      status: "missing_claims",
    });
  });

  /**
   * A regra anterior exigia revisor diferente do autor. Num projeto de uma pessoa ela só
   * se satisfazia com uma segunda conta assinando a própria revisão — uma ficção gravada
   * no banco com aparência de rigor. Ver BLUEPRINT §5.0 e a migration 20260826150000.
   */
  it("lets one person author and publish their own entry", async () => {
    const tx = transactionWithEntry({ authorId: reviewer.id, status: "IN_REVIEW", claims: [{}] });
    const result = await reviewCulturalEntry(
      tx.prisma,
      "123e4567-e89b-42d3-a456-426614174004",
      reviewer,
      { decision: "APPROVED" },
      new Date("2026-08-19T14:00:00.000Z"),
    );
    expect(result).toEqual({ status: "updated", entryStatus: "PUBLISHED" });
    expect(tx.createReview).toHaveBeenCalled();
  });

  it("publishes atomically after independent review", async () => {
    const tx = transactionWithEntry({ authorId: author.id, status: "IN_REVIEW", claims: [{}] });
    const now = new Date("2026-08-19T14:00:00.000Z");
    const result = await reviewCulturalEntry(
      tx.prisma,
      "123e4567-e89b-42d3-a456-426614174004",
      reviewer,
      { decision: "APPROVED" },
      now,
    );
    expect(result).toEqual({ status: "updated", entryStatus: "PUBLISHED" });
    expect(tx.createReview).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reviewerId: reviewer.id }) }),
    );
    expect(tx.updateEntry).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ publishedAt: now }) }),
    );
  });

  it("requires an active claim before approval", async () => {
    const tx = transactionWithEntry({ authorId: author.id, status: "IN_REVIEW", claims: [] });
    await expect(
      reviewCulturalEntry(
        tx.prisma,
        "123e4567-e89b-42d3-a456-426614174004",
        reviewer,
        { decision: "APPROVED" },
        new Date("2026-08-19T14:00:00.000Z"),
      ),
    ).resolves.toEqual({ status: "missing_claims" });
  });

  /**
   * O status de elegibilidade da fonte saiu com o modelo de direitos por obra. O que
   * continua bloqueando é claim sem locator: sem posição citável não há como reestudar o
   * ponto quando a leitura se mostrar errada.
   */
  it("blocks approval when a claim has no citable position", async () => {
    const tx = transactionWithEntry({
      authorId: author.id,
      status: "IN_REVIEW",
      claims: [{ id: entryId(), sourceLocator: null }],
    });
    await expect(
      reviewCulturalEntry(
        tx.prisma,
        entryId(),
        reviewer,
        { decision: "APPROVED" },
        new Date("2026-08-19T14:00:00.000Z"),
      ),
    ).resolves.toEqual({ status: "ineligible_sources" });
    expect(tx.createReview).not.toHaveBeenCalled();
  });

  it("returns requested changes to draft with an audit note", async () => {
    const tx = transactionWithEntry({ authorId: author.id, status: "IN_REVIEW", claims: [{}] });
    const result = await reviewCulturalEntry(
      tx.prisma,
      entryId(),
      reviewer,
      { decision: "CHANGES_REQUESTED", note: "Contextualizar a tradição." },
      new Date("2026-08-19T14:00:00.000Z"),
    );
    expect(result).toEqual({ status: "updated", entryStatus: "DRAFT" });
    expect(tx.updateEntry).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ publishedAt: null }) }),
    );
  });

  it("allows an independent reviewer to withdraw published content", async () => {
    const tx = transactionWithEntry({ authorId: author.id, status: "PUBLISHED", claims: [{}] });
    await expect(
      reviewCulturalEntry(
        tx.prisma,
        entryId(),
        reviewer,
        { decision: "WITHDRAWN", note: "Autorização retirada." },
        new Date("2026-08-19T14:00:00.000Z"),
      ),
    ).resolves.toEqual({ status: "updated", entryStatus: "WITHDRAWN" });
  });
});

function entryId(): string {
  return "123e4567-e89b-42d3-a456-426614174004";
}

function transactionWithEntry(entry: { authorId: string; status: string; claims: object[] }) {
  const normalizedEntry = {
    ...entry,
    claims: entry.claims.map((claim) => ({
      id: entryId(),
      sourceLocator: "seção verificada",
      source: { usageStatus: "CLAIM_ELIGIBLE" },
      ...claim,
    })),
  };
  const createReview = vi.fn().mockResolvedValue({});
  const updateEntry = vi.fn().mockResolvedValue({});
  const transaction = vi.fn(async (operation: (client: object) => Promise<unknown>) =>
    operation({
      culturalEntry: {
        findUnique: vi.fn().mockResolvedValue(normalizedEntry),
        update: updateEntry,
      },
      culturalReview: { create: createReview },
    }),
  );
  return {
    prisma: { $transaction: transaction } as unknown as PrismaClient,
    createReview,
    updateEntry,
  };
}
