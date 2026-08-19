import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getPrisma } from "./prisma";
import { getRedis } from "./redis";

vi.mock("./prisma", () => ({ getPrisma: vi.fn() }));
vi.mock("./redis", () => ({ getRedis: vi.fn() }));
vi.mock("@/generated/prisma/client", () => ({
  Prisma: { sql: (strings: TemplateStringsArray) => strings.join("") },
}));

const queryRaw = vi.fn<() => Promise<unknown>>();
const connect = vi.fn<() => Promise<void>>();
const ping = vi.fn<() => Promise<string>>();

function useDatabaseMock(): void {
  vi.mocked(getPrisma).mockReturnValue({
    $queryRaw: queryRaw,
  } as unknown as ReturnType<typeof getPrisma>);
}

function useRedisMock(status: "wait" | "ready" = "ready"): void {
  vi.mocked(getRedis).mockReturnValue({
    status,
    connect,
    ping,
  } as unknown as ReturnType<typeof getRedis>);
}

describe("checkReadiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryRaw.mockResolvedValue([{ value: 1 }]);
    connect.mockResolvedValue(undefined);
    ping.mockResolvedValue("PONG");
    useDatabaseMock();
    useRedisMock();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports ready after checking both dependencies in parallel", async () => {
    useRedisMock("wait");
    const { checkReadiness } = await import("./health");

    await expect(checkReadiness()).resolves.toEqual({
      ready: true,
      checks: { database: "up", redis: "up" },
    });
    expect(queryRaw).toHaveBeenCalledOnce();
    expect(connect).toHaveBeenCalledOnce();
    expect(ping).toHaveBeenCalledOnce();
  });

  it("reports independent dependency failures", async () => {
    queryRaw.mockRejectedValue(new Error("database unavailable"));
    ping.mockResolvedValue("NOT_READY");
    const { checkReadiness } = await import("./health");

    await expect(checkReadiness()).resolves.toEqual({
      ready: false,
      checks: { database: "down", redis: "down" },
    });
    expect(connect).not.toHaveBeenCalled();
  });

  it("bounds dependency checks with a timeout", async () => {
    vi.useFakeTimers();
    queryRaw.mockReturnValue(new Promise(() => undefined));
    connect.mockReturnValue(new Promise(() => undefined));
    useRedisMock("wait");
    const { checkReadiness } = await import("./health");

    const result = checkReadiness();
    await vi.advanceTimersByTimeAsync(2_500);

    await expect(result).resolves.toEqual({
      ready: false,
      checks: { database: "down", redis: "down" },
    });
    expect(ping).not.toHaveBeenCalled();
  });

  it("contains Redis client construction errors", async () => {
    vi.mocked(getRedis).mockImplementation(() => {
      throw new Error("invalid Redis configuration");
    });
    const { checkReadiness } = await import("./health");

    await expect(checkReadiness()).resolves.toEqual({
      ready: false,
      checks: { database: "up", redis: "down" },
    });
  });
});
