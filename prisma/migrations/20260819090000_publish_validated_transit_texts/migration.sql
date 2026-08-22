INSERT INTO "cultural_contributors" (
  "id", "display_name", "attribution_line", "role"
) VALUES (
  '10000000-0000-4000-8000-000000000002',
  'Validação automatizada AstroAxe',
  'Validação estrutural e de políticas; não equivale a revisão humana ou cultural',
  'REVIEWER'
) ON CONFLICT ("id") DO NOTHING;

UPDATE "transit_interpretation_templates"
SET
  "status" = 'PUBLISHED',
  "reviewer_id" = '10000000-0000-4000-8000-000000000002',
  "reviewed_at" = CURRENT_TIMESTAMP,
  "published_at" = CURRENT_TIMESTAMP,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "version" = 'editorial-draft-1'
  AND "generation_method" = 'AI_ASSISTED'
  AND "status" = 'DRAFT';
