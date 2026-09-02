import { z } from "zod";

export const DELETION_LEDGER_VERSION = "ceremonial-deletion-ledger-1.0.0";

/** Janela declarada pela task 35: sete dias além da retenção de backup. */
export const TOMBSTONE_RETENTION_DAYS = 37;

/**
 * Marca de exclusão.
 *
 * Guarda **que** algo foi apagado, e nunca **o que** era. Um tombstone com
 * conteúdo derrotaria o próprio propósito: seria guardar o dado que a pessoa
 * pediu para remover, agora num lugar que a exclusão não alcança.
 *
 * A janela é maior que a do backup de propósito. Se o tombstone expirasse antes,
 * restaurar um backup ainda dentro da retenção ressuscitaria o registro apagado
 * sem que nada apontasse o erro — que é exatamente o furo que este registro existe
 * para fechar.
 */
export const deletionTombstoneSchema = z
  .object({
    id: z.uuid(),
    recordKind: z.enum(["ceremonial_plan", "ceremonial_session"]),
    recordId: z.uuid(),
    /** Dono do registro, para que a purga por conta consiga varrer. */
    userId: z.uuid(),
    deletedAt: z.iso.datetime(),
    expiresAt: z.iso.datetime(),
  })
  .strict();

export type DeletionTombstone = z.infer<typeof deletionTombstoneSchema>;

/**
 * Monta o tombstone de um registro que acabou de ser apagado.
 *
 * O vencimento é derivado, e não recebido: deixar a janela a cargo do chamador
 * permitiria gravar tombstone que expira antes do backup correspondente.
 */
export function buildDeletionTombstone(input: {
  id: string;
  recordKind: DeletionTombstone["recordKind"];
  recordId: string;
  userId: string;
  deletedAt: Date;
}): DeletionTombstone {
  const expira = new Date(input.deletedAt);
  expira.setUTCDate(expira.getUTCDate() + TOMBSTONE_RETENTION_DAYS);

  return deletionTombstoneSchema.parse({
    id: input.id,
    recordKind: input.recordKind,
    recordId: input.recordId,
    userId: input.userId,
    deletedAt: input.deletedAt.toISOString(),
    expiresAt: expira.toISOString(),
  });
}

export interface RestoreVerification {
  ledgerVersion: string;
  status: "clean" | "resurrected";
  /** Registros que voltaram numa restauração apesar de terem sido apagados. */
  resurrected: { recordKind: DeletionTombstone["recordKind"]; recordId: string }[];
  /** Tombstones já vencidos, que não têm mais o que proteger. */
  expired: number;
}

/**
 * Confere uma restauração contra o registro de exclusão.
 *
 * É o passo que a task 35 exige antes de liberar o app: restaurar um backup
 * anterior a uma exclusão traz de volta o que foi apagado, e sem esta conferência
 * ninguém saberia. Tombstone vencido não acusa — passada a janela, o backup que
 * continha aquele registro já não existe.
 */
export function verifyRestoreAgainstLedger(input: {
  tombstones: readonly unknown[];
  restoredRecordIds: readonly string[];
  on: string;
}): RestoreVerification {
  const tombstones = input.tombstones.map((tombstone) => deletionTombstoneSchema.parse(tombstone));
  const restaurados = new Set(input.restoredRecordIds);

  const vigentes = tombstones.filter(({ expiresAt }) => expiresAt > input.on);
  const resurrected = vigentes
    .filter(({ recordId }) => restaurados.has(recordId))
    .map(({ recordKind, recordId }) => ({ recordKind, recordId }))
    .sort((left, right) => left.recordId.localeCompare(right.recordId));

  return {
    ledgerVersion: DELETION_LEDGER_VERSION,
    status: resurrected.length === 0 ? "clean" : "resurrected",
    resurrected,
    expired: tombstones.length - vigentes.length,
  };
}

/** Tombstones que já passaram da janela e podem sair do registro. */
export function expiredTombstoneIds(input: {
  tombstones: readonly DeletionTombstone[];
  on: string;
}): string[] {
  return input.tombstones
    .filter(({ expiresAt }) => expiresAt <= input.on)
    .map(({ id }) => id)
    .sort();
}
