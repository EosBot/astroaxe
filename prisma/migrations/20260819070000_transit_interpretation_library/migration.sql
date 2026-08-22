CREATE TABLE "transit_interpretation_templates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "transiting_body" VARCHAR(30) NOT NULL,
  "natal_body" VARCHAR(30) NOT NULL,
  "aspect_type" VARCHAR(30) NOT NULL,
  "locale" VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
  "title" VARCHAR(180) NOT NULL,
  "opening" VARCHAR(1200) NOT NULL,
  "deepening" TEXT NOT NULL,
  "technical_why" VARCHAR(1500) NOT NULL,
  "reflection_prompt" VARCHAR(500) NOT NULL,
  "practice" VARCHAR(1000) NOT NULL,
  "version" VARCHAR(80) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  "generation_method" VARCHAR(30) NOT NULL DEFAULT 'HUMAN',
  "author_id" UUID NOT NULL,
  "reviewer_id" UUID,
  "reviewed_at" TIMESTAMPTZ(6),
  "published_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "transit_interpretation_templates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "transit_text_aspect_check" CHECK ("aspect_type" IN ('conjunction', 'sextile', 'square', 'trine', 'opposition')),
  CONSTRAINT "transit_text_status_check" CHECK ("status" IN ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'WITHDRAWN')),
  CONSTRAINT "transit_text_generation_check" CHECK ("generation_method" IN ('HUMAN', 'AI_ASSISTED')),
  CONSTRAINT "transit_text_publication_check" CHECK (
    "status" <> 'PUBLISHED' OR (
      "reviewer_id" IS NOT NULL AND "reviewed_at" IS NOT NULL AND "published_at" IS NOT NULL
      AND "reviewer_id" <> "author_id"
    )
  )
);

CREATE UNIQUE INDEX "transit_text_identity_version_key" ON "transit_interpretation_templates"
  ("transiting_body", "natal_body", "aspect_type", "locale", "version");
CREATE INDEX "transit_text_lookup_idx" ON "transit_interpretation_templates"
  ("transiting_body", "natal_body", "aspect_type", "locale", "status");

ALTER TABLE "transit_interpretation_templates" ADD CONSTRAINT "transit_text_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "cultural_contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transit_interpretation_templates" ADD CONSTRAINT "transit_text_reviewer_id_fkey"
  FOREIGN KEY ("reviewer_id") REFERENCES "cultural_contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
