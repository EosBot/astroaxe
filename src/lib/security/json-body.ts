import type { NextRequest } from "next/server";

export const MAX_JSON_BODY_BYTES = 16_384;

export type JsonRequestRejection = { ok: false; status: 415 | 413 };
export type JsonRequestAccepted = { ok: true };

/**
 * Shared guard for POST/PUT route handlers that expect a bounded JSON body:
 * rejects non-JSON content types (415) and payloads over `maxBytes` by
 * declared Content-Length (413) before the body is read/parsed.
 */
export function checkJsonRequest(
  request: NextRequest,
  maxBytes: number = MAX_JSON_BODY_BYTES,
): JsonRequestRejection | JsonRequestAccepted {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    return { ok: false, status: 415 };
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(contentLength) || contentLength > maxBytes) return { ok: false, status: 413 };
  return { ok: true };
}
