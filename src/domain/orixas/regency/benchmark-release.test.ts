import { describe, expect, it } from "vitest";

import {
  buildRegencyBenchmarkCells,
  detectRegencyBenchmarkDifferencingRisk,
  directedPairId,
  suppressRegencyBenchmarkCells,
  type RegencyFeedbackRecord,
} from "./benchmark-release";

describe("directedPairId", () => {
  it("marks an unresolved role as unresolved regardless of correction", () => {
    expect(directedPairId(null, "orisa:ogum")).toBe("unresolved");
  });

  it("marks a resolved role with no correction offered as unspecified", () => {
    expect(directedPairId("orisa:ogum", undefined)).toBe("unspecified");
    expect(directedPairId("orisa:ogum", null)).toBe("unspecified");
  });

  it("encodes a confirmed or corrected role as predicted->corrected", () => {
    expect(directedPairId("orisa:ogum", "orisa:ogum")).toBe("orisa:ogum->orisa:ogum");
    expect(directedPairId("orisa:ogum", "orisa:oya")).toBe("orisa:ogum->orisa:oya");
  });
});

describe("buildRegencyBenchmarkCells", () => {
  it("expands each record into one cell per role and aggregates identical dimension tuples", () => {
    const cells = buildRegencyBenchmarkCells([record(), record()]);
    const front = cells.find((cell) => cell.role === "front");
    expect(front).toMatchObject({ count: 2, directedPair: "orisa:ogum->orisa:ogum" });
    expect(cells).toHaveLength(3);
  });

  it("never carries an id, comment, birth date, location or timestamp field", () => {
    const cells = buildRegencyBenchmarkCells([record()]);
    for (const cell of cells) {
      expect(Object.keys(cell).sort()).toEqual(
        [
          "methodVersion",
          "matrixVersion",
          "configVersion",
          "scorerVersion",
          "questionnaireVersion",
          "role",
          "verdict",
          "confirmationBasis",
          "directedPair",
          "count",
        ].sort(),
      );
    }
  });
});

describe("suppressRegencyBenchmarkCells", () => {
  it("refuses a cohort below the minimum instead of publishing a small-sample table", () => {
    const result = suppressRegencyBenchmarkCells(records(29));
    expect(result).toEqual({
      ok: false,
      reason: "insufficient_cohort",
      cohortSize: 29,
      minCohortSize: 30,
    });
  });

  it("publishes every cell once the cohort minimum is met and no cell is below the primary threshold", () => {
    const result = suppressRegencyBenchmarkCells(records(30));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.cohortSize).toBe(30);
    expect(result.cells.every((cell) => !cell.suppressed && cell.count === 30)).toBe(true);
  });

  it("primary-suppresses a cell under the threshold without revealing its count", () => {
    const uniform = records(28, "close");
    const distinct = records(2, "matched");
    const result = suppressRegencyBenchmarkCells([...uniform, ...distinct]);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    const matched = result.cells.filter((cell) => cell.verdict === "matched");
    expect(matched.every((cell) => cell.suppressed && cell.count === null)).toBe(true);
  });

  it("applies complementary suppression so a lone hidden cell cannot be recovered from its partition", () => {
    // Same partition (method/matrix/config/scorer/questionnaire/role/verdict) split across
    // two confirmationBasis values: one well above threshold, one just below it.
    const large = records(25, "close", "personal_recognition");
    const small = records(9, "close", "practitioner_consultation");
    const result = suppressRegencyBenchmarkCells([...large, ...small]);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    const partition = result.cells.filter(
      (cell) => cell.role === "front" && cell.verdict === "close",
    );
    const suppressedCount = partition.filter((cell) => cell.suppressed).length;
    expect(suppressedCount).toBeGreaterThanOrEqual(2);
    const complementary = partition.find((cell) => cell.suppressionReason === "complementary");
    expect(complementary).toBeTruthy();
  });

  it("excludes ids, comments, birth data, location and timestamps by construction", () => {
    const result = suppressRegencyBenchmarkCells(records(30));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(JSON.stringify(result.cells)).not.toMatch(
      /comment|birthDate|location|latitude|longitude|createdAt|updatedAt|"id"/,
    );
  });
});

describe("detectRegencyBenchmarkDifferencingRisk", () => {
  it("flags a small nonzero delta between releases on the same cell", () => {
    const previous = buildRegencyBenchmarkCells(records(30));
    const current = buildRegencyBenchmarkCells(records(33));
    const risks = detectRegencyBenchmarkDifferencingRisk(previous, current);
    expect(risks.length).toBeGreaterThan(0);
  });

  it("does not flag a delta at or above the suppression threshold", () => {
    const previous = buildRegencyBenchmarkCells(records(30));
    const current = buildRegencyBenchmarkCells(records(50));
    const risks = detectRegencyBenchmarkDifferencingRisk(previous, current);
    expect(risks).toHaveLength(0);
  });

  it("does not flag an unchanged cell", () => {
    const previous = buildRegencyBenchmarkCells(records(30));
    const current = buildRegencyBenchmarkCells(records(30));
    expect(detectRegencyBenchmarkDifferencingRisk(previous, current)).toHaveLength(0);
  });
});

function record(
  verdict = "close",
  confirmationBasis = "personal_recognition",
): RegencyFeedbackRecord {
  return {
    methodVersion: "AstroAxe Regências 3.0 — pesquisa aplicada",
    matrixVersion: "0.5.0-v3",
    configVersion: "0.2.0-v3",
    scorerVersion: "0.6.0",
    questionnaireVersion: "regency-questionnaire-1.0.0",
    verdict,
    confirmationBasis,
    predictedTriad: { front: "orisa:ogum", head: "orisa:oxala", back: null },
    correctedTriad: { front: "orisa:ogum", head: null, back: null },
  };
}

function records(
  count: number,
  verdict = "close",
  confirmationBasis = "personal_recognition",
): RegencyFeedbackRecord[] {
  return Array.from({ length: count }, () => record(verdict, confirmationBasis));
}
