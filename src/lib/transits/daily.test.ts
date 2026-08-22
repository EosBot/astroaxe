import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), calculate: vi.fn() }));
vi.mock("@/lib/redis", () => ({ getRedis: () => ({ get: mocks.get, set: mocks.set }) }));
vi.mock("@/domain/astrology/transits", () => ({
  TRANSIT_CONFIG_VERSION: "transits-test",
  calculateTransitSnapshot: mocks.calculate,
}));

describe("daily transit cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.calculate.mockReturnValue(snapshot());
  });

  it("returns a validated cached snapshot", async () => {
    mocks.get.mockResolvedValue(JSON.stringify(snapshot()));
    const { dailyTransitSnapshot } = await import("./daily");
    await expect(dailyTransitSnapshot(input())).resolves.toEqual(snapshot());
    expect(mocks.calculate).not.toHaveBeenCalled();
  });

  it("turns corrupt cache data into a miss and overwrites it", async () => {
    mocks.get.mockResolvedValue("not-json");
    const { dailyTransitSnapshot } = await import("./daily");
    await dailyTransitSnapshot(input());
    expect(mocks.calculate).toHaveBeenCalledWith(
      expect.objectContaining({ instant: "2026-08-19T15:00:00Z" }),
    );
    expect(mocks.set).toHaveBeenCalledWith(
      expect.stringContaining("v1:transit:transits-test:"),
      expect.any(String),
      "EX",
      259200,
    );
  });
});

function input() {
  return {
    date: "2026-08-19",
    timezone: "America/Sao_Paulo",
    natalInputFingerprint: "a".repeat(64),
    natalPlanets: [],
    fingerprintSecret: "secret",
  };
}

function snapshot() {
  return {
    kind: "transit_snapshot",
    instant: "2026-08-19T15:00:00Z",
    engineVersion: "engine-test",
    configVersion: "transits-test",
    natalInputFingerprint: "a".repeat(64),
    snapshotFingerprint: "b".repeat(64),
    aspects: [],
    windows: [],
  };
}
