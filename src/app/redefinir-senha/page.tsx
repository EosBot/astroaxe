import type { Metadata } from "next";

import { AccountActionForm } from "@/components/account/account-action-form";

export const metadata: Metadata = {
  title: "Redefinir senha",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ token?: string }> }>): Promise<React.JSX.Element> {
  const { token } = await searchParams;
  return (
    <main id="conteudo-principal" className="observatory-shell auth-action-shell">
      <AccountActionForm kind="reset-password" token={token} />
    </main>
  );
}
