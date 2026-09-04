// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WindowFinder } from "./window-finder";

const CIDADE = {
  label: "Salvador, Bahia, Brasil",
  latitude: -12.9822,
  longitude: -38.4812,
  timezone: "America/Bahia",
};

const JANELA = {
  ruleId: "rule:planetary-day",
  ruleLabel: "O dia certo da semana",
  ruleSummary: "Quer que o dia da semana pertença ao planeta do seu assunto.",
  startIso: "2026-09-06T08:34:50.000Z",
  endIso: "2026-09-06T09:34:25.000Z",
  dayRuler: "Sol",
  hourRuler: "Mercúrio",
  hourNumber: 3,
  segmentLabel: "hora do dia",
};

const respostaCidade = {
  ok: true,
  status: 200,
  json: () => Promise.resolve({ places: [CIDADE] }),
};

/** Responde conforme a rota chamada, porque a tela usa duas. */
function mockRotas(janelasStatus: number, janelas: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      url.startsWith("/api/geocoding")
        ? Promise.resolve(respostaCidade)
        : Promise.resolve({
            ok: janelasStatus < 400,
            status: janelasStatus,
            json: () => Promise.resolve(janelas),
          }),
    ),
  );
}

async function escolherCidade() {
  fireEvent.change(screen.getByLabelText("Em que cidade?"), { target: { value: "Salvador" } });
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
  fireEvent.click(await screen.findByRole("button", { name: CIDADE.label }));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("WindowFinder", () => {
  it("só libera a busca depois de escolher a cidade", async () => {
    mockRotas(200, { hoursScanned: 0, truncated: false, windows: [] });
    render(<WindowFinder />);

    // Sem cidade não há latitude nem fuso, e procurar janela seria procurar no
    // céu de lugar nenhum.
    expect(screen.getByRole("button", { name: "Procurar janelas" })).toHaveProperty(
      "disabled",
      true,
    );

    await escolherCidade();
    expect(screen.getByRole("button", { name: "Procurar janelas" })).toHaveProperty(
      "disabled",
      false,
    );
  });

  it("agrupa as janelas por critério", async () => {
    mockRotas(200, { hoursScanned: 168, truncated: false, windows: [JANELA] });
    render(<WindowFinder />);
    await escolherCidade();

    fireEvent.click(screen.getByRole("button", { name: "Procurar janelas" }));

    expect(await screen.findByText("O dia certo da semana")).toBeTruthy();
    expect(screen.getByText(/168 horas planetárias/)).toBeTruthy();
  });

  it("diz que nenhuma hora atendeu, em vez de mostrar lista vazia", async () => {
    mockRotas(200, { hoursScanned: 48, truncated: false, windows: [] });
    render(<WindowFinder />);
    await escolherCidade();

    fireEvent.click(screen.getByRole("button", { name: "Procurar janelas" }));

    // Nenhuma janela é resposta, e não falha: dizer isso evita que a pessoa
    // ache que a ferramenta quebrou.
    expect(await screen.findByText(/Nenhuma hora atendeu/)).toBeTruthy();
  });

  it("avisa quando a lista foi truncada", async () => {
    mockRotas(200, { hoursScanned: 107, truncated: true, windows: [JANELA] });
    render(<WindowFinder />);
    await escolherCidade();

    fireEvent.click(screen.getByRole("button", { name: "Procurar janelas" }));

    // Truncar em silêncio faria a pessoa ler poucas janelas como se fossem
    // todas as do período.
    expect(await screen.findByText(/parou antes do fim do período/)).toBeTruthy();
  });

  it("pede conta quando não há sessão", async () => {
    mockRotas(401, {});
    render(<WindowFinder />);
    await escolherCidade();

    fireEvent.click(screen.getByRole("button", { name: "Procurar janelas" }));

    expect(await screen.findByText(/Entre na sua conta/)).toBeTruthy();
  });

  it("diz que é recurso pago quando falta plano", async () => {
    mockRotas(402, {});
    render(<WindowFinder />);
    await escolherCidade();

    fireEvent.click(screen.getByRole("button", { name: "Procurar janelas" }));

    expect(await screen.findByText(/plano pago/)).toBeTruthy();
  });

  it("não quebra quando a varredura falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url.startsWith("/api/geocoding")
          ? Promise.resolve(respostaCidade)
          : Promise.reject(new Error("rede")),
      ),
    );
    render(<WindowFinder />);
    await escolherCidade();

    fireEvent.click(screen.getByRole("button", { name: "Procurar janelas" }));

    await waitFor(() => expect(screen.getByText(/não pôde ser concluída/)).toBeTruthy());
  });
});
