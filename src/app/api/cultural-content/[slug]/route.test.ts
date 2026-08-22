import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findPublished: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ getPrisma: () => ({}) }));
vi.mock("@/lib/cultural-content/public-entry", () => ({
  findPublishedCulturalEntry: mocks.findPublished,
}));

describe("public cultural content route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not reveal draft or missing content", async () => {
    mocks.findPublished.mockResolvedValue(null);
    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/cultural-content/rascunho"), {
      params: Promise.resolve({ slug: "rascunho" }),
    });
    expect(response.status).toBe(404);
  });

  it("rejects malformed content identifiers before querying storage", async () => {
    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/cultural-content/x"), {
      params: Promise.resolve({ slug: "Inválido" }),
    });
    expect(response.status).toBe(400);
    expect(mocks.findPublished).not.toHaveBeenCalled();
  });

  it("returns a sanitized service failure", async () => {
    mocks.findPublished.mockRejectedValue(new Error("database details"));
    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/cultural-content/conteudo"), {
      params: Promise.resolve({ slug: "conteudo" }),
    });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Não foi possível abrir este conteúdo agora." });
  });
});
