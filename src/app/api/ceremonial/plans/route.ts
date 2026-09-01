import { randomUUID } from "node:crypto";

import { NextRequest } from "next/server";
import { z } from "zod";

import { evaluateGuidancePolicy } from "@/domain/ceremonial/guidance-policy";
import { ceremonialPlanInputSchema } from "@/lib/ceremonial/plan-contracts";
import { loadRecordKeyring, openPlan, sealPlan } from "@/lib/ceremonial/plan-store";
import { parseServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma";
import { isSameOrigin, resolveAccount } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";
import type { RecordKeyring } from "@/lib/security/record-encryption";

const PLAN_SELECT = {
  id: true,
  titleEnvelope: true,
  intentionEnvelope: true,
  selectionEnvelope: true,
  scheduleEnvelope: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Planos cerimoniais do dono.
 *
 * Tudo aqui é do usuário autenticado e de mais ninguém: a consulta filtra por
 * `userId` em vez de conferir depois, para que não exista caminho em que um id
 * alheio devolva linha.
 *
 * Sem keyring configurado a rota responde 503 e **não grava**. Guardar em claro
 * "só até configurarem" é como esses dados vazam.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const guard = await authorize(request, { requireSameOrigin: false });
  if (guard instanceof Response) return guard;

  const rows = await getPrisma().ceremonialPlan.findMany({
    where: { userId: guard.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: PLAN_SELECT,
  });

  try {
    return apiJson({
      plans: rows.map((row) => openPlan({ keyring: guard.keyring, userId: guard.userId, row })),
    });
  } catch (error) {
    logger.warn(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "ceremonial plan decryption failed",
    );
    return apiJson({ error: "Não foi possível abrir seus planos." }, { status: 503 });
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return apiJson({ error: "Envie o plano como JSON." }, { status: 415 });
  const guard = await authorize(request, { requireSameOrigin: true });
  if (guard instanceof Response) return guard;

  let plan;
  try {
    plan = ceremonialPlanInputSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) return apiJson({ error: "Plano inválido." }, { status: 400 });
    return apiJson({ error: "Não foi possível ler o plano enviado." }, { status: 400 });
  }

  // A política da task 20 decide antes de qualquer gravação. Recusar depois de
  // gravar deixaria no banco exatamente o que a política existe para não aceitar.
  const decision = evaluateGuidancePolicy({
    operation: "create",
    goalCategory: plan.goalCategory,
    target: plan.target,
  });
  if (decision.kind === "refused_guidance")
    return apiJson(
      { error: decision.publicMessage, helpCategory: decision.helpCategory },
      { status: 422 },
    );

  const planId = randomUUID();
  const created = await getPrisma().ceremonialPlan.create({
    data: {
      id: planId,
      userId: guard.userId,
      ...sealPlan({ keyring: guard.keyring, userId: guard.userId, planId, plan }),
    },
    select: PLAN_SELECT,
  });

  return apiJson(
    { plan: openPlan({ keyring: guard.keyring, userId: guard.userId, row: created }) },
    { status: 201 },
  );
}

async function authorize(
  request: NextRequest,
  options: { requireSameOrigin: boolean },
): Promise<Response | { userId: string; keyring: RecordKeyring }> {
  const env = parseServerEnv();
  if (options.requireSameOrigin && !isSameOrigin(request, env.SITE_URL))
    return apiJson({ error: "Origem inválida." }, { status: 403 });

  const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
  if (account === null) return apiJson({ error: "Entre para usar seus planos." }, { status: 401 });

  const keyring = loadRecordKeyring(env.CEREMONIAL_RECORD_KEYRING);
  if (keyring === null)
    return apiJson({ error: "Os registros privados não estão configurados." }, { status: 503 });

  return { userId: account.id, keyring };
}
