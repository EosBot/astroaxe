// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import MethodologyPage, { metadata } from "./page";

describe("methodology page", () => {
  afterEach(cleanup);

  it("publishes versions, validation status and the discreet authorial disclaimer", () => {
    render(<MethodologyPage />);
    expect(
      screen.getByRole("heading", { name: "Da posição no céu à decisão explicável." }),
    ).toBeTruthy();
    expect(screen.getByText(/regency-scorer-0.5.0-research/)).toBeTruthy();
    expect(screen.getByText(/nenhuma porcentagem de acurácia é publicada/i)).toBeTruthy();
    expect(screen.getByText(/Método autoral AstroAxe; versão de pesquisa/)).toBeTruthy();
    expect(metadata.alternates).toEqual({ canonical: "/metodologia" });
  });
});
