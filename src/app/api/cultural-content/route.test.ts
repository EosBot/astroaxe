import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ listPublished: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ getPrisma: () => ({}) }));
vi.mock("@/lib/cultural-content/public-entry", () => ({
  listPublishedCulturalEntries: mocks.listPublished,
}));

describe("public cultural collection route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only the collection supplied by the fail-closed query", async () => {
    mocks.listPublished.mockResolvedValue({ entries: [] });
    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ entries: [] });
  });

  it("sanitizes storage failures", async () => {
    mocks.listPublished.mockRejectedValue(new Error("database details"));
    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Não foi possível abrir o acervo agora." });
  });
});
