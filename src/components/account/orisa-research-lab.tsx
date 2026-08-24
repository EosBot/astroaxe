import { extractRegencyAstrologicalFeatures } from "@/domain/orixas/regency/features";
import { regencyMatrix } from "@/domain/orixas/regency/matrix";
import { regencyResearchConfig } from "@/domain/orixas/regency/research-config";
import { scoreRegencies } from "@/domain/orixas/regency/scorer";
import {
  assessRegencyRobustness,
  REGENCY_ROBUSTNESS_VERSION,
} from "@/domain/orixas/regency/robustness";
import type { WesternChartEnvelope } from "@/domain/astrology/western/contracts";
import type { CreateMapResponse } from "@/lib/maps/contracts";
import { SYMBOLIC_RESONANCE_DISCLAIMER } from "@/lib/orixas/contracts";

const roles = [
  ["front", "Frente", "expressão e modo de chegada"],
  ["head", "Cabeça", "organização consciente e direção"],
  ["back", "Costas", "base, memória e sustentação"],
] as const;

export function OrisaResearchLab({
  chart,
}: Readonly<{ chart: CreateMapResponse["chart"] }>): React.JSX.Element {
  const result = scoreRegencies({
    matrix: regencyMatrix,
    config: regencyResearchConfig,
    astrologicalFeatures: extractRegencyAstrologicalFeatures(toDomainChart(chart)),
  });
  const robustness = assessRegencyRobustness({
    matrix: regencyMatrix,
    config: regencyResearchConfig,
    astrologicalFeatures: extractRegencyAstrologicalFeatures(toDomainChart(chart)),
  });

  return (
    <section className="orisa-research-lab" aria-labelledby="orisa-lab-title">
      <header>
        <div>
          <p className="eyebrow orisa-beta-label">
            <span>Beta</span> Laboratório cultural em desenvolvimento
          </p>
          <h1 id="orisa-lab-title">Ressonâncias com Orixás</h1>
        </div>
        <p>
          O módulo aplica a matriz aprovada aos dados calculados, mas preserva a abstenção quando a
          evidência não sustenta uma escolha.
        </p>
      </header>
      <div className="orisa-role-grid">
        {roles.map(([role, label, description]) => {
          const candidates = result.rankingsByRole[role].slice(0, 3);
          const selectedId = result.triad[role];
          return (
            <article key={role}>
              <small>{label}</small>
              <h2>
                {selectedId === null
                  ? "Em aberto"
                  : candidates.find((candidate) => candidate.orisaId === selectedId)?.displayName}
              </h2>
              <p>{description}</p>
              <p className="orisa-stability">
                Estabilidade experimental:{" "}
                <strong>{formatStability(robustness.roles[role])}</strong>
              </p>
              <ol>
                {candidates.map((candidate) => (
                  <li key={candidate.orisaId}>
                    <span>{candidate.displayName}</span>
                    <strong>{Math.round(candidate.normalizedScore * 100)}%</strong>
                  </li>
                ))}
              </ol>
              {selectedId === null ? (
                <p className="orisa-unresolved">
                  Resultado não fechado: {explainReason(result.unresolvedRoles[role]?.reason)}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
      <footer>
        <strong>Recurso Beta — metodologia em desenvolvimento.</strong>
        <p>
          Os resultados podem mudar conforme o conjunto de validação cresce. A estabilidade mede se
          o candidato permanece no topo ao retirar, uma por vez, as escolas públicas de
          correspondência; instabilidade favorece a abstenção, não uma conclusão forçada.
        </p>
        <p>{SYMBOLIC_RESONANCE_DISCLAIMER}</p>
        <p>
          Estas correspondências simbólicas não substituem confirmação religiosa, consulta a
          praticantes ou jogo de búzios.
        </p>
        <p>
          Versões: {result.scorerVersion} · {regencyMatrix.version} · {REGENCY_ROBUSTNESS_VERSION} ·
          validação pública ainda não concluída.
        </p>
      </footer>
    </section>
  );
}

function formatStability(role: { eligible: boolean; topCandidateRetention: number }): string {
  if (!role.eligible) return "amostra de fontes insuficiente";
  return `${Math.round(role.topCandidateRetention * 100)}%`;
}

function toDomainChart(chart: CreateMapResponse["chart"]): WesternChartEnvelope {
  const base = {
    mode: chart.mode,
    engineVersion: chart.engineVersion,
    configVersion: chart.configVersion,
    inputFingerprint: chart.inputFingerprint,
    jdUt: chart.jdUt,
    planets: chart.planets,
    warnings: chart.warnings,
  };
  return chart.houses === undefined ? base : { ...base, houses: chart.houses };
}

function explainReason(reason: string | undefined): string {
  if (reason === "tradition_confirmation_required")
    return "há empate que exige confirmação pela tradição";
  if (reason === "insufficient_evidence_breadth") return "faltam fontes independentes suficientes";
  if (reason === "distinct_candidate_unavailable")
    return "não há candidato distinto para este papel";
  return "a pontuação ainda é insuficiente";
}
