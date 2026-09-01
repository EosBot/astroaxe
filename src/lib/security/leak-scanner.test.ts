import { describe, expect, it } from "vitest";

import { regencyFunctionGraph } from "@/domain/orixas/regency/function-graph-data";
import { buildPublicFunctionGraph } from "@/domain/orixas/regency/public-function-graph";

import { PUBLIC_LEAK_MARKERS, scanForPublicLeaks } from "./leak-scanner";

describe("gate de não-vazamento do insumo", () => {
  it("detecta a fixture contaminada de propósito", () => {
    // Um scanner que nunca acusa é indistinguível de um scanner quebrado, e por
    // isso a primeira coisa a provar é que ele pega o que deveria pegar.
    const findings = scanForPublicLeaks([
      {
        source: "fixture-contaminada.html",
        content: "<p>Corpus local, _texto_magia_angelical_72, verbete Michael</p>",
      },
    ]);

    expect(findings.map(({ marker }) => marker).sort()).toEqual(["Corpus local", "_texto_"]);
    expect(findings[0]?.source).toBe("fixture-contaminada.html");
  });

  it("acusa identificador interno do grafo em artefato público", () => {
    const findings = scanForPublicLeaks([
      { source: "chunk.js", content: 'x={claimSchoolId:"school:saraceni"}' },
    ]);

    expect(findings.map(({ marker }) => marker)).toContain("claimSchoolId");
    expect(findings.some(({ marker }) => marker.includes("school:"))).toBe(true);
  });

  it("não acusa a obra por nomear o que ela legitimamente nomeia", () => {
    // Procurar por "Exu" ou "Heptameron" acusaria a própria obra. Os marcadores
    // são estruturais: caminho, locator e identificador interno.
    const findings = scanForPublicLeaks([
      {
        source: "pagina.html",
        content: "Exu ocupa a mesma função estrutural. O Heptameron pede Lua crescente.",
      },
    ]);

    expect(findings).toEqual([]);
  });

  it("aprova a projeção pública real do grafo", () => {
    const publico = JSON.stringify(buildPublicFunctionGraph(regencyFunctionGraph));

    expect(scanForPublicLeaks([{ source: "projecao-publica", content: publico }])).toEqual([]);
  });

  it("acusa o grafo bruto, que é justamente o que não pode ser publicado", () => {
    const bruto = JSON.stringify(regencyFunctionGraph);

    // O contraste com o teste acima é o ponto: o mesmo dado, projetado, passa; em
    // cru, não passa. É a fronteira entre insumo e obra, verificada.
    expect(scanForPublicLeaks([{ source: "grafo-bruto", content: bruto }]).length).toBeGreaterThan(
      0,
    );
  });

  it("mantém os marcadores estruturais que a fronteira exige", () => {
    for (const obrigatorio of ["Corpus local", "/mnt/e/Ocultismo", "_texto_"])
      expect(PUBLIC_LEAK_MARKERS).toContain(obrigatorio);
  });

  it("não confunde `font-family` do CSS com identificador de linhagem", () => {
    // Foi o falso positivo da primeira versão, e ele acusava todo build. Um gate
    // que sempre falha é um gate em que ninguém confia.
    const findings = scanForPublicLeaks([
      { source: "estilo.css", content: ":root{--default-font-family:var(--font-sans)}" },
    ]);

    expect(findings).toEqual([]);
  });
});
