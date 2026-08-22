import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  account: vi.fn(),
  findFirst: vi.fn(),
  daily: vi.fn(),
  interpretations: vi.fn(),
}));
vi.mock("@/lib/env", () => ({
  parseServerEnv: () => ({ AUTH_SESSION_SECRET: "a".repeat(32), FINGERPRINT_SECRET: "secret" }),
}));
vi.mock("@/lib/security/account", () => ({ resolveAccount: mocks.account }));
vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({ birthProfile: { findFirst: mocks.findFirst } }),
}));
vi.mock("@/lib/transits/daily", () => ({ dailyTransitSnapshot: mocks.daily }));
vi.mock("@/lib/transits/interpretations", () => ({
  selectPublishedTransitInterpretations: mocks.interpretations,
}));

describe("profile transit route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.account.mockResolvedValue({ id: "owner" });
    mocks.interpretations.mockResolvedValue([]);
  });

  it("filters the natal chart by its owner", async () => {
    mocks.findFirst.mockResolvedValue({
      timezone: "America/Sao_Paulo",
      chart: { inputFingerprint: "a".repeat(64), result: chart() },
    });
    mocks.daily.mockResolvedValue({ kind: "transit_snapshot" });
    const { GET } = await import("./route");
    const response = await GET(new NextRequest(`http://localhost/transits?date=2026-08-19`), {
      params: Promise.resolve({ profileId: "123e4567-e89b-42d3-a456-426614174000" }),
    });
    expect(response.status).toBe(200);
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: "owner" }) }),
    );
  });

  it("does not reveal another account's chart", async () => {
    mocks.findFirst.mockResolvedValue(null);
    const { GET } = await import("./route");
    const response = await GET(new NextRequest(`http://localhost/transits?date=2026-08-19`), {
      params: Promise.resolve({ profileId: "123e4567-e89b-42d3-a456-426614174000" }),
    });
    expect(response.status).toBe(404);
    expect(mocks.daily).not.toHaveBeenCalled();
  });
});

function chart() {
  return {
    mode: "untimed",
    engineVersion: "engine",
    configVersion: "config",
    inputFingerprint: "a".repeat(64),
    jdUt: 2_440_000,
    warnings: [],
    planets: Array.from({ length: 10 }, (_, index) => ({
      id: index === 0 ? "sun" : `body-${index}`,
      longitude: index * 20,
      latitude: 0,
      speed: 1,
      retrograde: false,
      sign: "Aries",
      signDegree: 0,
    })),
  };
}
