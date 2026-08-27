import { describe, expect, it } from "vitest";

import {
  filenameHint,
  importMappingSchema,
  proposeCorpusImport,
  proposeLocators,
  type ImportCandidate,
  type ImportMapping,
} from "./import";

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
    byteSize: 1024,
    pageCount: null,
    hasExtractedText: true,
    ...overrides,
  };
}

function mapping(overrides: Partial<ImportMapping> = {}): ImportMapping {
  return {
    contentHash: hash("a"),
    sourceSystemSlug: "lemegeton",
    workTitle: "Ars Goetia",
    authorLabel: null,
    editionLabel: "tradução Mathers 1904",
    language: "en",
    publishedYear: 1904,
    evidenceNote: "conferido contra o exemplar impresso, folha de rosto e colofão",
    ...overrides,
  };
}

describe("filenameHint", () => {
  it("offers the bare filename as a suggestion, without the extension or path", () => {
    expect(filenameHint("Livros/Goetia/lemegeton_completo.pdf")).toBe("lemegeton completo");
  });

  it("survives a name with no extension and one with several dots", () => {
    expect(filenameHint("pasta/sem-extensao")).toBe("sem-extensao");
    expect(filenameHint("pasta/v.2.ed.revisada.pdf")).toBe("v.2.ed.revisada");
  });
});

describe("proposeLocators", () => {
  it("emits one citable position per extracted page", () => {
    expect(proposeLocators(candidate("a.pdf", { pageCount: 3 }))).toEqual([
      { kind: "PAGE", reference: "p. 1" },
      { kind: "PAGE", reference: "p. 2" },
      { kind: "PAGE", reference: "p. 3" },
    ]);
  });

  it("emits none for an artifact with no pages, rather than a fake anchor", () => {
    expect(proposeLocators(candidate("a.txt"))).toEqual([]);
    expect(proposeLocators(candidate("a.txt", { pageCount: 0 }))).toEqual([]);
  });

  it("uses only PAGE — every other kind requires reading the edition", () => {
    const kinds = new Set(proposeLocators(candidate("a.pdf", { pageCount: 2 })).map((l) => l.kind));
    expect([...kinds]).toEqual(["PAGE"]);
  });
});

describe("importMappingSchema", () => {
  it("requires the operator to say how the identity was established", () => {
    expect(importMappingSchema.safeParse(mapping({ evidenceNote: "achei" })).success).toBe(false);
  });

  it("accepts an explicit anonymous work but not a missing decision", () => {
    expect(importMappingSchema.safeParse(mapping({ authorLabel: null })).success).toBe(true);
    const withoutAuthor: Record<string, unknown> = { ...mapping() };
    delete withoutAuthor.authorLabel;
    expect(importMappingSchema.safeParse(withoutAuthor).success).toBe(false);
  });

  it("refuses a mapping with no edition, which is the whole point of the field", () => {
    expect(importMappingSchema.safeParse(mapping({ editionLabel: "" })).success).toBe(false);
  });
});

describe("proposeCorpusImport — sem mapeamento", () => {
  it("queues title, author, edition and language separately for one unmapped artifact", () => {
    const plan = proposeCorpusImport([candidate("Livros/lemegeton.pdf")], []);

    expect(plan.summary.unresolved).toBe(1);
    expect(plan.summary.resolved).toBe(0);
    expect(plan.summary.reviewsByReason).toEqual({
      AUTHOR_UNKNOWN: 1,
      EDITION_UNESTABLISHED: 1,
      LANGUAGE_UNVERIFIED: 1,
      NO_LOCATOR_SCHEME: 1,
      TITLE_FROM_FILENAME: 1,
    });
  });

  it("marks the proposal unresolved so nothing downstream can treat it as identified", () => {
    const plan = proposeCorpusImport([candidate("Livros/lemegeton.pdf")], []);
    expect(plan.proposals[0]).toMatchObject({
      resolved: false,
      workTitle: "lemegeton",
      editionLabel: "unestablished",
      language: "und",
      sourceSystemSlug: "unassigned",
      access: "LOCAL_ONLY",
      rights: "UNKNOWN",
    });
  });

  it("offers the filename as a proposed value a reviewer can accept or correct", () => {
    const plan = proposeCorpusImport([candidate("Livros/lemegeton.pdf")], []);
    const title = plan.reviews.find((item) => item.reason === "TITLE_FROM_FILENAME");
    expect(title?.proposedValue).toBe("lemegeton");
  });
});

describe("proposeCorpusImport — com mapeamento", () => {
  it("accepts an operator decision as the identity, with nothing left to review", () => {
    const plan = proposeCorpusImport(
      [candidate("Livros/lemegeton.pdf", { pageCount: 2 })],
      [mapping()],
    );

    expect(plan.summary.resolved).toBe(1);
    expect(plan.reviews).toEqual([]);
    expect(plan.proposals[0]).toMatchObject({
      resolved: true,
      workTitle: "Ars Goetia",
      editionLabel: "tradução Mathers 1904",
      language: "en",
      publishedYear: 1904,
    });
  });

  it("still imports as local-only with unknown rights: identity is not permission", () => {
    const plan = proposeCorpusImport([candidate("Livros/lemegeton.pdf")], [mapping()]);
    expect(plan.proposals[0]).toMatchObject({
      access: "LOCAL_ONLY",
      rights: "UNKNOWN",
      sensitivity: "CULTURALLY_SENSITIVE",
    });
  });

  it("keeps a compilation and its source text as distinct editions of distinct works", () => {
    const plan = proposeCorpusImport(
      [
        candidate("a.pdf", { contentHash: hash("a") }),
        candidate("b.pdf", { contentHash: hash("b") }),
      ],
      [
        mapping({ contentHash: hash("a") }),
        mapping({
          contentHash: hash("b"),
          workTitle: "Lemegeton",
          editionLabel: "compilação Weiser 1995",
        }),
      ],
    );

    expect(plan.summary.distinctWorks).toBe(2);
    expect(plan.summary.distinctEditions).toBe(2);
  });

  it("keeps two translations of one work as distinct editions of the same work", () => {
    const plan = proposeCorpusImport(
      [
        candidate("en.pdf", { contentHash: hash("a") }),
        candidate("pt.pdf", { contentHash: hash("b") }),
      ],
      [
        mapping({ contentHash: hash("a") }),
        mapping({
          contentHash: hash("b"),
          editionLabel: "tradução brasileira 2010",
          language: "pt-BR",
        }),
      ],
    );

    expect(plan.summary.distinctWorks).toBe(1);
    expect(plan.summary.distinctEditions).toBe(2);
  });
});

describe("proposeCorpusImport — conflito e duplicata", () => {
  it("collapses byte-identical duplicates onto one artifact, not one edition each", () => {
    const shared = hash("a");
    const plan = proposeCorpusImport(
      [
        candidate("Livros/copia-1.pdf", { contentHash: shared }),
        candidate("Backup/copia-2.pdf", { contentHash: shared }),
      ],
      [mapping({ contentHash: shared })],
    );

    expect(plan.summary.artifactsConsidered).toBe(1);
    expect(plan.summary.distinctEditions).toBe(1);
    expect(plan.proposals).toHaveLength(1);
  });

  it("creates a review item for conflicting mappings instead of overwriting one", () => {
    const plan = proposeCorpusImport(
      [candidate("Livros/lemegeton.pdf")],
      [mapping(), mapping({ workTitle: "Clavicula Salomonis", editionLabel: "Sloane 3825" })],
    );

    const conflict = plan.reviews.find((item) => item.reason === "CONFLICTING_MAPPING");
    expect(conflict?.detail).toContain("Clavicula Salomonis");
    expect(conflict?.proposedValue).toContain("Ars Goetia");
  });

  it("leaves a conflicted artifact unresolved rather than picking a winner", () => {
    const plan = proposeCorpusImport(
      [candidate("Livros/lemegeton.pdf")],
      [mapping(), mapping({ workTitle: "Clavicula Salomonis", editionLabel: "Sloane 3825" })],
    );

    expect(plan.proposals[0]?.resolved).toBe(false);
    expect(plan.summary.resolved).toBe(0);
    expect(plan.reviews.some((item) => item.reason === "TITLE_FROM_FILENAME")).toBe(true);
  });

  it("reports a mapping that points at bytes the extraction never produced", () => {
    const plan = proposeCorpusImport([], [mapping()]);
    expect(plan.reviews).toEqual([
      expect.objectContaining({ reason: "MAPPING_WITHOUT_ARTIFACT", proposedValue: "Ars Goetia" }),
    ]);
  });
});

describe("proposeCorpusImport — artefato sem texto", () => {
  it("queues an artifact with no extracted text instead of importing an empty edition", () => {
    const plan = proposeCorpusImport([candidate("a.mp3", { hasExtractedText: false })], []);

    expect(plan.proposals).toEqual([]);
    expect(plan.summary.skippedWithoutContent).toBe(1);
    expect(plan.reviews).toEqual([
      expect.objectContaining({ reason: "NO_CITABLE_CONTENT", proposedValue: "a" }),
    ]);
  });

  it("does not let a mapping conjure citable content that does not exist", () => {
    const plan = proposeCorpusImport(
      [candidate("a.mp3", { hasExtractedText: false })],
      [mapping()],
    );
    expect(plan.proposals).toEqual([]);
    expect(plan.summary.resolved).toBe(0);
  });
});

describe("proposeCorpusImport — ordem e contagens", () => {
  it("orders proposals by path so two runs over the same corpus are comparable", () => {
    const plan = proposeCorpusImport(
      [
        candidate("z.pdf", { contentHash: hash("c") }),
        candidate("a.pdf", { contentHash: hash("a") }),
        candidate("m.pdf", { contentHash: hash("b") }),
      ],
      [],
    );
    expect(plan.proposals.map((proposal) => proposal.relativePath)).toEqual([
      "a.pdf",
      "m.pdf",
      "z.pdf",
    ]);
  });

  it("counts exactly the citable positions it proposed", () => {
    const plan = proposeCorpusImport([candidate("a.pdf", { pageCount: 4 })], [mapping()]);
    expect(plan.summary.locators).toBe(4);
  });

  it("queues an artifact that has text but no citable position", () => {
    const plan = proposeCorpusImport([candidate("a.txt", { pageCount: null })], [mapping()]);

    expect(plan.summary.locators).toBe(0);
    expect(plan.reviews).toEqual([
      expect.objectContaining({ reason: "NO_LOCATOR_SCHEME", proposedValue: null }),
    ]);
  });
});
