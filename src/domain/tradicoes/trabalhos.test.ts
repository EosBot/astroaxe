import { describe, expect, it } from "vitest";

import { tradicoes } from "./catalogo";
import { todosOsTrabalhos, trabalhoById, trabalhosPorTradicao } from "./trabalhos";

describe("catálogo de trabalhos", () => {
  it("carrega sem estourar o schema", () => {
    // O schema valida na carga do módulo. Sem um teste que importe o arquivo,
    // um campo longo demais só aparece no build — foi o que aconteceu com o
    // `when` do talismã, que passou de 300 caracteres e derrubou a coleta de
    // dados da rota inteira.
    expect(todosOsTrabalhos.length).toBeGreaterThanOrEqual(6);
  });

  it("aponta para tradições que existem no catálogo", () => {
    const ids = new Set(tradicoes.map((tradicao) => tradicao.id));
    for (const trabalho of todosOsTrabalhos) expect(ids.has(trabalho.tradicaoId)).toBe(true);
  });

  it("atravessa tradições em vez de ficar numa só", () => {
    const usadas = new Set(todosOsTrabalhos.map((trabalho) => trabalho.tradicaoId));
    expect(usadas.size).toBeGreaterThanOrEqual(3);
  });

  it("sempre diz o que fazer com o que sobra", () => {
    // Procedimento que ensina a abrir e não a fechar está incompleto por
    // definição, e trabalho deixado pela metade é a origem da maior parte do
    // que depois se chama de retorno.
    for (const trabalho of todosOsTrabalhos) {
      expect(trabalho.disposal.length).toBeGreaterThan(40);
      expect(trabalho.warnings.length).toBeGreaterThanOrEqual(1);
      expect(trabalho.steps.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("avisa do risco material onde ele existe", () => {
    const defumacao = trabalhoById("trabalho:defumacao-casa");
    const firmeza = trabalhoById("trabalho:firmeza-vela");

    // Fumaça e vela fazem dano físico antes de qualquer outra coisa, e omitir
    // isso para não assustar seria negligência, e não discrição.
    expect(defumacao?.warnings.join(" ")).toMatch(/asma|respirat/i);
    expect(firmeza?.warnings.join(" ")).toMatch(/incêndio/i);
  });

  it("mantém a direção que a fonte impõe no banho e na defumação", () => {
    const banho = trabalhoById("trabalho:banho-descarrego");
    const defumacao = trabalhoById("trabalho:defumacao-casa");

    // São as duas que mais se invertem quando alguém aprende sozinho.
    expect(banho?.steps.join(" ")).toMatch(/pescoço para baixo/i);
    expect(defumacao?.steps.join(" ")).toMatch(/fundos/i);
  });

  it("encontra trabalho por id e por tradição", () => {
    expect(trabalhoById("trabalho:oferenda-exu")?.name).toContain("Oferenda");
    expect(trabalhoById("trabalho:inexistente")).toBeUndefined();
    expect(trabalhosPorTradicao("tradicao:fitoterapia").length).toBeGreaterThanOrEqual(2);
  });

  it("não repete id", () => {
    const ids = todosOsTrabalhos.map((trabalho) => trabalho.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
