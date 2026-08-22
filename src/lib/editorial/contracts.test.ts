import { describe, expect, it } from "vitest";

import { createCulturalEntrySchema, editorialReviewSchema } from "@/lib/editorial/contracts";

describe("editorial contracts", () => {
  it("requires a justification for changes and withdrawals", () => {
    expect(editorialReviewSchema.safeParse({ decision: "CHANGES_REQUESTED" }).success).toBe(false);
    expect(
      editorialReviewSchema.safeParse({ decision: "WITHDRAWN", note: "Licença retirada." }).success,
    ).toBe(true);
  });

  it("rejects a draft without traceable claims", () => {
    expect(createCulturalEntrySchema.safeParse({ ...draft(), claims: [] }).success).toBe(false);
  });
});

function draft() {
  return {
    slug: "figura-simbolica",
    displayName: "Figura simbólica",
    category: "orisa",
    traditionId: "CandombleKetuNago",
    summary: "Leitura editorial situada.",
    editorialBody: "Narrativa pública com contexto.",
    version: "knowledge-1",
    claims: [
      {
        sourceId: "123e4567-e89b-42d3-a456-426614174000",
        claimKey: "claim-1",
        predicate: "contextualiza",
        objectSummary: "Associação situada pela fonte.",
      },
    ],
  };
}
