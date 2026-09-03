import { z } from "zod";

export const CEREMONIAL_GUIDANCE_POLICY_VERSION = "ceremonial-guidance-policy-0.3.0-religious";

/**
 * Finalidades que o produto atende.
 *
 * A versão anterior aceitava quatro: estudo, reflexão, memória e rotina pessoal.
 * Isso tratava quem usa como acadêmico visitando uma religião, e não como quem a
 * pratica. Oferenda, proteção, saúde, prosperidade, justiça e ancestralidade são
 * as razões pelas quais alguém procura um terreiro há séculos; deixá-las de fora
 * não era cuidado, era desconforto do produto com o próprio assunto.
 *
 * `sacrifice` saiu da lista de recusas e entrou aqui. A oferenda animal é prática
 * de culto afro-brasileiro, e o STF a reconheceu como exercício legítimo de
 * liberdade religiosa no RE 494601, em 2019. Classificá-la como dano colocava o
 * produto contra a religião que ele diz servir.
 */
const safeGoalCategorySchema = z.enum([
  "study",
  "reflection",
  "remembrance",
  "personal_routine",
  "devotion",
  "offering",
  "sacrifice",
  "protection",
  "cleansing",
  "health",
  "prosperity",
  "love",
  "justice",
  "ancestors",
  "initiation",
  "divination",
]);

/**
 * O que continua recusado, e por quê.
 *
 * Sobraram três, e nenhuma é sobre gosto ou moral: coagir quem não consentiu,
 * causar dano físico a alguém, e crise de autolesão. As duas primeiras protegem
 * terceiros, que não escolheram estar ali; a terceira existe porque a resposta
 * certa naquele momento não é um registro num aplicativo.
 *
 * Promessa médica e financeira deixaram de ser recusa. Pedir saúde ou fartura é
 * uma das coisas mais antigas que existem numa religião — o produto é que não
 * promete resultado, e isso ele já declara nos limites.
 */
const refusedGoalCategorySchema = z.enum(["coercion", "violence", "self_harm"]);

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
    category: z.enum(["consent_required", "coercive_control", "physical_harm", "self_harm_crisis"]),
    helpCategory: z.enum(["consent_boundary", "emergency_support", "crisis_support"]),
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
 * O produto não julga a finalidade religiosa de ninguém. O que ele se recusa a
 * instrumentalizar é dano a terceiro — coagir quem não consentiu, ferir alguém —
 * e crise de autolesão. Fora esses três, a prática é de quem pratica.
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
