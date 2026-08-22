"use client";

import { useState } from "react";
import Link from "next/link";

import { authResponseSchema } from "@/lib/auth/contracts";

type AccountStatus = "idle" | "submitting" | "saved" | "deleted";

export function AccountPrompt({ profileId }: Readonly<{ profileId: string }>): React.JSX.Element {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<AccountStatus>("idle");
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const submitLabel = getSubmitLabel(status, mode);

  if (status === "deleted") return <p className="account-success">Este mapa foi excluído.</p>;
  if (status === "saved")
    return (
      <div className="account-success">
        <p>Mapa salvo na sua conta.</p>
        <Link className="text-link" href="/conta">
          Abrir meu arquivo celeste
        </Link>
        {confirmDelete ? (
          <span className="account-actions">
            <button
              type="button"
              className="danger-button"
              onClick={() => void deleteProfile(profileId, setStatus, setMessage)}
            >
              Confirmar exclusão
            </button>
            <button type="button" className="text-button" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </button>
          </span>
        ) : (
          <button type="button" className="danger-button" onClick={() => setConfirmDelete(true)}>
            Excluir este mapa
          </button>
        )}
        {message ? <p role="alert">{message}</p> : null}
      </div>
    );

  return (
    <form
      className="account-prompt"
      aria-labelledby="account-title"
      onSubmit={(event) => {
        event.preventDefault();
        void submitAccount(mode, email, password, setStatus, setMessage);
      }}
    >
      <div>
        <p className="eyebrow">Guarde este céu</p>
        <h3 id="account-title">
          {mode === "register" ? "Crie sua conta gratuita" : "Entre na sua conta"}
        </h3>
        <p>
          {mode === "register"
            ? "Seu resultado já é seu. A conta serve para encontrá-lo depois."
            : "Ao entrar, este mapa será salvo junto aos seus outros perfis."}
        </p>
      </div>
      <label htmlFor="account-email">Email</label>
      <input
        id="account-email"
        type="email"
        autoComplete="email"
        required
        maxLength={320}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <label htmlFor="account-password">Senha</label>
      <input
        id="account-password"
        type="password"
        autoComplete={mode === "register" ? "new-password" : "current-password"}
        required
        minLength={12}
        maxLength={128}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <small>Use pelo menos 12 caracteres. Você pode colar uma senha do seu gerenciador.</small>
      {message ? (
        <p className="form-error" role="alert">
          {message}
        </p>
      ) : null}
      <div className="account-actions">
        <button
          className="primary-button"
          type="submit"
          disabled={status === "submitting" || password.length < 12}
        >
          {submitLabel}
        </button>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setMode(mode === "register" ? "login" : "register");
            setMessage("");
          }}
        >
          {mode === "register" ? "Já tenho conta" : "Quero criar uma conta"}
        </button>
      </div>
    </form>
  );
}

async function submitAccount(
  mode: "register" | "login",
  email: string,
  password: string,
  setStatus: (status: AccountStatus) => void,
  setMessage: (message: string) => void,
): Promise<void> {
  setStatus("submitting");
  setMessage("");
  try {
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body: unknown = await response.json();
    if (!response.ok) {
      const error =
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof body.error === "string"
          ? body.error
          : "Não foi possível salvar agora.";
      throw new Error(error);
    }
    authResponseSchema.parse(body);
    setStatus("saved");
  } catch (error) {
    setStatus("idle");
    setMessage(error instanceof Error ? error.message : "Não foi possível salvar agora.");
  }
}

async function deleteProfile(
  profileId: string,
  setStatus: (status: AccountStatus) => void,
  setMessage: (message: string) => void,
): Promise<void> {
  setMessage("");
  const response = await fetch(`/api/profiles/${profileId}`, { method: "DELETE" });
  if (response.ok) setStatus("deleted");
  else setMessage("Não foi possível excluir este mapa agora.");
}

function getSubmitLabel(status: AccountStatus, mode: "register" | "login"): string {
  if (status === "submitting") return "Salvando…";
  return mode === "register" ? "Criar conta e salvar" : "Entrar e salvar";
}
