import { regencyEvidenceGraphSchema, type RegencyEvidenceGraph } from "./evidence-graph";

export const regencyEvidenceGraph: RegencyEvidenceGraph = regencyEvidenceGraphSchema.parse({
  version: "regency-evidence-graph-0.1.0-research",
  status: "research",
  edges: [
    edge("ogum-mars-pena", "ogum", "mars", "templo-pena", "templo-pena-apostila", "table_review", {
      confidence: 0.9,
    }),
    edge("ogum-mars-ramatis", "ogum", "mars", "ramatis", "ramatis-umbanda", "manual_review", {
      confidence: 0.9,
    }),
    edge("oxala-sun-pena", "oxala", "sun", "templo-pena", "templo-pena-apostila", "table_review", {
      confidence: 0.9,
    }),
    edge("oxala-sun-ramatis", "oxala", "sun", "ramatis", "ramatis-umbanda", "manual_review", {
      confidence: 0.9,
    }),
    edge(
      "xango-jupiter-pena",
      "xango",
      "jupiter",
      "templo-pena",
      "templo-pena-apostila",
      "table_review",
      { confidence: 0.9 },
    ),
    edge(
      "xango-jupiter-ramatis",
      "xango",
      "jupiter",
      "ramatis",
      "ramatis-umbanda",
      "manual_review",
      { confidence: 0.9 },
    ),
    edge(
      "oxossi-venus-pena",
      "oxossi",
      "venus",
      "templo-pena",
      "templo-pena-apostila",
      "table_review",
      { confidence: 0.8, conflictsWith: ["edge:oxossi-mercury-pena"] },
    ),
    edge(
      "oxossi-mercury-pena",
      "oxossi",
      "mercury",
      "templo-pena",
      "templo-pena-apostila",
      "manual_review",
      { confidence: 0.8, conflictsWith: ["edge:oxossi-venus-pena"] },
    ),
  ],
});

function edge(
  id: string,
  subject: string,
  planet: string,
  family: string,
  work: string,
  extractionMethod: "manual_review" | "table_review",
  evidence: { confidence: number; conflictsWith?: string[] },
) {
  return {
    id: `edge:${id}`,
    subjectId: `orisa:${subject}`,
    predicate: "planetary_correspondence" as const,
    objectId: `planet:${planet}`,
    sourceArtifactId: `artifact:local:${work}`,
    workId: `work:${work}`,
    sourceFamilyId: `family:${family}`,
    claimSchoolId: `school:${family}`,
    locator: "Corpus local E:/Ocultismo; locator detalhado no relatório de pesquisa",
    extractionMethod,
    extractionConfidence: evidence.confidence,
    reviewStatus: "candidate" as const,
    conflictsWith: evidence.conflictsWith ?? [],
  };
}
