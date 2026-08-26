// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import PrivacyPage, { metadata } from "./page";

describe("PrivacyPage", () => {
  afterEach(cleanup);

  it("describes implemented controls without claiming a finished production policy", () => {
    render(<PrivacyPage />);

    expect(screen.getByRole("heading", { name: /Seus dados servem à sua leitura/ })).toBeTruthy();
    expect(screen.getByText(/Não há integração ativa com LLM/)).toBeTruthy();
    expect(screen.getByText(/ainda precisam ser publicados/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Abrir controles da conta" })).toBeTruthy();
    expect(metadata.alternates).toEqual({ canonical: "/privacidade" });
  });
});
