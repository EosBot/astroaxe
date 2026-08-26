import { describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import {
  buildPublicBundle,
  type PublicBundleSourceRecord,
} from "@/domain/ceremonial/public-bundle";
import {
  activatePublicBundle,
  importInactivePublicBundle,
  rollbackPublicBundle,
} from "@/lib/ceremonial/public-bundle-store";

const NOW = new Date("2026-08-26T20:00:00.000Z");

function source(): PublicBundleSourceRecord {
  const approvals = (["RIGHTS", "EDITORIAL"] as const).map((reviewKind) => ({
    reviewKind,
    decision: "APPROVED" as const,
    facetScope: ["metadata" as const],
    decidedAt: "2026-08-25T12:00:00.000Z",
    expiresAt: "2026-09-25T12:00:00.000Z",
    revokedAt: null,
  }));
  return {
    id: "123e4567-e89b-42d3-a456-426614174000",
    selected: true,
    sourceSystem: "synthetic",
    work: "Synthetic Work",
    edition: "Synthetic Edition",
    locator: "page 1",
    displayName: "Synthetic Entry",
    summary: "Synthetic metadata.",
    rights: "PUBLIC_DOMAIN",
    access: "PUBLIC",
    sensitivity: "GENERAL",
    approvals,
    media: [],
  };
}

describe("public bundle store", () => {
  it("imports only into the content-addressed inactive namespace after verification", async () => {
    const built = buildPublicBundle([source()], NOW);
    const create = vi
      .fn()
      .mockResolvedValue({ id: "bundle-new", manifestHash: built.manifestHash });
    const verifyMedia = vi.fn().mockResolvedValue(undefined);
    const prisma = { ceremonialPublicBundle: { create } } as unknown as PrismaClient;

    await expect(
      importInactivePublicBundle(
        prisma,
        built,
        `bundle-${built.manifestHash.slice(0, 32)}`,
        verifyMedia,
        NOW,
      ),
    ).resolves.toEqual({ id: "bundle-new", manifestHash: built.manifestHash });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "INACTIVE" }) }),
    );
    await expect(
      importInactivePublicBundle(prisma, built, "bundle-wrong", verifyMedia, NOW),
    ).rejects.toThrow("Storage namespace does not match manifest hash");
  });

  it("atomically activates a verified inactive bundle and retains the prior pointer", async () => {
    const built = buildPublicBundle([source()], NOW);
    const update = vi.fn().mockResolvedValue({});
    const pointerUpdate = vi.fn().mockResolvedValue({});
    const tx = {
      ceremonialPublicBundlePointer: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: 1,
          activeBundleId: "bundle-old",
          previousBundleId: null,
        }),
        update: pointerUpdate,
      },
      ceremonialPublicBundle: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "bundle-new",
          status: "INACTIVE",
          manifest: built.manifest,
          manifestHash: built.manifestHash,
          storageNamespace: `bundle-${built.manifestHash.slice(0, 32)}`,
        }),
        update,
      },
    };
    const transaction = vi.fn(async (callback: (client: typeof tx) => Promise<void>) =>
      callback(tx),
    );
    const prisma = { $transaction: transaction } as unknown as PrismaClient;

    await activatePublicBundle(prisma, "bundle-new", vi.fn().mockResolvedValue(undefined), NOW);
    expect(update).toHaveBeenCalledWith({
      where: { id: "bundle-old" },
      data: { status: "RETAINED" },
    });
    expect(pointerUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { activeBundleId: "bundle-new", previousBundleId: "bundle-old" },
    });
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });

  it("rolls the pointer back only after independently re-verifying the retained namespace", async () => {
    const built = buildPublicBundle([source()], NOW);
    const update = vi.fn().mockResolvedValue({});
    const pointerUpdate = vi.fn().mockResolvedValue({});
    const tx = {
      ceremonialPublicBundlePointer: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: 1,
          activeBundleId: "bundle-new",
          previousBundleId: "bundle-old",
        }),
        update: pointerUpdate,
      },
      ceremonialPublicBundle: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "bundle-old",
          status: "RETAINED",
          manifest: built.manifest,
          manifestHash: built.manifestHash,
          storageNamespace: `bundle-${built.manifestHash.slice(0, 32)}`,
        }),
        update,
      },
    };
    const transaction = vi.fn(async (callback: (client: typeof tx) => Promise<void>) =>
      callback(tx),
    );
    const verifyMedia = vi.fn().mockResolvedValue(undefined);

    await rollbackPublicBundle(
      { $transaction: transaction } as unknown as PrismaClient,
      verifyMedia,
      NOW,
    );
    expect(verifyMedia).toHaveBeenCalledOnce();
    expect(pointerUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { activeBundleId: "bundle-old", previousBundleId: "bundle-new" },
    });
  });
});
