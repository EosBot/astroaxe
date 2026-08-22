import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  resolveAccount: vi.fn(),
  deleteMany: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  revisionCreate: vi.fn(),
  transaction: vi.fn(),
  sanitize: vi.fn(),
  calculate: vi.fn(),
  getPrisma: vi.fn(),
}));
vi.mock("@/lib/env", () => ({
  parseServerEnv: () => ({ AUTH_SESSION_SECRET: "a".repeat(32), SITE_URL: "http://localhost" }),
}));
vi.mock("@/lib/prisma", () => ({ getPrisma: mocks.getPrisma }));
vi.mock("@/lib/security/account", () => ({
  isSameOrigin: () => true,
  resolveAccount: mocks.resolveAccount,
}));
vi.mock("@/lib/data-hygiene/birth-data", () => ({ sanitizeBirthData: mocks.sanitize }));
vi.mock("@/domain/astrology/western", () => ({ calculateWesternChart: mocks.calculate }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

describe("profile deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveAccount.mockResolvedValue({ id: "owner-id", email: "lu@example.test" });
    mocks.deleteMany.mockResolvedValue({ count: 1 });
    mocks.sanitize.mockImplementation((input: object) => ({
      ...input,
      quality: { timeKnown: false, normalized: true },
    }));
    mocks.calculate.mockReturnValue(chartResult());
    mocks.findFirst.mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-426614174000",
      chart: {
        id: "223e4567-e89b-42d3-a456-426614174000",
        inputFingerprint: "b".repeat(64),
        engineVersion: "old-engine",
        configVersion: "old-config",
        calculationMode: "untimed",
        result: chartResult(),
      },
    });
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        birthProfile: { findFirst: mocks.findFirst, update: mocks.update },
        natalChartRevision: { create: mocks.revisionCreate },
      }),
    );
    mocks.getPrisma.mockReturnValue({
      birthProfile: { deleteMany: mocks.deleteMany },
      $transaction: mocks.transaction,
    });
  });

  it("deletes only a profile owned by the authenticated user", async () => {
    const { DELETE } = await import("./[profileId]/route");
    const profileId = "123e4567-e89b-42d3-a456-426614174000";
    const response = await DELETE(
      new NextRequest(`http://localhost/api/profiles/${profileId}`, { method: "DELETE" }),
      { params: Promise.resolve({ profileId }) },
    );
    expect(response.status).toBe(204);
    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { id: profileId, userId: "owner-id" } });
  });

  it("does not reveal a profile to another or missing owner", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 0 });
    const { DELETE } = await import("./[profileId]/route");
    const profileId = "123e4567-e89b-42d3-a456-426614174000";
    const response = await DELETE(
      new NextRequest(`http://localhost/api/profiles/${profileId}`, { method: "DELETE" }),
      { params: Promise.resolve({ profileId }) },
    );
    expect(response.status).toBe(404);
  });

  it("archives the previous calculation before updating an owned profile", async () => {
    const { PUT } = await import("./[profileId]/route");
    const profileId = "123e4567-e89b-42d3-a456-426614174000";
    const response = await PUT(
      new NextRequest(`http://localhost/api/profiles/${profileId}`, {
        method: "PUT",
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
      { params: Promise.resolve({ profileId }) },
    );
    expect(response.status).toBe(200);
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: profileId, userId: "owner-id" } }),
    );
    expect(mocks.revisionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reason: "PROFILE_RECALCULATION",
        inputFingerprint: "b".repeat(64),
      }),
    });
    expect(mocks.update).toHaveBeenCalledOnce();
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
      sign: "Gemini",
      signDegree: 5,
    })),
    warnings: [],
  };
}
