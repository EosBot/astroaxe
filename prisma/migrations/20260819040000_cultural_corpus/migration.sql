CREATE TABLE "cultural_contributors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "display_name" VARCHAR(120) NOT NULL,
    "public_bio" VARCHAR(1000),
    "attribution_line" VARCHAR(300) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cultural_contributors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cultural_sources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_key" VARCHAR(120) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "url" VARCHAR(2000) NOT NULL,
    "evidence_kind" VARCHAR(40) NOT NULL,
    "license_note" VARCHAR(500) NOT NULL,
    "accessed_at" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cultural_sources_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cultural_sources_source_key_key" UNIQUE ("source_key"),
    CONSTRAINT "cultural_sources_evidence_kind_check" CHECK ("evidence_kind" IN ('community-primary', 'institutional-inventory', 'ethnography', 'scholarly-analysis', 'product-editorial'))
);

CREATE TABLE "cultural_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(120) NOT NULL,
    "display_name" VARCHAR(120) NOT NULL,
    "category" VARCHAR(40) NOT NULL,
    "tradition_id" VARCHAR(120) NOT NULL,
    "summary" VARCHAR(2000) NOT NULL,
    "editorial_body" TEXT NOT NULL,
    "version" VARCHAR(80) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    "author_id" UUID NOT NULL,
    "reviewer_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "cultural_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cultural_entries_slug_version_key" UNIQUE ("slug", "version"),
    CONSTRAINT "cultural_entries_category_check" CHECK ("category" IN ('orisa', 'vodun', 'nkisi', 'odu', 'ori_concept', 'guide_entity', 'ancestor')),
    CONSTRAINT "cultural_entries_status_check" CHECK ("status" IN ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'WITHDRAWN')),
    CONSTRAINT "cultural_entries_publication_check" CHECK (
      "status" <> 'PUBLISHED' OR (
        "reviewer_id" IS NOT NULL AND
        "reviewed_at" IS NOT NULL AND
        "published_at" IS NOT NULL AND
        "reviewer_id" <> "author_id"
      )
    )
);

CREATE TABLE "cultural_claims" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entry_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "claim_key" VARCHAR(120) NOT NULL,
    "predicate" VARCHAR(120) NOT NULL,
    "object_summary" VARCHAR(500) NOT NULL,
    "source_locator" VARCHAR(120),
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cultural_claims_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cultural_claims_entry_id_claim_key_key" UNIQUE ("entry_id", "claim_key"),
    CONSTRAINT "cultural_claims_status_check" CHECK ("status" IN ('ACTIVE', 'CONTESTED', 'DEPRECATED', 'WITHDRAWN'))
);

CREATE TABLE "cultural_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entry_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "decision" VARCHAR(30) NOT NULL,
    "note" VARCHAR(2000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cultural_reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cultural_reviews_decision_check" CHECK ("decision" IN ('APPROVED', 'CHANGES_REQUESTED', 'WITHDRAWN'))
);

CREATE INDEX "cultural_entries_slug_status_published_at_idx" ON "cultural_entries"("slug", "status", "published_at");
CREATE INDEX "cultural_claims_source_id_idx" ON "cultural_claims"("source_id");
CREATE INDEX "cultural_reviews_entry_id_created_at_idx" ON "cultural_reviews"("entry_id", "created_at");

ALTER TABLE "cultural_entries" ADD CONSTRAINT "cultural_entries_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "cultural_contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cultural_entries" ADD CONSTRAINT "cultural_entries_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "cultural_contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cultural_claims" ADD CONSTRAINT "cultural_claims_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "cultural_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cultural_claims" ADD CONSTRAINT "cultural_claims_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "cultural_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cultural_reviews" ADD CONSTRAINT "cultural_reviews_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "cultural_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cultural_reviews" ADD CONSTRAINT "cultural_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "cultural_contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
