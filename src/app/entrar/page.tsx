import type { Metadata } from "next";

import { LoginForm } from "@/components/account/login-form";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

export default function LoginPage(): React.JSX.Element {
  return (
    <main id="conteudo-principal" className="observatory-shell auth-action-shell">
      <LoginForm />
    </main>
  );
}
