import { describe, expect, it } from "vitest";

import { regencyEvidenceGraph } from "./evidence-graph-data";
import { regencyEvidenceGraphSchema, summarizeEvidenceGraph } from "./evidence-graph";

describe("regency evidence graph", () => {
  it("counts independent source families rather than artifacts", () => {
    const duplicate = {
      ...regencyEvidenceGraph.edges[0]!,
      id: "edge:ogum-mars-pena-copy",
      sourceArtifactId: "artifact:local:copy",
    };
    const summary = summarizeEvidenceGraph({
      ...regencyEvidenceGraph,
      edges: [...regencyEvidenceGraph.edges, duplicate],
    });
    expect(
      summary.find(
        ({ relationId }) => relationId === "orisa:ogum|planetary_correspondence|planet:mars",
      ),
    ).toMatchObject({ edgeCount: 3, independentFamilyCount: 2 });
  });

  it("preserves competing correspondences as explicit conflicts", () => {
    const summary = summarizeEvidenceGraph(regencyEvidenceGraph);
    expect(
      summary.find(({ relationId }) => relationId.endsWith("planet:venus"))?.conflictCount,
    ).toBe(1);
    expect(
      summary.find(({ relationId }) => relationId.endsWith("planet:mercury"))?.conflictCount,
    ).toBe(1);
  });

  it("rejects dangling conflict references", () => {
    expect(() =>
      regencyEvidenceGraphSchema.parse({
        ...regencyEvidenceGraph,
        edges: [{ ...regencyEvidenceGraph.edges[0], conflictsWith: ["edge:missing"] }],
      }),
    ).toThrow();
  });
});
