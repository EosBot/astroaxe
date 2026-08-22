import type { PrismaClient } from "@/generated/prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  findPublishedCulturalEntry,
  listPublishedCulturalEntries,
} from "@/lib/cultural-content/public-entry";

describe("published cultural content", () => {
  it("queries only published versions and exposes attribution without review notes", async () => {
    const findFirst = vi.fn().mockResolvedValue(databaseEntry());
    const result = await findPublishedCulturalEntry(
      { culturalEntry: { findFirst } } as unknown as PrismaClient,
      "figura-simbolica",
      new Date("2026-08-19T13:00:00.000Z"),
    );

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ slug: "figura-simbolica", status: "PUBLISHED" }),
      }),
    );
    expect(result).toMatchObject({
      slug: "figura-simbolica",
      author: { displayName: "Autoria" },
      reviewer: { displayName: "Revisão" },
      claims: [{ status: "active" }],
    });
    expect(result).not.toHaveProperty("reviews");
  });

  it("does not expose an entry without a reviewer", async () => {
    const findFirst = vi.fn().mockResolvedValue({ ...databaseEntry(), reviewer: null });
    await expect(
      findPublishedCulturalEntry(
        { culturalEntry: { findFirst } } as unknown as PrismaClient,
        "figura-simbolica",
        new Date("2026-08-19T13:00:00.000Z"),
      ),
    ).resolves.toBeNull();
  });

  it("lists only independently reviewed published versions", async () => {
    const findMany = vi
      .fn()
      .mockResolvedValue([
        databaseEntry(),
        { ...databaseEntry(), slug: "sem-revisao", reviewer: null },
      ]);
    const result = await listPublishedCulturalEntries(
      { culturalEntry: { findMany } } as unknown as PrismaClient,
      new Date("2026-08-19T13:00:00.000Z"),
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PUBLISHED" }),
        distinct: ["slug"],
      }),
    );
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.slug).toBe("figura-simbolica");
  });
});

function databaseEntry() {
  return {
    slug: "figura-simbolica",
    displayName: "Figura simbólica",
    category: "orisa",
    traditionId: "CandombleKetuNago",
    summary: "Uma aproximação editorial situada e aberta à exploração.",
    editorialBody: "Este texto apresenta uma narrativa pública com contexto e autoria.",
    version: "knowledge-1",
    publishedAt: new Date("2026-08-19T12:00:00.000Z"),
    author: { displayName: "Autoria", attributionLine: "Pesquisa e texto" },
    reviewer: { displayName: "Revisão", attributionLine: "Revisão cultural" },
    claims: [
      {
        claimKey: "claim-1",
        predicate: "contextualiza",
        objectSummary: "Claim pública e situada.",
        sourceLocator: null,
        status: "ACTIVE",
        source: {
          title: "Fonte pública",
          url: "https://example.test/fonte",
          evidenceKind: "community-primary",
          licenseNote: "Uso autorizado para síntese com atribuição.",
          accessedAt: new Date("2026-08-19T00:00:00.000Z"),
        },
      },
    ],
  };
}
