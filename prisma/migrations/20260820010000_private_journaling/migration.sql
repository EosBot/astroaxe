CREATE TABLE "journal_entries" (
    "id" UUID NOT NULL,
    "birth_profile_id" UUID NOT NULL,
    "entry_date" DATE NOT NULL,
    "content" VARCHAR(4000) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "journal_entries_content_check" CHECK (char_length(btrim("content")) BETWEEN 1 AND 4000)
);

CREATE TABLE "journal_entry_revisions" (
    "id" UUID NOT NULL,
    "journal_entry_id" UUID NOT NULL,
    "content" VARCHAR(4000) NOT NULL,
    "superseded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "journal_entry_revisions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "journal_entry_revisions_content_check" CHECK (char_length(btrim("content")) BETWEEN 1 AND 4000)
);

CREATE UNIQUE INDEX "journal_entries_birth_profile_id_entry_date_key"
ON "journal_entries"("birth_profile_id", "entry_date");

CREATE INDEX "journal_entries_birth_profile_id_entry_date_idx"
ON "journal_entries"("birth_profile_id", "entry_date" DESC);

CREATE INDEX "journal_entry_revisions_journal_entry_id_superseded_at_idx"
ON "journal_entry_revisions"("journal_entry_id", "superseded_at" DESC);

ALTER TABLE "journal_entries"
ADD CONSTRAINT "journal_entries_birth_profile_id_fkey"
FOREIGN KEY ("birth_profile_id") REFERENCES "birth_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "journal_entry_revisions"
ADD CONSTRAINT "journal_entry_revisions_journal_entry_id_fkey"
FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
