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
    return "dois nomes chegaram aqui com a mesma força, e desempatar não cabe a um cálculo. Esse tipo de confirmação acontece no contexto religioso, com quem tem autoridade para dizê-lo — nunca numa tela.";
  if (reason === "insufficient_evidence_breadth")
    return "o que sustenta este papel ainda vem de poucos caminhos independentes. Preferimos deixar em aberto a fechar em cima de eco: uma resposta bonita e mal apoiada seria pior que o silêncio.";
  if (reason === "distinct_candidate_unavailable")
    return "os nomes que apareceriam aqui já ocupam outro papel no seu mapa. Repeti-los daria aparência de resposta sem acrescentar nada — e este papel merece um lugar próprio, ou nenhum.";
  return "os sinais deste papel ainda não se encontram num nome só. O mapa não fica menos seu por isso; fica apenas honesto sobre onde ainda não enxerga.";
}
