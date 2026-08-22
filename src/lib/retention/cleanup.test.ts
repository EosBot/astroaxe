import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  guestDelete: vi.fn(),
  accountDelete: vi.fn(),
  transaction: vi.fn(),
  getPrisma: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ getPrisma: mocks.getPrisma }));

describe("session retention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.guestDelete.mockReturnValue(Promise.resolve({ count: 2 }));
    mocks.accountDelete.mockReturnValue(Promise.resolve({ count: 3 }));
    mocks.transaction.mockResolvedValue([{ count: 2 }, { count: 3 }]);
    mocks.getPrisma.mockReturnValue({
      guestSession: { deleteMany: mocks.guestDelete },
      accountSession: { deleteMany: mocks.accountDelete },
      $transaction: mocks.transaction,
    });
  });

  it("deletes guest and account sessions at an injected cutoff", async () => {
    const now = new Date("2026-08-19T12:00:00.000Z");
    const { deleteExpiredSessions } = await import("./cleanup");
    await expect(deleteExpiredSessions(now)).resolves.toEqual({
      guestSessions: 2,
      accountSessions: 3,
    });
    expect(mocks.guestDelete).toHaveBeenCalledWith({ where: { expiresAt: { lte: now } } });
    expect(mocks.accountDelete).toHaveBeenCalledWith({ where: { expiresAt: { lte: now } } });
  });
});
