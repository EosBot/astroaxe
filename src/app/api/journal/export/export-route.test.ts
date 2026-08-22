import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ resolveAccount: vi.fn(), findMany: vi.fn() }));

vi.mock("@/lib/env", () => ({
  parseServerEnv: () => ({ AUTH_SESSION_SECRET: "a".repeat(32) }),
}));
vi.mock("@/lib/security/account", () => ({ resolveAccount: mocks.resolveAccount }));
vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({ birthProfile: { findMany: mocks.findMany } }),
}));

describe("journal export", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an unauthenticated export", async () => {
    mocks.resolveAccount.mockResolvedValue(null);
    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/journal/export"));
    expect(response.status).toBe(401);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("exports only the authenticated account journal as a no-store attachment", async () => {
    mocks.resolveAccount.mockResolvedValue({ id: "owner-id", email: "owner@example.invalid" });
    mocks.findMany.mockResolvedValue([
      {
        id: "123e4567-e89b-42d3-a456-426614174000",
        displayName: "Perfil sintético",
        journalEntries: [
          {
            id: "223e4567-e89b-42d3-a456-426614174000",
            entryDate: new Date("2026-08-20T00:00:00.000Z"),
            content: "Conteúdo privado sintético.",
            createdAt: new Date("2026-08-20T10:00:00.000Z"),
            updatedAt: new Date("2026-08-20T11:00:00.000Z"),
          },
        ],
      },
    ]);
    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/journal/export"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-disposition")).toContain("astroaxe-diario.json");
    await expect(response.json()).resolves.toMatchObject({
      format: "astroaxe-private-journal",
      version: 1,
      profiles: [{ displayName: "Perfil sintético", entries: [{ date: "2026-08-20" }] }],
    });
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "owner-id" } }),
    );
  });
});
