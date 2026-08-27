import { z } from "zod";

import {
  DEFAULT_CEREMONIAL_ACCESS,
  DEFAULT_CEREMONIAL_RIGHTS,
  DEFAULT_CEREMONIAL_SENSITIVITY,
} from "./contracts";
import { inventoryRelativePathSchema } from "./inventory";

/**
 * Turning extracted files into a citable lineage: work → edition → artifact → locator.
 *
 * One rule shapes everything: **a filename is a hint, never an identity.** The archive is
 * a personal shelf, and its filenames are abbreviations, scan-shop defaults and
 * transliterations — "lemegeton.pdf" does not establish which Lemegeton, which manuscript
 * family, which translation, or whether the volume is a compilation containing it. So a
 * path may propose, and only an operator mapping may decide. Anything proposed from a path
 * alone lands in a review queue and stays unusable until a person resolves it.
 *
 * The consequence is deliberate: on first import essentially the whole archive is
 * unresolved. That is the honest state of a corpus nobody has catalogued yet, not a
 * failure of the importer.
 */

export const IMPORT_PIPELINE_VERSION = "ceremonial-import-1.0.0";

/** Why a proposed record cannot be trusted yet. Each becomes one queue item. */
export const IMPORT_REVIEW_REASONS = [
  /** Title came from the filename alone. */
  "TITLE_FROM_FILENAME",
  /** No author established at all; a filename rarely carries one reliably. */
  "AUTHOR_UNKNOWN",
  /** Which printing, manuscript family, translation or compilation is unestablished. */
  "EDITION_UNESTABLISHED",
  /** Language guessed from the path rather than verified against the document. */
  "LANGUAGE_UNVERIFIED",
  /** Two mappings claim the same artifact with different identities. */
  "CONFLICTING_MAPPING",
  /** A mapping points at a content hash the extraction never produced. */
  "MAPPING_WITHOUT_ARTIFACT",
  /** The artifact has no extracted text, so no locator can cite anything in it. */
  "NO_CITABLE_CONTENT",
  /**
   * There is text, but nothing to cite a position by. "Somewhere in this file" is not a
   * locator, and task 8 froze the vocabulary of positions that are.
   */
  "NO_LOCATOR_SCHEME",
] as const;
export const importReviewReasonSchema = z.enum(IMPORT_REVIEW_REASONS);
export type ImportReviewReason = z.infer<typeof importReviewReasonSchema>;

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const slugSchema = z
  .string()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "use um slug em kebab-case");

/**
 * An operator's decision about one artifact's identity. This is the only thing that can
 * make an artifact claimable: it records a judgement a person made with the volume in
 * hand, which is exactly what a filename cannot supply.
 */
export const importMappingSchema = z
  .object({
    contentHash: sha256Schema,
    sourceSystemSlug: slugSchema,
    workTitle: z.string().min(2).max(300),
    /** Null is a positive statement: the operator looked, and the work is anonymous. */
    authorLabel: z.string().min(2).max(200).nullable(),
    /**
     * The witness, not the work: "Mathers 1904 translation", "Sloane 3825", "compilação
     * Weiser 1995". A compilation and its source text are different editions on purpose.
     */
    editionLabel: z.string().min(2).max(200),
    /** Language tag as written by the operator; not validated against a registry. */
    language: z.string().min(2).max(35),
    publishedYear: z.number().int().min(-4000).max(2100).nullable(),
    /** How the operator established this. Free text, and never a substitute for review. */
    evidenceNote: z.string().min(10).max(1000),
  })
  .strict();

export type ImportMapping = z.infer<typeof importMappingSchema>;

export const importMappingFileSchema = z
  .object({
    pipelineVersion: z.literal(IMPORT_PIPELINE_VERSION),
    mappings: z.array(importMappingSchema),
  })
  .strict();

export interface ImportReviewItem {
  readonly contentHash: string | null;
  readonly reason: ImportReviewReason;
  /** What the importer would have used, so a reviewer can accept or correct it. */
  readonly proposedValue: string | null;
  readonly detail: string;
}

/**
 * Position kinds are task 8's frozen vocabulary, not this stage's invention. Only `PAGE`
 * can be derived from an extraction; every other kind — folio, section, chapter, aphorism,
 * plate, entry — requires someone to read the edition and say where its divisions are.
 */
export interface ImportLocatorProposal {
  readonly kind: "PAGE";
  readonly reference: string;
}

/** The lineage proposed for one artifact. Nothing here is publishable until resolved. */
export interface ImportProposal {
  readonly contentHash: string;
  readonly relativePath: string;
  readonly sourceSystemSlug: string;
  readonly workTitle: string;
  readonly authorLabel: string | null;
  readonly editionLabel: string;
  readonly language: string;
  readonly publishedYear: number | null;
  readonly byteSize: number;
  readonly mimeType: string;
  readonly pageCount: number | null;
  /** Citable positions derived from what was actually extracted, never invented. */
  readonly locators: readonly ImportLocatorProposal[];
  /** True only when an operator mapping decided the identity. */
  readonly resolved: boolean;
  readonly rights: string;
  readonly access: string;
  readonly sensitivity: string;
}

export interface CorpusImportSummary {
  readonly artifactsConsidered: number;
  readonly resolved: number;
  readonly unresolved: number;
  readonly skippedWithoutContent: number;
  readonly distinctWorks: number;
  readonly distinctEditions: number;
  readonly locators: number;
  readonly reviewsByReason: Readonly<Record<string, number>>;
}

export interface CorpusImportPlan {
  readonly pipelineVersion: string;
  readonly proposals: readonly ImportProposal[];
  readonly reviews: readonly ImportReviewItem[];
  readonly summary: CorpusImportSummary;
}

/** The minimum an extraction row must carry for this stage to consider it at all. */
export const importCandidateSchema = z
  .object({
    relativePath: inventoryRelativePathSchema,
    contentHash: sha256Schema,
    mimeType: z.string().min(1).max(160),
    byteSize: z.number().int().nonnegative(),
    pageCount: z.number().int().nonnegative().nullable(),
    /** Whether task 13 actually produced text for this artifact. */
    hasExtractedText: z.boolean(),
  })
  .strict();

export type ImportCandidate = z.infer<typeof importCandidateSchema>;

/**
 * The last path segment without its extension. Deliberately not "the title" — it is a
 * suggestion offered to a reviewer, and every caller must treat it as one.
 */
export function filenameHint(relativePath: string): string {
  const base = relativePath.split("/").at(-1) ?? relativePath;
  return base
    .replace(/\.[A-Za-z0-9]{1,8}$/, "")
    .replace(/_+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Locators for what the extraction actually established. Pages are the only positions a
 * pipeline can know; an artifact without them gets none, and the gap is queued rather than
 * papered over with a fake whole-document anchor that no claim could honestly cite.
 */
export function proposeLocators(candidate: ImportCandidate): ImportLocatorProposal[] {
  if (candidate.pageCount === null || candidate.pageCount <= 0) return [];
  const locators: ImportLocatorProposal[] = [];
  for (let page = 1; page <= candidate.pageCount; page += 1)
    locators.push({ kind: "PAGE", reference: `p. ${page}` });
  return locators;
}

function tally(values: readonly string[]): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return Object.freeze(
    Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b, "en"))),
  );
}

/** Editions are keyed by work + label + language, matching the database constraint. */
function editionKey(proposal: ImportProposal): string {
  return [
    proposal.sourceSystemSlug,
    proposal.workTitle,
    proposal.editionLabel,
    proposal.language,
  ].join(" ");
}

function workKey(proposal: ImportProposal): string {
  return `${proposal.sourceSystemSlug} ${proposal.workTitle}`;
}

function unresolvedReviews(contentHash: string, hint: string): ImportReviewItem[] {
  // One item per unverified field, so a reviewer sees exactly what is missing instead of
  // a single opaque "unknown".
  return [
    {
      contentHash,
      reason: "TITLE_FROM_FILENAME",
      proposedValue: hint,
      detail: "título derivado apenas do nome do arquivo; confirme com o exemplar",
    },
    {
      contentHash,
      reason: "AUTHOR_UNKNOWN",
      proposedValue: null,
      detail: "nenhuma autoria estabelecida; um nome de arquivo não a estabelece",
    },
    {
      contentHash,
      reason: "EDITION_UNESTABLISHED",
      proposedValue: null,
      detail:
        "impressão, família de manuscrito, tradução ou compilação indefinida; " +
        "compilações e traduções são edições distintas",
    },
    {
      contentHash,
      reason: "LANGUAGE_UNVERIFIED",
      proposedValue: null,
      detail: "idioma não verificado contra o documento",
    },
  ];
}

/**
 * Builds the import plan.
 *
 * Duplicate binaries converge: the archive holds byte-identical files under different
 * names, and they share one content hash, so they produce one artifact and one edition
 * rather than several. That is why identity is keyed on the hash and never on the path.
 */
export function proposeCorpusImport(
  candidates: readonly ImportCandidate[],
  mappings: readonly ImportMapping[],
): CorpusImportPlan {
  const reviews: ImportReviewItem[] = [];
  const byHash = new Map<string, ImportMapping>();
  const conflicted = new Set<string>();

  for (const mapping of mappings) {
    const existing = byHash.get(mapping.contentHash);
    if (existing === undefined) {
      byHash.set(mapping.contentHash, mapping);
      continue;
    }
    // Two operators disagreeing is a decision to make, not a last-write-wins overwrite.
    conflicted.add(mapping.contentHash);
    reviews.push({
      contentHash: mapping.contentHash,
      reason: "CONFLICTING_MAPPING",
      proposedValue: `${existing.workTitle} / ${existing.editionLabel}`,
      detail:
        "outro mapeamento reivindica o mesmo artefato como " +
        `"${mapping.workTitle} / ${mapping.editionLabel}"; nenhum foi aplicado`,
    });
  }

  // One artifact per content hash, so byte-identical duplicates never fork the lineage.
  const uniqueCandidates = new Map<string, ImportCandidate>();
  for (const candidate of candidates)
    if (!uniqueCandidates.has(candidate.contentHash))
      uniqueCandidates.set(candidate.contentHash, candidate);

  for (const mapping of byHash.values())
    if (!uniqueCandidates.has(mapping.contentHash))
      reviews.push({
        contentHash: mapping.contentHash,
        reason: "MAPPING_WITHOUT_ARTIFACT",
        proposedValue: mapping.workTitle,
        detail: "o mapeamento aponta para um hash que a extração não produziu",
      });

  const proposals: ImportProposal[] = [];
  let skippedWithoutContent = 0;

  for (const candidate of [...uniqueCandidates.values()].sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath, "en"),
  )) {
    if (!candidate.hasExtractedText) {
      // Nothing to cite: an artifact with no text cannot back a claim, so it is queued for
      // attention rather than imported as an empty edition.
      skippedWithoutContent += 1;
      reviews.push({
        contentHash: candidate.contentHash,
        reason: "NO_CITABLE_CONTENT",
        proposedValue: filenameHint(candidate.relativePath),
        detail: "a extração não produziu texto; nenhum locator pode citar este artefato",
      });
      continue;
    }

    const mapping = conflicted.has(candidate.contentHash)
      ? undefined
      : byHash.get(candidate.contentHash);
    const hint = filenameHint(candidate.relativePath);
    if (mapping === undefined) reviews.push(...unresolvedReviews(candidate.contentHash, hint));

    const locators = proposeLocators(candidate);
    if (locators.length === 0)
      reviews.push({
        contentHash: candidate.contentHash,
        reason: "NO_LOCATOR_SCHEME",
        proposedValue: null,
        detail:
          "há texto, mas nenhuma posição citável foi estabelecida; " +
          "defina o esquema de locators lendo a edição",
      });

    proposals.push({
      contentHash: candidate.contentHash,
      relativePath: candidate.relativePath,
      sourceSystemSlug: mapping?.sourceSystemSlug ?? "unassigned",
      workTitle: mapping?.workTitle ?? hint,
      authorLabel: mapping?.authorLabel ?? null,
      editionLabel: mapping?.editionLabel ?? "unestablished",
      language: mapping?.language ?? "und",
      publishedYear: mapping?.publishedYear ?? null,
      byteSize: candidate.byteSize,
      mimeType: candidate.mimeType,
      pageCount: candidate.pageCount,
      locators,
      resolved: mapping !== undefined,
      rights: DEFAULT_CEREMONIAL_RIGHTS,
      access: DEFAULT_CEREMONIAL_ACCESS,
      sensitivity: DEFAULT_CEREMONIAL_SENSITIVITY,
    });
  }

  return {
    pipelineVersion: IMPORT_PIPELINE_VERSION,
    proposals,
    reviews,
    summary: {
      artifactsConsidered: uniqueCandidates.size,
      resolved: proposals.filter((proposal) => proposal.resolved).length,
      unresolved: proposals.filter((proposal) => !proposal.resolved).length,
      skippedWithoutContent,
      distinctWorks: new Set(proposals.map(workKey)).size,
      distinctEditions: new Set(proposals.map(editionKey)).size,
      locators: proposals.reduce((total, proposal) => total + proposal.locators.length, 0),
      reviewsByReason: tally(reviews.map((item) => item.reason)),
    },
  };
}
