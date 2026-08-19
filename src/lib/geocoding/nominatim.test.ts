import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), getRedis: vi.fn() }));
vi.mock("@/lib/redis", () => ({ getRedis: mocks.getRedis }));

describe("searchBirthplaces", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    mocks.getRedis.mockReturnValue({ get: mocks.get, set: mocks.set });
    mocks.set.mockResolvedValue("OK");
  });

  it("validates and caches an upstream response", async () => {
    mocks.get.mockResolvedValue(null);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            {
              display_name: "Salvador, Bahia, Brasil",
              lat: "-12.9714",
              lon: "-38.5014",
              type: "city",
            },
          ]),
          { status: 200 },
        ),
      ),
    );
    const { searchBirthplaces } = await import("./nominatim");
    const result = await searchBirthplaces(" Salvador ", "AstroAxe test agent");
    expect(result[0]?.timezone).toBe("America/Bahia");
    expect(mocks.set).toHaveBeenCalledWith("v1:geo:salvador", expect.any(String), "EX", 2_592_000);
  });

  it("returns a validated cache entry without calling upstream", async () => {
    mocks.get.mockResolvedValue(
      JSON.stringify([
        { label: "Recife", latitude: -8.05, longitude: -34.9, timezone: "America/Recife" },
      ]),
    );
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { searchBirthplaces } = await import("./nominatim");
    await expect(searchBirthplaces("Recife", "AstroAxe test agent")).resolves.toHaveLength(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an unsuccessful upstream response", async () => {
    mocks.get.mockResolvedValue(null);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })));
    const { searchBirthplaces } = await import("./nominatim");
    await expect(searchBirthplaces("Recife", "AstroAxe test agent")).rejects.toThrow("503");
  });
});
