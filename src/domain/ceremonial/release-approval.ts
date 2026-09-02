import { z } from "zod";

export const RELEASE_APPROVAL_CONTRACT_VERSION = "ceremonial-release-approval-1.0.0";

/**
 * Aprovações que a task 39 exige antes de ativar o que guarda dado sensível.
 *
 * Cada tipo cobre **um controle específico**, e não a boa vontade geral de quem
 * assina. É a separação que permite dizer "isto está aprovado e aquilo não" em
 * vez de tratar release como uma decisão única e indivisível.
 */
export const approvalTypeSchema = z.enum([
  /** Guardar registros de prática que podem revelar convicção religiosa. */
  "sensitive_data_governance",
  /** A base legal declarada para esse tratamento. */
  "legal_basis",
  /** Retenção das cópias de segurança. */
  "backup_retention",
  /** Registro de exclusão que sobrevive a uma restauração. */
  "deletion_tombstones",
  /** Verificação de que quem acessa o planejador é adulto. */
  "adult_access",
]);

export type ApprovalType = z.infer<typeof approvalTypeSchema>;

export const releaseApprovalSchema = z
  .object({
    id: z.string().regex(/^approval:[a-z0-9-]+$/),
    type: approvalTypeSchema,
    /** O que exatamente foi aprovado. Escopo vago não é aprovação. */
    scope: z.string().trim().min(1).max(600),
    /**
     * Papel de quem aprovou, nunca o nome.
     *
     * O projeto não inventa nomes, cargos religiosos nem credenciais individuais,
     * e um registro de aprovação não é o lugar para começar.
     */
    reviewerRole: z.enum(["product_owner", "legal_counsel", "cultural_council"]),
    declaredOn: z.iso.date(),
    /** Sem data de expiração a aprovação vale até ser revogada. */
    expiresOn: z.iso.date().nullable(),
    revokedOn: z.iso.date().nullable(),
    /** A base legal declarada, quando o tipo for `legal_basis`. */
    legalBasis: z.enum(["explicit_specific_consent", "signup_consent"]).nullable(),
    /**
     * Ressalva registrada junto com a aprovação.
     *
     * Existe para que um risco conhecido no momento da decisão fique no próprio
     * registro. Guardar a aprovação sem a ressalva faria a revisão futura começar
     * do zero.
     */
    caveat: z.string().trim().max(800).nullable(),
  })
  .strict();

export type ReleaseApproval = z.infer<typeof releaseApprovalSchema>;

/** O que o planejador cifrado exige para funcionar. */
export const PLANNER_REQUIRED_APPROVALS: readonly ApprovalType[] = [
  "sensitive_data_governance",
  "legal_basis",
];

/**
 * O que a task 39 exige para declarar prontidão de release.
 *
 * É superconjunto do planejador de propósito: o recurso pode operar sob aprovação
 * de tratamento enquanto a prontidão de release continua bloqueada pelos controles
 * que ainda não existem.
 */
export const RELEASE_REQUIRED_APPROVALS: readonly ApprovalType[] = [
  ...PLANNER_REQUIRED_APPROVALS,
  "backup_retention",
  "deletion_tombstones",
  "adult_access",
];

export interface ApprovalEvaluation {
  contractVersion: string;
  status: "cleared" | "blocked";
  /** Exigidas e nunca declaradas. */
  missing: ApprovalType[];
  /** Declaradas e revogadas depois. */
  revoked: ApprovalType[];
  /** Declaradas e vencidas. */
  expired: ApprovalType[];
}

/**
 * Confere as aprovações declaradas contra as exigidas.
 *
 * Valida **forma**: tipo, escopo, papel, data, expiração e revogação. Não valida —
 * e não finge validar — correção jurídica; isso é decisão de quem assina, e um
 * schema que dissesse o contrário daria falsa segurança.
 *
 * Ausência, revogação e vencimento bloqueiam igualmente. Tratar "venceu" como
 * menos grave que "nunca houve" transformaria prazo em sugestão.
 */
export function evaluateReleaseApprovals(input: {
  approvals: readonly unknown[];
  required: readonly ApprovalType[];
  on: string;
}): ApprovalEvaluation {
  const approvals = input.approvals.map((approval) => releaseApprovalSchema.parse(approval));
  const hoje = input.on;

  const missing: ApprovalType[] = [];
  const revoked: ApprovalType[] = [];
  const expired: ApprovalType[] = [];

  for (const type of input.required) {
    const declaradas = approvals.filter((approval) => approval.type === type);
    if (declaradas.length === 0) {
      missing.push(type);
      continue;
    }
    const validas = declaradas.filter(
      (approval) =>
        (approval.revokedOn === null || approval.revokedOn > hoje) &&
        (approval.expiresOn === null || approval.expiresOn >= hoje),
    );
    if (validas.length > 0) continue;
    if (declaradas.some((approval) => approval.revokedOn !== null && approval.revokedOn <= hoje))
      revoked.push(type);
    else expired.push(type);
  }

  return {
    contractVersion: RELEASE_APPROVAL_CONTRACT_VERSION,
    status:
      missing.length === 0 && revoked.length === 0 && expired.length === 0 ? "cleared" : "blocked",
    missing,
    revoked,
    expired,
  };
}
