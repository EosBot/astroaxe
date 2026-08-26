import { z } from "zod";

import { PUBLIC_REGENCY_METHOD_VERSION } from "@/domain/orixas/regency/public-method";
import { regencyQuestionnaireSubmissionSchema } from "@/domain/orixas/regency/questionnaire";

export const REGENCY_FEEDBACK_CONSENT_VERSION = "regency-feedback-consent-1.0";

const orisaIdSchema = z.string().regex(/^orisa:[a-z0-9-]+$/);
const correctedTriadSchema = z
  .object({
    front: orisaIdSchema.nullable(),
    head: orisaIdSchema.nullable(),
    back: orisaIdSchema.nullable(),
  })
  .strict();

export const regencyFeedbackInputSchema = z
  .object({
    methodVersion: z.literal(PUBLIC_REGENCY_METHOD_VERSION),
    questionnaire: regencyQuestionnaireSubmissionSchema,
    verdict: z.enum(["matched", "close", "polarity_inverted", "not_aligned", "unsure"]),
    knowsOrisas: z.boolean(),
    correctedTriad: correctedTriadSchema.optional(),
    confirmationBasis: z.enum([
      "personal_recognition",
      "practitioner_consultation",
      "buzios_or_oracle",
      "other",
    ]),
    comment: z.string().trim().max(1000).optional(),
    consent: z.literal(true),
    consentVersion: z.literal(REGENCY_FEEDBACK_CONSENT_VERSION),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.knowsOrisas) {
      if (input.correctedTriad === undefined) {
        context.addIssue({
          code: "custom",
          path: ["correctedTriad"],
          message: "Informe a correção da tríade.",
        });
      } else if (Object.values(input.correctedTriad).every((id) => id === null)) {
        context.addIssue({
          code: "custom",
          path: ["correctedTriad"],
          message: "Informe ao menos um papel corrigido.",
        });
      }
    } else if (input.correctedTriad !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["correctedTriad"],
        message: "Só é possível corrigir a tríade quando você conhece seus Orixás.",
      });
    }
  });

export type RegencyFeedbackInput = z.infer<typeof regencyFeedbackInputSchema>;
