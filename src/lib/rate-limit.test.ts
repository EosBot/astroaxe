import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ evaluate: vi.fn(), getRedis: vi.fn() }));
vi.mock("@/lib/redis", () => ({ getRedis: mocks.getRedis }));

describe("enforceRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRedis.mockReturnValue({ eval: mocks.evaluate });
  });

  it("starts a fixed window and permits values within the limit", async () => {
    mocks.evaluate.mockResolvedValue(1);
    const { enforceRateLimit } = await import("./rate-limit");
    await expect(enforceRateLimit("key", 2, 60)).resolves.toBe(true);
    expect(mocks.evaluate).toHaveBeenCalledWith(expect.stringContaining("EXPIRE"), 1, "key", 60);
  });

  it("rejects over-limit requests without resetting expiry", async () => {
    mocks.evaluate.mockResolvedValue(3);
    const { enforceRateLimit } = await import("./rate-limit");
    await expect(enforceRateLimit("key", 2, 60)).resolves.toBe(false);
  });

  it("fails closed when Redis returns an invalid value", async () => {
    mocks.evaluate.mockResolvedValue("invalid");
    const { enforceRateLimit } = await import("./rate-limit");
    await expect(enforceRateLimit("key", 2, 60)).rejects.toThrow();
  });
});
