import { NextRequest } from "next/server";
import { z } from "zod";

import { randomUUID } from "node:crypto";

import { buildDeletionTombstone } from "@/domain/ceremonial/deletion-ledger";
import {
  evaluateReleaseApprovals,
  PLANNER_REQUIRED_APPROVALS,
} from "@/domain/ceremonial/release-approval";
import { declaredReleaseApprovals } from "@/domain/ceremonial/release-approval-data";
import { loadRecordKeyring, openPlan } from "@/lib/ceremonial/plan-store";
import { parseServerEnv } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import { isSameOrigin, resolveAccount } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";
import type { RecordKeyring } from "@/lib/security/record-encryption";

const paramsSchema = z.object({ planId: z.uuid() });

/**
 * Um plano do dono, e a exclusão dele.
 *
 * A exclusão apaga as sessões junto, pela cascata declarada no schema. Apagar o
 * plano e deixar as sessões órfãs guardaria justamente as notas de prática que a
 * pessoa pediu para remover.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ planId: string }> },
): Promise<Response> {
  const guard = await authorize(request, context, { requireSameOrigin: false });
  if (guard instanceof Response) return guard;

  const row = await getPrisma().ceremonialPlan.findFirst({
    where: { id: guard.planId, userId: guard.userId },
    select: {
      id: true,
      titleEnvelope: true,
      intentionEnvelope: true,
      selectionEnvelope: true,
      scheduleEnvelope: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  // Não-dono e inexistente devolvem a mesma resposta: distinguir os dois
  // confirmaria a existência de um plano alheio a quem perguntou.
  if (row === null) return apiJson({ error: "Plano não encontrado." }, { status: 404 });

  return apiJson({ plan: openPlan({ keyring: guard.keyring, userId: guard.userId, row }) });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ planId: string }> },
): Promise<Response> {
  const guard = await authorize(request, context, { requireSameOrigin: true });
  if (guard instanceof Response) return guard;

  // Exclusão e tombstone na mesma transação. Apagar sem registrar deixaria uma
  // restauração ressuscitar o plano sem que nada apontasse o erro; registrar sem
  // apagar guardaria marca de exclusão que não houve.
  const { count } = await getPrisma().$transaction(async (tx) => {
    const removidas = await tx.ceremonialSession.findMany({
      where: { planId: guard.planId, plan: { userId: guard.userId } },
      select: { id: true },
    });
    const resultado = await tx.ceremonialPlan.deleteMany({
      where: { id: guard.planId, userId: guard.userId },
    });
    // Nada apagado significa plano de outra pessoa ou já removido: não há o que
    // sepultar, e criar tombstone aqui registraria exclusão que não aconteceu.
    if (resultado.count > 0) {
      const agora = new Date();
      const tombstones = [
        buildDeletionTombstone({
          id: randomUUID(),
          recordKind: "ceremonial_plan",
          recordId: guard.planId,
          userId: guard.userId,
          deletedAt: agora,
        }),
        // As sessões caem em cascata, e cada uma precisa da própria marca: a
        // restauração traz linhas, e não o plano como unidade.
        ...removidas.map((sessao) =>
          buildDeletionTombstone({
            id: randomUUID(),
            recordKind: "ceremonial_session",
            recordId: sessao.id,
            userId: guard.userId,
            deletedAt: agora,
          }),
        ),
      ];
      await tx.deletionTombstone.createMany({
        data: tombstones.map((tombstone) => ({
          id: tombstone.id,
          recordKind: tombstone.recordKind,
          recordId: tombstone.recordId,
          userId: tombstone.userId,
          deletedAt: new Date(tombstone.deletedAt),
          expiresAt: new Date(tombstone.expiresAt),
        })),
        skipDuplicates: true,
      });
    }
    return resultado;
  });
  // Idempotente: apagar de novo devolve o mesmo 204. Um 404 na segunda chamada
  // faria um cliente que repetiu a requisição pensar que falhou.
  if (count === 0) return apiJson({ error: "Plano não encontrado." }, { status: 404 });
  return new Response(null, { status: 204 });
}

async function authorize(
  request: NextRequest,
  context: { params: Promise<{ planId: string }> },
  options: { requireSameOrigin: boolean },
): Promise<Response | { userId: string; planId: string; keyring: RecordKeyring }> {
  const env = parseServerEnv();
  if (options.requireSameOrigin && !isSameOrigin(request, env.SITE_URL))
    return apiJson({ error: "Origem inválida." }, { status: 403 });

  const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
  if (account === null) return apiJson({ error: "Entre para usar seus planos." }, { status: 401 });

  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) return apiJson({ error: "Plano inválido." }, { status: 400 });

  // A aprovação de tratamento é condição de funcionamento, e não formalidade:
  // ausente, revogada ou vencida, o recurso não opera. É o que a task 39 pede ao
  // dizer que aprovação faltante bloqueia ativação.
  const approvals = evaluateReleaseApprovals({
    approvals: declaredReleaseApprovals,
    required: PLANNER_REQUIRED_APPROVALS,
    on: new Date().toISOString().slice(0, 10),
  });
  if (approvals.status === "blocked")
    return apiJson(
      { error: "Os registros privados não estão liberados para uso." },
      { status: 503 },
    );

  const keyring = loadRecordKeyring(env.CEREMONIAL_RECORD_KEYRING);
  if (keyring === null)
    return apiJson({ error: "Os registros privados não estão configurados." }, { status: 503 });

  return { userId: account.id, planId: params.data.planId, keyring };
}
