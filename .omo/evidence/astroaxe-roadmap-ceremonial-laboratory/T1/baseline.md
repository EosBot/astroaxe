# T1 — Freeze the dirty baseline and migration truth (2026-08-26)

## Git status (pre-existing, not created by this task)

`git status --short` shows the same modified/deleted/untracked set as recorded
at session start (Tríade v3 in-progress work): schema, regency domain,
questionnaire, feedback API/UI, export, docs, plus untracked
`prisma/migrations/20260825160000_regency_feedback/`,
`src/app/privacidade/`, `src/domain/astrology/labels.{ts,test.ts}`,
`src/domain/orixas/regency/{public-orisa-catalog,questionnaire-matrix,questionnaire,questionnaire.test}.ts`,
`src/lib/orixas/regency-feedback.{ts,test.ts}`, `docs/research/orixa-triad-questionnaire/`,
and the new `.omo/` planning tree. No file was reset, stashed, cleaned or reverted.

## Migration truth

Command: `docker compose -f compose.yml -f compose.dev.yml run --rm app npx prisma migrate status`

```
19 migrations found in prisma/migrations
Database schema is up to date!
```

- `prisma/migrations/` on disk contains 19 numbered migration directories, ending in
  `20260825160000_regency_feedback`.
- The `migrate` Compose service runs `prisma migrate deploy` as a dependency of any
  `run --rm app ...` invocation, so the feedback migration is **already applied** to the
  running PostgreSQL 18 database — this is an observed fact, not an assumption.
- `prisma/schema.prisma` (working tree, modified/uncommitted) declares `model RegencyFeedback`
  with columns/constraints that match `migration.sql` for `20260825160000_regency_feedback`
  exactly (table `regency_feedback`, FK to `birth_profiles` with `ON DELETE CASCADE`, unique
  index on `(birth_profile_id, method_version, questionnaire_version)`, index on
  `(method_version, verdict)`). No schema/migration drift found.
- Generated Prisma client (`src/generated/prisma/models/RegencyFeedback.ts`) exists and matches
  the schema — the client is not stale relative to `prisma/schema.prisma`.

**Conclusion: the feedback migration is applied and the generated client is current. No
migration or generate step is owed before starting Task 2.**

## Targeted baseline (host, `npm` against the already-running Docker stack)

| Gate | Result |
| --- | --- |
| `npm run typecheck` | pass, no output |
| `npm run lint` | pass (`eslint . --max-warnings=0`), no output |
| `npm test` (`vitest run`) | **90 files passed (90) / 319 tests passed (319)**, 30.48s |
| `npm run format:check` | pass for all tracked source; only `.omo/` agent-runtime files (drafts,
  plans, `run-continuation/*.json`) are flagged — those are outside the plan's file allowlist and
  not part of the product source tree |

Three expected sanitized error-level log lines appeared during the test run (`account export
failed`, `published cultural content lookup failed`, `published cultural collection lookup
failed`) — these are intentional negative-path fixtures inside existing tests, not failures; all
319 tests passed.

## Observed-count drift vs. `docs/PROJECT_MEMORY.md`

The 2026-08-25 "regências v3" entry in `docs/PROJECT_MEMORY.md` records "315 testes em 89
arquivos" as its last observed checkpoint. This session observes 319 tests in 90 files on the
same (further-progressed, still uncommitted) worktree — consistent with additional v3 work
already present before this task started. `docs/IMPLEMENTATION_STATUS.md`'s "Migrations aplicadas"
list only enumerates 18 migrations and does not yet mention
`20260825160000_regency_feedback`, even though it is applied. Both docs are updated by this task
to reflect only the observed migration-application fact; test-count prose is left for Task 6's
full checkpoint reconciliation to avoid churn before further Wave 1 changes land.

## Docker stack (pre-existing, already running)

`docker compose -f compose.yml -f compose.dev.yml ps` showed `app`, `postgres`, `redis` healthy
and `traefik` up before this task ran any command; this task did not start, stop or rebuild any
service beyond the ephemeral `migrate`/one-off `app` run containers Compose creates for
`prisma migrate status`.
