-- Task 14: review queue for corpus imports whose identity is not established.
--
-- A filename is a hint, never an identity. Every field the importer could only guess from
-- a path becomes one row here, and an artifact with any OPEN row is denied publication by
-- the access policy regardless of what rights it is later granted.
--
-- Keyed on the artifact's content hash rather than by foreign key on purpose: rows exist
-- for hashes that were deliberately NOT imported (no citable text, or a mapping pointing
-- at bytes the extraction never produced), and those must stay recorded rather than be
-- deleted for lacking a parent.
--
-- Roll-forward: re-run this additive migration after restoring a verified backup.
-- Rollback: dropping this table discards the record of what is still unidentified, which
-- would silently promote guessed metadata to established. Prefer roll-forward.

CREATE TABLE "ceremonial_import_reviews" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "content_hash" CHAR(64) NOT NULL,
  "reason" VARCHAR(40) NOT NULL,
  "proposed_value" VARCHAR(300),
  "detail" VARCHAR(600) NOT NULL,
  "state" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  "resolved_at" TIMESTAMPTZ(6),
  "resolution_note" VARCHAR(1000),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ceremonial_import_reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ceremonial_import_reviews_hash_check"
    CHECK ("content_hash" ~ '^[a-f0-9]{64}$'),
  CONSTRAINT "ceremonial_import_reviews_reason_check"
    CHECK ("reason" IN (
      'TITLE_FROM_FILENAME',
      'AUTHOR_UNKNOWN',
      'EDITION_UNESTABLISHED',
      'LANGUAGE_UNVERIFIED',
      'CONFLICTING_MAPPING',
      'MAPPING_WITHOUT_ARTIFACT',
      'NO_CITABLE_CONTENT',
      'NO_LOCATOR_SCHEME'
    )),
  CONSTRAINT "ceremonial_import_reviews_state_check"
    CHECK ("state" IN ('OPEN', 'RESOLVED')),
  -- Last defence, not the first: resolving is a decision someone made, so it must carry
  -- when it happened and what was decided. An OPEN row may carry neither.
  CONSTRAINT "ceremonial_import_reviews_resolution_check"
    CHECK (
      ("state" = 'OPEN' AND "resolved_at" IS NULL AND "resolution_note" IS NULL)
      OR ("state" = 'RESOLVED' AND "resolved_at" IS NOT NULL AND "resolution_note" IS NOT NULL)
    )
);

-- One row per artifact per missing field: re-running the importer must not accumulate
-- duplicate queue items for the same unanswered question.
CREATE UNIQUE INDEX "ceremonial_import_reviews_hash_reason_key"
  ON "ceremonial_import_reviews" ("content_hash", "reason");

-- The publication gate reads this: "does this artifact still have anything OPEN?"
CREATE INDEX "ceremonial_import_reviews_open_idx"
  ON "ceremonial_import_reviews" ("content_hash")
  WHERE "state" = 'OPEN';
