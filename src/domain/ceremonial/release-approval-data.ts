import { releaseApprovalSchema, type ReleaseApproval } from "./release-approval";

/**
 * Aprovações declaradas pelo responsável do produto.
 *
 * Só entra aqui aprovação que **de fato aconteceu**, com o escopo que ela de fato
 * teve. Papel, e nunca nome: o projeto não inventa nomes, cargos religiosos nem
 * credenciais individuais, e um registro de aprovação não é o lugar para começar.
 *
 * As duas aprovações que a task 39 ainda exige — retenção de backup e tombstones
 * de exclusão — **não estão aqui, de propósito**. Os controles que elas cobririam
 * não existem no código, e aprovar controle inexistente é aprovação vazia. A
 * prontidão de release fica bloqueada por elas, e é assim que deve ficar.
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
  {
    id: "approval:adult-access-2026-09-02",
    type: "adult_access",
    scope:
      "Restringir o planejador cerimonial a maiores de 18 anos por declaração do titular da conta, com data de nascimento declarada, data da declaração e versão do texto exibido. Cobre a atestação registrada; não cobre verificação de identidade nem de idade.",
    reviewerRole: "product_owner",
    declaredOn: "2026-09-02",
    expiresOn: null,
    revokedOn: null,
    legalBasis: null,
    caveat:
      "Ressalva registrada no momento da decisão: isto é atestação, não verificação. Não existe caminho gratuito para verificar idade — documento, estimativa facial e gov.br por convênio custam por consulta —, e o responsável optou pela declaração registrada em vez de nenhum controle. O que ela faz é criar registro e deslocar responsabilidade; o que ela não faz é provar. Adotar verificação real é emitir uma aprovação nova deste mesmo tipo.",
  },
].map((approval) => releaseApprovalSchema.parse(approval));
