// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import CeremonialTimingPage from "./page";

const SAO_PAULO = {
  instant: "2026-06-21T12:00:00+00:00",
  latitude: "-23.55",
  longitude: "-46.63",
};

async function renderPage(params: Record<string, string> = {}) {
  return render(await CeremonialTimingPage({ searchParams: Promise.resolve(params) }));
}

afterEach(cleanup);

describe("página de tempo cerimonial", () => {
  it("pede instante e lugar antes de responder qualquer coisa", async () => {
    await renderPage();

    expect(screen.getByRole("heading", { name: /Comece dizendo quando, e onde/ })).toBeTruthy();
    // Sem fuso não há como saber que hora do dia é ali, e supor um seria pior.
    expect(
      screen.queryByRole("heading", { name: /O que cada tradição pede deste momento/ }),
    ).toBeNull();
  });

  it("mostra as obras lado a lado, cada uma com o próprio desfecho", async () => {
    await renderPage({ ...SAO_PAULO, sunLongitude: "90", moonLongitude: "90" });

    // As regras são identificadas pelo que pedem, e nunca pela obra de onde
    // vieram: nomear o grimório entregaria o acervo de pesquisa.
    expect(
      screen.getByRole("heading", { name: "Lua crescendo, do jeito mais generoso" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "O dia certo da semana" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "O planeta do seu assunto" })).toBeTruthy();
    // Lua nova contraria o Heptameron, e Agrippa não é computável. Os dois estados
    // convivem na tela sem que nada os concilie.
    expect(screen.getAllByText("Este momento vai contra o que ela pede.").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getByText("Falta dado para responder por aqui, e chutar seria pior que o silêncio."),
    ).toBeTruthy();
  });

  it("nunca apresenta nota de sucesso nem recomendação de momento", async () => {
    const { container } = await renderPage(SAO_PAULO);
    const texto = container.textContent ?? "";

    // A página nega explicitamente, e a negação usa as palavras que ela nega —
    // por isso a verificação afirma a negação em vez de varrer a prosa atrás
    // delas. Que não existe *campo* de nota é provado na projeção pública.
    expect(texto).toContain("não é conselho de hora marcada nem promessa de resultado");
    expect(texto).toContain("Ninguém aqui vai dizer se a hora é boa");
    expect(texto).toContain("a escolha continua sua");
    expect(texto).not.toContain("%");
  });

  it("não deixa locator nem identificador de acervo atravessar", async () => {
    const { container } = await renderPage({
      ...SAO_PAULO,
      sunLongitude: "90",
      moonLongitude: "90",
    });
    const texto = container.textContent ?? "";

    for (const marcador of ["Corpus local", "source-system:", "profile:", "_texto_"])
      expect(texto).not.toContain(marcador);
    // Nenhum nome de obra ou autor atravessa para a tela.
    for (const obra of ["Heptameron", "Agrippa", "Arbatel", "Kabbala", "Lemegeton", "Saraceni"])
      expect(texto).not.toContain(obra);
  });

  it("diz que a Lua não foi informada em vez de supor uma fase", async () => {
    await renderPage(SAO_PAULO);

    expect(screen.getAllByText("A posição da Lua não veio junto.").length).toBeGreaterThan(0);
  });

  it("explica por que nem todo critério vira regra de momento", async () => {
    const { container } = await renderPage();

    expect(
      screen.getByRole("heading", { name: /O que a gente escolheu não transformar em regra/ }),
    ).toBeTruthy();
    expect(container.textContent ?? "").toContain("depois que a hora já foi escolhida");
  });
});
