// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CELESTIAL_GLYPH_IDS, CelestialGlyph, hasCelestialGlyph } from "./celestial-glyph";
import { RITUAL_SEAL_IDS, RitualSeal, hasRitualSeal, ritualSealGrounding } from "./ritual-seal";

describe("símbolos desenhados", () => {
  afterEach(cleanup);

  it("cobre todos os corpos que a roda natal exibe", () => {
    for (const body of [
      "sun",
      "moon",
      "mercury",
      "venus",
      "mars",
      "jupiter",
      "saturn",
      "uranus",
      "neptune",
      "pluto",
      "chiron",
      "true_node",
      "south_node",
      "mean_lilith",
    ])
      expect(hasCelestialGlyph(body)).toBe(true);
  });

  it("desenha vetor que herda a cor do texto, em vez de caractere de fonte", () => {
    const { container } = render(<CelestialGlyph body="mars" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("stroke")).toBe("currentColor");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(container.textContent).toBe("");
  });

  it("é decorativo: o nome do corpo acompanha em texto em todos os usos", () => {
    const { container } = render(<CelestialGlyph body="venus" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("focusable")).toBe("false");
  });

  it("não renderiza nada para corpo sem glifo desenhado", () => {
    expect(hasCelestialGlyph("planeta-x")).toBe(false);
    const { container } = render(<CelestialGlyph body="planeta-x" />);
    expect(container.firstChild).toBeNull();
  });

  it("exige fundamentação registrada em todo selo ritual", () => {
    // Nenhum selo entra sem dizer o que no acervo sustenta seus elementos.
    expect(RITUAL_SEAL_IDS.length).toBeGreaterThan(0);
    for (const id of RITUAL_SEAL_IDS) {
      const grounding = ritualSealGrounding(id);
      expect(grounding).toBeTruthy();
      expect((grounding ?? "").length).toBeGreaterThan(10);
    }
  });

  it("não renderiza selo para entidade sem fundamentação", () => {
    // Inventar traço para completar a grade é o oposto do que o método faz.
    expect(hasRitualSeal("orisa:inexistente")).toBe(false);
    const { container } = render(<RitualSeal orisaId="orisa:inexistente" />);
    expect(container.firstChild).toBeNull();
  });

  it("desenha o selo como vetor decorativo", () => {
    const { container } = render(<RitualSeal orisaId="orisa:ogum" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("stroke")).toBe("currentColor");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 64 64");
  });

  it("usa identificadores de Orixá no mesmo formato do resto do domínio", () => {
    for (const id of RITUAL_SEAL_IDS) expect(id).toMatch(/^orisa:[a-z0-9-]+$/);
    expect(CELESTIAL_GLYPH_IDS.every((id) => /^[a-z_]+$/.test(id))).toBe(true);
  });
});
