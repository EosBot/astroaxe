import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  resolveAccount: vi.fn(),
  findFirst: vi.fn(),
  getPrisma: vi.fn(),
}));

vi.mock("@/lib/env", () => ({ parseServerEnv: () => ({ AUTH_SESSION_SECRET: "a".repeat(32) }) }));
vi.mock("@/lib/prisma", () => ({ getPrisma: mocks.getPrisma }));
vi.mock("@/lib/security/account", () => ({ resolveAccount: mocks.resolveAccount }));

describe("protected regency result", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveAccount.mockResolvedValue({ id: "owner-id" });
    mocks.findFirst.mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-426614174000",
      birthDate: new Date("1990-06-10T00:00:00.000Z"),
      chart: { result: chartResult() },
    });
    mocks.getPrisma.mockReturnValue({ birthProfile: { findFirst: mocks.findFirst } });
  });

  it("returns only the public projection for an owned profile", async () => {
    const { GET } = await import("./route");
    const profileId = "123e4567-e89b-42d3-a456-426614174000";
    const response = await GET(
      new NextRequest(`http://localhost/api/profiles/${profileId}/regency`),
      {
        params: Promise.resolve({ profileId }),
      },
    );
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: profileId, userId: "owner-id" } }),
    );
    expect(JSON.stringify(body)).not.toMatch(/claimId|ruleId|weight|matrixVersion|contribution/);
    expect(body).toMatchObject({ methodVersion: "AstroAxe Regências 2.0 — pesquisa aplicada" });
  });

  it("does not calculate without an authenticated owner", async () => {
    mocks.resolveAccount.mockResolvedValue(null);
    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest("http://localhost/api/profiles/123e4567-e89b-42d3-a456-426614174000/regency"),
      { params: Promise.resolve({ profileId: "123e4567-e89b-42d3-a456-426614174000" }) },
    );
    expect(response.status).toBe(401);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });
});

function chartResult() {
  const ids = [
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
  ];
  return {
    mode: "untimed",
    engineVersion: "test-engine",
    configVersion: "test-config",
    inputFingerprint: "a".repeat(64),
    jdUt: 2_440_000,
    planets: ids.map((id, index) => ({
      id,
      longitude: index * 30,
      latitude: 0,
      speed: 1,
      retrograde: false,
      sign: "Aries",
      signDegree: 0,
    })),
    warnings: [],
  };
}
