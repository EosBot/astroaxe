// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { markerPoint, NatalChartWheel } from "./natal-chart-wheel";

describe("NatalChartWheel", () => {
  afterEach(cleanup);

  it("keeps every calculated position in the DOM and supports selection", () => {
    render(<NatalChartWheel chart={chart()} />);
    expect(screen.getByLabelText("Interpretações de planetas e pontos").children).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "Ler Marte" }));
    expect(screen.getByText("Corpo em foco").parentElement?.textContent).toContain("Marte");
    expect(screen.getByRole("button", { name: "Ler Marte" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("does not render time-dependent angles for an untimed chart", () => {
    render(<NatalChartWheel chart={{ ...chart(), mode: "untimed", houses: undefined }} />);
    expect(screen.queryByText("ASC")).toBeNull();
  });

  it("shows the Ascendant and Descendant axis for a timed chart", () => {
    render(<NatalChartWheel chart={chart()} />);
    expect(screen.getAllByText("ASC")).not.toHaveLength(0);
    expect(screen.getAllByText("DSC")).not.toHaveLength(0);
    expect(screen.getByRole("heading", { name: "Ascendente em Leão" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Descendente em Aquário" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Meio do Céu em Touro" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Fundo do Céu em Escorpião" })).toBeTruthy();
  });

  it("places nearby bodies in deterministic radial lanes without changing their readings", () => {
    const planets = chart().planets.map((planet, index) => ({
      ...planet,
      longitude: index < 3 ? 359 + index * 0.4 : planet.longitude,
    }));
    const points = planets.slice(0, 3).map((planet) => markerPoint(planet, planets, 0));
    expect(new Set(points.map(({ x, y }) => `${x.toFixed(2)}:${y.toFixed(2)}`)).size).toBe(3);
  });
});

function chart() {
  return {
    mode: "timed" as const,
    engineVersion: "test",
    configVersion: "test",
    inputFingerprint: "fixture",
    jdUt: 2_440_000,
    planets: [
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
      longitude: index * 32,
      latitude: 0,
      speed: 1,
      retrograde: id === "mars",
      sign: "Aries",
      signDegree: index,
    })),
    houses: {
      requestedSystem: "placidus",
      actualSystem: "placidus",
      cusps: Array.from({ length: 12 }, (_, index) => index * 30),
      ascendant: 120,
      midheaven: 30,
    },
    warnings: [],
  };
}
