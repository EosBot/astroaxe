ALTER TABLE "users" ADD COLUMN "email_verified_at" TIMESTAMPTZ(6);

CREATE TABLE "account_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" VARCHAR(30) NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "account_tokens_purpose_check" CHECK ("purpose" IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET'))
);

ALTER TABLE "email_outbox" ADD COLUMN "account_token_id" UUID;

CREATE UNIQUE INDEX "account_tokens_token_hash_key" ON "account_tokens"("token_hash");
CREATE INDEX "account_tokens_user_id_purpose_created_at_idx" ON "account_tokens"("user_id", "purpose", "created_at");
CREATE INDEX "account_tokens_expires_at_idx" ON "account_tokens"("expires_at");
CREATE INDEX "email_outbox_account_token_id_idx" ON "email_outbox"("account_token_id");

ALTER TABLE "account_tokens" ADD CONSTRAINT "account_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_account_token_id_fkey"
FOREIGN KEY ("account_token_id") REFERENCES "account_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
