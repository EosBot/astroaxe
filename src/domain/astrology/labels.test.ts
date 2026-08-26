import { describe, expect, it } from "vitest";

import {
  astrologicalAspectWithArticle,
  astrologicalBodyName,
  transitTechnicalSummary,
} from "./labels";

describe("rótulos astrológicos em português", () => {
  it.each([
    ["sun", "Sol"],
    ["true_node", "Nodo Norte"],
    ["mean_lilith", "Lilith média"],
    ["chiron", "Quíron"],
    ["unknown_body", "corpo celeste"],
  ])("traduz %s sem expor identificadores internos", (input, expected) => {
    expect(astrologicalBodyName(input)).toBe(expected);
  });

  it.each([
    ["conjunction", "uma conjunção"],
    ["sextile", "um sextil"],
    ["square", "uma quadratura"],
    ["trine", "um trígono"],
    ["opposition", "uma oposição"],
  ])("aplica gênero correto a %s", (input, expected) => {
    expect(astrologicalAspectWithArticle(input)).toBe(expected);
  });

  it("compõe a evidência técnica em português natural", () => {
    expect(
      transitTechnicalSummary({
        transitingBody: "sun",
        natalBody: "true_node",
        type: "sextile",
        orb: 0.55,
        relativeIntensity: 0.89,
      }),
    ).toBe(
      "Sol em trânsito forma um sextil com Nodo Norte natal. O orbe é de 0.55°, e o aspecto está a 89% do pico geométrico.",
    );
  });
});
