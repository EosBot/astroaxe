CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "account_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "account_sessions_token_hash_key" ON "account_sessions"("token_hash");
CREATE INDEX "account_sessions_user_id_idx" ON "account_sessions"("user_id");
CREATE INDEX "account_sessions_expires_at_idx" ON "account_sessions"("expires_at");

ALTER TABLE "account_sessions" ADD CONSTRAINT "account_sessions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "birth_profiles" ALTER COLUMN "guest_session_id" DROP NOT NULL;
ALTER TABLE "birth_profiles" ADD COLUMN "user_id" UUID;
CREATE INDEX "birth_profiles_user_id_created_at_idx" ON "birth_profiles"("user_id", "created_at");
ALTER TABLE "birth_profiles" ADD CONSTRAINT "birth_profiles_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "birth_profiles" ADD CONSTRAINT "birth_profiles_exactly_one_owner_check"
CHECK (("guest_session_id" IS NOT NULL) <> ("user_id" IS NOT NULL));
