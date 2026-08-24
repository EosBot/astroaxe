import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { materializeSecretFiles, resolveSecretValue } from "./read-secret";

const temporaryDirectories: string[] = [];

function secretFile(content: string): string {
  const directory = mkdtempSync(join(tmpdir(), "astroaxe-secret-test-"));
  temporaryDirectories.push(directory);
  const path = join(directory, "secret");
  writeFileSync(path, content, { mode: 0o600 });
  return path;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("resolveSecretValue", () => {
  it("keeps direct environment values for local development", () => {
    expect(resolveSecretValue({ TOKEN: "direct-secret" }, "TOKEN")).toBe("direct-secret");
  });

  it("reads a Docker-style secret file and removes its terminal newline", () => {
    const path = secretFile("file-secret\n");
    expect(resolveSecretValue({ TOKEN_FILE: path }, "TOKEN")).toBe("file-secret");
  });

  it("rejects ambiguous direct and file configuration", () => {
    const path = secretFile("file-secret");
    expect(() => resolveSecretValue({ TOKEN: "direct-secret", TOKEN_FILE: path }, "TOKEN")).toThrow(
      "Configure somente TOKEN ou TOKEN_FILE",
    );
  });

  it("rejects missing, empty and oversized secret files without exposing content", () => {
    expect(() => resolveSecretValue({ TOKEN_FILE: "/missing/secret" }, "TOKEN")).toThrow(
      "Não foi possível ler",
    );
    expect(() => resolveSecretValue({ TOKEN_FILE: secretFile("") }, "TOKEN")).toThrow(
      "tamanho inválido",
    );
    expect(() =>
      resolveSecretValue({ TOKEN_FILE: secretFile("x".repeat(65_537)) }, "TOKEN"),
    ).toThrow("tamanho inválido");
  });
});

describe("materializeSecretFiles", () => {
  it("resolves only the declared variables and removes their file selectors", () => {
    const path = secretFile("database-url");
    expect(
      materializeSecretFiles({ DATABASE_URL_FILE: path, SITE_URL: "https://astroaxe.example" }, [
        "DATABASE_URL",
      ]),
    ).toEqual({ DATABASE_URL: "database-url", SITE_URL: "https://astroaxe.example" });
  });
});
