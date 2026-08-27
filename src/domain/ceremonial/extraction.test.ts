import { describe, expect, it } from "vitest";

import {
  EXTRACTION_PIPELINE_VERSION,
  buildExtractionManifest,
  derivativeContentHash,
  extractionContentFingerprint,
  extractionRecordSchema,
  normalizeExtractedText,
  sanitizeExtractionManifest,
  selectExtractionAdapter,
  summarizeExtraction,
  type ExtractionRecord,
} from "./extraction";

const SOURCE_HASH = "a".repeat(64);
const DERIVATIVE_HASH = "b".repeat(64);

function extracted(relativePath: string, overrides: Partial<ExtractionRecord> = {}) {
  return {
    relativePath,
    sourceHash: SOURCE_HASH,
    sourceMimeType: "application/pdf",
    outcome: "EXTRACTED",
    adapter: "pdf-text",
    adapterVersion: "pdftotext 22.12.0",
    quarantineReason: null,
    noAdapterReason: null,
    derivativeHash: DERIVATIVE_HASH,
    characterCount: 120,
    pageCount: 3,
    rights: "UNKNOWN",
    access: "LOCAL_ONLY",
    sensitivity: "CULTURALLY_SENSITIVE",
    ...overrides,
  } as ExtractionRecord;
}

describe("extractionRecordSchema", () => {
  it("refuses a derivative that claims public access", () => {
    expect(extractionRecordSchema.safeParse(extracted("a.pdf", { access: "PUBLIC" })).success).toBe(
      false,
    );
  });

  it("refuses a derivative that claims established rights", () => {
    for (const rights of ["PUBLIC_DOMAIN", "LICENSED", "PERMISSION_GRANTED"] as const)
      expect(extractionRecordSchema.safeParse(extracted("a.pdf", { rights })).success).toBe(false);
  });

  it("refuses an absolute host path so the archive location cannot leak", () => {
    for (const path of ["/mnt/e/Ocultismo/a.pdf", "C:/Ocultismo/a.pdf", "a/../b.pdf"])
      expect(extractionRecordSchema.safeParse(extracted(path)).success).toBe(false);
  });

  it("requires an extraction to carry hash, adapter, version and text", () => {
    for (const missing of [
      { derivativeHash: null },
      { adapter: null },
      { adapterVersion: null },
      { characterCount: 0 },
      { sourceHash: null },
    ])
      expect(extractionRecordSchema.safeParse(extracted("a.pdf", missing)).success).toBe(false);
  });

  it("requires every refusal to declare exactly one reason", () => {
    const quarantined = extracted("a.pdf", {
      outcome: "QUARANTINED",
      derivativeHash: null,
      characterCount: null,
      quarantineReason: null,
    });
    expect(extractionRecordSchema.safeParse(quarantined).success).toBe(false);

    const noAdapter = extracted("a.mp3", {
      outcome: "NO_ADAPTER",
      adapter: null,
      adapterVersion: null,
      derivativeHash: null,
      characterCount: null,
      pageCount: null,
      noAdapterReason: null,
    });
    expect(extractionRecordSchema.safeParse(noAdapter).success).toBe(false);
  });

  it("refuses a reason attached to the wrong outcome", () => {
    const contradictory = extracted("a.pdf", { noAdapterReason: "AUDIO_NOT_TRANSCRIBED" });
    expect(extractionRecordSchema.safeParse(contradictory).success).toBe(false);
  });

  it("refuses a derivative hash on an outcome that produced no derivative", () => {
    const impossible = extracted("a.mp3", {
      outcome: "NO_ADAPTER",
      noAdapterReason: "AUDIO_NOT_TRANSCRIBED",
      characterCount: null,
    });
    expect(extractionRecordSchema.safeParse(impossible).success).toBe(false);
  });
});

describe("selectExtractionAdapter", () => {
  it("refuses audio explicitly instead of returning nothing", () => {
    for (const mime of ["audio/mpeg", "audio/wav", "application/vnd.ms-asf"])
      expect(selectExtractionAdapter(mime)).toEqual({ noAdapterReason: "AUDIO_NOT_TRANSCRIBED" });
    expect(selectExtractionAdapter("video/mp4")).toEqual({
      noAdapterReason: "VIDEO_NOT_TRANSCRIBED",
    });
  });

  it("routes documents and images to their adapters", () => {
    expect(selectExtractionAdapter("application/pdf")).toEqual({ adapter: "pdf-text" });
    expect(selectExtractionAdapter("image/jpeg")).toEqual({ adapter: "ocr-image" });
    expect(selectExtractionAdapter("text/plain")).toEqual({ adapter: "plain-text" });
    expect(selectExtractionAdapter("application/rtf")).toEqual({ adapter: "rtf" });
    expect(selectExtractionAdapter("application/zip")).toEqual({ adapter: "ooxml" });
  });

  it("treats an unnamed type as unsupported rather than guessing", () => {
    expect(selectExtractionAdapter(null)).toEqual({ noAdapterReason: "UNSUPPORTED_FORMAT" });
    expect(selectExtractionAdapter("application/x-ole-storage")).toEqual({
      noAdapterReason: "UNSUPPORTED_FORMAT",
    });
  });
});

describe("normalizeExtractedText", () => {
  it("is idempotent, so a rerun produces the same derivative hash", () => {
    const once = normalizeExtractedText("Xangô\r\n\r\n\r\n  Oyá \t\n");
    expect(normalizeExtractedText(once)).toBe(once);
  });

  it("collapses line endings, trailing space and runs of blank lines", () => {
    expect(normalizeExtractedText("a  \r\nb\r\n\r\n\r\n\r\nc")).toBe("a\nb\n\nc");
  });

  it("strips control characters, zero-width joiners and the BOM", () => {
    const noisy = "\uFEFFa\u0000b\u200Bc\u0007d\u000C";
    expect(normalizeExtractedText(noisy)).toBe("abcd");
  });

  it("keeps two spellings of the same accented word identical after NFC", () => {
    const composed = normalizeExtractedText("Oxal\u00e1");
    const decomposed = normalizeExtractedText("Oxala\u0301");
    expect(composed).toBe(decomposed);
    expect(derivativeContentHash(composed)).toBe(derivativeContentHash(decomposed));
  });
});

describe("summarizeExtraction", () => {
  const records = [
    extracted("a.pdf"),
    extracted("b.pdf", { characterCount: 80 }),
    extracted("c.mp3", {
      outcome: "NO_ADAPTER",
      adapter: null,
      adapterVersion: null,
      sourceMimeType: "audio/mpeg",
      derivativeHash: null,
      characterCount: null,
      pageCount: null,
      noAdapterReason: "AUDIO_NOT_TRANSCRIBED",
    }),
    extracted("d.pdf", {
      outcome: "QUARANTINED",
      derivativeHash: null,
      characterCount: null,
      pageCount: null,
      quarantineReason: "SOURCE_HASH_MISMATCH",
    }),
  ];

  it("reports coverage as a fraction of every row, not of the attempted ones", () => {
    const coverage = summarizeExtraction(records);
    expect(coverage.eligibleSources).toBe(4);
    expect(coverage.extracted).toBe(2);
    expect(coverage.noAdapter).toBe(1);
    expect(coverage.quarantined).toBe(1);
    expect(coverage.extractedRatio).toBe(0.5);
    expect(coverage.charactersExtracted).toBe(200);
  });

  it("breaks refusals down by reason so nothing hides in a total", () => {
    const coverage = summarizeExtraction(records);
    expect(coverage.byNoAdapterReason).toEqual({ AUDIO_NOT_TRANSCRIBED: 1 });
    expect(coverage.byQuarantineReason).toEqual({ SOURCE_HASH_MISMATCH: 1 });
    expect(coverage.byAdapter).toEqual({ "pdf-text": 3 });
  });
});

describe("buildExtractionManifest", () => {
  it("rejects an invalid record instead of writing it as evidence", () => {
    expect(() =>
      buildExtractionManifest([extracted("a.pdf", { access: "PUBLIC" })], new Date(0)),
    ).toThrow();
  });

  it("sorts records so two runs over the same archive are comparable", () => {
    const manifest = buildExtractionManifest(
      [extracted("z.pdf"), extracted("a.pdf")],
      new Date("2026-08-26T12:00:00.000Z"),
    );
    expect(manifest.records.map((record) => record.relativePath)).toEqual(["a.pdf", "z.pdf"]);
    expect(manifest.pipelineVersion).toBe(EXTRACTION_PIPELINE_VERSION);
  });

  it("fingerprints content without the timestamp, so a rerun matches", () => {
    const first = buildExtractionManifest([extracted("a.pdf")], new Date("2026-01-01T00:00:00Z"));
    const second = buildExtractionManifest([extracted("a.pdf")], new Date("2026-12-31T23:59:59Z"));
    expect(first.generatedAt).not.toBe(second.generatedAt);
    expect(extractionContentFingerprint(first)).toBe(extractionContentFingerprint(second));
  });

  it("sanitizes to counts and toolchain, with no path or hash surviving", () => {
    const manifest = buildExtractionManifest(
      [
        extracted("Angelical e olimpicos/Arbatel 1575.pdf"),
        extracted("Apometria/ponto.mp3", {
          outcome: "NO_ADAPTER",
          adapter: null,
          adapterVersion: null,
          sourceMimeType: "audio/mpeg",
          derivativeHash: null,
          characterCount: null,
          pageCount: null,
          noAdapterReason: "AUDIO_NOT_TRANSCRIBED",
        }),
      ],
      new Date(0),
      { "pdf-text": "pdftotext 22.12.0" },
    );
    const sanitized = sanitizeExtractionManifest(manifest);
    const serialized = JSON.stringify(sanitized);

    expect(serialized).not.toContain("Arbatel");
    expect(serialized).not.toContain("Apometria");
    expect(serialized).not.toContain(SOURCE_HASH);
    expect(serialized).not.toContain(DERIVATIVE_HASH);
    expect(sanitized.coverage.extracted).toBe(1);
    expect(sanitized.adapterVersions).toEqual({ "pdf-text": "pdftotext 22.12.0" });
    expect(sanitized.pagesExtracted).toBe(3);
    expect(sanitized.contentFingerprint).toBe(extractionContentFingerprint(manifest));
  });

  /**
   * Regression: the toolchain used to be derived from the records, so a run where every
   * row quarantined reported no tools at all — losing the answer to "which poppler
   * produced nothing?" exactly when it is the question being asked.
   */
  it("keeps the toolchain even when the run extracted nothing", () => {
    const manifest = buildExtractionManifest(
      [
        extracted("a.pdf", {
          outcome: "QUARANTINED",
          adapter: null,
          adapterVersion: null,
          derivativeHash: null,
          characterCount: null,
          pageCount: null,
          quarantineReason: "ADAPTER_FAILED",
        }),
      ],
      new Date(0),
      { "pdf-text": "pdftotext 22.12.0" },
    );
    expect(sanitizeExtractionManifest(manifest).adapterVersions).toEqual({
      "pdf-text": "pdftotext 22.12.0",
    });
  });

  it("carries the derivative hash but never the extracted text itself", () => {
    const manifest = buildExtractionManifest([extracted("a.pdf")], new Date(0));
    const serialized = JSON.stringify(manifest);
    expect(manifest.records[0]?.derivativeHash).toBe(DERIVATIVE_HASH);
    expect(Object.keys(manifest.records[0] ?? {})).not.toContain("text");
    expect(serialized).not.toContain('"text"');
  });
});
