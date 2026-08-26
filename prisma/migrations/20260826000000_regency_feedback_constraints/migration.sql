ALTER TABLE "regency_feedback"
  ADD CONSTRAINT "regency_feedback_verdict_check"
  CHECK ("verdict" IN ('matched', 'close', 'polarity_inverted', 'not_aligned', 'unsure'));

ALTER TABLE "regency_feedback"
  ADD CONSTRAINT "regency_feedback_confirmation_basis_check"
  CHECK ("confirmation_basis" IN ('personal_recognition', 'practitioner_consultation', 'buzios_or_oracle', 'other'));

ALTER TABLE "regency_feedback"
  ADD CONSTRAINT "regency_feedback_questionnaire_answers_json_check"
  CHECK (jsonb_typeof("questionnaire_answers") = 'array');

ALTER TABLE "regency_feedback"
  ADD CONSTRAINT "regency_feedback_predicted_triad_json_check"
  CHECK (jsonb_typeof("predicted_triad") = 'object');

ALTER TABLE "regency_feedback"
  ADD CONSTRAINT "regency_feedback_corrected_triad_json_check"
  CHECK ("corrected_triad" IS NULL OR jsonb_typeof("corrected_triad") = 'object');

-- knowsOrisas=false forbids a correction; knowsOrisas=true requires at least one non-null role.
ALTER TABLE "regency_feedback"
  ADD CONSTRAINT "regency_feedback_knows_orisas_consistency_check"
  CHECK (
    ("knows_orisas" = FALSE AND "corrected_triad" IS NULL)
    OR (
      "knows_orisas" = TRUE
      AND "corrected_triad" IS NOT NULL
      AND (
        "corrected_triad"->>'front' IS NOT NULL
        OR "corrected_triad"->>'head' IS NOT NULL
        OR "corrected_triad"->>'back' IS NOT NULL
      )
    )
  );
