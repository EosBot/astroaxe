import { describe, expect, it } from "vitest";

import type { PlanetPosition } from "./western/contracts";
import { buildSynastryReading, calculateSynastry } from "./synastry";

const body = (id: string, longitude: number): PlanetPosition => ({
  id,
  longitude,
  latitude: 0,
  speed: 1,
  retrograde: false,
  sign: "Aries",
  signDegree: longitude % 30,
});

describe("calculateSynastry", () => {
  it("returns strongest major cross-chart aspects first", () => {
    expect(calculateSynastry([body("sun", 0)], [body("moon", 120), body("venus", 93)])).toEqual([
      {
        firstBody: "sun",
        secondBody: "moon",
        firstSign: "Aries",
        secondSign: "Aries",
        type: "trígono",
        orb: 0,
      },
      {
        firstBody: "sun",
        secondBody: "venus",
        firstSign: "Aries",
        secondSign: "Aries",
        type: "quadratura",
        orb: 3,
      },
    ]);
  });

  it("includes modern points and social/transpersonal planets", () => {
    expect(calculateSynastry([body("mean_lilith", 0)], [body("mars", 0)])).toEqual([
      expect.objectContaining({
        firstBody: "mean_lilith",
        secondBody: "mars",
        type: "conjunção",
      }),
    ]);
  });

  it("builds mutable prewritten readings from bodies, signs and aspect", () => {
    const aspects = calculateSynastry([body("venus", 0)], [body("mars", 90)]);
    const reading = buildSynastryReading("Ana", "Ravi", aspects);
    const desire = reading.themes.find(({ id }) => id === "desire");
    expect(reading.title).toBe("O céu compartilhado de Ana e Ravi");
    expect(desire?.aspects[0]?.headline).toContain("Vênus de Ana em quadratura com Marte de Ravi");
    expect(desire?.aspects[0]?.livedExperience).toContain(
      "atração e desejo formam um campo magnético",
    );
    expect(desire?.aspects[0]?.meaning).toContain("A quadratura cria atrito");
  });

  it("gives extended combinations a distinct prewritten relational voice", () => {
    const aspects = calculateSynastry(
      [body("saturn", 0), body("mean_lilith", 30)],
      [body("venus", 120), body("mars", 30)],
    );
    const reading = buildSynastryReading("Lia", "Caio", aspects);
    const commitment = reading.themes.find(({ id }) => id === "commitment");
    const healing = reading.themes.find(({ id }) => id === "healing");

    expect(commitment?.aspects[0]?.livedExperience).toContain("o compromisso encontra o afeto");
    expect(
      healing?.aspects.find(({ secondBody }) => secondBody === "mars")?.livedExperience,
    ).toContain("desejo indomado e impulso");
  });
});
