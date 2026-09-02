import { releaseApprovalSchema, type ReleaseApproval } from "./release-approval";

/**
 * Aprovações declaradas pelo responsável do produto.
 *
 * Só entra aqui aprovação que **de fato aconteceu**, com o escopo que ela de fato
 * teve. Papel, e nunca nome: o projeto não inventa nomes, cargos religiosos nem
 * credenciais individuais, e um registro de aprovação não é o lugar para começar.
 *
 * As três aprovações que a task 39 ainda exige — retenção de backup, tombstones de
 * exclusão e verificação de idade adulta — **não estão aqui, de propósito**. Os
 * controles que elas cobririam não existem no código, e aprovar controle
 * inexistente é aprovação vazia. A prontidão de release fica bloqueada por elas, e
 * é assim que deve ficar.
 */
export const declaredReleaseApprovals: readonly ReleaseApproval[] = [
  {
    id: "approval:sensitive-data-governance-2026-09-01",
    type: "sensitive_data_governance",
    scope:
      "Guardar planos e sessões cerimoniais do próprio usuário — título, intenção, entidades escolhidas, horário planejado, notas, observações e desfechos — cifrados com AES-256-GCM e amarrados por AAD a usuário, registro e campo. Cobre o tratamento; não cobre retenção de backup, tombstones de exclusão nem verificação de idade.",
    reviewerRole: "product_owner",
    declaredOn: "2026-09-01",
    expiresOn: null,
    revokedOn: null,
    legalBasis: null,
    caveat: null,
  },
  {
    id: "approval:legal-basis-2026-09-01",
    type: "legal_basis",
    scope:
      "Base legal declarada para os registros de prática cerimonial: consentimento colhido no cadastro da conta.",
    reviewerRole: "product_owner",
    declaredOn: "2026-09-01",
    expiresOn: null,
    revokedOn: null,
    legalBasis: "signup_consent",
    caveat:
      "Ressalva registrada no momento da decisão: a LGPD trata convicção religiosa como dado pessoal sensível (art. 11), e para essa categoria o consentimento em regra precisa ser específico e destacado, não o aceite geral do cadastro. O responsável foi informado disso e optou pelo consentimento de cadastro. Revisar esta base é emitir uma aprovação nova deste mesmo tipo, e não editar esta.",
  },
].map((approval) => releaseApprovalSchema.parse(approval));
