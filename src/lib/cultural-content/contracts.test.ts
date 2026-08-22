import { describe, expect, it } from "vitest";

import {
  culturalEntrySlugSchema,
  publicCulturalEntrySchema,
} from "@/lib/cultural-content/contracts";
import { SYMBOLIC_RESONANCE_DISCLAIMER } from "@/lib/orixas/contracts";

describe("cultural content contracts", () => {
  it("accepts traceable reviewed public content", () => {
    expect(publicCulturalEntrySchema.parse(validEntry()).claims).toHaveLength(1);
  });

  it("rejects religious determination in editorial copy", () => {
    expect(() =>
      publicCulturalEntrySchema.parse({ ...validEntry(), summary: "Seu Orixá é esta figura." }),
    ).toThrow(/determinacao|filiacao/i);
  });

  it("accepts only stable URL-safe slugs", () => {
    expect(culturalEntrySlugSchema.safeParse("oxum-ketu").success).toBe(true);
    expect(culturalEntrySlugSchema.safeParse("Oxum Ketu").success).toBe(false);
  });
});

function validEntry() {
  return {
    kind: "reviewed_cultural_content",
    disclaimer: SYMBOLIC_RESONANCE_DISCLAIMER,
    slug: "figura-simbolica",
    displayName: "Figura simbólica",
    category: "orisa",
    traditionId: "CandombleKetuNago",
    summary: "Uma aproximação editorial situada e aberta à exploração.",
    editorialBody: "Este texto apresenta uma narrativa pública com contexto e autoria.",
    version: "knowledge-1",
    publishedAt: "2026-08-19T12:00:00.000Z",
    author: { displayName: "Autoria", attributionLine: "Pesquisa e texto" },
    reviewer: { displayName: "Revisão", attributionLine: "Revisão cultural" },
    claims: [
      {
        claimKey: "claim-1",
        predicate: "contextualiza",
        objectSummary: "Claim pública e situada.",
        sourceLocator: "seção 2",
        status: "active",
        source: {
          title: "Fonte pública",
          url: "https://example.test/fonte",
          evidenceKind: "community-primary",
          licenseNote: "Uso autorizado para síntese com atribuição.",
          accessedAt: "2026-08-19",
        },
      },
    ],
  };
}
