import { describe, expect, it } from "vitest";

import {
  SYMBOLIC_RESONANCE_DISCLAIMER,
  provenanceClaimSchema,
  safePublicCopySchema,
  symbolicResonanceResponseSchema,
} from "./contracts";

function validClaim() {
  return {
    claimId: "claim:oxum:aguas-doces:1",
    subjectId: "orisa:oxum",
    subjectCategory: "orisa" as const,
    predicate: "associated_with_domain",
    objectSummary: "Associacao situada com aguas doces nesta fonte.",
    traditionId: "candomble-ketu-nago",
    region: "Bahia, Brasil",
    source: {
      sourceId: "source:iphan:inventario-df",
      title: "Inventario Nacional de Referencias Culturais",
      url: "https://portal.iphan.gov.br/example",
      locator: "p. 170",
      evidenceKind: "institutional-inventory" as const,
    },
    accessLevel: "public" as const,
    status: "active" as const,
    knowledgeVersion: "knowledge-2026-08-19",
    reviewedAt: "2026-08-19T10:00:00-03:00",
  };
}

function validResponse() {
  return {
    kind: "symbolic_resonance" as const,
    disclaimer: SYMBOLIC_RESONANCE_DISCLAIMER,
    candidates: [
      {
        symbolicFigureId: "orisa:oxum",
        displayName: "Oxum",
        category: "orisa" as const,
        traditionId: "candomble-ketu-nago",
        normalizedScore: 0.72,
        scoreMeaning: "relative_symbolic_affinity" as const,
        rank: 1,
        summary: "A leitura aproxima temas de cuidado, beleza e aguas doces.",
        astrologicalIndicators: [
          {
            feature: "venus_element_balance",
            contribution: 0.32,
            explanation: "Venus contribui para esta afinidade narrativa relativa.",
          },
        ],
        provenance: [validClaim()],
      },
    ],
    methodVersion: "resonance-1.0.0",
    astrologyEngineVersion: "caelus-0.24.1",
    astrologyConfigVersion: "western-2026-08-19",
    knowledgeVersion: "knowledge-2026-08-19",
    limitationsVersion: "limitations-1.0.0",
    inputFingerprint: "a".repeat(64),
  };
}

describe("symbolic resonance content contracts", () => {
  it("accepts a contextualized response with mandatory provenance", () => {
    const result = symbolicResonanceResponseSchema.parse(validResponse());

    expect(result.kind).toBe("symbolic_resonance");
    expect(result.candidates[0]?.scoreMeaning).toBe("relative_symbolic_affinity");
    expect(result.candidates[0]?.provenance[0]?.accessLevel).toBe("public");
  });

  it.each([
    "Seu orixa e Oxum.",
    "O mapa determina o seu Orixa.",
    "Este e seu santo de cabeca.",
    "Voce e filha de Iemanja.",
    "O vinculo foi confirmado pelo mapa.",
  ])("rejects religious determination language: %s", (copy) => {
    expect(safePublicCopySchema.safeParse(copy).success).toBe(false);
  });

  it("requires the approved disclaimer verbatim", () => {
    const response = { ...validResponse(), disclaimer: "Resultado definitivo." };

    expect(symbolicResonanceResponseSchema.safeParse(response).success).toBe(false);
  });

  it("rejects restricted or sacred provenance from a public response", () => {
    const claim = { ...validClaim(), accessLevel: "sacred-secret" };

    expect(provenanceClaimSchema.safeParse(claim).success).toBe(false);
  });

  it("rejects cross-tradition claims attached to a candidate", () => {
    const response = validResponse();
    response.candidates[0]!.provenance[0]!.traditionId = "candomble-jeje";

    const result = symbolicResonanceResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it("rejects claims whose sacred category was collapsed", () => {
    const valid = validResponse();
    const response = {
      ...valid,
      candidates: valid.candidates.map((candidate) => ({
        ...candidate,
        provenance: candidate.provenance.map((claim) => ({
          ...claim,
          subjectCategory: "vodun",
        })),
      })),
    };

    const result = symbolicResonanceResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it("requires contiguous unique ranks", () => {
    const first = validResponse().candidates[0]!;
    const response = {
      ...validResponse(),
      candidates: [
        first,
        {
          ...first,
          symbolicFigureId: "orisa:iemanja",
          displayName: "Iemanja",
          rank: 3,
          provenance: [
            {
              ...validClaim(),
              claimId: "claim:iemanja:mar:1",
              subjectId: "orisa:iemanja",
            },
          ],
        },
      ],
    };

    expect(symbolicResonanceResponseSchema.safeParse(response).success).toBe(false);
  });

  it("rejects unknown public API fields", () => {
    const response = { ...validResponse(), religiousConfidence: "alta" };

    expect(symbolicResonanceResponseSchema.safeParse(response).success).toBe(false);
  });
});
