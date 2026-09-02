import { randomUUID } from "node:crypto";

import { NextRequest } from "next/server";
import { z } from "zod";

import { ceremonialSessionInputSchema } from "@/lib/ceremonial/plan-contracts";
import {
  evaluateReleaseApprovals,
  PLANNER_REQUIRED_APPROVALS,
} from "@/domain/ceremonial/release-approval";
import { declaredReleaseApprovals } from "@/domain/ceremonial/release-approval-data";
import { loadRecordKeyring, openSession, sealSession } from "@/lib/ceremonial/plan-store";
import { parseServerEnv } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import { isSameOrigin, resolveAccount } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";
import { checkJsonRequest } from "@/lib/security/json-body";
import type { RecordKeyring } from "@/lib/security/record-encryption";

const paramsSchema = z.object({ planId: z.uuid() });

const SESSION_SELECT = {
  id: true,
  planId: true,
  occurredAt: true,
  notesEnvelope: true,
  observationEnvelope: true,
  outcomeEnvelope: true,
} as const;

/**
 * Sessões de um plano do dono.
 *
 * A propriedade é verificada pelo **plano**, e não pela sessão: uma sessão só
 * existe dentro de um plano, e conferir só o id da sessão deixaria a porta aberta
 * para ler a sessão de um plano alheio.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ planId: string }> },
): Promise<Response> {
  const guard = await authorize(request, context, { requireSameOrigin: false });
  if (guard instanceof Response) return guard;

  const rows = await getPrisma().ceremonialSession.findMany({
    where: { planId: guard.planId, plan: { userId: guard.userId } },
    orderBy: { occurredAt: "desc" },
    take: 200,
    select: SESSION_SELECT,
  });

  return apiJson({
    sessions: rows.map((row) => openSession({ keyring: guard.keyring, userId: guard.userId, row })),
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ planId: string }> },
): Promise<Response> {
  // Limite maior que o padrão porque uma sessão comporta notas de até 8.000
  // caracteres, e em UTF-8 isso passa folgado dos 16 KB do padrão.
  const body = checkJsonRequest(request, 32_768);
  if (!body.ok)
    return apiJson(
      { error: body.status === 415 ? "Envie a sessão como JSON." : "Sessão grande demais." },
      { status: body.status },
    );
  const guard = await authorize(request, context, { requireSameOrigin: true });
  if (guard instanceof Response) return guard;

  let session;
  try {
    session = ceremonialSessionInputSchema.parse(await request.json());
  } catch {
    return apiJson({ error: "Sessão inválida." }, { status: 400 });
  }

  // O plano precisa ser do dono antes de qualquer gravação: sem esta conferência
  // um id alheio criaria sessão dentro do plano de outra pessoa.
  const plan = await getPrisma().ceremonialPlan.findFirst({
    where: { id: guard.planId, userId: guard.userId },
    select: { id: true },
  });
  if (plan === null) return apiJson({ error: "Plano não encontrado." }, { status: 404 });

  const sessionId = randomUUID();
  const created = await getPrisma().ceremonialSession.create({
    data: {
      id: sessionId,
      planId: guard.planId,
      occurredAt: new Date(session.occurredAt),
      ...sealSession({ keyring: guard.keyring, userId: guard.userId, sessionId, session }),
    },
    select: SESSION_SELECT,
  });

  return apiJson(
    { session: openSession({ keyring: guard.keyring, userId: guard.userId, row: created }) },
    { status: 201 },
  );
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
