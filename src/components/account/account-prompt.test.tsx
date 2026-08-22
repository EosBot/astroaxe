// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AccountPrompt } from "./account-prompt";

describe("AccountPrompt", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("creates an account after value and offers a confirmed deletion", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user: { email: "lu@example.test" }, claimedProfiles: 1 }), {
          status: 201,
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<AccountPrompt profileId="123e4567-e89b-42d3-a456-426614174000" />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "lu@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "frase-secreta-comprida" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta e salvar" }));
    await screen.findByText("Mapa salvo na sua conta.");

    fireEvent.click(screen.getByRole("button", { name: "Excluir este mapa" }));
    expect(screen.getByRole("button", { name: "Confirmar exclusão" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
    await screen.findByText("Este mapa foi excluído.");
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/profiles/123e4567-e89b-42d3-a456-426614174000",
      { method: "DELETE" },
    );
  });

  it("switches to login and keeps a server error actionable", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: "Email ou senha inválidos." }), { status: 401 }),
        ),
    );
    render(<AccountPrompt profileId="123e4567-e89b-42d3-a456-426614174000" />);
    fireEvent.click(screen.getByRole("button", { name: "Já tenho conta" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "lu@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "frase-secreta-incorreta" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar e salvar" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("inválidos"));
    expect(screen.getByLabelText("Email")).toHaveProperty("value", "lu@example.test");
  });
});
