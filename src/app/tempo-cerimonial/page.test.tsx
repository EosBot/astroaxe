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

    expect(screen.getByRole("heading", { name: /Informe um instante e um lugar/ })).toBeTruthy();
    // Sem fuso não há como saber que hora do dia é ali, e supor um seria pior.
    expect(screen.queryByRole("heading", { name: /As regras, lado a lado/ })).toBeNull();
  });

  it("mostra as obras lado a lado, cada uma com o próprio desfecho", async () => {
    await renderPage({ ...SAO_PAULO, sunLongitude: "90", moonLongitude: "90" });

    expect(screen.getByRole("heading", { name: "Heptameron" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Arbatel" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Agrippa" })).toBeTruthy();
    // Lua nova contraria o Heptameron, e Agrippa não é computável. Os dois estados
    // convivem na tela sem que nada os concilie.
    expect(screen.getAllByText("O momento contraria o que esta obra pede.").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Não há dado suficiente para julgar por esta obra.")).toBeTruthy();
  });

  it("nunca apresenta nota de sucesso nem recomendação de momento", async () => {
    const { container } = await renderPage(SAO_PAULO);
    const texto = container.textContent ?? "";

    // A página nega explicitamente, e a negação usa as palavras que ela nega —
    // por isso a verificação afirma a negação em vez de varrer a prosa atrás
    // delas. Que não existe *campo* de nota é provado na projeção pública.
    expect(texto).toContain("não recomendação de momento nem promessa de resultado");
    expect(texto).toContain("Não existe pontuação universal de bom momento");
    expect(texto).toContain("Escolher o momento continua sendo de quem opera");
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
  });

  it("diz que a Lua não foi informada em vez de supor uma fase", async () => {
    await renderPage(SAO_PAULO);

    expect(screen.getAllByText("A posição da Lua não foi informada.").length).toBeGreaterThan(0);
  });

  it("explica por que a Ars Paulina não vira perfil de eleição", async () => {
    const { container } = await renderPage();

    expect(screen.getByRole("heading", { name: /Nem toda obra dá regra de eleição/ })).toBeTruthy();
    expect(container.textContent ?? "").toContain("regra de construção vinculada à hora escolhida");
  });
});
