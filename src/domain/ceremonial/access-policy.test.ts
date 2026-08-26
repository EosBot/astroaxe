import { describe, expect, it } from "vitest";

import {
  evaluateCeremonialAccess,
  type CeremonialAccessPolicyInput,
} from "@/domain/ceremonial/access-policy";
import { CEREMONIAL_FACETS, type CeremonialFacet } from "@/domain/ceremonial/contracts";

const NOW = new Date("2026-08-26T18:00:00.000Z");

function approvedReview(
  reviewKind: "RIGHTS" | "EDITORIAL",
  facetScope: readonly CeremonialFacet[] = CEREMONIAL_FACETS,
): CeremonialAccessPolicyInput["reviews"][number] {
  return {
    reviewKind,
    decision: "APPROVED",
    facetScope: [...facetScope],
    decidedAt: new Date("2026-08-25T12:00:00.000Z"),
    expiresAt: new Date("2026-09-25T12:00:00.000Z"),
    revokedAt: null,
  };
}

function publicInput(
  overrides: Partial<CeremonialAccessPolicyInput> = {},
): CeremonialAccessPolicyInput {
  return {
    mode: "public",
    authenticated: false,
    rights: "PUBLIC_DOMAIN",
    access: "PUBLIC",
    sensitivity: "GENERAL",
    reviews: [approvedReview("RIGHTS"), approvedReview("EDITORIAL")],
    safety: { derivedGuidanceAllowed: true },
    now: NOW,
    ...overrides,
  };
}

describe("evaluateCeremonialAccess", () => {
  it("allows every independently approved public facet for eligible general material", () => {
    const result = evaluateCeremonialAccess(publicInput());

    for (const facet of CEREMONIAL_FACETS) {
      expect(result[facet]).toEqual({ decision: "allow", reason: "public_approved" });
    }
  });

  it.each(["PUBLIC_DOMAIN", "LICENSED", "PERMISSION_GRANTED"] as const)(
    "accepts publication-eligible rights %s",
    (rights) => {
      expect(evaluateCeremonialAccess(publicInput({ rights })).fullText.decision).toBe("allow");
    },
  );

  it.each(["RESTRICTED", "UNKNOWN"] as const)(
    "denies public body and export facets for %s rights",
    (rights) => {
      const result = evaluateCeremonialAccess(publicInput({ rights }));

      expect(result.metadata.decision).toBe("allow");
      for (const facet of CEREMONIAL_FACETS.filter((candidate) => candidate !== "metadata")) {
        expect(result[facet].decision).toBe("deny");
        expect(result[facet].reason).toBe("rights_ineligible");
      }
    },
  );

  it("requires both current rights and editorial approval for the exact public facet", () => {
    const onlyMetadata = [
      approvedReview("RIGHTS", ["metadata"]),
      approvedReview("EDITORIAL", ["metadata"]),
    ];
    const result = evaluateCeremonialAccess(publicInput({ reviews: onlyMetadata }));

    expect(result.metadata.decision).toBe("allow");
    expect(result.quotation).toEqual({ decision: "deny", reason: "rights_review_missing" });
  });

  it("treats expired, revoked and non-approved reviews as absent", () => {
    const unusableRightsReviews = [
      { ...approvedReview("RIGHTS"), expiresAt: NOW },
      { ...approvedReview("RIGHTS"), revokedAt: new Date("2026-08-26T17:00:00.000Z") },
      { ...approvedReview("RIGHTS"), decision: "CHANGES_REQUESTED" as const },
      approvedReview("EDITORIAL"),
    ];

    expect(
      evaluateCeremonialAccess(publicInput({ reviews: unusableRightsReviews })).metadata,
    ).toEqual({ decision: "deny", reason: "rights_review_missing" });
  });

  it("never publishes local-only records or restricted-knowledge bodies", () => {
    const localOnly = evaluateCeremonialAccess(publicInput({ access: "LOCAL_ONLY" }));
    expect(localOnly.metadata).toEqual({ decision: "deny", reason: "record_local_only" });

    const restricted = evaluateCeremonialAccess(
      publicInput({ sensitivity: "RESTRICTED_KNOWLEDGE" }),
    );
    expect(restricted.metadata.decision).toBe("allow");
    expect(restricted.fullText).toEqual({
      decision: "deny",
      reason: "restricted_knowledge",
    });
  });

  it("allows the authenticated local runtime and denies unauthenticated local access", () => {
    const local = publicInput({
      mode: "local",
      authenticated: true,
      access: "LOCAL_ONLY",
      rights: "UNKNOWN",
      sensitivity: "RESTRICTED_KNOWLEDGE",
      reviews: [],
    });
    const allowed = evaluateCeremonialAccess(local);
    for (const facet of CEREMONIAL_FACETS)
      expect(allowed[facet]).toEqual({ decision: "allow", reason: "authenticated_local" });

    const denied = evaluateCeremonialAccess({ ...local, authenticated: false });
    expect(denied.metadata).toEqual({ decision: "deny", reason: "authentication_required" });
  });

  it("fails closed for disabled mode, unsafe guidance and malformed adversarial input", () => {
    expect(evaluateCeremonialAccess(publicInput({ mode: "disabled" })).metadata).toEqual({
      decision: "deny",
      reason: "mode_disabled",
    });
    expect(
      evaluateCeremonialAccess(publicInput({ safety: { derivedGuidanceAllowed: false } })).export,
    ).toEqual({ decision: "deny", reason: "safety_policy_denied" });

    const forged = { ...publicInput(), mode: "local-from-header" };
    const result = evaluateCeremonialAccess(forged);
    for (const facet of CEREMONIAL_FACETS)
      expect(result[facet]).toEqual({ decision: "deny", reason: "invalid_policy_input" });
  });
});
