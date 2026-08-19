import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn(), create: vi.fn(), getPrisma: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ getPrisma: mocks.getPrisma }));

describe("guest sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPrisma.mockReturnValue({
      guestSession: { findFirst: mocks.findFirst, create: mocks.create },
    });
  });

  it("reuses a valid hashed cookie without exposing its token", async () => {
    mocks.findFirst.mockResolvedValue({ id: "session-id" });
    const request = new NextRequest("http://localhost", {
      headers: { cookie: "astroaxe_guest=raw-token" },
    });
    const { resolveGuestSession } = await import("./guest-session");
    await expect(
      resolveGuestSession(request, "a-secret-with-at-least-thirty-two-characters"),
    ).resolves.toEqual({ id: "session-id" });
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tokenHash: expect.not.stringContaining("raw-token") }),
      }),
    );
  });

  it("creates a fresh high-entropy token when no valid session exists", async () => {
    mocks.create.mockResolvedValue({ id: "new-session" });
    const request = new NextRequest("http://localhost");
    const { resolveGuestSession } = await import("./guest-session");
    const result = await resolveGuestSession(
      request,
      "a-secret-with-at-least-thirty-two-characters",
    );
    expect(result.id).toBe("new-session");
    expect(result.newToken?.length).toBeGreaterThan(30);
    expect(mocks.create).toHaveBeenCalledOnce();
  });

  it("rotates an unknown cookie instead of trusting it", async () => {
    mocks.findFirst.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ id: "rotated-session" });
    const request = new NextRequest("http://localhost", {
      headers: { cookie: "astroaxe_guest=expired-token" },
    });
    const { resolveGuestSession } = await import("./guest-session");
    const result = await resolveGuestSession(
      request,
      "a-secret-with-at-least-thirty-two-characters",
    );
    expect(result.id).toBe("rotated-session");
    expect(result.newToken).toBeDefined();
  });

  it("builds an HttpOnly SameSite cookie", async () => {
    const { guestCookie } = await import("./guest-session");
    expect(guestCookie("token")).toContain("HttpOnly; SameSite=Lax");
  });

  it("marks the cookie Secure in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { guestCookie } = await import("./guest-session");
    expect(guestCookie("token")).toContain("; Secure");
    vi.unstubAllEnvs();
  });
});
