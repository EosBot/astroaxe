// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SynastryMapForm } from "./synastry-map-form";

describe("SynastryMapForm", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("creates a comparison profile inside the current account flow", async () => {
    const onCreated = vi.fn(async () => undefined);
    const fetchMock = vi
      .fn<typeof fetch>()
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
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mapResponse()), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<SynastryMapForm onCreated={onCreated} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Nome ou apelido"), { target: { value: "Ravi" } });
    fireEvent.change(screen.getByLabelText("Data de nascimento"), {
      target: { value: "1992-04-20" },
    });
    fireEvent.change(screen.getByLabelText("Hora de nascimento"), {
      target: { value: "14:30" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Cidade de nascimento" }), {
      target: { value: "Recife" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar cidade" }));
    fireEvent.click(await screen.findByRole("button", { name: "Recife, Pernambuco, Brasil" }));
    fireEvent.click(screen.getByRole("button", { name: "Adicionar e comparar mapas" }));

    await waitFor(() =>
      expect(onCreated).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000009"),
    );
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/maps",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

function mapResponse(): object {
  const planets = Array.from({ length: 10 }, (_, index) => ({
    id: `planet-${index}`,
    longitude: index * 30,
    latitude: 0,
    speed: 1,
    retrograde: false,
    sign: "Áries",
    signDegree: 0,
  }));
  return {
    profileId: "00000000-0000-4000-8000-000000000009",
    chartId: "00000000-0000-4000-8000-000000000010",
    chart: {
      mode: "timed",
      engineVersion: "test",
      configVersion: "test",
      inputFingerprint: "a".repeat(64),
      jdUt: 2_440_000,
      planets,
      warnings: [],
    },
  };
}
