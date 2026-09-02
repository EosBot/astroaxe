import { describe, expect, it } from "vitest";

import {
  extractRegencyQuestionnaireFeatures,
  regencyQuestionnaire,
  regencyQuestionnaireSubmissionSchema,
  REGENCY_QUESTIONNAIRE_VERSION,
  type RegencyQuestionnaireSubmission,
} from "./questionnaire";

type Answer = RegencyQuestionnaireSubmission["answers"][number]["value"];

/** Monta uma submissão completa a partir de uma regra por item. */
function submit(
  answer: (item: (typeof regencyQuestionnaire)[number]) => Answer,
): RegencyQuestionnaireSubmission {
  return {
    version: REGENCY_QUESTIONNAIRE_VERSION,
    answers: regencyQuestionnaire.map((item) => ({ questionId: item.id, value: answer(item) })),
  };
}

const lentes = [...new Set(regencyQuestionnaire.map((item) => item.lensId))];

describe("regency questionnaire", () => {
  it("exige uma resposta para cada item", () => {
    expect(
      regencyQuestionnaireSubmissionSchema.safeParse({
        version: REGENCY_QUESTIONNAIRE_VERSION,
        answers: [],
      }).success,
    ).toBe(false);
  });

  it("mede cada lente com quatro itens, dois por polo", () => {
    // Um item por construto foi o defeito da versão 1: a resposta a uma frase
    // isolada carrega mais humor do dia do que traço. E sem os dois polos
    // representados não há como separar inclinação de tendência a concordar.
    for (const lensId of lentes) {
      const daLente = regencyQuestionnaire.filter((item) => item.lensId === lensId);
      expect(daLente).toHaveLength(4);
      expect(daLente.filter((item) => item.pole === "first_pole")).toHaveLength(2);
      expect(daLente.filter((item) => item.pole === "second_pole")).toHaveLength(2);
    }
  });

  it("não agrupa itens da mesma lente em sequência", () => {
    // Quatro frases seguidas sobre o mesmo tema anunciam o que está sendo
    // medido, e a pessoa passa a responder ao tema em vez de a si mesma.
    const sequencia = regencyQuestionnaire.map((item) => item.lensId);
    for (const [indice, lente] of sequencia.entries())
      if (indice > 0) expect(lente).not.toBe(sequencia[indice - 1]);
  });

  it("converte um contraste claro em inclinação com força graduada", () => {
    const features = extractRegencyQuestionnaireFeatures(
      submit((item) =>
        item.lensId !== "love" ? "prefer_not_to_answer" : item.pole === "first_pole" ? "5" : "1",
      ),
    );

    expect(features).toEqual([
      expect.objectContaining({ lensId: "love", value: "first_pole", strength: 1 }),
    ]);
  });

  it("dá menos força a um contraste pequeno do que a um contraste grande", () => {
    const forca = (alto: Answer, baixo: Answer): number => {
      const [feature] = extractRegencyQuestionnaireFeatures(
        submit((item) =>
          item.lensId !== "law"
            ? "prefer_not_to_answer"
            : item.pole === "first_pole"
              ? alto
              : baixo,
        ),
      );
      return feature?.strength ?? 0;
    };

    // Diferença de um ponto vale menos que diferença de quatro. Na versão 1
    // toda resposta valia 1, e uma inclinação tímida pesava igual a uma certeza.
    expect(forca("4", "3")).toBeLessThan(forca("5", "1"));
    expect(forca("4", "3")).toBeGreaterThan(0);
  });

  it("declara indecisão quando a pessoa concorda com tudo", () => {
    const features = extractRegencyQuestionnaireFeatures(submit(() => "5"));

    // É o teste de aquiescência: quem marca "é exatamente eu" em toda frase não
    // revelou inclinação nenhuma, e o instrumento precisa dizer isso em vez de
    // premiar o polo que por acaso viesse primeiro.
    for (const lensId of lentes) {
      const daLente = features.filter((feature) => feature.lensId === lensId);
      expect(daLente).toHaveLength(2);
      expect(daLente.every((feature) => feature.strength === 0.5)).toBe(true);
    }
  });

  it("preserva a escolha de não responder", () => {
    expect(extractRegencyQuestionnaireFeatures(submit(() => "prefer_not_to_answer"))).toEqual([]);
  });

  it("abandona a lente quando um polo inteiro ficou sem resposta", () => {
    const features = extractRegencyQuestionnaireFeatures(
      submit((item) =>
        item.lensId === "faith" && item.pole === "first_pole" ? "5" : "prefer_not_to_answer",
      ),
    );

    // Sem o outro polo não há contra o que comparar, e estimar a metade que
    // falta seria inventá-la.
    expect(features.filter((feature) => feature.lensId === "faith")).toEqual([]);
  });

  it("fala a língua de quem responde", () => {
    const vocabularioDeIniciado = /irradiar|polo|decantar|dissolver o padrão|convicção/i;
    for (const { prompt } of regencyQuestionnaire) {
      expect(prompt).not.toMatch(vocabularioDeIniciado);
      // Frase longa vira interpretação de texto, e a resposta passa a medir
      // leitura em vez de comportamento.
      expect(prompt.length).toBeLessThanOrEqual(90);
    }
  });
});
