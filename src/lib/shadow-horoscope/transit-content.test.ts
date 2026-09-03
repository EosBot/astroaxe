import { describe, expect, it } from "vitest";

import { shadowTransitContent } from "./transit-content";

const baseTransit = {
  transitingBody: "saturn",
  natalBody: "sun",
  type: "square",
  orb: 1.25,
  applying: true,
  relativeIntensity: 0.82,
};

describe("shadowTransitContent", () => {
  it("is deterministic and identifies its versioned editorial matrix", () => {
    const first = shadowTransitContent(baseTransit);
    const second = shadowTransitContent({ ...baseTransit });

    expect(second).toEqual(first);
    expect(first.version).toBe("shadow-transits-2.0.0");
    expect(first.reviewer.attributionLine).toContain("corpo, campo natal, aspecto");
  });

  it("changes the mechanism and daily scene with the transiting body", () => {
    const saturn = shadowTransitContent(baseTransit);
    const venus = shadowTransitContent({ ...baseTransit, transitingBody: "venus" });

    expect(saturn.title).toBe("O controle vestiu uniforme de responsabilidade");
    expect(saturn.deepening).toContain("ninguém ajuda");
    expect(venus.title).toBe("O afeto começou a emitir fatura");
    expect(venus.deepening).toContain("recibos emocionais");
    expect(venus.opening).not.toBe(saturn.opening);
  });

  it("changes the exposed field with the natal body", () => {
    const sun = shadowTransitContent(baseTransit);
    const moon = shadowTransitContent({ ...baseTransit, natalBody: "moon" });

    expect(sun.opening).toContain("identidade");
    expect(moon.opening).toContain("mundo emocional");
    expect(moon.reflectionPrompt).toContain("cobrança, retraimento ou teste");
  });

  it("distinguishes friction, ease and projection by aspect", () => {
    const square = shadowTransitContent(baseTransit);
    const trine = shadowTransitContent({ ...baseTransit, type: "trine" });
    const opposition = shadowTransitContent({ ...baseTransit, type: "opposition" });

    expect(square.deepening).toContain("cria atrito");
    expect(trine.deepening).toContain("correr com tanta facilidade");
    expect(opposition.deepening).toContain("projeta um polo no ambiente");
  });

  it("describes phase and intensity without fatalism", () => {
    const approaching = shadowTransitContent(baseTransit);
    const intermediate = shadowTransitContent({ ...baseTransit, relativeIntensity: 0.5 });
    const separating = shadowTransitContent({
      ...baseTransit,
      applying: false,
      relativeIntensity: 0.1,
    });

    expect(approaching.deepening).toContain("ainda se aproxima do pico");
    expect(approaching.deepening).toContain("pouco espaço para fingir");
    expect(intermediate.deepening).toContain("intensidade intermediária");
    expect(separating.deepening).toContain("O pico já passou");
    expect(separating.deepening).toContain("A intensidade é sutil");
    expect(separating.deepening).toContain("não uma sentença");
  });

  it("stays explicit when a future body, natal point or aspect has no authored voice yet", () => {
    const content = shadowTransitContent({
      ...baseTransit,
      transitingBody: "future_body",
      natalBody: "future_point",
      type: "future_aspect",
    });

    expect(content.title).toBe("corpo celeste trouxe um mecanismo para a luz");
    expect(content.opening).toContain("o campo natal ligado a corpo celeste");
    expect(content.deepening).toContain("coloca as duas funções em contato");
    expect(content.practice).toContain("registre gatilho");
  });
});
