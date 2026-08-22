import { describe, expect, it } from "vitest";

import { regencyMatrixSchema } from "./contracts";
import { eligibleRegencyEntities, publishedCoverage, regencyMatrix } from "./matrix";

describe("regency research matrix", () => {
  it("keeps a broad Orixa roster separate from Umbanda lines", () => {
    expect(eligibleRegencyEntities()).toHaveLength(25);
    expect(regencyMatrix.entities.find(({ id }) => id === "umbanda-line:yori")).toMatchObject({
      kind: "umbanda_line",
      eligibleForRegency: false,
    });
    expect(regencyMatrix.entities.find(({ id }) => id === "umbanda-line:yorima")).toMatchObject({
      kind: "umbanda_line",
      eligibleForRegency: false,
    });
    expect(regencyMatrix.entities.find(({ id }) => id === "nkisi:tempo")).toMatchObject({
      kind: "nkisi",
      eligibleForRegency: false,
    });
  });

  it("records the localized Matta e Silva table without assigning algorithm weights", () => {
    expect(regencyMatrix.claims.find(({ id }) => id.endsWith("ogum-planet"))).toMatchObject({
      targetId: "orisa:ogum",
      values: ["mars"],
      algorithmWeight: null,
    });
    expect(regencyMatrix.claims.find(({ id }) => id.endsWith("xango-sign"))).toMatchObject({
      targetId: "orisa:xango",
      values: ["sagittarius", "pisces"],
    });
  });

  it("makes incomplete published coverage observable", () => {
    const coverage = publishedCoverage();
    expect(coverage.coveredCandidateIds).toHaveLength(12);
    expect(coverage.coveredCandidateIds).toContain("orisa:oxum");
    expect(coverage.uncoveredCandidateIds).not.toContain("orisa:oxum");
    expect(coverage.uncoveredCandidateIds).toHaveLength(13);
  });

  it("rejects a correspondence whose target is absent from the ontology", () => {
    const invalid = {
      ...regencyMatrix,
      claims: [{ ...regencyMatrix.claims[0]!, targetId: "orisa:inexistente" }],
    };
    expect(regencyMatrixSchema.safeParse(invalid).success).toBe(false);
  });
});
