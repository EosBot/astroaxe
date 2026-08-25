import type { Metadata } from "next";

import { CulturalArchive } from "@/components/cultural-content/cultural-archive";

export const metadata: Metadata = {
  title: "Acervo cultural",
  description:
    "Corpus de pesquisa e leituras culturais versionadas, com autoria, fontes e limites explícitos.",
  alternates: { canonical: "/acervo-cultural" },
  openGraph: {
    type: "website",
    title: "Acervo cultural — AstroAxe",
    description:
      "Corpus de pesquisa e leituras culturais versionadas, com autoria, fontes e limites explícitos.",
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
