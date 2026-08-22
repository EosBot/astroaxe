ALTER TABLE "cultural_contributors"
ADD COLUMN "user_id" UUID,
ADD COLUMN "role" VARCHAR(30) NOT NULL DEFAULT 'AUTHOR';

ALTER TABLE "cultural_contributors"
ADD CONSTRAINT "cultural_contributors_role_check"
CHECK ("role" IN ('AUTHOR', 'REVIEWER', 'ADMIN'));

CREATE UNIQUE INDEX "cultural_contributors_user_id_key"
ON "cultural_contributors"("user_id");

ALTER TABLE "cultural_contributors"
ADD CONSTRAINT "cultural_contributors_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
