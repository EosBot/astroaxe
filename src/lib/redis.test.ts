import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructor: vi.fn<(...arguments_: unknown[]) => void>(),
  disconnect: vi.fn<(reconnect?: boolean) => void>(),
  parseServerEnv: vi.fn(),
}));

vi.mock("ioredis", () => ({
  default: class RedisMock {
    readonly status = "wait";
    readonly disconnect = mocks.disconnect;

    constructor(...arguments_: unknown[]) {
      mocks.constructor(...arguments_);
    }
  },
}));

vi.mock("./env", () => ({ parseServerEnv: mocks.parseServerEnv }));

function hasRetryStrategy(value: unknown): value is { retryStrategy(attempt: number): number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "retryStrategy" in value &&
    typeof value.retryStrategy === "function"
  );
}

describe("Redis singleton", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.parseServerEnv.mockReturnValue({
      DATABASE_URL: "postgresql://postgres:5432/astroaxe",
      REDIS_URL: "redis://:secret@redis:6379/0",
      NODE_ENV: "test",
    });
  });

  it("constructs a lazy client once with bounded retries", async () => {
    const { getRedis } = await import("./redis");

    const first = getRedis();
    const second = getRedis();

    expect(first).toBe(second);
    expect(mocks.parseServerEnv).toHaveBeenCalledOnce();
    expect(mocks.constructor).toHaveBeenCalledOnce();
    expect(mocks.constructor).toHaveBeenCalledWith(
      "redis://:secret@redis:6379/0",
      expect.objectContaining({
        lazyConnect: true,
        enableReadyCheck: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 3_000,
        commandTimeout: 3_000,
      }),
    );

    const options = mocks.constructor.mock.calls[0]?.[1];
    expect(hasRetryStrategy(options)).toBe(true);
    if (!hasRetryStrategy(options)) throw new Error("retryStrategy was not configured");
    expect(options.retryStrategy(1)).toBe(100);
    expect(options.retryStrategy(50)).toBe(1_000);
  });

  it("disconnects without reconnecting and permits a fresh client", async () => {
    const { disconnectRedis, getRedis } = await import("./redis");
    const first = getRedis();

    await disconnectRedis();
    const second = getRedis();

    expect(mocks.disconnect).toHaveBeenCalledWith(false);
    expect(second).not.toBe(first);
    expect(mocks.constructor).toHaveBeenCalledTimes(2);
  });

  it("does nothing when no client was created", async () => {
    const { disconnectRedis } = await import("./redis");

    await expect(disconnectRedis()).resolves.toBeUndefined();
    expect(mocks.disconnect).not.toHaveBeenCalled();
  });

  it("clears the singleton even when shutdown fails", async () => {
    mocks.disconnect.mockImplementationOnce(() => {
      throw new Error("disconnect failed");
    });
    const { disconnectRedis, getRedis } = await import("./redis");
    const first = getRedis();

    await expect(disconnectRedis()).rejects.toThrow("disconnect failed");

    expect(getRedis()).not.toBe(first);
  });

  it("does not construct Redis when environment validation fails", async () => {
    mocks.parseServerEnv.mockImplementation(() => {
      throw new Error("invalid environment");
    });
    const { getRedis } = await import("./redis");

    expect(() => getRedis()).toThrow("invalid environment");
    expect(mocks.constructor).not.toHaveBeenCalled();
  });
});
