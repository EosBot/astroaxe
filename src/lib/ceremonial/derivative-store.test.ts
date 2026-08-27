import { chmod, mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { EXTRACTION_LIMITS, derivativeContentHash } from "@/domain/ceremonial/extraction";
import {
  CONTENT_DIRECTORY,
  DerivativeStoreUnavailableError,
  QUARANTINE_DIRECTORY,
  readDerivative,
  storeDerivative,
} from "@/lib/ceremonial/derivative-store";

const roots: string[] = [];

afterEach(async () => {
  while (roots.length > 0) {
    const root = roots.pop();
    if (root !== undefined) await rm(root, { recursive: true, force: true });
  }
});

async function derivativeRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "astroaxe-derivatives-"));
  roots.push(root);
  return root;
}

describe("storeDerivative", () => {
  it("promotes a validated derivative to a content-addressed path", async () => {
    const root = await derivativeRoot();
    const text = "Ogum abre os caminhos";
    const hash = derivativeContentHash(text);

    const result = await storeDerivative(root, text, hash);
    expect(result).toEqual({
      ok: true,
      relativePath: `${CONTENT_DIRECTORY}/${hash.slice(0, 2)}/${hash}.txt`,
      byteSize: Buffer.byteLength(text, "utf8"),
    });
  });

  it("leaves nothing behind in quarantine after a successful promotion", async () => {
    const root = await derivativeRoot();
    const text = "sem resíduo";
    await storeDerivative(root, text, derivativeContentHash(text));
    expect(await readdir(join(root, QUARANTINE_DIRECTORY))).toEqual([]);
  });

  it("writes the derivative readable only by its owner", async () => {
    const root = await derivativeRoot();
    const text = "conteúdo sensível";
    const hash = derivativeContentHash(text);
    const result = await storeDerivative(root, text, hash);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const stats = await stat(join(root, result.relativePath));
    expect(stats.mode & 0o777).toBe(0o600);
  });

  it("converges byte-identical sources on a single derivative", async () => {
    const root = await derivativeRoot();
    const text = "o mesmo texto vindo de dois arquivos";
    const hash = derivativeContentHash(text);

    const first = await storeDerivative(root, text, hash);
    const second = await storeDerivative(root, text, hash);
    expect(first).toEqual(second);
    expect(await readdir(join(root, CONTENT_DIRECTORY, hash.slice(0, 2)))).toHaveLength(1);
  });

  it("refuses a hash that does not describe the text", async () => {
    const root = await derivativeRoot();
    const result = await storeDerivative(root, "texto real", derivativeContentHash("outro texto"));
    expect(result).toEqual({ ok: false, reason: "OUTPUT_INVALID" });
    expect(await readdir(join(root, CONTENT_DIRECTORY)).catch(() => [])).toEqual([]);
  });

  it("refuses a malformed hash instead of building a path from it", async () => {
    const root = await derivativeRoot();
    for (const hash of ["", "nao-e-hash", "../escape", "A".repeat(64)])
      expect(await storeDerivative(root, "x", hash)).toEqual({
        ok: false,
        reason: "OUTPUT_INVALID",
      });
  });

  it("refuses output past the size ceiling rather than truncating it", async () => {
    const root = await derivativeRoot();
    const oversized = "a".repeat(EXTRACTION_LIMITS.maxOutputBytes + 1);
    const result = await storeDerivative(root, oversized, derivativeContentHash(oversized));
    expect(result).toEqual({ ok: false, reason: "OUTPUT_TOO_LARGE" });
  });
  /**
   * Found by running the real pipeline: a root-owned volume made every row report
   * OUTPUT_INVALID, which reads as "the archive is corrupt" instead of "the mount is
   * wrong". A storage failure must be loud and distinct.
   */
  it("aborts instead of blaming the text when the volume cannot be written", async () => {
    const root = await derivativeRoot();
    await chmod(root, 0o500);
    const text = "não vai caber em lugar nenhum";
    await expect(storeDerivative(root, text, derivativeContentHash(text))).rejects.toBeInstanceOf(
      DerivativeStoreUnavailableError,
    );
    await chmod(root, 0o700);
  });
});

describe("readDerivative", () => {
  it("returns the stored text when the hash still describes the bytes", async () => {
    const root = await derivativeRoot();
    const text = "Oxóssi caça o conhecimento";
    const hash = derivativeContentHash(text);
    await storeDerivative(root, text, hash);
    expect(await readDerivative(root, hash)).toBe(text);
  });

  it("returns nothing for a hash the volume never stored", async () => {
    const root = await derivativeRoot();
    expect(await readDerivative(root, "f".repeat(64))).toBeNull();
    expect(await readDerivative(root, "nao-e-hash")).toBeNull();
  });
});
