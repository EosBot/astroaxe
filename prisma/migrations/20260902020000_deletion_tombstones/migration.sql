-- Registro de exclusão para os registros privados de prática.
--
-- Guarda **que** algo foi apagado, e nunca **o que** era. Um tombstone com
-- conteúdo derrotaria o próprio propósito: seria guardar o dado que a pessoa
-- pediu para remover, agora num lugar que a exclusão não alcança.
--
-- Sem relação em cascata com plano ou sessão, e isso é deliberado: o tombstone
-- precisa sobreviver ao registro que ele descreve. Uma chave estrangeira em
-- cascata apagaria a prova junto com o dado.
--
-- A janela é de 37 dias, sete além da retenção de backup de 30. Se o tombstone
-- expirasse antes, restaurar um backup ainda dentro da retenção ressuscitaria o
-- registro apagado sem que nada apontasse o erro.
--
-- Rollback: remover a tabela "deletion_tombstones".
-- Roll-forward: re-execute este arquivo. Faça backup verificado antes de
-- qualquer direção, conforme docs/OPERATIONS.md; nunca remova um volume para
-- "consertar" uma migration.

CREATE TABLE "deletion_tombstones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "record_kind" VARCHAR(40) NOT NULL,
    "record_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "deleted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "deletion_tombstones_pkey" PRIMARY KEY ("id")
);

-- O mesmo registro não pode ser sepultado duas vezes; apagar de novo é
-- idempotente e não deve criar linha nova.
CREATE UNIQUE INDEX "deletion_tombstones_record_kind_record_id_key"
    ON "deletion_tombstones"("record_kind", "record_id");
CREATE INDEX "deletion_tombstones_expires_at_idx" ON "deletion_tombstones"("expires_at");
CREATE INDEX "deletion_tombstones_user_id_deleted_at_idx"
    ON "deletion_tombstones"("user_id", "deleted_at");

-- O vencimento nunca pode ser anterior à exclusão.
ALTER TABLE "deletion_tombstones" ADD CONSTRAINT "deletion_tombstones_window_forward"
    CHECK ("expires_at" > "deleted_at");
