import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolveAccount: vi.fn(),
  resolveGuest: vi.fn(),
  rateLimit: vi.fn(),
  create: vi.fn(),
  sanitize: vi.fn(),
  calculate: vi.fn(),
}));
vi.mock("@/lib/env", () => ({
  parseServerEnv: () => ({
    AUTH_SESSION_SECRET: "a".repeat(32),
    GUEST_SESSION_SECRET: "g".repeat(32),
    FINGERPRINT_SECRET: "f".repeat(32),
  }),
}));
vi.mock("@/lib/security/account", () => ({ resolveAccount: mocks.resolveAccount }));
vi.mock("@/lib/security/guest-session", () => ({
  resolveGuestSession: mocks.resolveGuest,
  guestCookie: () => "astroaxe_guest=opaque",
}));
vi.mock("@/lib/rate-limit", () => ({ enforceRateLimit: mocks.rateLimit }));
vi.mock("@/lib/prisma", () => ({ getPrisma: () => ({ birthProfile: { create: mocks.create } }) }));
vi.mock("@/lib/data-hygiene/birth-data", () => ({ sanitizeBirthData: mocks.sanitize }));
vi.mock("@/domain/astrology/western", () => ({ calculateWesternChart: mocks.calculate }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

describe("map route boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveAccount.mockResolvedValue({ id: "owner-id", email: "lu@example.test" });
    mocks.rateLimit.mockResolvedValue(true);
    mocks.sanitize.mockImplementation((input: object) => ({
      ...input,
      quality: { timeKnown: false, normalized: true },
    }));
    mocks.calculate.mockReturnValue({
      mode: "untimed",
      engineVersion: "test-engine",
      configVersion: "test-config",
      inputFingerprint: "a".repeat(64),
      jdUt: 2_440_000,
      planets: [],
      warnings: [],
    });
    mocks.create.mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-426614174000",
      chart: { id: "223e4567-e89b-42d3-a456-426614174000" },
    });
  });

  it("rejects a non-JSON request before resolving an owner", async () => {
    const { POST } = await import("./route");
    const response = await POST(new NextRequest("http://localhost/api/maps", { method: "POST" }));
    expect(response.status).toBe(415);
  });

  it("rejects an oversized payload before reading it", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/maps", {
        method: "POST",
        headers: { "content-type": "application/json", "content-length": "16385" },
        body: "{}",
      }),
    );
    expect(response.status).toBe(413);
  });

  it("persists a valid map directly under an authenticated owner", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/maps", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: "Lu",
          date: "1990-06-10",
          timePrecision: "unknown",
          latitude: -12.97,
          longitude: -38.5,
          timezone: "America/Bahia",
          location: "Salvador, Bahia, Brasil",
          houseSystem: "placidus",
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ guestSessionId: null, userId: "owner-id" }),
      }),
    );
    expect(mocks.resolveGuest).not.toHaveBeenCalled();
  });

  it("persists a guest-owned map and returns its opaque cookie", async () => {
    mocks.resolveAccount.mockResolvedValue(null);
    mocks.resolveGuest.mockResolvedValue({ id: "guest-id", newToken: "opaque" });
    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/maps", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: "Lu",
          date: "1990-06-10",
          timePrecision: "unknown",
          latitude: -12.97,
          longitude: -38.5,
          timezone: "America/Bahia",
          location: "Salvador, Bahia, Brasil",
          houseSystem: "placidus",
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ guestSessionId: "guest-id", userId: null }),
      }),
    );
    expect(response.headers.get("set-cookie")).toContain("astroaxe_guest=opaque");
  });

  it("returns a bounded validation error for invalid birth data", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/maps", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: "" }),
      }),
    );
    expect(response.status).toBe(400);
  });
});
