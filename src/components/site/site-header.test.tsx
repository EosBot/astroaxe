// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/conta",
  useRouter: () => navigation,
}));

describe("SiteHeader", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("shows the responsive navigation and ends an authenticated session", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ authenticated: true }) })
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    render(<SiteHeader />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Sair" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
    expect(screen.getByRole("navigation", { name: "Principal" }).getAttribute("data-open")).toBe(
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/"));
    expect(fetchMock).toHaveBeenLastCalledWith("/api/auth/logout", { method: "POST" });
  });

  it("offers direct login when there is no session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ authenticated: false }) }),
    );
    render(<SiteHeader />);
    expect((await screen.findByRole("link", { name: "Entrar" })).getAttribute("href")).toBe(
      "/entrar",
    );
  });

  it("renders the global footer navigation and cultural boundary", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("navigation", { name: "Rodapé" })).toBeTruthy();
    expect(screen.getByText(/não substituem jogo de búzios/)).toBeTruthy();
  });
});
