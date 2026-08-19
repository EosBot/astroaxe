// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Onboarding } from "./onboarding";

const planets = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
].map((id, index) => ({
  id,
  longitude: index * 20,
  latitude: 0,
  speed: 1,
  retrograde: false,
  sign: index === 0 ? "Gemini" : "Cancer",
  signDegree: 5,
}));

describe("Onboarding", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("keeps account creation out of the four-step path and reveals an untimed result", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            places: [
              {
                label: "Salvador, Bahia, Brasil",
                latitude: -12.97,
                longitude: -38.5,
                timezone: "America/Bahia",
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            profileId: "123e4567-e89b-42d3-a456-426614174000",
            chartId: "223e4567-e89b-42d3-a456-426614174000",
            chart: {
              mode: "untimed",
              engineVersion: "caelus-0.24.1",
              configVersion: "western-test",
              inputFingerprint: "a".repeat(64),
              jdUt: 2440000,
              planets,
              warnings: [],
            },
          }),
          { status: 201 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<Onboarding />);

    fireEvent.change(screen.getByLabelText("Nome ou apelido"), { target: { value: "Lu" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByLabelText("Data de nascimento"), {
      target: { value: "1990-06-10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByLabelText("Não sei minha hora"));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByLabelText("Cidade de nascimento"), {
      target: { value: "Salvador" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
    await screen.findByRole("button", { name: "Salvador, Bahia, Brasil" });
    fireEvent.click(screen.getByRole("button", { name: "Salvador, Bahia, Brasil" }));
    fireEvent.click(screen.getByRole("button", { name: "Calcular meu céu" }));

    await screen.findByText("Seu céu se abre assim, Lu.");
    expect(screen.getByText("Hora desconhecida · leitura sem casas e Ascendente")).toBeTruthy();
    expect(screen.queryByText("Criar conta")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("preserves the form and gives a recoverable error when geocoding fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ error: "unavailable" }), { status: 503 })),
    );
    render(<Onboarding />);
    fireEvent.change(screen.getByLabelText("Nome ou apelido"), { target: { value: "Ana" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByLabelText("Data de nascimento"), {
      target: { value: "2000-01-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByLabelText("Hora de nascimento"), { target: { value: "08:30" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByLabelText("Cidade de nascimento"), {
      target: { value: "Recife" },
    });
    fireEvent.submit(screen.getByRole("form", { name: "Onde você nasceu?" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain("temporariamente indisponível"),
    );
    expect(screen.getByLabelText("Cidade de nascimento")).toHaveProperty("value", "Recife");
  });
});
