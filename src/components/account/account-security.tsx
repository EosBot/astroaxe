"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";

export function AccountSecurity(): React.JSX.Element {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"password" | "delete" | "verification">();
  const [emailVerified, setEmailVerified] = useState<boolean>();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    void fetch("/api/auth/account")
      .then(async (response) => {
        const body = (await response.json()) as { emailVerified?: unknown };
        if (response.ok && typeof body.emailVerified === "boolean")
          setEmailVerified(body.emailVerified);
      })
      .catch(() => undefined);
  }, []);

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
        body: JSON.stringify({ currentPassword: deletePassword, confirmation }),
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

  async function resendVerification(): Promise<void> {
    setBusy("verification");
    setMessage("");
    try {
      const response = await fetch("/api/auth/email-verification/request", { method: "POST" });
      const body = (await response.json()) as { message?: unknown; error?: unknown };
      if (!response.ok)
        throw new Error(typeof body.error === "string" ? body.error : "Falha no envio.");
      setMessage(typeof body.message === "string" ? body.message : "Link enviado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar o link.");
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <section className="account-security" id="seguranca" aria-labelledby="account-security-title">
      <header className="account-security-heading">
        <div>
          <p className="eyebrow">Segurança e privacidade</p>
          <h2 id="account-security-title">Seu cofre de dados.</h2>
        </div>
        <p>
          Você decide o que permanece no AstroAxé. Exporte uma cópia, renove sua senha ou encerre a
          conta com confirmação explícita.
        </p>
      </header>
      {emailVerified === false ? (
        <div className="verification-notice">
          <div>
            <strong>Email ainda não confirmado</strong>
            <p>Confirme o endereço para proteger a recuperação da sua conta.</p>
          </div>
          <button
            type="button"
            className="quiet-button"
            disabled={busy !== undefined}
            onClick={() => void resendVerification()}
          >
            {busy === "verification" ? "Enviando…" : "Reenviar confirmação"}
          </button>
        </div>
      ) : null}
      <motion.div
        className="account-security-grid"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <article className="security-card security-card-export">
          <span className="security-card-index" aria-hidden="true">
            01
          </span>
          <div>
            <p className="eyebrow">Portabilidade</p>
            <h3>Leve seus dados com você</h3>
            <p>Baixe conta, mapas e diário em um arquivo JSON estruturado.</p>
          </div>
          <a className="quiet-button" href="/api/auth/export" download>
            Exportar meus dados
          </a>
        </article>
        <form
          className="security-card"
          onSubmit={(event) => {
            event.preventDefault();
            void changePassword();
          }}
        >
          <span className="security-card-index" aria-hidden="true">
            02
          </span>
          <div>
            <p className="eyebrow">Acesso</p>
            <h3>Trocar senha</h3>
            <p>Use ao menos 12 caracteres. A troca encerra as outras sessões abertas.</p>
          </div>
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
          className="security-card security-card-danger"
          onSubmit={(event) => {
            event.preventDefault();
            void deleteAccount();
          }}
        >
          <span className="security-card-index" aria-hidden="true">
            03
          </span>
          <div>
            <p className="eyebrow">Zona irreversível</p>
            <h3>Excluir conta e mapas</h3>
            <p>Apaga definitivamente conta, sessões, perfis, cálculos e diário.</p>
          </div>
          <label htmlFor="security-delete-password">Senha atual</label>
          <input
            id="security-delete-password"
            type="password"
            autoComplete="current-password"
            minLength={12}
            maxLength={128}
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
          />
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
              busy !== undefined || confirmation !== "EXCLUIR" || deletePassword.length < 12
            }
          >
            {busy === "delete" ? "Excluindo…" : "Excluir minha conta"}
          </button>
        </form>
      </motion.div>
      {message ? (
        <output className="form-message" aria-live="polite">
          {message}
        </output>
      ) : null}
    </section>
  );
}
