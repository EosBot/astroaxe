// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PUBLIC_REGENCY_METHOD_VERSION } from "@/domain/orixas/regency/public-method";
import { AUTHORIAL_REGENCY_DISCLAIMER } from "@/lib/orixas/contracts";
import type { PublicRegencyResponse } from "@/lib/orixas/public-regency";

import { RegencyFeedbackForm } from "./feedback-form";

describe("RegencyFeedbackForm", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("does not call fetch while consent is unchecked, even bypassing the submit button", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(
      <RegencyFeedbackForm
        profileId="profile-1"
        result={result()}
        questionnaireAnswers={answers()}
      />,
    );
    fillRequiredFields();
    fireEvent.submit(screen.getByRole("button", { name: "Enviar avaliação" }).closest("form")!);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Enviar avaliação" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("submits the exact consented payload once when checked", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <RegencyFeedbackForm
        profileId="profile-1"
        result={result()}
        questionnaireAnswers={answers()}
      />,
    );
    fillRequiredFields();
    fireEvent.click(screen.getByLabelText(/Autorizo o uso destas respostas/));
    fireEvent.click(screen.getByRole("button", { name: "Enviar avaliação" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body: unknown = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      methodVersion: PUBLIC_REGENCY_METHOD_VERSION,
      verdict: "close",
      knowsOrisas: false,
      confirmationBasis: "personal_recognition",
      consent: true,
      consentVersion: "regency-feedback-consent-1.0",
    });
    expect(await screen.findByText("Obrigado por fortalecer a pesquisa.")).toBeTruthy();
  });

  it("does not send a duplicate request on a rapid double click", async () => {
    let resolveFetch: (value: Response) => void = () => {};
    const fetchMock = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <RegencyFeedbackForm
        profileId="profile-1"
        result={result()}
        questionnaireAnswers={answers()}
      />,
    );
    fillRequiredFields();
    fireEvent.click(screen.getByLabelText(/Autorizo o uso destas respostas/));
    const submitButton = screen.getByRole("button", { name: "Enviar avaliação" });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    resolveFetch(new Response("{}", { status: 201 }));
    await screen.findByText("Obrigado por fortalecer a pesquisa.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows an accessible error and keeps entered data on a 503, without a false saved state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 503 })));
    render(
      <RegencyFeedbackForm
        profileId="profile-1"
        result={result()}
        questionnaireAnswers={answers()}
      />,
    );
    fillRequiredFields();
    fireEvent.click(screen.getByLabelText(/Autorizo o uso destas respostas/));
    fireEvent.click(screen.getByRole("button", { name: "Enviar avaliação" }));

    expect((await screen.findByRole("alert")).textContent).toMatch(
      "Não foi possível guardar agora.",
    );
    expect(screen.queryByText("Obrigado por fortalecer a pesquisa.")).toBeNull();
    expect(screen.getByRole("combobox", { name: "Como você avalia a tríade?" })).toHaveProperty(
      "value",
      "close",
    );
  });
});

function fillRequiredFields() {
  fireEvent.change(screen.getByRole("combobox", { name: "Como você avalia a tríade?" }), {
    target: { value: "close" },
  });
  fireEvent.click(screen.getByRole("radio", { name: "Não ou não tenho certeza" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Como você conhece essa informação?" }), {
    target: { value: "personal_recognition" },
  });
}

function answers() {
  return [{ questionId: "faith", value: "both" }];
}

function result(): PublicRegencyResponse {
  const candidates: PublicRegencyResponse["roles"]["front"]["candidates"] = [
    { orisaId: "orisa:ogum", displayName: "Ogum", affinity: "predominant" },
    { orisaId: "orisa:oxala", displayName: "Oxalá", affinity: "strong" },
    { orisaId: "orisa:xango", displayName: "Xangô", affinity: "present" },
  ];
  return {
    methodVersion: PUBLIC_REGENCY_METHOD_VERSION,
    disclaimer: AUTHORIAL_REGENCY_DISCLAIMER,
    roles: {
      front: { selectedId: "orisa:ogum", candidates, stability: "high" },
      head: { selectedId: "orisa:oxala", candidates, stability: "medium" },
      back: { selectedId: "orisa:xango", candidates, stability: "low" },
    },
  };
}
