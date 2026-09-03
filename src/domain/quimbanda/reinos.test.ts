import { describe, expect, it } from "vitest";

import {
  namedEntities,
  quimbandaReinos,
  QUIMBANDA_REINOS_VERSION,
  reinoById,
  reinosWithPlanetaryRegency,
} from "./reinos";

describe("Reinos da Quimbanda", () => {
  it("tem os sete Reinos, e não seis nem oito", () => {
    // A estrutura é setenária por fundamento. Publicar seis como se fossem sete
    // seria a mentira mais fácil de contar aqui, e a mais difícil de perceber
    // de fora.
    expect(quimbandaReinos).toHaveLength(7);
    expect(QUIMBANDA_REINOS_VERSION).toMatch(/^quimbanda-reinos-/);
  });

  it("dá a cada Reino um Exu Rei e uma Pombagira Rainha", () => {
    for (const reino of quimbandaReinos) {
      expect(reino.king).not.toBe("");
      expect(reino.queen).not.toBe("");
      expect(reino.domain.length).toBeGreaterThan(80);
    }
  });

  it("liga todos os sete ao motor de horas planetárias", () => {
    // Enquanto só Almas e Cruzeiros tinham planeta, a ponte com o buscador de
    // janelas valia para dois Reinos. Com a tabela do terreiro inteira, vale
    // para o sistema — e é isso que faz Quimbanda e astrologia se encontrarem.
    expect(reinosWithPlanetaryRegency()).toHaveLength(7);

    const planetas = quimbandaReinos.map((reino) => reino.planet).sort();
    // Sete Reinos, sete planetas sagrados, sem repetição: se dois Reinos
    // passarem a dividir planeta, a correspondência foi copiada errado.
    expect(new Set(planetas).size).toBe(7);
  });

  it("mantém a correspondência que a fonte declara em texto", () => {
    // Kalunga é o caso que eu quase deduzi por posição no desenho. A apostila
    // diz com todas as letras: Sephirah Binah, Saturno.
    expect(reinoById("reino:kalunga-pequena")).toMatchObject({
      planet: "saturn",
      sephirah: "Binah",
    });
    expect(reinoById("reino:almas")).toMatchObject({ planet: "mars", sephirah: "Geburah" });
    expect(reinoById("reino:cruzeiros")).toMatchObject({ planet: "jupiter", sephirah: "Chesed" });
    expect(reinoById("reino:lira")).toMatchObject({ planet: "sun", sephirah: "Tiphereth" });
  });

  it("nomeia as legiões com seus dois chefes", () => {
    const legioes = quimbandaReinos.flatMap((reino) => reino.legions);
    expect(legioes.length).toBeGreaterThanOrEqual(60);
    for (const legiao of legioes) {
      expect(legiao.exu).not.toBe("");
      expect(legiao.pombagira).not.toBe("");
    }
  });

  it("expõe as entidades nomeadas com o Reino a que pertencem", () => {
    const entidades = namedEntities();
    const zePilintra = entidades.find(({ name }) => name.includes("Zé Pilintra"));

    // Um nome solto, sem o Reino e a legião, obrigaria quem consulta a
    // adivinhar onde aquela entidade trabalha.
    expect(zePilintra).toMatchObject({ reino: "Reino da Lira", legion: "Malandros" });
    for (const entidade of entidades) expect(entidade.reino).not.toBe("");
  });

  it("não repete id de Reino", () => {
    const ids = quimbandaReinos.map((reino) => reino.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
