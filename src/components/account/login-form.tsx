"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authResponseSchema } from "@/lib/auth/contracts";

export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function login(): Promise<void> {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body: unknown = await response.json();
      if (!response.ok || !authResponseSchema.safeParse(body).success)
        throw new Error(
          typeof body === "object" &&
            body !== null &&
            "error" in body &&
            typeof body.error === "string"
            ? body.error
            : "Não foi possível entrar.",
        );
      router.push("/conta");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível entrar.");
      setBusy(false);
    }
  }

  return (
    <section className="auth-action-card" aria-labelledby="login-title">
      <p className="eyebrow">Seu observatório</p>
      <h1 id="login-title">Entre para abrir sua central celeste.</h1>
      <p>Seus mapas, trânsitos, diário, sinastria e ciclos ficam reunidos em um só lugar.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void login();
        }}
      >
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          maxLength={320}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label htmlFor="login-password">Senha</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          minLength={12}
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {message ? (
          <p className="form-error" role="alert">
            {message}
          </p>
        ) : null}
        <button className="primary-button" type="submit" disabled={busy || password.length < 12}>
          {busy ? "Abrindo…" : "Entrar na minha central"}
        </button>
      </form>
      <Link className="text-link" href="/recuperar-senha">
        Esqueci minha senha
      </Link>
      <p className="auth-register-note">
        Ainda não tem conta? <Link href="/#ceu">Calcule seu primeiro mapa gratuitamente.</Link>
      </p>
    </section>
  );
}
