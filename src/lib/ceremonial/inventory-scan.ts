import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open, readdir, realpath } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

import {
  detectArchiveMediaType,
  type InventoryEntry,
  type InventoryQuarantineReason,
} from "@/domain/ceremonial/inventory";

/**
 * Read-only walk of the private archive.
 *
 * Nothing here writes to, moves or copies a source file: the archive is opened read-only,
 * one file at a time, and only derived facts (size, mtime, SHA-256, detected type) leave
 * the function. Symlinks are never followed — they are recorded and quarantined — so a
 * link planted inside the archive cannot pull the scan out of the tree or into a loop.
 */

/** Files above this are recorded and quarantined rather than hashed. */
const MAX_HASHABLE_BYTES = 2 * 1024 * 1024 * 1024;
const PROBE_BYTES = 4096;
const IO_ATTEMPTS = 4;
const IO_BACKOFF_MS = 60;

/**
 * The archive is typically a mounted volume, not local disk. Such a mount is an external
 * boundary that fails transiently under sustained load, and treating one flaky `readdir`
 * as a permanent quarantine would silently under-report the census. Retries are bounded,
 * so a genuinely unreadable path still ends up recorded with a reason.
 */
async function withIoRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < IO_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const code = (error as NodeJS.ErrnoException).code;
      // A real permission or missing-path error will not improve by waiting.
      if (code === "EACCES" || code === "EPERM" || code === "ENOENT") throw error;
      if (attempt < IO_ATTEMPTS - 1)
        await new Promise((resolve) => setTimeout(resolve, IO_BACKOFF_MS * 2 ** attempt));
    }
  }
  throw lastError;
}

export interface ScanProgress {
  readonly scanned: number;
  readonly relativePath: string;
}

export interface ScanArchiveOptions {
  readonly archiveRoot: string;
  /** Paths already recorded by a previous run; skipped and re-emitted unchanged. */
  readonly completed?: ReadonlyMap<string, InventoryEntry>;
  readonly onProgress?: (progress: ScanProgress) => void;
  /** Invoked after each newly scanned file so a caller can checkpoint incrementally. */
  readonly onEntry?: (entry: InventoryEntry) => Promise<void> | void;
  readonly maxHashableBytes?: number;
}

function toPosixRelative(root: string, absolutePath: string): string {
  return relative(root, absolutePath).split(sep).join("/");
}

function isWithinRoot(root: string, candidate: string): boolean {
  const child = relative(root, candidate);
  return child !== "" && child !== ".." && !child.startsWith(`..${sep}`) && !isAbsolute(child);
}

function quarantined(
  relativePath: string,
  byteSize: number,
  modifiedAt: string,
  reason: InventoryQuarantineReason,
  /**
   * Present when the bytes were read successfully and only the *type* is unknown.
   * Discarding a valid hash here would destroy duplicate detection for exactly the
   * files the archive holds most of, so an unidentified file stays content-addressed.
   */
  contentHash: string | null = null,
): InventoryEntry {
  return {
    relativePath,
    byteSize,
    modifiedAt,
    contentHash,
    mimeType: null,
    state: "QUARANTINED",
    quarantineReason: reason,
  };
}

/** Streams the file once, deriving both the hash and the type probe from the same read. */
async function hashAndDetect(
  absolutePath: string,
): Promise<{ contentHash: string; mimeType: string | null }> {
  const handle = await open(absolutePath, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const hash = createHash("sha256");
    let probe: Buffer | null = null;
    for await (const chunk of handle.createReadStream({ autoClose: false })) {
      const buffer = Buffer.from(chunk);
      probe ??= buffer.subarray(0, PROBE_BYTES);
      hash.update(buffer);
    }
    return {
      contentHash: hash.digest("hex"),
      mimeType: probe === null ? null : detectArchiveMediaType(probe),
    };
  } finally {
    await handle.close();
  }
}

async function scanFile(
  canonicalRoot: string,
  absolutePath: string,
  relativePath: string,
  maxHashableBytes: number,
): Promise<InventoryEntry> {
  let stats;
  try {
    // lstat, not stat: a symlink must be seen as a symlink, never resolved.
    stats = await withIoRetry(() => lstat(absolutePath));
  } catch {
    return quarantined(relativePath, 0, new Date(0).toISOString(), "UNREADABLE");
  }

  const modifiedAt = new Date(stats.mtimeMs).toISOString();
  if (stats.isSymbolicLink()) return quarantined(relativePath, 0, modifiedAt, "SYMLINK");
  if (!stats.isFile()) return quarantined(relativePath, 0, modifiedAt, "NOT_REGULAR_FILE");
  if (stats.size === 0) return quarantined(relativePath, 0, modifiedAt, "EMPTY");
  if (stats.size > maxHashableBytes)
    return quarantined(relativePath, stats.size, modifiedAt, "TOO_LARGE");

  try {
    const { contentHash, mimeType } = await withIoRetry(() => hashAndDetect(absolutePath));
    // Re-confirm the opened path stayed inside the archive before trusting the result.
    if (!isWithinRoot(canonicalRoot, absolutePath))
      return quarantined(relativePath, stats.size, modifiedAt, "UNREADABLE");
    if (mimeType === null)
      return quarantined(relativePath, stats.size, modifiedAt, "UNSUPPORTED_TYPE", contentHash);
    return {
      relativePath,
      byteSize: stats.size,
      modifiedAt,
      contentHash,
      mimeType,
      state: "INDEXED",
      quarantineReason: null,
    };
  } catch {
    // Permission denied, vanished mid-scan, I/O error: recorded, never silently skipped.
    return quarantined(relativePath, stats.size, modifiedAt, "UNREADABLE");
  }
}

/**
 * Walks without following symlinked directories. Already-completed paths from a prior
 * checkpoint are re-emitted untouched, which is what makes an interrupted run resumable
 * and a full rerun idempotent.
 */
export async function scanArchive(options: ScanArchiveOptions): Promise<InventoryEntry[]> {
  const canonicalRoot = await realpath(options.archiveRoot);
  const maxHashableBytes = options.maxHashableBytes ?? MAX_HASHABLE_BYTES;
  const completed = options.completed ?? new Map<string, InventoryEntry>();

  const entries: InventoryEntry[] = [];
  const visitedDirectories = new Set<string>();
  const pending: string[] = [canonicalRoot];

  while (pending.length > 0) {
    const directory = pending.pop();
    if (directory === undefined) break;
    // A directory reached twice means a loop; visiting it again would never terminate.
    if (visitedDirectories.has(directory)) continue;
    visitedDirectories.add(directory);

    let children;
    try {
      children = await withIoRetry(() => readdir(directory, { withFileTypes: true }));
    } catch {
      const relativePath = toPosixRelative(canonicalRoot, directory);
      if (relativePath !== "")
        entries.push(quarantined(relativePath, 0, new Date(0).toISOString(), "UNREADABLE"));
      continue;
    }

    for (const child of children) {
      const absolutePath = join(directory, child.name);
      if (!isWithinRoot(canonicalRoot, resolve(absolutePath))) continue;
      const relativePath = toPosixRelative(canonicalRoot, absolutePath);

      if (child.isDirectory()) {
        pending.push(absolutePath);
        continue;
      }

      const previous = completed.get(relativePath);
      if (previous !== undefined) {
        entries.push(previous);
        continue;
      }

      const entry = await scanFile(canonicalRoot, absolutePath, relativePath, maxHashableBytes);
      entries.push(entry);
      options.onProgress?.({ scanned: entries.length, relativePath });
      await options.onEntry?.(entry);
    }
  }

  return entries;
}
