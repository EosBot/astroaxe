import { z } from "zod";

export const REGENCY_EVIDENCE_GRAPH_VERSION = "regency-evidence-graph-0.1.0-research";

const edgeSchema = z
  .object({
    id: z.string().regex(/^edge:[a-z0-9-:]+$/),
    subjectId: z.string().regex(/^orisa:[a-z0-9-]+$/),
    predicate: z.enum(["planetary_correspondence", "numerological_mapping"]),
    objectId: z.string().regex(/^(planet|number):[a-z0-9-]+$/),
    sourceArtifactId: z.string().regex(/^artifact:[a-z0-9-:]+$/),
    workId: z.string().regex(/^work:[a-z0-9-:]+$/),
    sourceFamilyId: z.string().regex(/^family:[a-z0-9-:]+$/),
    claimSchoolId: z.string().regex(/^school:[a-z0-9-:]+$/),
    locator: z.string().trim().min(1).max(240),
    extractionMethod: z.enum(["manual_review", "table_review", "web_extraction"]),
    extractionConfidence: z.number().min(0).max(1),
    reviewStatus: z.enum(["candidate", "verified"]),
    facetId: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    conflictsWith: z.array(z.string().regex(/^edge:[a-z0-9-:]+$/)).max(12),
  })
  .strict();

export const regencyEvidenceGraphSchema = z
  .object({
    version: z.literal(REGENCY_EVIDENCE_GRAPH_VERSION),
    status: z.literal("research"),
    edges: z.array(edgeSchema).min(1).max(2_000),
  })
  .strict()
  .superRefine(({ edges }, context) => {
    const ids = new Set(edges.map(({ id }) => id));
    edges.forEach((edge, index) => {
      if (edge.conflictsWith.some((id) => !ids.has(id)))
        context.addIssue({
          code: "custom",
          path: ["edges", index, "conflictsWith"],
          message: "Conflito referencia aresta inexistente.",
        });
    });
  });

export type RegencyEvidenceGraph = z.infer<typeof regencyEvidenceGraphSchema>;

export function summarizeEvidenceGraph(rawGraph: unknown) {
  const graph = regencyEvidenceGraphSchema.parse(rawGraph);
  const relations = new Map<
    string,
    { edgeCount: number; families: Set<string>; schools: Set<string>; conflicts: Set<string> }
  >();
  for (const edge of graph.edges) {
    const key = `${edge.subjectId}|${edge.predicate}|${edge.objectId}`;
    const relation = relations.get(key) ?? {
      edgeCount: 0,
      families: new Set<string>(),
      schools: new Set<string>(),
      conflicts: new Set<string>(),
    };
    relation.edgeCount += 1;
    relation.families.add(edge.sourceFamilyId);
    relation.schools.add(edge.claimSchoolId);
    edge.conflictsWith.forEach((id) => relation.conflicts.add(id));
    relations.set(key, relation);
  }
  return [...relations.entries()]
    .map(([relationId, value]) => ({
      relationId,
      edgeCount: value.edgeCount,
      independentFamilyCount: value.families.size,
      schoolCount: value.schools.size,
      conflictCount: value.conflicts.size,
    }))
    .sort((left, right) => left.relationId.localeCompare(right.relationId));
}
