import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  EXTRACTION_LIMITS,
  derivativeContentHash,
  type ExtractionQuarantineReason,
} from "@/domain/ceremonial/extraction";

/**
 * The rebuildable private volume that holds extracted text.
 *
 * Nothing lands in the usable tree directly. A derivative is written to a quarantine
 * directory, read back and re-hashed there, and only then renamed into place. Reading it
 * back is not paranoia about our own `writeFile`: it is what makes the promoted file's
 * name a claim the bytes on disk actually support, so a later reader can trust
 * `by-hash/<sha256>` without re-deriving anything.
 *
 * Content addressing also deduplicates for free — the archive holds 64 byte-identical
 * duplicates, and identical sources converge on one derivative rather than 64 copies.
 */

export const QUARANTINE_DIRECTORY = "quarantine";
export const CONTENT_DIRECTORY = "by-hash";

/**
 * The volume itself is unusable — not writable, or not there.
 *
 * This is deliberately not a quarantine reason. Reporting an unwritable volume as
 * `OUTPUT_INVALID` on every row would describe a misconfigured mount as a corrupt archive,
 * and a run that quarantines all 801 files looks identical to a run that found 801 broken
 * ones. It aborts instead, so the operator fixes the volume rather than reading a false
 * census.
 */
export class DerivativeStoreUnavailableError extends Error {
  constructor(override readonly cause: unknown) {
    super("o volume de derivados não está gravável");
    this.name = "DerivativeStoreUnavailableError";
  }
}

/** Errors that mean the volume is wrong, never that the text was. */
const STORAGE_FAILURE_CODES = new Set([
  "EACCES",
  "EPERM",
  "EROFS",
  "ENOSPC",
  "ENOENT",
  "EDQUOT",
  "EIO",
]);

export type DerivativeStoreResult =
  | { readonly ok: true; readonly relativePath: string; readonly byteSize: number }
  | { readonly ok: false; readonly reason: ExtractionQuarantineReason };

/** `by-hash/ab/abcdef….txt` — a two-character shard keeps directories browsable. */
function contentRelativePath(hash: string): string {
  return `${CONTENT_DIRECTORY}/${hash.slice(0, 2)}/${hash}.txt`;
}

function isSha256(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}

/**
 * Validates and stores one derivative. The expected hash is supplied by the caller and
 * checked twice: once against the text in memory, once against the bytes read back from
 * quarantine. A mismatch at either point is `OUTPUT_INVALID` and nothing is promoted.
 */
export async function storeDerivative(
  derivativeRoot: string,
  normalizedText: string,
  expectedHash: string,
): Promise<DerivativeStoreResult> {
  if (!isSha256(expectedHash)) return { ok: false, reason: "OUTPUT_INVALID" };
  if (derivativeContentHash(normalizedText) !== expectedHash)
    return { ok: false, reason: "OUTPUT_INVALID" };

  const bytes = Buffer.from(normalizedText, "utf8");
  if (bytes.length > EXTRACTION_LIMITS.maxOutputBytes)
    return { ok: false, reason: "OUTPUT_TOO_LARGE" };
  // A round trip that does not reproduce the input means the text was never valid UTF-8.
  if (bytes.toString("utf8") !== normalizedText) return { ok: false, reason: "OUTPUT_INVALID" };

  const quarantinePath = join(derivativeRoot, QUARANTINE_DIRECTORY, `${expectedHash}.part`);
  const relativePath = contentRelativePath(expectedHash);
  const finalPath = join(derivativeRoot, relativePath);

  try {
    await mkdir(join(derivativeRoot, QUARANTINE_DIRECTORY), { recursive: true, mode: 0o700 });
    await mkdir(join(derivativeRoot, CONTENT_DIRECTORY, expectedHash.slice(0, 2)), {
      recursive: true,
      mode: 0o700,
    });
    await writeFile(quarantinePath, bytes, { mode: 0o600 });

    // Read back from quarantine: the promoted name must describe the bytes on disk.
    const persisted = await readFile(quarantinePath);
    if (createHash("sha256").update(persisted).digest("hex") !== expectedHash) {
      await rm(quarantinePath, { force: true });
      return { ok: false, reason: "OUTPUT_INVALID" };
    }

    // Atomic within the volume: a reader sees either no file or the complete one.
    await rename(quarantinePath, finalPath);
    return { ok: true, relativePath, byteSize: persisted.length };
  } catch (error) {
    await rm(quarantinePath, { force: true }).catch(() => undefined);
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== undefined && STORAGE_FAILURE_CODES.has(code))
      throw new DerivativeStoreUnavailableError(error);
    return { ok: false, reason: "OUTPUT_INVALID" };
  }
}

/**
 * Reads a stored derivative back, verifying the hash again. Local-only by construction:
 * the caller must already hold the hash, which only the extraction manifest carries.
 */
export async function readDerivative(derivativeRoot: string, hash: string): Promise<string | null> {
  if (!isSha256(hash)) return null;
  try {
    const bytes = await readFile(join(derivativeRoot, contentRelativePath(hash)));
    if (createHash("sha256").update(bytes).digest("hex") !== hash) return null;
    return bytes.toString("utf8");
  } catch {
    return null;
  }
}
