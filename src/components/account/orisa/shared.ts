export const roles = [
  ["front", "Frente", "expressão e modo de chegada"],
  ["head", "Cabeça", "organização consciente e direção"],
  ["back", "Costas", "base, memória e sustentação"],
] as const;

export const affinityLabels = {
  predominant: "predominante",
  strong: "forte",
  present: "presente",
  subtle: "sutil",
} as const;

export const stabilityLabels = {
  unavailable: "amostra de fontes insuficiente",
  low: "sensível",
  medium: "moderada",
  high: "alta",
} as const;

export function explainReason(reason: string | undefined): string {
  if (reason === "tradition_confirmation_required")
    return "há um empate que pede confirmação no contexto tradicional";
  if (reason === "insufficient_evidence_breadth") return "faltam fontes independentes suficientes";
  if (reason === "distinct_candidate_unavailable")
    return "não há candidato distinto para este papel";
  return "a convergência ainda é insuficiente";
}
