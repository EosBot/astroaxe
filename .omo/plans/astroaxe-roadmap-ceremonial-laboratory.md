# astroaxe-roadmap-ceremonial-laboratory - Work Plan

## TL;DR (For humans)

- **What you will get:** a verified Tríade v3, a complete read of the private archive at `/mnt/e/Ocultismo`, and a ceremonial method derived from it — deterministic celestial timing, entity and correspondence records, and private planning.
- **Why this approach:** the archive is an _input to authoring_, and the site publishes the _derived method_ written in our own words. One runtime, full coverage. (Superseded the earlier two-delivery, rights-gated design — see the direction change below.)
- **What it will not do:** it will not merge traditions, republish third-party source text, send private data to external AI or analytics, claim supernatural efficacy, operationalize harmful goals, rewrite applied migrations or overwrite the dirty worktree.
- **Shape:** 7 implementation waves, 39 implementation todos and 4 final-verification tasks. This is architecture-scale/high effort and should be executed incrementally with atomic commits and wave gates.
- **Primary risks:** accidental local→public leakage, hostile/corrupt documents, rights/sensitivity mistakes, private-record exposure, migration drift and scope expansion into unrelated production integrations.
- **Decisions locked:** calculation-only Tríade answers are ephemeral but consented feedback persists; public mode is hybrid-by-rights; local mode is complete/private/loopback; public data/storage/builds are physically separated; raw archival access is distinct from safe product guidance; external/legal provider work remains an explicit release blocker rather than mocked completion.

## MUDANÇA DE DIREÇÃO — 26 de agosto de 2026

**O modelo híbrido foi descartado por decisão do responsável.** Runtime único, cobertura
total. Ver `docs/BLUEPRINT.md` §5.0 para a decisão canônica.

O que isso invalida deste plano:

- **Waves 1–4 permanecem válidas.** Tríade v3, censo, extração e linhagem descrevem trabalho
  que continua fazendo sentido: o acervo é insumo de autoria e precisa ser lido, extraído e
  identificado.
- **O aparato de direitos e publicação foi removido do código** (commit de remoção): modo de
  runtime, matriz de facetas, bundle público filtrado, rota de artefato-fonte, classificação
  de direitos por edição/artefato/mídia, fila de revisão bloqueando publicação. As Tasks 7,
  9, 10, 11 e parte da 14 descreviam esse aparato e estão **superadas**.
- **A Task 15 está cancelada.** Ela era o workflow de revisão de direitos. Não há mais o que
  revisar: não publicamos fonte.
- **Waves 5–7 precisam ser reescritas** em torno do que o produto passa a ser: derivar o
  método do acervo, escrever a síntese, publicá-la com profundidade real, e explicar o método
  na página como um _model card_.

O que substitui a Task 15 e as waves seguintes ainda não foi escrito. Escrever isso é o
próximo passo de planejamento.

## Execution status — updated 2026-08-26

**Progress: 14 of 39 implementation todos complete (Waves 1 and 2 closed, Wave 3 in
progress). Final-verification wave F1-F4 not started.** Tasks 1-14 are all committed
locally on `develop`. Nothing was pushed and `main` is untouched.

**Task 13 ships with one open owner decision:** the supply-chain gate it introduces
currently BLOCKS its own image. See "Open blocker" below.

| Wave                                | Tasks | Status                    |
| ----------------------------------- | ----- | ------------------------- |
| 1 — Recovery and Tríade v3          | 1-6   | **Complete**              |
| 2 — Dual-mode foundation            | 7-11  | **Complete**              |
| 3 — Corpus ingestion                | 12-16 | 12-14 done; 15-16 pending |
| 4 — Deterministic ceremonial domain | 17-21 | Not started               |
| 5 — Tradition workspaces            | 22-27 | Not started               |
| 6 — Product experience              | 28-33 | Not started               |
| 7 — Operations and release          | 34-39 | Not started               |

### Commits, in order

| Task | Commit    | Message                                                      |
| ---- | --------- | ------------------------------------------------------------ |
| 1    | `8070d4e` | `docs(baseline): freeze pre-ceremonial implementation state` |
| 2    | `e9747f7` | `fix(regency): harden v3 request boundaries`                 |
| 3    | `2f3d2ce` | `fix(regency): require stateful feedback consent`            |
| 4    | `f27d43c` | `feat(regency): harden and withdraw calibration feedback`    |
| 5    | `00a780f` | `feat(regency): complete calibration provenance`             |
| 6    | `ba99696` | `test(regency): freeze the v3 calibration journey`           |
| 7    | `19e6a64` | `feat(ceremonial): add fail-closed deployment modes`         |
| 8    | `e16a461` | `feat(ceremonial): add provenance and private-record schema` |
| 12   | `26f4889` | `feat(corpus): inventory ceremonial archive by content hash` |
| 13   | `e95dc09` | `feat(corpus): add sandboxed extraction pipeline`            |
| 14   | `13158ab` | `feat(corpus): import source lineage and locators`           |

Every commit line matches the **Commit:** field declared by its todo. Evidence for each
task is under `.omo/evidence/astroaxe-roadmap-ceremonial-laboratory/T<n>/`.

### Observed checkpoint through task 11

- `npm run typecheck`, `npm run lint`, `npm run format:check`: pass.
- `npm test`: **94 files, 369 tests, all passing** (baseline at task 1 was 90/319).
- `npm run test:coverage`: 86.45% statements, 71.98% branches, 89.17% functions,
  88.62% lines.
- `npm run build`: pass. `npm run test:e2e`: **14/14 scenarios** (5.6 min).
- SonarQube Quality Gate: **PASSED** — 0 new violations, 81.6% new-code coverage,
  1.52275% new-code duplication.
- Migrations applied: **22** (was 19 at task 1), ending in `20260826020000_ceremonial_corpus`.
- Task 9 targeted checkpoint: `npm run typecheck`, `npm run lint` and 28 mode/access-policy
  tests passed. The complete coverage/build/E2E/Sonar checkpoint remains the wave gate.
- Task 10 targeted checkpoint: 21 artifact-storage/route tests, typecheck, lint and the Next.js
  production build passed; the build reports `/api/ceremonial/artifacts/[artifactId]` as dynamic.
- Task 11 targeted checkpoint: 10 bundle/store tests, typecheck and lint passed; migration 23
  deployed; production Docker targets `app` and `migrate` built successfully after one transient
  registry `ECONNRESET`. The host build was not authoritative because the active dev container
  owns `.next`; the isolated Docker build compiled Next and TypeScript successfully.

### Decisions taken during execution (not pre-specified by the plan)

1. **Task 5 — prior-release storage.** The plan requires comparing each aggregate release
   against prior releases for differencing attacks but did not say where prior releases
   live. Asked the owner, who chose a **new PostgreSQL table** (`regency_benchmark_releases`,
   migration `20260826010000`) over a versioned repo file.
2. **Task 7 — local runtime topology.** The plan requires physically separate public/local
   services. Implemented as a **standalone Compose project** (`compose.local.yml`,
   `name: astroaxe_ceremonial_local`) rather than an overlay on `compose.yml`, because an
   overlay would merge into the same service names and could not guarantee separate
   credentials and volumes.
3. **Task 8 — enum representation.** Followed the repository's dominant convention
   (`VARCHAR` + `CHECK`) instead of Prisma enums, matching the 20 pre-existing migrations;
   only `TimePrecision` is a Prisma enum in this schema.

### Pre-existing defects found and fixed while executing (outside the todos' own scope)

These were already broken in the dirty `develop` worktree before this work began; each was
blocking a gate the plan requires, so it was fixed rather than worked around.

1. **`npm run regency:evaluate` was entirely broken.** The in-progress v3 work had added
   `import "server-only"` to `v2-config.ts`/`v2-matrix.ts`; that package throws
   unconditionally outside Next's bundler-level `react-server` condition swap, so both
   existing CLI modes crashed. Fixed with `--conditions=react-server` in the `package.json`
   scripts (task 5).
2. **`scripts/release-smoke.sh` failed silently.** It still asserted the pre-v3 string
   `"AstroAxe Regências 2.1"` on `/metodologia`, which has said `3.0` since v3 shipped.
   Under `set -e` this aborted the whole E2E wrapper with no printed error (task 6).
3. **`tests/e2e/methodology.spec.ts`** carried the same stale `2.1` assertion (task 6).
4. **`tests/e2e/authenticated-mvp.spec.ts` was stale since v3**: it opened the Orixás module
   and immediately expected the result heading, skipping the now-mandatory questionnaire.
   Rewritten as the full journey the plan's task 6 requires (task 6).
5. **Load-dependent Vitest flakiness** in `profile-archive.test.tsx` and others under
   coverage instrumentation. Root cause was the 5000 ms default timeout on this host, not a
   product regression — every failing test passes in isolation. Mitigated with
   `testTimeout: 15_000` in `vitest.config.ts` (task 6).

### Operational incident (task 6, contained, no data lost)

While debugging E2E outside the official wrapper, a `docker compose down` was issued without
an explicit `-p`/`COMPOSE_PROJECT_NAME`. Because an env var set in one shell invocation does
not persist to the next, it targeted the **main dev stack** (`astroaxe`) instead of the
isolated `astroaxe_e2e` one. Caught immediately via `docker ps -a`. No volume was removed
(`down` without `-v`), the stack was restored with `up -d --wait`, and data was verified
intact against pre-incident counts. Recorded in
`.omo/evidence/.../T6/checkpoint.txt`. **Lesson for the remaining waves: always pass `-p`
explicitly to any Compose command that stops or removes containers.**

### Open blocker — needs an owner decision before the ingest image is cleared

Task 13's own gate refuses the image it built. A pinned Trivy 0.74.0 scan of
`ingest-runner` reports **201 blocking findings: 8 CRITICAL, 62 HIGH, 131 MEDIUM**, and
only 16 of them have any fix available. Essentially all are Debian bookworm OS packages
that Debian stable has not patched (libexpat1, libcurl4, perl-base, libglib2.0-0, libc6,
libsqlite3-0, zlib1g, libxml2).

The policy was **not** weakened to make this green — Critical and High have no exception
form, by design. A bounded experiment was run instead: scanning `node:24.19.0-trixie-slim`
directly gives **25 Critical+High** versus bookworm's 70. Better, but still not zero, so
**no available Debian-based Node image clears the task's own acceptance bar today.**

Three honest paths, all requiring the owner:

1. Move `ingest-runner` to a trixie base (cuts Critical+High from 70 to ~25, needs a
   separate dependency stage since the app runtime stays on bookworm);
2. accept a documented, time-bounded exception set — but that means changing the policy to
   permit Critical/High exceptions, which is exactly the loosening the plan forbids;
3. keep the gate red and treat the ingest image as run-at-owner's-discretion, which is the
   current state: the pipeline is verified and works, and the gate says so out loud.

The npm `tar` 7.5.16 → 7.5.19 finding is separately fixable via the lockfile, but that is a
shared dependency for the whole app and out of task 13's scope.

### Where to resume

Task 15 (`Classify rights, sensitivity and editorial eligibility per edition/artifact`).
**This is the one the plan itself flags as needing owner input**: it makes rights and
licensing determinations about real published works, which is a legal judgement an agent
should not default. Task 14 left the corpus in exactly the right state for it — 145
artifacts imported, all local-only with unknown rights, and 1.201 open queue items saying
what is still unidentified.

Tasks 12-14 all ran against the real `/mnt/e/Ocultismo` archive, read-only, without
following symlinks and without copying a single source file.

**Unstarted work that needs owner input before it can proceed honestly:** tasks 12-13 walk
the real `/mnt/e/Ocultismo` corpus and build a sandboxed extraction/OCR container with SBOM
and Trivy gates; task 15 makes rights/licensing determinations about real published works;
tasks 22-26 model living religious and ceremonial traditions. These involve legal and
cultural judgments that should not be defaulted by an agent.

## Scope

### IN

- Preserve and complete the interrupted Tríade de Regências v3 before adding new sensitive-data models.
- Keep `/mnt/e/Ocultismo` as the private source corpus and support two fail-closed modes over one provenance model: `local` (complete corpus) and `public` (hybrid-by-rights).
- Build source/edition/artifact/locator/entity/variant/media/timing provenance, deterministic celestial timing, separate Angelical, Ars Goetia, Ars Theurgia-Goetia, Olympic-spirit and planetary-intelligence workspaces, plus a private planner/session journal.
- Reconcile the verified AstroAxe backlog, migrations, privacy, security, accessibility, operations and release evidence without overwriting the dirty `develop` worktree.

### OUT / Must NOT Have

- No blending of distinct traditions, grimoires, manuscript families, Orixás or ceremonial entities into universal equivalences.
- No public redistribution of local-only or rights-unknown source text/media; local availability never implies public permission.
- No claim of supernatural efficacy, diagnosis, guaranteed outcome, coercion, harm, sacrifice, illegality, crisis targeting or replacement of religious/specialist guidance.
- No PII, birth data, ritual notes, belief inference or corpus text in logs, analytics, external LLMs, URLs or public caches.
- No rewrite of an applied migration, no `db push`, no destructive volume command and no implicit publication from `/mnt/e/Ocultismo`.
- No Stripe, analytics vendor, public RAG/LLM or production-provider activation without the separate owner/credential/legal gates already documented in `docs/IMPLEMENTATION_STATUS.md:290-326`.

## Verification strategy

- **TDD:** pure timing, mode policy, rights/access policy, source/entity contracts, safety policy, encryption and tradition adapters. Each todo first adds a failing regression, then the smallest implementation.
- **Tests-after:** Prisma migrations, route handlers, export/delete flows, ingestion wiring and React UI.
- **Mandatory targeted gates:** `npm test -- <listed-test-files>`, `npm run typecheck`, `npm run lint`, and `npm run format:check` after every wave.
- **Runtime gates:** `docker compose -f compose.yml -f compose.dev.yml config`, migration deploy against an isolated database, `npm run build`, `npm run test:e2e`, `npm run test:release-smoke`, backup/restore verification and `npm run quality`.
- **Leak gates:** seed local-only corpus records into the test DB, exercise every public route/export/cache/sitemap/build, scan response bodies and `.next`/standalone/static artifacts for local paths, protected snippets, artifact hashes and local IDs; any match fails the release.
- **Evidence:** every QA scenario writes sanitized command output, JSON manifests, screenshots or Playwright traces under `.omo/evidence/astroaxe-roadmap-ceremonial-laboratory/T<task>/`; never include source text, PII or secrets in evidence.
- **Evidence fixtures:** screenshots, traces and response captures use synthetic corpus, accounts and private notes only; disable body capture where possible, sanitize retained traces, then recursively scan `.omo/evidence` for protected/private sentinels before handoff.

## Execution strategy

### Waves and dependencies

| Wave                                | Tasks | Starts when             | Parallelism                                                                 |
| ----------------------------------- | ----- | ----------------------- | --------------------------------------------------------------------------- |
| 1 — Recovery and Tríade v3          | 1-6   | approval                | 2-5 after task 1                                                            |
| 2 — Dual-mode foundation            | 7-11  | task 6                  | 7 after the verified Tríade checkpoint; 8 after 7; 9 after 8; 10-11 after 9 |
| 3 — Corpus ingestion                | 12-16 | tasks 7-11              | 12 first; 13 after 12; 14-16 ordered                                        |
| 4 — Deterministic ceremonial domain | 17-21 | tasks 7-9               | 17 first; 18 after 17; 19-20 parallel; 21 last                              |
| 5 — Tradition workspaces            | 22-27 | tasks 14-21             | 22-26 parallel; 27 last                                                     |
| 6 — Product experience              | 28-33 | tasks 16, 22-27         | 28 first; 29-30 after 28; 31-32 ordered; 33 last                            |
| 7 — Operations and release          | 34-39 | tasks 6, 11, 16, 21, 33 | 34-36 parallel; 37-39 ordered                                               |

Before any edit, the worker must read `AGENTS.md`, `docs/PROJECT_MEMORY.md`, the relevant `node_modules/next/dist/docs/` guides, run `git status --short`, and record the pre-existing diff. Unrelated modified/untracked files are immutable inputs; use a task-owned worktree only if the user requests branch/PR delivery.

For every task, derive an explicit file allowlist from its **Implement** and **References** fields plus named new files; record pre/post hashes for all pre-existing untracked files and compare out-of-scope tracked/staged state. Any unrelated drift stops the wave. Never use `reset`, `checkout`, `clean`, automatic stash, destructive rebase, bulk formatting or `down -v`.

## Todos

### Wave 1 — Recover the baseline and finish Tríade v3

- [x] 1. Freeze the dirty baseline and migration truth before changing behavior — **DONE `8070d4e`**
  - **Delivered:** proved the feedback migration was already applied and the generated client
    current; recorded the 90-file/319-test baseline; reconciled the applied-migration list in
    `docs/IMPLEMENTATION_STATUS.md`, which was missing `20260825160000_regency_feedback`. The
    DB-unavailable drill paused (not deleted) the Postgres container and confirmed
    `migrate status` fails typed (`P1001`) instead of guessing. No user file was reverted.
  - **Implement:** capture `git status --short`, scoped diffs, current generated Prisma state, `prisma migrate status`, database migration rows and the exact targeted-test baseline; write only sanitized evidence and update `docs/PROJECT_MEMORY.md`/`docs/IMPLEMENTATION_STATUS.md` when observed counts differ. Never reset, clean, stash or rewrite the user's v3 work.
  - **References:** `AGENTS.md:Git and GitHub`; `docs/PROJECT_MEMORY.md:3-20`; `docs/IMPLEMENTATION_STATUS.md:136-228,328-344`; `prisma/migrations/20260825160000_regency_feedback/migration.sql`.
  - **Acceptance:** applied/unapplied status of the feedback migration is proven; pre-existing modified/untracked paths are recorded; generated client matches `prisma/schema.prisma`; no user file is reverted.
  - **QA happy:** run status/migration/typecheck and save sanitized outputs to `.../T1/baseline.md`.
  - **QA failure:** simulate an unavailable DB; evidence must mark migration state unknown and block schema edits rather than guessing (`.../T1/db-unavailable.md`).
  - **Commit:** `docs(baseline): freeze pre-ceremonial implementation state`.

- [x] 2. Make Tríade calculation and feedback boundaries fail closed — **DONE `e9747f7`**
  - **Delivered:** same-origin enforcement added to `POST` (only `PUT` had it); new shared
    `src/lib/security/json-body.ts` guard gives both verbs the missing 413 alongside the
    existing 415; chart parsing/scoring wrapped in `tryCalculateRegency`, which logs only
    `errorType` and returns a sanitized 503. Contract gaps closed in
    `regency-feedback.ts`: `knowsOrisas=false` now forbids a correction, and
    `knowsOrisas=true` requires at least one non-null role.
  - **Implement:** add same-origin enforcement to POST, a shared bounded-JSON reader for POST/PUT, typed sanitized error handling around chart parsing/scoring, and contract invariants: `knowsOrisas=false` forbids corrections; `knowsOrisas=true` requires at least one non-null role; corrected IDs remain matrix-eligible; literal method/questionnaire/consent versions remain mandatory.
  - **References:** `src/app/api/profiles/[profileId]/regency/route.ts:38-130`; `src/lib/orixas/regency-feedback.ts:17-42`; `src/lib/security/account.ts:103-107`; `src/app/api/maps/route.ts` body-limit precedent.
  - **Acceptance:** wrong origin=403, non-JSON=415, oversized/malformed/invalid=400 or 413, non-owner=404, invalid chart/storage failure=sanitized 503; logs contain error type only.
  - **QA happy:** targeted route and contract tests prove owned POST and consented PUT (`.../T2/route-happy.txt`).
  - **QA failure:** table-driven tests cover every rejection and assert no scorer/upsert call (`.../T2/route-rejections.txt`).
  - **Commit:** `fix(regency): harden v3 request boundaries`.

- [x] 3. Bind explicit consent and complete the feedback UI state machine — **DONE `2f3d2ce`**
  - **Delivered:** split the 447-line `orisa-research-lab.tsx` into
    `orisa/{shared.ts,questionnaire-step,result-view,feedback-form}.tsx` plus a ~120-line
    orchestrator, each well under 250 LOC. **Real defect found:** the consent checkbox was
    uncontrolled, so the component always serialized `consent:true` regardless of what was
    checked, relying only on HTML `required` (which a programmatic submit skips). Now a bound
    boolean, with `submit()` refusing while unchecked or already in flight (blocking duplicate
    submits) and focus moved to the saved/error region.
  - **Implement:** split `src/components/account/orisa-research-lab.tsx` below 250 pure LOC into questionnaire/result/feedback components; bind the checkbox to boolean state; serialize `consent:true` only from checked state; disable duplicate submit; preserve answers on retry; expose accessible saving/saved/error states and focus the error/success region.
  - **References:** `src/components/account/orisa-research-lab.tsx:35-438`; `src/components/account/product-modules.test.tsx:93-124`; `AGENTS.md:UI/UX`.
  - **Acceptance:** unchecked feedback cannot call fetch; checked submission sends the exact versioned payload once; server error retains entered data; keyboard and screen-reader semantics remain valid.
  - **QA happy:** Testing Library submits a checked correction and asserts the PUT payload (`.../T3/component-happy.txt`).
  - **QA failure:** unchecked, double-click and 503 tests prove no false saved state (`.../T3/component-failure.txt`).
  - **Commit:** `fix(regency): require stateful feedback consent`.

- [x] 4. Add additive database hardening and feedback withdrawal — **DONE `f27d43c`**
  - **Delivered:** new additive migration `20260826000000_regency_feedback_constraints`
    (no applied migration edited) adding CHECK constraints for verdict, confirmation basis,
    JSON shape and `knows_orisas`/`corrected_triad` consistency; verified on the isolated dev
    DB that a valid row inserts, each invalid variant is rejected per constraint, and cascade
    delete still holds. Same-origin owner-scoped `DELETE` added to the regency route
    (204/404), removing one method/questionnaire-versioned feedback without touching the
    chart or profile. Rollback/roll-forward documented in the migration header.
  - **Implement:** never alter an applied migration. Create a new migration adding CHECK constraints for verdict, confirmation basis, JSON object/array types and `knows_orisas`/`corrected_triad` consistency; add a same-origin, owner-scoped DELETE to the regency route that removes only the selected profile/method/questionnaire feedback and returns 204/404. Keep profile/account cascade deletion.
  - **References:** `prisma/schema.prisma:115-137`; feedback migration; `src/app/api/profiles/[profileId]/journal/[entryId]/route.ts`; `src/app/api/profiles/[profileId]/regency/route.ts`.
  - **Acceptance:** invalid direct SQL is rejected; migration deploys on populated valid rows; rollback/roll-forward procedure is documented; owner can withdraw one feedback without deleting the chart.
  - **QA happy:** isolated PostgreSQL migration + DELETE test proves selective removal (`.../T4/migration-delete.txt`).
  - **QA failure:** invalid enum/JSON/non-owner DELETE tests fail closed and preserve rows (`.../T4/constraint-rejections.txt`).
  - **Commit:** `feat(regency): harden and withdraw calibration feedback`.

- [x] 5. Make calibration export and benchmark provenance complete — **DONE `00a780f`**
  - **Delivered:** personal export now carries matrix/config/scorer versions alongside
    method/questionnaire for every feedback. New pure
    `src/domain/orixas/regency/benchmark-release.ts` groups rows into the fixed predeclared
    tuple `{method,matrix,config,scorer,questionnaire,role,verdict,confirmationBasis,
directedPair}` — a `.strict()` schema with only those nine fields, so ids, comments,
    birth data and timestamps are structurally unrepresentable. Refuses cohorts under 30,
    primary-suppresses cells under 10, applies complementary suppression, and blocks
    publication on a differencing-attack-sized delta versus the prior stored release.
    `scripts/evaluate-regency.ts` gains `--aggregate-release <version>` (no filter argument;
    always the full cohort). Prior releases persist in `regency_benchmark_releases`
    (migration `20260826010000`) per the owner's decision. **Two real bugs caught by the
    tests before any DB work:** the cell and partition hash functions were including
    `count`/`suppressed` in their identity keys, silently breaking both partition grouping
    and cross-release matching.
  - **Implement:** include matrix/config/scorer versions in `accountExportSchema` and export selection. Keep row-level data local/research-role restricted. Shareable output is limited to predeclared tables over fixed dimensions `{method,matrix,config,scorer,questionnaire version, role, verdict, confirmationBasis, directed pair}`, excludes IDs/comments/birth/location/timestamps, requires cohort `n>=30`, primary-suppresses cells `n<10`, applies complementary suppression so row/column totals cannot recover hidden cells, forbids arbitrary filters, and compares every release against prior releases for differencing attacks. Update `scripts/evaluate-regency.ts` without inventing accuracy when thresholds are unmet.
  - **References:** `src/app/api/auth/export/route.ts:80-155`; `src/lib/auth/account-export.ts:62-84`; `src/domain/orixas/regency/benchmark.test.ts`; `scripts/evaluate-regency.ts`; `docs/regency-research-protocol.md`.
  - **Acceptance:** personal export is reproducible; aggregate output is versioned, fixed-schema and passes quasi-identifier, complementary-suppression and cross-release differencing tests; undersized/mixed cohorts are refused explicitly.
  - **QA happy:** export tests assert all five versions and a valid de-identified cohort (`.../T5/export-benchmark.txt`).
  - **QA failure:** snapshot scan proves no PII/comments/internal weights/claim IDs leak (`.../T5/export-leak-scan.txt`).
  - **Commit:** `feat(regency): complete calibration provenance`.

- [x] 6. Lock the Tríade v3 journey, documentation and quality checkpoint — **DONE `ba99696`**
  - **Delivered:** golden fixtures freeze the exact 27-entity eligible catalog, the
    scorer/config/matrix version triple and the all-roles-unresolved case. E2E extended to
    the full journey (questionnaire → result → consent-gated feedback → export with all five
    versions → selective `DELETE` withdrawal → profile deletion), asserting live in-browser
    that the submit button stays disabled until consent is checked. Docs reconciled to state
    the precise rule — questionnaire answers are calculation-only and never persisted,
    feedback is separately consented, versioned and individually withdrawable — across
    `/privacidade`, `/metodologia` and `docs/IMPLEMENTATION_STATUS.md`; the changelog and
    research report already said it correctly. Dated checkpoint added to
    `docs/PROJECT_MEMORY.md`. Sonar found four real issues in this session's own new code
    (a `reduce()` without an initial value, three ambiguous-JSX-whitespace smells); all four
    fixed and the gate re-run to PASSED.
  - **Deviation:** fixing the three stale/broken pre-existing gates listed above was required
    to run this task's own E2E and quality checkpoints at all.
  - **Implement:** add exact golden fixtures for 27 candidates, directed pairs, scorer/config/matrix versions and unresolved roles; add authenticated Playwright coverage for questionnaire→result→consent→feedback→export→withdrawal; reconcile the precise persistence rule across privacy, changelog, research report, methodology, status and memory.
  - **References:** `src/domain/orixas/regency/questionnaire.test.ts`; `v2.golden.test.ts`; route/component/export tests; `docs/astrology-calculation-changelog.md:3-27`; `docs/research/orixa-triad-questionnaire/report-source.md:30-44`; `src/app/privacidade/page.tsx:35-111`.
  - **Acceptance:** docs say calculation-only answers are ephemeral and separately consented feedback is persisted; all targeted tests, migration deploy, E2E, build and quality gate pass with observed counts recorded.
  - **QA happy:** run targeted Vitest, `npm run test:e2e`, `npm run quality` (`.../T6/checkpoint.txt`).
  - **QA failure:** E2E with rejected consent/version proves no row and no success message (`.../T6/e2e-rejection.txt`).
  - **Commit:** `test(regency): freeze the v3 calibration journey`.

### Wave 2 — Establish the dual-mode ceremonial foundation

- [x] 7. Introduce a parsed, fail-closed deployment-mode contract — **DONE `19e6a64`**
  - **Delivered:** `src/lib/ceremonial/mode.ts` (server-only) parses `CEREMONIAL_MODE` via a
    Zod discriminated union into one frozen, process-memoized policy object
    (`servesPublicLibrary` / `servesLocalArchive` / `local`). It accepts only an environment
    record, so no request, header, cookie or role can select a mode. `local` requires an
    absolute archive root, a keyring and a loopback bind; `public`/`disabled` reject those
    values outright instead of ignoring them. All rejections throw synchronously, before any
    I/O. `src/domain/ceremonial/contracts.ts` freezes the rights/access/sensitivity/facet
    vocabulary with `UNKNOWN` + `LOCAL_ONLY` defaults. `compose.local.yml` is a standalone
    project with its own Postgres, Redis, credentials, named volumes and an internal
    no-egress network, publishing on loopback and mounting archive/keyring read-only;
    `compose.yml` stays public-safe. Both configs were rendered and each scanned for the
    other's material — clean both ways, and no archive/keyring identifier appears in any of
    the 13 built client chunks. Pino redaction extended to `archiveRoot`, `keyringFile`,
    `sourceText`. 17 new tests.
  - **Implement:** add immutable process mode `CEREMONIAL_MODE=disabled|public|local` defaulting to `disabled`; use a Zod discriminated union so `local` requires archive root/keyring and loopback bind, while `public` rejects those values and cannot be selected per request/header/cookie/role. Establish physically separate public/local PostgreSQL, Redis, storage, credentials and volumes in Compose before ingestion work; public receives only reviewed bundles. Freeze User ownership for plans/sessions (optional BirthProfile timing link only), adult authenticated local access, rights/access/sensitivity enums and unknown-rights=`metadata only/deny body`. Expose one server-only policy object; never branch on raw environment strings in components/routes.
  - **References:** `src/lib/env.ts:5-29`; `src/lib/config/read-secret.ts`; `.env.example`; `compose.yml:52-109`; Next.js environment docs under `node_modules/next/dist/docs/`.
  - **Acceptance:** invalid/mixed mode fails startup; public/local services cannot address each other's DB/Redis/storage credentials or volumes; secrets are redacted; client bundles contain no archive path/keyring.
  - **QA happy:** env contract tests for all three valid modes (`.../T7/env-modes.txt`).
  - **QA failure:** public+archive-root and local-without-key fail before DB/network use (`.../T7/env-rejections.txt`).
  - **Commit:** `feat(ceremonial): add fail-closed deployment modes`.

- [x] 8. Add the provenance-first ceremonial schema through reviewed migrations — **DONE `e16a461`**
  - **Delivered:** migration `20260826020000_ceremonial_corpus` adds 15 additive tables —
    source systems, workspace memberships, work/edition/artifact/locator lineage, entities
    and per-edition variants, media, correspondences, cross-references, timing profiles,
    structured reviews, and encrypted plans/sessions. Both invariants are structural, not
    conventional: no table gives an entity a workspace column (workspaces reach systems only
    through membership rows), and `locator_id` is `NOT NULL` + `ON DELETE RESTRICT` on
    variants, correspondences, cross-references and timing profiles. The cross-reference
    vocabulary deliberately omits any `IDENTICAL_TO`, so cross-system identity is not an
    expressible statement. CHECK constraints carry the task-7 vocabulary into the DB and fail
    closed: `access='PUBLIC'` requires publication-eligible rights, artifacts store only
    relative paths (absolute host locations unrepresentable), `content_hash` is a unique
    lowercase SHA-256, non-extracted artifacts must state a reason. Verified by putting two
    source systems in the same `ANGELICAL` workspace and confirming an identically named
    angel stays two entities; ten adversarial inserts each rejected by PostgreSQL. Plans
    cascade from `users`, link a birth profile with `SET NULL`, and cascade to sessions
    (confirmed via `pg_constraint.confdeltype` = `c`/`n`/`c`). Deployed to the populated dev
    DB with no drift; 12 users / 13 birth profiles / 13 charts unchanged, all synthetic
    fixtures removed.
  - **Implement:** create separate `CeremonialWorkspaceKind` (product navigation: `ANGELICAL|ARS_GOETIA|ARS_THEURGIA_GOETIA|OLYMPIC|PLANETARY_INTELLIGENCE`) and `CeremonialSourceSystem` records (for example Heptameron, Ars Paulina, Dee/Enochian, named Shem-derived schools, individual manuscript families), then models for work, edition, artifact, locator, entity, variant, media, correspondence, timing profile, review, plan and session. Entities belong to one source system; workspaces aggregate systems only through explicit membership. Include lineage/hash, per-facet rights, access, sensitivity, extraction, locators, versions and structured approvals. Plans belong to User; optional BirthProfile uses `SetNull`; sessions cascade. Use constraints/FKs/indexes.
  - **References:** `prisma/schema.prisma:198-318` cultural models; `src/lib/editorial/workflow.ts`; `docs/cultural-content-operations.md`; `docs/data-inventory.md`.
  - **Acceptance:** workspace identity can never substitute for source-system identity; distinct Angelical systems cannot merge through a broad workspace; every correspondence/timing rule has a locator; destructive changes have roll-forward/rollback and backup prerequisite.
  - **QA happy:** deploy migration to fresh and populated isolated PG18; generate Prisma (`.../T8/migration-happy.txt`).
  - **QA failure:** orphan locator, duplicate hash/version and illegal access/right combinations are DB-rejected (`.../T8/migration-constraints.txt`).
  - **Commit:** `feat(ceremonial): add provenance and private-record schema`.

- [x] 9. Centralize rights, sensitivity and mode authorization — **DONE in worktree 2026-08-26**
  - **Delivered:** pure `src/domain/ceremonial/access-policy.ts` validates unknown inputs and
    returns a frozen capability for each of the seven facets with an explicit allow/deny reason.
    Disabled mode denies all; local mode requires authentication; public mode requires public
    access plus current RIGHTS and EDITORIAL approvals for the exact facet. Body/export facets
    require eligible rights, restricted knowledge remains metadata-only, and forged/unknown
    values fail closed. Eleven table-driven policy tests plus the 17 mode tests pass.
  - **Implement:** create pure `src/domain/ceremonial/access-policy.ts` returning a per-facet capability object for `metadata`, `quotation`, `fullText`, `image`, `seal`, `mediaDownload` and `export`, each with `allow|deny` plus reason. Public capabilities require the matching permission scope, eligible rights and unexpired approvals; local raw-source capabilities require authenticated local mode; derived guidance also passes safety policy. Apply before fetching/serialization. Unknown values deny every facet except explicitly approved metadata.
  - **References:** `src/lib/cultural-content/public-entry.ts:10-127`; `src/lib/editorial/workflow.ts:11-126`; `src/lib/security/account.ts:74-107`; planned task-8 enums.
  - **Acceptance:** one policy governs list/detail/search/quotation/text/image/seal/download/export independently; public mode cannot override it; local-only data remains inaccessible in public mode even when adversarially seeded.
  - **QA happy:** table-driven TDD covers every rights×scope×review×mode combination (`.../T9/policy-table.txt`).
  - **QA failure:** unknown status, forged mode header and unpublished record all deny (`.../T9/policy-adversarial.txt`).
  - **Commit:** `feat(ceremonial): centralize dual-mode access policy`.

- [x] 10. Isolate artifact/media storage from public delivery — **DONE in worktree 2026-08-26**
  - **Delivered:** `artifact-storage.ts` accepts only normalized relative paths, opens with
    `O_NOFOLLOW`, requires a regular non-empty file, verifies the opened descriptor remains under
    the canonical archive root through `/proc/self/fd`, and validates PDF/PNG/JPEG/GIF/WebP/text
    signatures before streaming. A local-only authenticated dynamic route applies the T9 policy
    before filesystem I/O, supports one bounded byte range from the same descriptor, returns
    no-store/nosniff/CSP headers and exposes only an opaque artifact UUID. Public/disabled modes
    return 404 before authentication or DB access. Twenty-one targeted tests and production build
    pass.
  - **Implement:** store only normalized relative paths and hashes in DB; canonicalize under the configured archive root with descriptor/no-follow checks, reject traversal/symlinks/devices, validate MIME by bytes, and stream via authenticated local-only route with range support and no-store headers. Public media must come only from a separate reviewed publish bundle, never from the archive mount.
  - **References:** `src/lib/security/headers.ts`; `src/app/api/journal/export/route.ts`; `compose.dev.yml:10-13`; planned artifact/media schema and policy.
  - **Acceptance:** archive root is read-only; public app image/container has no mount; route never reveals filesystem paths; content disposition and CSP are safe.
  - **QA happy:** local authenticated read/range tests for approved fixtures (`.../T10/media-happy.txt`).
  - **QA failure:** traversal, symlink escape, MIME spoof, unauthenticated and public-mode requests fail (`.../T10/media-adversarial.txt`).
  - **Commit:** `feat(ceremonial): isolate local artifact delivery`.

- [x] 11. Create a deterministic reviewed public-publication bundle — **DONE in worktree 2026-08-26**
  - **Delivered:** strict source/manifest schemas and a canonical builder sort all records, fields,
    approvals and media before SHA-256. Explicit ineligible selections abort; ordinary exclusions
    are accounted for; metadata-only records cannot express source paths or bodies. The public
    target independently revalidates schema, hash, current per-facet rights/editorial approvals,
    rights/sensitivity policy and media hashes. Migration `20260826120000_ceremonial_public_bundles`
    stores immutable inactive namespaces plus a singleton active/previous pointer. Serializable
    activation retains the previous namespace; rollback revalidates it before atomically swapping
    the pointer. CLI `ceremonial:bundle` writes manifest/hash/exclusions without overwrite.
  - **Implement:** add strict schemas/builder; select policy-eligible reviewed records, include provenance and facet-authorized media, omit local paths/body for metadata-only, and produce canonical manifest/hash. Exclude/report expected local/ineligible records; abort only when explicitly selected publication is ineligible. Import into an inactive versioned public DB schema and storage namespace; on the public target independently verify schema, manifest/media hashes and current non-revoked approvals, then switch one transactional active-bundle pointer. Preserve the previous namespace for immediate pointer rollback; garbage-collect only after the rollback window. No local→public DB replication.
  - **References:** `src/lib/cultural-content/public-entry.ts`; `src/app/sitemap.ts`; `docs/cultural-content-operations.md`; package script patterns in `package.json:29-32`.
  - **Acceptance:** identical inputs yield byte-identical bundle; exclusion report accounts for nonselected records; activation is pointer-atomic across preverified DB/storage namespace and rollback restores the prior pointer; bundle carries no local identifiers/paths/protected snippets.
  - **QA happy:** golden bundle from eligible fixtures (`.../T11/public-bundle.sha256`).
  - **QA failure:** adversarial local-only fixture makes generation fail and emits a sanitized report (`.../T11/bundle-rejection.txt`).
  - **Commit:** `feat(ceremonial): build reviewed public corpus bundles`.

### Wave 3 — Inventory and ingest the private corpus

- [x] 12. Build a resumable, content-addressed inventory of `/mnt/e/Ocultismo` — **DONE `26f4889`**
  - **Delivered:** local-only read-only CLI (`npm run ceremonial:inventory`) walking without
    following symlinks, terminating on directory loops, recording relative path, size, mtime,
    SHA-256 and detected type, and grouping byte-identical files. Append-only checkpoint makes
    an interrupted run resumable; the manifest is written by atomic rename and carries no
    absolute path (schema rejects it and the builder revalidates every entry). Reruns are
    verified through a fingerprint that excludes `generatedAt`.
  - **Observed census: 801 files / 737 unique hashes / 64 duplicates — `matchesBaseline: true`**,
    zero unreadable, 13 quarantined (all `desktop.ini`). The archive turned out to be mostly
    ritual audio (538 mp3, 146 pdf, 77 jpg), which the plan had not stated.
  - **Three real defects found only by running against the actual archive**, each fixed with a
    regression test: (1) the hash was discarded whenever the type was unknown, quarantining 554
    of 801 files and collapsing unique hashes to 188 — identity belongs to the bytes, not to
    whether the format can be named; (2) the type detector was blind to MP3/MP4/ASF/WAV, having
    been designed assuming text; (3) transient 9p-mount failures became permanent quarantine —
    two consecutive runs returned truncated censuses (259 and 695 files) with whole top-level
    directories marked unreadable while the mount was healthy. Fixed with bounded retry and
    exponential backoff per `AGENTS.md:7`, not retrying EACCES/EPERM/ENOENT so a genuine denial
    is still recorded.
  - **Implement:** add a local-only CLI that walks without following symlinks, records normalized relative path, size, MIME, modified time and SHA-256, groups exact duplicates, checkpoints progress and never copies source files. Preserve the observed 801/737/64 baseline as comparison, not as a hardcoded truth.
  - **References:** `docs/research/orixa-method-v2/report-source.md:22-43`; `docs/data-inventory.md`; `/mnt/e/Ocultismo`; `scripts/` CLI conventions.
  - **Acceptance:** reruns are idempotent; renamed duplicate content shares one artifact identity; unreadable/unsupported items become explicit quarantine rows; manifest contains no absolute host path.
  - **QA happy:** run twice on a synthetic corpus and compare manifests (`.../T12/idempotent.sha256`).
  - **QA failure:** symlink loop, permission error and mid-run interruption resume safely (`.../T12/inventory-failures.txt`).
  - **Commit:** `feat(corpus): inventory ceremonial archive by content hash`.

- [x] 13. Add a sandboxed local extraction/OCR pipeline with explicit coverage — **DONE**
  - **Delivered:** `compose.ingest.yml`, a standalone Compose project with `network_mode: none`,
    read-only rootfs, uid 1000, `cap_drop: ALL`, `no-new-privileges`, bounded cpu/memory/pids
    and a `noexec` tmpfs; a pinned `ingest-runner` image carrying poppler 22.12.0,
    tesseract 5.3.0 (por+eng) and libarchive 3.6.2. Adapters for PDF text, OCR, plain text,
    RTF and OOXML/OpenDocument, plus a **`pdf-ocr` fallback** for scanned PDFs with no text
    layer. Every source is re-verified against the task-12 census (size + SHA-256) through a
    descriptor opened `O_NOFOLLOW`, and the adapter receives **that descriptor as stdin, never
    a path**, so there is no window for a name swap. `fstat` is compared again after the
    adapter runs. Derivatives are written to quarantine, re-read, re-hashed and only then
    renamed into a content-addressed private volume at mode 600, born
    `UNKNOWN`/`LOCAL_ONLY`/`CULTURALLY_SENSITIVE` — the schema refuses any other classification.
  - **Audio is declared, not attempted.** 539 of 801 files are recorded chant. They get
    `NO_ADAPTER` + `AUDIO_NOT_TRANSCRIBED`: no deterministic local ASR exists, the plan bans
    external models, and transcribing sacred song is a cultural decision nobody has taken.
    Coverage is reported over every census row, so the honest ratio is visible rather than
    flattered by counting only what was attempted.
  - **Supply chain:** `npm run ceremonial:scan` builds the image, writes a CycloneDX SBOM and a
    pinned Trivy 0.74.0 report, then applies a policy that lives in code
    (`vulnerability-policy.ts`) with an injected clock: Critical/High block with no exception
    form, Medium needs an owner, a real remediation and a ≤30-day expiry, and an expired
    exception turns back into a blocker. **The gate currently blocks — see "Open blocker".**
  - **Adversarial, executed not simulated:** a 200 MiB zip bomb ends `OUTPUT_TOO_LARGE`
    (refused, never truncated); a corrupt PDF ends `ADAPTER_FAILED`; a same-size byte swap
    ends `SOURCE_HASH_MISMATCH`; a symlink to `/etc/hostname` ends `SOURCE_NOT_REGULAR_FILE`
    with no outside byte reaching any output.
  - **Five real defects found only by running it** (all fixed, all with regression tests) —
    see `.../T13/extraction-adversarial.txt`. The worst: an unwritable volume was reported as
    `OUTPUT_INVALID` per row, making a misconfigured mount indistinguishable from a corrupt
    archive across 801 files. Storage failure now aborts loudly instead.
  - **Declared deviation:** no hand-authored seccomp profile ships. The container runs under
    Docker's default seccomp allowlist (not disabled), reinforced by `network_mode: none` and
    `cap_drop: ALL`. Rationale in `docs/ceremonial-ingest.md`.
  - **Implement:** create a pinned local-only ingest container/profile with read-only root/archive, non-root UID, capabilities dropped, no network, seccomp allowlist, bounded CPU/memory/time/tmpfs. Reopen every inventoried source descriptor-relative with no-follow, verify regular-file type, before/after `fstat`, size and SHA-256 against Task 12, and quarantine any changed/mismatched source. Add deterministic extraction/OCR adapters; disable active behavior and treat metadata/output as sensitive. Derivatives stay quarantined until schema/MIME/size/integrity validation, then enter a rebuildable private volume. Generate SBOM/license inventory and scan npm, OS packages, extraction binaries and container with pinned Trivy; Critical/High block, Medium requires documented owner, remediation and ≤30-day expiry.
  - **References:** `Dockerfile`; `compose.yml:3-161`; `compose.dev.yml`; prior extraction metrics in `docs/research/orixa-method-v2/report-source.md`.
  - **Acceptance:** every artifact has explicit state/reason; TOCTOU/mismatch quarantines; SBOM is complete; no unexpired Critical/High and every Medium exception is scoped/time-bounded; no silent omission.
  - **QA happy:** fixture matrix produces expected normalized text/page counts; task 13 will persist a sanitized JSON extraction manifest in its evidence directory.
  - **QA failure:** corrupt/bomb/oversized file is quarantined within limits and cannot reach app runtime (`.../T13/extraction-adversarial.txt`).
  - **Commit:** `feat(corpus): add sandboxed extraction pipeline`.

- [x] 14. Import works, editions, artifacts and locators without collapsing variants — **DONE**
  - **Delivered:** a pure planner (`src/domain/ceremonial/import.ts`) that maps extraction
    rows into work → edition → artifact → locator, a transactional idempotent store, the
    migration `20260826130000_ceremonial_import_reviews`, and `npm run ceremonial:import`
    which reports by default and writes only with `--apply`.
  - **The rule:** a filename is a hint, never an identity. Without an operator mapping every
    artifact opens four queue items — title, author, edition, language — and stays
    unpublishable. Only a `--mappings` file written by a person, carrying an evidence note,
    establishes identity.
  - **Publication gate:** the invariant lives in task 9's access policy rather than the query
    layer, as a new `unresolvedImport` input denying **every** facet including `metadata`.
    Granting rights over "lemegeton.pdf" grants them over nothing anyone identified. The
    field defaults to false, so every pre-existing caller still compiles and still fails
    closed.
  - **Variants stay distinct:** compilation and source text are different editions;
    two translations are different editions of one work; byte-identical duplicates converge
    on one artifact instead of forking the lineage.
  - **Real archive:** 729 unique artifacts, 145 imported with citable text into 139 works,
    139 editions and 18.196 page locators, 1.201 queue items open and **zero resolved** —
    the honest state of an uncatalogued corpus. A second run created nothing.
  - **Verified against PostgreSQL 18, not mocks:** unique constraints, the resolution CHECK,
    upsert idempotency, rename-follows-bytes, and transactional rollback of a whole failed
    plan. Evidence: `.../T14/import-lineage-and-conflicts.txt`.
  - **Two defects found only by running it:** an invented `WHOLE_ARTIFACT` locator kind the
    task-8 CHECK rightly refused (fixed by not inventing, not by widening the CHECK), and a
    transaction exhausted by inserting 18.196 locators one at a time (fixed with batched
    `createMany`, not merely a longer timeout).
  - **Implement:** map extracted artifacts into work→edition→artifact→locator records; use review queues for ambiguous title/author/edition/language; never infer canonical identity from filename alone. Seed dedicated system IDs and keep compilations/translations as distinct editions.
  - **References:** planned task-8 schema; `docs/knowledge/sources.md:24-83`; `docs/cultural-content-operations.md`; `src/lib/editorial/contracts.ts`.
  - **Acceptance:** each imported claimable unit has artifact hash and locator; duplicate binaries do not duplicate editions; ambiguous matches remain unresolved and unusable by public publication.
  - **QA happy:** representative Angelical/Goetic/Olympic fixtures import with exact lineage; task 14 will persist sanitized import-fixture JSON evidence.
  - **QA failure:** conflicting metadata creates a review item, not an overwrite; task 14 will persist sanitized conflict JSON evidence.
  - **Commit:** `feat(corpus): import source lineage and locators`.

- [ ] 15. Classify rights, sensitivity and editorial eligibility per edition/artifact
  - **Implement:** add reviewer workflow and audit trail for rights evidence, license terms, public-domain jurisdiction/date, restricted knowledge and per-facet eligibility. Default imports to `UNKNOWN + LOCAL_ONLY`; require independent rights and editorial approvals. Implement emergency takedown: revoke approval, invalidate bundle/version, atomically replace public DB/storage, purge Redis/CDN/media caches and search indexes, and record completion/failed purge targets.
  - **References:** `src/lib/editorial/workflow.ts:11-126`; `prisma/schema.prisma` cultural review models; `docs/cultural-content-operations.md`; task-9 policy.
  - **Acceptance:** no importer can self-publish; rights approval and editorial approval are separate; structured approval scope/reviewer/date/expiry/revocation and evidence locator are mandatory; rights/sensitivity changes are versioned and invalidate affected bundles, indexes and caches.
  - **QA happy:** reviewer promotes a public-domain fixture through draft→review→approved (`.../T15/review-happy.txt`).
  - **QA failure:** self-review, missing evidence and withdrawn rights block bundle generation (`.../T15/review-rejections.txt`).
  - **Commit:** `feat(corpus): govern rights and sensitivity review`.

- [ ] 16. Provide local full-text discovery and corpus integrity reporting
  - **Implement:** use Node 24 `node:sqlite` FTS5 in the rebuildable private derivative volume—not PostgreSQL—for local extracted chunks, joined to artifact/locator IDs through validated metadata and mode-policy filters; no embeddings/external model. Public search uses only its imported reviewed bundle DB. Add corpus dashboard/report for counts, duplicates, extraction coverage, unresolved metadata, rights/sensitivity and stale derivatives.
  - **References:** Node 24 `node:sqlite` documentation; `docs/data-inventory.md`; `src/components/cultural-content/cultural-archive.tsx:55-94`; task-12/13 manifests.
  - **Acceptance:** search result always points to source+edition+locator; public mode searches only bundle records; report totals reconcile to inventory or explicitly explain quarantines.
  - **QA happy:** known fixture phrase returns the correct page/edition; task 16 will persist a sanitized successful-search JSON receipt.
  - **QA failure:** protected local phrase returns zero through public query helpers; task 16 will persist a sanitized public-denial JSON receipt.
  - **Commit:** `feat(corpus): add local search and integrity reports`.

### Wave 4 — Build deterministic ceremonial domain contracts

- [ ] 17. Extract planetary day/hour calculation into a neutral astrology domain
  - **Implement:** move generic Chaldean day/hour, observed-solar intervals, interval progress and polar fallback into `src/domain/astrology/planetary-hours/`; keep a backward-compatible Orixá adapter and preserve outputs/version behavior unless intentionally version-bumped with changelog.
  - **References:** `src/domain/orixas/regency/temporal.ts:1-200`; `temporal.test.ts`; `src/domain/astrology/lunar.ts`; `AGENTS.md:domain rules`.
  - **Acceptance:** pure deterministic API accepts explicit instant/location/fallback; no React/Next/network/clock; old golden fixtures remain equal through adapter.
  - **QA happy:** golden tests across day/night and hemispheres (`.../T17/planetary-hours.txt`).
  - **QA failure:** polar strict mode returns typed unavailable while proxy mode labels uncertainty (`.../T17/polar-cases.txt`).
  - **Commit:** `refactor(astrology): extract neutral planetary hours`.

- [ ] 18. Define versioned election profiles instead of a universal score
  - **Implement:** create strict contracts for named source-bound rule profiles, required/forbidden/preferred conditions, uncertainty, conflict and provenance locator; evaluator returns matched/conflicted/unavailable observations, never “guaranteed success.” Inject time and use existing lunar/transit/annual event calculations.
  - **References:** `src/domain/astrology/lunar.ts:51-153`; `src/domain/astrology/transits/index.ts:39-123`; `src/domain/astrology/annual-calendar.ts`; task-17 timing.
  - **Acceptance:** Heptameron/Agrippa/Arbatel/Ars Paulina profiles remain distinct; conflicting profiles are shown side-by-side; every output includes engine/profile/source versions and limitations.
  - **QA happy:** TDD golden election fixture per profile, with sanitized JSON evidence generated by task 18.
  - **QA failure:** missing coordinates/time/source rule returns typed unavailable, not a guessed time, with a sanitized JSON receipt generated by task 18.
  - **Commit:** `feat(ceremonial): add source-bound election profiles`.

- [ ] 19. Create strict source-bound entity, correspondence and variant contracts
  - **Implement:** add schemas that distinguish `workspaceKind` from `sourceSystemId`, plus entity kinds, names/aliases, rank/office, correspondences, seals/media and cross-references. Every relation states source edition+locator and type; aliases never merge entities across source systems, including systems grouped in one workspace.
  - **References:** `src/domain/orixas/regency/contracts.ts`; `questionnaire-matrix.ts`; task-8 schema; `docs/knowledge/sources.md`.
  - **Acceptance:** IDs are branded/stable; exhaustive workspace discriminants coexist with open, validated source-system IDs; unknown workspace/system/variant combinations reject at boundaries.
  - **QA happy:** parse representative fixture from each system (`.../T19/contracts-happy.txt`).
  - **QA failure:** cross-system alias/locatorless correspondence is rejected (`.../T19/contracts-rejections.txt`).
  - **Commit:** `feat(ceremonial): define source-bound entity contracts`.

- [ ] 20. Separate archival source access from safe actionable guidance
  - **Implement:** create pure policy for goal categories and generated/checklist content. Local mode may display archival source text with provenance/warnings, but planner APIs must refuse coercion, violence, self-harm, sacrifice, illegality, medical/financial promises and targeting non-consenting people. Return typed refusal/help categories; do not modify or censor source artifacts.
  - **References:** approved draft safety decisions; `src/lib/orixas/contracts.ts` disclaimer patterns; `docs/analytics-privacy.md`; `AGENTS.md:product identity/security`.
  - **Acceptance:** policy applies to planner creation/update/export, not only UI copy; raw source view and generated guidance have visibly different contracts.
  - **QA happy:** benign study/planning goals produce bounded checklists (`.../T20/safety-happy.txt`).
  - **QA failure:** adversarial harmful/coercive variants consistently refuse without echoing instructions (`.../T20/safety-redteam.txt`).
  - **Commit:** `feat(ceremonial): enforce safe planning policy`.

- [ ] 21. Freeze domain versions, cross-source conflict behavior and coverage
  - **Implement:** add golden datasets for planetary timing, elections, source variants, policy and all five system discriminants; create coverage reports showing source/edition/entity/correspondence/timing completeness without treating duplicate editions as independent consensus.
  - **References:** `src/domain/orixas/regency/dataset-freeze.test.ts`; `evidence-graph.test.ts`; `robustness.test.ts`; tasks 17-20.
  - **Acceptance:** same snapshots are deterministic; changing any output requires explicit version bump and `ANTES/DEPOIS/MOTIVO/IMPACTO`; new pure code maintains ≥80% coverage.
  - **QA happy:** targeted domain suite and snapshot hash pass (`.../T21/domain-freeze.txt`).
  - **QA failure:** duplicate-source and conflicting-rule fixtures remain observable and never silently reconcile; task 21 will persist the sanitized conflict report as JSON evidence.
  - **Commit:** `test(ceremonial): freeze domain and conflict behavior`.

### Wave 5 — Implement separate tradition workspaces

- [ ] 22. Implement the Angelical adapters and catalog
  - **Implement:** create one distinct `sourceSystemId` and adapter for Heptameron, Ars Paulina, Dee/Enochian and every explicitly named Shem-derived modern school; group them only under `workspaceKind=ANGELICAL`. Model hierarchies, names, offices, seals and timing per edition without a universal angel hierarchy. Ingest only locator-backed records.
  - **References:** `/mnt/e/Ocultismo/Angelical e olimpicos`; `/mnt/e/Ocultismo/Magia Angelical e Olimpicos`; `docs/knowledge/sources.md`; tasks 14, 18, 19.
  - **Acceptance:** UI/API can filter by system/edition; variants and conflicts remain visible; public projection follows rights policy.
  - **QA happy:** fixture per Angelical system renders source-specific record/timing; task 22 will persist sanitized Angelical JSON evidence.
  - **QA failure:** a name shared across systems remains separate and locatorless data is quarantined; task 22 will persist a sanitized conflict report.
  - **Commit:** `feat(ceremonial): add source-specific angelical workspace`.

- [ ] 23. Implement Ars Goetia as its own source family
  - **Implement:** model 72-spirit records by manuscript/edition with rank, office, seal variants, correspondences and source locators; keep archival descriptions distinct from safe planner guidance and do not convert coercive source language into recommendations.
  - **References:** `/mnt/e/Ocultismo`; `docs/knowledge/sources.md`; tasks 14, 19, 20.
  - **Acceptance:** variant seals/offices can coexist; entity count is evidence-derived, not hardcoded as universal; no Theurgia record appears in Ars Goetia queries.
  - **QA happy:** representative multi-edition spirit fixture preserves both variants, recorded as sanitized task-23 JSON evidence.
  - **QA failure:** harmful planner goal refuses while archival source remains provenance-visible locally (`.../T23/goetia-safety.txt`).
  - **Commit:** `feat(ceremonial): add ars goetia workspace`.

- [ ] 24. Implement Ars Theurgia-Goetia separately from Ars Goetia
  - **Implement:** add directional/aerial hierarchy, ranks, offices, seals and timing using Theurgia-specific adapters and routes; prohibit inheritance from Ars Goetia schemas except shared generic provenance/media primitives.
  - **References:** Lemegeton separation in `docs/knowledge/sources.md`; `/mnt/e/Ocultismo`; task-19 contracts.
  - **Acceptance:** system discriminator is mandatory in storage/query/URL; Goetia/Theurgia entities cannot merge through aliases or import heuristics.
  - **QA happy:** Theurgia fixture returns only its source family, recorded as sanitized task-24 JSON evidence.
  - **QA failure:** cross-book import/query is rejected by schema and DB constraints (`.../T24/book-separation.txt`).
  - **Commit:** `feat(ceremonial): add theurgia-goetia workspace`.

- [ ] 25. Implement Olympic-spirit records from Arbatel variants
  - **Implement:** model Olympic spirits, planetary links, offices, seals and aphorism/edition locators; preserve 1575 witness and later translation differences; use an Arbatel timing profile rather than generic planetary recommendations.
  - **References:** `/mnt/e/Ocultismo/Angelical e olimpicos`; `docs/knowledge/sources.md`; task-18 election profiles.
  - **Acceptance:** seven-spirit catalog is source-versioned; translation differences remain edition-scoped; no aliasing to planetary intelligences or angels.
  - **QA happy:** multi-edition Olympic fixture retains locators/timing, recorded as sanitized task-25 JSON evidence.
  - **QA failure:** editionless seal/timing is rejected (`.../T25/olympic-rejections.txt`).
  - **Commit:** `feat(ceremonial): add olympic spirits workspace`.

- [ ] 26. Implement planetary intelligences and spirits as distinct entity classes
  - **Implement:** model Agrippan planetary intelligences/spirits, tables/seals and correspondences with edition locators; link through planet IDs and timing profiles while explicitly preventing identity equivalence with Olympic spirits, angels, demons or Orixás.
  - **References:** Agrippa sources in `docs/knowledge/sources.md`; `/mnt/e/Ocultismo`; `src/domain/astrology` body IDs; tasks 18-19.
  - **Acceptance:** shared planet relation is navigable but does not merge entities; public/local source projections obey rights policy.
  - **QA happy:** Saturn fixture shows linked but separate entities, recorded as sanitized task-26 JSON evidence.
  - **QA failure:** attempted cross-class alias merge fails (`.../T26/planetary-separation.txt`).
  - **Commit:** `feat(ceremonial): add planetary intelligence workspace`.

- [ ] 27. Add cross-workspace ontology and leak regression suite
  - **Implement:** generate a deterministic report over all imported records proving unique IDs, valid locators, system separation, explicit cross-relation types, rights/access consistency and complete public filtering; include known confusing-name fixtures.
  - **References:** tasks 22-26; `src/domain/orixas/regency/correspondence-generation.test.ts`; task-11 bundle.
  - **Acceptance:** every entity belongs to exactly one primary system; every cross-system edge is explicit and sourced; public bundle contains no local-only body/media.
  - **QA happy:** ontology report passes representative complete fixtures and task 27 persists the sanitized JSON report.
  - **QA failure:** deliberate alias, missing locator and local-body leak each fail with precise reason (`.../T27/ontology-adversarial.txt`).
  - **Commit:** `test(ceremonial): enforce tradition separation`.

### Wave 6 — Deliver the dual-mode product experience

- [ ] 28. Add a route-based Ceremonial Laboratory shell and module registry
  - **Implement:** create a policy-filtered public `/laboratorio-cerimonial` library for bundle-eligible hybrid content plus authenticated `/conta/laboratorio-cerimonial` planner/local-reader routes and a typed server-side registry for the five workspaces; do not add branches to the 723-line `ProfileArchive`. In `disabled` mode return 404; public mode never exposes local reader/planner; local mode requires authenticated adult account and is excluded from youth/guest surfaces.
  - **References:** `src/components/account/profile-archive.tsx`; `src/app/conta/page.tsx`; `src/app/sitemap.ts`; `src/app/robots.ts:5-13`; Next.js App Router docs in `node_modules/next/dist/docs/`.
  - **Acceptance:** account/local routes are disallowed to crawlers and absent from sitemap; public library enters sitemap only in public mode with an eligible bundle; all routes are keyboard navigable and preserve existing account navigation.
  - **QA happy:** route/component tests for local and public module registry (`.../T28/shell.txt`).
  - **QA failure:** disabled/unauthenticated/local-only-public access returns 404/401 without metadata (`.../T28/shell-deny.txt`).
  - **Commit:** `feat(ceremonial): add laboratory route shell`.

- [ ] 29. Build catalog, source reader and provenance views
  - **Implement:** add system-scoped catalog/search/detail/source-reader components; local mode may render full extracted source/media through task-10 route, public mode renders reviewed full or metadata-only projections. Always show system, work, edition, locator, rights/sensitivity and uncertainty.
  - **References:** `src/components/cultural-content/cultural-archive.tsx:42-165`; `src/lib/cultural-content/public-entry.ts`; tasks 9-16, 22-27.
  - **Acceptance:** no unsafe HTML; layout stable for missing media/metadata; source text cannot enter URL, logs or client cache persistence.
  - **QA happy:** component tests cover local full/public full/public metadata cards (`.../T29/catalog.txt`).
  - **QA failure:** protected fixture in public mode shows metadata only and media route denies (`.../T29/catalog-deny.txt`).
  - **Commit:** `feat(ceremonial): add provenance-first catalog views`.

- [ ] 30. Build deterministic timing and election-planning views
  - **Implement:** add location/time input with uncertainty, planetary day/hour timeline, lunar/transit context and side-by-side named election-profile observations; display unavailable/conflict states and source locators, never a universal success score.
  - **References:** existing `LunarIntelligencePanel`; `src/domain/astrology/lunar.ts`; tasks 17-18; `AGENTS.md:UI/UX`.
  - **Acceptance:** explicit timezone/coordinates/instant flow through validated API; polar fallback is visible; results include engine/profile versions.
  - **QA happy:** deterministic fixed-location/instant UI fixture (`.../T30/election-view.png`).
  - **QA failure:** unknown location/time and conflicting profiles render bounded explanations (`.../T30/election-unavailable.png`).
  - **Commit:** `feat(ceremonial): add transparent timing workspace`.

- [ ] 31. Add encrypted private plans and session journals
  - **Implement:** use Node `crypto` AES-256-GCM with a versioned keyring file containing exactly one active 32-byte key plus retained retired keys needed for reads. Envelope `{schemaVersion,keyVersion,iv,tag,ciphertext}` uses unique 96-bit IVs and AAD binding `{userId,recordId,fieldName,schemaVersion,keyVersion}`. Encrypt intention, titles, entity selections, schedule/link metadata, checklist notes, observations and outcomes unless a field is explicitly documented non-sensitive. Implement resumable rotation to a new active key with transaction/checkpoint/rollback; retired-key removal is blocked until zero envelopes reference it.
  - **References:** task-8 plan/session models; `src/app/api/profiles/[profileId]/journal/route.ts`; `src/lib/config/read-secret.ts`; account ownership patterns.
  - **Acceptance:** strict keyring/key-length/version validation; DB/log/cache snapshots never contain plaintext practice metadata; public mode has no keyring; wrong/missing/retired keys fail typed without row corruption.
  - **QA happy:** create/read/update/rotate deterministic fixture with random production IVs (`.../T31/encryption.txt`).
  - **QA failure:** tampered tag, missing key and public mode deny safely (`.../T31/encryption-adversarial.txt`).
  - **Commit:** `feat(ceremonial): encrypt private ritual records`.

- [ ] 32. Complete owner-scoped APIs, local export and deletion lifecycle
  - **Implement:** add Zod-bounded same-origin APIs for catalog/search/timing/plans/sessions; owner-scoped CRUD and idempotency for writes; mark local source, planner, RSC and export routes dynamic/no-store; local export includes decrypted user records only after explicit authenticated action and source references rather than protected binaries. Delete selectively/cascade, purge caches, and use cache keys containing mode+policy+versions; location/user-derived components are omitted or represented only by a scoped HMAC using an injected secret.
  - **References:** profile/journal route patterns; `src/app/api/auth/export/route.ts`; `src/lib/security/headers.ts`; tasks 9-10, 20, 31.
  - **Acceptance:** public DTO schemas cannot express local path/body; rate limits are fail-closed; cache keys contain mode+policy+versions; Redis corruption becomes observed miss.
  - **QA happy:** API integration tests cover CRUD/export/delete for owner (`.../T32/api-happy.txt`).
  - **QA failure:** non-owner, CSRF, oversized, replay, Redis failure and public corpus export all deny (`.../T32/api-adversarial.txt`).
  - **Commit:** `feat(ceremonial): add private lifecycle APIs`.

- [ ] 33. Complete accessibility, responsive, reduced-motion and real-use QA
  - **Implement:** add Playwright journeys for each workspace on mobile/desktop, keyboard-only, error/empty/unknown states, local source reading, public metadata restriction, timing, encrypted planner, export and delete. Use synthetic-only corpus/private fixtures; disable response-body capture or sanitize traces/screenshots, then sentinel-scan evidence. Keep premium “Observatório Ritual” hierarchy, one insight per moment and no generic effect catalog.
  - **References:** `e2e/`; `src/components/account/product-modules.test.tsx`; `docs/design-references.md`; `AGENTS.md:UI/UX`.
  - **Acceptance:** WCAG 2.1 AA contrast/focus/semantics; no clipping at 320px/tablet/desktop; reduced motion honored; no console/network errors or layout shift from media states.
  - **QA happy:** Playwright traces/screenshots for local and public journeys (`.../T33/happy/`).
  - **QA failure:** denied content, corrupt media, offline API and unknown timing states remain usable (`.../T33/failure/`).
  - **Commit:** `test(ceremonial): cover accessible dual-mode journeys`.

### Wave 7 — Operations, isolation and release readiness

- [ ] 34. Verify and harden the physically split public/local runtimes
  - **Implement:** audit the task-7 split: public and local use separate PostgreSQL, Redis, storage, credentials and named volumes; keep `compose.yml` public-safe with no archive/key/derivative mount; local override mounts `/mnt/e/Ocultismo` read-only plus private derivative volume and ingest service. Pin images, non-root users, no-new-privileges, internal networks and healthchecks. Dockerfile public stages never `COPY` corpus/derivatives; process mode is immutable after startup.
  - **References:** `compose.yml:3-161`; `compose.dev.yml`; `Dockerfile`; `.dockerignore`; `docs/deployment-runbook.md`.
  - **Acceptance:** public config has no local path/key/ingest service; local config has no public bind by default beyond loopback; both configs validate and become healthy.
  - **QA happy:** render/start both Compose combinations and save redacted configs (`.../T34/compose/`).
  - **QA failure:** scan public image layers/filesystem for archive markers and fail on any match (`.../T34/image-leak-scan.txt`).
  - **Commit:** `ops(ceremonial): isolate public and local runtimes`.

- [ ] 35. Extend backup, restore and key-rotation runbooks without duplicating source corpus
  - **Implement:** back up PostgreSQL metadata/encrypted records and derivative manifest with checksums; exclude rebuildable derivative/SQLite FTS and archive files. Retain encrypted backups for 30 days. Write deletion tombstones to a separately protected, append-only ledger retained 37 days; every restore replays and verifies all tombstones before app/readiness access, then rebuilds derivatives/search. Document encrypted keyring backup and rotation/revocation separately.
  - **References:** `scripts/backup-postgres.sh`; `scripts/verify-postgres-restore.sh`; `docs/backup-restore.md`; task-12 manifest; task-31 encryption.
  - **Acceptance:** restored app stays unready until deletion-ledger replay succeeds; deleted plans/sessions/feedback cannot reappear from any retained backup; backup/tombstone expiry is enforced; public backup has no corpus/derivative/keyring; no `down -v`.
  - **QA happy:** automated isolated backup/restore rehearsal (`.../T35/restore.txt`).
  - **QA failure:** wrong key or changed archive produces explicit degraded state, not data loss (`.../T35/restore-mismatch.txt`).
  - **Commit:** `ops(ceremonial): add private-data restore procedure`.

- [ ] 36. Add privacy-safe observability and SLOs for both modes
  - **Implement:** instrument counts/durations/status categories only for ingest, policy denies, extraction failures, timing and APIs; update Pino redaction tests for archive paths, source text, ritual notes and encrypted envelopes. Define initial beta SLOs (99.5% monthly availability for public routes, p95 API <2s excluding ingestion, <1% 5xx) and provider-neutral Alertmanager webhook configuration.
  - **References:** `docs/performance-observability.md`; `compose.quality.yml`; `compose.yml:111-146`; central logger/redaction tests; `docs/IMPLEMENTATION_STATUS.md:264-269`.
  - **Acceptance:** no sensitive label/high-cardinality IDs; alert payloads contain service/route category only; local ingestion alerts remain local unless explicitly configured.
  - **QA happy:** observability smoke triggers sanitized synthetic alert (`.../T36/observability.txt`).
  - **QA failure:** canary secrets/path/snippet never appear in logs/metrics/alerts (`.../T36/redaction-scan.txt`).
  - **Commit:** `ops(ceremonial): add safe metrics and beta SLOs`.

- [ ] 37. Add adversarial public-isolation and release-smoke gates
  - **Implement:** seed restricted sentinel `ASTROAXE_LOCAL_ONLY_7F3C91` and publishable sentinel `ASTROAXE_PUBLIC_OK_42A8D0` across work/text/media/path/plan/cache fixtures; run public APIs, pages, RSC/static responses, sitemap, robots, JSON-LD, search, exports, logs, source maps, `.next`, public directory and standalone image/layers; assert zero restricted occurrences and publishable occurrence only in its approved response. Prime local cache first, then switch to public fixture to prove mode-separated keys. Add this to `scripts/release-smoke.sh` and quality documentation without using real protected strings.
  - **References:** `scripts/release-smoke.sh`; `src/app/sitemap.ts`; `src/app/robots.ts`; `src/app/api/auth/export/route.ts`; task-11 bundle; task-34 images.
  - **Acceptance:** gate fails on any local canary or internal rule/weight marker; test proves the scanner itself detects an intentionally contaminated fixture.
  - **QA happy:** clean public build passes with report (`.../T37/release-leak-gate.txt`).
  - **QA failure:** contaminated bundle/build is rejected (`.../T37/contamination-proof.txt`).
  - **Commit:** `test(release): block local corpus leakage`.

- [ ] 38. Reconcile privacy, rights, safety and operating documentation
  - **Implement:** update privacy page, data inventory, cultural operations, knowledge sources, deployment, backup, quality, changelog, implementation status and project memory. Explain dual modes, local full/public hybrid, lawful publication criteria, sensitive-belief/private-record handling, retention/withdrawal status, no external LLM/analytics, safety boundaries and observed—not claimed—validation.
  - **References:** `src/app/privacidade/page.tsx`; `docs/data-inventory.md`; `docs/cultural-content-operations.md`; `docs/knowledge/sources.md`; `docs/IMPLEMENTATION_STATUS.md`; `docs/PROJECT_MEMORY.md`.
  - **Acceptance:** public copy never implies local material is licensed; controller/legal/provider items remain explicit blockers until supplied; docs match actual routes/models/migrations/counts.
  - **QA happy:** link/content/release smoke and doc consistency checklist (`.../T38/docs.txt`).
  - **QA failure:** grep-based contradiction fixtures plus code-backed assertions catch “not persisted”/“publicly available” drift (`.../T38/docs-drift.txt`).
  - **Commit:** `docs(ceremonial): document dual-mode governance`.

- [ ] 39. Run the complete checkpoint and publish the remaining external-dependency roadmap
  - **Implement:** run migration deploy on isolated staging, tests, coverage, build, E2E, performance, observability, release smoke, restore and Sonar. Both public activation and the local sensitive planner/session feature remain blocked until structured, non-revoked approvals exist for sensitive-data governance, legal basis/30-day backup retention/37-day tombstones and adult-access enforcement; public activation additionally requires rights/legal review and exact bundle approval. Read-only local archival access may remain separate behind its own access/safety gate. Keep external SMTP/domain/TLS/secret-manager/analytics/Stripe and Orixá calibration explicitly unclaimed.
  - **References:** `package.json:13-40`; `docs/quality-tooling.md`; `docs/deployment-runbook.md`; `docs/IMPLEMENTATION_STATUS.md:257-326`; `AGENTS.md:completion criteria`.
  - **Acceptance:** zero new bugs/vulnerabilities, hotspots reviewed, new-code coverage ≥80%, duplication ≤3%, all isolation checks pass; release command machine-validates approval type/scope/reviewer-role/date/coverage/review-or-expiry/revocation without pretending to validate legal correctness; any missing/revoked approval blocks activation.
  - **QA happy:** archive all sanitized gate receipts under `.../T39/` and update dated memory.
  - **QA failure:** deliberately failing isolation/restore test blocks completion and leaves rollback/roll-forward instructions (`.../T39/blocking-proof.txt`).
  - **Commit:** `chore(release): verify AstroAxe dual-mode readiness`.

## Final verification wave

- [ ] F1. Plan-compliance audit
  - Verify every task, dependency, Must-NOT-Have and evidence path against the executed diff; reject missing todos, changed scope, edited applied migrations or undocumented deviations. Evidence: `.../F1/compliance.md`.

- [ ] F2. Code-quality, security and privacy review
  - Independently review strict types, Zod boundaries, DB constraints, encryption, ownership, CSRF/body limits, logging/redaction, cache/versioning, rights policy and public/local isolation; run security/performance advisors and relevant static analysis. Evidence: `.../F2/review.md`.

- [ ] F3. Real-use functional and visual QA
  - Run the authenticated Tríade journey and all five ceremonial workspaces in local/public modes on mobile and desktop using synthetic-only corpus/private fixtures; capture sanitized/body-free screenshots/traces, keyboard/focus/reduced-motion checks, source-reader/media/timing/planner/export/delete behavior and failures. Evidence: `.../F3/`.

- [ ] F4. Scope-fidelity and adversarial release audit
  - Seed local-only canaries and prove no public response, export, cache, SEO file, bundle, `.next` artifact or image layer contains them; scan `.omo/evidence` for private/protected sentinels; verify traditions remain separate and harmful/coercive planner goals refuse. Evidence: `.../F4/adversarial.md`.

## Commit strategy

- One atomic Conventional Commit per todo using the declared Commit line; never bundle unrelated pre-existing work.
- Schema and its additive migration commit together; generated Prisma client follows repository policy and is never hand-edited.
- Do not commit `/mnt/e/Ocultismo`, extracted derivatives, private manifests containing local metadata, keys, backups, Playwright secrets or evidence containing source text/PII.
- PR delivery, branch creation, push and merge happen only when the user explicitly invokes `$start-work --make-pr`/`--ship`; otherwise the worker leaves reviewed local commits.

## Success criteria

- Tríade v3 is consent-correct, withdrawable, version-complete, benchmark-ready and covered from domain to authenticated E2E.
- Local mode can inventory/search/read the complete technically extractable private corpus; every artifact has explicit extraction status and provenance.
- Published mode is hybrid-by-rights and demonstrably cannot expose local-only text, media, paths, records, private plans or keys even against a contaminated test database.
- Angelical, Ars Goetia, Ars Theurgia-Goetia, Olympic and planetary-intelligence systems remain source-bound and separate while sharing only neutral provenance/timing/planner infrastructure.
- Deterministic timing reports versions, conflicts and uncertainty without efficacy claims; unsafe planner goals fail closed.
- Private plans/sessions are encrypted, owner-scoped, exportable and deletable; logs/metrics/alerts remain free of PII, corpus text and ritual notes.
- All task QA, F1-F4, migration, build, E2E, release leak, restore and Sonar gates pass with sanitized evidence; documentation records any external production blockers honestly.
