import { describe, expect, it } from "vitest";

import { instantFromWallClock } from "./zoned-instant";

describe("instante a partir da hora de parede", () => {
  it("aplica o deslocamento do lugar", () => {
    expect(
      instantFromWallClock({ date: "2026-06-21", time: "15:00", timeZone: "America/Sao_Paulo" }),
    ).toBe("2026-06-21T18:00:00.000Z");
  });

  it("acerta fuso adiantado em relação a Greenwich", () => {
    expect(
      instantFromWallClock({ date: "2026-06-21", time: "09:00", timeZone: "Asia/Tokyo" }),
    ).toBe("2026-06-21T00:00:00.000Z");
  });

  it("respeita o horário de verão vigente na data, e não o do dia de hoje", () => {
    // Nova York em julho está a -4; em janeiro, a -5. Um deslocamento fixo
    // erraria a hora planetária em metade do ano.
    expect(
      instantFromWallClock({ date: "2026-07-15", time: "12:00", timeZone: "America/New_York" }),
    ).toBe("2026-07-15T16:00:00.000Z");
    expect(
      instantFromWallClock({ date: "2026-01-15", time: "12:00", timeZone: "America/New_York" }),
    ).toBe("2026-01-15T17:00:00.000Z");
  });

  it("resolve a hora repetida da volta do horário de verão de forma estável", () => {
    // Em 1º/11/2026 o relógio de Nova York volta de 2h para 1h, e 01:30 local
    // acontece duas vezes. Não existe resposta certa: existe resposta estável.
    const primeira = instantFromWallClock({
      date: "2026-11-01",
      time: "01:30",
      timeZone: "America/New_York",
    });
    expect(
      instantFromWallClock({ date: "2026-11-01", time: "01:30", timeZone: "America/New_York" }),
    ).toBe(primeira);
  });

  it("recusa data ou hora ilegível em vez de devolver instante inventado", () => {
    expect(() =>
      instantFromWallClock({ date: "21/06/2026", time: "15:00", timeZone: "America/Sao_Paulo" }),
    ).toThrow("wall_clock_invalid");
  });

  it("mantém meia-noite no dia certo", () => {
    // O componente de hora pode chegar como 24 em vez de 0 conforme o ambiente,
    // e sem tratar isso a meia-noite escorregaria um dia inteiro.
    expect(
      instantFromWallClock({ date: "2026-03-10", time: "00:00", timeZone: "America/Sao_Paulo" }),
    ).toBe("2026-03-10T03:00:00.000Z");
  });
});
