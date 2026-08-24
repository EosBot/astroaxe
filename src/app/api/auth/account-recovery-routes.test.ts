import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { createAccountToken } from "@/lib/auth/account-token";

const secret = "account-recovery-test-secret-more-than-32-characters";
const tokenId = "d85b7de6-9af0-4a3b-a3a1-6d3012670f62";
const now = new Date();
const resetMaterial = createAccountToken(tokenId, "PASSWORD_RESET", secret, now);
const verificationMaterial = createAccountToken(tokenId, "EMAIL_VERIFICATION", secret, now);

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  resolveAccount: vi.fn(),
  userFind: vi.fn(),
  transaction: vi.fn(),
  tokenFind: vi.fn(),
  tokenUpdateMany: vi.fn(),
  tokenCreate: vi.fn(),
  outboxCreate: vi.fn(),
  userUpdate: vi.fn(),
  sessionDeleteMany: vi.fn(),
  sessionCreate: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  parseServerEnv: () => ({
    SITE_URL: "http://localhost",
    AUTH_SESSION_SECRET: "account-recovery-test-secret-more-than-32-characters",
  }),
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/lib/rate-limit", () => ({ enforceRateLimit: mocks.rateLimit }));
vi.mock("@/lib/security/account", () => ({
  accountCookie: (token: string) => `astroaxe_session=${token}; Path=/; HttpOnly`,
  createAccountSessionMaterial: () => ({
    token: "new-session",
    tokenHash: "session-hash",
    expiresAt: new Date("2026-09-23T00:00:00Z"),
  }),
  hashPassword: mocks.hashPassword,
  isSameOrigin: () => true,
  resolveAccount: mocks.resolveAccount,
}));
vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    user: { findUnique: mocks.userFind },
    accountToken: { findUnique: mocks.tokenFind },
    $transaction: mocks.transaction,
  }),
}));

describe("account verification and recovery routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue(true);
    mocks.resolveAccount.mockResolvedValue({ id: "user-id", email: "lu@example.test" });
    mocks.hashPassword.mockResolvedValue("new-password-hash");
    mocks.tokenUpdateMany.mockResolvedValue({ count: 1 });
    mocks.tokenCreate.mockResolvedValue({ id: tokenId });
    mocks.outboxCreate.mockResolvedValue({ id: "email-id" });
    mocks.userUpdate.mockResolvedValue({ id: "user-id" });
    mocks.sessionDeleteMany.mockResolvedValue({ count: 2 });
    mocks.sessionCreate.mockResolvedValue({ id: "session-id" });
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        accountToken: { updateMany: mocks.tokenUpdateMany, create: mocks.tokenCreate },
        emailOutbox: { create: mocks.outboxCreate },
        user: { update: mocks.userUpdate },
        accountSession: {
          deleteMany: mocks.sessionDeleteMany,
          create: mocks.sessionCreate,
        },
      }),
    );
  });

  it("does not reveal whether a recovery email exists", async () => {
    mocks.userFind.mockResolvedValue(null);
    const { POST } = await import("./password-reset/request/route");
    const response = await POST(
      request("/api/auth/password-reset/request", { email: "none@example.test" }),
    );
    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({
      message: "Se a conta existir, enviaremos as instruções para redefinir a senha.",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("creates a single-use password reset email for an existing account", async () => {
    mocks.userFind.mockResolvedValue({ id: "user-id" });
    const { POST } = await import("./password-reset/request/route");
    const response = await POST(
      request("/api/auth/password-reset/request", { email: "lu@example.test" }),
    );
    expect(response.status).toBe(202);
    expect(mocks.tokenCreate).toHaveBeenCalledOnce();
    expect(mocks.outboxCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        kind: "ACCOUNT_RECOVERY",
        accountTokenId: expect.any(String),
      }),
    });
  });

  it("consumes a reset token, revokes sessions and starts one new session", async () => {
    mocks.tokenFind.mockResolvedValue({
      id: tokenId,
      userId: "user-id",
      purpose: "PASSWORD_RESET",
      tokenHash: resetMaterial.tokenHash,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const { POST } = await import("./password-reset/confirm/route");
    const response = await POST(
      request("/api/auth/password-reset/confirm", {
        token: resetMaterial.token,
        newPassword: "nova-senha-segura-2026",
      }),
    );
    expect(response.status).toBe(200);
    expect(mocks.sessionDeleteMany).toHaveBeenCalledWith({ where: { userId: "user-id" } });
    expect(response.headers.get("set-cookie")).toContain("astroaxe_session=new-session");
  });

  it("rejects a malformed reset token without touching the database", async () => {
    const { POST } = await import("./password-reset/confirm/route");
    const response = await POST(
      request("/api/auth/password-reset/confirm", {
        token: "invalid",
        newPassword: "nova-senha-segura-2026",
      }),
    );
    expect(response.status).toBe(400);
    expect(mocks.tokenFind).not.toHaveBeenCalled();
  });

  it("queues another verification link for the authenticated account", async () => {
    mocks.userFind.mockResolvedValue({ id: "user-id", emailVerifiedAt: null });
    const { POST } = await import("./email-verification/request/route");
    const response = await POST(request("/api/auth/email-verification/request"));
    expect(response.status).toBe(202);
    expect(mocks.outboxCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ kind: "EMAIL_VERIFICATION" }),
    });
  });

  it("confirms an unused verification token", async () => {
    mocks.tokenFind.mockResolvedValue({
      id: tokenId,
      userId: "user-id",
      purpose: "EMAIL_VERIFICATION",
      tokenHash: verificationMaterial.tokenHash,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const { POST } = await import("./email-verification/confirm/route");
    const response = await POST(
      request("/api/auth/email-verification/confirm", { token: verificationMaterial.token }),
    );
    expect(response.status).toBe(200);
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "user-id" },
      data: { emailVerifiedAt: expect.any(Date) },
    });
  });
});

function request(path: string, body?: object): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify(body ?? {}),
  });
}
