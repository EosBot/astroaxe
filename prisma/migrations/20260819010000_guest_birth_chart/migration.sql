CREATE TYPE "TimePrecision" AS ENUM ('KNOWN', 'UNKNOWN');

CREATE TABLE "guest_sessions" (
  "id" UUID NOT NULL,
  "token_hash" CHAR(64) NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "guest_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "birth_profiles" (
  "id" UUID NOT NULL,
  "guest_session_id" UUID NOT NULL,
  "display_name" VARCHAR(100) NOT NULL,
  "birth_date" DATE NOT NULL,
  "birth_time" VARCHAR(5),
  "time_precision" "TimePrecision" NOT NULL,
  "latitude" DECIMAL(9,6) NOT NULL,
  "longitude" DECIMAL(9,6) NOT NULL,
  "timezone" VARCHAR(100) NOT NULL,
  "location" VARCHAR(200) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "birth_profiles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "birth_profiles_coordinates_check" CHECK ("latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180),
  CONSTRAINT "birth_profiles_time_check" CHECK (("time_precision" = 'KNOWN' AND "birth_time" IS NOT NULL) OR ("time_precision" = 'UNKNOWN' AND "birth_time" IS NULL))
);

CREATE TABLE "natal_charts" (
  "id" UUID NOT NULL,
  "birth_profile_id" UUID NOT NULL,
  "input_fingerprint" CHAR(64) NOT NULL,
  "engine_version" VARCHAR(50) NOT NULL,
  "config_version" VARCHAR(50) NOT NULL,
  "calculation_mode" VARCHAR(20) NOT NULL,
  "result" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "natal_charts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "natal_charts_mode_check" CHECK ("calculation_mode" IN ('timed', 'untimed'))
);

CREATE UNIQUE INDEX "guest_sessions_token_hash_key" ON "guest_sessions"("token_hash");
CREATE INDEX "guest_sessions_expires_at_idx" ON "guest_sessions"("expires_at");
CREATE INDEX "birth_profiles_guest_session_id_created_at_idx" ON "birth_profiles"("guest_session_id", "created_at");
CREATE UNIQUE INDEX "natal_charts_birth_profile_id_key" ON "natal_charts"("birth_profile_id");
CREATE INDEX "natal_charts_input_fingerprint_idx" ON "natal_charts"("input_fingerprint");

ALTER TABLE "birth_profiles" ADD CONSTRAINT "birth_profiles_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "guest_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "natal_charts" ADD CONSTRAINT "natal_charts_birth_profile_id_fkey" FOREIGN KEY ("birth_profile_id") REFERENCES "birth_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
