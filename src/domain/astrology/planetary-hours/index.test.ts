import { describe, expect, it } from "vitest";

import {
  CLASSICAL_PLANETS,
  chaldeanHourRuler,
  resolvePlanetaryHourAt,
  resolvePlanetaryHourInInterval,
} from "./index";

/** Dia juliano em UT a partir de um instante ISO — mantém os casos legíveis. */
function jd(iso: string): number {
  return Date.parse(iso) / 86_400_000 + 2_440_587.5;
}

const SAO_PAULO = { latitude: -23.55, longitude: -46.63 };
const REYKJAVIK = { latitude: 64.14, longitude: -21.94 };
const LONGYEARBYEN = { latitude: 78.22, longitude: 15.63 };

describe("horas planetárias", () => {
  it("é determinística: o mesmo instante devolve sempre o mesmo resultado", () => {
    const entrada = { jdUt: jd("2026-03-21T15:00:00Z"), ...SAO_PAULO };
    expect(resolvePlanetaryHourAt(entrada)).toEqual(resolvePlanetaryHourAt(entrada));
  });

  it("resolve dia e noite nos dois hemisférios", () => {
    for (const lugar of [SAO_PAULO, REYKJAVIK]) {
      for (const instante of ["2026-03-21T15:00:00Z", "2026-03-21T03:00:00Z"]) {
        const r = resolvePlanetaryHourAt({ jdUt: jd(instante), ...lugar });
        expect(r.method).toBe("observed_solar");
        expect(r.reading?.segment === "day" || r.reading?.segment === "night").toBe(true);
        expect(r.reading?.hourNumber).toBeGreaterThanOrEqual(1);
        expect(r.reading?.hourNumber).toBeLessThanOrEqual(12);
        expect(r.reading?.intervalProgress).toBeGreaterThanOrEqual(0);
        expect(r.reading?.intervalProgress).toBeLessThanOrEqual(1);
      }
    }
  });

  it("a primeira hora do dia é regida pelo regente do dia", () => {
    for (const dayRuler of CLASSICAL_PLANETS)
      expect(chaldeanHourRuler(dayRuler, "day", 1)).toBe(dayRuler);
  });

  it("a sequência caldaica avança um planeta por hora e continua na noite", () => {
    // Domingo é do Sol; a segunda hora diurna cabe a Vênus, que o segue na ordem.
    expect(chaldeanHourRuler("sun", "day", 1)).toBe("sun");
    expect(chaldeanHourRuler("sun", "day", 2)).toBe("venus");
    expect(chaldeanHourRuler("sun", "day", 3)).toBe("mercury");
    // A primeira hora noturna é a décima terceira da contagem, não um reinício.
    expect(chaldeanHourRuler("sun", "night", 1)).toBe("jupiter");
    // Vinte e cinco horas depois, a sequência volta ao ponto seguinte: o dia
    // seguinte é regido pelo planeta a duas posições do anterior.
    expect(chaldeanHourRuler("sun", "night", 12)).toBe("mercury");
  });

  it("divide o intervalo em doze horas desiguais", () => {
    const base = {
      instant: "2026-03-21T06:00:00Z",
      intervalStart: "2026-03-21T06:00:00Z",
      intervalEnd: "2026-03-21T18:00:00Z",
      segment: "day" as const,
      dayRuler: "sun" as const,
    };
    expect(resolvePlanetaryHourInInterval(base).hourNumber).toBe(1);
    expect(
      resolvePlanetaryHourInInterval({ ...base, instant: "2026-03-21T12:00:00Z" }).hourNumber,
    ).toBe(7);
    // O último instante ainda pertence à décima segunda hora, não à décima terceira.
    expect(
      resolvePlanetaryHourInInterval({ ...base, instant: "2026-03-21T17:59:59Z" }).hourNumber,
    ).toBe(12);
  });

  it("no modo estrito, latitude polar devolve indisponível em vez de inventar horário", () => {
    const r = resolvePlanetaryHourAt({
      jdUt: jd("2026-06-21T12:00:00Z"),
      ...LONGYEARBYEN,
      polarFallback: "strict",
    });
    expect(r.method).toBe("unavailable");
    expect(r.limitation).toBe("solar_interval_unavailable");
    expect(r.reading).toBeUndefined();
  });

  it("o proxy equinocial devolve leitura, mas rotulada como aproximação", () => {
    const r = resolvePlanetaryHourAt({
      jdUt: jd("2026-06-21T12:00:00Z"),
      ...LONGYEARBYEN,
      polarFallback: "equinoctial_local_solar",
    });
    // A incerteza vai no resultado, não numa nota de rodapé que o chamador pode ignorar.
    expect(r.method).toBe("equinoctial_local_solar_proxy");
    expect(r.limitation).toBe("solar_interval_unavailable");
    expect(r.reading?.hourNumber).toBeGreaterThanOrEqual(1);
    expect(r.reading?.hourNumber).toBeLessThanOrEqual(12);
  });

  it("recusa coordenada fora de faixa em vez de calcular com lixo", () => {
    expect(() =>
      resolvePlanetaryHourAt({ jdUt: jd("2026-03-21T12:00:00Z"), latitude: 91, longitude: 0 }),
    ).toThrow();
    expect(() =>
      resolvePlanetaryHourAt({ jdUt: jd("2026-03-21T12:00:00Z"), latitude: 0, longitude: 181 }),
    ).toThrow();
  });

  it("não lê o relógio: nenhuma saída depende do instante da execução", () => {
    const antes = resolvePlanetaryHourAt({ jdUt: jd("1985-11-04T09:30:00Z"), ...SAO_PAULO });
    const depois = resolvePlanetaryHourAt({ jdUt: jd("1985-11-04T09:30:00Z"), ...SAO_PAULO });
    expect(antes).toEqual(depois);
    expect(antes.reading?.dayRuler).toBeDefined();
  });
});
