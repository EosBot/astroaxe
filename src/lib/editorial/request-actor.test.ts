import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ resolveAccount: vi.fn(), resolveActor: vi.fn() }));
vi.mock("@/lib/env", () => ({ parseServerEnv: () => ({ AUTH_SESSION_SECRET: "a".repeat(32) }) }));
vi.mock("@/lib/prisma", () => ({ getPrisma: () => ({}) }));
vi.mock("@/lib/security/account", () => ({ resolveAccount: mocks.resolveAccount }));
vi.mock("@/lib/editorial/authorization", () => ({ resolveEditorialActor: mocks.resolveActor }));

describe("editorial request actor", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a request without an account", async () => {
    mocks.resolveAccount.mockResolvedValue(null);
    const { editorialActorForRequest } = await import("@/lib/editorial/request-actor");
    await expect(
      editorialActorForRequest(new NextRequest("http://localhost/editorial")),
    ).resolves.toBeNull();
    expect(mocks.resolveActor).not.toHaveBeenCalled();
  });

  it("resolves the contributor linked to the account", async () => {
    mocks.resolveAccount.mockResolvedValue({ id: "user-id" });
    mocks.resolveActor.mockResolvedValue({ id: "actor-id", userId: "user-id", role: "AUTHOR" });
    const { editorialActorForRequest } = await import("@/lib/editorial/request-actor");
    await expect(
      editorialActorForRequest(new NextRequest("http://localhost/editorial")),
    ).resolves.toMatchObject({ role: "AUTHOR" });
  });
});
