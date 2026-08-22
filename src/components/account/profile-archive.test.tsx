// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
  chart: { mode: "untimed", sunSign: "Gemini", moonSign: "Cancer" },
};

describe("ProfileArchive", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("lists an owned profile and recalculates it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ profiles: [profile] })))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            profileId: profile.id,
            chartId: "223e4567-e89b-42d3-a456-426614174000",
            chart: chartResult(),
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ profiles: [{ ...profile, date: "1990-06-11" }] })),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<ProfileArchive />);
    await screen.findByRole("heading", { name: "Lu" });
    fireEvent.change(screen.getByLabelText("Data de nascimento"), {
      target: { value: "1990-06-11" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar e recalcular" }));
    await screen.findByText("Dados atualizados e mapa recalculado.");
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `/api/profiles/${profile.id}`,
      expect.objectContaining({ method: "PUT" }),
    );
  });

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
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ profiles: [profile] })))
      .mockResolvedValueOnce(
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
    vi.stubGlobal("fetch", fetchMock);
    render(<ProfileArchive />);
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
  });

  it("keeps the form actionable when recalculation fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ profiles: [profile] })))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: "unavailable" }), { status: 503 }),
        ),
    );
    render(<ProfileArchive />);
    await screen.findByRole("heading", { name: "Lu" });
    fireEvent.click(screen.getByRole("button", { name: "Salvar e recalcular" }));
    await screen.findByText("Não foi possível recalcular. Revise os dados e tente novamente.");
    expect(screen.getByRole("button", { name: "Salvar e recalcular" })).toBeTruthy();
  });

  it("turns empty and failed loads into directed states", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ profiles: [] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "failed" }), { status: 503 }));
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
