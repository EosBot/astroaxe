import { describe, expect, it } from "vitest";

import { electionProfileSchema, evaluateElection, evaluateElections } from "./index";
import { electionProfileGaps, seededElectionProfiles } from "./profiles";

function jd(iso: string): number {
  return Date.parse(iso) / 86_400_000 + 2_440_587.5;
}

const SAO_PAULO = { latitude: -23.55, longitude: -46.63 };
const LONGYEARBYEN = { latitude: 78.22, longitude: 15.63 };

const arbatel = seededElectionProfiles.find(
  ({ id }) => id === "profile:arbatel-planetary-governance",
)!;
const kabbala = seededElectionProfiles.find(
  ({ id }) => id === "profile:kabbala-teurgica-lua-visivel",
)!;
const agrippa = seededElectionProfiles.find(({ id }) => id === "profile:agrippa-operation-planet")!;

describe("perfis de eleição", () => {
  it("todo perfil declara sistema de origem, locator e incerteza", () => {
    for (const p of seededElectionProfiles) {
      expect(p.sourceSystemId).toMatch(/^source-system:/);
      expect(p.locator.length).toBeGreaterThan(10);
      expect(p.declaredUncertainty.length).toBeGreaterThan(10);
    }
  });

  it("recusa perfil sem locator ou sem condição alguma", () => {
    expect(() => electionProfileSchema.parse({ ...arbatel, locator: "" })).toThrow();
    expect(() =>
      electionProfileSchema.parse({
        ...arbatel,
        conditions: { required: [], forbidden: [], preferred: [] },
      }),
    ).toThrow();
  });

  it("recusa exigir e proibir a mesma condição", () => {
    expect(() =>
      electionProfileSchema.parse({
        ...arbatel,
        conditions: {
          required: [{ kind: "planetary_day", planet: "sun" }],
          forbidden: [{ kind: "planetary_day", planet: "sun" }],
          preferred: [],
        },
      }),
    ).toThrow();
  });

  it("a observação carrega versão de motor, de perfil e o locator da fonte", () => {
    const o = evaluateElection({
      profile: arbatel,
      moment: { jdUt: jd("2026-03-22T15:00:00Z"), ...SAO_PAULO },
    });
    expect(o.engineVersion).toMatch(/^election-engine-/);
    expect(o.profileVersion).toBe(arbatel.version);
    expect(o.locator).toBe(arbatel.locator);
    expect(o.declaredUncertainty).toBe(arbatel.declaredUncertainty);
  });

  it("nunca afirma sucesso: o resultado só tem estado observado", () => {
    const o = evaluateElection({
      profile: arbatel,
      moment: { jdUt: jd("2026-03-22T15:00:00Z"), ...SAO_PAULO },
    });
    expect(["matched", "conflicted", "unavailable"]).toContain(o.status);
    expect(Object.keys(o)).not.toContain("success");
    expect(Object.keys(o)).not.toContain("score");
    expect(Object.keys(o)).not.toContain("recommendation");
  });

  it("Agrippa não vira matched enquanto dignidades e figura do céu não forem computáveis", () => {
    const observacao = evaluateElection({
      profile: agrippa,
      moment: {
        jdUt: jd("2026-03-22T15:00:00Z"),
        ...SAO_PAULO,
        operationPlanet: "sun",
      },
    });

    expect(observacao.status).toBe("unavailable");
    expect(observacao.observations).toContainEqual({
      condition: expect.objectContaining({ kind: "source_requirement" }),
      role: "required",
      outcome: "indeterminate",
      reason: "condition_not_computable",
    });
  });

  it("domingo satisfaz a exigência do perfil solar; segunda a contraria", () => {
    // 2026-03-22 é domingo; 2026-03-23 é segunda.
    const domingo = evaluateElection({
      profile: arbatel,
      moment: { jdUt: jd("2026-03-22T15:00:00Z"), ...SAO_PAULO },
    });
    const segunda = evaluateElection({
      profile: arbatel,
      moment: { jdUt: jd("2026-03-23T15:00:00Z"), ...SAO_PAULO },
    });
    expect(domingo.status).toBe("matched");
    expect(segunda.status).toBe("conflicted");
  });

  it("condição lunar sem longitudes fica indeterminada, e o perfil vira indisponível", () => {
    const o = evaluateElection({
      profile: kabbala,
      moment: { jdUt: jd("2026-03-22T15:00:00Z"), ...SAO_PAULO },
    });
    expect(o.status).toBe("unavailable");
    expect(o.observations.every(({ outcome }) => outcome === "indeterminate")).toBe(true);
    expect(o.observations[0]?.reason).toBe("lunar_longitudes_missing");
    expect(o.limitations).toContain("lunar_longitudes_not_provided");
  });

  it("com as longitudes, a fase é julgada de verdade", () => {
    // Lua 60° à frente do Sol cai na fase crescente inicial.
    const o = evaluateElection({
      profile: kabbala,
      moment: {
        jdUt: jd("2026-03-22T15:00:00Z"),
        ...SAO_PAULO,
        sunLongitude: 0,
        moonLongitude: 60,
      },
    });
    expect(o.status).toBe("matched");
  });

  it("momento polar sem intervalo solar devolve indisponível, não um horário chutado", () => {
    const o = evaluateElection({
      profile: arbatel,
      moment: { jdUt: jd("2026-06-21T12:00:00Z"), ...LONGYEARBYEN, polarFallback: "strict" },
    });
    expect(o.status).toBe("unavailable");
    expect(o.limitations).toContain("solar_interval_unavailable");
    expect(o.observations.every(({ outcome }) => outcome === "indeterminate")).toBe(true);
  });

  it("o proxy equinocial rotula a aproximação nas limitações", () => {
    const o = evaluateElection({
      profile: arbatel,
      moment: {
        jdUt: jd("2026-06-21T12:00:00Z"),
        ...LONGYEARBYEN,
        polarFallback: "equinoctial_local_solar",
      },
    });
    expect(o.limitations).toContain("planetary_hour_is_equinoctial_proxy");
  });

  it("perfis divergentes aparecem lado a lado, sem conciliação", () => {
    const observacoes = evaluateElections({
      profiles: [...seededElectionProfiles],
      moment: { jdUt: jd("2026-03-23T15:00:00Z"), ...SAO_PAULO },
    });
    expect(observacoes).toHaveLength(seededElectionProfiles.length);
    expect(seededElectionProfiles.length).toBeGreaterThanOrEqual(3);
    // Sistemas distintos permanecem distintos na saída.
    expect(new Set(observacoes.map((o) => o.sourceSystemId)).size).toBe(observacoes.length);
  });

  it("as lacunas de fonte são declaradas em código, não esquecidas num comentário", () => {
    const semPerfil = new Set(electionProfileGaps.map(({ sourceSystemId }) => sourceSystemId));
    const comPerfil = new Set(seededElectionProfiles.map(({ sourceSystemId }) => sourceSystemId));
    expect(semPerfil.size).toBeGreaterThan(0);
    for (const id of semPerfil) expect(comPerfil.has(id)).toBe(false);
    for (const g of electionProfileGaps) expect(g.missing.length).toBeGreaterThan(20);
  });
});
