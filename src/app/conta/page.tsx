import { ProfileArchive } from "@/components/account/profile-archive";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arquivo celeste",
  alternates: { canonical: "/conta" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AccountPage(): React.JSX.Element {
  return (
    <main id="conteudo-principal" className="observatory-shell archive-shell">
      <ProfileArchive />
    </main>
  );
}
