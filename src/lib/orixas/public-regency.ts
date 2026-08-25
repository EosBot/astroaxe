import { z } from "zod";

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
