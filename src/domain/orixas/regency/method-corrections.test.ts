import { describe, expect, it } from "vitest";

import {
  listMethodCorrections,
  methodCorrectionSchema,
  regencyMethodCorrections,
} from "./method-corrections";

describe("registro de correções do método", () => {
  it("lista da mais recente para a mais antiga", () => {
    const dates = listMethodCorrections().map(({ recordedOn }) => recordedOn);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("exige identificador único por correção", () => {
    const ids = regencyMethodCorrections.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("exige causa e consequência declaradas, não só o que mudou", () => {
    for (const correction of regencyMethodCorrections) {
      expect(correction.why.length).toBeGreaterThan(0);
      expect(correction.consequence.length).toBeGreaterThan(0);
    }
  });

  it("recusa entrada sem motivo", () => {
    expect(() =>
      methodCorrectionSchema.parse({
        id: "correction:sem-motivo",
        recordedOn: "2026-08-27",
        area: "escopo",
        whatChanged: "algo mudou",
        why: "",
        consequence: "nenhuma",
      }),
    ).toThrow();
  });

  it("recusa data fora do formato ISO", () => {
    expect(() =>
      methodCorrectionSchema.parse({ ...regencyMethodCorrections[0], recordedOn: "27/08/2026" }),
    ).toThrow();
  });

  it("registra a correção que reduziu a convergência aparente", () => {
    const lineage = regencyMethodCorrections.find(
      ({ id }) => id === "correction:lineage-not-edition",
    );
    expect(lineage?.area).toBe("proveniência");
    expect(lineage?.consequence).toMatch(/menos convergência/);
  });
});
