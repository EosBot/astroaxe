import { z } from "zod";

/**
 * Frozen vocabulary shared by the ceremonial schema (storage), the access policy
 * (authorization) and the publication bundle (delivery). Every value is fail-closed:
 * anything not positively established stays `UNKNOWN`/`LOCAL_ONLY` and can only reach
 * a public surface through an explicit, reviewed approval.
 */

/** How the right to use a source facet was established. Never inferred from a filename. */
export const CEREMONIAL_RIGHTS = [
  "PUBLIC_DOMAIN",
  "LICENSED",
  "PERMISSION_GRANTED",
  "RESTRICTED",
  "UNKNOWN",
] as const;
export const ceremonialRightsSchema = z.enum(CEREMONIAL_RIGHTS);
export type CeremonialRights = z.infer<typeof ceremonialRightsSchema>;

/** Where a record may be delivered. `LOCAL_ONLY` never leaves the local runtime. */
export const CEREMONIAL_ACCESS = ["PUBLIC", "LOCAL_ONLY"] as const;
export const ceremonialAccessSchema = z.enum(CEREMONIAL_ACCESS);
export type CeremonialAccess = z.infer<typeof ceremonialAccessSchema>;

/** Cultural/graded sensitivity, independent of who legally owns the text. */
export const CEREMONIAL_SENSITIVITY = [
  "GENERAL",
  "CULTURALLY_SENSITIVE",
  "RESTRICTED_KNOWLEDGE",
] as const;
export const ceremonialSensitivitySchema = z.enum(CEREMONIAL_SENSITIVITY);
export type CeremonialSensitivity = z.infer<typeof ceremonialSensitivitySchema>;

/**
 * Independently authorized facets of one record. Metadata is the only facet an
 * explicitly approved unknown-rights record may ever expose; every body-bearing facet
 * (quotation, full text, image, seal, download) and `export` deny by default.
 */
export const CEREMONIAL_FACETS = [
  "metadata",
  "quotation",
  "fullText",
  "image",
  "seal",
  "mediaDownload",
  "export",
] as const;
export const ceremonialFacetSchema = z.enum(CEREMONIAL_FACETS);
export type CeremonialFacet = z.infer<typeof ceremonialFacetSchema>;

/** Facets that expose source body/media rather than catalog description. */
export const CEREMONIAL_BODY_FACETS: readonly CeremonialFacet[] = [
  "quotation",
  "fullText",
  "image",
  "seal",
  "mediaDownload",
] as const;

/** Import default. A newly ingested artifact is unknown-rights and local-only. */
export const DEFAULT_CEREMONIAL_RIGHTS: CeremonialRights = "UNKNOWN";
export const DEFAULT_CEREMONIAL_ACCESS: CeremonialAccess = "LOCAL_ONLY";
export const DEFAULT_CEREMONIAL_SENSITIVITY: CeremonialSensitivity = "CULTURALLY_SENSITIVE";

/** Rights values that can, with an unexpired approval, back a public body facet. */
const PUBLICATION_ELIGIBLE_RIGHTS: readonly CeremonialRights[] = [
  "PUBLIC_DOMAIN",
  "LICENSED",
  "PERMISSION_GRANTED",
];

export function isPublicationEligibleRights(rights: CeremonialRights): boolean {
  return PUBLICATION_ELIGIBLE_RIGHTS.includes(rights);
}

export function isBodyFacet(facet: CeremonialFacet): boolean {
  return CEREMONIAL_BODY_FACETS.includes(facet);
}
