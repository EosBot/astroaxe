import "server-only";

import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { open, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { EXTRACTION_LIMITS, type ExtractionQuarantineReason } from "@/domain/ceremonial/extraction";

import type { InventoryEntry } from "@/domain/ceremonial/inventory";
import type { Stats } from "node:fs";
import type { FileHandle } from "node:fs/promises";

/**
 * The integrity gate between task 12's census and any extraction.
 *
 * A source is only ever opened once, and every later step — hashing, the adapter, the
 * after-read check — works through that single descriptor. Nothing re-resolves the path,
 * so the file that gets extracted is provably the same inode that was verified, even if
 * something replaces the name on disk mid-run. A path that no longer matches the
 * inventoried size or hash is not "a changed file": it is a file the census never saw,
 * and it is quarantined rather than ingested.
 */

export interface VerifiedSource {
  /** Positioned at offset 0 and handed to the adapter as stdin. Caller must release it. */
  readonly handle: FileHandle;
  readonly byteSize: number;
  readonly contentHash: string;
  /** Taken before the read; compared again after the adapter finishes. */
  readonly statBefore: Stats;
}

export type SourceVerification =
  | { readonly ok: true; readonly source: VerifiedSource }
  | { readonly ok: false; readonly reason: ExtractionQuarantineReason };

function isWithinRoot(root: string, candidate: string): boolean {
  const child = relative(root, candidate);
  return child !== "" && child !== ".." && !child.startsWith(`..${sep}`) && !isAbsolute(child);
}

function assertSafeRelativePath(relativePath: string): void {
  const segments = relativePath.split("/");
  if (
    relativePath.length === 0 ||
    isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    relativePath.includes("\0") ||
    segments.some((segment) => segment === "" || segment === "." || segment === "..")
  )
    throw new RangeError("unsafe relative path");
}

/**
 * Hashes through the already-open descriptor using positioned reads, which leaves the
 * file offset at 0. That matters: the adapter receives this same descriptor as its stdin
 * and must see the file from the beginning without anyone reopening the path.
 */
async function hashOpenDescriptor(handle: FileHandle): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of handle.createReadStream({ start: 0, autoClose: false }))
    hash.update(chunk);
  return hash.digest("hex");
}

/**
 * Opens and verifies one inventoried source. `NOFOLLOW` means a symlink planted at the
 * path fails the open outright rather than redirecting the read somewhere else.
 */
export async function verifyInventoriedSource(
  archiveRoot: string,
  entry: InventoryEntry,
): Promise<SourceVerification> {
  if (entry.state !== "INDEXED" || entry.contentHash === null)
    return { ok: false, reason: "SOURCE_MISSING" };

  let canonicalRoot: string;
  try {
    assertSafeRelativePath(entry.relativePath);
    canonicalRoot = await realpath(archiveRoot);
  } catch {
    return { ok: false, reason: "SOURCE_MISSING" };
  }

  const candidate = resolve(canonicalRoot, entry.relativePath);
  if (!isWithinRoot(canonicalRoot, candidate)) return { ok: false, reason: "SOURCE_MISSING" };

  let handle: FileHandle | undefined;
  try {
    handle = await open(candidate, constants.O_RDONLY | constants.O_NOFOLLOW);
    const statBefore = await handle.stat();

    if (!statBefore.isFile()) {
      await handle.close();
      return { ok: false, reason: "SOURCE_NOT_REGULAR_FILE" };
    }

    // Confirm through the descriptor — not the name — that we are still inside the archive.
    const descriptorTarget = await realpath(`/proc/self/fd/${handle.fd}`);
    if (!isWithinRoot(canonicalRoot, descriptorTarget)) {
      await handle.close();
      return { ok: false, reason: "SOURCE_NOT_REGULAR_FILE" };
    }

    if (statBefore.size !== entry.byteSize) {
      await handle.close();
      return { ok: false, reason: "SOURCE_SIZE_MISMATCH" };
    }

    if (statBefore.size > EXTRACTION_LIMITS.maxSourceBytes) {
      await handle.close();
      return { ok: false, reason: "OUTPUT_TOO_LARGE" };
    }

    const contentHash = await hashOpenDescriptor(handle);
    if (contentHash !== entry.contentHash) {
      await handle.close();
      return { ok: false, reason: "SOURCE_HASH_MISMATCH" };
    }

    return { ok: true, source: { handle, byteSize: statBefore.size, contentHash, statBefore } };
  } catch (error) {
    await handle?.close().catch(() => undefined);
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return { ok: false, reason: "SOURCE_MISSING" };
    // ELOOP is a symlink caught by O_NOFOLLOW: the name no longer denotes the census file.
    if (code === "ELOOP") return { ok: false, reason: "SOURCE_NOT_REGULAR_FILE" };
    return { ok: false, reason: "SOURCE_UNREADABLE" };
  }
}

/**
 * The closing half of the TOCTOU check. If the inode, device, size or mtime moved while
 * the adapter was reading, whatever it produced describes a file that is no longer the
 * verified one, so the derivative is discarded instead of attributed to the census entry.
 */
export async function confirmSourceUnchanged(source: VerifiedSource): Promise<boolean> {
  try {
    const after = await source.handle.stat();
    return (
      after.ino === source.statBefore.ino &&
      after.dev === source.statBefore.dev &&
      after.size === source.statBefore.size &&
      after.mtimeMs === source.statBefore.mtimeMs
    );
  } catch {
    return false;
  }
}

export async function releaseSource(source: VerifiedSource): Promise<void> {
  await source.handle.close().catch(() => undefined);
}
