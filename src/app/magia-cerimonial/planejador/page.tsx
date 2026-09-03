import type { Metadata } from "next";

import { CeremonialPlanner } from "@/components/ceremonial/ceremonial-planner";

export const metadata: Metadata = {
  title: "Planejador cerimonial",
  alternates: { canonical: "/magia-cerimonial/planejador" },
  robots: { index: false, follow: false, nocache: true },
};

export default function PlannerPage(): React.JSX.Element {
  return (
    <main id="conteudo-principal" className="observatory-shell methodology-shell">
      <article className="methodology-document">
        <header className="methodology-hero">
          <div>
            <p className="eyebrow">Ferramenta</p>
            <h1>O seu caderno, fechado à chave.</h1>
          </div>
          <p>
            Guarde o que pretende, quando aconteceu e o que você observou. Nada aqui é sugerido pelo
            AstroAxe — ele calcula, cataloga e guarda; a prática é sua e o registro também. O que
            você escreve é cifrado no servidor com uma chave amarrada a você, ao registro e ao
            campo, e some por inteiro quando você apagar.
          </p>
        </header>

        <CeremonialPlanner />
      </article>
    </main>
  );
}
