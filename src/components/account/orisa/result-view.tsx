import Link from "next/link";

import { RitualSeal } from "@/components/site/ritual-seal";
import type { PublicRegencyResponse } from "@/lib/orixas/public-regency";

import { affinityLabels, explainReason, roles, stabilityLabels } from "./shared";

export function OrisaResultView({
  result,
}: Readonly<{ result: PublicRegencyResponse }>): React.JSX.Element {
  return (
    <section className="orisa-research-lab" aria-labelledby="orisa-lab-title">
      <header>
        <div>
          <p className="eyebrow orisa-method-label">
            <span>V3</span> Leitura autoral em validação
          </p>
          <h1 id="orisa-lab-title">Tríade de Regências AstroAxe</h1>
        </div>
        <p>
          O método cruza o mapa calculado com camadas simbólicas e numerológicas versionadas. Quando
          a convergência não é suficiente, o papel permanece em aberto.
        </p>
      </header>
      <div className="orisa-role-grid">
        {roles.map(([role, label, description]) => {
          const roleResult = result.roles[role];
          return (
            <article key={role}>
              <small>{label}</small>
              <div className="orisa-role-heading">
                {roleResult.selectedId === null ? null : (
                  <RitualSeal orisaId={roleResult.selectedId} size={44} />
                )}
                <h2>
                  {roleResult.selectedId === null
                    ? "Em aberto"
                    : roleResult.candidates.find(({ orisaId }) => orisaId === roleResult.selectedId)
                        ?.displayName}
                </h2>
              </div>
              <p>{description}</p>
              <p className="orisa-stability">
                Estabilidade entre fontes: <strong>{stabilityLabels[roleResult.stability]}</strong>
              </p>
              {roleResult.determiningFactors.length === 0 ? null : (
                <div className="orisa-factors">
                  <h3>O que sustentou esta leitura</h3>
                  <ul>
                    {roleResult.determiningFactors.map((factor) => (
                      <li key={factor}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}
              <ol>
                {roleResult.candidates.map((candidate) => (
                  <li key={candidate.orisaId}>
                    <span>{candidate.displayName}</span>
                    <strong>{affinityLabels[candidate.affinity]}</strong>
                  </li>
                ))}
              </ol>
              {roleResult.selectedId === null ? (
                <p className="orisa-unresolved">
                  Este papel fica em aberto: {explainReason(roleResult.unresolvedReason)}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
      <footer>
        <strong>{result.methodVersion}</strong>
        <p>
          A leitura combina sinais independentes e testa se a conclusão permanece estável quando uma
          família de evidência é retirada. Instabilidade favorece uma resposta em aberto.
        </p>
        <p>{result.disclaimer}</p>
        <p>
          Estas correspondências não substituem confirmação religiosa, consulta a praticantes ou
          jogo de búzios.
        </p>
        <p>Métricas de validação serão publicadas quando a amostra atingir o corte definido.</p>
        <p>
          <Link href="/metodologia">Como este método funciona</Link> — entradas, processo,
          versionamento, avaliação e limites.
        </p>
      </footer>
    </section>
  );
}
