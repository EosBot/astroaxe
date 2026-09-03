import { describe, expect, it } from "vitest";

import { advertenciasFor, advertenciasGerais, advertenciasPorReino } from "./advertencias";
import { quimbandaReinos } from "./reinos";

describe("advertências da Quimbanda", () => {
  it("dá advertência própria a cada um dos sete Reinos", () => {
    // Um Reino sem advertência apareceria na tela como se não cobrasse nada,
    // que é a impressão mais perigosa que este produto pode dar.
    for (const reino of quimbandaReinos) {
      const proprias = advertenciasPorReino.filter((item) => item.reinoId === reino.id);
      expect(proprias.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("sempre entrega as gerais junto das específicas", () => {
    const doReino = advertenciasFor("reino:almas");

    for (const geral of advertenciasGerais) expect(doReino).toContainEqual(geral);
    expect(doReino.some((item) => item.reinoId === "reino:almas")).toBe(true);
  });

  it("diz que a força cobra dos dois lados, e não só do alvo", () => {
    const carmica = advertenciasGerais.find(({ id }) => id === "advertencia:agentes-carmicos");

    // É o ponto que separa advertência honesta de aviso decorativo: quem chama
    // a lei chama para si também.
    expect(carmica?.body).toMatch(/lei olha para os dois lados|dívida sua/i);
  });

  it("declara que a responsabilidade não é transferível", () => {
    const conta = advertenciasGerais.find(({ id }) => id === "advertencia:conta-de-quem-abre");

    expect(conta?.body).toMatch(/lei divina/i);
    expect(conta?.body).toMatch(/não é transferível/i);
  });

  it("avisa que erro de erva faz dano material, e não só espiritual", () => {
    const matas = advertenciasPorReino.find(({ reinoId }) => reinoId === "reino:matas");

    // O Reino das Matas é o único em que o erro machuca o corpo antes de
    // qualquer outra coisa, e omitir isso seria negligência.
    expect(matas?.body).toMatch(/dano físico/i);
    expect(matas?.body).toMatch(/não substitui tratamento/i);
  });

  it("mantém advertências longas o bastante para dizer algo", () => {
    // Aviso de uma linha é aviso que ninguém lê e que não informa nada.
    for (const item of [...advertenciasGerais, ...advertenciasPorReino])
      expect(item.body.length).toBeGreaterThan(180);
  });

  it("não repete id", () => {
    const ids = [...advertenciasGerais, ...advertenciasPorReino].map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
