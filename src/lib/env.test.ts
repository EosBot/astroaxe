import { describe, expect, it } from "vitest";

import { parseServerEnv } from "./env";

describe("parseServerEnv", () => {
  it("accepts the required service URLs", () => {
    expect(
      parseServerEnv({
        DATABASE_URL: "postgresql://astroaxe:secret@postgres:5432/astroaxe",
        REDIS_URL: "redis://:secret@redis:6379/0",
        GUEST_SESSION_SECRET: "guest-session-secret-with-32-characters",
        AUTH_SESSION_SECRET: "account-session-secret-with-32-characters",
        FINGERPRINT_SECRET: "fingerprint-secret-with-32-characters",
        NOMINATIM_USER_AGENT: "AstroAxe/6.0 (local@example.test)",
        SITE_URL: "http://localhost",
        NODE_ENV: "test",
      }),
    ).toMatchObject({ NODE_ENV: "test" });
  });

  it("rejects missing service URLs", () => {
    expect(() => parseServerEnv({ NODE_ENV: "test" })).toThrow();
  });
});
