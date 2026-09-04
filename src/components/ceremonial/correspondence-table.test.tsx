// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CorrespondenceTable } from "./correspondence-table";

const NOTA = "Estas correspondências são hipótese do AstroAxe, e não afirmação das tradições.";

const CORPO = {
  note: NOTA,
  rows: [
    {
      name: "Ogum",
      factorLabel: "Planeta",
      values: ["Marte"],
      supportLabel: "deriva de um único atributo",
    },
    {
      name: "Ogum",
      factorLabel: "Casa",
      values: ["3"],
      supportLabel: "vários atributos convergem para esta leitura",
    },
    {
      name: "Oxum",
      factorLabel: "Planeta",
      values: ["Vênus"],
      supportLabel: "deriva de um único atributo",
    },
  ],
};

function mockFetch(status: number, body: unknown = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) })),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("CorrespondenceTable", () => {
  it("agrupa as linhas por nome", async () => {
    mockFetch(200, CORPO);
    render(<CorrespondenceTable />);

    expect(await screen.findByText("Ogum")).toBeTruthy();
    expect(screen.getByText("Oxum")).toBeTruthy();
    // Duas linhas de Ogum, um cartão só: repetir o nome a cada fator faria a
    // tábua parecer maior do que é.
    expect(screen.getByText("2 nome(s).")).toBeTruthy();
  });

  it("declara logo no topo que a correspondência é hipótese do método", async () => {
    mockFetch(200, CORPO);
    render(<CorrespondenceTable />);
    await screen.findByText("Ogum");

    const texto = document.body.textContent ?? "";
    // Sem esse aviso, a tábua atribuiria às tradições uma tradução que quem fez
    // foi o método. Ele vem antes da busca e antes das linhas.
    expect(texto.indexOf("hipótese do AstroAxe")).toBeLessThan(texto.indexOf("Ogum"));
  });

  it("filtra por nome", async () => {
    mockFetch(200, CORPO);
    render(<CorrespondenceTable />);
    await screen.findByText("Ogum");

    fireEvent.change(screen.getByLabelText("Um nome"), { target: { value: "oxum" } });

    expect(screen.getByText("1 nome(s).")).toBeTruthy();
    expect(screen.queryByText("Ogum")).toBeNull();
  });

  it("avisa quando a busca não encontra nada", async () => {
    mockFetch(200, CORPO);
    render(<CorrespondenceTable />);
    await screen.findByText("Ogum");

    fireEvent.change(screen.getByLabelText("Um nome"), { target: { value: "zzz" } });

    expect(screen.getByText("Nenhum nome corresponde.")).toBeTruthy();
  });

  it("pede conta quando não há sessão", async () => {
    mockFetch(401);
    render(<CorrespondenceTable />);

    expect(await screen.findByText(/Entre na sua conta/)).toBeTruthy();
  });

  it("diz que é recurso pago quando falta plano", async () => {
    mockFetch(402);
    render(<CorrespondenceTable />);

    expect(await screen.findByText(/plano pago/)).toBeTruthy();
  });

  it("não quebra quando a busca falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("rede"))),
    );
    render(<CorrespondenceTable />);

    await waitFor(() => expect(screen.getByText(/não pôde ser carregada/)).toBeTruthy());
  });
});
