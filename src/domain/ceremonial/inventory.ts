import { createHash } from "node:crypto";

import { z } from "zod";

/**
 * Pure inventory model for the private archive.
 *
 * The manifest is a census, not a delivery decision: it records what exists, what could
 * not be read and why, and which files are byte-identical. It never carries an absolute
 * host path, so a manifest can be reviewed or diffed without disclosing where the archive
 * lives — and it never carries file contents.
 */

export const INVENTORY_MANIFEST_VERSION = "ceremonial-inventory-1.0.0";

/** Why a file is recorded but not usable as a source artifact. Never silently dropped. */
export const INVENTORY_QUARANTINE_REASONS = [
  "UNREADABLE",
  "NOT_REGULAR_FILE",
  "SYMLINK",
  "EMPTY",
  "TOO_LARGE",
  "UNSUPPORTED_TYPE",
] as const;
export const inventoryQuarantineReasonSchema = z.enum(INVENTORY_QUARANTINE_REASONS);
export type InventoryQuarantineReason = z.infer<typeof inventoryQuarantineReasonSchema>;

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

/**
 * A path relative to the archive root, using forward slashes. Absolute paths, traversal
 * segments, backslashes and NUL bytes are all rejected so the host layout cannot leak
 * into the manifest.
 */
export const inventoryRelativePathSchema = z
  .string()
  .min(1)
  .max(1024)
  .refine((value) => !value.startsWith("/"), { message: "caminho deve ser relativo" })
  .refine((value) => !/^[a-zA-Z]:/.test(value), { message: "caminho deve ser relativo" })
  .refine((value) => !value.includes("\\"), { message: "use apenas barras normais" })
  .refine((value) => !value.includes("\0"), { message: "caminho inválido" })
  .refine((value) => !value.split("/").includes(".."), {
    message: "caminho não pode conter segmentos '..'",
  });

export const inventoryEntrySchema = z
  .object({
    relativePath: inventoryRelativePathSchema,
    byteSize: z.number().int().nonnegative(),
    /** ISO 8601 in UTC. */
    modifiedAt: z.iso.datetime(),
    contentHash: sha256Schema.nullable(),
    mimeType: z.string().min(1).max(160).nullable(),
    state: z.enum(["INDEXED", "QUARANTINED"]),
    quarantineReason: inventoryQuarantineReasonSchema.nullable(),
  })
  .strict()
  .superRefine((entry, context) => {
    if (entry.state === "QUARANTINED" && entry.quarantineReason === null)
      context.addIssue({
        code: "custom",
        path: ["quarantineReason"],
        message: "um item em quarentena precisa declarar o motivo",
      });
    if (entry.state === "INDEXED" && entry.quarantineReason !== null)
      context.addIssue({
        code: "custom",
        path: ["quarantineReason"],
        message: "um item indexado não pode ter motivo de quarentena",
      });
    if (entry.state === "INDEXED" && entry.contentHash === null)
      context.addIssue({
        code: "custom",
        path: ["contentHash"],
        message: "um item indexado precisa de hash de conteúdo",
      });
  });

export type InventoryEntry = z.infer<typeof inventoryEntrySchema>;

export interface InventoryDuplicateGroup {
  readonly contentHash: string;
  /** Every path holding these exact bytes, sorted. */
  readonly relativePaths: readonly string[];
}

export interface InventorySummary {
  readonly totalFiles: number;
  readonly indexedFiles: number;
  readonly quarantinedFiles: number;
  /**
   * Distinct content hashes across every file that could be read — the real artifact
   * count. Deliberately independent of whether the format could be named: identity is a
   * property of the bytes, so an unidentified file still participates in deduplication.
   */
  readonly uniqueContentHashes: number;
  /** Readable files whose bytes also appear under another path. */
  readonly duplicateFiles: number;
  readonly quarantineByReason: Readonly<Record<string, number>>;
  readonly bytesIndexed: number;
}

export interface InventoryManifest {
  readonly manifestVersion: string;
  readonly generatedAt: string;
  readonly summary: InventorySummary;
  readonly entries: readonly InventoryEntry[];
  readonly duplicateGroups: readonly InventoryDuplicateGroup[];
}

/**
 * Classification only — deliberately separate from the narrow delivery-gate detector in
 * `artifact-storage.ts`. Recognising a type here never authorizes serving it.
 */
export function detectArchiveMediaType(bytes: Buffer): string | null {
  const ascii = (start: number, end: number): string =>
    bytes.subarray(start, end).toString("ascii");

  if (ascii(0, 5) === "%PDF-") return "application/pdf";
  if (ascii(0, 5) === "{\\rtf") return "application/rtf";
  if (bytes.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])))
    // Legacy OLE2 compound file: .doc, .xls, .ppt.
    return "application/x-ole-storage";
  if (bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])))
    // ZIP container: .docx, .odt, .epub and plain archives are disambiguated on import.
    return "application/zip";
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") return "image/gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE") return "audio/wav";
  // The archive is mostly recorded chant, so audio is first-class here, not an oddity.
  if (ascii(0, 3) === "ID3") return "audio/mpeg";
  // Bare MPEG audio frame sync (no ID3 tag): 11 set bits, then a valid layer/version.
  if (bytes.length > 1 && bytes[0] === 0xff && ((bytes[1] ?? 0) & 0xe0) === 0xe0)
    return "audio/mpeg";
  if (ascii(4, 8) === "ftyp") return "video/mp4";
  if (
    bytes
      .subarray(0, 16)
      .equals(
        Buffer.from([
          0x30, 0x26, 0xb2, 0x75, 0x8e, 0x66, 0xcf, 0x11, 0xa6, 0xd9, 0x00, 0xaa, 0x00, 0x62, 0xce,
          0x6c,
        ]),
      )
  )
    // ASF container header GUID: .wma and .wmv.
    return "application/vnd.ms-asf";
  if (bytes.length > 0 && !bytes.includes(0)) {
    const text = bytes.toString("utf8");
    if (!text.includes("�")) return "text/plain";
  }
  return null;
}

/** Sorted by path so two runs over the same tree produce the same order. */
function sortEntries(entries: readonly InventoryEntry[]): InventoryEntry[] {
  return [...entries].sort((a, b) => a.relativePath.localeCompare(b.relativePath, "en"));
}

export function groupInventoryDuplicates(
  entries: readonly InventoryEntry[],
): InventoryDuplicateGroup[] {
  const byHash = new Map<string, string[]>();
  for (const entry of entries) {
    // Grouped by bytes, not by state: an unidentified file is still the same content.
    if (entry.contentHash === null) continue;
    const paths = byHash.get(entry.contentHash);
    if (paths === undefined) byHash.set(entry.contentHash, [entry.relativePath]);
    else paths.push(entry.relativePath);
  }
  return [...byHash.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([contentHash, paths]) => ({
      contentHash,
      relativePaths: [...paths].sort((a, b) => a.localeCompare(b, "en")),
    }))
    .sort((a, b) => a.contentHash.localeCompare(b.contentHash, "en"));
}

export function summarizeInventory(entries: readonly InventoryEntry[]): InventorySummary {
  const indexed = entries.filter((entry) => entry.state === "INDEXED");
  const hashed = entries
    .map((entry) => entry.contentHash)
    .filter((hash): hash is string => hash !== null);
  const hashes = new Set(hashed);
  const quarantineByReason: Record<string, number> = {};
  for (const entry of entries) {
    if (entry.quarantineReason === null) continue;
    quarantineByReason[entry.quarantineReason] =
      (quarantineByReason[entry.quarantineReason] ?? 0) + 1;
  }
  return {
    totalFiles: entries.length,
    indexedFiles: indexed.length,
    quarantinedFiles: entries.length - indexed.length,
    uniqueContentHashes: hashes.size,
    duplicateFiles: hashed.length - hashes.size,
    quarantineByReason: Object.freeze(
      Object.fromEntries(Object.entries(quarantineByReason).sort(([a], [b]) => a.localeCompare(b))),
    ),
    bytesIndexed: indexed.reduce((total, entry) => total + entry.byteSize, 0),
  };
}

/**
 * Builds the manifest. Entries are re-validated here, so a scanner bug that produced an
 * absolute path or a reasonless quarantine fails the build instead of being published.
 */
export function buildInventoryManifest(
  entries: readonly InventoryEntry[],
  generatedAt: Date,
): InventoryManifest {
  const validated = sortEntries(entries.map((entry) => inventoryEntrySchema.parse(entry)));
  return {
    manifestVersion: INVENTORY_MANIFEST_VERSION,
    generatedAt: generatedAt.toISOString(),
    summary: summarizeInventory(validated),
    entries: validated,
    duplicateGroups: groupInventoryDuplicates(validated),
  };
}

/**
 * Fingerprint of the archive's *content*, excluding `generatedAt`. Two runs over an
 * unchanged tree yield the same value, which is what makes a rerun verifiably idempotent.
 */
export function inventoryContentFingerprint(manifest: InventoryManifest): string {
  const canonical = JSON.stringify({
    manifestVersion: manifest.manifestVersion,
    entries: manifest.entries,
    duplicateGroups: manifest.duplicateGroups,
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

type BaselineCounts = {
  totalFiles: number;
  uniqueContentHashes: number;
  duplicateFiles: number;
};

/** Comparison against a previously observed census. Never a hardcoded expectation. */
export interface InventoryBaselineComparison {
  readonly matchesBaseline: boolean;
  readonly observed: BaselineCounts;
  readonly baseline: BaselineCounts;
}

export function compareInventoryBaseline(
  summary: InventorySummary,
  baseline: BaselineCounts,
): InventoryBaselineComparison {
  const observed: BaselineCounts = {
    totalFiles: summary.totalFiles,
    uniqueContentHashes: summary.uniqueContentHashes,
    duplicateFiles: summary.duplicateFiles,
  };
  return {
    matchesBaseline:
      observed.totalFiles === baseline.totalFiles &&
      observed.uniqueContentHashes === baseline.uniqueContentHashes &&
      observed.duplicateFiles === baseline.duplicateFiles,
    observed,
    baseline,
  };
}
