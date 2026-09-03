// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TransitReading } from "./transit-reading";

describe("TransitReading", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("turns a published interpretation into Agora, Por quê and Como trabalhar", async () => {
    const response = readingResponse();
    response.interpretations.push({
      ...response.interpretations[0]!,
      transit: { ...response.interpretations[0]!.transit, natalBody: "Moon" },
      content: { ...response.interpretations[0]!.content, title: "Saturno encontra a Lua" },
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response)));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <TransitReading profileId="123e4567-e89b-42d3-a456-426614174000" timezone="America/Bahia" />,
    );

    expect(await screen.findByRole("heading", { name: "Saturno pede forma ao Sol" })).toBeTruthy();
    expect(screen.getByText("Agora")).toBeTruthy();
    expect(screen.getByText("Por quê")).toBeTruthy();
    expect(screen.getByText("Como trabalhar")).toBeTruthy();
    expect(screen.getByText("Texto assistido por IA")).toBeTruthy();
    expect(screen.getByLabelText("Janela deste trânsito")).toBeTruthy();
    expect(screen.getByText("Mais 1 leitura ativa")).toBeTruthy();
    expect(screen.getByText("Saturno encontra a Lua")).toBeTruthy();
    expect(fetchMock.mock.calls[0]?.[0]).toMatch(
      /^\/api\/profiles\/123e4567-e89b-42d3-a456-426614174000\/transits\?date=\d{4}-\d{2}-\d{2}$/,
    );
  });

  it("uses the versioned shadow matrix for the main transit and the active feed", async () => {
    const response = readingResponse();
    response.interpretations.push({
      ...response.interpretations[0]!,
      transit: {
        ...response.interpretations[0]!.transit,
        transitingBody: "venus",
        natalBody: "moon",
        type: "trine",
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(response))));

    render(
      <TransitReading
        profileId="123e4567-e89b-42d3-a456-426614174000"
        timezone="America/Bahia"
        variant="shadow"
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "O controle vestiu uniforme de responsabilidade",
      }),
    ).toBeTruthy();
    expect(screen.getByText(/Saturno em quadratura com Sol ativa sua identidade/)).toBeTruthy();
    expect(screen.getByText("O afeto começou a emitir fatura")).toBeTruthy();
    expect(screen.queryByText("Saturno pede forma ao Sol")).toBeNull();
  });

  it("shows calculated facts without inventing an absent editorial reading", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ ...readingResponse(), interpretations: [] })),
        ),
    );
    render(
      <TransitReading profileId="123e4567-e89b-42d3-a456-426614174000" timezone="America/Bahia" />,
    );
    expect(
      await screen.findByText("O céu foi calculado; a leitura editorial ainda não existe."),
    ).toBeTruthy();
    expect(screen.getByText(/não improvisa interpretações/)).toBeTruthy();
  });

  it("offers an explicit retry after a temporary failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "unavailable" }), { status: 503 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(readingResponse())));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <TransitReading profileId="123e4567-e89b-42d3-a456-426614174000" timezone="America/Bahia" />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Carregar novamente" }));
    expect(await screen.findByRole("heading", { name: "Saturno pede forma ao Sol" })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("navigates a bounded one-year daily history and returns to today", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-08-20T15:00:00.000Z"));
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(readingResponse())));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <TransitReading profileId="123e4567-e89b-42d3-a456-426614174000" timezone="America/Bahia" />,
    );

    expect(await screen.findByRole("heading", { name: "Saturno pede forma ao Sol" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Dia anterior" }));
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/profiles/123e4567-e89b-42d3-a456-426614174000/transits?date=2026-08-19",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect((screen.getByLabelText("Data da leitura") as HTMLInputElement).value).toBe("2026-08-19");
    fireEvent.click(screen.getByRole("button", { name: "Voltar para hoje" }));
    expect((screen.getByLabelText("Data da leitura") as HTMLInputElement).value).toBe("2026-08-20");
  });
});

function readingResponse() {
  const transit = {
    transitingBody: "Saturn",
    natalBody: "Sun",
    type: "square",
    exactAngle: 90,
    orb: 1.25,
    applying: true,
    relativeIntensity: 0.82,
  };
  return {
    snapshot: {
      kind: "transit_snapshot",
      instant: "2026-08-19T12:00:00.000Z",
      engineVersion: "engine-test",
      configVersion: "transit-test",
      natalInputFingerprint: "a".repeat(64),
      snapshotFingerprint: "b".repeat(64),
      aspects: [transit],
      windows: [
        {
          transitingBody: "Saturn",
          natalBody: "Sun",
          type: "square",
          startsAt: "2026-08-10T12:00:00.000Z",
          peaksAt: "2026-08-19T12:00:00.000Z",
          endsAt: "2026-08-29T12:00:00.000Z",
          peakOrb: 0.01,
        },
      ],
    },
    interpretations: [
      {
        transit,
        content: {
          title: "Saturno pede forma ao Sol",
          opening: "Responsabilidade encontra identidade.",
          deepening: "A tensão pode revelar onde estrutura e expressão precisam conversar.",
          technicalWhy: "Saturno forma uma quadratura com o Sol natal.",
          reflectionPrompt: "O que merece uma forma mais consistente?",
          practice: "Escolha uma responsabilidade possível para hoje.",
          version: "editorial-1",
          generationMethod: "AI_ASSISTED",
          author: { displayName: "AstroAxe", attributionLine: "Pesquisa editorial" },
          reviewer: { displayName: "Validação AstroAxe", attributionLine: "Revisão estrutural" },
        },
      },
    ],
  };
}
