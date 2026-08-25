import type { Metadata } from "next";
import Link from "next/link";

import {
  PUBLIC_REGENCY_METHOD_SUMMARY,
  PUBLIC_REGENCY_METHOD_VERSION,
} from "@/domain/orixas/regency/public-method";

export const metadata: Metadata = {
  title: "Como funciona o método",
  description:
    "Conheça as entradas, controles de qualidade e limites do método autoral de regências AstroAxe.",
  alternates: { canonical: "/metodologia" },
  openGraph: {
    type: "website",
    title: "Como funciona o método — AstroAxe",
    description:
      "Astrologia calculada, camadas simbólicas versionadas e controles de estabilidade em uma leitura autoral.",
    url: "/metodologia",
  },
};

const stages = [
  ["Calcular", "O céu natal é calculado com data, hora e lugar informados."],
  [
    "Interpretar",
    "O sistema organiza padrões astrológicos, temporais e numerológicos compatíveis.",
  ],
  [
    "Cruzar",
    "Correspondências documentadas são avaliadas sem tratar repetição editorial como consenso.",
  ],
  ["Testar", "A estabilidade da leitura é verificada antes de apresentar cada papel."],
  [
    "Explicar",
    "O resultado mostra os sinais predominantes e informa quando um papel fica em aberto.",
  ],
] as const;

export default function MethodologyPage(): React.JSX.Element {
  return (
    <main id="conteudo-principal" className="observatory-shell methodology-shell">
      <article className="methodology-document">
        <header className="methodology-hero">
          <div>
            <p className="eyebrow">Transparência técnica · propriedade intelectual preservada</p>
            <h1>Um método rastreável, sem transformar profundidade em caixa-preta.</h1>
          </div>
          <p>
            O AstroAxe combina cálculo astrológico determinístico com um sistema autoral de
            correspondências culturais. Publicamos o que entra, como a qualidade é controlada e
            quais são os limites. A matriz, os pesos e as regras proprietárias permanecem
            protegidos.
          </p>
        </header>

        <ol className="method-chain" aria-label="Etapas públicas do método AstroAxe">
          {stages.map(([title, description]) => (
            <li key={title}>
              <strong>{title}</strong>
              <span>{description}</span>
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

        <section className="methodology-section" aria-labelledby="method-privacy">
          <p className="eyebrow">Tecnologia proprietária</p>
          <h2 id="method-privacy">Transparência não exige publicar a receita.</h2>
          <p>
            O produto identifica a versão aplicada e explica os fatores que sustentam a leitura. Não
            divulga a matriz completa, coeficientes, limiares, regras de desempate nem o corpus
            interno. Essa separação permite auditoria do resultado sem entregar o mecanismo que
            constitui a propriedade intelectual do AstroAxe.
          </p>
        </section>

        <section
          className="methodology-section methodology-columns"
          aria-label="Precisão e limites"
        >
          <div>
            <p className="eyebrow">Precisão proporcional</p>
            <h2>Dados ausentes reduzem a leitura.</h2>
            <p>
              Sem hora natal, casas, ângulos e outros fatores dependentes de horário não entram. O
              sistema não preenche lacunas com estimativas silenciosas e pode manter um papel em
              aberto quando a convergência é insuficiente.
            </p>
          </div>
          <div>
            <p className="eyebrow">Limites publicados</p>
            <h2>O método sabe onde termina.</h2>
            <ul>
              {PUBLIC_REGENCY_METHOD_SUMMARY.disclosedLimitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="methodology-section" aria-labelledby="method-validation">
          <p className="eyebrow">Validação contínua</p>
          <h2 id="method-validation">Versão antes de promessa.</h2>
          <p>
            Cada alteração que possa mudar um resultado recebe nova versão e testes de regressão.
            Métricas de acurácia só serão publicadas com população, amostra e protocolo de validação
            claramente informados. Até lá, o score expressa aderência ao método — não porcentagem de
            certeza espiritual.
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
