"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccountSecurity(): React.JSX.Element {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"password" | "delete">();

  async function changePassword(): Promise<void> {
    setBusy("password");
    setMessage("");
    try {
      const response = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const body = (await response.json()) as { error?: unknown };
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Falha");
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Senha alterada. As outras sessões foram encerradas.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível trocar a senha.");
    } finally {
      setBusy(undefined);
    }
  }

  async function deleteAccount(): Promise<void> {
    setBusy("delete");
    setMessage("");
    try {
      const response = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, confirmation }),
      });
      const body = (await response.json()) as { error?: unknown };
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Falha");
      router.push("/");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir a conta.");
      setBusy(undefined);
    }
  }

  return (
    <section className="account-security" aria-labelledby="account-security-title">
      <p className="eyebrow">Segurança e privacidade</p>
      <h2 id="account-security-title">Controle sua conta.</h2>
      <p>
        <a className="text-link" href="/api/auth/export" download>
          Exportar conta, mapas e diário em JSON
        </a>
      </p>
      <div className="account-security-grid">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void changePassword();
          }}
        >
          <h3>Trocar senha</h3>
          <label htmlFor="security-current-password">Senha atual</label>
          <input
            id="security-current-password"
            type="password"
            autoComplete="current-password"
            minLength={12}
            maxLength={128}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <label htmlFor="security-new-password">Nova senha</label>
          <input
            id="security-new-password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <button type="submit" className="quiet-button" disabled={busy !== undefined}>
            {busy === "password" ? "Alterando…" : "Alterar senha"}
          </button>
        </form>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void deleteAccount();
          }}
        >
          <h3>Excluir conta e mapas</h3>
          <p>Esta ação apaga definitivamente sua conta, sessões, perfis e cálculos salvos.</p>
          <label htmlFor="security-delete-confirmation">Digite EXCLUIR</label>
          <input
            id="security-delete-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
          <button
            type="submit"
            className="danger-button"
            disabled={
              busy !== undefined || confirmation !== "EXCLUIR" || currentPassword.length < 12
            }
          >
            {busy === "delete" ? "Excluindo…" : "Excluir minha conta"}
          </button>
        </form>
      </div>
      {message ? <output className="form-message">{message}</output> : null}
    </section>
  );
}
