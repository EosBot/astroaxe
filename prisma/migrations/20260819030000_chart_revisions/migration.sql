ALTER TABLE "natal_charts"
ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "natal_chart_revisions" (
    "id" UUID NOT NULL,
    "natal_chart_id" UUID NOT NULL,
    "input_fingerprint" CHAR(64) NOT NULL,
    "engine_version" VARCHAR(50) NOT NULL,
    "config_version" VARCHAR(50) NOT NULL,
    "calculation_mode" VARCHAR(20) NOT NULL,
    "result" JSONB NOT NULL,
    "reason" VARCHAR(50) NOT NULL,
    "superseded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "natal_chart_revisions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "natal_chart_revisions_mode_check" CHECK ("calculation_mode" IN ('timed', 'untimed')),
    CONSTRAINT "natal_chart_revisions_reason_check" CHECK ("reason" IN ('PROFILE_RECALCULATION'))
);

CREATE INDEX "natal_chart_revisions_natal_chart_id_superseded_at_idx"
ON "natal_chart_revisions"("natal_chart_id", "superseded_at");

ALTER TABLE "natal_chart_revisions"
ADD CONSTRAINT "natal_chart_revisions_natal_chart_id_fkey"
FOREIGN KEY ("natal_chart_id") REFERENCES "natal_charts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
