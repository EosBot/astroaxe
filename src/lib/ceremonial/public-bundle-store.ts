import "server-only";

import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import {
  publicBundleManifestSchema,
  verifyPublicBundle,
  type PublicBundleBuildResult,
  type PublicBundleManifest,
} from "@/domain/ceremonial/public-bundle";

export type PublicMediaVerifier = (
  namespace: string,
  media: ReadonlyArray<{ contentHash: string; byteSize: number; mimeType: string }>,
) => Promise<void>;

function mediaFrom(manifest: PublicBundleManifest) {
  return manifest.records.flatMap((record) =>
    record.media.map(({ contentHash, byteSize, mimeType }) => ({
      contentHash,
      byteSize,
      mimeType,
    })),
  );
}

export async function importInactivePublicBundle(
  prisma: PrismaClient,
  built: PublicBundleBuildResult,
  storageNamespace: string,
  verifyMedia: PublicMediaVerifier,
  now: Date,
): Promise<{ id: string; manifestHash: string }> {
  if (storageNamespace !== `bundle-${built.manifestHash.slice(0, 32)}`)
    throw new Error("Storage namespace does not match manifest hash");
  const manifest = verifyPublicBundle(built.manifest, built.manifestHash, now);
  await verifyMedia(storageNamespace, mediaFrom(manifest));
  return prisma.ceremonialPublicBundle.create({
    data: {
      schemaVersion: manifest.schemaVersion,
      manifestHash: built.manifestHash,
      manifest: manifest as unknown as Prisma.InputJsonValue,
      storageNamespace,
      status: "INACTIVE",
      verifiedAt: now,
    },
    select: { id: true, manifestHash: true },
  });
}

export async function activatePublicBundle(
  prisma: PrismaClient,
  bundleId: string,
  verifyMedia: PublicMediaVerifier,
  now: Date,
): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      const [pointer, bundle] = await Promise.all([
        tx.ceremonialPublicBundlePointer.findUniqueOrThrow({ where: { id: 1 } }),
        tx.ceremonialPublicBundle.findUniqueOrThrow({ where: { id: bundleId } }),
      ]);
      if (pointer.activeBundleId === bundleId) return;
      if (bundle.status !== "INACTIVE") throw new Error("Bundle is not inactive");
      const manifest = verifyPublicBundle(bundle.manifest, bundle.manifestHash, now);
      await verifyMedia(bundle.storageNamespace, mediaFrom(manifest));

      if (pointer.activeBundleId !== null)
        await tx.ceremonialPublicBundle.update({
          where: { id: pointer.activeBundleId },
          data: { status: "RETAINED" },
        });
      await tx.ceremonialPublicBundle.update({
        where: { id: bundleId },
        data: { status: "ACTIVE", activatedAt: now, verifiedAt: now },
      });
      await tx.ceremonialPublicBundlePointer.update({
        where: { id: 1 },
        data: { activeBundleId: bundleId, previousBundleId: pointer.activeBundleId },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

export async function rollbackPublicBundle(
  prisma: PrismaClient,
  verifyMedia: PublicMediaVerifier,
  now: Date,
): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      const pointer = await tx.ceremonialPublicBundlePointer.findUniqueOrThrow({
        where: { id: 1 },
      });
      if (pointer.activeBundleId === null || pointer.previousBundleId === null)
        throw new Error("No retained bundle is available for rollback");
      const previous = await tx.ceremonialPublicBundle.findUniqueOrThrow({
        where: { id: pointer.previousBundleId },
      });
      const manifest = verifyPublicBundle(previous.manifest, previous.manifestHash, now);
      await verifyMedia(previous.storageNamespace, mediaFrom(manifest));
      await tx.ceremonialPublicBundle.update({
        where: { id: pointer.activeBundleId },
        data: { status: "RETAINED" },
      });
      await tx.ceremonialPublicBundle.update({
        where: { id: pointer.previousBundleId },
        data: { status: "ACTIVE", verifiedAt: now },
      });
      await tx.ceremonialPublicBundlePointer.update({
        where: { id: 1 },
        data: {
          activeBundleId: pointer.previousBundleId,
          previousBundleId: pointer.activeBundleId,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

export function parseStoredPublicBundle(value: unknown): PublicBundleManifest {
  return publicBundleManifestSchema.parse(value);
}
