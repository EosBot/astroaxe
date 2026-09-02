import type { Metadata } from "next";
import Link from "next/link";

import { WindowFinder } from "@/components/ceremonial/window-finder";

export const metadata: Metadata = {
  title: "Buscador de janelas",
  alternates: { canonical: "/ferramentas/janelas" },
  // Recurso pago: não entra em índice de busca, e a porta de verdade fica na
  // API. Uma página que se esconde mas entrega dado não está fechada.
  robots: { index: false, follow: false, nocache: true },
};

export default function CeremonialWindowsPage(): React.JSX.Element {
  return (
    <main id="conteudo-principal" className="observatory-shell methodology-shell">
      <article className="methodology-document">
        <header className="methodology-hero">
          <div>
            <p className="eyebrow">Ferramenta</p>
            <h1>Onde as horas se abrem.</h1>
          </div>
          <p>
            O <Link href="/tempo-cerimonial">tempo cerimonial</Link> responde sobre uma hora que
            você já escolheu. Aqui é o contrário: você diz o lugar e o período, e a busca percorre
            hora planetária por hora planetária para mostrar quais atendem ao que cada tradição
            pede. Nenhuma delas concorda com as outras, e por isso aparecem separadas — uma lista
            única pareceria um calendário com respostas, quando o que existe são leituras
            convivendo. O AstroAxe calcula e cataloga; o que fazer com isso é seu.
          </p>
        </header>

        <WindowFinder />
      </article>
    </main>
  );
}
