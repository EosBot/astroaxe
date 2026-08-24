// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AccountActionForm } from "./account-action-form";

describe("AccountActionForm", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("requests recovery without claiming whether the account exists", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "Se a conta existir, enviaremos as instruções para redefinir a senha.",
        }),
        { status: 202 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<AccountActionForm kind="request-reset" />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "lu@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar link seguro" }));

    expect(await screen.findByText(/Se a conta existir/)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/password-reset/request",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("blocks incomplete action links", () => {
    render(<AccountActionForm kind="verify-email" />);
    expect(screen.getByRole("alert").textContent).toContain("link está incompleto");
    expect(screen.queryByRole("button", { name: "Confirmar email" })).toBeNull();
  });

  it("submits a new password with the opaque token", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ message: "Senha redefinida." })));
    vi.stubGlobal("fetch", fetchMock);
    render(<AccountActionForm kind="reset-password" token="opaque-token" />);
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "nova-senha-com-mais-de-doze" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Redefinir senha" }));

    await screen.findByText("Senha redefinida.");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/password-reset/confirm",
      expect.objectContaining({ body: expect.stringContaining("opaque-token") }),
    );
  });
});
