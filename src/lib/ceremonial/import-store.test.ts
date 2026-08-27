import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  proposeCorpusImport,
  type ImportCandidate,
  type ImportMapping,
} from "@/domain/ceremonial/import";
import { PrismaClient } from "@/generated/prisma/client";
import { applyCorpusImport } from "@/lib/ceremonial/import-store";

/**
 * Runs against a real PostgreSQL, not a mock: every property worth asserting here — the
 * unique constraints, upsert idempotency, transactional rollback — lives in the database,
 * and a mocked client would only assert that this file calls the methods it calls.
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

    expect(result).toMatchObject({ works: 1, editions: 1, artifacts: 1 });
    // One citable position per extracted page, and nothing invented beyond them.
    expect(result.locators).toBe(2);

    const artifact = await prisma.ceremonialArtifact.findUnique({
      where: { contentHash: hash("a") },
      select: { edition: { select: { label: true, language: true } } },
    });
    expect(artifact?.edition).toEqual({ label: "tradução de teste", language: "en" });
  });

  it("is idempotent: a second run over an unchanged corpus adds nothing", async () => {
    const plan = proposeCorpusImport([candidate("Livros/a.pdf")], [mapping()]);
    await applyCorpusImport(prisma, plan);
    const second = await applyCorpusImport(prisma, plan);

    expect(second).toMatchObject({ works: 0, editions: 0, locators: 0 });
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
