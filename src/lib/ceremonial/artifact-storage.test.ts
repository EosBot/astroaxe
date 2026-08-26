import { mkdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import {
  ArtifactStorageError,
  openVerifiedArtifact,
  parseByteRange,
} from "@/lib/ceremonial/artifact-storage";

const roots: string[] = [];

async function fixtureRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "astroaxe-artifact-"));
  roots.push(root);
  return root;
}

afterEach(async () => {
  const { rm } = await import("node:fs/promises");
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("openVerifiedArtifact", () => {
  it("opens a regular PDF beneath the archive root and validates its bytes", async () => {
    const root = await fixtureRoot();
    await mkdir(join(root, "books"));
    await writeFile(join(root, "books", "fixture.pdf"), Buffer.from("%PDF-1.7\nsynthetic"));

    const artifact = await openVerifiedArtifact(root, "books/fixture.pdf", "application/pdf");
    expect(artifact.mimeType).toBe("application/pdf");
    expect(artifact.size).toBe(18);
    await artifact.handle.close();
  });

  it.each(["../outside.pdf", "/etc/passwd", "books\\fixture.pdf", "./books/fixture.pdf"])(
    "rejects unsafe relative path %s",
    async (relativePath) => {
      const root = await fixtureRoot();
      await expect(
        openVerifiedArtifact(root, relativePath, "application/pdf"),
      ).rejects.toMatchObject({
        code: "INVALID_PATH",
      });
    },
  );

  it("rejects final and intermediate symlink escapes", async () => {
    const root = await fixtureRoot();
    const outside = await fixtureRoot();
    await writeFile(join(outside, "outside.pdf"), Buffer.from("%PDF-1.7\nprivate"));
    await symlink(join(outside, "outside.pdf"), join(root, "final.pdf"));
    await symlink(outside, join(root, "nested"));

    await expect(openVerifiedArtifact(root, "final.pdf", "application/pdf")).rejects.toBeInstanceOf(
      ArtifactStorageError,
    );
    await expect(
      openVerifiedArtifact(root, "nested/outside.pdf", "application/pdf"),
    ).rejects.toMatchObject({ code: "PATH_ESCAPE" });
  });

  it("rejects a MIME declaration that disagrees with the file signature", async () => {
    const root = await fixtureRoot();
    await writeFile(join(root, "spoof.pdf"), Buffer.from("<script>synthetic</script>"));

    await expect(openVerifiedArtifact(root, "spoof.pdf", "application/pdf")).rejects.toMatchObject({
      code: "MIME_MISMATCH",
    });
  });
});

describe("parseByteRange", () => {
  it.each([
    [null, 100, { start: 0, end: 99, length: 100, partial: false }],
    ["bytes=10-19", 100, { start: 10, end: 19, length: 10, partial: true }],
    ["bytes=90-", 100, { start: 90, end: 99, length: 10, partial: true }],
    ["bytes=-10", 100, { start: 90, end: 99, length: 10, partial: true }],
  ] as const)("parses %s", (header, size, expected) => {
    expect(parseByteRange(header, size)).toEqual(expected);
  });

  it.each(["bytes=100-101", "bytes=20-10", "bytes=0-1,4-5", "items=0-1", "bytes=-0"])(
    "rejects invalid or multipart range %s",
    (header) => {
      expect(() => parseByteRange(header, 100)).toThrow(RangeError);
    },
  );
});
