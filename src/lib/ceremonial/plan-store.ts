import {
  openRecordField,
  recordKeyringSchema,
  sealRecordField,
  type RecordEnvelope,
  type RecordKeyring,
} from "@/lib/security/record-encryption";

import type {
  CeremonialPlanInput,
  CeremonialPlanView,
  CeremonialSessionInput,
  CeremonialSessionView,
} from "./plan-contracts";

/**
 * Carrega o keyring da configuração.
 *
 * Devolve `null` quando a variável não está definida, e é o chamador que decide o
 * que fazer — as rotas respondem que o recurso não está configurado. Gerar uma
 * chave sozinho seria pior: os registros ficariam ilegíveis no próximo boot.
 *
 * Keyring presente e inválido **estoura**, em vez de virar `null`: configuração
 * malformada é erro do operador, e tratá-la como ausência esconderia o defeito.
 */
export function loadRecordKeyring(raw: string | undefined): RecordKeyring | null {
  if (raw === undefined) return null;
  return recordKeyringSchema.parse(JSON.parse(raw));
}

interface PlanRow {
  id: string;
  titleEnvelope: unknown;
  intentionEnvelope: unknown;
  selectionEnvelope: unknown;
  scheduleEnvelope: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionRow {
  id: string;
  planId: string;
  occurredAt: Date;
  notesEnvelope: unknown;
  observationEnvelope: unknown;
  outcomeEnvelope: unknown;
}

/**
 * Cifra os campos de um plano para gravação.
 *
 * `recordId` entra no AAD, então o envelope só abre no registro em que foi
 * gravado. Isso obriga a conhecer o id **antes** de cifrar — daí o id ser gerado
 * pelo chamador e não pelo banco.
 */
export function sealPlan(input: {
  keyring: RecordKeyring;
  userId: string;
  planId: string;
  plan: CeremonialPlanInput;
}): {
  titleEnvelope: RecordEnvelope;
  intentionEnvelope: RecordEnvelope;
  selectionEnvelope?: RecordEnvelope;
  scheduleEnvelope?: RecordEnvelope;
} {
  const seal = (fieldName: string, plaintext: string) =>
    sealRecordField({
      keyring: input.keyring,
      binding: { userId: input.userId, recordId: input.planId, fieldName },
      plaintext,
    });

  // Campo opcional ausente é **omitido**, e não gravado como nulo: o Prisma
  // distingue nulo de JSON no banco, e omitir deixa a coluna no default.
  return {
    titleEnvelope: seal("titleEnvelope", input.plan.title),
    intentionEnvelope: seal("intentionEnvelope", input.plan.intention),
    ...(input.plan.selection === undefined
      ? {}
      : { selectionEnvelope: seal("selectionEnvelope", JSON.stringify(input.plan.selection)) }),
    ...(input.plan.scheduledFor === undefined
      ? {}
      : { scheduleEnvelope: seal("scheduleEnvelope", input.plan.scheduledFor) }),
  };
}

export function openPlan(input: {
  keyring: RecordKeyring;
  userId: string;
  row: PlanRow;
}): CeremonialPlanView {
  const open = (fieldName: string, envelope: unknown) =>
    openRecordField({
      keyring: input.keyring,
      binding: { userId: input.userId, recordId: input.row.id, fieldName },
      envelope,
    });

  const selection = input.row.selectionEnvelope;
  return {
    id: input.row.id,
    title: open("titleEnvelope", input.row.titleEnvelope),
    intention: open("intentionEnvelope", input.row.intentionEnvelope),
    selection:
      selection === null || selection === undefined
        ? []
        : (JSON.parse(open("selectionEnvelope", selection)) as string[]),
    scheduledFor:
      input.row.scheduleEnvelope === null || input.row.scheduleEnvelope === undefined
        ? null
        : open("scheduleEnvelope", input.row.scheduleEnvelope),
    createdAt: input.row.createdAt.toISOString(),
    updatedAt: input.row.updatedAt.toISOString(),
  };
}

export function sealSession(input: {
  keyring: RecordKeyring;
  userId: string;
  sessionId: string;
  session: CeremonialSessionInput;
}): {
  notesEnvelope?: RecordEnvelope;
  observationEnvelope?: RecordEnvelope;
  outcomeEnvelope?: RecordEnvelope;
} {
  const seal = (fieldName: string, plaintext: string | undefined) =>
    plaintext === undefined
      ? undefined
      : sealRecordField({
          keyring: input.keyring,
          binding: { userId: input.userId, recordId: input.sessionId, fieldName },
          plaintext,
        });

  const notes = seal("notesEnvelope", input.session.notes);
  const observation = seal("observationEnvelope", input.session.observation);
  const outcome = seal("outcomeEnvelope", input.session.outcome);

  return {
    ...(notes === undefined ? {} : { notesEnvelope: notes }),
    ...(observation === undefined ? {} : { observationEnvelope: observation }),
    ...(outcome === undefined ? {} : { outcomeEnvelope: outcome }),
  };
}

export function openSession(input: {
  keyring: RecordKeyring;
  userId: string;
  row: SessionRow;
}): CeremonialSessionView {
  const open = (fieldName: string, envelope: unknown) =>
    envelope === null || envelope === undefined
      ? null
      : openRecordField({
          keyring: input.keyring,
          binding: { userId: input.userId, recordId: input.row.id, fieldName },
          envelope,
        });

  return {
    id: input.row.id,
    planId: input.row.planId,
    occurredAt: input.row.occurredAt.toISOString(),
    notes: open("notesEnvelope", input.row.notesEnvelope),
    observation: open("observationEnvelope", input.row.observationEnvelope),
    outcome: open("outcomeEnvelope", input.row.outcomeEnvelope),
  };
}
