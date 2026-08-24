import type { PrismaClient } from "@/generated/prisma/client";
import { describe, expect, it, vi } from "vitest";

import { selectPublishedTransitInterpretations } from "./interpretations";

describe("transit interpretation selection", () => {
  it("selects only reviewed published text matching the calculated aspect", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      title: "Título",
      opening: "Abertura",
      deepening: "Aprofundamento",
      technicalWhy: "Evidência técnica",
      reflectionPrompt: "Pergunta?",
      practice: "Prática",
      version: "v1",
      generationMethod: "AI_ASSISTED",
      publishedAt: new Date(),
      author: { displayName: "Autoria", attributionLine: "Texto" },
      reviewer: { displayName: "Revisão", attributionLine: "Revisão editorial" },
    });
    const result = await selectPublishedTransitInterpretations(
      { transitInterpretationTemplate: { findFirst } } as unknown as PrismaClient,
      snapshot(),
      "pt-BR",
      new Date("2026-08-19T12:00:00Z"),
    );
    expect(result[0]?.content.title).toBe("Título");
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PUBLISHED", aspectType: "square" }),
      }),
    );
  });

  it("uses the versioned built-in editorial matrix when no published override exists", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    await expect(
      selectPublishedTransitInterpretations(
        { transitInterpretationTemplate: { findFirst } } as unknown as PrismaClient,
        snapshot(),
        "pt-BR",
        new Date(),
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        content: expect.objectContaining({ version: "built-in-transits-2.0.0" }),
      }),
    ]);
  });
});

function snapshot() {
  return {
    kind: "transit_snapshot" as const,
    instant: "2026-08-19T12:00:00Z",
    engineVersion: "engine",
    configVersion: "config",
    natalInputFingerprint: "a".repeat(64),
    snapshotFingerprint: "b".repeat(64),
    windows: [],
    aspects: [
      {
        transitingBody: "saturn",
        natalBody: "sun",
        type: "square" as const,
        exactAngle: 90,
        orb: 1,
        applying: true,
        relativeIntensity: 0.8,
      },
    ],
  };
}
