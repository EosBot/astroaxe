import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, symlink, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  confirmSourceUnchanged,
  releaseSource,
  verifyInventoriedSource,
} from "@/lib/ceremonial/extraction-source";

import type { InventoryEntry } from "@/domain/ceremonial/inventory";

const roots: string[] = [];

afterEach(async () => {
  while (roots.length > 0) {
    const root = roots.pop();
    if (root !== undefined) await rm(root, { recursive: true, force: true });
  }
});

async function fixtureRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "astroaxe-extract-src-"));
  roots.push(root);
  return root;
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function entryFor(relativePath: string, contents: string): InventoryEntry {
  return {
    relativePath,
    byteSize: Buffer.byteLength(contents, "utf8"),
    modifiedAt: "2026-08-26T00:00:00.000Z",
    contentHash: sha256(contents),
    mimeType: "text/plain",
    state: "INDEXED",
    quarantineReason: null,
  };
}

describe("verifyInventoriedSource", () => {
  it("accepts a source whose bytes still match the census", async () => {
    const root = await fixtureRoot();
    await writeFile(join(root, "a.txt"), "pontos cantados");
    const result = await verifyInventoriedSource(root, entryFor("a.txt", "pontos cantados"));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source.contentHash).toBe(sha256("pontos cantados"));
    expect(result.source.byteSize).toBe(Buffer.byteLength("pontos cantados", "utf8"));
    await releaseSource(result.source);
  });

  it("leaves the descriptor at offset 0 so the adapter reads the whole file", async () => {
    const root = await fixtureRoot();
    await writeFile(join(root, "a.txt"), "conteúdo completo");
    const result = await verifyInventoriedSource(root, entryFor("a.txt", "conteúdo completo"));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const chunks: Buffer[] = [];
    for await (const chunk of result.source.handle.createReadStream({
      start: 0,
      autoClose: false,
    }))
      chunks.push(Buffer.from(chunk));
    expect(Buffer.concat(chunks).toString("utf8")).toBe("conteúdo completo");
    await releaseSource(result.source);
  });

  it("refuses a symlink planted at the inventoried path", async () => {
    const root = await fixtureRoot();
    const outside = await fixtureRoot();
    await writeFile(join(outside, "secret.txt"), "segredo fora do acervo");
    await symlink(join(outside, "secret.txt"), join(root, "a.txt"));

    const result = await verifyInventoriedSource(root, entryFor("a.txt", "qualquer"));
    expect(result).toEqual({ ok: false, reason: "SOURCE_NOT_REGULAR_FILE" });
  });

  it("refuses a directory standing where a file was inventoried", async () => {
    const root = await fixtureRoot();
    await mkdir(join(root, "a.txt"));
    const result = await verifyInventoriedSource(root, entryFor("a.txt", "x"));
    expect(result).toEqual({ ok: false, reason: "SOURCE_NOT_REGULAR_FILE" });
  });

  it("refuses a file whose size no longer matches the census", async () => {
    const root = await fixtureRoot();
    await writeFile(join(root, "a.txt"), "cresceu depois do censo");
    const result = await verifyInventoriedSource(root, entryFor("a.txt", "curto"));
    expect(result).toEqual({ ok: false, reason: "SOURCE_SIZE_MISMATCH" });
  });

  it("refuses a same-size file whose bytes were swapped", async () => {
    const root = await fixtureRoot();
    await writeFile(join(root, "a.txt"), "BBBBB");
    const result = await verifyInventoriedSource(root, entryFor("a.txt", "AAAAA"));
    expect(result).toEqual({ ok: false, reason: "SOURCE_HASH_MISMATCH" });
  });

  it("reports a vanished source instead of an unclassified failure", async () => {
    const root = await fixtureRoot();
    const result = await verifyInventoriedSource(root, entryFor("ausente.txt", "x"));
    expect(result).toEqual({ ok: false, reason: "SOURCE_MISSING" });
  });

  it("refuses a traversal path without touching the filesystem", async () => {
    const root = await fixtureRoot();
    const entry = { ...entryFor("a.txt", "x"), relativePath: "../fora.txt" };
    const result = await verifyInventoriedSource(root, entry);
    expect(result).toEqual({ ok: false, reason: "SOURCE_MISSING" });
  });

  it("refuses a census row that never had readable bytes", async () => {
    const root = await fixtureRoot();
    await writeFile(join(root, "a.txt"), "x");
    const entry: InventoryEntry = {
      ...entryFor("a.txt", "x"),
      contentHash: null,
      mimeType: null,
      state: "QUARANTINED",
      quarantineReason: "UNREADABLE",
    };
    expect(await verifyInventoriedSource(root, entry)).toEqual({
      ok: false,
      reason: "SOURCE_MISSING",
    });
  });
});

describe("confirmSourceUnchanged", () => {
  it("confirms a source nobody touched while the adapter ran", async () => {
    const root = await fixtureRoot();
    await writeFile(join(root, "a.txt"), "estável");
    const result = await verifyInventoriedSource(root, entryFor("a.txt", "estável"));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(await confirmSourceUnchanged(result.source)).toBe(true);
    await releaseSource(result.source);
  });

  it("detects a source rewritten in place while the descriptor was open", async () => {
    const root = await fixtureRoot();
    const path = join(root, "a.txt");
    await writeFile(path, "original");
    const result = await verifyInventoriedSource(root, entryFor("a.txt", "original"));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Same inode, new contents and a new mtime: exactly the mid-extraction swap the
    // after-read check exists to catch.
    await writeFile(path, "trocado depois de abrir");
    await utimes(path, new Date(), new Date(Date.now() + 5_000));
    expect(await confirmSourceUnchanged(result.source)).toBe(false);
    await releaseSource(result.source);
  });

  it("reports a change rather than throwing once the descriptor is closed", async () => {
    const root = await fixtureRoot();
    await writeFile(join(root, "a.txt"), "fechado");
    const result = await verifyInventoriedSource(root, entryFor("a.txt", "fechado"));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    await releaseSource(result.source);
    expect(await confirmSourceUnchanged(result.source)).toBe(false);
  });
});
