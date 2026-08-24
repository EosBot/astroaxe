import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseEmailEnv, parseServerEnv } from "./env";

const databaseUrlFixture = serviceUrlFixture("postgresql", "postgres", "astroaxe");
const redisUrlFixture = serviceUrlFixture("redis", "redis", "0");
const guestSessionFixture = credentialFixture("guest-session");
const accountSessionFixture = credentialFixture("account-session");
const fingerprintFixture = credentialFixture("fingerprint");

describe("parseServerEnv", () => {
  it("accepts the required service URLs", () => {
    expect(
      parseServerEnv({
        DATABASE_URL: databaseUrlFixture,
        REDIS_URL: redisUrlFixture,
        GUEST_SESSION_SECRET: guestSessionFixture,
        AUTH_SESSION_SECRET: accountSessionFixture,
        FINGERPRINT_SECRET: fingerprintFixture,
        NOMINATIM_USER_AGENT: "AstroAxe/6.0 (local@example.test)",
        SITE_URL: "http://localhost",
        NODE_ENV: "test",
      }),
    ).toMatchObject({ NODE_ENV: "test" });
  });

  it("rejects missing service URLs", () => {
    expect(() => parseServerEnv({ NODE_ENV: "test" })).toThrow();
  });

  it("loads sensitive values from Docker secret files", () => {
    const directory = mkdtempSync(join(tmpdir(), "astroaxe-env-test-"));
    const values = {
      DATABASE_URL: databaseUrlFixture,
      REDIS_URL: redisUrlFixture,
      GUEST_SESSION_SECRET: guestSessionFixture,
      AUTH_SESSION_SECRET: accountSessionFixture,
      FINGERPRINT_SECRET: fingerprintFixture,
    } as const;

    try {
      const source: NodeJS.ProcessEnv = {
        NOMINATIM_USER_AGENT: "AstroAxe/6.0 (local@example.test)",
        SITE_URL: "http://localhost",
        NODE_ENV: "production",
      };
      for (const [name, value] of Object.entries(values)) {
        const path = join(directory, name.toLowerCase());
        writeFileSync(path, `${value}\n`, { mode: 0o600 });
        source[`${name}_FILE`] = path;
      }

      expect(parseServerEnv(source)).toMatchObject(values);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

function credentialFixture(label: string): string {
  return `test-only-${label}-value`.padEnd(40, "x");
}

function serviceUrlFixture(
  protocol: "postgresql" | "redis",
  host: string,
  database: string,
): string {
  const credentials = credentialFixture(`${protocol}-connection`);
  return protocol === "postgresql"
    ? `${protocol}://astroaxe:${credentials}@${host}:5432/${database}`
    : `${protocol}://:${credentials}@${host}:6379/${database}`;
}

describe("parseEmailEnv", () => {
  it("accepts an unauthenticated local SMTP capture service", () => {
    expect(
      parseEmailEnv({
        SMTP_HOST: "mailpit",
        SMTP_PORT: "1025",
        SMTP_SECURE: "false",
        SMTP_USER: "",
        SMTP_PASSWORD: "",
        EMAIL_FROM: "nao-responda@astroaxe.local",
        NODE_ENV: "test",
      }),
    ).toMatchObject({ SMTP_PORT: 1025, SMTP_SECURE: false, SMTP_USER: undefined });
  });

  it("requires SMTP user and password together", () => {
    expect(() =>
      parseEmailEnv({
        SMTP_HOST: "smtp.example.test",
        SMTP_PORT: "587",
        SMTP_SECURE: "false",
        SMTP_USER: "smtp-user",
        EMAIL_FROM: "nao-responda@example.test",
        NODE_ENV: "test",
      }),
    ).toThrow();
  });
});
