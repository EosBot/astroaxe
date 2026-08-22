import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  findFirst: vi.fn(),
  deleteMany: vi.fn(),
  getPrisma: vi.fn(),
  transaction: vi.fn(),
  userUpdate: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ getPrisma: mocks.getPrisma }));

describe("account security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPrisma.mockReturnValue({
      $transaction: mocks.transaction,
      user: { update: mocks.userUpdate },
      accountSession: {
        create: mocks.create,
        findFirst: mocks.findFirst,
        deleteMany: mocks.deleteMany,
      },
    });
  });

  it("hashes passwords with a random salt and verifies without storing plaintext", async () => {
    const { hashPassword, verifyPassword } = await import("./account");
    const first = await hashPassword("uma-senha-longa-e-segura");
    const second = await hashPassword("uma-senha-longa-e-segura");
    expect(first).not.toBe(second);
    expect(first).not.toContain("uma-senha-longa-e-segura");
    await expect(verifyPassword("uma-senha-longa-e-segura", first)).resolves.toBe(true);
    await expect(verifyPassword("senha-incorreta", first)).resolves.toBe(false);
  });

  it("stores only the HMAC of an opaque session token", async () => {
    mocks.create.mockResolvedValue({ id: "session" });
    const { createAccountSession } = await import("./account");
    const result = await createAccountSession(
      "user-id",
      "a-secret-with-at-least-thirty-two-characters",
    );
    expect(result.token.length).toBeGreaterThan(30);
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-id",
        tokenHash: expect.not.stringContaining(result.token),
      }),
    });
  });

  it("resolves only a non-expired session", async () => {
    mocks.findFirst.mockResolvedValue({ user: { id: "user-id", email: "pessoa@example.test" } });
    const { resolveAccount } = await import("./account");
    const request = new NextRequest("http://localhost", {
      headers: { cookie: "astroaxe_session=raw-token" },
    });
    await expect(
      resolveAccount(request, "a-secret-with-at-least-thirty-two-characters"),
    ).resolves.toEqual({ id: "user-id", email: "pessoa@example.test" });
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ expiresAt: { gt: expect.any(Date) } }),
      }),
    );
  });

  it("replaces the password and all sessions atomically", async () => {
    mocks.userUpdate.mockReturnValue({ operation: "password" });
    mocks.deleteMany.mockReturnValue({ operation: "delete-sessions" });
    mocks.create.mockReturnValue({ operation: "new-session" });
    mocks.transaction.mockResolvedValue([]);
    const { replacePasswordAndSessions } = await import("./account");
    const result = await replacePasswordAndSessions(
      "user-id",
      "new-password-hash",
      "a-secret-with-at-least-thirty-two-characters",
    );
    expect(result.token.length).toBeGreaterThan(30);
    expect(mocks.transaction).toHaveBeenCalledWith([
      { operation: "password" },
      { operation: "delete-sessions" },
      { operation: "new-session" },
    ]);
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-id",
        tokenHash: expect.not.stringContaining(result.token),
      }),
    });
  });

  it("rejects a cross-origin mutation", async () => {
    const { isSameOrigin } = await import("./account");
    const request = new NextRequest("http://localhost/api/auth/logout", {
      headers: { origin: "https://attacker.example" },
    });
    expect(isSameOrigin(request, "http://localhost")).toBe(false);
  });

  it("revokes the hashed current token and expires the browser cookie", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 1 });
    const { clearAccountCookie, revokeAccountSession } = await import("./account");
    const request = new NextRequest("http://localhost", {
      headers: { cookie: "astroaxe_session=raw-token" },
    });
    await revokeAccountSession(request, "a-secret-with-at-least-thirty-two-characters");
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: expect.not.stringContaining("raw-token") },
    });
    expect(clearAccountCookie()).toContain("Max-Age=0");
  });
});
