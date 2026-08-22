import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const profileId = "123e4567-e89b-42d3-a456-426614174000";
const entryId = "223e4567-e89b-42d3-a456-426614174000";
const now = new Date("2026-08-20T12:00:00.000Z");
const mocks = vi.hoisted(() => ({
  resolveAccount: vi.fn(),
  profileFindFirst: vi.fn(),
  entryFindMany: vi.fn(),
  entryFindUnique: vi.fn(),
  entryCreate: vi.fn(),
  entryUpdate: vi.fn(),
  entryDeleteMany: vi.fn(),
  revisionCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  parseServerEnv: () => ({ AUTH_SESSION_SECRET: "a".repeat(32), SITE_URL: "http://localhost" }),
}));
vi.mock("@/lib/security/account", () => ({
  isSameOrigin: () => true,
  resolveAccount: mocks.resolveAccount,
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    birthProfile: { findFirst: mocks.profileFindFirst },
    journalEntry: {
      findMany: mocks.entryFindMany,
      deleteMany: mocks.entryDeleteMany,
    },
    $transaction: mocks.transaction,
  }),
}));

describe("private journal route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveAccount.mockResolvedValue({ id: "owner-id", email: "owner@example.invalid" });
    mocks.profileFindFirst.mockResolvedValue({ id: profileId });
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        journalEntry: {
          findUnique: mocks.entryFindUnique,
          create: mocks.entryCreate,
          update: mocks.entryUpdate,
        },
        journalEntryRevision: { create: mocks.revisionCreate },
      }),
    );
  });

  it("creates one private entry for an owned profile", async () => {
    mocks.entryFindUnique.mockResolvedValue(null);
    mocks.entryCreate.mockResolvedValue(entry("texto privado"));
    const { PUT } = await import("./route");
    const response = await PUT(request("PUT", { date: "2026-08-20", content: " texto privado " }), {
      params: Promise.resolve({ profileId }),
    });
    expect(response.status).toBe(200);
    expect(mocks.entryCreate).toHaveBeenCalledWith({
      data: {
        birthProfileId: profileId,
        entryDate: new Date("2026-08-20T00:00:00.000Z"),
        content: "texto privado",
      },
    });
  });

  it("lists entries only after confirming profile ownership", async () => {
    mocks.entryFindMany.mockResolvedValue([entry("texto listado")]);
    const { GET } = await import("./route");
    const response = await GET(request("GET"), { params: Promise.resolve({ profileId }) });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      entries: [{ profileId, date: "2026-08-20", content: "texto listado" }],
    });
    expect(mocks.entryFindMany).toHaveBeenCalledWith({
      where: { birthProfileId: profileId, birthProfile: { userId: "owner-id" } },
      orderBy: { entryDate: "desc" },
    });
  });

  it("versions the previous text before updating the same day", async () => {
    mocks.entryFindUnique.mockResolvedValue(entry("antes"));
    mocks.entryUpdate.mockResolvedValue(entry("depois"));
    const { PUT } = await import("./route");
    const response = await PUT(request("PUT", { date: "2026-08-20", content: "depois" }), {
      params: Promise.resolve({ profileId }),
    });
    expect(response.status).toBe(200);
    expect(mocks.revisionCreate).toHaveBeenCalledWith({
      data: { journalEntryId: entryId, content: "antes" },
    });
    expect(mocks.entryUpdate).toHaveBeenCalledWith({
      where: { id: entryId },
      data: { content: "depois" },
    });
  });

  it("keeps an identical daily update idempotent", async () => {
    mocks.entryFindUnique.mockResolvedValue(entry("sem alteração"));
    const { PUT } = await import("./route");
    const response = await PUT(request("PUT", { date: "2026-08-20", content: "sem alteração" }), {
      params: Promise.resolve({ profileId }),
    });
    expect(response.status).toBe(200);
    expect(mocks.revisionCreate).not.toHaveBeenCalled();
    expect(mocks.entryUpdate).not.toHaveBeenCalled();
  });

  it("rejects an empty reflection before opening a transaction", async () => {
    const { PUT } = await import("./route");
    const response = await PUT(request("PUT", { date: "2026-08-20", content: "   " }), {
      params: Promise.resolve({ profileId }),
    });
    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("does not reveal a profile owned by another account", async () => {
    mocks.profileFindFirst.mockResolvedValue(null);
    const { GET } = await import("./route");
    const response = await GET(request("GET"), { params: Promise.resolve({ profileId }) });
    expect(response.status).toBe(404);
    expect(mocks.entryFindMany).not.toHaveBeenCalled();
  });

  it("deletes the complete journal for the selected owned profile", async () => {
    mocks.entryDeleteMany.mockResolvedValue({ count: 3 });
    const { DELETE } = await import("./route");
    const response = await DELETE(request("DELETE"), { params: Promise.resolve({ profileId }) });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ deleted: 3 });
    expect(mocks.entryDeleteMany).toHaveBeenCalledWith({
      where: { birthProfileId: profileId, birthProfile: { userId: "owner-id" } },
    });
  });
});

function request(method: string, body?: object): NextRequest {
  const url = `http://localhost/api/profiles/${profileId}/journal`;
  if (body === undefined) return new NextRequest(url, { method });
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function entry(content: string) {
  return {
    id: entryId,
    birthProfileId: profileId,
    entryDate: new Date("2026-08-20T00:00:00.000Z"),
    content,
    createdAt: now,
    updatedAt: now,
  };
}
