// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AUTHORIAL_REGENCY_DISCLAIMER } from "@/lib/orixas/contracts";
import { CulturalArchive } from "./cultural-archive";

describe("CulturalArchive", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the full approved text with attribution and evidence class", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ entries: [entry()] }))),
    );
    render(<CulturalArchive />);

    expect(screen.getByText("801")).toBeTruthy();
    expect(screen.getByText("arquivos inventariados")).toBeTruthy();
    expect(screen.getByText(/não promove automaticamente uma associação/)).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "Xangô em contexto" })).toBeTruthy();
    expect(screen.getByText("Segundo parágrafo profundo.")).toBeTruthy();
    expect(screen.getByText(/Conselho cultural AstroAxe/)).toBeTruthy();
    fireEvent.click(screen.getByText("Ver afirmações e classe de evidência"));
    // A afirmação declara em que classe de evidência se apoia, e não qual obra
    // sustenta o método: o acervo de pesquisa não é publicado.
    expect(
      screen.getByText("Vem de inventário de patrimônio de instituição pública."),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Fonte pública" })).toBeNull();
    expect(screen.queryByText("Seção documental")).toBeNull();
  });

  it("offers retry without replacing the approved corpus with improvised copy", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ entries: [entry()] })));
    vi.stubGlobal("fetch", fetchMock);
    render(<CulturalArchive />);

    fireEvent.click(await screen.findByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("heading", { name: "Xangô em contexto" })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

function entry() {
  return {
    kind: "reviewed_cultural_content",
    disclaimer: AUTHORIAL_REGENCY_DISCLAIMER,
    slug: "xango-contexto",
    displayName: "Xangô em contexto",
    category: "orisa",
    traditionId: "CandombleKetuNago",
    summary: "Uma síntese situada, rastreável e suficientemente cuidadosa para orientar a leitura.",
    editorialBody: "Primeiro parágrafo profundo.\n\nSegundo parágrafo profundo.",
    version: "council-approved-1",
    publishedAt: "2026-08-19T15:00:00.000Z",
    author: { displayName: "Pesquisa AstroAxe", attributionLine: "Pesquisa editorial" },
    reviewer: {
      displayName: "Conselho cultural AstroAxe",
      attributionLine: "Aprovação coletiva declarada",
    },
    claims: [
      {
        claimKey: "claim-1",
        predicate: "contextualiza",
        objectSummary: "Afirmação situada.",
        sourceLocator: "Seção documental",
        status: "active",
        source: {
          title: "Fonte pública",
          url: "https://example.test/fonte",
          evidenceKind: "institutional-inventory",
          licenseNote: "Síntese com atribuição.",
          accessedAt: "2026-08-19",
        },
      },
    ],
  };
}
