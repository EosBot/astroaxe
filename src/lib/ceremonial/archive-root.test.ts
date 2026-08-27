import { describe, expect, it } from "vitest";

import { MissingArchiveRootError, resolveArchiveRoot } from "@/lib/ceremonial/archive-root";

describe("resolveArchiveRoot", () => {
  it("accepts an absolute path", () => {
    expect(resolveArchiveRoot({ CEREMONIAL_ARCHIVE_ROOT: "/mnt/acervo" })).toBe("/mnt/acervo");
  });

  it("trims surrounding whitespace, which a copied path often carries", () => {
    expect(resolveArchiveRoot({ CEREMONIAL_ARCHIVE_ROOT: "  /mnt/acervo  " })).toBe("/mnt/acervo");
  });

  it("refuses an absent or empty value instead of walking the working directory", () => {
    expect(() => resolveArchiveRoot({})).toThrow(MissingArchiveRootError);
    expect(() => resolveArchiveRoot({ CEREMONIAL_ARCHIVE_ROOT: "   " })).toThrow(
      MissingArchiveRootError,
    );
  });

  it("refuses a relative path, which would resolve differently per invocation", () => {
    for (const root of ["acervo", "./acervo", "../acervo"])
      expect(() => resolveArchiveRoot({ CEREMONIAL_ARCHIVE_ROOT: root })).toThrow(
        MissingArchiveRootError,
      );
  });

  it("refuses traversal segments and NUL bytes", () => {
    for (const root of ["/mnt/../etc", "/mnt/acervo\0/etc"])
      expect(() => resolveArchiveRoot({ CEREMONIAL_ARCHIVE_ROOT: root })).toThrow(
        MissingArchiveRootError,
      );
  });

  it("names the variable in its message, so the fix is obvious", () => {
    expect(() => resolveArchiveRoot({})).toThrow(/CEREMONIAL_ARCHIVE_ROOT/);
  });
});
