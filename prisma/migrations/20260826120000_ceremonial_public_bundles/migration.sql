-- Task 11: immutable public bundle namespaces and transactional activation pointer.
-- Roll-forward: re-run this additive migration after restoring a verified backup.
-- Rollback before activation: drop pointer first, then bundles. After activation prefer
-- roll-forward; dropping these tables discards publication history and rollback pointers.

CREATE TABLE "ceremonial_public_bundles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "schema_version" INTEGER NOT NULL,
  "manifest_hash" CHAR(64) NOT NULL,
  "manifest" JSONB NOT NULL,
  "storage_namespace" VARCHAR(120) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'INACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verified_at" TIMESTAMPTZ(6),
  "activated_at" TIMESTAMPTZ(6),
  CONSTRAINT "ceremonial_public_bundles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ceremonial_public_bundles_schema_version_check" CHECK ("schema_version" = 1),
  CONSTRAINT "ceremonial_public_bundles_hash_check" CHECK ("manifest_hash" ~ '^[a-f0-9]{64}$'),
  CONSTRAINT "ceremonial_public_bundles_manifest_check" CHECK (jsonb_typeof("manifest") = 'object'),
  CONSTRAINT "ceremonial_public_bundles_namespace_check"
    CHECK ("storage_namespace" ~ '^bundle-[a-f0-9]{16,64}$'),
  CONSTRAINT "ceremonial_public_bundles_status_check"
    CHECK ("status" IN ('INACTIVE', 'ACTIVE', 'RETAINED')),
  CONSTRAINT "ceremonial_public_bundles_activation_check"
    CHECK (("status" = 'INACTIVE' AND "activated_at" IS NULL) OR
           ("status" IN ('ACTIVE', 'RETAINED') AND "activated_at" IS NOT NULL))
);

CREATE UNIQUE INDEX "ceremonial_public_bundles_manifest_hash_key"
  ON "ceremonial_public_bundles"("manifest_hash");
CREATE UNIQUE INDEX "ceremonial_public_bundles_storage_namespace_key"
  ON "ceremonial_public_bundles"("storage_namespace");
CREATE INDEX "ceremonial_public_bundles_status_created_idx"
  ON "ceremonial_public_bundles"("status", "created_at");

CREATE TABLE "ceremonial_public_bundle_pointer" (
  "id" INTEGER NOT NULL,
  "active_bundle_id" UUID,
  "previous_bundle_id" UUID,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ceremonial_public_bundle_pointer_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ceremonial_public_bundle_pointer_singleton_check" CHECK ("id" = 1),
  CONSTRAINT "ceremonial_public_bundle_pointer_distinct_check"
    CHECK ("active_bundle_id" IS NULL OR "active_bundle_id" <> "previous_bundle_id"),
  CONSTRAINT "ceremonial_public_bundle_pointer_active_fkey"
    FOREIGN KEY ("active_bundle_id") REFERENCES "ceremonial_public_bundles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ceremonial_public_bundle_pointer_previous_fkey"
    FOREIGN KEY ("previous_bundle_id") REFERENCES "ceremonial_public_bundles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "ceremonial_public_bundle_pointer" ("id") VALUES (1);
