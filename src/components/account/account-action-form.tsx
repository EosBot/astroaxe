"use client";

import Link from "next/link";
import { useState } from "react";

type ActionKind = "request-reset" | "reset-password" | "verify-email";

export function AccountActionForm({
  kind,
  token,
}: Readonly<{ kind: ActionKind; token?: string | undefined }>): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [message, setMessage] = useState("");

  async function submit(): Promise<void> {
    setStatus("submitting");
    setMessage("");
    try {
      setMessage(await performAccountAction(kind, email, newPassword, token));
      setStatus("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível continuar.");
      setStatus("idle");
    }
  }

  const invalidLink = kind !== "request-reset" && token === undefined;
  return (
    <section className="auth-action-card" aria-labelledby="auth-action-title">
      <p className="eyebrow">Segurança da conta</p>
      <h1 id="auth-action-title">{titleFor(kind)}</h1>
      <p>{descriptionFor(kind)}</p>
      {invalidLink ? (
        <p className="form-error" role="alert">
          O link está incompleto. Solicite uma nova mensagem.
        </p>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <ActionFields
            kind={kind}
            email={email}
            newPassword={newPassword}
            onEmailChange={setEmail}
            onPasswordChange={setNewPassword}
          />
          <ActionFeedback message={message} succeeded={status === "success"} />
          {status !== "success" ? (
            <button
              className="primary-button"
              type="submit"
              disabled={
                status === "submitting" || (kind === "reset-password" && newPassword.length < 12)
              }
            >
              {status === "submitting" ? "Processando…" : buttonFor(kind)}
            </button>
          ) : null}
        </form>
      )}
      <Link className="text-link" href={kind === "request-reset" ? "/" : "/conta"}>
        {kind === "request-reset" ? "Voltar ao início" : "Abrir meu arquivo celeste"}
      </Link>
    </section>
  );
}

interface ActionFieldsProps {
  kind: ActionKind;
  email: string;
  newPassword: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}

function ActionFields(props: Readonly<ActionFieldsProps>): React.JSX.Element | null {
  if (props.kind === "request-reset")
    return (
      <>
        <label htmlFor="recovery-email">Email</label>
        <input
          id="recovery-email"
          type="email"
          autoComplete="email"
          required
          maxLength={320}
          value={props.email}
          onChange={(event) => props.onEmailChange(event.target.value)}
        />
      </>
    );
  if (props.kind !== "reset-password") return null;
  return (
    <>
      <label htmlFor="recovery-new-password">Nova senha</label>
      <input
        id="recovery-new-password"
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        maxLength={128}
        value={props.newPassword}
        onChange={(event) => props.onPasswordChange(event.target.value)}
      />
      <small>Use pelo menos 12 caracteres.</small>
    </>
  );
}

function ActionFeedback({
  message,
  succeeded,
}: Readonly<{ message: string; succeeded: boolean }>): React.JSX.Element | null {
  if (message.length === 0) return null;
  return <output className={succeeded ? "account-success" : "form-error"}>{message}</output>;
}

async function performAccountAction(
  kind: ActionKind,
  email: string,
  newPassword: string,
  token?: string,
): Promise<string> {
  const response = await fetch(endpointFor(kind), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyFor(kind, email, newPassword, token)),
  });
  const body = (await response.json()) as { message?: unknown; error?: unknown };
  if (!response.ok)
    throw new Error(typeof body.error === "string" ? body.error : "Não foi possível continuar.");
  return typeof body.message === "string" ? body.message : "Concluído.";
}

function endpointFor(kind: ActionKind): string {
  if (kind === "request-reset") return "/api/auth/password-reset/request";
  if (kind === "reset-password") return "/api/auth/password-reset/confirm";
  return "/api/auth/email-verification/confirm";
}

function bodyFor(kind: ActionKind, email: string, newPassword: string, token?: string): object {
  if (kind === "request-reset") return { email };
  if (kind === "reset-password") return { token, newPassword };
  return { token };
}

function titleFor(kind: ActionKind): string {
  if (kind === "request-reset") return "Recupere o acesso ao seu arquivo.";
  if (kind === "reset-password") return "Crie uma nova senha.";
  return "Confirme seu email.";
}

function descriptionFor(kind: ActionKind): string {
  if (kind === "request-reset")
    return "Se houver uma conta para o email informado, enviaremos um link de uso único.";
  if (kind === "reset-password")
    return "O link expira em 30 minutos e deixa de funcionar depois da confirmação.";
  return "Esta confirmação protege seu arquivo e prepara a conta para comunicações essenciais.";
}

function buttonFor(kind: ActionKind): string {
  if (kind === "request-reset") return "Enviar link seguro";
  if (kind === "reset-password") return "Redefinir senha";
  return "Confirmar email";
}
