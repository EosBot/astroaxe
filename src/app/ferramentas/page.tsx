import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ferramentas cerimoniais",
  alternates: { canonical: "/ferramentas" },
  robots: { index: false, follow: false, nocache: true },
};

const tools = [
  {
    href: "/ferramentas/janelas",
    name: "Buscador de janelas",
    what: "Você diz o lugar e o período; a busca percorre hora planetária por hora planetária e mostra quais atendem ao que cada tradição pede. É o contrário do tempo cerimonial, que confere uma hora já escolhida.",
  },
  {
    href: "/ferramentas/correspondencias",
    name: "Diretório de correspondências",
    what: "Você chega com um nome e descobre que posição ele ocupa — e quem mais ocupa a mesma, vindo de outra linhagem. Nenhuma tradição enxerga as outras; o cruzamento é o que o acervo torna possível.",
  },
  {
    href: "/ferramentas/planejador",
    name: "Planejador",
    what: "Seu caderno fechado à chave: o que você pretende, quando aconteceu, o que observou. Cifrado no servidor, e apagado por inteiro quando você mandar.",
  },
  {
    href: "/ferramentas/tabua",
    name: "Tábua operacional",
    what: "Planeta, signo, elemento, modalidade e casa que o método associa a cada Orixá, numa página só, para conferir no meio do preparo.",
  },
] as const;

export default function ToolsIndexPage(): React.JSX.Element {
  return (
    <main id="conteudo-principal" className="observatory-shell methodology-shell">
      <article className="methodology-document">
        <header className="methodology-hero">
          <div>
            <p className="eyebrow">Ferramentas</p>
            <h1>Instrumentos, não conselhos.</h1>
          </div>
          <p>
            Quatro ferramentas que calculam, cruzam e guardam. Nenhuma delas diz o que fazer — essa
            parte é sua, e continua sendo. O que elas oferecem é o trabalho que ninguém faria à mão:
            varrer um mês de horas, cruzar tradições que nunca se falaram, e guardar o que você
            registrou de um jeito que só você abre.
          </p>
        </header>

        <section className="methodology-section" aria-labelledby="tools-list">
          <h2 id="tools-list">O que existe hoje.</h2>
          {tools.map((tool) => (
            <article key={tool.href} className="window-group">
              <h3>
                <Link href={tool.href}>{tool.name}</Link>
              </h3>
              <p>{tool.what}</p>
            </article>
          ))}
        </section>
      </article>
    </main>
  );
}
