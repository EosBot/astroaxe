import "server-only";

import { constants } from "node:fs";
import { open, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import type { FileHandle } from "node:fs/promises";

export type ArtifactStorageErrorCode =
  "INVALID_PATH" | "PATH_ESCAPE" | "NOT_REGULAR_FILE" | "MIME_MISMATCH" | "UNSUPPORTED_MIME";

export class ArtifactStorageError extends Error {
  constructor(readonly code: ArtifactStorageErrorCode) {
    super("Artifact unavailable");
    this.name = "ArtifactStorageError";
  }
}

export interface VerifiedArtifact {
  readonly handle: FileHandle;
  readonly size: number;
  readonly mimeType: string;
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
    throw new ArtifactStorageError("INVALID_PATH");
}

function isWithinRoot(root: string, candidate: string): boolean {
  const child = relative(root, candidate);
  return child !== "" && child !== ".." && !child.startsWith(`..${sep}`) && !isAbsolute(child);
}

function detectMimeType(bytes: Buffer): string | null {
  if (bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) return "application/pdf";
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.subarray(0, 6).toString("ascii") === "GIF87a" ||
    bytes.subarray(0, 6).toString("ascii") === "GIF89a"
  )
    return "image/gif";
  if (
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "image/webp";
  if (
    bytes.length > 0 &&
    !bytes.includes(0) &&
    Buffer.from(bytes.toString("utf8"), "utf8").equals(bytes)
  )
    return "text/plain";
  return null;
}

export async function openVerifiedArtifact(
  archiveRoot: string,
  relativePath: string,
  expectedMimeType: string,
): Promise<VerifiedArtifact> {
  assertSafeRelativePath(relativePath);
  const canonicalRoot = await realpath(archiveRoot);
  const candidate = resolve(canonicalRoot, relativePath);
  if (!isWithinRoot(canonicalRoot, candidate)) throw new ArtifactStorageError("PATH_ESCAPE");

  let handle: FileHandle | undefined;
  try {
    handle = await open(candidate, constants.O_RDONLY | constants.O_NOFOLLOW);
    const stat = await handle.stat();
    if (!stat.isFile()) throw new ArtifactStorageError("NOT_REGULAR_FILE");
    if (!Number.isSafeInteger(stat.size) || stat.size <= 0)
      throw new ArtifactStorageError("NOT_REGULAR_FILE");

    const descriptorTarget = await realpath(`/proc/self/fd/${handle.fd}`);
    if (!isWithinRoot(canonicalRoot, descriptorTarget))
      throw new ArtifactStorageError("PATH_ESCAPE");

    const probe = Buffer.alloc(Math.min(512, stat.size));
    await handle.read(probe, 0, probe.length, 0);
    const detected = detectMimeType(probe);
    if (detected === null) throw new ArtifactStorageError("UNSUPPORTED_MIME");
    const normalizedExpected = expectedMimeType.split(";", 1)[0]?.trim().toLowerCase();
    if (detected !== normalizedExpected) throw new ArtifactStorageError("MIME_MISMATCH");

    return { handle, size: stat.size, mimeType: detected };
  } catch (error) {
    await handle?.close().catch(() => undefined);
    if (error instanceof ArtifactStorageError) throw error;
    throw new ArtifactStorageError("INVALID_PATH");
  }
}

export interface ByteRange {
  readonly start: number;
  readonly end: number;
  readonly length: number;
  readonly partial: boolean;
}

export function parseByteRange(header: string | null, size: number): ByteRange {
  if (!Number.isSafeInteger(size) || size <= 0) throw new RangeError("Invalid artifact size");
  if (header === null) return { start: 0, end: size - 1, length: size, partial: false };
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (match === null) throw new RangeError("Invalid range");
  const [, startText, endText] = match;
  if (startText === "" && endText === "") throw new RangeError("Invalid range");

  let start: number;
  let end: number;
  if (startText === "") {
    const suffix = Number(endText);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) throw new RangeError("Invalid range");
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(startText);
    end = endText === "" ? size - 1 : Number(endText);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size)
      throw new RangeError("Invalid range");
    end = Math.min(end, size - 1);
  }
  return { start, end, length: end - start + 1, partial: true };
}
