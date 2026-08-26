CREATE TABLE "regency_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "birth_profile_id" UUID NOT NULL,
    "method_version" VARCHAR(100) NOT NULL,
    "matrix_version" VARCHAR(100) NOT NULL,
    "config_version" VARCHAR(100) NOT NULL,
    "scorer_version" VARCHAR(100) NOT NULL,
    "questionnaire_version" VARCHAR(100) NOT NULL,
    "questionnaire_answers" JSONB NOT NULL,
    "predicted_triad" JSONB NOT NULL,
    "verdict" VARCHAR(30) NOT NULL,
    "knows_orisas" BOOLEAN NOT NULL,
    "corrected_triad" JSONB,
    "confirmation_basis" VARCHAR(40) NOT NULL,
    "comment" VARCHAR(1000),
    "consent_version" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "regency_feedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "regency_feedback_birth_profile_id_fkey" FOREIGN KEY ("birth_profile_id") REFERENCES "birth_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "regency_feedback_birth_profile_id_method_version_questionnaire_version_key"
ON "regency_feedback"("birth_profile_id", "method_version", "questionnaire_version");

CREATE INDEX "regency_feedback_method_version_verdict_idx"
ON "regency_feedback"("method_version", "verdict");
