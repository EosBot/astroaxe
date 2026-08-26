import { describe, expect, it } from "vitest";

import {
  buildPublicBundle,
  ExplicitPublicationIneligibleError,
  verifyPublicBundle,
  type PublicBundleSourceRecord,
} from "@/domain/ceremonial/public-bundle";

const NOW = new Date("2026-08-26T20:00:00.000Z");
const HASH = "a".repeat(64);

function approval(reviewKind: "RIGHTS" | "EDITORIAL") {
  return {
    reviewKind,
    decision: "APPROVED" as const,
    facetScope: ["metadata", "quotation", "fullText", "image", "seal", "mediaDownload"] as const,
    decidedAt: "2026-08-25T12:00:00.000Z",
    expiresAt: "2026-09-25T12:00:00.000Z",
    revokedAt: null,
  };
}

function record(overrides: Partial<PublicBundleSourceRecord> = {}): PublicBundleSourceRecord {
  return {
    id: "123e4567-e89b-42d3-a456-426614174000",
    selected: true,
    sourceSystem: "synthetic-system",
    work: "Synthetic Work",
    edition: "Synthetic Edition",
    locator: "page 1",
    displayName: "Synthetic Entry",
    summary: "Synthetic metadata approved for deterministic tests.",
    quotation: "Synthetic quotation.",
    fullText: "Synthetic full text.",
    rights: "PUBLIC_DOMAIN",
    access: "PUBLIC",
    sensitivity: "GENERAL",
    approvals: [approval("RIGHTS"), approval("EDITORIAL")].map((item) => ({
      ...item,
      facetScope: [...item.facetScope],
    })),
    media: [],
    ...overrides,
  };
}

describe("public ceremonial bundle", () => {
  it("produces byte-identical canonical output regardless of input order", () => {
    const second = record({ id: "223e4567-e89b-42d3-a456-426614174000", displayName: "Second" });
    const first = buildPublicBundle([second, record()], NOW);
    const reordered = buildPublicBundle([record(), second], NOW);

    expect(first.canonicalJson).toBe(reordered.canonicalJson);
    expect(first.manifestHash).toBe(reordered.manifestHash);
    expect(first.manifest.records.map(({ displayName }) => displayName)).toEqual([
      "Synthetic Entry",
      "Second",
    ]);
    expect(first.canonicalJson).not.toContain("relativePath");
    expect(first.canonicalJson).not.toContain("archiveRoot");
  });

  it("accounts for nonselected records without aborting", () => {
    const result = buildPublicBundle([record({ selected: false })], NOW);
    expect(result.manifest.records).toEqual([]);
    expect(result.excluded).toEqual([
      { id: "123e4567-e89b-42d3-a456-426614174000", reason: "not_selected" },
    ]);
  });

  it("freezes the canonical metadata-only golden hash", () => {
    const golden = buildPublicBundle(
      [
        record({
          quotation: undefined,
          fullText: undefined,
          summary: "Synthetic metadata.",
          approvals: record().approvals.map((item) => ({ ...item, facetScope: ["metadata"] })),
        }),
      ],
      NOW,
    );
    expect(golden.manifestHash).toBe(
      "567ef7135c837201d3dedddacd38f0b4daf4c2f638adc288dd56997a4a9199cb",
    );
  });

  it("aborts when an explicitly selected record is not public-policy eligible", () => {
    expect(() => buildPublicBundle([record({ access: "LOCAL_ONLY" })], NOW)).toThrow(
      ExplicitPublicationIneligibleError,
    );
  });

  it("emits metadata but omits protected bodies for explicitly approved unknown rights", () => {
    const result = buildPublicBundle([record({ rights: "UNKNOWN" })], NOW);
    expect(result.manifest.records[0]).toMatchObject({ displayName: "Synthetic Entry" });
    expect(result.manifest.records[0]).not.toHaveProperty("quotation");
    expect(result.manifest.records[0]).not.toHaveProperty("fullText");
  });

  it("includes only facet-authorized media hashes and never a source path", () => {
    const mediaApprovals = [approval("RIGHTS"), approval("EDITORIAL")].map((item) => ({
      ...item,
      facetScope: [...item.facetScope],
    }));
    const result = buildPublicBundle(
      [
        record({
          media: [
            {
              id: "323e4567-e89b-42d3-a456-426614174000",
              kind: "IMAGE",
              contentHash: HASH,
              mimeType: "image/png",
              byteSize: 128,
              rights: "LICENSED",
              access: "PUBLIC",
              sensitivity: "GENERAL",
              approvals: mediaApprovals,
            },
          ],
        }),
      ],
      NOW,
    );
    expect(result.manifest.records[0]?.media).toEqual([
      expect.objectContaining({ contentHash: HASH, mimeType: "image/png" }),
    ]);
  });

  it("independently verifies schema/hash and rejects expiry or tampering", () => {
    const built = buildPublicBundle([record()], NOW);
    expect(verifyPublicBundle(built.manifest, built.manifestHash, NOW)).toEqual(built.manifest);
    expect(() => verifyPublicBundle(built.manifest, "b".repeat(64), NOW)).toThrow(
      "Bundle manifest hash mismatch",
    );
    expect(() =>
      verifyPublicBundle(built.manifest, built.manifestHash, new Date("2026-10-01")),
    ).toThrow("Bundle contains inactive approval");
  });
});
