import { useEffect, useState } from "react";

import {
  publicRegencyResponseSchema,
  type PublicRegencyResponse,
} from "@/lib/orixas/public-regency";

const roles = [
  ["front", "Frente", "expressão e modo de chegada"],
  ["head", "Cabeça", "organização consciente e direção"],
  ["back", "Costas", "base, memória e sustentação"],
] as const;

const affinityLabels = {
  predominant: "predominante",
  strong: "forte",
  present: "presente",
  subtle: "sutil",
} as const;

const stabilityLabels = {
  unavailable: "amostra de fontes insuficiente",
  low: "sensível",
  medium: "moderada",
  high: "alta",
} as const;

export function OrisaResearchLab({
  profileId,
}: Readonly<{ profileId: string }>): React.JSX.Element {
  const [result, setResult] = useState<PublicRegencyResponse>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    void loadRegency(profileId, controller.signal)
      .then((response) => {
        setResult(response);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, [profileId]);

  if (status === "loading")
    return (
      <LabState
        title="Cruzando as camadas do método…"
        detail="Calculando sua Tríade com a versão atual."
      />
    );
  if (status === "error" || result === undefined)
    return (
      <LabState
        title="A leitura não abriu."
        detail="Seu mapa continua preservado. Tente acessar este módulo novamente."
      />
    );

  return (
    <section className="orisa-research-lab" aria-labelledby="orisa-lab-title">
      <header>
        <div>
          <p className="eyebrow orisa-method-label">
            <span>V2</span> Leitura autoral em validação
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
              <h2>
                {roleResult.selectedId === null
                  ? "Em aberto"
                  : roleResult.candidates.find(({ orisaId }) => orisaId === roleResult.selectedId)
                      ?.displayName}
              </h2>
              <p>{description}</p>
              <p className="orisa-stability">
                Estabilidade entre fontes: <strong>{stabilityLabels[roleResult.stability]}</strong>
              </p>
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
                  Resultado não fechado: {explainReason(roleResult.unresolvedReason)}
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
      </footer>
    </section>
  );
}

async function loadRegency(profileId: string, signal: AbortSignal): Promise<PublicRegencyResponse> {
  const response = await fetch(`/api/profiles/${profileId}/regency`, { signal });
  const parsed = publicRegencyResponseSchema.safeParse(await response.json());
  if (!response.ok || !parsed.success) throw new Error("regency_load_failed");
  return parsed.data;
}

function LabState({ title, detail }: Readonly<{ title: string; detail: string }>) {
  return (
    <section className="orisa-research-lab" aria-live="polite">
      <header>
        <div>
          <p className="eyebrow">Tríade de Regências</p>
          <h1>{title}</h1>
        </div>
        <p>{detail}</p>
      </header>
    </section>
  );
}

function explainReason(reason: string | undefined): string {
  if (reason === "tradition_confirmation_required")
    return "há um empate que pede confirmação no contexto tradicional";
  if (reason === "insufficient_evidence_breadth") return "faltam fontes independentes suficientes";
  if (reason === "distinct_candidate_unavailable")
    return "não há candidato distinto para este papel";
  return "a convergência ainda é insuficiente";
}
