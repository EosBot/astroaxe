import { describe, expect, it } from "vitest";

import {
  regencyQuestionnaire,
  REGENCY_QUESTIONNAIRE_VERSION,
} from "@/domain/orixas/regency/questionnaire";
import { regencyFeedbackInputSchema } from "./regency-feedback";

describe("regency feedback contract", () => {
  it("requires explicit consent", () => {
    expect(
      regencyFeedbackInputSchema.safeParse({ ...validFeedback(), consent: false }).success,
    ).toBe(false);
  });

  it("requires a corrected triad when the person says they know it", () => {
    expect(
      regencyFeedbackInputSchema.safeParse({ ...validFeedback(), knowsOrisas: true }).success,
    ).toBe(false);
  });

  it("accepts a versioned correction with unknown roles left open", () => {
    expect(
      regencyFeedbackInputSchema.safeParse({
        ...validFeedback(),
        knowsOrisas: true,
        correctedTriad: { front: "orisa:oya", head: null, back: null },
      }).success,
    ).toBe(true);
  });

  it("rejects a correction with every role left null", () => {
    expect(
      regencyFeedbackInputSchema.safeParse({
        ...validFeedback(),
        knowsOrisas: true,
        correctedTriad: { front: null, head: null, back: null },
      }).success,
    ).toBe(false);
  });

  it("forbids a correction when the person does not know their Orixás", () => {
    expect(
      regencyFeedbackInputSchema.safeParse({
        ...validFeedback(),
        knowsOrisas: false,
        correctedTriad: { front: "orisa:oya", head: null, back: null },
      }).success,
    ).toBe(false);
  });
});

function validFeedback() {
  return {
    methodVersion: "AstroAxe Regências 3.0 — pesquisa aplicada",
    questionnaire: {
      version: REGENCY_QUESTIONNAIRE_VERSION,
      answers: regencyQuestionnaire.map(({ id: questionId }) => ({ questionId, value: "3" })),
    },
    verdict: "close",
    knowsOrisas: false,
    confirmationBasis: "personal_recognition",
    consent: true,
    consentVersion: "regency-feedback-consent-1.0",
  };
}
