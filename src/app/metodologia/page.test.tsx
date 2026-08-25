// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import MethodologyPage, { metadata } from "./page";

describe("methodology page", () => {
  afterEach(cleanup);

  it("publishes the verifiable contract without exposing proprietary mechanics", () => {
    render(<MethodologyPage />);
    expect(
      screen.getByRole("heading", {
        name: "Um método rastreável, sem transformar profundidade em caixa-preta.",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(/A matriz, os pesos e as regras proprietárias permanecem protegidos/),
    ).toBeTruthy();
    expect(screen.getByText(/não porcentagem de certeza espiritual/)).toBeTruthy();
    expect(screen.queryByText(/regency-scorer/)).toBeNull();
    expect(metadata.alternates).toEqual({ canonical: "/metodologia" });
  });
});
