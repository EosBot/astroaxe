import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actor: vi.fn(),
  createEntry: vi.fn(),
  createSource: vi.fn(),
  submit: vi.fn(),
  review: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  parseServerEnv: () => ({ SITE_URL: "http://localhost", AUTH_SESSION_SECRET: "a".repeat(32) }),
}));
vi.mock("@/lib/security/account", () => ({ isSameOrigin: () => true }));
vi.mock("@/lib/editorial/request-actor", () => ({ editorialActorForRequest: mocks.actor }));
vi.mock("@/lib/editorial/workflow", () => ({
  submitCulturalEntry: mocks.submit,
  reviewCulturalEntry: mocks.review,
}));
vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    culturalEntry: { create: mocks.createEntry },
    culturalSource: { create: mocks.createSource },
  }),
}));

const author = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  userId: "123e4567-e89b-42d3-a456-426614174001",
  role: "AUTHOR",
};
const entryId = "123e4567-e89b-42d3-a456-426614174004";

describe("editorial routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.actor.mockResolvedValue(author);
  });

  it("creates a sourced draft for an author", async () => {
    mocks.createEntry.mockResolvedValue({ id: entryId, status: "DRAFT" });
    const { POST } = await import("./entries/route");
    const response = await POST(jsonRequest("http://localhost/api/editorial/entries", draft()));
    expect(response.status).toBe(201);
    expect(mocks.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ authorId: author.id }) }),
    );
  });

  it("blocks a reviewer from authoring", async () => {
    mocks.actor.mockResolvedValue({ ...author, role: "REVIEWER" });
    const { POST } = await import("./entries/route");
    const response = await POST(jsonRequest("http://localhost/api/editorial/entries", draft()));
    expect(response.status).toBe(403);
    expect(mocks.createEntry).not.toHaveBeenCalled();
  });

  it("requires JSON and an editorial identity to create entries", async () => {
    const { POST } = await import("./entries/route");
    const wrongType = await POST(
      new NextRequest("http://localhost/api/editorial/entries", { method: "POST" }),
    );
    expect(wrongType.status).toBe(415);
    mocks.actor.mockResolvedValue(null);
    const unaffiliated = await POST(jsonRequest("http://localhost/api/editorial/entries", draft()));
    expect(unaffiliated.status).toBe(403);
  });

  it("rejects an invalid draft at the boundary", async () => {
    const { POST } = await import("./entries/route");
    const response = await POST(jsonRequest("http://localhost/api/editorial/entries", {}));
    expect(response.status).toBe(400);
  });

  it("registers a source with an explicit license note", async () => {
    mocks.createSource.mockResolvedValue({ id: entryId, sourceKey: "fonte-publica" });
    const { POST } = await import("./sources/route");
    const response = await POST(
      jsonRequest("http://localhost/api/editorial/sources", {
        sourceKey: "fonte-publica",
        title: "Fonte pública",
        url: "https://example.test/fonte",
        evidenceKind: "community-primary",
        licenseNote: "Síntese autorizada com atribuição.",
        accessedAt: "2026-08-19",
      }),
    );
    expect(response.status).toBe(201);
    expect(mocks.createSource).toHaveBeenCalledOnce();
  });

  it("validates source metadata and editorial access", async () => {
    const { POST } = await import("./sources/route");
    const wrongType = await POST(
      new NextRequest("http://localhost/api/editorial/sources", { method: "POST" }),
    );
    expect(wrongType.status).toBe(415);
    const invalid = await POST(jsonRequest("http://localhost/api/editorial/sources", {}));
    expect(invalid.status).toBe(400);
    mocks.actor.mockResolvedValue(null);
    const forbidden = await POST(
      jsonRequest("http://localhost/api/editorial/sources", { sourceKey: "fonte" }),
    );
    expect(forbidden.status).toBe(403);
  });

  it("submits a valid owned draft", async () => {
    mocks.submit.mockResolvedValue({ status: "updated", entryStatus: "IN_REVIEW" });
    const { POST } = await import("./entries/[entryId]/submit/route");
    const response = await POST(new NextRequest("http://localhost/submit", { method: "POST" }), {
      params: Promise.resolve({ entryId }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "updated", entryStatus: "IN_REVIEW" });
  });

  it("rejects an invalid entry identifier before submission", async () => {
    const { POST } = await import("./entries/[entryId]/submit/route");
    const response = await POST(new NextRequest("http://localhost/submit", { method: "POST" }), {
      params: Promise.resolve({ entryId: "invalid" }),
    });
    expect(response.status).toBe(400);
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("requires an editorial identity to submit", async () => {
    mocks.actor.mockResolvedValue(null);
    const { POST } = await import("./entries/[entryId]/submit/route");
    const response = await POST(new NextRequest("http://localhost/submit", { method: "POST" }), {
      params: Promise.resolve({ entryId }),
    });
    expect(response.status).toBe(403);
  });

  it("validates a review before running its transition", async () => {
    const { POST } = await import("./entries/[entryId]/review/route");
    const response = await POST(
      jsonRequest("http://localhost/review", { decision: "CHANGES_REQUESTED" }),
      { params: Promise.resolve({ entryId }) },
    );
    expect(response.status).toBe(400);
    expect(mocks.review).not.toHaveBeenCalled();
  });

  it("applies a valid independent review", async () => {
    mocks.actor.mockResolvedValue({ ...author, id: entryId, role: "REVIEWER" });
    mocks.review.mockResolvedValue({ status: "updated", entryStatus: "PUBLISHED" });
    const { POST } = await import("./entries/[entryId]/review/route");
    const response = await POST(jsonRequest("http://localhost/review", { decision: "APPROVED" }), {
      params: Promise.resolve({ entryId }),
    });
    expect(response.status).toBe(200);
    expect(mocks.review).toHaveBeenCalledOnce();
  });

  it("requires JSON for editorial reviews", async () => {
    const { POST } = await import("./entries/[entryId]/review/route");
    const response = await POST(new NextRequest("http://localhost/review", { method: "POST" }), {
      params: Promise.resolve({ entryId }),
    });
    expect(response.status).toBe(415);
  });
});

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify(body),
  });
}

function draft() {
  return {
    slug: "figura-simbolica",
    displayName: "Figura simbólica",
    category: "orisa",
    traditionId: "CandombleKetuNago",
    summary: "Leitura editorial situada.",
    editorialBody: "Narrativa pública com contexto.",
    version: "knowledge-1",
    claims: [
      {
        sourceId: "123e4567-e89b-42d3-a456-426614174005",
        claimKey: "claim-1",
        predicate: "contextualiza",
        objectSummary: "Associação situada pela fonte.",
      },
    ],
  };
}
