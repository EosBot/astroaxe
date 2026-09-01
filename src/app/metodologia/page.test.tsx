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

  it("cobre as cinco partes que o model card exige", () => {
    render(<MethodologyPage />);
    for (const name of [
      /Cada etapa, com o que ela de fato faz/,
      /Tradições diferentes respondendo à mesma pergunta/,
      /Versão antes de promessa/,
      /O que uma versão nova precisa provar/,
      /O método sabe onde termina/,
    ])
      expect(screen.getByRole("heading", { name })).toBeTruthy();
  });

  it("declara a regra de linhagem que impede inflar a convergência", () => {
    render(<MethodologyPage />);
    expect(screen.getByText(/Sustentação se conta por linhagem, não por obra/)).toBeTruthy();
    expect(
      screen.getByText(/Quatro livros do mesmo autor são quatro obras e uma voz/),
    ).toBeTruthy();
  });

  it("declara posição análoga em vez de identidade", () => {
    render(<MethodologyPage />);
    expect(screen.getAllByText(/posição análoga/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/nunca identidade entre entidades/).length).toBeGreaterThanOrEqual(
      1,
    );
    expect(
      screen.getByText(/uma entidade de guia não vira Orixá por ocupar posição análoga/),
    ).toBeTruthy();
  });

  it("gradua a sustentação em palavras, nunca em percentual", () => {
    render(<MethodologyPage />);
    for (const label of ["Uma escola", "Corroborada", "Convergente"])
      expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText(/A sustentação é dita em palavras, e não em percentual/)).toBeTruthy();
    expect(screen.queryByText(/\d+\s?% de acerto/)).toBeNull();
  });

  it("publica os critérios reais de promoção de uma versão", () => {
    render(<MethodologyPage />);
    expect(screen.getByText(/pelo menos 30 rótulos de validação/)).toBeTruthy();
    expect(screen.getByText(/no máximo cinco pontos percentuais/)).toBeTruthy();
    expect(screen.getByText(/Nenhuma aprovação cultural é automatizada/)).toBeTruthy();
  });

  it("publica o registro de correções com causa e efeito", () => {
    render(<MethodologyPage />);
    expect(screen.getByRole("heading", { name: "O que já foi corrigido" })).toBeTruthy();
    expect(screen.getByText(/Um princípio de correção sem registro é promessa/)).toBeTruthy();
    // A correção que reduziu a convergência aparente precisa estar visível: é a
    // que custa ao produto, e omiti-la esvaziaria o registro.
    expect(screen.getByText(/deixaram de valer como quatro confirmações/)).toBeTruthy();
    expect(screen.getByText(/mostra menos convergência do que mostrava/)).toBeTruthy();
    expect(screen.getAllByText("Por quê:").length).toBeGreaterThanOrEqual(2);
  });

  it("não expõe identificadores internos de artefato", () => {
    const { container } = render(<MethodologyPage />);
    const text = container.textContent ?? "";
    for (const marker of ["regency-matrix", "regency-weights", "regency-function-graph", "family:"])
      expect(text).not.toContain(marker);
  });

  it("publica o grafo de funções sem deixar identificador interno atravessar", () => {
    const { container } = render(<MethodologyPage />);

    expect(
      screen.getByRole("heading", { name: /As perguntas que as tradições respondem juntas/ }),
    ).toBeTruthy();
    // Marbas e Omolu na mesma função, com as categorias visíveis lado a lado.
    // Omolu aparece duas vezes porque ocupa duas funções, e isso é correto.
    expect(screen.getByText("Marbas")).toBeTruthy();
    expect(screen.getAllByText("Omolu").length).toBe(2);
    expect(screen.getAllByText("espírito goético").length).toBeGreaterThan(0);

    // A proveniência por claim sai da interface: nada de escola, obra ou locator.
    const texto = container.textContent ?? "";
    for (const marcador of ["school:", "work:", "family:", "Corpus local", "assignment:"])
      expect(texto).not.toContain(marcador);
  });
});
