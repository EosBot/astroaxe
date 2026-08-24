import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ resolveAccount: vi.fn(), findFirst: vi.fn() }));
vi.mock("@/lib/env", () => ({
  parseServerEnv: () => ({
    AUTH_SESSION_SECRET: "session-secret-for-tests-xxxxxxxx",
    FINGERPRINT_SECRET: "fingerprint-secret-for-tests-xxxx",
  }),
}));
vi.mock("@/lib/security/account", () => ({ resolveAccount: mocks.resolveAccount }));
vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({ birthProfile: { findFirst: mocks.findFirst } }),
}));

const profileId = "123e4567-e89b-42d3-a456-426614174000";

describe("authenticated lunar module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveAccount.mockResolvedValue({ id: "owner-id", email: "lua@example.test" });
    mocks.findFirst.mockResolvedValue({
      birthDate: new Date("1990-06-10T00:00:00.000Z"),
      chart: { inputFingerprint: "a".repeat(64), result: natalChart() },
    });
  });

  it("requires an authenticated owner", async () => {
    mocks.resolveAccount.mockResolvedValue(null);
    const { GET } = await import("./route");
    const response = await GET(request(), { params: Promise.resolve({ profileId }) });
    expect(response.status).toBe(401);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("rejects an invalid location boundary", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest(
        `http://localhost/api/profiles/${profileId}/lunar?instant=2026-08-24T12:00:00.000Z&latitude=200&longitude=0&timezone=UTC`,
      ),
      { params: Promise.resolve({ profileId }) },
    );
    expect(response.status).toBe(400);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("returns a validated progression, exact return and lunar transits", async () => {
    const { GET } = await import("./route");
    const response = await GET(request(), { params: Promise.resolve({ profileId }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.dashboard).toMatchObject({
      version: "lunar-dashboard-1.0.0",
      natalMansion: { system: "arabic_tropical_28" },
    });
    expect(body.dashboard.progressed.moonHouse).toEqual(expect.any(Number));
    expect(body.lunarReturn).toMatchObject({ kind: "lunar" });
    expect(
      body.transits.every((aspect: { transitingBody: string }) => aspect.transitingBody === "moon"),
    ).toBe(true);
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: profileId, userId: "owner-id" } }),
    );
  });
});

function request(): NextRequest {
  return new NextRequest(
    `http://localhost/api/profiles/${profileId}/lunar?instant=2026-08-24T12:00:00.000Z&latitude=-23.55&longitude=-46.63&timezone=America%2FSao_Paulo`,
  );
}

function natalChart() {
  return {
    mode: "timed",
    engineVersion: "test-engine",
    configVersion: "test-config",
    inputFingerprint: "a".repeat(64),
    jdUt: 2_448_052,
    planets: Array.from({ length: 10 }, (_, index) => ({
      id: [
        "sun",
        "moon",
        "mercury",
        "venus",
        "mars",
        "jupiter",
        "saturn",
        "uranus",
        "neptune",
        "pluto",
      ][index],
      longitude: index === 0 ? 79 : index === 1 ? 302 : index * 31,
      latitude: 0,
      speed: 1,
      retrograde: false,
      sign: "Gemini",
      signDegree: 5,
    })),
    houses: {
      requestedSystem: "placidus",
      actualSystem: "placidus",
      cusps: Array.from({ length: 12 }, (_, index) => index * 30),
      ascendant: 0,
      midheaven: 270,
    },
    warnings: [],
  };
}
