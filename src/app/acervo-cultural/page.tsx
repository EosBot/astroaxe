import type { Metadata } from "next";

import { CulturalArchive } from "@/components/cultural-content/cultural-archive";

export const metadata: Metadata = {
  title: "Acervo cultural",
  description:
    "Textos culturais longos, versionados e rastreáveis, com fontes e limites de uso explícitos.",
  alternates: { canonical: "/acervo-cultural" },
  openGraph: {
    type: "website",
    title: "Acervo cultural — AstroAxe",
    description:
      "Textos culturais longos, versionados e rastreáveis, com fontes e limites de uso explícitos.",
    url: "/acervo-cultural",
  },
};

export default function CulturalArchivePage(): React.JSX.Element {
  return (
    <main id="conteudo-principal" className="observatory-shell cultural-archive-shell">
      <CulturalArchive />
    </main>
  );
}
