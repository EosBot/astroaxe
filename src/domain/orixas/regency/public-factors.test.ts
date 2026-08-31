import { describe, expect, it } from "vitest";

import { describeRegencyFactor, describeRegencyFactors } from "./public-factors";

describe("fatores públicos da regência", () => {
  it("traduz os fatos astrológicos para linguagem de leitura", () => {
    expect(describeRegencyFactor("angle:ascendant:sign:aries")).toBe("Ascendente em Áries");
    expect(describeRegencyFactor("angle:imum_coeli:sign:capricorn")).toBe(
      "Fundo do Céu em Capricórnio",
    );
    expect(describeRegencyFactor("planet:mars:angularity")).toBe("Marte angular");
    expect(describeRegencyFactor("planet:mercury:retrograde")).toBe("Mercúrio retrógrado");
    expect(describeRegencyFactor("planet:sun:dignity:domicile")).toBe("Sol em domicílio");
    expect(describeRegencyFactor("planet:venus:house:7")).toBe("Vênus na casa 7");
    expect(describeRegencyFactor("aspect:sun:trine:moon")).toBe("Sol em trígono com Lua");
    expect(describeRegencyFactor("birth:planetary-day:mars")).toBe("Nascimento em dia de Marte");
    expect(describeRegencyFactor("birth:planetary-hour:5:venus")).toBe(
      "Nascimento em hora de Vênus",
    );
  });

  it("descarta chave desconhecida em vez de inventar rótulo genérico", () => {
    // Um "fator astrológico" sem dizer qual seria ruído com cara de explicação.
    expect(describeRegencyFactor("planet:mars:algo-novo")).toBeNull();
    expect(describeRegencyFactor("categoria-inexistente:x:y")).toBeNull();
    expect(describeRegencyFactor("angle:vertex:sign:aries")).toBeNull();
  });

  it("não devolve a resposta que a pessoa deu no autorrelato", () => {
    const label = describeRegencyFactor("self-report:lens-a:reconhece-fortemente");
    expect(label).toBe("Movimento simbólico que você reconheceu");
    expect(label).not.toContain("reconhece-fortemente");
  });

  it("ordena por peso e devolve só os rótulos", () => {
    const factors = describeRegencyFactors([
      { featureKey: "planet:mars:angularity", amount: 1 },
      { featureKey: "angle:ascendant:sign:aries", amount: 9 },
      { featureKey: "planet:sun:dignity:domicile", amount: 5 },
    ]);
    expect(factors).toEqual(["Ascendente em Áries", "Sol em domicílio", "Marte angular"]);
  });

  it("colapsa rótulos repetidos para não sugerir dupla sustentação", () => {
    const factors = describeRegencyFactors([
      { featureKey: "planet:mars:angularity", amount: 9 },
      { featureKey: "planet:mars:angularity", amount: 8 },
      { featureKey: "planet:mars:retrograde", amount: 7 },
    ]);
    expect(factors).toEqual(["Marte angular", "Marte retrógrado"]);
  });

  it("respeita o limite de fatores exibidos", () => {
    const many = [
      "angle:ascendant:sign:aries",
      "planet:mars:angularity",
      "planet:sun:dignity:domicile",
      "planet:venus:house:7",
      "planet:mercury:retrograde",
    ].map((featureKey, index) => ({ featureKey, amount: 10 - index }));
    expect(describeRegencyFactors(many)).toHaveLength(4);
    expect(describeRegencyFactors(many, 2)).toHaveLength(2);
  });

  it("nunca expõe identificador de regra, peso ou fonte estrutural", () => {
    const factors = describeRegencyFactors([
      { featureKey: "angle:ascendant:sign:aries", amount: 4 },
      { featureKey: "planet:mars:angularity", amount: 3 },
    ]);
    const joined = factors.join(" ");
    for (const leak of ["front-", "head-", "back-", "rule", "source:", "family:", "school:"])
      expect(joined).not.toContain(leak);
    expect(joined).not.toMatch(/\b\d+(\.\d+)?\s*(pts?|peso)\b/);
  });
});
