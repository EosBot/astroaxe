import { describe, expect, it } from "vitest";

import { accountTokenMatches, createAccountToken, parseAccountToken } from "./account-token";

describe("account action tokens", () => {
  const id = "d85b7de6-9af0-4a3b-a3a1-6d3012670f62";
  const secret = "test-secret-with-more-than-thirty-two-characters";
  const now = new Date("2026-08-23T12:00:00.000Z");

  it("creates deterministic verification material without embedding the secret", () => {
    const created = createAccountToken(id, "EMAIL_VERIFICATION", secret, now);
    const parsed = parseAccountToken(created.token);

    expect(created.expiresAt.toISOString()).toBe("2026-08-24T12:00:00.000Z");
    expect(created.token).not.toContain(secret);
    expect(parsed?.id).toBe(id);
    expect(accountTokenMatches(parsed?.tokenHash ?? "", created.tokenHash)).toBe(true);
  });

  it("uses a shorter expiry for password reset and rejects malformed input", () => {
    const created = createAccountToken(id, "PASSWORD_RESET", secret, now);

    expect(created.expiresAt.toISOString()).toBe("2026-08-23T12:30:00.000Z");
    expect(parseAccountToken("invalid-token")).toBeNull();
    expect(accountTokenMatches("00", created.tokenHash)).toBe(false);
  });
});
