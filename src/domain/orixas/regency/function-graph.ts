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
export const REGENCY_FUNCTION_GRAPH_VERSION = "regency-function-graph-0.4.0-research";

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

export const regencyFunctionGraphSchema = z
  .object({
    version: z.literal(REGENCY_FUNCTION_GRAPH_VERSION),
    status: z.literal("research"),
    assignments: z.array(assignmentSchema).min(1).max(2_000),
  })
  .strict()
  .superRefine(({ assignments }, context) => {
    const ids = new Set(assignments.map(({ id }) => id));
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
      };
    })
    .sort((left, right) => left.functionId.localeCompare(right.functionId));
}
