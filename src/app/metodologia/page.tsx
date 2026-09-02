import type { Metadata } from "next";

import { buildPublicFunctionGraph } from "@/domain/orixas/regency/public-function-graph";
import { regencyFunctionGraph } from "@/domain/orixas/regency/function-graph-data";
import Link from "next/link";

import { listMethodCorrections } from "@/domain/orixas/regency/method-corrections";
import {
  PUBLIC_REGENCY_METHOD_CARD,
  PUBLIC_REGENCY_METHOD_SUMMARY,
  PUBLIC_REGENCY_METHOD_VERSION,
} from "@/domain/orixas/regency/public-method";

export const metadata: Metadata = {
  title: "Como funciona o método",
  description:
    "Model card do método autoral de regências AstroAxe: entradas, processo, condensação das tradições, versionamento, avaliação e limites conhecidos.",
  alternates: { canonical: "/metodologia" },
  openGraph: {
    type: "website",
    title: "Como funciona o método — AstroAxe",
    description:
      "Astrologia calculada, condensação de tradições por função estrutural e controles de estabilidade em uma leitura autoral.",
    url: "/metodologia",
  },
};

const { chain, condensation, corpus, versioning, evaluation, limits } = PUBLIC_REGENCY_METHOD_CARD;
const publicGraph = buildPublicFunctionGraph(regencyFunctionGraph);
const corrections = listMethodCorrections();

export default function MethodologyPage(): React.JSX.Element {
  return (
    <main id="conteudo-principal" className="observatory-shell methodology-shell">
      <article className="methodology-document">
        <header className="methodology-hero">
          <div>
            <p className="eyebrow">Model card · método autoral de regências</p>
            <h1>Um método rastreável, sem transformar profundidade em caixa-preta.</h1>
          </div>
          <p>
            O AstroAxe combina cálculo astrológico determinístico com um sistema autoral de
            correspondências culturais. Esta página publica o que entra, como as tradições são
            condensadas, como a qualidade é controlada e onde o método termina. A matriz, os pesos e
            as regras proprietárias permanecem protegidos.
          </p>
        </header>

        <ol className="method-chain" aria-label="Etapas públicas do método AstroAxe">
          {chain.map(({ title, summary }) => (
            <li key={title}>
              <strong>{title}</strong>
              <span>{summary}</span>
            </li>
          ))}
        </ol>

        <section className="methodology-section" aria-labelledby="method-contract">
          <p className="eyebrow">Contrato público</p>
          <h2 id="method-contract">O que você pode conferir.</h2>
          <div className="methodology-columns" aria-label="Entradas e controles do método">
            <MethodList title="Entradas declaradas" items={PUBLIC_REGENCY_METHOD_SUMMARY.inputs} />
            <MethodList
              title="Controles de qualidade"
              items={PUBLIC_REGENCY_METHOD_SUMMARY.controls}
            />
          </div>
        </section>

        <section className="methodology-section" aria-labelledby="method-process">
          <p className="eyebrow">Processo</p>
          <h2 id="method-process">Cada etapa, com o que ela de fato faz.</h2>
          <dl className="method-detail-list">
            {chain.map(({ title, detail }) => (
              <div key={title}>
                <dt>{title}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="methodology-section" aria-labelledby="method-condensation">
          <p className="eyebrow">Condensação das tradições</p>
          <h2 id="method-condensation">Tradições diferentes respondendo à mesma pergunta.</h2>
          <p>
            O que o método faz não é escolher uma tradição nem misturar todas num caldo. É separar a
            afirmação da tradição da posição estrutural que ela descreve, e depois agrupar por
            posição — em três camadas.
          </p>
          <dl className="method-detail-list">
            {condensation.layers.map(({ title, detail }) => (
              <div key={title}>
                <dt>{title}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </dl>

          <p className="method-emphasis">{condensation.lineageRule}</p>

          <ul className="method-strengths" aria-label="Graus de sustentação">
            {condensation.strengthLabels.map(({ label, detail }) => (
              <li key={label}>
                <strong>{label}</strong>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
          <p>
            A sustentação é dita em palavras, e não em percentual: não existe amostra que calibre um
            número aqui, e um número seria lido como certeza.
          </p>

          <p className="method-emphasis method-limit">{condensation.limit}</p>
        </section>

        <section className="methodology-section" aria-labelledby="method-corpus">
          <p className="eyebrow">O acervo de pesquisa</p>
          <h2 id="method-corpus">De onde o método vem, sem entregar de onde.</h2>
          <p>{corpus.summary}</p>

          <dl className="method-detail-list">
            {corpus.classes.map(({ title, detail }) => (
              <div key={title}>
                <dt>{title}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </dl>

          <p className="method-emphasis">O que impede o acervo de virar afirmação frouxa:</p>
          <ul className="method-criteria">
            {corpus.controls.map((control) => (
              <li key={control}>{control}</li>
            ))}
          </ul>
        </section>

        <section className="methodology-section" aria-labelledby="method-functions">
          <p className="eyebrow">O grafo de funções</p>
          <h2 id="method-functions">As perguntas que as tradições respondem juntas.</h2>
          <p>
            Cada função abaixo é uma pergunta estrutural. Sob ela ficam as potências que diferentes
            tradições apontam como resposta — e o que se afirma é que elas ocupam a mesma posição,
            nunca que são a mesma coisa. As categorias aparecem lado a lado justamente para que essa
            diferença não se perca.
          </p>
          <p>
            A sustentação é contada por linhagem, não por obra: quatro livros de um mesmo autor são
            uma voz só.
          </p>

          <ol className="method-function-list">
            {publicGraph.functions.map((funcao) => (
              <li key={funcao.functionId}>
                <h3>{funcao.label}</h3>
                <p className="method-function-question">{funcao.question}</p>
                <ul className="method-function-occupants">
                  {funcao.occupants.map(({ name, categoryLabel }) => (
                    <li key={`${funcao.functionId}-${name}`}>
                      <strong>{name}</strong>
                      <span>{categoryLabel}</span>
                    </li>
                  ))}
                </ul>
                <p className="method-function-support">{funcao.supportLabel}</p>
                {funcao.divergenceNote === null ? null : (
                  <p className="method-function-divergence">{funcao.divergenceNote}</p>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="methodology-section" aria-labelledby="method-versioning">
          <p className="eyebrow">Versionamento</p>
          <h2 id="method-versioning">Versão antes de promessa.</h2>
          <p>{versioning.principle}</p>
          <dl className="method-versions">
            {versioning.surfaces.map(({ label, value }) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <h3 className="method-subheading">O que já foi corrigido</h3>
          <p>
            Um princípio de correção sem registro é promessa. Estas são as correções que o método já
            sofreu, com a causa e o efeito de cada uma — inclusive quando o efeito foi mostrar menos
            do que se mostrava antes.
          </p>
          <ol className="method-corrections">
            {corrections.map((correction) => (
              <li key={correction.id}>
                <p className="method-correction-meta">
                  <time dateTime={correction.recordedOn}>{formatDate(correction.recordedOn)}</time>
                  <span>{correction.area}</span>
                </p>
                <p className="method-correction-change">{correction.whatChanged}</p>
                <p>
                  <strong>Por quê:</strong> {correction.why}
                </p>
                <p>
                  <strong>Efeito:</strong> {correction.consequence}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="methodology-section" aria-labelledby="method-evaluation">
          <p className="eyebrow">Avaliação</p>
          <h2 id="method-evaluation">O que uma versão nova precisa provar.</h2>
          <p>{evaluation.intro}</p>
          <ul className="method-criteria">
            {evaluation.criteria.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{evaluation.decisionStates}</p>
        </section>

        <section className="methodology-section" aria-labelledby="method-limits">
          <p className="eyebrow">Limites conhecidos</p>
          <h2 id="method-limits">O método sabe onde termina.</h2>
          <dl className="method-detail-list">
            {limits.map(({ title, detail }) => (
              <div key={title}>
                <dt>{title}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="methodology-section" aria-labelledby="method-privacy">
          <p className="eyebrow">Tecnologia proprietária</p>
          <h2 id="method-privacy">Transparência não exige publicar a receita.</h2>
          <p>
            Tudo acima descreve o que entra, como se decide e onde o método para. O que fica de fora
            é o mecanismo: a matriz completa, os coeficientes, os limiares e as regras de desempate.
            Essa separação permite auditar o resultado sem entregar a construção que constitui a
            propriedade intelectual do AstroAxe.
          </p>
        </section>

        <footer className="methodology-footer">
          <p>{PUBLIC_REGENCY_METHOD_VERSION}. Método autoral; consulte os limites desta página.</p>
          <Link href="/">Calcular meu mapa</Link>
        </footer>
      </article>
    </main>
  );
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function MethodList({ title, items }: Readonly<{ title: string; items: readonly string[] }>) {
  return (
    <div>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
