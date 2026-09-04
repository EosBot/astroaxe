import { describe, expect, it } from "vitest";

import {
  TRADICOES_CATALOGO_VERSION,
  tradicaoById,
  tradicoes,
  tradicoesComEntidades,
  tradicoesComOrientacao,
} from "./catalogo";

describe("catálogo de tradições", () => {
  it("cobre muitas tradições, e não uma só", () => {
    // O guia existe para atravessar tradições. Um catálogo que encolhesse para
    // duas ou três significaria que voltamos a tratar o produto como
    // especializado quando ele não é.
    expect(tradicoes.length).toBeGreaterThanOrEqual(15);
    expect(TRADICOES_CATALOGO_VERSION).toMatch(/^tradicoes-catalogo-/);
  });

  it("declara profundidade coerente com o acervo que tem", () => {
    for (const tradicao of tradicoes) {
      expect(tradicao.corpusChunks).toBeGreaterThan(0);
      // Prometer orientação de procedimento com acervo raso seria completar de
      // cabeça, que é exatamente o que este projeto se recusa a fazer.
      if (tradicao.depth === "orientacao")
        expect(tradicao.corpusChunks).toBeGreaterThanOrEqual(300);
    }
  });

  it("mantém em panorama o que o acervo não sustenta", () => {
    const goetia = tradicaoById("tradicao:goetia");
    const olimpicos = tradicaoById("tradicao:olimpicos");

    // Cento e cinquenta e cinco e setenta e três trechos não dão procedimento
    // completo. A lacuna fica declarada em vez de preenchida.
    expect(goetia?.depth).toBe("panorama");
    expect(olimpicos?.depth).toBe("panorama");
  });

  it("diz o que cada tradição faz, e com quem", () => {
    for (const tradicao of tradicoes) {
      expect(tradicao.works.length).toBeGreaterThanOrEqual(1);
      expect(tradicao.summary.length).toBeGreaterThan(100);
    }
  });

  it("separa tradições que operam por entidade das que não operam", () => {
    const nomes = tradicoesComEntidades().map(({ id }) => id);

    expect(nomes).toContain("tradicao:quimbanda");
    // Hermetismo, alquimia e tarot são gramática e método, e não culto com
    // entidade nomeada. Inventar panteão para eles seria fabricar fundamento.
    expect(nomes).not.toContain("tradicao:hermetismo");
    expect(nomes).not.toContain("tradicao:alquimia");
  });

  it("encontra tradição por id", () => {
    expect(tradicaoById("tradicao:umbanda")?.name).toBe("Umbanda");
    expect(tradicaoById("tradicao:inexistente")).toBeUndefined();
  });

  it("lista as que sustentam orientar procedimento", () => {
    const orientam = tradicoesComOrientacao();
    expect(orientam.length).toBeGreaterThanOrEqual(4);
    for (const tradicao of orientam) expect(tradicao.depth).toBe("orientacao");
  });

  it("não repete id nem nome", () => {
    const ids = tradicoes.map(({ id }) => id);
    const nomes = tradicoes.map(({ name }) => name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(nomes).size).toBe(nomes.length);
  });
});
