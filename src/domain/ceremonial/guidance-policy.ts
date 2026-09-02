import { z } from "zod";

export const CEREMONIAL_GUIDANCE_POLICY_VERSION = "ceremonial-guidance-policy-0.2.0-tool-only";

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

/**
 * O produto aceita guardar o registro — e não diz o que fazer com ele.
 *
 * A versão anterior devolvia um roteiro de etapas ("preparar", "registrar",
 * "encerrar"). Virou decisão de produto não orientar prática: as ferramentas
 * calculam e catalogam, e o que se faz com isso é de quem opera. Sobra a
 * aceitação e os limites do que o produto afirma — que não são instrução, e sim
 * o contrário dela.
 */
export const acceptedRecordSchema = z
  .object({
    kind: z.literal("accepted_record"),
    policyVersion: z.literal(CEREMONIAL_GUIDANCE_POLICY_VERSION),
    goalCategory: safeGoalCategorySchema,
    limitations: z.array(z.string().trim().min(1).max(200)).min(1).max(6),
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
  acceptedRecordSchema,
  refusedGuidanceSchema,
]);

export type GuidancePolicyDecision = z.infer<typeof guidancePolicyDecisionSchema>;

/**
 * Decide se o produto aceita guardar um registro, usando só categorias.
 *
 * Recusar não é orientar: o produto não diz o que fazer, mas continua se
 * negando a servir de instrumento para coerção, violência, autolesão,
 * sacrifício, ilegalidade ou promessa médica e financeira. Declinar é a única
 * fala do produto sobre a prática de quem usa.
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

  return acceptedRecordSchema.parse({
    kind: "accepted_record",
    policyVersion: CEREMONIAL_GUIDANCE_POLICY_VERSION,
    goalCategory: safeGoal,
    limitations: [
      "O AstroAxe calcula e cataloga; o que fazer com isso é decisão de quem opera.",
      "Nada aqui promete resultado material, médico ou financeiro.",
    ],
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
