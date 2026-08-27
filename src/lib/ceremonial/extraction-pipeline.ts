import "server-only";

import {
  DEFAULT_DERIVATIVE_CLASSIFICATION,
  EXTRACTION_ADAPTERS,
  derivativeContentHash,
  normalizeExtractedText,
  selectExtractionAdapter,
  type ExtractionAdapter,
  type ExtractionQuarantineReason,
  type ExtractionRecord,
  type NoAdapterReason,
} from "@/domain/ceremonial/extraction";

import { storeDerivative } from "./derivative-store";
import { resolveAdapterVersion, runExtractionAdapter, runPdfOcr } from "./extraction-adapters";
import {
  confirmSourceUnchanged,
  releaseSource,
  verifyInventoriedSource,
} from "./extraction-source";

import type { InventoryEntry } from "@/domain/ceremonial/inventory";

/**
 * Orchestration: one inventory row in, one explicit record out.
 *
 * The ordering is the safety property. A source is opened only when an adapter exists for
 * it, so the recordings that dominate this archive are never read at all; the integrity
 * check runs before the adapter and again after it; and the derivative is stored only
 * once the source is proven not to have moved underneath the read. Any step that fails
 * ends the row with a reason rather than dropping it.
 */

export type ExtractionToolchain = Readonly<Record<ExtractionAdapter, string>>;

export class MissingAdapterToolsError extends Error {
  constructor(readonly missing: readonly ExtractionAdapter[]) {
    super(`adaptadores indisponíveis: ${missing.join(", ")}`);
    this.name = "MissingAdapterToolsError";
  }
}

/**
 * Resolves every adapter's tool version up front. A missing binary is a configuration
 * failure for the whole run, not a per-file quarantine: quarantining every PDF because
 * poppler was absent would look like a corrupt archive instead of a broken container.
 */
export async function resolveExtractionToolchain(): Promise<ExtractionToolchain> {
  const resolved = await Promise.all(
    EXTRACTION_ADAPTERS.map(
      async (adapter) => [adapter, await resolveAdapterVersion(adapter)] as const,
    ),
  );
  const missing = resolved.filter(([, version]) => version === null).map(([adapter]) => adapter);
  if (missing.length > 0) throw new MissingAdapterToolsError(missing);
  return Object.freeze(
    Object.fromEntries(resolved.map(([adapter, version]) => [adapter, version])),
  ) as ExtractionToolchain;
}

function baseRecord(entry: InventoryEntry) {
  return {
    relativePath: entry.relativePath,
    sourceHash: entry.contentHash,
    sourceMimeType: entry.mimeType,
    adapter: null,
    adapterVersion: null,
    quarantineReason: null,
    noAdapterReason: null,
    derivativeHash: null,
    characterCount: null,
    pageCount: null,
    ...DEFAULT_DERIVATIVE_CLASSIFICATION,
  } as const;
}

function withoutAdapter(entry: InventoryEntry, noAdapterReason: NoAdapterReason): ExtractionRecord {
  return { ...baseRecord(entry), outcome: "NO_ADAPTER", noAdapterReason };
}

function quarantine(
  entry: InventoryEntry,
  quarantineReason: ExtractionQuarantineReason,
  adapter: ExtractionAdapter | null = null,
): ExtractionRecord {
  return { ...baseRecord(entry), outcome: "QUARANTINED", adapter, quarantineReason };
}

export interface ExtractInventoriedArchiveOptions {
  readonly archiveRoot: string;
  readonly derivativeRoot: string;
  readonly entries: readonly InventoryEntry[];
  readonly toolchain: ExtractionToolchain;
  /** Rows already recorded by a previous run, re-emitted unchanged so a run can resume. */
  readonly completed?: ReadonlyMap<string, ExtractionRecord>;
  readonly onRecord?: (record: ExtractionRecord) => Promise<void> | void;
  readonly onProgress?: (progress: { readonly processed: number }) => void;
}

async function extractOne(
  options: ExtractInventoriedArchiveOptions,
  entry: InventoryEntry,
  adapter: ExtractionAdapter,
): Promise<ExtractionRecord> {
  const verification = await verifyInventoriedSource(options.archiveRoot, entry);
  if (!verification.ok) return quarantine(entry, verification.reason, adapter);

  const { source } = verification;
  let effectiveAdapter = adapter;
  let adapterVersion = options.toolchain[adapter];
  try {
    let result = await runExtractionAdapter(adapter, source, adapterVersion);

    // A PDF whose pages are images yields no text layer. Treating that as an empty
    // document would leave this archive's scanned volumes unread, so the pages are
    // rendered and OCR'd instead — recorded under a different adapter, because the text
    // came from a different route and deserves to be judged as OCR.
    if (
      adapter === "pdf-text" &&
      result.ok &&
      normalizeExtractedText(result.text) === "" &&
      (result.pageCount ?? 0) > 0
    ) {
      effectiveAdapter = "pdf-ocr";
      adapterVersion = options.toolchain["pdf-ocr"];
      result = await runPdfOcr(source, result.pageCount ?? 0, adapterVersion);
    }
    // Checked after the adapter ran: a swap during extraction invalidates its output.
    if (!(await confirmSourceUnchanged(source)))
      return quarantine(entry, "SOURCE_MUTATED_DURING_READ", effectiveAdapter);
    if (!result.ok) return quarantine(entry, result.reason, effectiveAdapter);

    const text = normalizeExtractedText(result.text);
    if (text === "")
      return {
        ...baseRecord(entry),
        outcome: "EMPTY_RESULT",
        adapter: effectiveAdapter,
        adapterVersion,
        pageCount: result.pageCount,
      };

    const derivativeHash = derivativeContentHash(text);
    const stored = await storeDerivative(options.derivativeRoot, text, derivativeHash);
    if (!stored.ok) return quarantine(entry, stored.reason, effectiveAdapter);

    return {
      ...baseRecord(entry),
      outcome: "EXTRACTED",
      adapter: effectiveAdapter,
      adapterVersion,
      derivativeHash,
      characterCount: [...text].length,
      pageCount: result.pageCount,
    };
  } finally {
    await releaseSource(source);
  }
}

/**
 * Walks the inventory in a stable order and produces exactly one record per row. Sources
 * are processed sequentially: the adapters are CPU-bound and OCR in particular would
 * otherwise starve the bounded container this runs inside.
 */
export async function extractInventoriedArchive(
  options: ExtractInventoriedArchiveOptions,
): Promise<ExtractionRecord[]> {
  const completed = options.completed ?? new Map<string, ExtractionRecord>();
  const ordered = [...options.entries].sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath, "en"),
  );

  const records: ExtractionRecord[] = [];
  for (const entry of ordered) {
    const previous = completed.get(entry.relativePath);
    if (previous !== undefined) {
      records.push(previous);
      continue;
    }

    let record: ExtractionRecord;
    if (entry.contentHash === null) {
      // The census could not read these bytes, so there is nothing to extract — recorded
      // rather than skipped, so both manifests reconcile row for row.
      record = withoutAdapter(entry, "NOT_INDEXED");
    } else {
      const selection = selectExtractionAdapter(entry.mimeType);
      record =
        "adapter" in selection
          ? await extractOne(options, entry, selection.adapter)
          : withoutAdapter(entry, selection.noAdapterReason);
    }

    records.push(record);
    await options.onRecord?.(record);
    options.onProgress?.({ processed: records.length });
  }

  return records;
}
