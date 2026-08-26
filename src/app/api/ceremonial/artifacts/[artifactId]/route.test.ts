import { Readable } from "node:stream";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const ARTIFACT_ID = "123e4567-e89b-42d3-a456-426614174000";
const mocks = vi.hoisted(() => ({
  policy: vi.fn(),
  resolveAccount: vi.fn(),
  findArtifact: vi.fn(),
  findReviews: vi.fn(),
  openArtifact: vi.fn(),
  close: vi.fn(),
  createReadStream: vi.fn(),
}));

vi.mock("@/lib/ceremonial/mode", () => ({ getCeremonialPolicy: mocks.policy }));
vi.mock("@/lib/env", () => ({
  parseServerEnv: () => ({ AUTH_SESSION_SECRET: "a".repeat(32) }),
}));
vi.mock("@/lib/security/account", () => ({ resolveAccount: mocks.resolveAccount }));
vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    ceremonialArtifact: { findUnique: mocks.findArtifact },
    ceremonialReview: { findMany: mocks.findReviews },
  }),
}));
vi.mock("@/lib/ceremonial/artifact-storage", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/ceremonial/artifact-storage")>();
  return { ...original, openVerifiedArtifact: mocks.openArtifact };
});

function context(artifactId = ARTIFACT_ID) {
  return { params: Promise.resolve({ artifactId }) };
}

describe("local ceremonial artifact route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.policy.mockReturnValue({
      mode: "local",
      servesLocalArchive: true,
      servesPublicLibrary: false,
      local: {
        archiveRoot: "/synthetic/archive",
        keyringFile: "/synthetic/key",
        bind: "127.0.0.1",
      },
    });
    mocks.resolveAccount.mockResolvedValue({ id: "owner", email: "owner@example.invalid" });
    mocks.findArtifact.mockResolvedValue({
      id: ARTIFACT_ID,
      relativePath: "fixtures/source.pdf",
      mimeType: "application/pdf",
      rights: "UNKNOWN",
      access: "LOCAL_ONLY",
      sensitivity: "CULTURALLY_SENSITIVE",
    });
    mocks.findReviews.mockResolvedValue([]);
    mocks.createReadStream.mockReturnValue(Readable.from(Buffer.from("synthetic-pdf")));
    mocks.openArtifact.mockResolvedValue({
      handle: { close: mocks.close, createReadStream: mocks.createReadStream },
      size: 13,
      mimeType: "application/pdf",
    });
  });

  it("denies disabled/public modes before authentication or database access", async () => {
    mocks.policy.mockReturnValue({
      mode: "public",
      servesLocalArchive: false,
      servesPublicLibrary: true,
      local: null,
    });
    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest(`http://localhost/api/ceremonial/artifacts/${ARTIFACT_ID}`),
      context(),
    );

    expect(response.status).toBe(404);
    expect(mocks.resolveAccount).not.toHaveBeenCalled();
    expect(mocks.findArtifact).not.toHaveBeenCalled();
  });

  it("requires an authenticated account before loading metadata", async () => {
    mocks.resolveAccount.mockResolvedValue(null);
    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest(`http://localhost/api/ceremonial/artifacts/${ARTIFACT_ID}`),
      context(),
    );

    expect(response.status).toBe(401);
    expect(mocks.findArtifact).not.toHaveBeenCalled();
  });

  it("streams a verified local artifact with private security headers", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest(`http://localhost/api/ceremonial/artifacts/${ARTIFACT_ID}`),
      context(),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-disposition")).toBe(
      `attachment; filename="artifact-${ARTIFACT_ID}"`,
    );
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(await response.text()).toBe("synthetic-pdf");
    expect(mocks.openArtifact).toHaveBeenCalledWith(
      "/synthetic/archive",
      "fixtures/source.pdf",
      "application/pdf",
    );
  });

  it("supports one bounded byte range and rejects invalid ranges", async () => {
    const { GET } = await import("./route");
    const partial = await GET(
      new NextRequest(`http://localhost/api/ceremonial/artifacts/${ARTIFACT_ID}`, {
        headers: { Range: "bytes=2-5" },
      }),
      context(),
    );
    expect(partial.status).toBe(206);
    expect(partial.headers.get("content-range")).toBe("bytes 2-5/13");
    expect(partial.headers.get("content-length")).toBe("4");

    const rejected = await GET(
      new NextRequest(`http://localhost/api/ceremonial/artifacts/${ARTIFACT_ID}`, {
        headers: { Range: "bytes=20-30" },
      }),
      context(),
    );
    expect(rejected.status).toBe(416);
    expect(rejected.headers.get("content-range")).toBe("bytes */13");
    expect(mocks.close).toHaveBeenCalled();
  });

  it("does not reveal stored paths when verification fails", async () => {
    mocks.openArtifact.mockRejectedValue(new Error("synthetic failure"));
    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest(`http://localhost/api/ceremonial/artifacts/${ARTIFACT_ID}`),
      context(),
    );

    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain("fixtures/source.pdf");
  });
});
