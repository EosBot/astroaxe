import { z } from "zod";

import { PUBLIC_REGENCY_FACTOR_LIMIT } from "@/domain/orixas/regency/public-factors";
import { PUBLIC_REGENCY_METHOD_VERSION } from "@/domain/orixas/regency/public-method";
import { AUTHORIAL_REGENCY_DISCLAIMER } from "./contracts";

const publicRoleSchema = z.enum(["front", "head", "back"]);
const publicCandidateSchema = z
  .object({
    orisaId: z.string().regex(/^orisa:[a-z0-9-]+$/),
    displayName: z.string().trim().min(1).max(120),
    affinity: z.enum(["predominant", "strong", "present", "subtle"]),
  })
  .strict();

const publicRoleResultSchema = z
  .object({
    selectedId: z
      .string()
      .regex(/^orisa:[a-z0-9-]+$/)
      .nullable(),
    candidates: z.array(publicCandidateSchema).length(3),
    /**
     * Os fatos astrológicos que mais sustentaram o papel, do maior para o menor
     * peso. Nunca identificador de regra, coeficiente ou fonte estrutural: a
     * ordem é pública, o valor não. Vazio quando o papel fica em aberto.
     */
    determiningFactors: z.array(z.string().trim().min(1).max(120)).max(PUBLIC_REGENCY_FACTOR_LIMIT),
    stability: z.enum(["unavailable", "low", "medium", "high"]),
    unresolvedReason: z
      .enum([
        "insufficient_score",
        "insufficient_evidence_breadth",
        "distinct_candidate_unavailable",
        "tradition_confirmation_required",
      ])
      .optional(),
  })
  .strict();

export const publicRegencyResponseSchema = z
  .object({
    methodVersion: z.literal(PUBLIC_REGENCY_METHOD_VERSION),
    disclaimer: z.literal(AUTHORIAL_REGENCY_DISCLAIMER),
    roles: z.record(publicRoleSchema, publicRoleResultSchema),
  })
  .strict();

export type PublicRegencyResponse = z.infer<typeof publicRegencyResponseSchema>;
