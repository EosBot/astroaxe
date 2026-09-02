-- Declaração de maioridade do titular da conta.
--
-- É atestação, não verificação: não existe forma gratuita de verificar idade, e
-- todas as vias reais — documento, estimativa facial, gov.br por convênio —
-- custam por consulta. O que este esquema guarda é a declaração da pessoa, com a
-- data e a versão do texto que ela viu, para que a decisão seja rastreável.
--
-- Os três campos são anuláveis de propósito. A declaração é colhida **quando o
-- titular for usar o planejador**, e não no cadastro: pedir data de nascimento a
-- quem só quer calcular um mapa coletaria dado que o produto não precisa.
--
-- `birth_date` aqui é do titular da conta e não se confunde com
-- `birth_profiles.birth_date`, que é do sujeito do mapa e pode ser outra pessoa,
-- inclusive uma criança para quem o titular calcula o mapa.
--
-- Rollback: ALTER TABLE "users" DROP COLUMN "birth_date", DROP COLUMN
-- "adult_attested_at", DROP COLUMN "adult_attestation_version";
-- Roll-forward: re-execute este arquivo. Faça backup verificado antes de
-- qualquer direção, conforme docs/OPERATIONS.md; nunca apague um volume para
-- "consertar" uma migration.

ALTER TABLE "users" ADD COLUMN "birth_date" DATE;
ALTER TABLE "users" ADD COLUMN "adult_attested_at" TIMESTAMPTZ(6);
ALTER TABLE "users" ADD COLUMN "adult_attestation_version" VARCHAR(60);

-- Declaração incompleta não pode existir: ou os três campos estão preenchidos,
-- ou os três estão nulos. Guardar data sem saber que texto a pessoa viu, ou
-- atestação sem data de nascimento, seria registro que não sustenta nada.
ALTER TABLE "users" ADD CONSTRAINT "users_adult_attestation_complete" CHECK (
  ("birth_date" IS NULL AND "adult_attested_at" IS NULL AND "adult_attestation_version" IS NULL)
  OR
  ("birth_date" IS NOT NULL AND "adult_attested_at" IS NOT NULL AND "adult_attestation_version" IS NOT NULL)
);
