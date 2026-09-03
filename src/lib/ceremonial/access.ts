import "server-only";

import type { NextRequest } from "next/server";

import {
  evaluateReleaseApprovals,
  PLANNER_REQUIRED_APPROVALS,
} from "@/domain/ceremonial/release-approval";
import { declaredReleaseApprovals } from "@/domain/ceremonial/release-approval-data";
import { hasPaidPlan } from "@/lib/access/features";
import { parseServerEnv } from "@/lib/env";
import { isSameOrigin, resolveAccount } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";

/**
 * Porta única das ferramentas cerimoniais.
 *
 * Toda ferramenta cerimonial passa por aqui, e por nenhum outro lugar. Antes
 * esta sequência vivia dentro da rota de planos; com mais ferramentas chegando,
 * copiá-la seria garantir que uma delas envelhecesse diferente das outras — e a
 * que envelhece diferente é sempre a que abre a porta que devia estar fechada.
 *
 * A ordem das verificações não é arbitrária: origem antes de conta, porque não
 * faz sentido consultar sessão de uma requisição que nem devia chegar.
 *
 * Não há portão de maioridade. Ele existiu e barrava todo mundo: a declaração
 * nunca teve tela, então nenhuma conta a possuía e as ferramentas respondiam 403
 * a qualquer titular. O dono decidiu que o público é adulto e que o conteúdo é
 * religioso — o contrato de uso é onde isso pertence, e não numa porta que
 * ninguém conseguia atravessar.
 */

/**
 * Direito de acesso ao que é pago, para as ferramentas cerimoniais.
 *
 * O ponto do paywall mudou de lugar: agora é `hasPaidPlan`, em
 * `src/lib/access/features.ts`, que vale para o produto inteiro. Esta função
 * continua existindo porque as rotas cerimoniais a chamam pelo nome, e apontar
 * as duas para a mesma verdade é o que impede o cerimonial de ter uma regra de
 * assinatura própria — que era exatamente o risco.
 */
export async function hasCeremonialEntitlement(userId: string): Promise<boolean> {
  return await hasPaidPlan(userId);
}

export interface CeremonialAccessGrant {
  userId: string;
}

/**
 * Autoriza o uso de uma ferramenta cerimonial.
 *
 * Devolve `Response` quando barra — já com o status e a mensagem que a rota deve
 * responder — e o titular quando libera. Retornar a própria resposta impede o
 * descuido de barrar e seguir adiante mesmo assim.
 */
export async function authorizeCeremonialAccess(
  request: NextRequest,
  options: { requireSameOrigin: boolean },
): Promise<Response | CeremonialAccessGrant> {
  const env = parseServerEnv();

  if (options.requireSameOrigin && !isSameOrigin(request, env.SITE_URL))
    return apiJson({ error: "Origem inválida." }, { status: 403 });

  const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
  if (account === null)
    return apiJson({ error: "Entre para usar as ferramentas cerimoniais." }, { status: 401 });

  // A aprovação de tratamento é condição de funcionamento, e não formalidade:
  // ausente, revogada ou vencida, o recurso não opera.
  const approvals = evaluateReleaseApprovals({
    approvals: declaredReleaseApprovals,
    required: PLANNER_REQUIRED_APPROVALS,
    on: new Date().toISOString().slice(0, 10),
  });
  if (approvals.status === "blocked")
    return apiJson(
      { error: "As ferramentas cerimoniais não estão liberadas para uso." },
      { status: 503 },
    );

  return { userId: account.id };
}
