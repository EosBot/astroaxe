import "server-only";

import type { NextRequest } from "next/server";

import { parseServerEnv } from "@/lib/env";
import { isSameOrigin, resolveAccount } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";

import {
  requiredTierFor,
  resolveAccessTier,
  tierAllows,
  type AccessTier,
  type FeatureId,
} from "./features";

export interface FeatureGrant {
  /** Nulo quando o recurso é aberto e ninguém entrou. */
  userId: string | null;
  tier: AccessTier;
}

/**
 * Porta de qualquer recurso do produto.
 *
 * Recebe o recurso, e não a regra: quem escreve a rota declara **o que** está
 * servindo, e o catálogo decide **quem** pode. É isso que torna a virada do
 * paywall barata — mudar o preço de um recurso passa a ser editar uma linha do
 * catálogo, e não caçar condicionais espalhadas por trinta rotas.
 *
 * Distingue faltar conta de faltar plano. Responder 401 a quem já entrou mandaria
 * a pessoa fazer login de novo para descobrir, no fim, que o problema era outro;
 * 402 diz o que de fato falta.
 */
export async function authorizeFeature(
  request: NextRequest,
  feature: FeatureId,
  options: { requireSameOrigin: boolean },
): Promise<Response | FeatureGrant> {
  const env = parseServerEnv();

  if (options.requireSameOrigin && !isSameOrigin(request, env.SITE_URL))
    return apiJson({ error: "Origem inválida." }, { status: 403 });

  const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
  const userId = account?.id ?? null;
  const tier = await resolveAccessTier(userId);

  if (tierAllows(tier, feature)) return { userId, tier };

  if (requiredTierFor(feature) !== "anonymous" && userId === null)
    return apiJson(
      { error: "Entre na sua conta para usar este recurso.", feature },
      { status: 401 },
    );

  return apiJson(
    { error: "Este recurso faz parte do plano pago.", feature, tier },
    { status: 402 },
  );
}
