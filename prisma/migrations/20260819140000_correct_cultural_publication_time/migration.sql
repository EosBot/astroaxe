-- The first approval records used a same-day wall-clock time that was still in
-- the future during validation. Preserve the approval date while making the
-- approved collection available for the entire declared publication day.

UPDATE "cultural_entries"
SET
  "reviewed_at" = TIMESTAMPTZ '2026-08-19 00:00:00-03',
  "published_at" = TIMESTAMPTZ '2026-08-19 00:00:00-03',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "version" = 'council-approved-1'
  AND "id" IN (
    '31000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000002',
    '31000000-0000-4000-8000-000000000003',
    '32000000-0000-4000-8000-000000000001'
  );

UPDATE "cultural_reviews"
SET "created_at" = TIMESTAMPTZ '2026-08-19 00:00:00-03'
WHERE "id" IN (
  '51000000-0000-4000-8000-000000000001',
  '51000000-0000-4000-8000-000000000002',
  '51000000-0000-4000-8000-000000000003',
  '52000000-0000-4000-8000-000000000001'
);
