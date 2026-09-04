// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CeremonialPlanner } from "./ceremonial-planner";

const PLANO = {
  id: "e45480af-b7ae-4472-b2a5-1077e3b42075",
  title: "Oferenda de sexta",
  intention: "Assentamento e agradecimento",
  selection: [],
  scheduledFor: null,
  createdAt: "2026-09-03T04:58:22.631Z",
  updatedAt: "2026-09-03T04:58:22.631Z",
};

const SESSAO = {
  id: "1b69d34f-785d-4b24-9562-e08d84ad540b",
  planId: PLANO.id,
  occurredAt: "2026-09-05T20:00:00.000Z",
  notes: "Vela acesa, água limpa",
  observation: null,
  outcome: "Concluído",
};

/** Roteia por caminho, porque a tela conversa com mais de uma rota. */
function mockRotas(
  options: { plansStatus?: number; plans?: unknown; sessions?: unknown } = {},
): void {
  const {
    plansStatus = 200,
    plans = { plans: [PLANO] },
    sessions = { sessions: [SESSAO] },
  } = options;
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      url.includes("/sessions")
        ? Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(sessions) })
        : Promise.resolve({
            ok: plansStatus < 400,
            status: plansStatus,
            json: () => Promise.resolve(plans),
          }),
    ),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("CeremonialPlanner", () => {
  it("lista os planos guardados", async () => {
    mockRotas();
    render(<CeremonialPlanner />);

    expect(await screen.findByText("Oferenda de sexta")).toBeTruthy();
    expect(screen.getByText("1 plano(s) guardado(s).")).toBeTruthy();
  });

  it("oferece finalidades religiosas, e não só temas de estudo", async () => {
    mockRotas();
    render(<CeremonialPlanner />);
    await screen.findByText("Oferenda de sexta");

    // A versão anterior oferecia quatro categorias acadêmicas, o que tratava
    // quem pratica como quem visita.
    for (const finalidade of ["Oferenda", "Sacrifício ritual", "Ancestralidade", "Proteção"])
      expect(screen.getByRole("option", { name: finalidade })).toBeTruthy();
  });

  it("não oferece no menu o que a política recusa", async () => {
    mockRotas();
    render(<CeremonialPlanner />);
    await screen.findByText("Oferenda de sexta");

    // Coerção, violência e autolesão existem no contrato para serem recusadas
    // quando chegam; oferecê-las seria o produto convidando ao que se nega a
    // servir.
    expect(screen.queryByRole("option", { name: /Coerção|Violência|Autolesão/ })).toBeNull();
  });

  it("abre os registros de um plano sob demanda", async () => {
    mockRotas();
    render(<CeremonialPlanner />);
    await screen.findByText("Oferenda de sexta");

    fireEvent.click(screen.getByRole("button", { name: "Ver registros" }));

    expect(await screen.findByText("Concluído")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Fechar registros" })).toBeTruthy();
  });

  it("declara que a cifra é amarrada ao titular", async () => {
    mockRotas();
    render(<CeremonialPlanner />);
    await screen.findByText("Oferenda de sexta");

    expect(screen.getByText(/envelope movido de lugar não abre/)).toBeTruthy();
  });

  it("pede conta quando não há sessão", async () => {
    mockRotas({ plansStatus: 401, plans: {} });
    render(<CeremonialPlanner />);

    expect(await screen.findByText(/Entre na sua conta/)).toBeTruthy();
  });

  it("avisa quando a chave de cifra não está configurada, em vez de gravar em claro", async () => {
    mockRotas({ plansStatus: 503, plans: {} });
    render(<CeremonialPlanner />);

    // Guardar em claro "só até configurarem" é exatamente como esses dados
    // vazam.
    expect(await screen.findByText(/não estão configurados/)).toBeTruthy();
  });

  it("não quebra quando a carga falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("rede"))),
    );
    render(<CeremonialPlanner />);

    await waitFor(() => expect(screen.getByText(/Não foi possível carregar/)).toBeTruthy());
  });
});
