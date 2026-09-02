import { julianDay } from "caelus";
import { describe, expect, it } from "vitest";

import { seededElectionProfiles } from "./profiles";
import { scanCeremonialWindows, WINDOW_SCAN_VERSION } from "./window-scan";

/** Salvador, para ter nascer e pôr do sol todos os dias do ano. */
const SALVADOR = { latitude: -12.9822, longitude: -38.4812 };

function scan(days: number, limit = 200) {
  const from = julianDay(2026, 6, 21, 0, 0, 0);
  return scanCeremonialWindows({
    scan: { ...SALVADOR, fromJdUt: from, toJdUt: from + days, limit },
    profiles: seededElectionProfiles,
  });
}

describe("varredura de janelas cerimoniais", () => {
  it("encontra horas que atendem aos critérios num período", () => {
    // Dois dias com teto folgado: 48 horas planetárias e no máximo 192
    // janelas, então a varredura chega ao fim do período sem truncar.
    const resultado = scan(2);

    expect(resultado.version).toBe(WINDOW_SCAN_VERSION);
    expect(resultado.windows.length).toBeGreaterThan(0);
    // Dois dias têm 48 horas planetárias; a varredura não pode andar por
    // relógio comum nem pular dias.
    expect(resultado.hoursScanned).toBeGreaterThanOrEqual(44);
    expect(resultado.truncated).toBe(false);
  });

  it("devolve horas dentro do período pedido, e não fora dele", () => {
    const from = julianDay(2026, 6, 21, 0, 0, 0);
    const resultado = scan(3);

    for (const janela of resultado.windows) {
      expect(janela.endJdUt).toBeGreaterThan(from - 1);
      expect(janela.startJdUt).toBeLessThan(from + 4);
      expect(janela.endJdUt).toBeGreaterThan(janela.startJdUt);
    }
  });

  it("não funde critérios: a mesma hora aparece uma vez por regra que atende", () => {
    const resultado = scan(30);
    const porHora = new Map<number, string[]>();
    for (const janela of resultado.windows)
      porHora.set(janela.startJdUt, [...(porHora.get(janela.startJdUt) ?? []), janela.profileId]);

    // Fundir esconderia a convergência entre tradições, que é justamente o dado
    // que o produto existe para mostrar.
    const comMaisDeUmCriterio = [...porHora.values()].filter((ids) => ids.length > 1);
    expect(comMaisDeUmCriterio.length).toBeGreaterThan(0);
    for (const ids of porHora.values()) expect(new Set(ids).size).toBe(ids.length);
  });

  it("respeita o teto de janelas e declara que truncou", () => {
    const resultado = scan(30, 5);

    expect(resultado.windows).toHaveLength(5);
    // Truncar em silêncio faria a pessoa ler cinco janelas como se fossem todas
    // as do período.
    expect(resultado.truncated).toBe(true);
  });

  it("percorre o período inteiro sem repetir a mesma hora", () => {
    const resultado = scan(10);
    const chaves = resultado.windows.map(
      (janela) => `${janela.profileId}:${janela.startJdUt.toFixed(6)}`,
    );

    // Um passo mal calculado reencontraria a mesma hora para sempre; o teste
    // falha antes de o laço travar em produção.
    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it("recusa período invertido em vez de varrer para trás", () => {
    const from = julianDay(2026, 6, 21, 0, 0, 0);
    expect(() =>
      scanCeremonialWindows({
        scan: { ...SALVADOR, fromJdUt: from, toJdUt: from - 5 },
        profiles: seededElectionProfiles,
      }),
    ).toThrow();
  });

  it("não trava onde o Sol não nasce nem se põe", () => {
    // Svalbard em junho: sol da meia-noite, sem intervalo solar. Sem o avanço
    // por dia, o laço andaria para sempre sem consumir o período.
    const from = julianDay(2026, 6, 21, 0, 0, 0);
    const resultado = scanCeremonialWindows({
      scan: { latitude: 78.22, longitude: 15.63, fromJdUt: from, toJdUt: from + 5 },
      profiles: seededElectionProfiles,
    });

    expect(resultado.windows).toEqual([]);
    expect(resultado.hoursScanned).toBeLessThanOrEqual(6);
  });
});
