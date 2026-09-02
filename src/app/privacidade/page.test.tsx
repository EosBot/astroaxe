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

  it("declara os planos e sessões cerimoniais como categoria de dado", () => {
    render(<PrivacyPage />);

    // Criar rotas que guardam intenção, notas e desfechos sem declará-los aqui
    // seria coletar dado sensível em silêncio.
    expect(screen.getByText("Planos e sessões cerimoniais")).toBeTruthy();
    expect(screen.getByText(/AES-256-GCM/)).toBeTruthy();
    // Duas categorias declaram sensibilidade religiosa: o feedback da Tríade e os
    // registros de prática. Ambas são corretas.
    expect(screen.getAllByText(/informação religiosa sensível/).length).toBe(2);
    expect(screen.getByText(/Apagar um plano apaga as sessões dele junto/)).toBeTruthy();
  });

  it("declara a data de nascimento do titular e diz que não é verificação", () => {
    render(<PrivacyPage />);

    expect(screen.getByText("Declaração de maioridade")).toBeTruthy();
    // Chamar declaração de verificação emprestaria ao registro autoridade que
    // ele não tem, e a página precisa dizer isso a quem declara.
    expect(screen.getByText(/não verificamos documentos/)).toBeTruthy();
    expect(screen.getByText(/quem não o usa nunca é perguntado/)).toBeTruthy();
  });
});
