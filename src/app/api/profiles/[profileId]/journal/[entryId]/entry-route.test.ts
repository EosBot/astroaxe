import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const profileId = "123e4567-e89b-42d3-a456-426614174000";
const entryId = "223e4567-e89b-42d3-a456-426614174000";
const mocks = vi.hoisted(() => ({ resolveAccount: vi.fn(), deleteMany: vi.fn() }));

vi.mock("@/lib/env", () => ({
  parseServerEnv: () => ({ AUTH_SESSION_SECRET: "a".repeat(32), SITE_URL: "http://localhost" }),
}));
vi.mock("@/lib/security/account", () => ({
  isSameOrigin: () => true,
  resolveAccount: mocks.resolveAccount,
}));
vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({ journalEntry: { deleteMany: mocks.deleteMany } }),
}));

describe("individual journal deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveAccount.mockResolvedValue({ id: "owner-id", email: "owner@example.invalid" });
  });

  it("deletes only an entry belonging to the authenticated profile owner", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 1 });
    const { DELETE } = await import("./route");
    const response = await DELETE(request(), { params: Promise.resolve({ profileId, entryId }) });
    expect(response.status).toBe(204);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { id: entryId, birthProfileId: profileId, birthProfile: { userId: "owner-id" } },
    });
  });

  it("does not reveal a missing or foreign entry", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 0 });
    const { DELETE } = await import("./route");
    const response = await DELETE(request(), { params: Promise.resolve({ profileId, entryId }) });
    expect(response.status).toBe(404);
  });

  it("requires an authenticated session", async () => {
    mocks.resolveAccount.mockResolvedValue(null);
    const { DELETE } = await import("./route");
    const response = await DELETE(request(), { params: Promise.resolve({ profileId, entryId }) });
    expect(response.status).toBe(401);
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });
});

function request(): NextRequest {
  return new NextRequest(`http://localhost/api/profiles/${profileId}/journal/${entryId}`, {
    method: "DELETE",
  });
}
