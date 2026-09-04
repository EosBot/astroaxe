import { describe, expect, it } from "vitest";

import { SIGN_SHADOW_PROFILES } from "./sign-profiles";
import {
  SHADOW_NATAL_VERSION,
  shadowAngleContent,
  shadowAspectContent,
  shadowNatalContent,
  type ShadowNatalBody,
} from "./natal-content";

const bodies: readonly ShadowNatalBody[] = [
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
];

const forbiddenFragments = [
  /\.\./u,
  /leva a para você/iu,
  /através de para você/iu,
  /\bno carreira\b/iu,
  /\bna recursos\b/iu,
  /Dica de integração:/u,
];

function expectEditoriallyClean(texts: readonly string[]): void {
  const joined = texts.join("\n");
  for (const forbidden of forbiddenFragments) expect(joined).not.toMatch(forbidden);
  expect(new Set(texts).size).toBe(texts.length);
  for (const text of texts) {
    expect(text).toBe(text.trim());
    expect(text).toMatch(/[.!?…]$/u);
  }
}

describe("shadowNatalContent", () => {
  it("composes every supported sign, body and house without broken grammar or repeated blocks", () => {
    for (const sign of Object.keys(SIGN_SHADOW_PROFILES)) {
      for (const body of bodies) {
        for (let house = 1; house <= 12; house += 1) {
          const reading = shadowNatalContent({
            body,
            sign,
            degree: 12.34,
            house,
            retrograde: false,
          });

          expect(reading.version).toBe(SHADOW_NATAL_VERSION);
          expect(reading.blocks.map(({ label }) => label)).toEqual([
            "Mecanismo",
            "Manifestação",
            "Custo",
            "Integração",
          ]);
          expectEditoriallyClean(reading.blocks.map(({ text }) => text));
        }
      }
    }
  });

  it("is deterministic and adds a single explicit retrograde block", () => {
    const input = {
      body: "saturn" as const,
      sign: "Capricórnio",
      degree: 18.2,
      house: 10,
      retrograde: true,
    };

    const first = shadowNatalContent(input);
    expect(shadowNatalContent({ ...input })).toEqual(first);
    expect(first.position).toContain("retrógrado");
    expect(first.blocks.filter(({ label }) => label === "Revisão")).toHaveLength(1);
    expectEditoriallyClean(first.blocks.map(({ text }) => text));
  });

  it("composes both timed angles without punctuation artifacts", () => {
    const ascendant = shadowAngleContent("ascendant", 124.5);
    const midheaven = shadowAngleContent("midheaven", 278.25);

    expect(ascendant.position).toBe("Ascendente em Leão · 4.50°");
    expect(midheaven.position).toBe("Meio do Céu em Capricórnio · 8.25°");
    expectEditoriallyClean([
      ...ascendant.blocks.map(({ text }) => text),
      ...midheaven.blocks.map(({ text }) => text),
    ]);
  });

  it("varies natal aspect dynamics and keeps intensity qualified", () => {
    const square = shadowAspectContent({
      a: "mars",
      b: "sun",
      type: "square",
      orb: 1.2,
      strength: 0.9,
    });
    const trine = shadowAspectContent({
      a: "venus",
      b: "moon",
      type: "trine",
      orb: 5.5,
      strength: 0.25,
    });

    expect(square.blocks[0]?.text).toContain("atrito");
    expect(square.blocks[1]?.text).toContain("especialmente nítida");
    expect(trine.blocks[0]?.text).toContain("fluidez");
    expect(trine.blocks[1]?.text).toContain("não deve ser tratada");
    expectEditoriallyClean([
      ...square.blocks.map(({ text }) => text),
      ...trine.blocks.map(({ text }) => text),
    ]);
  });
});
