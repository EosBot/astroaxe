import { describe, expect, it } from "vitest";

import {
  extractRegencyQuestionnaireFeatures,
  regencyQuestionnaire,
  regencyQuestionnaireSubmissionSchema,
} from "./questionnaire";

describe("regency questionnaire", () => {
  it("requires one answer for every question", () => {
    expect(
      regencyQuestionnaireSubmissionSchema.safeParse({
        version: "regency-questionnaire-1.0.0",
        answers: [],
      }).success,
    ).toBe(false);
  });

  it("splits both poles and preserves the choice to abstain", () => {
    const features = extractRegencyQuestionnaireFeatures({
      version: "regency-questionnaire-1.0.0",
      answers: regencyQuestionnaire.map(({ id: questionId }, index) => ({
        questionId,
        value: index === 0 ? ("both" as const) : ("prefer_not_to_answer" as const),
      })),
    });
    expect(features).toEqual([
      expect.objectContaining({ lensId: "faith", value: "first_pole", strength: 0.5 }),
      expect.objectContaining({ lensId: "faith", value: "second_pole", strength: 0.5 }),
    ]);
  });
});
