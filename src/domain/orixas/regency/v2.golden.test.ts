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
    expect(result.configVersion).toBe("regency-weights-0.3.0-astrology-primary");
    expect(regencyV2Matrix.version).toBe(REGENCY_V2_MATRIX_VERSION);
    expect(result.rankingsByRole.head[0]).toMatchObject({ orisaId: "orisa:oxala", rawScore: 2 });
    expect(result.rankingsByRole.head[0]?.contributions).toHaveLength(1);
  });

  it("usa o formulário para desempatar Iansã e Ogum, sem inflar o placar", () => {
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

    // O céu não falou nada aqui, então o placar dos dois é o mesmo: responder
    // ao formulário não cria evidência astrológica que não existe.
    expect(oya?.rawScore).toBe(ogum?.rawScore);
    expect(oya?.tiebreakScore ?? 0).toBeGreaterThan(ogum?.tiebreakScore ?? 0);

    // Mas entre iguais, a resposta ordena.
    const posicao = (id: string) =>
      result.rankingsByRole.head.findIndex(({ orisaId }) => orisaId === id);
    expect(posicao("orisa:oya")).toBeLessThan(posicao("orisa:ogum"));
  });

  it("mantém a astrologia acima do formulário quando os dois discordam", () => {
    // O pedido do dono, em forma de teste. A pessoa responde inteiramente a
    // favor de Ogum, e o céu aponta Aquário — signo de Iansã. O céu tem de
    // vencer: o formulário nunca compra posição, só arbitra empate.
    const questionnaireFeatures = extractRegencyQuestionnaireFeatures({
      version: REGENCY_QUESTIONNAIRE_VERSION,
      answers: regencyQuestionnaire.map(({ id: questionId, lensId, pole }) => ({
        questionId,
        value:
          lensId !== "law"
            ? ("prefer_not_to_answer" as const)
            : pole === "first_pole"
              ? ("5" as const)
              : ("1" as const),
      })),
    });

    const posicao = (resultado: ReturnType<typeof scoreRegencies>, id: string) =>
      resultado.rankingsByRole.head.findIndex(({ orisaId }) => orisaId === id);

    // Sem céu nenhum, o formulário manda: Ogum na frente.
    const semCeu = scoreRegencies({
      matrix: regencyV2Matrix,
      config: regencyV2Config,
      astrologicalFeatures: [],
      questionnaireFeatures,
    });
    expect(posicao(semCeu, "orisa:ogum")).toBeLessThan(posicao(semCeu, "orisa:oya"));

    // Com o céu discordando, ele inverte o resultado — mesmo com o formulário
    // inteiro puxando para o outro lado.
    const comCeu = scoreRegencies({
      matrix: regencyV2Matrix,
      config: regencyV2Config,
      astrologicalFeatures: [
        {
          key: "planet:saturn:sign:aquarius",
          category: "planet_sign",
          value: "aquarius",
          body: "saturn",
          strength: 1,
          requiresBirthTime: false,
        },
      ],
      questionnaireFeatures,
    });
    expect(posicao(comCeu, "orisa:oya")).toBeLessThan(posicao(comCeu, "orisa:ogum"));

    const oya = comCeu.rankingsByRole.head.find(({ orisaId }) => orisaId === "orisa:oya");
    const ogum = comCeu.rankingsByRole.head.find(({ orisaId }) => orisaId === "orisa:ogum");
    // Iansã vence pelo placar do céu, e não por empate desfeito no formulário —
    // que, aliás, continua apontando para Ogum.
    expect(oya?.rawScore ?? 0).toBeGreaterThan(ogum?.rawScore ?? 0);
    expect(ogum?.tiebreakScore ?? 0).toBeGreaterThan(oya?.tiebreakScore ?? 0);
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
    expect(result.configVersion).toBe("regency-weights-0.3.0-astrology-primary");
    expect(result.scorerVersion).toBe("regency-scorer-0.7.0-astrology-primary");
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
