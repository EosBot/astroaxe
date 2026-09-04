import type { Metadata } from "next";
import Link from "next/link";

import { tradicoes } from "@/domain/tradicoes/catalogo";

export const metadata: Metadata = {
  title: "Magia Cerimonial",
  alternates: { canonical: "/magia-cerimonial" },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Os quatro passos do trabalho.
 *
 * A ordem não é decorativa: é como se prepara um trabalho de verdade. Primeiro
 * se sabe o que se quer, depois com quem se vai trabalhar, depois o que aquilo
 * cobra — e só então a hora e o preparo. Inverter isso é o que produz trabalho
 * feito no automático.
 */
const steps = [
  {
    number: "I",
    name: "A finalidade",
    what: "Devoção, oferenda, sacrifício, proteção, limpeza, saúde, prosperidade, amor, justiça, ancestralidade, iniciação ou consulta. O que você quer determina tudo o que vem depois — a entidade, o dia, a oferenda e o preço.",
  },
  {
    number: "II",
    name: "Com quem se trabalha",
    what: "Orixás, Exus, Pombas Giras, falanges, anjos, espíritos olímpicos e inteligências planetárias. Cada um tem domínio, temperamento e forma própria de atuar, e a escolha não é intercambiável: quem serve à justiça não serve ao amor do mesmo jeito.",
  },
  {
    number: "III",
    name: "A advertência",
    what: "Antes de qualquer procedimento, o que aquela entidade e aquele tipo de trabalho cobram: como a coisa atua, o que costuma vir junto, o que se assume ao abrir. Você lê e decide. Daí em diante é entre você e a lei divina.",
  },
  {
    number: "IV",
    name: "O preparo, em detalhe",
    what: "Dia e hora planetária, ponto e assentamento, oferenda item a item e o que cada um significa, ervas, banho, defumação, ponto cantado, firmeza, tempo de permanência e descarte. Sem etapa omitida por pudor.",
  },
] as const;

/** Rótulo de cada profundidade. Mapa em vez de ternário aninhado: acrescentar
    um nível passa a ser acrescentar uma linha. */
const DEPTH_LABELS: Readonly<Record<string, string>> = {
  orientacao: "Orienta procedimento",
  fundamento: "Explica fundamento",
  panorama: "Apresenta e situa",
};

const instruments = [
  {
    href: "/magia-cerimonial/trabalhos",
    name: "Guia de trabalhos",
    what: "Banho, defumação, oferenda, firmeza, talismã e petição — cada um com o que cobra, quando se faz, o que se usa, a ordem dos passos e o descarte.",
  },
  {
    href: "/magia-cerimonial/janelas",
    name: "Buscador de janelas",
    what: "Varre o período hora a hora e mostra quando o céu atende ao que a tradição pede para o seu trabalho.",
  },
  {
    href: "/magia-cerimonial/correspondencias",
    name: "Diretório de correspondências",
    what: "Quem ocupa a mesma posição em cada linhagem — para saber com quem mais se pode trabalhar aquela função.",
  },
  {
    href: "/magia-cerimonial/tabua",
    name: "Tábua operacional",
    what: "Planeta, signo, elemento, modalidade e casa de cada Orixá, para conferir no meio do preparo.",
  },
  {
    href: "/magia-cerimonial/planejador",
    name: "Caderno de trabalhos",
    what: "O que você pretende, quando foi feito, o que veio depois. Cifrado, e só você abre.",
  },
] as const;

export default function CeremonialMagicPage(): React.JSX.Element {
  return (
    <main id="conteudo-principal" className="observatory-shell methodology-shell">
      <article className="methodology-document">
        <header className="methodology-hero">
          <div>
            <p className="eyebrow">Magia cerimonial</p>
            <h1>Da intenção ao ato, sem pular etapa.</h1>
          </div>
          <p>
            Aqui se prepara trabalho. Você diz o que quer, escolhe com quem vai trabalhar, lê o que
            aquilo cobra — e recebe o preparo inteiro: dia, hora, ponto, oferenda, erva, banho,
            defumação, procedimento e descarte. Nada de meia orientação: quem chega sabendo o que
            faz não precisa ser poupado, e quem está aprendendo é mal servido por instrução pela
            metade. O risco de abrir é de quem abre, e responde à lei divina.
          </p>
        </header>

        <section className="methodology-section" aria-labelledby="steps-title">
          <p className="eyebrow">Como funciona</p>
          <h2 id="steps-title">Quatro passos, nesta ordem.</h2>
          {steps.map((step) => (
            <article key={step.number} className="ritual-step">
              <span aria-hidden="true">{step.number}</span>
              <div>
                <h3>{step.name}</h3>
                <p>{step.what}</p>
              </div>
            </article>
          ))}
          <p className="method-function-support">
            O caminho guiado está em construção, e o que já existe e o que falta fica aberto em{" "}
            <code>docs/RITUAL_GUIDANCE.md</code>. Os instrumentos abaixo já funcionam e alimentam
            esse caminho.
          </p>
        </section>

        <section className="methodology-section" aria-labelledby="traditions-title">
          <p className="eyebrow">O que o guia cobre</p>
          <h2 id="traditions-title">{tradicoes.length} tradições, e o que cada uma sustenta.</h2>
          <p>
            O acervo não cobre tudo com a mesma profundidade, e fingir que cobre seria o pior
            serviço possível. Cada tradição abaixo diz o quanto há de fundamento por trás dela: onde
            dá para orientar procedimento, onde dá para explicar fundamento, e onde dá apenas para
            situar. A lacuna declarada vale mais que a página cheia.
          </p>
          <ol className="method-function-list">
            {tradicoes.map((tradicao) => (
              <li key={tradicao.id}>
                <h3>{tradicao.name}</h3>
                <p className="method-function-question">{tradicao.summary}</p>
                <p className="method-function-support" data-depth={tradicao.depth}>
                  {DEPTH_LABELS[tradicao.depth]}
                </p>
                {tradicao.entities.length === 0 ? null : (
                  <ul className="method-function-occupants">
                    {tradicao.entities.map((entidade) => (
                      <li key={entidade}>
                        <span>{entidade}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="methodology-section" aria-labelledby="instruments-title">
          <p className="eyebrow">Instrumentos</p>
          <h2 id="instruments-title">O que já está de pé.</h2>
          {instruments.map((tool) => (
            <Link key={tool.href} href={tool.href} className="tool-card">
              <h3>{tool.name}</h3>
              <p>{tool.what}</p>
            </Link>
          ))}
        </section>
      </article>
    </main>
  );
}
