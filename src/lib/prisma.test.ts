import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  adapterConstructor: vi.fn<(options: unknown) => void>(),
  clientConstructor: vi.fn<(options: unknown) => void>(),
  disconnect: vi.fn<() => Promise<void>>(),
  parseServerEnv: vi.fn(),
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: class PrismaPgMock {
    constructor(options: unknown) {
      mocks.adapterConstructor(options);
    }
  },
}));

vi.mock("@/generated/prisma/client", () => ({
  PrismaClient: class PrismaClientMock {
    readonly $disconnect = mocks.disconnect;

    constructor(options: unknown) {
      mocks.clientConstructor(options);
    }
  },
}));

vi.mock("./env", () => ({ parseServerEnv: mocks.parseServerEnv }));

const prismaGlobal = globalThis as typeof globalThis & { prisma?: unknown };

describe("Prisma singleton", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete prismaGlobal.prisma;
    mocks.disconnect.mockResolvedValue(undefined);
    mocks.parseServerEnv.mockReturnValue({
      DATABASE_URL: "postgresql://astroaxe:secret@postgres:5432/astroaxe",
      REDIS_URL: "redis://redis:6379/0",
      NODE_ENV: "test",
    });
  });

  it("constructs the adapter lazily and reuses one client", async () => {
    const { getPrisma } = await import("./prisma");

    const first = getPrisma();
    const second = getPrisma();

    expect(first).toBe(second);
    expect(mocks.parseServerEnv).toHaveBeenCalledOnce();
    expect(mocks.adapterConstructor).toHaveBeenCalledWith({
      connectionString: "postgresql://astroaxe:secret@postgres:5432/astroaxe",
    });
    expect(mocks.clientConstructor).toHaveBeenCalledOnce();
    expect(mocks.clientConstructor).toHaveBeenCalledWith({ adapter: expect.any(Object) });
  });

  it("disconnects and permits a fresh client", async () => {
    const { disconnectPrisma, getPrisma } = await import("./prisma");
    const first = getPrisma();

    await disconnectPrisma();
    const second = getPrisma();

    expect(mocks.disconnect).toHaveBeenCalledOnce();
    expect(second).not.toBe(first);
    expect(mocks.clientConstructor).toHaveBeenCalledTimes(2);
  });

  it("does nothing when no client was created", async () => {
    const { disconnectPrisma } = await import("./prisma");

    await expect(disconnectPrisma()).resolves.toBeUndefined();
    expect(mocks.disconnect).not.toHaveBeenCalled();
  });

  it("clears the singleton even when shutdown fails", async () => {
    mocks.disconnect.mockRejectedValueOnce(new Error("disconnect failed"));
    const { disconnectPrisma, getPrisma } = await import("./prisma");
    const first = getPrisma();

    await expect(disconnectPrisma()).rejects.toThrow("disconnect failed");

    expect(getPrisma()).not.toBe(first);
  });

  it("does not create a client when environment validation fails", async () => {
    mocks.parseServerEnv.mockImplementation(() => {
      throw new Error("invalid environment");
    });
    const { getPrisma } = await import("./prisma");

    expect(() => getPrisma()).toThrow("invalid environment");
    expect(mocks.adapterConstructor).not.toHaveBeenCalled();
    expect(mocks.clientConstructor).not.toHaveBeenCalled();
  });
});
