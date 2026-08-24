import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const guestSessionFixture = credentialFixture("guest-session");
const accountSessionFixture = credentialFixture("account-session");
const fingerprintFixture = credentialFixture("fingerprint");
const passwordFixture = process.env.ASTROAXE_TEST_PASSWORD ?? credentialFixture("password");
const replacementPasswordFixture =
  process.env.ASTROAXE_TEST_REPLACEMENT_PASSWORD ?? credentialFixture("replacement-password");
const invalidPasswordFixture =
  process.env.ASTROAXE_TEST_INVALID_PASSWORD ?? credentialFixture("invalid-password");
const passwordHashFixture = credentialFixture("password-hash");

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  userCreate: vi.fn(),
  userFind: vi.fn(),
  profileUpdate: vi.fn(),
  getPrisma: vi.fn(),
  rateLimit: vi.fn(),
  findGuest: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  resolveAccount: vi.fn(),
  replacePasswordAndSessions: vi.fn(),
  userDelete: vi.fn(),
  emailCreate: vi.fn(),
  accountTokenCreate: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  parseServerEnv: () => ({
    DATABASE_URL: "postgresql://localhost/test",
    REDIS_URL: "redis://localhost",
    GUEST_SESSION_SECRET: guestSessionFixture,
    AUTH_SESSION_SECRET: accountSessionFixture,
    FINGERPRINT_SECRET: fingerprintFixture,
    NOMINATIM_USER_AGENT: "AstroAxe test",
    SITE_URL: "http://localhost",
    NODE_ENV: "test",
  }),
}));
vi.mock("@/lib/prisma", () => ({ getPrisma: mocks.getPrisma }));
vi.mock("@/lib/rate-limit", () => ({ enforceRateLimit: mocks.rateLimit }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/lib/security/guest-session", () => ({
  findGuestSession: mocks.findGuest,
  GUEST_COOKIE_NAME: "astroaxe_guest",
}));
vi.mock("@/lib/security/account", () => ({
  accountCookie: () => "astroaxe_session=opaque; Path=/; HttpOnly",
  clearAccountCookie: () => "astroaxe_session=; Max-Age=0",
  createAccountSession: mocks.createSession,
  hashPassword: mocks.hashPassword,
  isSameOrigin: () => true,
  revokeAccountSession: mocks.revokeSession,
  replacePasswordAndSessions: mocks.replacePasswordAndSessions,
  resolveAccount: mocks.resolveAccount,
  verifyPassword: mocks.verifyPassword,
}));

describe("account routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue(true);
    mocks.findGuest.mockResolvedValue({ id: "guest-id" });
    mocks.hashPassword.mockResolvedValue(passwordHashFixture);
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.createSession.mockResolvedValue({ token: "opaque", expiresAt: new Date() });
    mocks.replacePasswordAndSessions.mockResolvedValue({ token: "rotated", expiresAt: new Date() });
    mocks.resolveAccount.mockResolvedValue({ id: "user-id", email: "lu@example.test" });
    mocks.userDelete.mockResolvedValue({ id: "user-id" });
    mocks.profileUpdate.mockResolvedValue({ count: 1 });
    mocks.userCreate.mockResolvedValue({ id: "user-id", email: "lu@example.test" });
    mocks.emailCreate.mockResolvedValue({ id: "email-id" });
    mocks.accountTokenCreate.mockResolvedValue({ id: "token-id" });
    mocks.userFind.mockResolvedValue({
      id: "user-id",
      email: "lu@example.test",
      passwordHash: passwordHashFixture,
    });
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        user: { create: mocks.userCreate },
        birthProfile: { updateMany: mocks.profileUpdate },
        emailOutbox: { create: mocks.emailCreate },
        accountToken: { create: mocks.accountTokenCreate },
      }),
    );
    mocks.getPrisma.mockReturnValue({
      $transaction: mocks.transaction,
      user: { findUnique: mocks.userFind, delete: mocks.userDelete },
      birthProfile: { updateMany: mocks.profileUpdate },
    });
  });

  it("registers and claims the current guest profile", async () => {
    const { POST } = await import("./register/route");
    const response = await POST(jsonRequest("/api/auth/register"));
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ claimedProfiles: 1 });
    expect(mocks.profileUpdate).toHaveBeenCalledWith({
      where: { guestSessionId: "guest-id", userId: null },
      data: { guestSessionId: null, userId: "user-id" },
    });
    expect(response.headers.getSetCookie()).toHaveLength(2);
    expect(mocks.emailCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-id",
        kind: "ACCOUNT_WELCOME",
        templateVersion: "v1",
        idempotencyKey: "account-welcome:user-id:v1",
        accountTokenId: expect.any(String),
      }),
    });
  });

  it("logs in and claims without duplicating profiles", async () => {
    const { POST } = await import("./login/route");
    const response = await POST(jsonRequest("/api/auth/login"));
    expect(response.status).toBe(200);
    expect(mocks.verifyPassword).toHaveBeenCalledWith(passwordFixture, passwordHashFixture);
    expect(mocks.profileUpdate).toHaveBeenCalledOnce();
  });

  it("returns the same public error for an unknown login", async () => {
    mocks.userFind.mockResolvedValue(null);
    const { POST } = await import("./login/route");
    const response = await POST(jsonRequest("/api/auth/login"));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Email ou senha inválidos." });
  });

  it("revokes logout and expires the cookie", async () => {
    const { POST } = await import("./logout/route");
    const response = await POST(
      new NextRequest("http://localhost/api/auth/logout", { method: "POST" }),
    );
    expect(response.status).toBe(200);
    expect(mocks.revokeSession).toHaveBeenCalledOnce();
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("changes the password and rotates every account session", async () => {
    const { PUT } = await import("./password/route");
    const response = await PUT(
      jsonRequest("/api/auth/password", {
        currentPassword: passwordFixture,
        newPassword: replacementPasswordFixture,
      }),
    );
    expect(response.status).toBe(200);
    expect(mocks.replacePasswordAndSessions).toHaveBeenCalledWith(
      "user-id",
      passwordHashFixture,
      accountSessionFixture,
    );
    expect(response.headers.get("set-cookie")).toContain("astroaxe_session");
  });

  it("deletes the authenticated account after explicit confirmation", async () => {
    const { DELETE } = await import("./account/route");
    const response = await DELETE(
      jsonRequest(
        "/api/auth/account",
        { currentPassword: passwordFixture, confirmation: "EXCLUIR" },
        "DELETE",
      ),
    );
    expect(response.status).toBe(200);
    expect(mocks.userDelete).toHaveBeenCalledWith({ where: { id: "user-id" } });
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("keeps the account when the deletion password is invalid", async () => {
    mocks.verifyPassword.mockResolvedValue(false);
    const { DELETE } = await import("./account/route");
    const response = await DELETE(
      jsonRequest(
        "/api/auth/account",
        { currentPassword: invalidPasswordFixture, confirmation: "EXCLUIR" },
        "DELETE",
      ),
    );
    expect(response.status).toBe(401);
    expect(mocks.userDelete).not.toHaveBeenCalled();
  });
});

function jsonRequest(
  path: string,
  body: Record<string, string> = {
    email: "LU@example.test",
    password: passwordFixture,
  },
  method = "POST",
): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function credentialFixture(label: string): string {
  return `test-only-${label}-value`.padEnd(40, "x");
}
