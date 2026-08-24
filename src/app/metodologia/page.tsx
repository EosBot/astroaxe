import type { Metadata } from "next";
import Link from "next/link";

import { REGENCY_EVALUATION_VERSION } from "@/domain/orixas/regency/calibration";
import {
  REGENCY_COMPARISON_VERSION,
  regencyPromotionPolicy,
} from "@/domain/orixas/regency/dataset-freeze";
import { experimentalRegencyConfig } from "@/domain/orixas/regency/experimental-config";
import { experimentalRegencyMatrix } from "@/domain/orixas/regency/experimental-matrix";
import { REGENCY_FEATURE_VERSION } from "@/domain/orixas/regency/features";
import { REGENCY_SCORER_VERSION } from "@/domain/orixas/regency/scorer";

export const metadata: Metadata = {
  title: "Metodologia",
  description:
    "Como o método autoral AstroAxe transforma dados astrológicos calculados em uma leitura cultural rastreável.",
  alternates: { canonical: "/metodologia" },
  openGraph: {
    type: "website",
    title: "Metodologia — AstroAxe",
    description:
      "Versões, fatores, evidências, critérios de decisão e estado de validação do método AstroAxe.",
    url: "/metodologia",
  },
};

const stages = [
  ["Mapa", "Posições, casas, ângulos e aspectos calculados pelo motor astronômico."],
  ["Fatores", "Elementos, modalidades, decanatos, dignidades e temporalidades extraídos."],
  ["Correspondências", "Claims publicados e hipóteses derivadas permanecem em trilhas distintas."],
  ["Score", "Cada contribuição conserva regra, fonte estrutural, evidência e multiplicador."],
  ["Decisão", "Frente e cabeça são principais; costas só aparece quando supera os mínimos."],
] as const;

export default function MethodologyPage(): React.JSX.Element {
  const derivedClaims = experimentalRegencyMatrix.claims.filter(
    (claim) => claim.evidenceTrack === "derived_symbolic_hypothesis",
  );
  return (
    <main id="conteudo-principal" className="observatory-shell methodology-shell">
      <article className="methodology-document">
        <header className="methodology-hero">
          <div>
            <p className="eyebrow">Caderno aberto · versão de pesquisa</p>
            <h1>Da posição no céu à decisão explicável.</h1>
          </div>
          <p>
            O AstroAxe combina astrologia ocidental determinística com uma matriz cultural
            versionada. Cada resultado deve permitir reconstruir quais fatores entraram, quanto
            pesaram e por que um papel foi atribuído — ou permaneceu sem resposta.
          </p>
        </header>

        <ol className="method-chain" aria-label="Etapas do método AstroAxe">
          {stages.map(([title, description]) => (
            <li key={title}>
              <strong>{title}</strong>
              <span>{description}</span>
            </li>
          ))}
        </ol>

        <section className="methodology-section" aria-labelledby="method-status">
          <p className="eyebrow">Estado observável</p>
          <h2 id="method-status">O motor está em pesquisa, não ativo no resultado público.</h2>
          <p>
            A matriz experimental cobre 25 Orixás com {derivedClaims.length} hipóteses derivadas.
            Dessas,{" "}
            {derivedClaims.filter(({ attributeClaimIds }) => attributeClaimIds.length > 1).length}{" "}
            dependem da convergência de mais de um atributo. Correspondências publicadas conservam
            peso integral; hipóteses derivadas recebem seu multiplicador explícito de convergência.
          </p>
          <p>
            Não há dataset real no repositório e nenhuma porcentagem de acurácia é publicada. A
            integração ao produto permanece bloqueada até validação congelada e revisão cultural.
          </p>
        </section>

        <section className="methodology-section" aria-labelledby="method-versions">
          <p className="eyebrow">Instrumentos fixados</p>
          <h2 id="method-versions">Cada camada tem sua própria versão.</h2>
          <dl className="method-versions">
            <div>
              <dt>Features</dt>
              <dd>{REGENCY_FEATURE_VERSION}</dd>
            </div>
            <div>
              <dt>Matriz</dt>
              <dd>{experimentalRegencyMatrix.version}</dd>
            </div>
            <div>
              <dt>Pesos</dt>
              <dd>{experimentalRegencyConfig.version}</dd>
            </div>
            <div>
              <dt>Scorer</dt>
              <dd>{REGENCY_SCORER_VERSION}</dd>
            </div>
            <div>
              <dt>Avaliação</dt>
              <dd>{REGENCY_EVALUATION_VERSION}</dd>
            </div>
            <div>
              <dt>Comparação</dt>
              <dd>{REGENCY_COMPARISON_VERSION}</dd>
            </div>
          </dl>
        </section>

        <section
          className="methodology-section methodology-columns"
          aria-label="Decisão e validação"
        >
          <div>
            <p className="eyebrow">Como decide</p>
            <h2>O terceiro nome não é obrigatório.</h2>
            <p>
              Frente e cabeça são avaliados como manifestações principais. Costas representa a
              camada ancestral do vocabulário autoral e pode permanecer não determinado. Score
              insuficiente, pouca diversidade de evidência, falta de candidato distinto ou empate
              substantivo produzem uma abstenção explicada.
            </p>
          </div>
          <div>
            <p className="eyebrow">Como valida</p>
            <h2>Amostra pequena não aprova versão.</h2>
            <p>
              A política {regencyPromotionPolicy.version} exige ao menos 30 rótulos de validação
              para frente e 30 para cabeça, sem perda top-1 ou top-3 e com aumento de abstenção
              limitado. Passar o corte torna a versão apenas elegível para revisão cultural.
            </p>
          </div>
        </section>

        <section className="methodology-section" aria-labelledby="method-time">
          <p className="eyebrow">Hora, lugar e temporalidade</p>
          <h2 id="method-time">Precisão ausente reduz fatores; não é escondida pelo texto.</h2>
          <p>
            Sem hora natal, casas, ângulos e hora planetária são omitidos. Dias e horas planetárias
            usam os intervalos solares reais. Em condições polares sem nascer ou pôr calculável, o
            padrão é se abster; o proxy equinocial permanece experimental e é medido separadamente.
          </p>
        </section>

        <footer className="methodology-footer">
          <p>
            Método autoral AstroAxe; versão de pesquisa ainda não aplicada ao resultado público.
          </p>
          <Link href="/">Calcular meu mapa astrológico</Link>
        </footer>
      </article>
    </main>
  );
}
