import type { Metadata } from "next";

import { AccountActionForm } from "@/components/account/account-action-form";

export const metadata: Metadata = {
  title: "Recuperar senha",
  robots: { index: false, follow: false },
};

export default function RecoverPasswordPage(): React.JSX.Element {
  return (
    <AuthPage>
      <AccountActionForm kind="request-reset" />
    </AuthPage>
  );
}

function AuthPage({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <main id="conteudo-principal" className="observatory-shell auth-action-shell">
      {children}
    </main>
  );
}
