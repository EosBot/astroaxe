import { describe, expect, it } from "vitest";

import { AUTHORIAL_NOTE, buildPublicCorrespondenceTable } from "./public-correspondence-table";

const table = buildPublicCorrespondenceTable();
const serialized = JSON.stringify(table);

describe("tábua de correspondências pública", () => {
  it("publica linhas legíveis, com nome e fator em português", () => {
    expect(table.rows.length).toBeGreaterThan(0);
    for (const row of table.rows) {
      expect(row.name).not.toMatch(/^orisa:/);
      expect(["Planeta", "Signo", "Elemento", "Modalidade", "Casa"]).toContain(row.factorLabel);
      expect(row.values.length).toBeGreaterThan(0);
    }
  });

  it("declara que a correspondência é hipótese do método, e não da tradição", () => {
    // Sem este aviso, o produto atribuiria às tradições uma tradução que quem
    // fez foi ele.
    expect(table.note).toBe(AUTHORIAL_NOTE);
    expect(table.note).toContain("hipótese do AstroAxe");
    expect(table.note).toContain("não afirmação das tradições");
  });

  it("não deixa escapar identificador de acervo", () => {
    for (const marcador of [
      /(?<![\w-])source:[a-z0-9-]/,
      /(?<![\w-])attribute:[a-z0-9-]/,
      /(?<![\w-])derivation:[a-z0-9-]/,
      /(?<![\w-])generated:[a-z0-9-]/,
    ])
      expect(serialized).not.toMatch(marcador);
  });

  it("não publica número de convergência", () => {
    // `0.35` seria lido como medida, e não como "hipótese de um atributo só".
    // O que sai é rótulo, pela mesma razão que o grafo de funções nunca publica
    // percentual.
    expect(serialized).not.toMatch(/convergenceStrength/);
    for (const row of table.rows) {
      expect(row.supportLabel).not.toMatch(/\d/);
      expect(row).not.toHaveProperty("convergenceStrength");
    }
  });

  it("distingue convergência de atributo único em palavras", () => {
    const rotulos = new Set(table.rows.map((row) => row.supportLabel));
    expect(rotulos.size).toBeGreaterThan(1);
  });
});
