import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  EXTRACTION_PIPELINE_VERSION,
  derivativeContentHash,
  type ExtractionRecord,
} from "@/domain/ceremonial/extraction";
import { readDerivative } from "@/lib/ceremonial/derivative-store";
import {
  MissingAdapterToolsError,
  extractInventoriedArchive,
  resolveExtractionToolchain,
  type ExtractionToolchain,
} from "@/lib/ceremonial/extraction-pipeline";

import type { InventoryEntry } from "@/domain/ceremonial/inventory";

/**
 * Only the pure adapters are exercised here. `pdf-text`, `ocr-image` and the container
 * formats need poppler, tesseract and libarchive, which exist inside the ingest image —
 * their evidence comes from running that image, not from mocking the binaries away.
 */
const TOOLCHAIN: ExtractionToolchain = {
  "pdf-text": "pdftotext 22.12.0",
  "ocr-image": "tesseract 5.3.0",
  "pdf-ocr": "pdftoppm version 22.12.0 + tesseract 5.3.0",
  "plain-text": EXTRACTION_PIPELINE_VERSION,
  opendocument: "bsdtar 3.6.2",
  ooxml: "bsdtar 3.6.2",
  rtf: EXTRACTION_PIPELINE_VERSION,
};

const roots: string[] = [];

afterEach(async () => {
  while (roots.length > 0) {
    const root = roots.pop();
    if (root !== undefined) await rm(root, { recursive: true, force: true });
  }
});

async function makeRoot(prefix: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), prefix));
  roots.push(root);
  return root;
}

function entry(relativePath: string, contents: string, mimeType: string | null): InventoryEntry {
  return {
    relativePath,
    byteSize: Buffer.byteLength(contents, "utf8"),
    modifiedAt: "2026-08-26T00:00:00.000Z",
    contentHash: createHash("sha256").update(contents, "utf8").digest("hex"),
    mimeType,
    state: "INDEXED",
    quarantineReason: null,
  };
}

async function run(
  entries: readonly InventoryEntry[],
  files: Readonly<Record<string, string>>,
  completed?: ReadonlyMap<string, ExtractionRecord>,
) {
  const archiveRoot = await makeRoot("astroaxe-archive-");
  const derivativeRoot = await makeRoot("astroaxe-derivative-");
  for (const [name, contents] of Object.entries(files))
    await writeFile(join(archiveRoot, name), contents);
  const records = await extractInventoriedArchive({
    archiveRoot,
    derivativeRoot,
    entries,
    toolchain: TOOLCHAIN,
    // Omitted rather than passed as undefined: the workspace uses exactOptionalPropertyTypes.
    ...(completed === undefined ? {} : { completed }),
  });
  return { records, derivativeRoot };
}

describe("extractInventoriedArchive", () => {
  it("extracts a text source and stores the derivative under its hash", async () => {
    const contents = "Xangô é justiça.\r\n\r\n\r\nOyá é o vento.  ";
    const { records, derivativeRoot } = await run([entry("a.txt", contents, "text/plain")], {
      "a.txt": contents,
    });

    const record = records[0];
    expect(record?.outcome).toBe("EXTRACTED");
    expect(record?.adapter).toBe("plain-text");
    expect(record?.characterCount).toBe([..."Xangô é justiça.\n\nOyá é o vento."].length);
    expect(await readDerivative(derivativeRoot, record?.derivativeHash ?? "")).toBe(
      "Xangô é justiça.\n\nOyá é o vento.",
    );
  });

  it("refuses audio explicitly, without ever opening the file", async () => {
    // The file is deliberately absent: reaching NO_ADAPTER proves no read was attempted.
    const { records } = await run([entry("ponto.mp3", "irrelevante", "audio/mpeg")], {});

    expect(records[0]).toMatchObject({
      outcome: "NO_ADAPTER",
      noAdapterReason: "AUDIO_NOT_TRANSCRIBED",
      adapter: null,
      derivativeHash: null,
    });
  });

  it("records a census row that was never readable rather than dropping it", async () => {
    const unreadable: InventoryEntry = {
      ...entry("x.bin", "", null),
      contentHash: null,
      state: "QUARANTINED",
      quarantineReason: "UNREADABLE",
    };
    const { records } = await run([unreadable], {});
    expect(records[0]).toMatchObject({
      outcome: "NO_ADAPTER",
      noAdapterReason: "NOT_INDEXED",
      sourceHash: null,
    });
  });

  it("quarantines a source whose bytes no longer match the census", async () => {
    const { records, derivativeRoot } = await run(
      [entry("a.txt", "conteúdo original", "text/plain")],
      { "a.txt": "conteúdo trocado!" },
    );

    expect(records[0]).toMatchObject({
      outcome: "QUARANTINED",
      quarantineReason: "SOURCE_HASH_MISMATCH",
      adapter: "plain-text",
      derivativeHash: null,
    });
    expect(
      await readDerivative(derivativeRoot, derivativeContentHash("conteúdo trocado!")),
    ).toBeNull();
  });

  it("reports an empty extraction as its own outcome, not as a failure", async () => {
    const contents = "   \n\n  \t \n";
    const { records } = await run([entry("vazio.txt", contents, "text/plain")], {
      "vazio.txt": contents,
    });

    expect(records[0]).toMatchObject({
      outcome: "EMPTY_RESULT",
      adapter: "plain-text",
      derivativeHash: null,
      quarantineReason: null,
    });
  });

  it("recovers text from an RTF source through the pure adapter", async () => {
    const rtf = "{\\rtf1\\ansi{\\fonttbl{\\f0 Times;}}Ex\\'fa guarda a encruzilhada\\par}";
    const { records, derivativeRoot } = await run([entry("a.rtf", rtf, "application/rtf")], {
      "a.rtf": rtf,
    });

    expect(records[0]?.outcome).toBe("EXTRACTED");
    expect(await readDerivative(derivativeRoot, records[0]?.derivativeHash ?? "")).toBe(
      "Exú guarda a encruzilhada",
    );
  });

  it("makes the derivative hash a property of the bytes, not of the path", async () => {
    const contents = "o mesmo ponto, dois nomes";
    const { records } = await run([entry("a.txt", contents, "text/plain")], { "a.txt": contents });

    expect(records[0]?.derivativeHash).toBe(derivativeContentHash(contents));
  });

  it("produces exactly one record per census row, in a stable order", async () => {
    const entries = [
      entry("z.mp3", "x", "audio/mpeg"),
      entry("a.txt", "primeiro", "text/plain"),
      entry("m.mp4", "x", "video/mp4"),
    ];
    const { records } = await run(entries, { "a.txt": "primeiro" });

    expect(records).toHaveLength(3);
    expect(records.map((record) => record.relativePath)).toEqual(["a.txt", "m.mp4", "z.mp3"]);
  });

  it("re-emits a previously completed row instead of extracting it again", async () => {
    const contents = "já processado";
    const previous: ExtractionRecord = {
      relativePath: "a.txt",
      sourceHash: createHash("sha256").update(contents, "utf8").digest("hex"),
      sourceMimeType: "text/plain",
      outcome: "EXTRACTED",
      adapter: "plain-text",
      adapterVersion: EXTRACTION_PIPELINE_VERSION,
      quarantineReason: null,
      noAdapterReason: null,
      derivativeHash: derivativeContentHash(contents),
      characterCount: [...contents].length,
      pageCount: null,
    };

    // The archive is empty, so a fresh extraction would quarantine; resuming must not.
    const { records } = await run(
      [entry("a.txt", contents, "text/plain")],
      {},
      new Map([["a.txt", previous]]),
    );
    expect(records[0]).toEqual(previous);
  });
});

describe("resolveExtractionToolchain", () => {
  /**
   * The host deliberately lacks poppler, tesseract and libarchive. A missing binary must
   * fail the whole run up front: quarantining every PDF because a tool was absent would
   * read as a corrupt archive instead of a broken container.
   */
  it("refuses the run when the extraction tools are absent, naming which", async () => {
    await expect(resolveExtractionToolchain()).rejects.toBeInstanceOf(MissingAdapterToolsError);
    await expect(resolveExtractionToolchain()).rejects.toThrow(/pdf-text/);
  });
});
