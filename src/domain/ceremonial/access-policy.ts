import { z } from "zod";

import {
  CEREMONIAL_FACETS,
  ceremonialAccessSchema,
  ceremonialFacetSchema,
  ceremonialRightsSchema,
  ceremonialSensitivitySchema,
  isPublicationEligibleRights,
  type CeremonialFacet,
} from "@/domain/ceremonial/contracts";

const ceremonialModeSchema = z.enum(["disabled", "public", "local"]);
const reviewKindSchema = z.enum(["RIGHTS", "EDITORIAL"]);
const reviewDecisionSchema = z.enum(["APPROVED", "CHANGES_REQUESTED", "REVOKED"]);

const ceremonialAccessReviewSchema = z
  .object({
    reviewKind: reviewKindSchema,
    decision: reviewDecisionSchema,
    facetScope: z.array(ceremonialFacetSchema),
    decidedAt: z.date(),
    expiresAt: z.date().nullable(),
    revokedAt: z.date().nullable(),
  })
  .strict();

const ceremonialAccessPolicyInputSchema = z
  .object({
    mode: ceremonialModeSchema,
    authenticated: z.boolean(),
    rights: ceremonialRightsSchema,
    access: ceremonialAccessSchema,
    sensitivity: ceremonialSensitivitySchema,
    reviews: z.array(ceremonialAccessReviewSchema),
    safety: z.object({ derivedGuidanceAllowed: z.boolean() }).strict(),
    now: z.date(),
  })
  .strict();

export type CeremonialAccessPolicyInput = z.infer<typeof ceremonialAccessPolicyInputSchema>;

export const CEREMONIAL_ACCESS_DENIAL_REASONS = [
  "invalid_policy_input",
  "mode_disabled",
  "authentication_required",
  "record_local_only",
  "safety_policy_denied",
  "restricted_knowledge",
  "rights_ineligible",
  "rights_review_missing",
  "editorial_review_missing",
] as const;

export type CeremonialAccessDenialReason = (typeof CEREMONIAL_ACCESS_DENIAL_REASONS)[number];
export type CeremonialAccessDecision =
  | { readonly decision: "allow"; readonly reason: "authenticated_local" | "public_approved" }
  | { readonly decision: "deny"; readonly reason: CeremonialAccessDenialReason };
export type CeremonialCapabilities = Readonly<Record<CeremonialFacet, CeremonialAccessDecision>>;

function allDenied(reason: CeremonialAccessDenialReason): CeremonialCapabilities {
  return Object.freeze(
    Object.fromEntries(
      CEREMONIAL_FACETS.map((facet) => [facet, Object.freeze({ decision: "deny", reason })]),
    ) as Record<CeremonialFacet, CeremonialAccessDecision>,
  );
}

function activeApprovalCovers(
  input: CeremonialAccessPolicyInput,
  reviewKind: "RIGHTS" | "EDITORIAL",
  facet: CeremonialFacet,
): boolean {
  return input.reviews.some(
    (review) =>
      review.reviewKind === reviewKind &&
      review.decision === "APPROVED" &&
      review.revokedAt === null &&
      (review.expiresAt === null || review.expiresAt > input.now) &&
      review.decidedAt <= input.now &&
      review.facetScope.includes(facet),
  );
}

function publicFacetDecision(
  input: CeremonialAccessPolicyInput,
  facet: CeremonialFacet,
): CeremonialAccessDecision {
  if (input.access !== "PUBLIC") return { decision: "deny", reason: "record_local_only" };
  if (!input.safety.derivedGuidanceAllowed)
    return { decision: "deny", reason: "safety_policy_denied" };
  if (input.sensitivity === "RESTRICTED_KNOWLEDGE" && facet !== "metadata")
    return { decision: "deny", reason: "restricted_knowledge" };
  if (facet !== "metadata" && !isPublicationEligibleRights(input.rights))
    return { decision: "deny", reason: "rights_ineligible" };
  if (!activeApprovalCovers(input, "RIGHTS", facet))
    return { decision: "deny", reason: "rights_review_missing" };
  if (!activeApprovalCovers(input, "EDITORIAL", facet))
    return { decision: "deny", reason: "editorial_review_missing" };
  return { decision: "allow", reason: "public_approved" };
}

/**
 * Pure authorization matrix shared by every future ceremonial query and serializer.
 * It deliberately accepts `unknown`: a corrupted database value or request-derived forged
 * mode becomes a complete denial instead of an exception or a permissive fallback.
 */
export function evaluateCeremonialAccess(input: unknown): CeremonialCapabilities {
  const parsed = ceremonialAccessPolicyInputSchema.safeParse(input);
  if (!parsed.success) return allDenied("invalid_policy_input");

  if (parsed.data.mode === "disabled") return allDenied("mode_disabled");
  if (parsed.data.mode === "local") {
    if (!parsed.data.authenticated) return allDenied("authentication_required");
    return Object.freeze(
      Object.fromEntries(
        CEREMONIAL_FACETS.map((facet) => [
          facet,
          Object.freeze({ decision: "allow", reason: "authenticated_local" }),
        ]),
      ) as Record<CeremonialFacet, CeremonialAccessDecision>,
    );
  }

  return Object.freeze(
    Object.fromEntries(
      CEREMONIAL_FACETS.map((facet) => [
        facet,
        Object.freeze(publicFacetDecision(parsed.data, facet)),
      ]),
    ) as Record<CeremonialFacet, CeremonialAccessDecision>,
  );
}
