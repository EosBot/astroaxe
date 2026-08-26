import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildInventoryManifest,
  inventoryContentFingerprint,
  type InventoryEntry,
} from "@/domain/ceremonial/inventory";
import { scanArchive } from "./inventory-scan";

/**
 * Every fixture is synthetic and lives in a temporary directory. The real archive is
 * never touched by this suite.
 */
let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "astroaxe-inventory-"));
  mkdirSync(join(root, "livros"));
  mkdirSync(join(root, "backup"));
  writeFileSync(join(root, "livros", "tratado.pdf"), "%PDF-1.7\nconteudo sintetico");
  // Same bytes under a different name: must collapse to one artifact identity.
  writeFileSync(join(root, "backup", "tratado-copia.pdf"), "%PDF-1.7\nconteudo sintetico");
  writeFileSync(join(root, "livros", "notas.txt"), "anotacao sintetica");
  writeFileSync(join(root, "vazio.txt"), "");
  writeFileSync(join(root, "opaco.bin"), Buffer.from([0x00, 0x01, 0x02, 0x03]));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function byPath(entries: readonly InventoryEntry[]): Map<string, InventoryEntry> {
  return new Map(entries.map((entry) => [entry.relativePath, entry]));
}

describe("scanArchive", () => {
  it("records relative paths, sizes, hashes and detected types without absolute paths", async () => {
    const entries = await scanArchive({ archiveRoot: root });
    const found = byPath(entries);

    expect(found.get("livros/tratado.pdf")).toMatchObject({
      state: "INDEXED",
      mimeType: "application/pdf",
    });
    expect(found.get("livros/notas.txt")).toMatchObject({
      state: "INDEXED",
      mimeType: "text/plain",
    });
    expect(found.get("livros/tratado.pdf")?.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(entries)).not.toContain(root);
  });

  it("gives renamed identical content the same hash", async () => {
    const found = byPath(await scanArchive({ archiveRoot: root }));
    expect(found.get("livros/tratado.pdf")?.contentHash).toBe(
      found.get("backup/tratado-copia.pdf")?.contentHash,
    );
  });

  it("quarantines empty and unidentifiable files instead of dropping them", async () => {
    const found = byPath(await scanArchive({ archiveRoot: root }));
    expect(found.get("vazio.txt")).toMatchObject({
      state: "QUARANTINED",
      quarantineReason: "EMPTY",
      contentHash: null,
    });
    expect(found.get("opaco.bin")).toMatchObject({
      state: "QUARANTINED",
      quarantineReason: "UNSUPPORTED_TYPE",
    });
  });

  it("keeps the hash of a readable file whose type is unknown", async () => {
    // Regression: discarding the hash here destroyed dedup for most of the real archive.
    writeFileSync(join(root, "copia-opaca.bin"), Buffer.from([0x00, 0x01, 0x02, 0x03]));
    const found = byPath(await scanArchive({ archiveRoot: root }));

    const original = found.get("opaco.bin");
    expect(original?.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(original?.quarantineReason).toBe("UNSUPPORTED_TYPE");
    // Identical unknown bytes under two names still resolve to one content identity.
    expect(found.get("copia-opaca.bin")?.contentHash).toBe(original?.contentHash);
  });

  it("indexes recorded audio, the archive's most common content", async () => {
    writeFileSync(join(root, "ponto.mp3"), Buffer.from([0xff, 0xfb, 0x90, 0x00, 0x11, 0x22]));
    const found = byPath(await scanArchive({ archiveRoot: root }));
    expect(found.get("ponto.mp3")).toMatchObject({
      state: "INDEXED",
      mimeType: "audio/mpeg",
    });
  });

  it("records a symlink as quarantined and never follows it out of the archive", async () => {
    const outside = mkdtempSync(join(tmpdir(), "astroaxe-outside-"));
    writeFileSync(join(outside, "segredo.txt"), "conteudo fora do acervo");
    try {
      symlinkSync(join(outside, "segredo.txt"), join(root, "fuga.txt"));
      const found = byPath(await scanArchive({ archiveRoot: root }));
      expect(found.get("fuga.txt")).toMatchObject({
        state: "QUARANTINED",
        quarantineReason: "SYMLINK",
        contentHash: null,
      });
      expect(JSON.stringify([...found.values()])).not.toContain("conteudo fora do acervo");
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it("terminates on a symlinked directory loop", async () => {
    symlinkSync(root, join(root, "livros", "loop"));
    const entries = await scanArchive({ archiveRoot: root });
    expect(entries.length).toBeGreaterThan(0);
    expect(
      entries.filter((entry) => entry.quarantineReason === "SYMLINK").length,
    ).toBeGreaterThan(0);
  });

  it("quarantines an unreadable directory rather than aborting the scan", async () => {
    const locked = join(root, "restrito");
    mkdirSync(locked);
    writeFileSync(join(locked, "dentro.txt"), "texto");
    chmodSync(locked, 0o000);
    try {
      const entries = await scanArchive({ archiveRoot: root });
      // The rest of the archive still got scanned.
      expect(byPath(entries).get("livros/tratado.pdf")?.state).toBe("INDEXED");
      expect(byPath(entries).get("restrito")).toMatchObject({ quarantineReason: "UNREADABLE" });
    } finally {
      chmodSync(locked, 0o700);
    }
  });

  it("quarantines a file above the size ceiling without hashing it", async () => {
    const found = byPath(await scanArchive({ archiveRoot: root, maxHashableBytes: 5 }));
    expect(found.get("livros/tratado.pdf")).toMatchObject({
      state: "QUARANTINED",
      quarantineReason: "TOO_LARGE",
      contentHash: null,
    });
  });

  it("produces an identical content fingerprint when rerun over an unchanged tree", async () => {
    const first = buildInventoryManifest(await scanArchive({ archiveRoot: root }), new Date(0));
    const second = buildInventoryManifest(
      await scanArchive({ archiveRoot: root }),
      new Date("2026-08-26T12:00:00.000Z"),
    );
    expect(inventoryContentFingerprint(second)).toBe(inventoryContentFingerprint(first));
  });

  it("resumes from a checkpoint without rereading completed files", async () => {
    const full = await scanArchive({ archiveRoot: root });
    const completed = byPath(full.filter((entry) => entry.relativePath.startsWith("livros/")));

    const rescanned: string[] = [];
    const resumed = await scanArchive({
      archiveRoot: root,
      completed,
      onProgress: ({ relativePath }) => rescanned.push(relativePath),
    });

    // Checkpointed files were re-emitted untouched, not hashed again.
    for (const path of completed.keys()) expect(rescanned).not.toContain(path);
    expect(inventoryContentFingerprint(buildInventoryManifest(resumed, new Date(0)))).toBe(
      inventoryContentFingerprint(buildInventoryManifest(full, new Date(0))),
    );
  });

  it("reports every newly scanned entry so a caller can checkpoint incrementally", async () => {
    const observed: InventoryEntry[] = [];
    const entries = await scanArchive({
      archiveRoot: root,
      onEntry: (entry) => {
        observed.push(entry);
      },
    });
    expect(observed).toHaveLength(entries.length);
  });
});
