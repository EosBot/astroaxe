import type { Metadata } from "next";

import { WorksGuide } from "@/components/ceremonial/works-guide";

export const metadata: Metadata = {
  title: "Guia de trabalhos",
  alternates: { canonical: "/magia-cerimonial/trabalhos" },
  robots: { index: false, follow: false, nocache: true },
};

export default function WorksPage(): React.JSX.Element {
  return (
    <main id="conteudo-principal" className="observatory-shell methodology-shell">
      <article className="methodology-document">
        <header className="methodology-hero">
          <div>
            <p className="eyebrow">Guia</p>
            <h1>O preparo, do começo ao descarte.</h1>
          </div>
          <p>
            Cada trabalho vem inteiro: o que ele cobra antes de qualquer coisa, quando se faz, o que
            se usa, a ordem dos passos e o que se faz com o que sobra. A advertência vem primeiro de
            propósito — aviso no rodapé chega depois de a pessoa já ter lido o procedimento. Você
            lê, decide, e a partir daí responde à lei divina.
          </p>
        </header>

        <WorksGuide />
      </article>
    </main>
  );
}
