import { describe, expect, it } from "vitest";

import { regencyFunctionGraph } from "./function-graph-data";
import { buildPublicFunctionGraph, PUBLIC_FUNCTION_GRAPH_VERSION } from "./public-function-graph";

describe("projeção pública do grafo de funções", () => {
  it("publica as nove funções com pergunta, ocupantes e limite da afirmação", () => {
    const publico = buildPublicFunctionGraph(regencyFunctionGraph);

    expect(publico.version).toBe(PUBLIC_FUNCTION_GRAPH_VERSION);
    expect(publico.functions).toHaveLength(9);
    for (const funcao of publico.functions) {
      expect(funcao.question.length).toBeGreaterThan(0);
      expect(funcao.occupants.length).toBeGreaterThan(0);
      // O teto do que a condensação pode afirmar, em toda função, sem exceção.
      expect(funcao.relation).toBe("ocupa a mesma função estrutural");
    }
  });

  it("não tem onde escrever escola, obra, família, locator ou confiança", () => {
    const serializado = JSON.stringify(buildPublicFunctionGraph(regencyFunctionGraph));

    // A garantia é do tipo: a projeção não possui esses campos, então nenhum
    // identificador interno pode atravessar por descuido de quem monta a tela.
    for (const marcador of ["school:", "work:", "family:", "assignment:", "Corpus local"])
      expect(serializado).not.toContain(marcador);
    expect(serializado).not.toMatch(/extractionConfidence|locator|claimSchoolId/i);
  });

  it("descreve a sustentação em rótulo, nunca em número que pareça certeza", () => {
    const publico = buildPublicFunctionGraph(regencyFunctionGraph);
    const aflicao = publico.functions.find(
      ({ functionId }) => functionId === "function:affliction-and-cure",
    );
    const ferro = publico.functions.find(
      ({ functionId }) => functionId === "function:iron-and-war-craft",
    );

    expect(aflicao?.supportLabel).toBe("duas escolas independentes chegaram à mesma posição");
    expect(ferro?.supportLabel).toBe("três ou mais escolas independentes chegaram à mesma posição");
    // Contagem de linhagens é honesta; percentual seria lido como certeza.
    expect(JSON.stringify(publico)).not.toMatch(/%|\bpercent/i);
  });

  it("mantém as categorias visíveis, que é o que impede a leitura sincrética", () => {
    const aflicao = buildPublicFunctionGraph(regencyFunctionGraph).functions.find(
      ({ functionId }) => functionId === "function:affliction-and-cure",
    );

    // Marbas e Omolu ocupam a mesma função, e o leitor vê que são coisas distintas.
    expect(aflicao?.occupants).toEqual([
      { name: "Marbas", categoryLabel: "espírito goético" },
      { name: "Omolu", categoryLabel: "Orixá" },
    ]);
  });

  it("publica a divergência de Vênus como disputa de nome, não de função", () => {
    const atracao = buildPublicFunctionGraph(regencyFunctionGraph).functions.find(
      ({ functionId }) => functionId === "function:attraction-and-concord",
    );

    expect(atracao?.divergenceNote).toBe(
      "As fontes discordam sobre qual potência ocupa o posto, e concordam sobre a função.",
    );
  });

  it("derruba a construção diante de entidade sem nome de leitura", () => {
    // O grafo real passa inteiro; é o caso adversarial que precisa falhar.
    expect(() => buildPublicFunctionGraph(regencyFunctionGraph)).not.toThrow();

    const comEntidadeNova = {
      ...regencyFunctionGraph,
      assignments: [
        ...regencyFunctionGraph.assignments,
        {
          ...regencyFunctionGraph.assignments[0]!,
          id: "assignment:entidade-sem-nome",
          entityId: "entity:sintetica:sem-nome",
          conflictsWith: [],
        },
      ],
    };

    // Omitir em silêncio faria a potência sumir da página e a função apareceria
    // com um ocupante a menos, como se aquela tradição não a sustentasse.
    expect(() => buildPublicFunctionGraph(comEntidadeNova)).toThrow(/sem nome público/);
  });
});
