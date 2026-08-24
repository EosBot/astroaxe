import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ resolveAccount: vi.fn(), findMany: vi.fn() }));
const accountSessionFixture = process.env.ASTROAXE_TEST_ACCOUNT_SESSION ?? fixtureValue();
vi.mock("@/lib/env", () => ({
  parseServerEnv: () => ({ AUTH_SESSION_SECRET: accountSessionFixture }),
}));
vi.mock("@/lib/security/account", () => ({ resolveAccount: mocks.resolveAccount }));
vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({ birthProfile: { findMany: mocks.findMany } }),
}));

describe("profile listing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveAccount.mockResolvedValue({ id: "owner-id", email: "lu@example.test" });
    mocks.findMany.mockResolvedValue([
      {
        id: "123e4567-e89b-42d3-a456-426614174000",
        displayName: "Lu",
        birthDate: new Date("1990-06-10T00:00:00.000Z"),
        birthTime: null,
        timePrecision: "UNKNOWN",
        latitude: -12.97,
        longitude: -38.5,
        timezone: "America/Bahia",
        location: "Salvador, Bahia, Brasil",
        createdAt: new Date(),
        chart: { updatedAt: new Date("2026-08-19T12:00:00.000Z"), result: chartResult() },
      },
    ]);
  });

  it("lists only the authenticated owner's validated profiles", async () => {
    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/profiles"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.profiles[0]).toMatchObject({
      displayName: "Lu",
      date: "1990-06-10",
      timePrecision: "unknown",
      chart: { sunSign: "Gemini", moonSign: "Cancer", natal: chartResult() },
    });
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "owner-id" } }),
    );
  });

  it("requires an account", async () => {
    mocks.resolveAccount.mockResolvedValue(null);
    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/profiles"));
    expect(response.status).toBe(401);
  });
});

function chartResult() {
  return {
    mode: "untimed",
    engineVersion: "test-engine",
    configVersion: "test-config",
    inputFingerprint: "a".repeat(64),
    jdUt: 2_440_000,
    planets: Array.from({ length: 10 }, (_, index) => ({
      id: index === 0 ? "sun" : index === 1 ? "moon" : `planet-${index}`,
      longitude: index * 20,
      latitude: 0,
      speed: 1,
      retrograde: false,
      sign: index === 1 ? "Cancer" : "Gemini",
      signDegree: 5,
    })),
    warnings: [],
  };
}

function fixtureValue(): string {
  return "test-only-value".padEnd(40, "x");
}
