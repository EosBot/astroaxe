import "server-only";

import type { NextRequest } from "next/server";

import { evaluateAdultAccess } from "@/domain/ceremonial/adult-access";
import {
  evaluateReleaseApprovals,
  PLANNER_REQUIRED_APPROVALS,
} from "@/domain/ceremonial/release-approval";
import { declaredReleaseApprovals } from "@/domain/ceremonial/release-approval-data";
import { parseServerEnv } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
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
 * A ordem das verificações não é arbitrária. Origem antes de conta, porque não
 * faz sentido consultar sessão de uma requisição que nem devia chegar. Conta
 * antes de idade, porque a declaração pertence a alguém. Idade antes de direito
 * de acesso, porque pagar não torna ninguém maior de idade.
 */

/**
 * Direito de acesso ao que é pago.
 *
 * **Este é o ponto do paywall.** O AstroAxe é freemium e as ferramentas
 * cerimoniais são pagas, mas a cobrança ainda não existe: o produto está em
 * fase de teste, e nesta fase qualquer conta autenticada tem acesso.
 *
 * Quando a cobrança entrar, muda-se esta função e mais nada. Foi para isso que
 * ela existe separada, em vez de virar um `if` dentro do guarda: uma condicional
 * espalhada por quatro rotas vira quatro comportamentos diferentes no dia em que
 * a primeira assinatura vencer.
 */
export async function hasCeremonialEntitlement(userId: string): Promise<boolean> {
  // Fase de teste: estar autenticado basta. A função já nasce assíncrona e
  // recebendo o titular para que ligar a cobrança não obrigue a mexer em quem
  // chama.
  return await Promise.resolve(userId.length > 0);
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

  // Declaração de maioridade, e não verificação: não existe caminho gratuito
  // para verificar idade. O que se exige aqui é a declaração registrada, e ela
  // barra quem não declarou, quem é menor pela própria data e quem declarou sob
  // um texto que não é mais o vigente.
  const titular = await getPrisma().user.findUnique({
    where: { id: account.id },
    select: { birthDate: true, adultAttestedAt: true, adultAttestationVersion: true },
  });
  const adulto = evaluateAdultAccess({
    birthDate: titular?.birthDate?.toISOString().slice(0, 10) ?? null,
    attestedAt: titular?.adultAttestedAt?.toISOString() ?? null,
    attestationVersion: titular?.adultAttestationVersion ?? null,
    on: new Date().toISOString().slice(0, 10),
  });
  if (adulto.status !== "cleared")
    return apiJson(
      { error: "Este recurso é restrito a maiores de 18 anos.", access: adulto },
      { status: 403 },
    );

  if (!(await hasCeremonialEntitlement(account.id)))
    return apiJson(
      { error: "As ferramentas cerimoniais fazem parte do plano pago." },
      { status: 402 },
    );

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
