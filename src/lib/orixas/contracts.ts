import { z } from "zod";

export const SYMBOLIC_RESONANCE_DISCLAIMER =
  "Esta leitura simbolica autoral do AstroAxe usa o mapa astrologico para explorar afinidades narrativas. Ela nao identifica Orixa de cabeca, Odu, Vodum, Nkisi, guia ou vinculo iniciatico. Esses vinculos pertencem aos processos proprios de cada tradicao e de suas comunidades e autoridades religiosas.";

export const FORBIDDEN_PUBLIC_CLAIMS = [
  "confirmacao religiosa",
  "determina seu orixa",
  "determina o seu orixa",
  "seu orixa e",
  "seu santo e",
  "orixa verdadeiro",
  "orixa de cabeca",
  "santo de cabeca",
  "filho de orixa",
  "filha de orixa",
  "voce e filho de",
  "voce e filha de",
  "revelado pelo mapa",
  "confirmado pelo mapa",
] as const;

const normalizedForbiddenClaims = FORBIDDEN_PUBLIC_CLAIMS.map(normalizeForPolicy);

function normalizeForPolicy(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

function containsForbiddenPublicClaim(value: string): boolean {
  const normalizedValue = normalizeForPolicy(value);
  return normalizedForbiddenClaims.some((term) => normalizedValue.includes(term));
}

export const safePublicCopySchema = z
  .string()
  .trim()
  .min(1)
  .max(2_000)
  .refine((value) => !containsForbiddenPublicClaim(value), {
    message: "O texto atribui determinacao ou filiacao religiosa ao resultado simbolico.",
  });

export const sacredCategorySchema = z.enum([
  "orisa",
  "vodun",
  "nkisi",
  "odu",
  "ori_concept",
  "guide_entity",
  "ancestor",
]);

export const evidenceKindSchema = z.enum([
  "community-primary",
  "institutional-inventory",
  "ethnography",
  "scholarly-analysis",
  "product-editorial",
]);

export const provenanceClaimSchema = z
  .object({
    claimId: z.string().trim().min(1).max(120),
    subjectId: z.string().trim().min(1).max(120),
    subjectCategory: sacredCategorySchema,
    predicate: z.string().trim().min(1).max(120),
    objectSummary: safePublicCopySchema.max(500),
    traditionId: z.string().trim().min(1).max(120),
    subtraditionId: z.string().trim().min(1).max(120).optional(),
    houseOrLineageId: z.string().trim().min(1).max(120).optional(),
    region: z.string().trim().min(1).max(160).optional(),
    period: z
      .object({
        start: z.number().int().min(1000).max(3000).optional(),
        end: z.number().int().min(1000).max(3000).optional(),
      })
      .strict()
      .refine(
        ({ start, end }) => start === undefined || end === undefined || start <= end,
        "O inicio do periodo deve ser anterior ou igual ao fim.",
      )
      .optional(),
    source: z
      .object({
        sourceId: z.string().trim().min(1).max(120),
        title: z.string().trim().min(1).max(300),
        url: z.url(),
        locator: z.string().trim().min(1).max(120).optional(),
        evidenceKind: evidenceKindSchema,
      })
      .strict(),
    accessLevel: z.literal("public"),
    status: z.enum(["active", "contested"]),
    knowledgeVersion: z.string().trim().min(1).max(80),
    reviewedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const astrologicalIndicatorSchema = z
  .object({
    feature: z.string().trim().min(1).max(120),
    contribution: z.number().min(-1).max(1),
    explanation: safePublicCopySchema.max(500),
  })
  .strict();

export const symbolicResonanceCandidateSchema = z
  .object({
    symbolicFigureId: z.string().trim().min(1).max(120),
    displayName: z.string().trim().min(1).max(120),
    category: sacredCategorySchema,
    traditionId: z.string().trim().min(1).max(120),
    normalizedScore: z.number().min(0).max(1),
    scoreMeaning: z.literal("relative_symbolic_affinity"),
    rank: z.number().int().positive(),
    summary: safePublicCopySchema.max(1_000),
    astrologicalIndicators: z.array(astrologicalIndicatorSchema).min(1).max(24),
    provenance: z.array(provenanceClaimSchema).min(1).max(50),
  })
  .strict()
  .superRefine((candidate, context) => {
    const claimIds = new Set<string>();

    candidate.provenance.forEach((claim, index) => {
      if (claimIds.has(claim.claimId)) {
        context.addIssue({
          code: "custom",
          path: ["provenance", index, "claimId"],
          message: "Cada claim de proveniencia deve aparecer uma unica vez por candidato.",
        });
      }
      claimIds.add(claim.claimId);

      if (claim.traditionId !== candidate.traditionId) {
        context.addIssue({
          code: "custom",
          path: ["provenance", index, "traditionId"],
          message: "A claim deve pertencer a mesma tradicao declarada pelo candidato.",
        });
      }
      if (claim.subjectId !== candidate.symbolicFigureId) {
        context.addIssue({
          code: "custom",
          path: ["provenance", index, "subjectId"],
          message: "A claim deve identificar a mesma figura simbolica do candidato.",
        });
      }
      if (claim.subjectCategory !== candidate.category) {
        context.addIssue({
          code: "custom",
          path: ["provenance", index, "subjectCategory"],
          message: "A categoria da claim deve coincidir com a categoria do candidato.",
        });
      }
    });
  });

export const symbolicResonanceResponseSchema = z
  .object({
    kind: z.literal("symbolic_resonance"),
    disclaimer: z.literal(SYMBOLIC_RESONANCE_DISCLAIMER),
    candidates: z.array(symbolicResonanceCandidateSchema).min(1).max(12),
    methodVersion: z.string().trim().min(1).max(80),
    astrologyEngineVersion: z.string().trim().min(1).max(80),
    astrologyConfigVersion: z.string().trim().min(1).max(80),
    knowledgeVersion: z.string().trim().min(1).max(80),
    limitationsVersion: z.string().trim().min(1).max(80),
    inputFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict()
  .superRefine((response, context) => {
    const ranks = new Set<number>();
    const figureKeys = new Set<string>();

    response.candidates.forEach((candidate, index) => {
      if (ranks.has(candidate.rank)) {
        context.addIssue({
          code: "custom",
          path: ["candidates", index, "rank"],
          message: "O rank deve ser unico na resposta.",
        });
      }
      ranks.add(candidate.rank);

      const figureKey = `${candidate.category}:${candidate.traditionId}:${candidate.symbolicFigureId}`;
      if (figureKeys.has(figureKey)) {
        context.addIssue({
          code: "custom",
          path: ["candidates", index, "symbolicFigureId"],
          message: "A mesma figura simbolica nao pode aparecer duas vezes no mesmo escopo.",
        });
      }
      figureKeys.add(figureKey);

      candidate.provenance.forEach((claim, claimIndex) => {
        if (claim.knowledgeVersion !== response.knowledgeVersion) {
          context.addIssue({
            code: "custom",
            path: ["candidates", index, "provenance", claimIndex, "knowledgeVersion"],
            message: "A claim deve usar a versao de conhecimento da resposta.",
          });
        }
      });
    });

    for (let expectedRank = 1; expectedRank <= response.candidates.length; expectedRank += 1) {
      if (!ranks.has(expectedRank)) {
        context.addIssue({
          code: "custom",
          path: ["candidates"],
          message: "Os ranks devem formar uma sequencia continua iniciada em 1.",
        });
        break;
      }
    }
  });

export type SacredCategory = z.infer<typeof sacredCategorySchema>;
export type ProvenanceClaim = z.infer<typeof provenanceClaimSchema>;
export type SymbolicResonanceCandidate = z.infer<typeof symbolicResonanceCandidateSchema>;
export type SymbolicResonanceResponse = z.infer<typeof symbolicResonanceResponseSchema>;
