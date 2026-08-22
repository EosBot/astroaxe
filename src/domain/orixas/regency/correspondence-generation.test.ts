import { describe, expect, it } from "vitest";

import {
  analyzeGeneratedCorrespondences,
  generateSymbolicCorrespondences,
  generatedCoverage,
} from "./correspondence-generation";
import { regencyMatrix } from "./matrix";
import { correspondenceResearchSources } from "./correspondence-research-sources";
import {
  extractedSymbolicAttributes,
  generatedSymbolicCorrespondences,
  symbolicDerivationRules,
} from "./symbolic-catalog";

describe("symbolic correspondence generation", () => {
  it("generates an auditable candidate chain for every catalogued Orixa", () => {
    const coverage = generatedCoverage({
      entities: regencyMatrix.entities,
      correspondences: generatedSymbolicCorrespondences,
    });

    expect(coverage.coveredCandidateIds).toHaveLength(25);
    expect(coverage.uncoveredCandidateIds).toEqual([]);
    expect(generatedSymbolicCorrespondences.length).toBeGreaterThan(70);
    expect(generatedSymbolicCorrespondences[0]).toMatchObject({
      evidenceTrack: "derived_symbolic_hypothesis",
      status: "candidate",
    });
  });

  it("is deterministic when inputs arrive in a different order", () => {
    expect(
      generateSymbolicCorrespondences({
        entities: [...regencyMatrix.entities].reverse(),
        attributes: [...extractedSymbolicAttributes].reverse(),
        rules: [...symbolicDerivationRules].reverse(),
      }),
    ).toEqual(generatedSymbolicCorrespondences);
  });

  it("generates composite convergences and a stable audit report", () => {
    const report = analyzeGeneratedCorrespondences({
      entities: regencyMatrix.entities,
      correspondences: generatedSymbolicCorrespondences,
    });
    const ogumComposite = generatedSymbolicCorrespondences.find(
      ({ id }) => id === "generated:ogum:composite:iron-warfare",
    );

    expect(ogumComposite).toMatchObject({
      derivationKind: "composite_convergence",
      factor: "planet",
      values: ["mars"],
      convergenceStrength: 0.6,
    });
    expect(ogumComposite?.attributeClaimIds).toHaveLength(2);
    expect(report).toMatchObject({
      coverage: {
        coveredCandidateIds: expect.arrayContaining(["orisa:ogum"]),
        uncoveredCandidateIds: [],
      },
    });
    expect(report.compositeCount).toBeGreaterThan(15);
    expect(report.divergentFactorsByTarget["orisa:oxum"]).toContain("planet");
  });

  it("rejects attributes assigned to a non-Orixa entity", () => {
    const invalid = { ...extractedSymbolicAttributes[0]!, targetId: "orisa:absent" };
    expect(() =>
      generateSymbolicCorrespondences({
        entities: regencyMatrix.entities,
        attributes: [invalid],
        rules: symbolicDerivationRules,
      }),
    ).toThrow(/not an eligible Orixa/);
  });

  it("uses a multi-publisher source inventory and never cites discovery as sole evidence", () => {
    expect(
      new Set(correspondenceResearchSources.map(({ publisherType }) => publisherType)),
    ).toEqual(
      new Set([
        "practitioner_or_community",
        "museum_or_cultural_institute",
        "scholarly_publication",
        "reference_discovery",
      ]),
    );
    for (const attribute of extractedSymbolicAttributes) {
      const sources = correspondenceResearchSources.filter(({ id }) =>
        attribute.sourceIds.includes(id),
      );
      expect(sources.some(({ evidenceUse }) => evidenceUse === "attribute_evidence")).toBe(true);
    }
  });
});
