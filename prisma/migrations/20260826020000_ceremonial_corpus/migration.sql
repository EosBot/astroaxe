-- Ceremonial laboratory: provenance-first corpus and private practice records.
-- Additive only. No existing table is altered or dropped.
--
-- Rollback (no data loss for pre-existing tables; drops only the new ceremonial ones):
--   DROP TABLE IF EXISTS "ceremonial_sessions", "ceremonial_plans", "ceremonial_reviews",
--     "ceremonial_timing_profiles", "ceremonial_cross_references",
--     "ceremonial_correspondences", "ceremonial_media", "ceremonial_entity_variants",
--     "ceremonial_entities", "ceremonial_locators", "ceremonial_artifacts",
--     "ceremonial_editions", "ceremonial_works", "ceremonial_workspace_memberships",
--     "ceremonial_source_systems" CASCADE;
-- Roll-forward: re-run this file. Take a verified backup before either direction, per
-- docs/backup-restore.md; never drop a volume to "fix" a migration.

CREATE TABLE "ceremonial_source_systems" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(200) NOT NULL,
    "tradition" VARCHAR(120) NOT NULL,
    "summary" VARCHAR(2000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ceremonial_source_systems_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ceremonial_source_systems_slug_shape_check"
      CHECK ("slug" ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$')
);
CREATE UNIQUE INDEX "ceremonial_source_systems_slug_key" ON "ceremonial_source_systems"("slug");

-- Workspaces are product navigation only. An entity never references a workspace; it is
-- reachable from one solely through these explicit membership rows, so grouping two
-- Angelical systems under ANGELICAL can never merge their identities.
CREATE TABLE "ceremonial_workspace_memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_kind" VARCHAR(40) NOT NULL,
    "source_system_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ceremonial_workspace_memberships_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ceremonial_workspace_memberships_kind_check"
      CHECK ("workspace_kind" IN ('ANGELICAL', 'ARS_GOETIA', 'ARS_THEURGIA_GOETIA', 'OLYMPIC', 'PLANETARY_INTELLIGENCE')),
    CONSTRAINT "ceremonial_workspace_memberships_source_system_id_fkey"
      FOREIGN KEY ("source_system_id") REFERENCES "ceremonial_source_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ceremonial_workspace_memberships_kind_system_key"
  ON "ceremonial_workspace_memberships"("workspace_kind", "source_system_id");
CREATE INDEX "ceremonial_workspace_memberships_kind_idx"
  ON "ceremonial_workspace_memberships"("workspace_kind");

CREATE TABLE "ceremonial_works" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_system_id" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "author_label" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ceremonial_works_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ceremonial_works_source_system_id_fkey"
      FOREIGN KEY ("source_system_id") REFERENCES "ceremonial_source_systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ceremonial_works_system_title_key" ON "ceremonial_works"("source_system_id", "title");

CREATE TABLE "ceremonial_editions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "work_id" UUID NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "language" VARCHAR(35) NOT NULL,
    "published_at" INTEGER,
    "rights" VARCHAR(30) NOT NULL DEFAULT 'UNKNOWN',
    "access" VARCHAR(20) NOT NULL DEFAULT 'LOCAL_ONLY',
    "sensitivity" VARCHAR(30) NOT NULL DEFAULT 'CULTURALLY_SENSITIVE',
    "rights_note" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ceremonial_editions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ceremonial_editions_rights_check"
      CHECK ("rights" IN ('PUBLIC_DOMAIN', 'LICENSED', 'PERMISSION_GRANTED', 'RESTRICTED', 'UNKNOWN')),
    CONSTRAINT "ceremonial_editions_access_check"
      CHECK ("access" IN ('PUBLIC', 'LOCAL_ONLY')),
    CONSTRAINT "ceremonial_editions_sensitivity_check"
      CHECK ("sensitivity" IN ('GENERAL', 'CULTURALLY_SENSITIVE', 'RESTRICTED_KNOWLEDGE')),
    -- Fail closed: unknown or restricted rights can never be marked publicly deliverable.
    CONSTRAINT "ceremonial_editions_public_requires_rights_check"
      CHECK ("access" = 'LOCAL_ONLY' OR "rights" IN ('PUBLIC_DOMAIN', 'LICENSED', 'PERMISSION_GRANTED')),
    CONSTRAINT "ceremonial_editions_work_id_fkey"
      FOREIGN KEY ("work_id") REFERENCES "ceremonial_works"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ceremonial_editions_work_label_language_key"
  ON "ceremonial_editions"("work_id", "label", "language");
CREATE INDEX "ceremonial_editions_access_rights_idx" ON "ceremonial_editions"("access", "rights");

CREATE TABLE "ceremonial_artifacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "edition_id" UUID NOT NULL,
    "relative_path" VARCHAR(1024) NOT NULL,
    "content_hash" CHAR(64) NOT NULL,
    "byte_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(160) NOT NULL,
    "extraction_state" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "extraction_reason" VARCHAR(300),
    "page_count" INTEGER,
    "rights" VARCHAR(30) NOT NULL DEFAULT 'UNKNOWN',
    "access" VARCHAR(20) NOT NULL DEFAULT 'LOCAL_ONLY',
    "sensitivity" VARCHAR(30) NOT NULL DEFAULT 'CULTURALLY_SENSITIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "ceremonial_artifacts_pkey" PRIMARY KEY ("id"),
    -- Only a normalized relative path is stored: absolute host locations never persist.
    CONSTRAINT "ceremonial_artifacts_relative_path_check"
      CHECK ("relative_path" !~ '^/' AND "relative_path" !~ '(^|/)\.\.(/|$)' AND char_length(btrim("relative_path")) > 0),
    CONSTRAINT "ceremonial_artifacts_content_hash_check" CHECK ("content_hash" ~ '^[0-9a-f]{64}$'),
    CONSTRAINT "ceremonial_artifacts_byte_size_check" CHECK ("byte_size" >= 0),
    CONSTRAINT "ceremonial_artifacts_page_count_check" CHECK ("page_count" IS NULL OR "page_count" >= 0),
    CONSTRAINT "ceremonial_artifacts_extraction_state_check"
      CHECK ("extraction_state" IN ('PENDING', 'EXTRACTED', 'QUARANTINED', 'UNSUPPORTED')),
    -- No silent omission: anything not extracted must say why.
    CONSTRAINT "ceremonial_artifacts_extraction_reason_check"
      CHECK ("extraction_state" IN ('PENDING', 'EXTRACTED') OR "extraction_reason" IS NOT NULL),
    CONSTRAINT "ceremonial_artifacts_rights_check"
      CHECK ("rights" IN ('PUBLIC_DOMAIN', 'LICENSED', 'PERMISSION_GRANTED', 'RESTRICTED', 'UNKNOWN')),
    CONSTRAINT "ceremonial_artifacts_access_check" CHECK ("access" IN ('PUBLIC', 'LOCAL_ONLY')),
    CONSTRAINT "ceremonial_artifacts_sensitivity_check"
      CHECK ("sensitivity" IN ('GENERAL', 'CULTURALLY_SENSITIVE', 'RESTRICTED_KNOWLEDGE')),
    CONSTRAINT "ceremonial_artifacts_public_requires_rights_check"
      CHECK ("access" = 'LOCAL_ONLY' OR "rights" IN ('PUBLIC_DOMAIN', 'LICENSED', 'PERMISSION_GRANTED')),
    CONSTRAINT "ceremonial_artifacts_edition_id_fkey"
      FOREIGN KEY ("edition_id") REFERENCES "ceremonial_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- One content hash is one artifact: renamed duplicates share a single identity.
CREATE UNIQUE INDEX "ceremonial_artifacts_content_hash_key" ON "ceremonial_artifacts"("content_hash");
CREATE UNIQUE INDEX "ceremonial_artifacts_edition_path_key"
  ON "ceremonial_artifacts"("edition_id", "relative_path");
CREATE INDEX "ceremonial_artifacts_extraction_state_idx" ON "ceremonial_artifacts"("extraction_state");

CREATE TABLE "ceremonial_locators" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "edition_id" UUID NOT NULL,
    "artifact_id" UUID,
    "kind" VARCHAR(30) NOT NULL,
    "reference" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ceremonial_locators_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ceremonial_locators_kind_check"
      CHECK ("kind" IN ('PAGE', 'FOLIO', 'SECTION', 'CHAPTER', 'APHORISM', 'PLATE', 'ENTRY')),
    CONSTRAINT "ceremonial_locators_reference_check" CHECK (char_length(btrim("reference")) > 0),
    CONSTRAINT "ceremonial_locators_edition_id_fkey"
      FOREIGN KEY ("edition_id") REFERENCES "ceremonial_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ceremonial_locators_artifact_id_fkey"
      FOREIGN KEY ("artifact_id") REFERENCES "ceremonial_artifacts"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ceremonial_locators_edition_kind_reference_key"
  ON "ceremonial_locators"("edition_id", "kind", "reference");

CREATE TABLE "ceremonial_entities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_system_id" UUID NOT NULL,
    "entity_kind" VARCHAR(40) NOT NULL,
    "canonical_name" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ceremonial_entities_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ceremonial_entities_kind_check"
      CHECK ("entity_kind" IN ('ANGEL', 'DEMON', 'AERIAL_SPIRIT', 'OLYMPIC_SPIRIT', 'PLANETARY_INTELLIGENCE', 'PLANETARY_SPIRIT')),
    CONSTRAINT "ceremonial_entities_source_system_id_fkey"
      FOREIGN KEY ("source_system_id") REFERENCES "ceremonial_source_systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- Identity is (source system, name). The same name in two systems stays two entities.
CREATE UNIQUE INDEX "ceremonial_entities_system_name_key"
  ON "ceremonial_entities"("source_system_id", "canonical_name");
CREATE INDEX "ceremonial_entities_kind_idx" ON "ceremonial_entities"("entity_kind");

CREATE TABLE "ceremonial_entity_variants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_id" UUID NOT NULL,
    "edition_id" UUID NOT NULL,
    "locator_id" UUID NOT NULL,
    "variant_name" VARCHAR(200),
    "rank" VARCHAR(120),
    "office" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ceremonial_entity_variants_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ceremonial_entity_variants_entity_id_fkey"
      FOREIGN KEY ("entity_id") REFERENCES "ceremonial_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ceremonial_entity_variants_edition_id_fkey"
      FOREIGN KEY ("edition_id") REFERENCES "ceremonial_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ceremonial_entity_variants_locator_id_fkey"
      FOREIGN KEY ("locator_id") REFERENCES "ceremonial_locators"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ceremonial_entity_variants_entity_edition_key"
  ON "ceremonial_entity_variants"("entity_id", "edition_id");

CREATE TABLE "ceremonial_media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "artifact_id" UUID NOT NULL,
    "entity_id" UUID,
    "locator_id" UUID,
    "kind" VARCHAR(30) NOT NULL,
    "rights" VARCHAR(30) NOT NULL DEFAULT 'UNKNOWN',
    "access" VARCHAR(20) NOT NULL DEFAULT 'LOCAL_ONLY',
    "sensitivity" VARCHAR(30) NOT NULL DEFAULT 'CULTURALLY_SENSITIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ceremonial_media_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ceremonial_media_kind_check"
      CHECK ("kind" IN ('SEAL', 'SIGIL', 'TABLE', 'PLATE', 'DIAGRAM')),
    CONSTRAINT "ceremonial_media_rights_check"
      CHECK ("rights" IN ('PUBLIC_DOMAIN', 'LICENSED', 'PERMISSION_GRANTED', 'RESTRICTED', 'UNKNOWN')),
    CONSTRAINT "ceremonial_media_access_check" CHECK ("access" IN ('PUBLIC', 'LOCAL_ONLY')),
    CONSTRAINT "ceremonial_media_sensitivity_check"
      CHECK ("sensitivity" IN ('GENERAL', 'CULTURALLY_SENSITIVE', 'RESTRICTED_KNOWLEDGE')),
    CONSTRAINT "ceremonial_media_public_requires_rights_check"
      CHECK ("access" = 'LOCAL_ONLY' OR "rights" IN ('PUBLIC_DOMAIN', 'LICENSED', 'PERMISSION_GRANTED')),
    CONSTRAINT "ceremonial_media_artifact_id_fkey"
      FOREIGN KEY ("artifact_id") REFERENCES "ceremonial_artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ceremonial_media_entity_id_fkey"
      FOREIGN KEY ("entity_id") REFERENCES "ceremonial_entities"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ceremonial_media_locator_id_fkey"
      FOREIGN KEY ("locator_id") REFERENCES "ceremonial_locators"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ceremonial_media_access_rights_idx" ON "ceremonial_media"("access", "rights");

CREATE TABLE "ceremonial_correspondences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_id" UUID NOT NULL,
    "edition_id" UUID NOT NULL,
    "locator_id" UUID NOT NULL,
    "relation_type" VARCHAR(40) NOT NULL,
    "target_key" VARCHAR(120) NOT NULL,
    "note" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ceremonial_correspondences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ceremonial_correspondences_relation_type_check"
      CHECK ("relation_type" IN ('PLANET', 'ZODIAC', 'ELEMENT', 'METAL', 'COLOR', 'DIRECTION', 'HOUR', 'DAY', 'INCENSE')),
    CONSTRAINT "ceremonial_correspondences_target_key_check" CHECK (char_length(btrim("target_key")) > 0),
    CONSTRAINT "ceremonial_correspondences_entity_id_fkey"
      FOREIGN KEY ("entity_id") REFERENCES "ceremonial_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ceremonial_correspondences_edition_id_fkey"
      FOREIGN KEY ("edition_id") REFERENCES "ceremonial_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    -- RESTRICT: a locator can never be removed while a claim still cites it.
    CONSTRAINT "ceremonial_correspondences_locator_id_fkey"
      FOREIGN KEY ("locator_id") REFERENCES "ceremonial_locators"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ceremonial_correspondences_entity_edition_relation_target_key"
  ON "ceremonial_correspondences"("entity_id", "edition_id", "relation_type", "target_key");
CREATE INDEX "ceremonial_correspondences_relation_target_idx"
  ON "ceremonial_correspondences"("relation_type", "target_key");

CREATE TABLE "ceremonial_cross_references" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "from_entity_id" UUID NOT NULL,
    "to_entity_id" UUID NOT NULL,
    "locator_id" UUID NOT NULL,
    "relation_type" VARCHAR(40) NOT NULL,
    "note" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ceremonial_cross_references_pkey" PRIMARY KEY ("id"),
    -- Deliberately no IDENTICAL_TO / SAME_AS: cross-system identity is not expressible.
    CONSTRAINT "ceremonial_cross_references_relation_type_check"
      CHECK ("relation_type" IN ('SHARES_PLANET', 'NAME_SIMILARITY', 'CITED_BY', 'DERIVED_FROM', 'CONTRASTED_WITH')),
    CONSTRAINT "ceremonial_cross_references_not_self_check" CHECK ("from_entity_id" <> "to_entity_id"),
    CONSTRAINT "ceremonial_cross_references_from_entity_id_fkey"
      FOREIGN KEY ("from_entity_id") REFERENCES "ceremonial_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ceremonial_cross_references_to_entity_id_fkey"
      FOREIGN KEY ("to_entity_id") REFERENCES "ceremonial_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ceremonial_cross_references_locator_id_fkey"
      FOREIGN KEY ("locator_id") REFERENCES "ceremonial_locators"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ceremonial_cross_references_from_to_relation_key"
  ON "ceremonial_cross_references"("from_entity_id", "to_entity_id", "relation_type");

CREATE TABLE "ceremonial_timing_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_system_id" UUID NOT NULL,
    "edition_id" UUID NOT NULL,
    "locator_id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "display_name" VARCHAR(200) NOT NULL,
    "version" VARCHAR(60) NOT NULL,
    "rules" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ceremonial_timing_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ceremonial_timing_profiles_rules_object_check" CHECK (jsonb_typeof("rules") = 'object'),
    CONSTRAINT "ceremonial_timing_profiles_source_system_id_fkey"
      FOREIGN KEY ("source_system_id") REFERENCES "ceremonial_source_systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ceremonial_timing_profiles_edition_id_fkey"
      FOREIGN KEY ("edition_id") REFERENCES "ceremonial_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ceremonial_timing_profiles_locator_id_fkey"
      FOREIGN KEY ("locator_id") REFERENCES "ceremonial_locators"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ceremonial_timing_profiles_slug_version_key"
  ON "ceremonial_timing_profiles"("slug", "version");

CREATE TABLE "ceremonial_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subject_type" VARCHAR(30) NOT NULL,
    "subject_id" UUID NOT NULL,
    "review_kind" VARCHAR(20) NOT NULL,
    "decision" VARCHAR(30) NOT NULL,
    "facet_scope" JSONB NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "evidence_locator_id" UUID,
    "decided_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    CONSTRAINT "ceremonial_reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ceremonial_reviews_subject_type_check"
      CHECK ("subject_type" IN ('EDITION', 'ARTIFACT', 'MEDIA', 'ENTITY', 'CORRESPONDENCE', 'TIMING_PROFILE')),
    -- Rights review and editorial review are separate rows; neither implies the other.
    CONSTRAINT "ceremonial_reviews_kind_check" CHECK ("review_kind" IN ('RIGHTS', 'EDITORIAL')),
    CONSTRAINT "ceremonial_reviews_decision_check"
      CHECK ("decision" IN ('APPROVED', 'CHANGES_REQUESTED', 'REVOKED')),
    CONSTRAINT "ceremonial_reviews_facet_scope_array_check" CHECK (jsonb_typeof("facet_scope") = 'array'),
    -- An approval must state what it covers; a blank scope approves nothing.
    CONSTRAINT "ceremonial_reviews_approved_scope_check"
      CHECK ("decision" <> 'APPROVED' OR jsonb_array_length("facet_scope") > 0),
    CONSTRAINT "ceremonial_reviews_expiry_order_check"
      CHECK ("expires_at" IS NULL OR "expires_at" > "decided_at"),
    CONSTRAINT "ceremonial_reviews_reviewer_id_fkey"
      FOREIGN KEY ("reviewer_id") REFERENCES "cultural_contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ceremonial_reviews_evidence_locator_id_fkey"
      FOREIGN KEY ("evidence_locator_id") REFERENCES "ceremonial_locators"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ceremonial_reviews_subject_kind_idx"
  ON "ceremonial_reviews"("subject_type", "subject_id", "review_kind");

-- Private practice records. Every column below stores an AES-256-GCM envelope
-- {schemaVersion,keyVersion,iv,tag,ciphertext}; plaintext never reaches these tables.
CREATE TABLE "ceremonial_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "birth_profile_id" UUID,
    "title_envelope" JSONB NOT NULL,
    "intention_envelope" JSONB NOT NULL,
    "selection_envelope" JSONB,
    "schedule_envelope" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "ceremonial_plans_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ceremonial_plans_title_envelope_check" CHECK (jsonb_typeof("title_envelope") = 'object'),
    CONSTRAINT "ceremonial_plans_intention_envelope_check" CHECK (jsonb_typeof("intention_envelope") = 'object'),
    CONSTRAINT "ceremonial_plans_selection_envelope_check"
      CHECK ("selection_envelope" IS NULL OR jsonb_typeof("selection_envelope") = 'object'),
    CONSTRAINT "ceremonial_plans_schedule_envelope_check"
      CHECK ("schedule_envelope" IS NULL OR jsonb_typeof("schedule_envelope") = 'object'),
    -- Plans belong to the account, so account deletion removes them.
    CONSTRAINT "ceremonial_plans_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    -- The birth profile is an optional timing link: deleting a map must not delete a plan.
    CONSTRAINT "ceremonial_plans_birth_profile_id_fkey"
      FOREIGN KEY ("birth_profile_id") REFERENCES "birth_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ceremonial_plans_user_created_idx" ON "ceremonial_plans"("user_id", "created_at");

CREATE TABLE "ceremonial_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" UUID NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "notes_envelope" JSONB,
    "observation_envelope" JSONB,
    "outcome_envelope" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "ceremonial_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ceremonial_sessions_notes_envelope_check"
      CHECK ("notes_envelope" IS NULL OR jsonb_typeof("notes_envelope") = 'object'),
    CONSTRAINT "ceremonial_sessions_observation_envelope_check"
      CHECK ("observation_envelope" IS NULL OR jsonb_typeof("observation_envelope") = 'object'),
    CONSTRAINT "ceremonial_sessions_outcome_envelope_check"
      CHECK ("outcome_envelope" IS NULL OR jsonb_typeof("outcome_envelope") = 'object'),
    CONSTRAINT "ceremonial_sessions_plan_id_fkey"
      FOREIGN KEY ("plan_id") REFERENCES "ceremonial_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ceremonial_sessions_plan_occurred_idx" ON "ceremonial_sessions"("plan_id", "occurred_at");
