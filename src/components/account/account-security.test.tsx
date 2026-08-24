// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AccountSecurity } from "./account-security";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));

describe("AccountSecurity", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("offers a direct no-script account export", () => {
    render(<AccountSecurity />);
    const exportLink = screen.getByRole("link", {
      name: "Exportar meus dados",
    });
    expect(exportLink.getAttribute("href")).toBe("/api/auth/export");
    expect(exportLink.hasAttribute("download")).toBe(true);
  });

  it("offers a resend action while the email is unverified", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ emailVerified: false })))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Enviamos um novo link de confirmação." }), {
          status: 202,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<AccountSecurity />);

    fireEvent.click(await screen.findByRole("button", { name: "Reenviar confirmação" }));
    expect(await screen.findByText("Enviamos um novo link de confirmação.")).toBeTruthy();
    expect(fetchMock).toHaveBeenLastCalledWith("/api/auth/email-verification/request", {
      method: "POST",
    });
  });

  it("changes the password and explains session revocation", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ emailVerified: true, ok: true }))),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<AccountSecurity />);

    fireEvent.change(screen.getAllByLabelText("Senha atual")[0]!, {
      target: { value: "frase-secreta-comprida" },
    });
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "nova-frase-secreta-segura" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));

    expect(
      await screen.findByText("Senha alterada. As outras sessões foram encerradas."),
    ).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/password",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("shows the public API error without losing the form", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ emailVerified: true })))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Senha atual inválida." }), { status: 401 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<AccountSecurity />);
    fireEvent.change(screen.getAllByLabelText("Senha atual")[0]!, {
      target: { value: "frase-secreta-incorreta" },
    });
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "nova-frase-secreta-segura" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));
    expect(await screen.findByText("Senha atual inválida.")).toBeTruthy();
    expect(screen.getByLabelText("Nova senha")).toHaveProperty(
      "value",
      "nova-frase-secreta-segura",
    );
  });

  it("deletes the account only after the explicit confirmation", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ emailVerified: true, ok: true }))),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<AccountSecurity />);
    const deleteButton = screen.getByRole("button", { name: "Excluir minha conta" });
    expect(deleteButton).toHaveProperty("disabled", true);

    fireEvent.change(screen.getAllByLabelText("Senha atual")[1]!, {
      target: { value: "frase-secreta-comprida" },
    });
    fireEvent.change(screen.getByLabelText("Digite EXCLUIR"), {
      target: { value: "EXCLUIR" },
    });
    fireEvent.click(deleteButton);

    await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
    expect(router.refresh).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/account",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
