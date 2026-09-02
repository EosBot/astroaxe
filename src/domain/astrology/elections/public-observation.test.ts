import { describe, expect, it } from "vitest";

import { resolvePlanetaryHourAt } from "@/domain/astrology/planetary-hours";

import { evaluateElections } from "./index";
import { seededElectionProfiles } from "./profiles";
import { buildPublicTimingReading, PUBLIC_TIMING_VERSION } from "./public-observation";

const SAO_PAULO = { jdUt: 2461213, latitude: -23.55, longitude: -46.63 } as const;
const SVALBARD = { jdUt: 2461213, latitude: 78.22, longitude: 15.63 } as const;

function leitura(moment: Parameters<typeof evaluateElections>[0]["moment"], polar = false) {
  return buildPublicTimingReading({
    resolution: resolvePlanetaryHourAt({
      jdUt: moment.jdUt,
      latitude: moment.latitude,
      longitude: moment.longitude,
      polarFallback: polar ? "equinoctial_local_solar" : "strict",
    }),
    observations: evaluateElections({
      profiles: [...seededElectionProfiles],
      moment: polar ? { ...moment, polarFallback: "equinoctial_local_solar" } : moment,
    }),
  });
}

describe("projeção pública da leitura de tempo", () => {
  it("mostra as obras lado a lado sem conciliar nem eleger vencedor", () => {
    const publico = leitura({ ...SAO_PAULO, sunLongitude: 90, moonLongitude: 90 });

    expect(publico.version).toBe(PUBLIC_TIMING_VERSION);
    expect(publico.observations).toHaveLength(seededElectionProfiles.length);
    // Lua nova: Heptameron e Kabbala contrariam, Agrippa não é computável. Os três
    // desfechos convivem na mesma resposta, que é o ponto.
    const porRegra = new Map(publico.observations.map((o) => [o.ruleLabel, o.status]));
    expect(porRegra.get("Lua crescente, leitura ampla")).toBe("conflicted");
    expect(porRegra.get("Lua crescente, leitura estrita")).toBe("conflicted");
    expect(porRegra.get("Planeta da operação")).toBe("unavailable");
  });

  it("não tem onde escrever locator, escola ou nota de sucesso", () => {
    const serializado = JSON.stringify(
      leitura({ ...SAO_PAULO, sunLongitude: 90, moonLongitude: 150 }),
    );

    // A regra é publicada pelo que pede, e nunca pela obra de onde veio: nomear o
    // grimório entregaria o acervo de pesquisa e exporia obra de terceiro.
    expect(serializado).not.toContain("Corpus local");
    expect(serializado).not.toMatch(/locator|sourceSystemId|school:|work:/i);
    for (const obra of ["Heptameron", "Agrippa", "Arbatel", "Kabbala", "Lemegeton", "Saraceni"])
      expect(serializado).not.toContain(obra);
    // Eleger é decisão de quem opera: não existe *campo* de nota, ranking ou
    // recomendação. A varredura é por chave, e não por prosa — o próprio aviso da
    // resposta usa a palavra "recomendação" para dizer que não faz nenhuma.
    const chaves = new Set<string>();
    JSON.parse(serializado, function (chave: string) {
      chaves.add(chave);
      // eslint-disable-next-line prefer-rest-params
      return arguments[1];
    });
    for (const proibida of ["score", "ranking", "recommendation", "rating", "best"])
      expect([...chaves].some((chave) => chave.toLowerCase().includes(proibida))).toBe(false);
  });

  it("declara a incerteza no resultado quando a hora é aproximação", () => {
    const proxy = leitura({ ...SVALBARD, sunLongitude: 90, moonLongitude: 150 }, true);

    expect(proxy.methodLabel).toContain("aproximação");
    expect(proxy.moment).not.toBeNull();
    // A incerteza viaja no resultado, não numa nota que o chamador possa ignorar.
    expect(proxy.observations.flatMap(({ limitations }) => limitations)).toContain(
      "A hora planetária é aproximação, não observação.",
    );
  });

  it("recusa inventar horário no modo estrito polar", () => {
    const estrito = leitura({ ...SVALBARD, sunLongitude: 90, moonLongitude: 150 });

    expect(estrito.moment).toBeNull();
    expect(estrito.methodLabel).toContain("não há hora planetária");
  });

  it("diz que a Lua não foi informada em vez de supor posição", () => {
    const semLua = leitura(SAO_PAULO);
    const heptameron = semLua.observations.find(
      ({ ruleId }) => ruleId === "rule:waxing-moon-broad",
    );

    expect(heptameron?.status).toBe("unavailable");
    expect(heptameron?.limitations).toContain("A posição da Lua não foi informada.");
  });
});
