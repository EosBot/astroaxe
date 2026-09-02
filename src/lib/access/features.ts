import "server-only";

/**
 * Fronteira do freemium.
 *
 * O AstroAxe cobra por quase tudo. São gratuitos o mapa natal, o horóscopo e o
 * horóscopo sombrio — os três derivam do mesmo cálculo natal e existem para que
 * alguém conheça o produto antes de pagar. O resto é pago.
 *
 * Três níveis, e não dois. Fosse só "entrou / não entrou", ligar a cobrança
 * exigiria reescrever cada chamada; com `free` separado de `paid`, o dia da
 * virada muda uma função e mais nada. Hoje `free` e `paid` coincidem de
 * propósito: o produto está em fase de teste e a cobrança ainda não existe.
 */
export const ACCESS_TIERS = ["anonymous", "free", "paid"] as const;

export type AccessTier = (typeof ACCESS_TIERS)[number];

const TIER_RANK: Readonly<Record<AccessTier, number>> = {
  anonymous: 0,
  free: 1,
  paid: 2,
};

/**
 * Nível mínimo de cada recurso.
 *
 * Toda superfície do produto aparece aqui. Recurso fora do catálogo é recurso
 * sem porta, e recurso sem porta é recurso aberto — por isso a ausência falha
 * em `requiredTierFor` em vez de virar caminho permissivo.
 */
export const FEATURE_CATALOG = {
  /* Gratuitos. Os três saem do mesmo cálculo natal. */
  "natal-chart": "anonymous",
  horoscope: "anonymous",
  "shadow-horoscope": "anonymous",

  /**
   * Exportar os próprios dados é direito, e não produto.
   *
   * A LGPD garante acesso e portabilidade a quem é titular. Cobrar por isso
   * transformaria um direito em recurso pago, então este é o único item que
   * nunca sobe para `paid`, aconteça o que acontecer com a tabela de preços.
   */
  "data-export": "free",
  "account-archive": "free",

  /* Pagos. */
  transits: "paid",
  lunar: "paid",
  returns: "paid",
  synastry: "paid",
  "annual-calendar": "paid",
  "thematic-maps": "paid",
  "orisa-triad": "paid",
  journal: "paid",
  "cultural-archive": "paid",
  "ceremonial-timing": "paid",
  "ceremonial-windows": "paid",
  "ceremonial-planner": "paid",
  "ceremonial-correspondences": "paid",
} as const satisfies Readonly<Record<string, AccessTier>>;

export type FeatureId = keyof typeof FEATURE_CATALOG;

export function requiredTierFor(feature: FeatureId): AccessTier {
  const tier: AccessTier | undefined = FEATURE_CATALOG[feature];
  // Impossível pelo tipo, mas o catálogo é editado à mão: falhar aqui é melhor
  // que liberar por omissão.
  if (tier === undefined) throw new Error(`Recurso sem nível declarado: ${feature}`);
  return tier;
}

/**
 * Assinatura vigente do titular.
 *
 * **Este é o ponto do paywall.** Enquanto o produto está em fase de teste,
 * qualquer conta autenticada vale como paga. Quando a cobrança entrar, esta
 * função consulta a assinatura — e nada mais no código precisa mudar.
 */
export async function hasPaidPlan(userId: string): Promise<boolean> {
  return await Promise.resolve(userId.length > 0);
}

/** Nível de quem está pedindo: sem conta, com conta, ou com conta paga. */
export async function resolveAccessTier(userId: string | null): Promise<AccessTier> {
  if (userId === null) return "anonymous";
  return (await hasPaidPlan(userId)) ? "paid" : "free";
}

export function tierAllows(tier: AccessTier, feature: FeatureId): boolean {
  return TIER_RANK[tier] >= TIER_RANK[requiredTierFor(feature)];
}
