import { z } from "zod";

export const SYMBOLIC_RESONANCE_DISCLAIMER = "Metodo autoral AstroAxe; consulte a metodologia.";

export const FORBIDDEN_PUBLIC_CLAIMS = [
  "seu orixa e",
  "seu santo e",
  "voce e filho de",
  "voce e filha de",
  "cientificamente comprovado",
  "100% de certeza",
  "certeza absoluta",
  "confirma sua iniciacao",
  "determina seu odu",
  "determina seu vodum",
  "determina seu nkisi",
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
  .max(12_000)
  .refine((value) => !containsForbiddenPublicClaim(value), {
    message:
      "O texto atribui determinacao fora do resultado, alega certeza nao calibrada ou extrapola os alvos do metodo.",
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

export const regencyRoleSchema = z.enum(["front", "head", "back"]);

const unresolvedRegencySchema = z
  .object({
    reason: z.enum([
      "insufficient_score",
      "insufficient_evidence_breadth",
      "distinct_candidate_unavailable",
      "tradition_confirmation_required",
    ]),
    explanation: z.string().trim().min(1).max(300),
  })
  .strict();

export const regencyRankingSchema = z
  .object({
    orisaId: z.string().trim().min(1).max(120),
    displayName: z.string().trim().min(1).max(120),
    normalizedScore: z.number().min(0).max(1),
    rank: z.number().int().positive(),
    astrologicalIndicators: z.array(astrologicalIndicatorSchema).min(1).max(32),
    correspondenceClaimIds: z.array(z.string().trim().min(1).max(120)).min(1).max(64),
  })
  .strict();

const roleRankingSchema = z
  .array(regencyRankingSchema)
  .min(3)
  .max(24)
  .superRefine((rankings, context) => {
    const figures = new Set<string>();
    rankings.forEach((ranking, index) => {
      if (ranking.rank !== index + 1) {
        context.addIssue({
          code: "custom",
          path: [index, "rank"],
          message: "Os ranks devem ser continuos e acompanhar a ordenacao.",
        });
      }
      if (figures.has(ranking.orisaId)) {
        context.addIssue({
          code: "custom",
          path: [index, "orisaId"],
          message: "Cada Orixa deve aparecer uma unica vez por papel.",
        });
      }
      figures.add(ranking.orisaId);
    });
  });

export const orisaRegencyResponseSchema = z
  .object({
    kind: z.literal("orisa_regency"),
    disclaimer: z.literal(SYMBOLIC_RESONANCE_DISCLAIMER),
    triad: z
      .object({
        front: z.string().nullable(),
        head: z.string().nullable(),
        back: z.string().nullable(),
      })
      .strict(),
    unresolvedRoles: z
      .object({
        front: unresolvedRegencySchema.optional(),
        head: unresolvedRegencySchema.optional(),
        back: unresolvedRegencySchema.optional(),
      })
      .strict(),
    rankingsByRole: z
      .object({ front: roleRankingSchema, head: roleRankingSchema, back: roleRankingSchema })
      .strict(),
    methodVersion: z.string().trim().min(1).max(80),
    matrixVersion: z.string().trim().min(1).max(80),
    astrologyEngineVersion: z.string().trim().min(1).max(80),
    astrologyConfigVersion: z.string().trim().min(1).max(80),
    knowledgeVersion: z.string().trim().min(1).max(80),
    validation: z.discriminatedUnion("status", [
      z.object({ status: z.literal("unvalidated") }).strict(),
      z
        .object({
          status: z.literal("validated"),
          datasetVersion: z.string().trim().min(1).max(80),
          sampleSize: z.number().int().positive(),
          exactTriadAccuracy: z.number().min(0).max(1),
        })
        .strict(),
    ]),
    inputFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict()
  .superRefine((response, context) => {
    const selected = [response.triad.front, response.triad.head, response.triad.back].filter(
      (orisaId): orisaId is string => orisaId !== null,
    );
    if (new Set(selected).size !== selected.length) {
      context.addIssue({
        code: "custom",
        path: ["triad"],
        message: "Frente, cabeca e costas devem selecionar Orixas distintos.",
      });
    }
    for (const role of regencyRoleSchema.options) {
      const selectedRole = response.triad[role];
      const unresolved = response.unresolvedRoles[role];
      if (selectedRole === null && unresolved === undefined) {
        context.addIssue({
          code: "custom",
          path: ["unresolvedRoles", role],
          message: "Um papel não determinado precisa de motivo explícito.",
        });
      }
      if (selectedRole !== null && unresolved !== undefined) {
        context.addIssue({
          code: "custom",
          path: ["unresolvedRoles", role],
          message: "Um papel determinado não pode ser marcado como não resolvido.",
        });
      }
      if (
        selectedRole !== null &&
        !response.rankingsByRole[role].some(({ orisaId }) => orisaId === selectedRole)
      ) {
        context.addIssue({
          code: "custom",
          path: ["triad", role],
          message: "A regencia selecionada deve existir no ranking do papel.",
        });
      }
    }
  });

export type RegencyRole = z.infer<typeof regencyRoleSchema>;
export type RegencyRanking = z.infer<typeof regencyRankingSchema>;
export type OrisaRegencyResponse = z.infer<typeof orisaRegencyResponseSchema>;
