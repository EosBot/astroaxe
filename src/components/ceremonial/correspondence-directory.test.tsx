// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CorrespondenceDirectory } from "./correspondence-directory";

const FUNCAO = {
  functionId: "function:iron-and-war-craft",
  label: "Ferro, forja e ofício da guerra",
  question: "Quem responde pelo ferro e pelo enfrentamento?",
  supportLabel: "três ou mais escolas independentes chegaram à mesma posição",
  independentLineages: 6,
};

const CORPO = {
  entities: [
    {
      name: "Ogum",
      categoryLabel: "Orixá",
      functions: [
        { ...FUNCAO, divergenceNote: null, others: [{ name: "Camael", categoryLabel: "anjo" }] },
      ],
    },
    {
      name: "Camael",
      categoryLabel: "anjo",
      functions: [
        {
          ...FUNCAO,
          divergenceNote: "As fontes discordam sobre qual potência ocupa o posto.",
          others: [{ name: "Ogum", categoryLabel: "Orixá" }],
        },
      ],
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

describe("CorrespondenceDirectory", () => {
  it("lista as entidades com a função que ocupam", async () => {
    mockFetch(200, CORPO);
    render(<CorrespondenceDirectory />);

    expect(await screen.findByText("2 de 2 nomes.")).toBeTruthy();
    expect(screen.getAllByText("Ferro, forja e ofício da guerra")).toHaveLength(2);
  });

  it("mostra quem mais ocupa a posição, sempre com a categoria", async () => {
    mockFetch(200, CORPO);
    render(<CorrespondenceDirectory />);
    await screen.findByText("2 de 2 nomes.");

    // A categoria ao lado do nome é o que sustenta posição análoga em vez de
    // identidade: um Orixá e um anjo na mesma linha, sem ela, convidariam à
    // leitura sincrética que o método recusa.
    expect(screen.getByText("Camael · anjo")).toBeTruthy();
    expect(screen.getByText("Ogum · Orixá")).toBeTruthy();
  });

  it("publica a nota de divergência quando existe", async () => {
    mockFetch(200, CORPO);
    render(<CorrespondenceDirectory />);
    await screen.findByText("2 de 2 nomes.");

    expect(screen.getByText(/discordam sobre qual potência/)).toBeTruthy();
  });

  it("filtra por nome", async () => {
    mockFetch(200, CORPO);
    render(<CorrespondenceDirectory />);
    await screen.findByText("2 de 2 nomes.");

    fireEvent.change(screen.getByLabelText("Um nome"), { target: { value: "ogum" } });

    expect(screen.getByText("1 de 2 nomes.")).toBeTruthy();
  });

  it("filtra por tradição", async () => {
    mockFetch(200, CORPO);
    render(<CorrespondenceDirectory />);
    await screen.findByText("2 de 2 nomes.");

    fireEvent.change(screen.getByLabelText("De que tradição"), { target: { value: "anjo" } });

    expect(screen.getByText("1 de 2 nomes.")).toBeTruthy();
  });

  it("pede conta quando não há sessão", async () => {
    mockFetch(401);
    render(<CorrespondenceDirectory />);

    expect(await screen.findByText(/Entre na sua conta/)).toBeTruthy();
  });

  it("não quebra quando a busca falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("rede"))),
    );
    render(<CorrespondenceDirectory />);

    await waitFor(() => expect(screen.getByText(/não pôde ser carregado/)).toBeTruthy());
  });
});
