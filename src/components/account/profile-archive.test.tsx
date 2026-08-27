// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileArchive } from "./profile-archive";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("./transit-reading", () => ({
  TransitReading: () => <section>Tempo do Céu</section>,
}));

vi.mock("./private-journal", () => ({
  PrivateJournal: () => <section>Diário privado</section>,
}));

const profile = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  displayName: "Lu",
  date: "1990-06-10",
  time: null,
  timePrecision: "unknown",
  latitude: -12.97,
  longitude: -38.5,
  timezone: "America/Bahia",
  location: "Salvador, Bahia, Brasil",
  updatedAt: "2026-08-19T12:00:00.000Z",
  chart: { mode: "untimed", sunSign: "Gemini", moonSign: "Cancer", natal: chartResult() },
};

describe("ProfileArchive", () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  // Sem override de timeout: este teste percorre a jornada inteira (boas-vindas → mapa →
  // configurações → recálculo) e leva ~11 s. O override de 10 s era mais estrito que o
  // global de 15 s do projeto — definido justamente para esta instabilidade — e por isso
  // falhava sob paralelismo por carga, não por defeito.
  it("lists an owned profile and recalculates it", async () => {
    let profileReads = 0;
    const fetchMock = vi.fn().mockImplementation((input: string, init?: RequestInit) => {
      if (input === "/api/auth/account")
        return Promise.resolve(new Response(JSON.stringify({ emailVerified: true })));
      if (init?.method === "PUT")
        return Promise.resolve(
          new Response(
            JSON.stringify({
              profileId: profile.id,
              chartId: "223e4567-e89b-42d3-a456-426614174000",
              chart: chartResult(),
            }),
          ),
        );
      profileReads += 1;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            profiles: [profileReads === 1 ? profile : { ...profile, date: "1990-06-11" }],
          }),
        ),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ProfileArchive />);
    await screen.findByRole("heading", { name: /Bem-vindo ao seu observatório/ });
    fireEvent.click(screen.getByRole("button", { name: "Mapa natal" }));
    await screen.findByRole("heading", { name: "Lu" });
    expect(screen.getByRole("heading", { name: "O mapa natal de você" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Configurações" }));
    fireEvent.change(screen.getByLabelText("Data de nascimento"), {
      target: { value: "1990-06-11" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar e recalcular" }));
    await screen.findByText("Dados atualizados e mapa recalculado.");
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/profiles/${profile.id}`,
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("opens synastry and biorhythm as independent account tabs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ profiles: [profile] }))),
    );
    render(<ProfileArchive />);
    await screen.findByRole("heading", { name: /Bem-vindo ao seu observatório/ });

    fireEvent.click(screen.getByRole("button", { name: /^Sinastria$/ }));
    expect(screen.getByRole("heading", { name: /^Sinastria$/ })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Biorritmo" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /^Biorritmo$/ }));
    expect(screen.getByRole("heading", { name: "Biorritmo de Lu" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /^Biorritmo$/ })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: /^Sinastria$/ })).toBeNull();
  }, 15_000);

  it("directs an unauthenticated visitor back to the value flow", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }),
        ),
    );
    render(<ProfileArchive />);
    await screen.findByText("Este arquivo é pessoal.");
    expect(screen.getByRole("link", { name: "Ir ao início" }).getAttribute("href")).toBe("/");
  });

  it("searches and selects a corrected birth city", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string) => {
      if (input === "/api/auth/account")
        return Promise.resolve(new Response(JSON.stringify({ emailVerified: true })));
      if (input.startsWith("/api/geocoding"))
        return Promise.resolve(
          new Response(
            JSON.stringify({
              places: [
                {
                  label: "Recife, Pernambuco, Brasil",
                  latitude: -8.05,
                  longitude: -34.9,
                  timezone: "America/Recife",
                },
              ],
            }),
          ),
        );
      return Promise.resolve(new Response(JSON.stringify({ profiles: [profile] })));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ProfileArchive />);
    await screen.findByRole("heading", { name: /Bem-vindo ao seu observatório/ });
    fireEvent.click(screen.getByRole("button", { name: "Configurações" }));
    await screen.findByRole("heading", { name: "Lu" });
    fireEvent.change(screen.getByLabelText("Cidade de nascimento"), {
      target: { value: "Recife" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Recife, Pernambuco, Brasil" }));
    expect(screen.getByLabelText("Cidade de nascimento")).toHaveProperty(
      "value",
      "Recife, Pernambuco, Brasil",
    );
  }, 15_000);

  it("keeps the form actionable when recalculation fails", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string, init?: RequestInit) => {
      if (input === "/api/auth/account")
        return Promise.resolve(new Response(JSON.stringify({ emailVerified: true })));
      if (init?.method === "PUT")
        return Promise.resolve(
          new Response(JSON.stringify({ error: "unavailable" }), { status: 503 }),
        );
      return Promise.resolve(new Response(JSON.stringify({ profiles: [profile] })));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ProfileArchive />);
    await screen.findByRole("heading", { name: /Bem-vindo ao seu observatório/ });
    fireEvent.click(screen.getByRole("button", { name: "Configurações" }));
    await screen.findByRole("heading", { name: "Lu" });
    fireEvent.click(screen.getByRole("button", { name: "Salvar e recalcular" }));
    await screen.findByText("Não foi possível recalcular. Revise os dados e tente novamente.");
    expect(screen.getByRole("button", { name: "Salvar e recalcular" })).toBeTruthy();
  });

  it("deletes only the selected map after typed confirmation", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string, init?: RequestInit) => {
      if (input === "/api/auth/account")
        return Promise.resolve(new Response(JSON.stringify({ emailVerified: true })));
      if (input === `/api/profiles/${profile.id}` && init?.method === "DELETE")
        return Promise.resolve(new Response(null, { status: 204 }));
      return Promise.resolve(new Response(JSON.stringify({ profiles: [profile] })));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ProfileArchive />);
    await screen.findByRole("heading", { name: /Bem-vindo ao seu observatório/ });
    fireEvent.click(screen.getByRole("button", { name: "Configurações" }));
    await screen.findByRole("heading", { name: "Lu" });

    fireEvent.click(screen.getByRole("button", { name: "Excluir este mapa" }));
    const confirmButton = await screen.findByRole("button", {
      name: "Excluir mapa definitivamente",
    });
    expect(confirmButton).toHaveProperty("disabled", true);
    fireEvent.change(screen.getByLabelText(/Digite EXCLUIR MAPA/), {
      target: { value: "EXCLUIR MAPA" },
    });
    fireEvent.click(confirmButton);

    await vi.waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(`/api/profiles/${profile.id}`, { method: "DELETE" }),
    );
    expect(await screen.findByText("Seu arquivo ainda está vazio.")).toBeTruthy();
  });

  it("turns empty and failed loads into directed states", async () => {
    let profileReads = 0;
    const fetchMock = vi.fn().mockImplementation((input: string) => {
      if (input === "/api/auth/account")
        return Promise.resolve(new Response(JSON.stringify({ emailVerified: true })));
      profileReads += 1;
      return Promise.resolve(
        profileReads === 1
          ? new Response(JSON.stringify({ profiles: [] }))
          : new Response(JSON.stringify({ error: "failed" }), { status: 503 }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const first = render(<ProfileArchive />);
    expect(await screen.findByText("Seu arquivo ainda está vazio.")).toBeTruthy();
    first.unmount();
    render(<ProfileArchive />);
    expect(await screen.findByText("O arquivo não abriu.")).toBeTruthy();
  });
});

function chartResult() {
  return {
    mode: "untimed",
    engineVersion: "test-engine",
    configVersion: "test-config",
    inputFingerprint: "a".repeat(64),
    jdUt: 2_440_000,
    planets: Array.from({ length: 10 }, (_, index) => ({
      id: index === 0 ? "sun" : index === 1 ? "moon" : `planet-${index}`,
      longitude: index * 20,
      latitude: 0,
      speed: 1,
      retrograde: false,
      sign: "Gemini",
      signDegree: 5,
    })),
    warnings: [],
  };
}
