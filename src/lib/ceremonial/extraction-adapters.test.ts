import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  EXTRACTION_LIMITS,
  EXTRACTION_PIPELINE_VERSION,
  normalizeExtractedText,
} from "@/domain/ceremonial/extraction";
import {
  resolveAdapterVersion,
  runExtractionAdapter,
  runPdfOcr,
} from "@/lib/ceremonial/extraction-adapters";
import { releaseSource, verifyInventoriedSource } from "@/lib/ceremonial/extraction-source";

import type { InventoryEntry } from "@/domain/ceremonial/inventory";
import type { VerifiedSource } from "@/lib/ceremonial/extraction-source";

/**
 * The host has none of the extraction binaries — poppler, tesseract and libarchive live
 * only in the ingest image. That is used here rather than worked around with mocks: the
 * in-process adapters run for real, and every binary-backed path is exercised through the
 * tool's absence, which is exactly the failure the pipeline must classify instead of
 * crashing on. The success paths for those binaries are proven by running the ingest image
 * itself (see `.omo/evidence/.../T13/extraction-adversarial.txt`).
 */

const roots: string[] = [];
const opened: VerifiedSource[] = [];

afterEach(async () => {
  while (opened.length > 0) {
    const source = opened.pop();
    if (source !== undefined) await releaseSource(source);
  }
  while (roots.length > 0) {
    const root = roots.pop();
    if (root !== undefined) await rm(root, { recursive: true, force: true });
  }
});

async function sourceOf(name: string, contents: string): Promise<VerifiedSource> {
  const root = await mkdtemp(join(tmpdir(), "astroaxe-adapters-"));
  roots.push(root);
  await writeFile(join(root, name), contents);
  const entry: InventoryEntry = {
    relativePath: name,
    byteSize: Buffer.byteLength(contents, "utf8"),
    modifiedAt: "2026-08-26T00:00:00.000Z",
    contentHash: createHash("sha256").update(contents, "utf8").digest("hex"),
    mimeType: "text/plain",
    state: "INDEXED",
    quarantineReason: null,
  };
  const result = await verifyInventoriedSource(root, entry);
  if (!result.ok) throw new Error(`fixture inválida: ${result.reason}`);
  opened.push(result.source);
  return result.source;
}

describe("runExtractionAdapter — adaptadores em processo", () => {
  it("reads plain text straight from the verified descriptor", async () => {
    const source = await sourceOf("a.txt", "Ogum abre os caminhos");
    const result = await runExtractionAdapter("plain-text", source, EXTRACTION_PIPELINE_VERSION);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.text).toBe("Ogum abre os caminhos");
    expect(result.pageCount).toBeNull();
    expect(result.adapterVersion).toBe(EXTRACTION_PIPELINE_VERSION);
  });

  it("recovers RTF body text and drops its metadata destinations", async () => {
    const rtf = "{\\rtf1\\ansi{\\fonttbl{\\f0 Times;}}Ex\\'fa na encruzilhada\\par}";
    const source = await sourceOf("a.rtf", rtf);
    const result = await runExtractionAdapter("rtf", source, EXTRACTION_PIPELINE_VERSION);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(normalizeExtractedText(result.text)).toBe("Exú na encruzilhada");
    expect(result.text).not.toContain("Times");
  });
});

describe("runExtractionAdapter — adaptadores por binário externo", () => {
  it("classifies a missing binary as a failed adapter rather than crashing", async () => {
    const source = await sourceOf("a.pdf", "%PDF-1.4 conteúdo");
    for (const adapter of ["pdf-text", "ocr-image"] as const)
      expect(await runExtractionAdapter(adapter, source, "ausente")).toEqual({
        ok: false,
        reason: "ADAPTER_FAILED",
      });
  });

  it("tries every known document part before refusing a ZIP container", async () => {
    const source = await sourceOf("a.docx", "PK conteúdo");
    // Both candidate parts are attempted; with bsdtar absent each attempt fails, and the
    // loop ends in a refusal rather than an unhandled error or a silent empty success.
    for (const adapter of ["ooxml", "opendocument"] as const)
      expect(await runExtractionAdapter(adapter, source, "ausente")).toEqual({
        ok: false,
        reason: "ADAPTER_FAILED",
      });
  });
});

describe("runPdfOcr", () => {
  it("refuses a document past the OCR page budget instead of half-reading it", async () => {
    const source = await sourceOf("livro.pdf", "%PDF-1.4");
    const result = await runPdfOcr(source, EXTRACTION_LIMITS.maxOcrPages + 1, "pdftoppm+tesseract");
    expect(result).toEqual({ ok: false, reason: "OCR_BUDGET_EXCEEDED" });
  });

  it("returns empty text when no page could be rendered, never a partial claim", async () => {
    const source = await sourceOf("livro.pdf", "%PDF-1.4");
    // pdftoppm is absent on the host: every page render fails, so nothing is transcribed.
    const result = await runPdfOcr(source, 2, "pdftoppm+tesseract");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(normalizeExtractedText(result.text)).toBe("");
    expect(result.pageCount).toBe(2);
  });
});

describe("resolveAdapterVersion", () => {
  it("identifies pure adapters by the pipeline version", async () => {
    for (const adapter of ["plain-text", "rtf"] as const)
      expect(await resolveAdapterVersion(adapter)).toBe(EXTRACTION_PIPELINE_VERSION);
  });

  it("reports an absent binary as null so the run fails loudly, not per file", async () => {
    for (const adapter of ["pdf-text", "ocr-image", "ooxml", "pdf-ocr"] as const)
      expect(await resolveAdapterVersion(adapter)).toBeNull();
  });
});
