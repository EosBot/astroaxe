// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WorksGuide } from "./works-guide";

const TRABALHO = {
  id: "trabalho:banho-descarrego",
  tradicaoId: "tradicao:fitoterapia",
  tradicaoNome: "Ervas, banhos e defumação",
  name: "Banho de descarrego",
  purpose: "Tirar de cima o que ficou grudado depois de ambiente carregado.",
  planet: null,
  when: "À noite, antes de dormir.",
  materials: ["arruda", "guiné"],
  steps: [
    "Ferver a água e desligar o fogo antes de pôr a folha.",
    "Despejar do pescoço para baixo.",
  ],
  warnings: ["Erva errada faz dano físico, e não apenas espiritual."],
  disposal: "As folhas usadas vão para fora de casa, na terra.",
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

describe("WorksGuide", () => {
  it("lista os trabalhos com a tradição de cada um", async () => {
    mockFetch(200, { trabalhos: [TRABALHO] });
    render(<WorksGuide />);

    expect(await screen.findByText("Banho de descarrego")).toBeTruthy();
    // A tradição aparece duas vezes: como opção do filtro e como procedência no
    // cartão. As duas importam — sem a do cartão, quem lê não sabe de onde vem
    // o que está prestes a fazer.
    expect(screen.getAllByText("Ervas, banhos e defumação")).toHaveLength(2);
  });

  it("mantém o preparo fechado até alguém pedir", async () => {
    mockFetch(200, { trabalhos: [TRABALHO] });
    render(<WorksGuide />);
    await screen.findByText("Banho de descarrego");

    // Seis procedimentos despejados de uma vez é o oposto de guia: a pessoa
    // escolhe o que vai ler.
    expect(screen.queryByText("O que se usa")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Ver o preparo completo" }));
    expect(screen.getByText("O que se usa")).toBeTruthy();
  });

  it("mostra a advertência antes do procedimento", async () => {
    mockFetch(200, { trabalhos: [TRABALHO] });
    render(<WorksGuide />);
    await screen.findByText("Banho de descarrego");
    fireEvent.click(screen.getByRole("button", { name: "Ver o preparo completo" }));

    const texto = document.body.textContent ?? "";
    // Aviso que aparece depois dos passos é aviso que chega tarde: quem rolou
    // até o fim já leu o procedimento inteiro.
    expect(texto.indexOf("Antes de começar")).toBeLessThan(texto.indexOf("Como se faz"));
    expect(texto).toContain("dano físico");
  });

  it("mostra o descarte junto do resto", async () => {
    mockFetch(200, { trabalhos: [TRABALHO] });
    render(<WorksGuide />);
    await screen.findByText("Banho de descarrego");
    fireEvent.click(screen.getByRole("button", { name: "Ver o preparo completo" }));

    expect(screen.getByText(/vão para fora de casa/)).toBeTruthy();
  });

  it("pede conta quando não há sessão", async () => {
    mockFetch(401);
    render(<WorksGuide />);

    expect(await screen.findByText(/Entre na sua conta/)).toBeTruthy();
  });

  it("diz que é recurso pago quando falta plano", async () => {
    mockFetch(402);
    render(<WorksGuide />);

    expect(await screen.findByText(/plano pago/)).toBeTruthy();
  });

  it("não quebra quando a busca falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("rede"))),
    );
    render(<WorksGuide />);

    await waitFor(() => expect(screen.getByText(/não pôde ser carregado/)).toBeTruthy());
  });
});
