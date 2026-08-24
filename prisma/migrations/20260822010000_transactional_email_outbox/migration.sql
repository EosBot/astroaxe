CREATE TABLE "email_outbox" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "kind" VARCHAR(50) NOT NULL,
    "template_version" VARCHAR(30) NOT NULL,
    "idempotency_key" VARCHAR(160) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lease_owner" UUID,
    "lease_expires_at" TIMESTAMPTZ(6),
    "provider_message_id" VARCHAR(255),
    "last_error_category" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ(6),
    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "email_outbox_attempt_count_check" CHECK ("attempt_count" >= 0),
    CONSTRAINT "email_outbox_status_check" CHECK ("status" IN ('PENDING', 'PROCESSING', 'RETRY', 'SENT', 'DEAD'))
);

CREATE UNIQUE INDEX "email_outbox_idempotency_key_key" ON "email_outbox"("idempotency_key");
CREATE INDEX "email_outbox_status_next_attempt_at_idx" ON "email_outbox"("status", "next_attempt_at");
CREATE INDEX "email_outbox_lease_expires_at_idx" ON "email_outbox"("lease_expires_at");
CREATE INDEX "email_outbox_created_at_idx" ON "email_outbox"("created_at");

ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
