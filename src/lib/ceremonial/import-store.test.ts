import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  proposeCorpusImport,
  type ImportCandidate,
  type ImportMapping,
} from "@/domain/ceremonial/import";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import {
  applyCorpusImport,
  openImportReviewHashes,
  resolveImportReview,
} from "@/lib/ceremonial/import-store";

/**
 * Runs against a real PostgreSQL, not a mock: every property worth asserting here — the
 * unique constraints, the CHECK on resolution, upsert idempotency, transactional rollback
 * — lives in the database, and a mocked client would only assert that this file calls the
 * methods it calls.
 *
 * Skipped when no throwaway database is configured, so the default suite stays hermetic:
 *   CEREMONIAL_TEST_DATABASE_URL=postgresql://... npx vitest run import-store
 */
const databaseUrl = process.env.CEREMONIAL_TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl === undefined ? describe.skip : describe;

// Same driver adapter the app uses, so the test exercises the real connection path.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl ?? "postgresql://skipped" }),
});

function hash(seed: string): string {
  return seed.repeat(64).slice(0, 64);
}

function candidate(
  relativePath: string,
  overrides: Partial<ImportCandidate> = {},
): ImportCandidate {
  return {
    relativePath,
    contentHash: hash("a"),
    mimeType: "application/pdf",
    byteSize: 2048,
    pageCount: 2,
    hasExtractedText: true,
    ...overrides,
  };
}

function mapping(overrides: Partial<ImportMapping> = {}): ImportMapping {
  return {
    contentHash: hash("a"),
    sourceSystemSlug: "lemegeton-teste",
    workTitle: "Ars Goetia (fixture)",
    authorLabel: null,
    editionLabel: "tradução de teste",
    language: "en",
    publishedYear: 1904,
    evidenceNote: "fixture sintética criada apenas para este teste automatizado",
    ...overrides,
  };
}

async function clearCorpus(): Promise<void> {
  await prisma.ceremonialImportReview.deleteMany({});
  await prisma.ceremonialLocator.deleteMany({});
  await prisma.ceremonialArtifact.deleteMany({});
  await prisma.ceremonialEdition.deleteMany({});
  await prisma.ceremonialWork.deleteMany({});
  await prisma.ceremonialSourceSystem.deleteMany({});
}

afterAll(async () => {
  await prisma.$disconnect();
});

describeWithDatabase("applyCorpusImport", () => {
  beforeEach(clearCorpus);

  it("writes the whole lineage for a mapped artifact", async () => {
    const plan = proposeCorpusImport([candidate("Livros/a.pdf")], [mapping()]);
    const result = await applyCorpusImport(prisma, plan);

    expect(result).toMatchObject({ works: 1, editions: 1, artifacts: 1, reviewsOpened: 0 });
    // One citable position per extracted page, and nothing invented beyond them.
    expect(result.locators).toBe(2);

    const artifact = await prisma.ceremonialArtifact.findUnique({
      where: { contentHash: hash("a") },
      select: { access: true, rights: true, edition: { select: { label: true } } },
    });
    expect(artifact?.edition.label).toBe("tradução de teste");
    expect(artifact?.access).toBe("LOCAL_ONLY");
    expect(artifact?.rights).toBe("UNKNOWN");
  });

  it("is idempotent: a second run over an unchanged corpus adds nothing", async () => {
    const plan = proposeCorpusImport([candidate("Livros/a.pdf")], [mapping()]);
    await applyCorpusImport(prisma, plan);
    const second = await applyCorpusImport(prisma, plan);

    expect(second).toMatchObject({ works: 0, editions: 0, locators: 0, reviewsOpened: 0 });
    expect(await prisma.ceremonialEdition.count()).toBe(1);
    expect(await prisma.ceremonialLocator.count()).toBe(2);
  });

  it("follows the bytes when a file is renamed, instead of adding a second artifact", async () => {
    await applyCorpusImport(prisma, proposeCorpusImport([candidate("Livros/a.pdf")], [mapping()]));
    await applyCorpusImport(
      prisma,
      proposeCorpusImport([candidate("Livros/renomeado.pdf")], [mapping()]),
    );

    expect(await prisma.ceremonialArtifact.count()).toBe(1);
    const artifact = await prisma.ceremonialArtifact.findUnique({
      where: { contentHash: hash("a") },
      select: { relativePath: true },
    });
    expect(artifact?.relativePath).toBe("Livros/renomeado.pdf");
  });

  it("opens one queue item per unverified field when nothing is mapped", async () => {
    const plan = proposeCorpusImport([candidate("Livros/a.pdf")], []);
    const result = await applyCorpusImport(prisma, plan);

    expect(result.reviewsOpened).toBe(4);
    const rows = await prisma.ceremonialImportReview.findMany({
      select: { reason: true, state: true },
      orderBy: { reason: "asc" },
    });
    expect(rows.map((row) => row.reason)).toEqual([
      "AUTHOR_UNKNOWN",
      "EDITION_UNESTABLISHED",
      "LANGUAGE_UNVERIFIED",
      "TITLE_FROM_FILENAME",
    ]);
    expect(rows.every((row) => row.state === "OPEN")).toBe(true);
  });

  it("keeps two translations as distinct editions of one work", async () => {
    const plan = proposeCorpusImport(
      [
        candidate("en.pdf", { contentHash: hash("a") }),
        candidate("pt.pdf", { contentHash: hash("b") }),
      ],
      [
        mapping({ contentHash: hash("a") }),
        mapping({ contentHash: hash("b"), editionLabel: "tradução pt", language: "pt-BR" }),
      ],
    );
    const result = await applyCorpusImport(prisma, plan);

    expect(result).toMatchObject({ works: 1, editions: 2, artifacts: 2 });
    expect(await prisma.ceremonialWork.count()).toBe(1);
  });

  it("rolls the whole plan back when one proposal cannot be written", async () => {
    const plan = proposeCorpusImport([candidate("Livros/a.pdf")], [mapping()]);
    const first = plan.proposals[0];
    expect(first).toBeDefined();
    if (first === undefined) return;

    const corrupted = {
      ...plan,
      // A title past the column width: the database refuses it, and the valid proposal
      // ahead of it must not survive alone.
      proposals: [
        ...plan.proposals,
        { ...first, contentHash: hash("b"), workTitle: "x".repeat(400) },
      ],
    };

    await expect(applyCorpusImport(prisma, corrupted)).rejects.toThrow();
    expect(await prisma.ceremonialArtifact.count()).toBe(0);
    expect(await prisma.ceremonialWork.count()).toBe(0);
  });
});

describeWithDatabase("fila de revisão", () => {
  beforeEach(clearCorpus);

  it("reports every unresolved artifact to the publication gate", async () => {
    await applyCorpusImport(prisma, proposeCorpusImport([candidate("a.pdf")], []));
    expect(await openImportReviewHashes(prisma)).toEqual(new Set([hash("a")]));
  });

  it("stops reporting an artifact once every question about it is answered", async () => {
    await applyCorpusImport(prisma, proposeCorpusImport([candidate("a.pdf")], []));
    for (const reason of [
      "TITLE_FROM_FILENAME",
      "AUTHOR_UNKNOWN",
      "EDITION_UNESTABLISHED",
      "LANGUAGE_UNVERIFIED",
    ])
      expect(
        await resolveImportReview(
          prisma,
          hash("a"),
          reason,
          "conferido com o exemplar",
          new Date(),
        ),
      ).toBe(true);

    expect(await openImportReviewHashes(prisma)).toEqual(new Set());
  });

  it("keeps reporting while even one question is still open", async () => {
    await applyCorpusImport(prisma, proposeCorpusImport([candidate("a.pdf")], []));
    await resolveImportReview(prisma, hash("a"), "TITLE_FROM_FILENAME", "conferido", new Date());
    expect(await openImportReviewHashes(prisma)).toEqual(new Set([hash("a")]));
  });

  it("does not reopen a resolved item when the importer runs again", async () => {
    const plan = proposeCorpusImport([candidate("a.pdf")], []);
    await applyCorpusImport(prisma, plan);
    await resolveImportReview(prisma, hash("a"), "TITLE_FROM_FILENAME", "conferido", new Date());

    const second = await applyCorpusImport(prisma, plan);
    expect(second.reviewsOpened).toBe(0);
    expect(second.reviewsAlreadyResolved).toBe(1);

    const row = await prisma.ceremonialImportReview.findUnique({
      where: { contentHash_reason: { contentHash: hash("a"), reason: "TITLE_FROM_FILENAME" } },
      select: { state: true, resolutionNote: true },
    });
    expect(row).toMatchObject({ state: "RESOLVED", resolutionNote: "conferido" });
  });

  it("refuses to resolve a question nobody asked", async () => {
    expect(
      await resolveImportReview(prisma, hash("f"), "TITLE_FROM_FILENAME", "nota", new Date()),
    ).toBe(false);
  });
});
