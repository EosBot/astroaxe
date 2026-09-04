// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ProfileRecord } from "@/lib/profiles/contracts";

import { ShadowHoroscopeView } from "./astrology-module-panels";

vi.mock("./transit-reading", () => ({
  TransitReading: () => <section aria-label="Trânsitos sombrios">Tempo do Céu</section>,
}));

describe("ShadowHoroscopeView", () => {
  afterEach(cleanup);

  it("renders the complete natal shadow architecture without duplicated prose artifacts", () => {
    const { container } = render(<ShadowHoroscopeView profile={timedProfile()} />);

    expect(
      screen.getByRole("heading", { name: "Dez mecanismos, sem repetir o mesmo diagnóstico." }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "O controle responsável demais" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "A rebeldia automática" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "A névoa conveniente" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "O poder que não quer perder" })).toBeTruthy();
    expect(screen.getByText(/Ascendente em Leão/)).toBeTruthy();
    expect(screen.getByText(/Meio do Céu em Capricórnio/)).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Marte e Sol: o ponto cego/ })).toBeTruthy();
    expect(container.textContent).not.toMatch(/\.\.|leva a para você|através de para você/iu);
    expect(container.querySelectorAll(".shadow-reading-axis .shadow-reading-card")).toHaveLength(
      10,
    );
  });

  it("declares unavailable angles and houses when birth time is unknown", () => {
    const profile = timedProfile();
    profile.chart.mode = "untimed";
    profile.chart.natal.mode = "untimed";
    delete profile.chart.natal.houses;

    render(<ShadowHoroscopeView profile={profile} />);

    expect(
      screen.getByText(
        /Hora desconhecida: Ascendente, Meio do Céu e manifestações por casa permanecem fora/,
      ),
    ).toBeTruthy();
  });
});

function timedProfile(): ProfileRecord {
  const ids = [
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
  ];
  return {
    id: "123e4567-e89b-42d3-a456-426614174000",
    displayName: "Perfil Sombra",
    date: "1990-06-15",
    time: "10:30",
    timePrecision: "known",
    latitude: -12.5,
    longitude: -38.5,
    timezone: "America/Bahia",
    location: "Cidade Horizonte, Brasil",
    updatedAt: "2026-09-04T00:00:00.000Z",
    chart: {
      mode: "timed",
      sunSign: "Leão",
      moonSign: "Câncer",
      ascendant: 124.5,
      natal: {
        mode: "timed",
        engineVersion: "test-engine",
        configVersion: "test-config",
        inputFingerprint: "a".repeat(64),
        jdUt: 2_440_000,
        planets: ids.map((id, index) => ({
          id,
          longitude: 120 + index * 21,
          latitude: 0,
          speed: index % 3 === 0 ? -0.2 : 1,
          retrograde: index % 3 === 0,
          sign: "Leo",
          signDegree: 4,
        })),
        aspects: [
          { a: "mars", b: "sun", type: "square", orb: 1.2, strength: 0.92 },
          { a: "venus", b: "moon", type: "trine", orb: 4.4, strength: 0.55 },
        ],
        houses: {
          requestedSystem: "placidus",
          actualSystem: "placidus",
          cusps: Array.from({ length: 12 }, (_, index) => index * 30),
          ascendant: 124.5,
          midheaven: 278.25,
        },
        warnings: [],
      },
    },
  };
}
