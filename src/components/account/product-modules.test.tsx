// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ProfileRecord } from "@/lib/profiles/contracts";
import { BiorhythmPanel } from "./biorhythm-panel";
import { ModernPointsPanel } from "./modern-points-panel";
import { OrisaResearchLab } from "./orisa-research-lab";
import { SynastryPanel } from "./synastry-panel";
import { LunarIntelligencePanel } from "./lunar-intelligence-panel";
import {
  LoveMapView,
  LunarNodesView,
  ProfessionalMapView,
  SexualMapView,
} from "./astrology-module-panels";

describe("account product modules", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("recalculates biorhythm for an explicit date", () => {
    render(<BiorhythmPanel birthDate="2000-01-01" />);
    fireEvent.change(screen.getByLabelText("Data observada"), {
      target: { value: "2000-01-24" },
    });
    expect(screen.getByLabelText("Físico: 0 por cento")).toBeTruthy();
    expect(screen.getByText(/O impulso físico muda de direção/)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Como ler este movimento" })).toBeTruthy();
    expect(screen.getByText(/sem comprovação científica/)).toBeTruthy();
  });

  it("compares two saved charts and rejects a self-comparison", () => {
    render(
      <SynastryPanel
        profiles={[profile("Lua", 0), profile("Sol", 120)]}
        onProfileCreated={vi.fn()}
      />,
    );
    expect(screen.getAllByText("trígono").length).toBeGreaterThan(0);
    const selectors = screen.getAllByRole("combobox");
    fireEvent.change(selectors[1]!, {
      target: { value: "00000000-0000-4000-8000-000000000001" },
    });
    expect(screen.getByText("Escolha dois mapas diferentes.")).toBeTruthy();
  });

  it("explains the empty state with only one chart", () => {
    render(<SynastryPanel profiles={[profile("Lua", 0)]} onProfileCreated={vi.fn()} />);
    expect(screen.getByText("Adicione um segundo mapa para comparar.")).toBeTruthy();
    const action = screen.getByRole("button", { name: "Adicionar mapa para comparar" });
    fireEvent.click(action);
    expect(
      screen.getByRole("heading", { name: "Quem você deseja encontrar neste céu?" }),
    ).toBeTruthy();
  });

  it("surfaces Chiron, Lilith and both lunar nodes", () => {
    const natal = profile("Lua", 0).chart.natal;
    natal.planets.push(
      { ...natal.planets[0]!, id: "chiron", longitude: 32 },
      { ...natal.planets[0]!, id: "mean_lilith", longitude: 91 },
      { ...natal.planets[0]!, id: "true_node", longitude: 150 },
    );
    render(<ModernPointsPanel chart={natal} />);
    expect(screen.getByRole("heading", { name: "Quíron" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Lilith média" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Nodo Norte" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Nodo Sul" })).toBeTruthy();
    expect(screen.getByText(/Quíron revela uma vulnerabilidade/)).toBeTruthy();
    expect(screen.getByText(/Sua força indomada se manifesta/)).toBeTruthy();
    expect(screen.getByText(/Seu caminho de crescimento se abre/)).toBeTruthy();
    expect(screen.getByText(/Seu repertório ancestral e conhecido/)).toBeTruthy();
  });

  it("keeps modern points discoverable on legacy charts and offers recalculation", () => {
    const openSettings = vi.fn();
    render(
      <ModernPointsPanel chart={profile("Lua", 0).chart.natal} onOpenSettings={openSettings} />,
    );
    expect(screen.getByRole("heading", { name: "Quíron" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Lilith média" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Nodo Norte" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Nodo Sul" })).toBeTruthy();
    expect(screen.getAllByText("Aguardando recálculo")).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "Atualizar este mapa" }));
    expect(openSettings).toHaveBeenCalledOnce();
  });

  it("loads the protected Orixás result without asserting certainty", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(regencyResponse())));
    render(<OrisaResearchLab profileId="00000000-0000-4000-8000-000000000001" />);
    expect(
      await screen.findByRole("heading", { name: "Tríade de Regências AstroAxe" }),
    ).toBeTruthy();
    expect(screen.getByText(/não substituem confirmação religiosa/)).toBeTruthy();
    expect(screen.getByText(/Métricas de validação serão publicadas/)).toBeTruthy();
  });

  it("opens the lunar area after resolving the current city", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          places: [
            {
              label: "São Paulo, Brasil",
              latitude: -23.55,
              longitude: -46.63,
              timezone: "America/Sao_Paulo",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(response(lunarResponse()));
    vi.stubGlobal("fetch", fetchMock);
    const first = profile("Lua", 0);
    first.chart.natal.houses = houses();
    const second = profile("Sol", 120);
    second.chart.natal.houses = houses();
    render(<LunarIntelligencePanel profile={first} profiles={[first, second]} />);

    fireEvent.change(screen.getByLabelText("Cidade atual"), { target: { value: "São Paulo" } });
    fireEvent.click(screen.getByRole("button", { name: "Buscar cidade" }));
    fireEvent.click(await screen.findByRole("button", { name: "São Paulo, Brasil" }));

    expect(await screen.findByRole("heading", { name: /O mês começa em/ })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "O ponteiro das próximas horas" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Comparar com"), { target: { value: second.id } });
    expect(screen.getByText(/Casa 1 de Sol/)).toBeTruthy();
    expect(screen.getByText(/Casa 5 de Lua/)).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Atlas lunar · suas fases, ritmos e necessidades" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Lua Cheia · sua fase natal/ })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Lua Balsâmica" })).toBeTruthy();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("renders personalized long-form reports for nodes, love, sexuality and work", () => {
    const complete = richProfile();
    const { rerender } = render(<LunarNodesView chart={complete.chart.natal} />);
    expect(
      screen.getByRole("heading", { name: "Seu eixo nodal, capítulo por capítulo" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Nodo Sul em/ })).toBeTruthy();

    rerender(<LoveMapView profile={complete} />);
    expect(screen.getByRole("heading", { name: "Seu relatório afetivo completo" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Casa 7 em/ })).toBeTruthy();

    rerender(<SexualMapView profile={complete} />);
    expect(screen.getByRole("heading", { name: "Caderno de intimidade e desejo" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Lilith média em/ })).toBeTruthy();

    rerender(<ProfessionalMapView profile={complete} />);
    expect(
      screen.getByRole("heading", { name: "Relatório de vocação, trabalho e recursos" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Saturno em/ })).toBeTruthy();
  });
});

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function houses() {
  return {
    requestedSystem: "placidus",
    actualSystem: "placidus",
    cusps: Array.from({ length: 12 }, (_, index) => index * 30),
    ascendant: 0,
    midheaven: 270,
  };
}

function lunarResponse() {
  const planet = {
    id: "moon",
    longitude: 120,
    latitude: 0,
    speed: 1,
    retrograde: false,
    sign: "Leo",
    signDegree: 0,
  };
  return {
    dashboard: {
      version: "lunar-dashboard-1.0.0",
      referenceInstant: "2026-08-24T12:00:00.000Z",
      natalPhase: { id: "full", label: "Lua Cheia", angle: 180 },
      natalMansion: { system: "arabic_tropical_28", number: 10, degreeWithin: 4 },
      progressed: {
        jdUt: 2_460_000,
        symbolicDate: "1990-07-16",
        moon: planet,
        sun: { ...planet, id: "sun", longitude: 90, sign: "Cancer" },
        moonHouse: 5,
        phase: { id: "crescent", label: "Lua Crescente inicial", angle: 45 },
      },
      voidOfCourse: {
        active: false,
        sign: "Leo",
        ingressAt: "2026-08-25T00:00:00.000Z",
        nextApplyingAspect: {
          body: "venus",
          type: "trine",
          exactAt: "2026-08-24T18:00:00.000Z",
        },
      },
    },
    lunarReturn: {
      kind: "lunar",
      version: "return-1",
      instant: "2026-08-20T12:00:00.000Z",
      jdUt: 2_460_000,
      targetLongitude: 120,
      achievedLongitude: 120,
      orb: 0,
      planets: [
        planet,
        { ...planet, id: "mercury", longitude: 150, sign: "Virgo" },
        { ...planet, id: "venus", longitude: 180, sign: "Libra" },
        { ...planet, id: "mars", longitude: 210, sign: "Scorpio" },
      ],
      houses: houses(),
    },
    transits: [],
  };
}

function regencyResponse() {
  const candidates = [
    { orisaId: "orisa:ogum", displayName: "Ogum", affinity: "predominant" },
    { orisaId: "orisa:oxala", displayName: "Oxalá", affinity: "strong" },
    { orisaId: "orisa:xango", displayName: "Xangô", affinity: "present" },
  ] as const;
  return {
    methodVersion: "AstroAxe Regências 2.0 — pesquisa aplicada",
    disclaimer: "Metodo autoral AstroAxe; consulte a metodologia.",
    roles: {
      front: { selectedId: "orisa:ogum", candidates, stability: "high" },
      head: { selectedId: "orisa:oxala", candidates, stability: "medium" },
      back: {
        selectedId: null,
        candidates,
        stability: "low",
        unresolvedReason: "insufficient_score",
      },
    },
  };
}

function profile(displayName: string, longitude: number): ProfileRecord {
  const id =
    displayName === "Lua"
      ? "00000000-0000-4000-8000-000000000001"
      : "00000000-0000-4000-8000-000000000002";
  const planet = {
    id: displayName === "Lua" ? "sun" : "moon",
    longitude,
    latitude: 0,
    speed: 1,
    retrograde: false,
    sign: "Aries",
    signDegree: 0,
  };
  return {
    id,
    displayName,
    date: "2000-01-01",
    time: "12:00",
    timePrecision: "known",
    latitude: 0,
    longitude: 0,
    timezone: "UTC",
    location: "Local",
    updatedAt: "2026-08-23T12:00:00.000Z",
    chart: {
      mode: "timed",
      sunSign: "Áries",
      natal: {
        mode: "timed",
        engineVersion: "test",
        configVersion: "test",
        inputFingerprint: "a".repeat(64),
        jdUt: 2_440_000,
        planets: [planet, { ...planet, id: displayName === "Lua" ? "moon" : "sun" }],
        warnings: [],
      },
    },
  };
}

function richProfile(): ProfileRecord {
  const result = profile("Lua", 0);
  const seed = result.chart.natal.planets[0];
  if (seed === undefined) throw new Error("test_planet_missing");
  result.chart.natal.planets = [
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
    "mean_lilith",
    "true_node",
  ].map((id, index) => ({ ...seed, id, longitude: index * 27 }));
  result.chart.natal.houses = houses();
  return result;
}
