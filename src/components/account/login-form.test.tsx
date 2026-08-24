// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./login-form";

const navigation = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));

describe("LoginForm", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("opens the central after valid credentials", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ user: { email: "lua@example.invalid" }, claimedProfiles: 0 }),
      }),
    );
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "lua@example.invalid" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "uma-senha-segura" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar na minha central" }));
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/conta"));
  });

  it("keeps a recoverable error in the form", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Email ou senha inválidos." }),
      }),
    );
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "x@example.invalid" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-incorreta" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar na minha central" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Email ou senha inválidos.");
  });
});
