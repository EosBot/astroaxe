import { describe, expect, it } from "vitest";

import { regencyFunctionGraph } from "./function-graph-data";
import { buildFunctionIndex } from "./function-index";
import { buildPublicFunctionGraph } from "./public-function-graph";

const graph = buildPublicFunctionGraph(regencyFunctionGraph);
const index = buildFunctionIndex(graph);

describe("índice invertido de funções", () => {
  it("lista cada entidade uma vez, com todas as funções que ela ocupa", () => {
    const chaves = index.entities.map((entity) => `${entity.categoryLabel}:${entity.name}`);
    expect(new Set(chaves).size).toBe(chaves.length);

    const totalNoIndice = index.entities.reduce(
      (total, entity) => total + entity.functions.length,
      0,
    );
    const totalNoGrafo = graph.functions.reduce((total, fn) => total + fn.occupants.length, 0);
    // Inverter não pode perder nem inventar ocupação.
    expect(totalNoIndice).toBe(totalNoGrafo);
  });

  it("mostra quem mais ocupa a função, sem repetir a própria entidade", () => {
    for (const entity of index.entities)
      for (const fn of entity.functions) {
        expect(fn.others).not.toContainEqual({
          name: entity.name,
          categoryLabel: entity.categoryLabel,
        });
        const naFuncao = graph.functions.find((item) => item.functionId === fn.functionId);
        expect(fn.others).toHaveLength((naFuncao?.occupants.length ?? 0) - 1);
      }
  });

  it("carrega a categoria em todo nome, inclusive nos vizinhos de função", () => {
    // É a categoria que sustenta "posição análoga, nunca identidade". Um nome
    // solto ao lado de outro convida exatamente à leitura sincrética que o
    // método recusa.
    for (const entity of index.entities) {
      expect(entity.categoryLabel).not.toBe("");
      for (const fn of entity.functions)
        for (const other of fn.others) expect(other.categoryLabel).not.toBe("");
    }
  });

  it("preserva a nota de divergência em vez de publicar consenso que não existe", () => {
    const comDivergencia = index.entities.flatMap((entity) =>
      entity.functions.filter((fn) => fn.divergenceNote !== null),
    );
    const noGrafo = graph.functions.filter((fn) => fn.divergenceNote !== null);

    if (noGrafo.length > 0) expect(comDivergencia.length).toBeGreaterThan(0);
  });

  it("não deixa escapar marcador de acervo", () => {
    // O índice nasce da projeção pública justamente para não reabrir o que ela
    // fechou. Se alguém trocar a entrada pelo grafo cru, este teste acusa.
    const texto = JSON.stringify(index);
    for (const marcador of [
      /(?<![\w-])work:[a-z0-9-]/,
      /(?<![\w-])school:[a-z0-9-]/,
      /(?<![\w-])family:[a-z0-9-]/,
    ])
      expect(texto).not.toMatch(marcador);
  });
});
