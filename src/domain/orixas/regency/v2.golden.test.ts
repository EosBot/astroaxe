import { describe, expect, it } from "vitest";

import { extractRegencyNumerologicalFeatures } from "./numerology";
import { assessRegencyRobustness } from "./robustness";
import { scoreRegencies } from "./scorer";
import {
  extractRegencyQuestionnaireFeatures,
  regencyQuestionnaire,
  REGENCY_QUESTIONNAIRE_VERSION,
} from "./questionnaire";
import { regencyV2Config } from "./v2-config";
import { regencyV2Matrix, REGENCY_V2_MATRIX_VERSION } from "./v2-matrix";

describe("regency v2 research golden case", () => {
  const input = {
    matrix: regencyV2Matrix,
    config: regencyV2Config,
    astrologicalFeatures: [],
    numerologicalFeatures: extractRegencyNumerologicalFeatures({ birthDate: "1989-12-16" }),
  };

  it("freezes the composed matrix and lens-aware score", () => {
    const result = scoreRegencies(input);
    expect(result.configVersion).toBe("regency-weights-0.2.0-v3-questionnaire-research");
    expect(regencyV2Matrix.version).toBe(REGENCY_V2_MATRIX_VERSION);
    expect(result.rankingsByRole.head[0]).toMatchObject({ orisaId: "orisa:oxala", rawScore: 2 });
    expect(result.rankingsByRole.head[0]?.contributions).toHaveLength(1);
  });

  it("uses the directed law answer to distinguish Iansã from Ogum", () => {
    // Concorda com os dois itens do polo de Iansã e discorda dos dois de Ogum,
    // deixando o resto em branco: a inclinação vem do contraste dentro da
    // lente, e não de uma única resposta solta.
    const questionnaireFeatures = extractRegencyQuestionnaireFeatures({
      version: REGENCY_QUESTIONNAIRE_VERSION,
      answers: regencyQuestionnaire.map(({ id: questionId, lensId, pole }) => ({
        questionId,
        value:
          lensId !== "law"
            ? ("prefer_not_to_answer" as const)
            : pole === "second_pole"
              ? ("5" as const)
              : ("1" as const),
      })),
    });
    const result = scoreRegencies({
      matrix: regencyV2Matrix,
      config: regencyV2Config,
      astrologicalFeatures: [],
      questionnaireFeatures,
    });
    const oya = result.rankingsByRole.head.find(({ orisaId }) => orisaId === "orisa:oya");
    const ogum = result.rankingsByRole.head.find(({ orisaId }) => orisaId === "orisa:ogum");
    expect(oya?.rawScore).toBeGreaterThan(ogum?.rawScore ?? 0);
  });

  it("freezes the exact 27-entity eligible catalog", () => {
    const eligible = regencyV2Matrix.entities
      .filter(({ eligibleForRegency }) => eligibleForRegency)
      .map(({ id }) => id)
      .sort();
    expect(eligible).toEqual([
      "orisa:aje",
      "orisa:egunita",
      "orisa:erinle",
      "orisa:ewa",
      "orisa:exu",
      "orisa:ibeji",
      "orisa:iemanja",
      "orisa:iroko",
      "orisa:logun-ede",
      "orisa:logunan",
      "orisa:nana",
      "orisa:oba",
      "orisa:obaluaie",
      "orisa:oduduwa",
      "orisa:ogum",
      "orisa:olokun",
      "orisa:omolu",
      "orisa:onile",
      "orisa:orisa-oko",
      "orisa:orunmila",
      "orisa:ossaim",
      "orisa:oxala",
      "orisa:oxossi",
      "orisa:oxum",
      "orisa:oxumare",
      "orisa:oya",
      "orisa:xango",
    ]);
    expect(eligible).toHaveLength(27);
  });

  it("freezes the composed scorer/config/matrix version triple", () => {
    const result = scoreRegencies(input);
    expect(regencyV2Matrix.version).toBe("regency-matrix-0.5.0-v3-questionnaire-research");
    expect(result.configVersion).toBe("regency-weights-0.2.0-v3-questionnaire-research");
    expect(result.scorerVersion).toBe("regency-scorer-0.6.0-research");
  });

  it("leaves every role unresolved when there is no evidence at all", () => {
    const result = scoreRegencies({
      matrix: regencyV2Matrix,
      config: regencyV2Config,
      astrologicalFeatures: [],
    });
    expect(result.triad.front).toBeNull();
    expect(result.triad.head).toBeNull();
    expect(result.triad.back).toBeNull();
    expect(Object.keys(result.unresolvedRoles).sort()).toEqual(["back", "front", "head"]);
    for (const role of ["front", "head", "back"] as const)
      expect(result.unresolvedRoles[role]?.reason).toBeTruthy();
  });

  it("runs leave-one-school-out with numerological features", () => {
    const result = assessRegencyRobustness(input);
    expect(result.roles.head.eligible).toBe(true);
    expect(result.roles.head.perturbationCount).toBe(result.roles.head.schoolCount);
  });
});
