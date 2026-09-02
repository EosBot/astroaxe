import type { Metadata } from "next";
import Link from "next/link";

import { CorrespondenceDirectory } from "@/components/ceremonial/correspondence-directory";

export const metadata: Metadata = {
  title: "Diretório de correspondências",
  alternates: { canonical: "/ferramentas/correspondencias" },
  robots: { index: false, follow: false, nocache: true },
};

export default function CorrespondencesPage(): React.JSX.Element {
  return (
    <main id="conteudo-principal" className="observatory-shell methodology-shell">
      <article className="methodology-document">
        <header className="methodology-hero">
          <div>
            <p className="eyebrow">Ferramenta</p>
            <h1>Quem mais está nessa posição?</h1>
          </div>
          <p>
            Cada tradição enxerga o próprio panteão e não enxerga o das outras. Aqui elas ficam lado
            a lado por <strong>função</strong>: você busca um nome e vê que posição ele ocupa e quem
            mais ocupa a mesma, vindo de outra linhagem. É o que o acervo torna possível e nenhuma
            tradição isolada oferece. O método por trás está em{" "}
            <Link href="/metodologia">Como este método funciona</Link>.
          </p>
        </header>

        <CorrespondenceDirectory />
      </article>
    </main>
  );
}
