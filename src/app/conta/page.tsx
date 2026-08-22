import { ProfileArchive } from "@/components/account/profile-archive";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Arquivo celeste",
  alternates: { canonical: "/conta" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AccountPage(): React.JSX.Element {
  return (
    <main id="conteudo-principal" className="observatory-shell archive-shell">
      <header className="brand-mark archive-brand">
        <Link href="/">
          <span aria-hidden="true">✦</span> AstroAxe
        </Link>
        <small>
          Arquivo celeste · <Link href="/acervo-cultural">Acervo cultural</Link>
        </small>
      </header>
      <ProfileArchive />
    </main>
  );
}
