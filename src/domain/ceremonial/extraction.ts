import { createHash } from "node:crypto";

import { z } from "zod";

import {
  DEFAULT_CEREMONIAL_ACCESS,
  DEFAULT_CEREMONIAL_RIGHTS,
  DEFAULT_CEREMONIAL_SENSITIVITY,
  ceremonialAccessSchema,
  ceremonialRightsSchema,
  ceremonialSensitivitySchema,
} from "./contracts";
import { inventoryRelativePathSchema } from "./inventory";

/**
 * Pure model for turning inventoried source bytes into text derivatives.
 *
 * Three rules shape everything here:
 *
 * 1. The manifest is metadata, never content. It carries hashes, counts and reasons, so it
 *    can be reviewed or kept as evidence while the extracted text stays in the private
 *    derivative volume.
 * 2. Every source reaches exactly one explicit outcome. "We had no adapter" is a recorded
 *    state with a reason, not an absence — silence would misreport coverage.
 * 3. A derivative inherits the fail-closed defaults of an import: unknown rights,
 *    local-only, culturally sensitive. Extraction never grants a publication right.
 */

export const EXTRACTION_PIPELINE_VERSION = "ceremonial-extraction-1.0.0";

/**
 * Adapters are identified together with the exact tool version that produced the text,
 * because the same bytes through a different `pdftotext` or `tesseract` are a different
 * derivative. Recording the version makes a toolchain upgrade invalidate derivatives
 * instead of silently changing them.
 */
export const EXTRACTION_ADAPTERS = [
  "pdf-text",
  /**
   * Scanned books: a PDF whose pages are images carries no text layer, so `pdf-text`
   * returns nothing for it. Reporting that as an empty document would leave the material
   * this archive most needs read — its scanned volumes — silently unextracted, so those
   * pages are rendered and OCR'd instead. A distinct identity, because the text came from
   * a different route and should be judged as OCR, not as an extracted text layer.
   */
  "pdf-ocr",
  "ocr-image",
  "plain-text",
  "opendocument",
  "ooxml",
  "rtf",
] as const;
export const extractionAdapterSchema = z.enum(EXTRACTION_ADAPTERS);
export type ExtractionAdapter = z.infer<typeof extractionAdapterSchema>;

/** The terminal state of one source artifact. Never absent. */
export const EXTRACTION_OUTCOMES = [
  "EXTRACTED",
  "EMPTY_RESULT",
  "NO_ADAPTER",
  "QUARANTINED",
] as const;
export const extractionOutcomeSchema = z.enum(EXTRACTION_OUTCOMES);
export type ExtractionOutcome = z.infer<typeof extractionOutcomeSchema>;

/**
 * Why a source or its derivative was refused. The `SOURCE_*` values are the integrity
 * gate: they mean the bytes on disk no longer match what task 12 inventoried, so the
 * artifact is not the one that was censused and must not be ingested.
 */
export const EXTRACTION_QUARANTINE_REASONS = [
  "SOURCE_MISSING",
  "SOURCE_NOT_REGULAR_FILE",
  "SOURCE_SIZE_MISMATCH",
  "SOURCE_HASH_MISMATCH",
  "SOURCE_MUTATED_DURING_READ",
  "SOURCE_UNREADABLE",
  "ADAPTER_FAILED",
  "ADAPTER_TIMEOUT",
  "OUTPUT_TOO_LARGE",
  "OUTPUT_INVALID",
  "OCR_BUDGET_EXCEEDED",
] as const;
export const extractionQuarantineReasonSchema = z.enum(EXTRACTION_QUARANTINE_REASONS);
export type ExtractionQuarantineReason = z.infer<typeof extractionQuarantineReasonSchema>;

/**
 * Why no adapter ran. Audio dominates this archive (recorded chant), and transcribing it
 * would require a speech model: non-deterministic, unreviewed, and a cultural decision
 * about sacred song that no one has taken. It is declared, not attempted.
 */
export const NO_ADAPTER_REASONS = [
  "AUDIO_NOT_TRANSCRIBED",
  "VIDEO_NOT_TRANSCRIBED",
  "UNSUPPORTED_FORMAT",
  "NOT_INDEXED",
] as const;
export const noAdapterReasonSchema = z.enum(NO_ADAPTER_REASONS);
export type NoAdapterReason = z.infer<typeof noAdapterReasonSchema>;

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

/**
 * Bounds every adapter runs under. They are limits, not tuning: an adapter that needs more
 * than this is refused, so a decompression bomb or a pathological page cannot spend the
 * host's memory or wall clock.
 */
export const EXTRACTION_LIMITS = Object.freeze({
  /** Sources larger than this are not handed to an adapter at all. */
  maxSourceBytes: 512 * 1024 * 1024,
  /** Ceiling on adapter stdout. Reaching it is OUTPUT_TOO_LARGE, never a silent truncation. */
  maxOutputBytes: 32 * 1024 * 1024,
  /** Wall clock per source. Exceeding it is ADAPTER_TIMEOUT, never a partial result. */
  timeoutMs: 180_000,
  /**
   * Pages one scanned PDF may be OCR'd for. Past this the source is refused whole rather
   * than half-read: a partial transcription of a book would look like a complete one.
   */
  maxOcrPages: 400,
  /**
   * Wall clock for one whole scanned document. `timeoutMs` bounds a single adapter run,
   * and OCR runs one per page — without this ceiling a 400-page book could legitimately
   * occupy the container for a day while never tripping the per-run timeout.
   */
  ocrDocumentTimeoutMs: 3_600_000,
});

export const extractionRecordSchema = z
  .object({
    relativePath: inventoryRelativePathSchema,
    /**
     * The inventoried hash, re-verified against the bytes actually read. Null only for a
     * census row the inventory could not read at all, which still gets a record here so
     * the two manifests reconcile row for row.
     */
    sourceHash: sha256Schema.nullable(),
    sourceMimeType: z.string().min(1).max(160).nullable(),
    outcome: extractionOutcomeSchema,
    adapter: extractionAdapterSchema.nullable(),
    /** Exact tool version string, e.g. "pdftotext 22.12.0". Part of derivative identity. */
    adapterVersion: z.string().min(1).max(200).nullable(),
    quarantineReason: extractionQuarantineReasonSchema.nullable(),
    noAdapterReason: noAdapterReasonSchema.nullable(),
    /** SHA-256 of the normalized text. The text itself never enters the manifest. */
    derivativeHash: sha256Schema.nullable(),
    characterCount: z.number().int().nonnegative().nullable(),
    pageCount: z.number().int().nonnegative().nullable(),
    rights: ceremonialRightsSchema,
    access: ceremonialAccessSchema,
    sensitivity: ceremonialSensitivitySchema,
  })
  .strict()
  .superRefine((record, context) => {
    const demand = (condition: boolean, path: string, message: string) => {
      if (!condition) context.addIssue({ code: "custom", path: [path], message });
    };

    if (record.outcome === "EXTRACTED") {
      demand(record.derivativeHash !== null, "derivativeHash", "uma extração precisa de hash");
      demand(
        record.sourceHash !== null,
        "sourceHash",
        "uma extração precisa da identidade verificada da fonte",
      );
      demand(record.adapter !== null, "adapter", "uma extração precisa declarar o adaptador");
      demand(
        record.adapterVersion !== null,
        "adapterVersion",
        "uma extração precisa declarar a versão da ferramenta",
      );
      demand(
        record.characterCount !== null && record.characterCount > 0,
        "characterCount",
        "uma extração precisa de texto",
      );
    }

    if (record.outcome === "NO_ADAPTER")
      demand(
        record.noAdapterReason !== null,
        "noAdapterReason",
        "declare por que não houve adaptador",
      );
    else demand(record.noAdapterReason === null, "noAdapterReason", "motivo só cabe em NO_ADAPTER");

    if (record.outcome === "QUARANTINED")
      demand(
        record.quarantineReason !== null,
        "quarantineReason",
        "declare o motivo da quarentena",
      );
    else
      demand(record.quarantineReason === null, "quarantineReason", "motivo só cabe em quarentena");

    if (record.outcome !== "EXTRACTED")
      demand(
        record.derivativeHash === null,
        "derivativeHash",
        "só uma extração bem-sucedida produz derivado",
      );

    // The whole point of the fail-closed default: extraction is not a publication right.
    demand(record.access === "LOCAL_ONLY", "access", "derivado nasce local-only");
    demand(record.rights === "UNKNOWN", "rights", "derivado nasce com direitos desconhecidos");
  });

export type ExtractionRecord = z.infer<typeof extractionRecordSchema>;

/** The fail-closed classification every newly extracted derivative starts from. */
export const DEFAULT_DERIVATIVE_CLASSIFICATION = Object.freeze({
  rights: DEFAULT_CEREMONIAL_RIGHTS,
  access: DEFAULT_CEREMONIAL_ACCESS,
  sensitivity: DEFAULT_CEREMONIAL_SENSITIVITY,
});

export interface ExtractionCoverage {
  readonly eligibleSources: number;
  readonly extracted: number;
  readonly emptyResult: number;
  readonly noAdapter: number;
  readonly quarantined: number;
  /** Extracted over total, four decimal places. Reported, never rounded up to "done". */
  readonly extractedRatio: number;
  readonly charactersExtracted: number;
  readonly byAdapter: Readonly<Record<string, number>>;
  readonly byQuarantineReason: Readonly<Record<string, number>>;
  readonly byNoAdapterReason: Readonly<Record<string, number>>;
}

export interface ExtractionManifest {
  readonly pipelineVersion: string;
  readonly generatedAt: string;
  /**
   * The tool versions the run was configured with — recorded even when every row
   * quarantined, because "which poppler produced nothing" is exactly what a failed run
   * needs to say. Deriving this from the records instead would lose it precisely when it
   * matters most.
   */
  readonly toolchain: Readonly<Record<string, string>>;
  readonly coverage: ExtractionCoverage;
  readonly records: readonly ExtractionRecord[];
}

/**
 * Chooses the adapter for a mime type. Audio and video resolve to an explicit refusal
 * rather than to null, so a caller cannot accidentally read "not attempted" as
 * "nothing there".
 */
export function selectExtractionAdapter(
  mimeType: string | null,
): { adapter: ExtractionAdapter } | { noAdapterReason: NoAdapterReason } {
  if (mimeType === null) return { noAdapterReason: "UNSUPPORTED_FORMAT" };
  switch (mimeType) {
    case "application/pdf":
      return { adapter: "pdf-text" };
    case "image/jpeg":
    case "image/png":
    case "image/gif":
    case "image/webp":
      return { adapter: "ocr-image" };
    case "text/plain":
      return { adapter: "plain-text" };
    case "application/rtf":
      return { adapter: "rtf" };
    // A ZIP container here is an OpenDocument or OOXML document; the adapter reads the
    // document part by name and fails closed when the expected part is absent.
    case "application/zip":
      return { adapter: "ooxml" };
    case "application/vnd.oasis.opendocument.text":
      return { adapter: "opendocument" };
    case "audio/mpeg":
    case "audio/wav":
    case "application/vnd.ms-asf":
      return { noAdapterReason: "AUDIO_NOT_TRANSCRIBED" };
    case "video/mp4":
      return { noAdapterReason: "VIDEO_NOT_TRANSCRIBED" };
    default:
      return { noAdapterReason: "UNSUPPORTED_FORMAT" };
  }
}

// C0 controls except tab and newline, DEL, the zero-width family and the BOM.
const NON_TEXT_CONTROL_CHARACTERS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\uFEFF]/g;

/**
 * Deterministic text normalization. Two runs of the same adapter over the same bytes must
 * produce byte-identical output, otherwise the derivative hash is worthless as an
 * integrity check. Unicode form, line endings, trailing space and control characters are
 * fixed here rather than left to whichever tool produced the text.
 */
export function normalizeExtractedText(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(NON_TEXT_CONTROL_CHARACTERS, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Counts pages from the form feeds poppler emits between them. Normalization strips the
 * feeds afterwards, so this has to run on the raw adapter output — a trailing feed closes
 * the last page rather than opening an empty one.
 */
export function countPagesFromFormFeeds(rawText: string): number | null {
  if (rawText === "") return null;
  const pages = rawText.split("\f");
  return pages.at(-1) === "" ? pages.length - 1 : pages.length;
}

export function derivativeContentHash(normalizedText: string): string {
  return createHash("sha256").update(normalizedText, "utf8").digest("hex");
}

function tally(values: readonly (string | null)[]): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    if (value === null) continue;
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return Object.freeze(
    Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b, "en"))),
  );
}

export function summarizeExtraction(records: readonly ExtractionRecord[]): ExtractionCoverage {
  const countOf = (outcome: ExtractionOutcome) =>
    records.filter((record) => record.outcome === outcome).length;
  const extracted = countOf("EXTRACTED");
  return {
    eligibleSources: records.length,
    extracted,
    emptyResult: countOf("EMPTY_RESULT"),
    noAdapter: countOf("NO_ADAPTER"),
    quarantined: countOf("QUARANTINED"),
    extractedRatio: records.length === 0 ? 0 : Number((extracted / records.length).toFixed(4)),
    charactersExtracted: records.reduce((total, record) => total + (record.characterCount ?? 0), 0),
    byAdapter: tally(records.map((record) => record.adapter)),
    byQuarantineReason: tally(records.map((record) => record.quarantineReason)),
    byNoAdapterReason: tally(records.map((record) => record.noAdapterReason)),
  };
}

/**
 * Builds the manifest, re-validating every record. A pipeline bug that produced a
 * quarantine without a reason, a derivative marked public, or an "extraction" with no
 * text fails the build here instead of being written out as evidence.
 */
export function buildExtractionManifest(
  records: readonly ExtractionRecord[],
  generatedAt: Date,
  toolchain: Readonly<Record<string, string>> = {},
): ExtractionManifest {
  const validated = records
    .map((record) => extractionRecordSchema.parse(record))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath, "en"));
  return {
    pipelineVersion: EXTRACTION_PIPELINE_VERSION,
    generatedAt: generatedAt.toISOString(),
    toolchain: Object.freeze(
      Object.fromEntries(Object.entries(toolchain).sort(([a], [b]) => a.localeCompare(b, "en"))),
    ),
    coverage: summarizeExtraction(validated),
    records: validated,
  };
}

export interface SanitizedExtractionManifest {
  readonly pipelineVersion: string;
  readonly contentFingerprint: string;
  readonly coverage: ExtractionCoverage;
  /** The configured toolchain, so the evidence names what produced the text — or failed to. */
  readonly adapterVersions: Readonly<Record<string, string>>;
  readonly pagesExtracted: number;
}

/**
 * The shareable view of a run.
 *
 * The full manifest lists a relative path per row, and in this archive a path is the
 * title of a book someone owns — reviewable locally, but not something to commit as
 * evidence. This keeps the counts, the fingerprint and the toolchain, and drops every
 * path and hash, so a reviewer can check coverage without reading the shelf.
 */
export function sanitizeExtractionManifest(
  manifest: ExtractionManifest,
): SanitizedExtractionManifest {
  return {
    pipelineVersion: manifest.pipelineVersion,
    contentFingerprint: extractionContentFingerprint(manifest),
    coverage: manifest.coverage,
    adapterVersions: manifest.toolchain,
    pagesExtracted: manifest.records.reduce((total, record) => total + (record.pageCount ?? 0), 0),
  };
}

/** Fingerprint of the manifest content, excluding generatedAt, so reruns are comparable. */
export function extractionContentFingerprint(manifest: ExtractionManifest): string {
  return createHash("sha256")
    .update(
      JSON.stringify({ pipelineVersion: manifest.pipelineVersion, records: manifest.records }),
      "utf8",
    )
    .digest("hex");
}
