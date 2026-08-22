// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PrivateJournal } from "./private-journal";

describe("PrivateJournal", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("loads and saves a reflection without exposing its content elsewhere", async () => {
    const saved = entry("Uma observação privada.");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ entries: [] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ entry: saved })));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <PrivateJournal
        profileId="123e4567-e89b-42d3-a456-426614174000"
        timezone="America/Sao_Paulo"
      />,
    );
    const field = await screen.findByLabelText("Reflexão de hoje");
    fireEvent.change(field, { target: { value: saved.content } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar reflexão" }));
    expect(await screen.findByText("Reflexão guardada somente no seu arquivo.")).toBeTruthy();
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/profiles/123e4567-e89b-42d3-a456-426614174000/journal",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(screen.getByRole("link", { name: "Exportar JSON" }).getAttribute("href")).toBe(
      "/api/journal/export",
    );
  });

  it("loads and deletes an existing reflection from the interface", async () => {
    const existing = entry("Texto que será removido.");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ entries: [existing] })))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <PrivateJournal
        profileId="123e4567-e89b-42d3-a456-426614174000"
        timezone="America/Sao_Paulo"
      />,
    );
    expect(await screen.findByLabelText("Reflexão de hoje")).toHaveProperty(
      "value",
      existing.content,
    );
    fireEvent.click(screen.getByText(/Reflexões anteriores/));
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(await screen.findByText("Reflexão excluída.")).toBeTruthy();
    expect(screen.getByLabelText("Reflexão de hoje")).toHaveProperty("value", "");
  });

  it("turns a failed load into a private, stable error state", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ error: "unavailable" }), { status: 503 })),
    );
    render(
      <PrivateJournal
        profileId="123e4567-e89b-42d3-a456-426614174000"
        timezone="America/Sao_Paulo"
      />,
    );
    expect(await screen.findByRole("heading", { name: "Seu diário não abriu." })).toBeTruthy();
    expect(screen.getByText("As reflexões já guardadas permanecem preservadas.")).toBeTruthy();
  });
});

function entry(content: string) {
  return {
    id: "223e4567-e89b-42d3-a456-426614174000",
    profileId: "123e4567-e89b-42d3-a456-426614174000",
    date: todayInSaoPaulo(),
    content,
    createdAt: "2026-08-20T12:00:00.000Z",
    updatedAt: "2026-08-20T12:00:00.000Z",
  };
}

function todayInSaoPaulo(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}
