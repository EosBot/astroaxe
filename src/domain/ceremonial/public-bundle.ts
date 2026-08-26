import { createHash } from "node:crypto";

import { z } from "zod";

import { evaluateCeremonialAccess } from "@/domain/ceremonial/access-policy";
import {
  ceremonialAccessSchema,
  ceremonialRightsSchema,
  ceremonialSensitivitySchema,
} from "@/domain/ceremonial/contracts";

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const approvalSchema = z
  .object({
    reviewKind: z.enum(["RIGHTS", "EDITORIAL"]),
    decision: z.enum(["APPROVED", "CHANGES_REQUESTED", "REVOKED"]),
    facetScope: z.array(
      z.enum(["metadata", "quotation", "fullText", "image", "seal", "mediaDownload", "export"]),
    ),
    decidedAt: z.iso.datetime({ offset: true }),
    expiresAt: z.iso.datetime({ offset: true }).nullable(),
    revokedAt: z.iso.datetime({ offset: true }).nullable(),
  })
  .strict();

const sourceMediaSchema = z
  .object({
    id: z.uuid(),
    kind: z.enum(["IMAGE", "SEAL", "DOCUMENT"]),
    contentHash: sha256Schema,
    mimeType: z.string().min(1).max(160),
    byteSize: z.number().int().positive().safe(),
    rights: ceremonialRightsSchema,
    access: ceremonialAccessSchema,
    sensitivity: ceremonialSensitivitySchema,
    approvals: z.array(approvalSchema),
  })
  .strict();

export const publicBundleSourceRecordSchema = z
  .object({
    id: z.uuid(),
    selected: z.boolean(),
    sourceSystem: z.string().min(1).max(100),
    work: z.string().min(1).max(300),
    edition: z.string().min(1).max(200),
    locator: z.string().min(1).max(160),
    displayName: z.string().min(1).max(200),
    summary: z.string().min(1).max(2000),
    quotation: z.string().min(1).max(2000).optional(),
    fullText: z.string().min(1).optional(),
    rights: ceremonialRightsSchema,
    access: ceremonialAccessSchema,
    sensitivity: ceremonialSensitivitySchema,
    approvals: z.array(approvalSchema),
    media: z.array(sourceMediaSchema),
  })
  .strict();
export type PublicBundleSourceRecord = z.infer<typeof publicBundleSourceRecordSchema>;

const publishedMediaSchema = sourceMediaSchema.pick({
  id: true,
  kind: true,
  contentHash: true,
  mimeType: true,
  byteSize: true,
  rights: true,
  access: true,
  sensitivity: true,
  approvals: true,
});

const publishedRecordSchema = z
  .object({
    id: z.uuid(),
    sourceSystem: z.string(),
    work: z.string(),
    edition: z.string(),
    locator: z.string(),
    displayName: z.string(),
    summary: z.string(),
    rights: ceremonialRightsSchema,
    access: ceremonialAccessSchema,
    sensitivity: ceremonialSensitivitySchema,
    quotation: z.string().optional(),
    fullText: z.string().optional(),
    media: z.array(publishedMediaSchema),
    approvals: z.array(approvalSchema),
  })
  .strict();

export const publicBundleManifestSchema = z
  .object({
    format: z.literal("astroaxe-ceremonial-public-bundle"),
    schemaVersion: z.literal(1),
    generatedAt: z.iso.datetime({ offset: true }),
    records: z.array(publishedRecordSchema),
  })
  .strict();
export type PublicBundleManifest = z.infer<typeof publicBundleManifestSchema>;

export interface PublicBundleBuildResult {
  readonly manifest: PublicBundleManifest;
  readonly canonicalJson: string;
  readonly manifestHash: string;
  readonly excluded: readonly { readonly id: string; readonly reason: string }[];
}

export class ExplicitPublicationIneligibleError extends Error {
  constructor(readonly recordIds: readonly string[]) {
    super("Explicitly selected publication is ineligible");
    this.name = "ExplicitPublicationIneligibleError";
  }
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  return value;
}

function policyInput(record: PublicBundleSourceRecord, now: Date) {
  return {
    mode: "public",
    authenticated: false,
    rights: record.rights,
    access: record.access,
    sensitivity: record.sensitivity,
    reviews: record.approvals.map((review) => ({
      ...review,
      decidedAt: new Date(review.decidedAt),
      expiresAt: review.expiresAt === null ? null : new Date(review.expiresAt),
      revokedAt: review.revokedAt === null ? null : new Date(review.revokedAt),
    })),
    safety: { derivedGuidanceAllowed: true },
    now,
  };
}

function activeApprovals(approvals: PublicBundleSourceRecord["approvals"], now: Date) {
  return approvals
    .filter(
      (approval) =>
        approval.decision === "APPROVED" &&
        approval.revokedAt === null &&
        new Date(approval.decidedAt) <= now &&
        (approval.expiresAt === null || new Date(approval.expiresAt) > now),
    )
    .sort((left, right) =>
      `${left.reviewKind}:${left.decidedAt}`.localeCompare(
        `${right.reviewKind}:${right.decidedAt}`,
      ),
    );
}

export function buildPublicBundle(rawRecords: unknown, generatedAt: Date): PublicBundleBuildResult {
  const records = z.array(publicBundleSourceRecordSchema).parse(rawRecords);
  const excluded: Array<{ id: string; reason: string }> = [];
  const ineligibleSelected: string[] = [];
  const published = records
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .flatMap((record) => {
      const capabilities = evaluateCeremonialAccess(policyInput(record, generatedAt));
      if (!record.selected) {
        excluded.push({ id: record.id, reason: "not_selected" });
        return [];
      }
      if (capabilities.metadata.decision === "deny") {
        excluded.push({ id: record.id, reason: capabilities.metadata.reason });
        ineligibleSelected.push(record.id);
        return [];
      }
      const media = record.media
        .filter((item) => {
          const mediaCapabilities = evaluateCeremonialAccess(
            policyInput(
              { ...record, ...item, selected: true, approvals: item.approvals, media: [] },
              generatedAt,
            ),
          );
          const facet = item.kind === "SEAL" ? mediaCapabilities.seal : mediaCapabilities.image;
          return facet.decision === "allow" && mediaCapabilities.mediaDownload.decision === "allow";
        })
        .map(
          ({
            id,
            kind,
            contentHash,
            mimeType,
            byteSize,
            rights,
            access,
            sensitivity,
            approvals,
          }) => ({
            id,
            kind,
            contentHash,
            mimeType,
            byteSize,
            rights,
            access,
            sensitivity,
            approvals: activeApprovals(approvals, generatedAt),
          }),
        )
        .sort((left, right) => left.id.localeCompare(right.id));
      return [
        {
          id: record.id,
          sourceSystem: record.sourceSystem,
          work: record.work,
          edition: record.edition,
          locator: record.locator,
          displayName: record.displayName,
          summary: record.summary,
          rights: record.rights,
          access: record.access,
          sensitivity: record.sensitivity,
          ...(capabilities.quotation.decision === "allow" && record.quotation !== undefined
            ? { quotation: record.quotation }
            : {}),
          ...(capabilities.fullText.decision === "allow" && record.fullText !== undefined
            ? { fullText: record.fullText }
            : {}),
          media,
          approvals: activeApprovals(record.approvals, generatedAt),
        },
      ];
    });
  if (ineligibleSelected.length > 0)
    throw new ExplicitPublicationIneligibleError(ineligibleSelected);
  const manifest = publicBundleManifestSchema.parse({
    format: "astroaxe-ceremonial-public-bundle",
    schemaVersion: 1,
    generatedAt: generatedAt.toISOString(),
    records: published,
  });
  const canonicalJson = JSON.stringify(canonicalize(manifest));
  return {
    manifest,
    canonicalJson,
    manifestHash: createHash("sha256").update(canonicalJson).digest("hex"),
    excluded: excluded.sort((left, right) => left.id.localeCompare(right.id)),
  };
}

export function verifyPublicBundle(
  rawManifest: unknown,
  expectedHash: string,
  now: Date,
): PublicBundleManifest {
  const manifest = publicBundleManifestSchema.parse(rawManifest);
  const canonicalJson = JSON.stringify(canonicalize(manifest));
  const actualHash = createHash("sha256").update(canonicalJson).digest("hex");
  if (actualHash !== sha256Schema.parse(expectedHash))
    throw new Error("Bundle manifest hash mismatch");
  for (const record of manifest.records) {
    for (const approval of record.approvals) {
      if (
        approval.decision !== "APPROVED" ||
        approval.revokedAt !== null ||
        (approval.expiresAt !== null && new Date(approval.expiresAt) <= now)
      )
        throw new Error("Bundle contains inactive approval");
    }
    const recordCapabilities = evaluateCeremonialAccess(
      policyInput({ ...record, selected: true, media: [] }, now),
    );
    if (recordCapabilities.metadata.decision === "deny")
      throw new Error("Bundle contains ineligible record");
    if (record.quotation !== undefined && recordCapabilities.quotation.decision === "deny")
      throw new Error("Bundle contains ineligible quotation");
    if (record.fullText !== undefined && recordCapabilities.fullText.decision === "deny")
      throw new Error("Bundle contains ineligible full text");
    for (const media of record.media) {
      const mediaCapabilities = evaluateCeremonialAccess(
        policyInput({ ...record, ...media, selected: true, media: [] }, now),
      );
      const facet = media.kind === "SEAL" ? mediaCapabilities.seal : mediaCapabilities.image;
      if (facet.decision === "deny" || mediaCapabilities.mediaDownload.decision === "deny")
        throw new Error("Bundle contains ineligible media");
    }
  }
  return manifest;
}
