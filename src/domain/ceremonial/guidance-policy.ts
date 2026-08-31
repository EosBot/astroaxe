import { z } from "zod";

export const CEREMONIAL_GUIDANCE_POLICY_VERSION = "ceremonial-guidance-policy-0.1.0";

const safeGoalCategorySchema = z.enum(["study", "reflection", "remembrance", "personal_routine"]);

const refusedGoalCategorySchema = z.enum([
  "coercion",
  "violence",
  "self_harm",
  "sacrifice",
  "illegal_activity",
  "medical_promise",
  "financial_promise",
]);

export const guidanceGoalCategorySchema = z.union([
  safeGoalCategorySchema,
  refusedGoalCategorySchema,
]);

export const guidancePolicyInputSchema = z
  .object({
    operation: z.enum(["create", "update", "export"]),
    goalCategory: guidanceGoalCategorySchema,
    target: z.enum(["none", "self", "consenting_adult", "non_consenting_person"]),
  })
  .strict();

export type GuidancePolicyInput = z.infer<typeof guidancePolicyInputSchema>;

const checklistItemSchema = z
  .object({
    id: z.string().regex(/^step:[a-z0-9-]+$/),
    kind: z.enum(["preparation", "reflection", "documentation", "closing"]),
    label: z.string().trim().min(1).max(160),
  })
  .strict();

export const allowedGuidanceSchema = z
  .object({
    kind: z.literal("allowed_guidance"),
    policyVersion: z.literal(CEREMONIAL_GUIDANCE_POLICY_VERSION),
    goalCategory: safeGoalCategorySchema,
    limitations: z.array(z.string().trim().min(1).max(200)).min(1).max(6),
    checklist: z.array(checklistItemSchema).min(1).max(8),
  })
  .strict();

export const refusedGuidanceSchema = z
  .object({
    kind: z.literal("refused_guidance"),
    policyVersion: z.literal(CEREMONIAL_GUIDANCE_POLICY_VERSION),
    category: z.enum([
      "consent_required",
      "coercive_control",
      "physical_harm",
      "self_harm_crisis",
      "sacrifice_or_injury",
      "illegal_action",
      "medical_claim",
      "financial_claim",
    ]),
    helpCategory: z.enum([
      "consent_boundary",
      "emergency_support",
      "crisis_support",
      "non_harmful_alternative",
      "legal_alternative",
      "qualified_healthcare",
      "qualified_financial_guidance",
    ]),
    publicMessage: z.string().trim().min(1).max(240),
  })
  .strict();

export const guidancePolicyDecisionSchema = z.discriminatedUnion("kind", [
  allowedGuidanceSchema,
  refusedGuidanceSchema,
]);

export type GuidancePolicyDecision = z.infer<typeof guidancePolicyDecisionSchema>;

/**
 * Decide sobre orientação acionável usando apenas categorias estruturadas.
 *
 * Texto livre não entra na decisão nem é repetido na recusa. A boundary que
 * recebe uma intenção precisa classificá-la antes de chamar esta função; uma
 * categoria ausente ou inválida é recusada pelo schema, em vez de cair num
 * caminho permissivo. A mesma função serve a criação, atualização e exportação.
 */
export function evaluateGuidancePolicy(input: unknown): GuidancePolicyDecision {
  const parsed = guidancePolicyInputSchema.parse(input);

  if (parsed.target === "non_consenting_person")
    return refusal(
      "consent_required",
      "consent_boundary",
      "Não oferecemos orientação dirigida a uma pessoa que não consentiu.",
    );

  const refused = refusedGoalCategorySchema.safeParse(parsed.goalCategory);
  if (refused.success) return refusalForGoal(refused.data);
  const safeGoal = safeGoalCategorySchema.parse(parsed.goalCategory);

  return allowedGuidanceSchema.parse({
    kind: "allowed_guidance",
    policyVersion: CEREMONIAL_GUIDANCE_POLICY_VERSION,
    goalCategory: safeGoal,
    limitations: [
      "Prática simbólica e opcional; não promete resultado material, médico ou financeiro.",
      "Interrompa se houver desconforto e preserve consentimento, segurança e legalidade.",
    ],
    checklist: checklistFor(safeGoal),
  });
}

export const archivalSourceViewSchema = z
  .object({
    kind: z.literal("archival_source"),
    sourceSystemId: z.string().regex(/^source-system:[a-z0-9-]+$/),
    editionId: z.string().regex(/^edition:[a-z0-9-]+$/),
    locator: z.string().trim().min(1).max(240),
    warning: z.literal(
      "Registro histórico com proveniência; descrição da fonte não é orientação do AstroAxe.",
    ),
  })
  .strict();

export function describeArchivalSource(input: {
  sourceSystemId: string;
  editionId: string;
  locator: string;
}) {
  return archivalSourceViewSchema.parse({
    kind: "archival_source",
    ...input,
    warning:
      "Registro histórico com proveniência; descrição da fonte não é orientação do AstroAxe.",
  });
}

function refusalForGoal(goal: z.infer<typeof refusedGoalCategorySchema>) {
  const decisions = {
    coercion: [
      "coercive_control",
      "consent_boundary",
      "Não ajudamos a controlar ou coagir outra pessoa.",
    ],
    violence: [
      "physical_harm",
      "emergency_support",
      "Não fornecemos orientação que facilite violência ou dano físico.",
    ],
    self_harm: [
      "self_harm_crisis",
      "crisis_support",
      "Não podemos ajudar com autolesão. Procure apoio humano imediato e serviços de emergência locais.",
    ],
    sacrifice: [
      "sacrifice_or_injury",
      "non_harmful_alternative",
      "Não fornecemos orientação que envolva ferir ou sacrificar seres vivos.",
    ],
    illegal_activity: [
      "illegal_action",
      "legal_alternative",
      "Não ajudamos a planejar ou executar atividade ilegal.",
    ],
    medical_promise: [
      "medical_claim",
      "qualified_healthcare",
      "Práticas simbólicas não substituem diagnóstico ou tratamento de profissionais de saúde.",
    ],
    financial_promise: [
      "financial_claim",
      "qualified_financial_guidance",
      "Práticas simbólicas não garantem ganho financeiro nem substituem orientação qualificada.",
    ],
  } as const;
  const [category, helpCategory, publicMessage] = decisions[goal];
  return refusal(category, helpCategory, publicMessage);
}

function refusal(
  category: z.infer<typeof refusedGuidanceSchema>["category"],
  helpCategory: z.infer<typeof refusedGuidanceSchema>["helpCategory"],
  publicMessage: string,
) {
  return refusedGuidanceSchema.parse({
    kind: "refused_guidance",
    policyVersion: CEREMONIAL_GUIDANCE_POLICY_VERSION,
    category,
    helpCategory,
    publicMessage,
  });
}

function checklistFor(goal: z.infer<typeof safeGoalCategorySchema>) {
  const focus = {
    study: "Definir a pergunta e registrar as fontes consultadas",
    reflection: "Nomear a questão sem tratá-la como previsão ou sentença",
    remembrance: "Escolher uma lembrança que possa ser acolhida com segurança",
    personal_routine: "Escolher uma prática pessoal pequena e reversível",
  }[goal];
  return [
    { id: "step:prepare", kind: "preparation", label: focus },
    {
      id: "step:record",
      kind: "documentation",
      label: "Registrar observações sem alegar causalidade",
    },
    {
      id: "step:close",
      kind: "closing",
      label: "Encerrar e revisar limites, consentimento e bem-estar",
    },
  ];
}
