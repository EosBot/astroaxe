import type { Metadata } from "next";

import { CorrespondenceTable } from "@/components/ceremonial/correspondence-table";

export const metadata: Metadata = {
  title: "Tábua operacional",
  alternates: { canonical: "/ferramentas/tabua" },
  robots: { index: false, follow: false, nocache: true },
};

export default function CorrespondenceTablePage(): React.JSX.Element {
  return (
    <main id="conteudo-principal" className="observatory-shell methodology-shell">
      <article className="methodology-document">
        <header className="methodology-hero">
          <div>
            <p className="eyebrow">Ferramenta</p>
            <h1>A tábua, para consulta rápida.</h1>
          </div>
          <p>
            Planeta, signo, elemento, modalidade e casa que o método associa a cada Orixá — numa
            página só, para quem precisa conferir no meio do preparo em vez de ler um ensaio. Leia o
            aviso abaixo antes: ele muda o peso de tudo que vem depois.
          </p>
        </header>

        <CorrespondenceTable />
      </article>
    </main>
  );
}
