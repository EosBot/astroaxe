import { z } from "zod";

import { structuralFunctionIds, findStructuralFunction } from "./structural-functions";

/**
 * Camadas 1 e 3 de `docs/BLUEPRINT.md` §5.0.1.
 *
 * A camada 1 é cada atribuição isolada: uma tradição afirma que determinada
 * entidade ocupa determinada função, e a afirmação carrega escola, obra e
 * locator. A camada 3 agrupa por função e pesa a convergência.
 *
 * O peso vem de **famílias de fonte independentes**, nunca da contagem de
 * atribuições. Três escolas independentes atribuindo a mesma função à mesma
 * posição é evidência forte; a mesma obra em três edições é uma afirmação só.
 * Achatar isso destruiria exatamente o sinal que o método usa.
 */
export const REGENCY_FUNCTION_GRAPH_VERSION = "regency-function-graph-0.5.0-research";

const assignmentSchema = z
  .object({
    id: z.string().regex(/^assignment:[a-z0-9-:]+$/),
    functionId: z.string().regex(/^function:[a-z0-9-]+$/),
    entityId: z.string().regex(/^entity:[a-z0-9-]+:[a-z0-9-]+$/),
    /**
     * Categoria da entidade, pelo vocabulário de `docs/METHOD.md`.
     *
     * É o que impede a condensação de virar fusão de panteões: um Orixá e uma
     * entidade-guia de Quimbanda podem ocupar posição análoga sem que um vire o
     * outro, e o leitor precisa enxergar que são categorias distintas.
     */
    entityCategory: z.enum(["orisa", "guide_entity", "angel", "olympic_spirit"]),
    traditionId: z.string().regex(/^tradition:[a-z0-9-]+$/),
    workId: z.string().regex(/^work:[a-z0-9-:]+$/),
    sourceFamilyId: z.string().regex(/^family:[a-z0-9-:]+$/),
    claimSchoolId: z.string().regex(/^school:[a-z0-9-:]+$/),
    locator: z.string().trim().min(1).max(240),
    extractionMethod: z.enum(["manual_review", "table_review", "corpus_retrieval"]),
    extractionConfidence: z.number().min(0).max(1),
    reviewStatus: z.enum(["candidate", "verified"]),
    conflictsWith: z.array(z.string().regex(/^assignment:[a-z0-9-:]+$/)).max(12),
  })
  .strict();

/**
 * Por que duas fontes discordam.
 *
 * `conflictsWith` diz *que* duas atribuições colidem; ele nunca soube dizer
 * *como*, e sem isso o produto trata igual o que não é igual. Grafia variante de
 * um mesmo nome não é discordância. Esquemas que atribuem o mesmo nome a postos
 * diferentes discordam de forma estruturada, e a função pode continuar estável
 * por baixo. Fonte que se contradiz é erro provável, e chamar erro de tradição
 * seria emprestar autoridade a um engano.
 *
 * O schema recusa conflito sem explicação. Registrar a colisão e não dizer sua
 * natureza foi como se chegou a tratar as três coisas como uma só.
 */
export const divergenceKindSchema = z.enum([
  /** Mesma potência, grafias diferentes. Não é divergência; é ortografia. */
  "name_variant",
  /** As escolas concordam sobre a função e discordam de qual nome ocupa o posto. */
  "rank_scheme",
  /** Dois esquemas históricos concorrentes, cada um internamente coerente. */
  "competing_scheme",
  /** A própria fonte se contradiz. Erro provável, registrado como tal. */
  "internal_inconsistency",
]);

export type DivergenceKind = z.infer<typeof divergenceKindSchema>;

export const divergenceSchema = z
  .object({
    id: z.string().regex(/^divergence:[a-z0-9-]+$/),
    functionId: z.string().regex(/^function:[a-z0-9-]+$/),
    between: z
      .array(z.string().regex(/^assignment:[a-z0-9-:]+$/))
      .min(2)
      .max(6),
    kind: divergenceKindSchema,
    /** O que se apurou, em prosa curta. Sem isso o registro não ensina nada. */
    explanation: z.string().trim().min(1).max(1_200),
    /**
     * Se a função permanece a mesma apesar da discordância.
     *
     * É a pergunta que decide se a condensação sobrevive à divergência: quando a
     * disputa é só de nome, o método continua de pé; quando é de função, não.
     */
    functionRemainsStable: z.boolean(),
    locators: z.array(z.string().trim().min(1).max(240)).min(1).max(8),
  })
  .strict();

export type FunctionDivergence = z.infer<typeof divergenceSchema>;

export const regencyFunctionGraphSchema = z
  .object({
    version: z.literal(REGENCY_FUNCTION_GRAPH_VERSION),
    status: z.literal("research"),
    assignments: z.array(assignmentSchema).min(1).max(2_000),
    divergences: z.array(divergenceSchema).max(200).default([]),
  })
  .strict()
  .superRefine(({ assignments, divergences }, context) => {
    const ids = new Set(assignments.map(({ id }) => id));
    const explicados = new Set(
      (divergences ?? []).flatMap((divergence) =>
        divergence.between.flatMap((left) =>
          divergence.between.filter((right) => right !== left).map((right) => pairKey(left, right)),
        ),
      ),
    );
    (divergences ?? []).forEach((divergence, index) => {
      const desconhecida = divergence.between.filter((id) => !ids.has(id));
      if (desconhecida.length > 0)
        context.addIssue({
          code: "custom",
          path: ["divergences", index, "between"],
          message: "Divergência referencia atribuição inexistente.",
        });
    });
    assignments.forEach((assignment, index) => {
      if (!structuralFunctionIds.has(assignment.functionId))
        context.addIssue({
          code: "custom",
          path: ["assignments", index, "functionId"],
          message: "Função estrutural fora do vocabulário.",
        });
      if (assignment.conflictsWith.some((id) => !ids.has(id)))
        context.addIssue({
          code: "custom",
          path: ["assignments", index, "conflictsWith"],
          message: "Conflito referencia atribuição inexistente.",
        });
      if (assignment.conflictsWith.includes(assignment.id))
        context.addIssue({
          code: "custom",
          path: ["assignments", index, "conflictsWith"],
          message: "Uma atribuição não conflita consigo mesma.",
        });
      // Conflito sem divergência registrada é colisão muda: diz que duas fontes
      // batem de frente e não diz se é grafia, esquema ou erro da fonte.
      const semExplicacao = assignment.conflictsWith.filter(
        (other) => !explicados.has(pairKey(assignment.id, other)),
      );
      if (semExplicacao.length > 0)
        context.addIssue({
          code: "custom",
          path: ["assignments", index, "conflictsWith"],
          message: "Conflito declarado sem divergência que o explique.",
        });
    });
  });

export type RegencyFunctionGraph = z.infer<typeof regencyFunctionGraphSchema>;
export type FunctionAssignment = z.infer<typeof assignmentSchema>;

/**
 * Quanta sustentação independente a função reúne.
 *
 * Rótulo qualitativo, não coeficiente: o produto não publica percentuais que
 * possam ser lidos como certeza, e não existe amostra que calibre um número
 * aqui. O que se pode afirmar honestamente é quantas linhagens distintas
 * chegaram à mesma posição.
 */
export type ConvergenceStrength = "single_school" | "corroborated" | "convergent";

export interface AnalogousPositionGroup {
  functionId: string;
  question: string;
  /**
   * O que a condensação afirma é posição análoga — "ocupa a mesma função
   * estrutural" —, nunca identidade entre entidades. A distinção não custa nada
   * e é o que separa síntese comparativa de sincretismo ingênuo.
   */
  relation: "analogous_position";
  assignmentCount: number;
  independentFamilyCount: number;
  schoolCount: number;
  strength: ConvergenceStrength;
  traditionIds: string[];
  members: {
    entityId: string;
    entityCategory: FunctionAssignment["entityCategory"];
    traditionId: string;
    schoolIds: string[];
    familyIds: string[];
  }[];
  /** Categorias distintas reunidas na função — nunca fundidas numa só. */
  entityCategories: FunctionAssignment["entityCategory"][];
  conflicts: { left: string; right: string }[];
  /**
   * As divergências desta função, com a natureza de cada uma.
   *
   * `functionRemainsStable` é o campo que o produto precisa ler: quando a
   * disputa é de nome e a função se mantém, a condensação continua válida e a
   * discordância vira nota; quando a função é que está em disputa, não vira.
   */
  divergences: FunctionDivergence[];
}

function pairKey(left: string, right: string): string {
  return [left, right].sort().join("|");
}

function strengthOf(independentFamilyCount: number): ConvergenceStrength {
  if (independentFamilyCount >= 3) return "convergent";
  if (independentFamilyCount === 2) return "corroborated";
  return "single_school";
}

export function condenseStructuralFunctions(rawGraph: unknown): AnalogousPositionGroup[] {
  const graph = regencyFunctionGraphSchema.parse(rawGraph);

  const byFunction = new Map<string, FunctionAssignment[]>();
  for (const assignment of graph.assignments) {
    const bucket = byFunction.get(assignment.functionId) ?? [];
    bucket.push(assignment);
    byFunction.set(assignment.functionId, bucket);
  }

  return [...byFunction.entries()]
    .map(([functionId, assignments]) => {
      const families = new Set(assignments.map(({ sourceFamilyId }) => sourceFamilyId));
      const schools = new Set(assignments.map(({ claimSchoolId }) => claimSchoolId));

      const byEntity = new Map<string, FunctionAssignment[]>();
      for (const assignment of assignments) {
        const bucket = byEntity.get(assignment.entityId) ?? [];
        bucket.push(assignment);
        byEntity.set(assignment.entityId, bucket);
      }

      // Divergência é registrada como conflito, nunca resolvida por média: uma
      // média apagaria a discordância em vez de a expor para reestudo.
      const seen = new Set<string>();
      const conflicts: { left: string; right: string }[] = [];
      for (const assignment of assignments) {
        for (const other of assignment.conflictsWith) {
          const pair = [assignment.id, other].sort();
          const key = pair.join("|");
          if (seen.has(key)) continue;
          seen.add(key);
          conflicts.push({ left: pair[0]!, right: pair[1]! });
        }
      }

      return {
        functionId,
        question: findStructuralFunction(functionId)?.question ?? "",
        relation: "analogous_position" as const,
        assignmentCount: assignments.length,
        independentFamilyCount: families.size,
        schoolCount: schools.size,
        strength: strengthOf(families.size),
        traditionIds: [...new Set(assignments.map(({ traditionId }) => traditionId))].sort(),
        entityCategories: [
          ...new Set(assignments.map(({ entityCategory }) => entityCategory)),
        ].sort(),
        members: [...byEntity.entries()]
          .map(([entityId, entityAssignments]) => ({
            entityId,
            entityCategory: entityAssignments[0]!.entityCategory,
            traditionId: entityAssignments[0]!.traditionId,
            schoolIds: [...new Set(entityAssignments.map((a) => a.claimSchoolId))].sort(),
            familyIds: [...new Set(entityAssignments.map((a) => a.sourceFamilyId))].sort(),
          }))
          .sort((left, right) => left.entityId.localeCompare(right.entityId)),
        conflicts: conflicts.sort((left, right) => left.left.localeCompare(right.left)),
        divergences: (graph.divergences ?? [])
          .filter((divergence) => divergence.functionId === functionId)
          .sort((left, right) => left.id.localeCompare(right.id)),
      };
    })
    .sort((left, right) => left.functionId.localeCompare(right.functionId));
}
