---
slug: astroaxe-roadmap-ceremonial-laboratory
status: reviewing
intent: clear
review_required: true
plan_path: .omo/plans/astroaxe-roadmap-ceremonial-laboratory.md
plan_sha256: 1bce768237c8c80127e68f2f5d71327b7a58bb113863ffd4c22a0e932d3fc629
review_round_id: review-20260825-1bce7682-08
round_status: inconclusive
pending-action: review .omo/plans/astroaxe-roadmap-ceremonial-laboratory.md
review:
  momus:
    status: inconclusive
    workspace_root: /home/thalis/Projetos/orixas-mapa-astral
    runtime_home: null
    target: .omo/plans/astroaxe-roadmap-ceremonial-laboratory.md
    round_id: review-20260825-1bce7682-08
    plan_sha256: 1bce768237c8c80127e68f2f5d71327b7a58bb113863ffd4c22a0e932d3fc629
    launch_id: launch-momus-1bce7682-08
    session: ses_fc5eb469affedFk2NLExNs2ZdD
    result: cancelled_at_user_request_to_finalize_due_token_budget
  independent:
    status: inconclusive
    workspace_root: /home/thalis/Projetos/orixas-mapa-astral
    runtime_home: null
    target: .omo/plans/astroaxe-roadmap-ceremonial-laboratory.md
    round_id: review-20260825-1bce7682-08
    plan_sha256: 1bce768237c8c80127e68f2f5d71327b7a58bb113863ffd4c22a0e932d3fc629
    launch_id: launch-oracle-1bce7682-08
    session: ses_fc5eb4656ffeYQrAHsvJvqyDP2
    result: cancelled_at_user_request_to_finalize_due_token_budget
approach: Consolidate the verified current-state roadmap, then design one provenance-first Ceremonial Laboratory with deterministic celestial timing and distinct Angelical, Goetic, and Olympic/Planetary workspaces.
---

# Draft: astroaxe-roadmap-ceremonial-laboratory

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
| C1 | Consolidated, evidence-backed backlog for the existing AstroAxe product | active | docs/PROJECT_MEMORY.md; docs/IMPLEMENTATION_STATUS.md |
| C2 | Shared ceremonial knowledge, provenance, rights, variant, and safety foundation | active | docs/knowledge/sources.md; docs/cultural-content-operations.md; /mnt/e/Ocultismo |
| C3 | Deterministic celestial timing and electional-rule engine with uncertainty and variant profiles | active | src/domain/astrology; docs/knowledge/sources.md |
| C4 | Angelical ceremonial workspace with source-specific hierarchies, timing, preparation, and records | active | /mnt/e/Ocultismo/Angelical e olimpicos; /mnt/e/Ocultismo/Magia Angelical e Olimpicos |
| C5 | Goetic/Solomonic workspace with strict corpus separation, safety boundaries, timing, and records | active | /mnt/e/Ocultismo; docs/knowledge/sources.md |
| C6 | Olympic spirits and planetary intelligences workspace plus a shared ritual planner/journal | active | /mnt/e/Ocultismo; docs/knowledge/sources.md |
| C7 | Completed, privacy-correct and fully verified Tríade de Regências v3 baseline | active | src/app/api/profiles/[profileId]/regency/route.ts; prisma/schema.prisma |

## Open assumptions (announced defaults)
<!-- Intent is UNCLEAR: research resolves ambiguity, defaults are adopted (not asked), and each is surfaced in the plan's human TL;DR for veto. -->
<!-- assumption | adopted default | rationale | reversible? -->
| Product topology | One Ceremonial Laboratory with separate source-bound workspaces, not a single blended occult catalog | Prevents false equivalence and still enables shared timing/planning infrastructure | yes |
| Source policy | Dual presentation from one provenance registry: total locally available corpus coverage in private/local mode; hybrid-by-rights rendering in published mode | Owner clarified that the published site remains hybrid while the local site is complete | yes |
| Distribution boundary | Local mode may render the complete authorized local archive; published mode exposes full material only when public-domain/licensed and otherwise limits itself to metadata, provenance, locators, derived guidance and user-private notes | The two modes require fail-closed policy enforcement and separate build/deploy verification, not copy-only distinctions | yes |
| Computation boundary | Astronomy computes times/positions; traditional profiles interpret them; software never claims supernatural efficacy | Preserves auditability and avoids false authority | yes |
| Goetic safety posture | No coercive promises, harm-oriented goals, sacrifice, illegal acts, crisis escalation, or instructions presented as guaranteed outcomes | Safety-critical product boundary | yes, but any relaxation requires explicit owner decision and review |
| Delivery scope | Plan the complete architecture and implementation path; do not invent an MVP reduction | Required by the full-scope request and ulw-plan contract | yes |
| Audience | Adult-oriented module; exclude the Ceremonial Laboratory from child/youth surfaces | Existing product positioning targets adults and the content includes advanced ritual material | yes |
| Knowledge model | Source-family + work + edition + artifact + locator + variant + access level; never entity-name-only records | The archive contains compilations, translations, duplicates and conflicting attributions | yes |
| Timing profiles | Every traditional rule set is a named, versioned profile; no universal “best magical moment” score | Agrippa, Heptameron, Arbatel, Ars Paulina and modern planetary manuals are not identical systems | yes |
| Personal records | Keep intentions, checklists, observations and outcomes private, exportable and deletable; never train or infer belief profiles from them | Religious/philosophical data and journals are sensitive | yes |
| UI integration | Add a route-based Ceremonial Laboratory and module registry rather than more branches in `ProfileArchive` | `src/components/account/profile-archive.tsx` is already 723 lines and owns 15 account views | yes |
| Test strategy | TDD for pure domains/contracts/safety policies; tests-after for migrations, API wiring and UI, with Playwright real-use QA | Locks deterministic and safety-critical behavior before integration while keeping UI verification realistic | yes |

## Findings (cited - path:lines)

- The current product already separates calculated sky, editorial interpretation, and culturally governed correspondences (`docs/BLUEPRINT.md:11-30`).
- Existing ceremonial sources are explicitly reference-only and already require distinct treatment of Heptameron, Agrippa, Lemegeton, and manuscript variants (`docs/knowledge/sources.md:24-83`).
- The product has an advanced deterministic astrology, provenance, content governance, privacy, and Docker foundation, while revenue, hosted production, external alerting, real SMTP, and cultural calibration remain incomplete (`docs/IMPLEMENTATION_STATUS.md:8-19`, `docs/IMPLEMENTATION_STATUS.md:257-342`).
- The private archive is mounted at `/mnt/e/Ocultismo` and contains dedicated Angelical/Olympic directories plus broader ritual material; its contents still require a rights-aware, deduplicated inventory.
- The private corpus has a pre-existing audit: 801 files, 737 unique SHA-256 contents, 64 exact duplicates, 124 unique PDFs, page-level extraction for 123, and useful text for 121 (`docs/research/orixa-method-v2/report-source.md:22-43`).
- The archive includes direct Angelical/Olympic working sets and extracted text (`/mnt/e/Ocultismo/Angelical e olimpicos`, `/mnt/e/Ocultismo/Magia Angelical e Olimpicos`), but representative works are modern/copyrighted or compilatory, so they can guide taxonomy but not be republished by default (`_texto_magia_pratica_planetaria.txt:41-68`, `_texto_magia_angelical_72.txt:85-107`).
- The current code already calculates Chaldean planetary day/hour contexts, observed-solar intervals, and an explicit polar fallback policy (`src/domain/orixas/regency/temporal.ts:5-105`, `src/domain/orixas/regency/temporal.ts:108-195`). This should be extracted into a neutral astrology timing domain rather than reused through the Orixá namespace.
- Existing reusable astronomy includes natal envelopes and uncertainty (`src/domain/astrology/western/contracts.ts:5-77`), lunar phases/mansions/void-of-course (`src/domain/astrology/lunar.ts:7-85`), eclipses/stations (`src/domain/astrology/annual-calendar.ts:14-100`), transit snapshots/cache validation (`src/lib/transits/daily.ts:10-60`), returns and synastry.
- The app currently exposes 9 pages and 30 API route files, but no ceremonial route, API, persistence entity or source/variant model. Prisma has no ritual-plan, ritual-session, ceremonial-source, entity, seal/media-rights or election-profile models (`prisma/schema.prisma:10-322`).
- The authenticated product is concentrated in one client component with 15 view variants; it already exceeds the repository's 250-LOC module ceiling and should not absorb four more branch-heavy panels (`src/components/account/profile-archive.tsx:34-298`).
- The repo has 94 unit/component/API/E2E test files and 19 Prisma migrations. `docs/IMPLEMENTATION_STATUS.md` still lists 18 migrations, so its migration inventory is stale relative to `prisma/migrations/20260825160000_regency_feedback/`.
- Current Git state is `develop...origin/develop` with a large dirty working tree covering the v3 regency/privacy/module work plus untracked migration and questionnaire files. The future worker must preserve these changes and establish a clean baseline before ceremonial work.
- Existing product backlog remains material: external alerts/SLOs, real staging/Swarm rehearsal, external encrypted backups, legal/privacy completion, real SMTP/domain validation, pricing/Stripe, analytics contract, and Orixá calibration (`docs/IMPLEMENTATION_STATUS.md:257-326`). Ceremonial work must not be mislabeled as production readiness.
- Product-safety research supports hard refusal/escalation for self-harm, violence, illegal acts and coercion; consent-first targeting; sensitive-belief data minimization; community-consented handling of restricted knowledge; and one-tap reporting/help. These controls must be product logic, not disclaimer-only.
- Primary-source research confirms that Arbatel has a 1575 Basel witness and multiple later translations/variants; Lemegeton comprises distinct books and manuscript families; Agrippa's genuine three books and Picatrix require critical-edition awareness. Modern archive manuals are secondary interpretations, not canonical merges.
- The Tríade v3 calculation path is substantially wired: the authenticated POST validates a complete seven-answer questionnaire, derives astrological, numerological and self-report features, runs the composed server-only matrix/config/scorer plus robustness analysis, and returns only a strict reduced DTO (`src/app/api/profiles/[profileId]/regency/route.ts:38-64`, `src/app/api/profiles/[profileId]/regency/route.ts:132-173`, `src/lib/orixas/public-regency.ts:7-40`).
- The feedback path recomputes the prediction server-side, checks profile ownership and corrected Orixá IDs, and persists method/matrix/config/scorer/questionnaire versions with answers, prediction, verdict, correction basis and consent version (`src/app/api/profiles/[profileId]/regency/route.ts:67-130`, `src/app/api/profiles/[profileId]/regency/route.ts:176-196`, `prisma/schema.prisma:115-137`).
- The 27-candidate catalog and directed pair behavior have golden coverage, including Logunan, Egunitá, Oxumarê and the Ogum–Iansã law-pole regression (`src/domain/orixas/regency/matrix.test.ts:6-21`, `src/domain/orixas/regency/v2.golden.test.ts:18-54`).
- Consent is enforced at the API schema boundary, but the UI checkbox is not state-bound: the browser always serializes `consent: true` regardless of that checkbox's value. Native form validation normally blocks an unchecked submission, but there is no component regression proving the payload reflects an explicit checked state (`src/lib/orixas/regency-feedback.ts:17-42`, `src/components/account/orisa-research-lab.tsx:177-203`, `src/components/account/orisa-research-lab.tsx:296-303`).
- Documentation contains a privacy contradiction: the changelog and research report state questionnaire answers are not persisted, while consented feedback deliberately persists those same answers. The privacy page and earlier changelog entry describe the implemented behavior correctly (`docs/astrology-calculation-changelog.md:3-27`, `docs/research/orixa-triad-questionnaire/report-source.md:30-37`, `src/app/privacidade/page.tsx:35-38`).
- Account export includes feedback answers and user-facing calibration fields but omits the stored matrix, config and scorer versions, weakening user export completeness and reproducibility (`src/app/api/auth/export/route.ts:80-95`, `src/lib/auth/account-export.ts:62-79`, `prisma/schema.prisma:118-124`).
- Existing route tests cover public-projection secrecy, owner filtering, unauthenticated POST and one successful consented PUT, but do not exercise invalid/incomplete questionnaire, non-owner 404, wrong origin, wrong content type, unknown correction, consent/version rejection, persistence failure or exact persisted provenance (`src/app/api/profiles/[profileId]/regency/route.test.ts:20-81`).
- Existing component tests cover questionnaire-to-result success, uncertainty language and retry, but do not submit feedback or prove consent, payload, validation, saved/error states and accessibility behavior; no Tríade flow exists under `e2e/` (`src/components/account/product-modules.test.tsx:93-124`).
- The new table cascades on profile deletion and has the intended unique/index keys, but the migration lacks database CHECK constraints for verdict, confirmation basis and JSON object/shape invariants; no migration integration test exists (`prisma/migrations/20260825160000_regency_feedback/migration.sql:1-27`).
- The privacy page accurately discloses sensitive religious data, export and cascade deletion, while also acknowledging that legal basis and definitive retention remain production blockers. There is no dedicated single-feedback withdrawal/delete control; current revocation requires deleting the containing profile or account (`src/app/privacidade/page.tsx:70-111`).

## Tríade v3 completion matrix

| Surface | Verdict | Evidence | Required completion |
| --- | --- | --- | --- |
| Seven-question contract and feature extraction | complete | `src/domain/orixas/regency/questionnaire.ts`; `questionnaire.test.ts` | Add duplicate-ID/order/property regressions only as hardening. |
| 27-candidate catalog and questionnaire matrix | complete | `matrix.test.ts`; `v2.golden.test.ts`; `questionnaire-matrix.ts` | Freeze exact catalog/matrix/version contract in one v3 golden fixture. |
| Matrix/config/scorer/robustness wiring | complete | `v2-matrix.ts`; `v2-config.ts`; regency route `calculateRegency` | Add exact scorer/version assertions and benchmark comparison coverage. |
| Protected POST and reduced public DTO | partial | regency route `POST`; `public-regency.ts`; route test | Add same-origin policy, request-size guard and full failure/ownership tests. |
| Consented feedback PUT | partial | regency route `PUT`; `regency-feedback.ts` | Bind real UI consent state, expand invariants, test rejection paths and idempotent update. |
| Prisma model and migration | partial | `prisma/schema.prisma:115-137`; feedback migration | Preserve existing migration; add an additive hardening migration after checking migration status, with DB constraints and rollback/roll-forward evidence. |
| Account export and deletion | partial | auth export route/schema/test; cascade FK | Export all stored provenance versions and test cascade/deletion behavior; add targeted withdrawal if product/legal policy adopts it. |
| UI states and accessibility | partial | `orisa-research-lab.tsx`; `product-modules.test.tsx` | Test feedback success/error, checked consent payload, keyboard/focus, disabled duplicate submission, mobile/desktop and reduced motion. |
| Privacy/content documentation | partial | privacy page; changelog; questionnaire report; project memory | Reconcile the persistence claim, define consent withdrawal/retention status and update migration/test counts from observed state. |
| End-to-end and quality proof | missing | no Tríade match under `e2e/`; historical checkpoint predates uncommitted work | Add authenticated real-use E2E and run targeted tests, typecheck, lint, format, coverage, build, migration verification and Quality Gate. |

## Decisions (with rationale)

- Classify this as Architecture-scale and UNCLEAR: the desired strategic direction is clear, but the final module ontology and product contract must be derived from evidence rather than guessed.
- Require automatic dual high-accuracy review after approval because the plan will contain broad product, safety, source-governance, domain, persistence, and UX decisions.
- Keep Angelical, Goetic, and Olympic/Planetary traditions separate at the knowledge and presentation layers while sharing deterministic timing, location, profile, planner, journal, provenance, and accessibility infrastructure.
- Treat the shared product as six layers: source registry; celestial timing; tradition profiles; entity/catalog views; private operation planner/session log; safety and governance.
- Model source lineage before entity catalogs so names, seals, ranks, offices, correspondences and timing rules can vary by manuscript/edition without silent overwrite.
- Reuse the existing editorial workflow patterns but create a distinct ceremonial schema: cultural claims and practitioner-reviewed Afro-Brazilian content must not be mixed with Western grimoire records.
- Extract planetary time from the Orixá-specific namespace into a neutral pure domain with backward-compatible adapters and golden tests before any new module consumes it.
- Design the Angelical workspace around explicitly selected systems (for example Heptameron, Ars Paulina, Dee/Enochian, Shem ha-Mephorash-derived modern schools) rather than one universal angel hierarchy.
- Design the Goetic workspace with Ars Goetia separate from Theurgia-Goetia and with source-specific rank/office/seal variants; never present coercive or harmful objectives as recommended actions.
- Design Olympic spirits and planetary intelligences as separate catalogs linked through planet/timing profiles, not as aliases of angels, demons, Orixás or one another.
- Complete existing reliability/legal production gates in parallel waves where independent, but block public ceremonial release on rights review, safety review, privacy updates and real-device visual/accessibility QA.
- Implement two fail-closed presentation modes over one provenance registry: **complete private/local mode** and **hybrid-by-rights published mode**.
- In local mode, inventory, extract, deduplicate, classify and render the complete locally available corpus, including full texts, images, seals, procedures and variants when technically extractable.
- In published mode, render complete material only when public-domain/licensed, locator-verified and editorially approved; otherwise expose metadata, provenance, locators, derived planning/timing/checklists and user-private notes without republishing protected source content.
- Enforce the distribution boundary in query policy, API DTOs, storage/media access, caching, exports, sitemap/SEO generation and build/deploy verification. Public artifacts must remain safe even if local corpus records are present in the source database.
- Preserve rights and sensitivity metadata as mandatory policy inputs in both modes; local availability never implies public permission.
- Finish and harden the interrupted Tríade v3 as the first execution wave before ceremonial schema work, so the worker starts from a verified privacy-correct baseline instead of layering new sensitive-data models over unfinished changes.
- Preserve the already-created feedback migration and use a new additive migration for constraints or schema corrections unless `prisma migrate status` proves it has never been applied anywhere the owner treats as shared; never rewrite migration history by assumption.
- Treat consent as stateful product behavior, not a constant payload: the future UI must bind the checkbox to explicit state, the API remains fail-closed on anything except literal `true`, and tests must prove unchecked requests cannot be emitted or accepted.
- Make the account export reproduce a calibration record by including stored matrix, config and scorer versions; keep internal claim IDs, weights, rules and contribution details excluded.
- Reconcile “not persisted” wording to the precise rule: answers are ephemeral for calculation-only POST requests, but are persisted only when the user separately submits consented calibration feedback.
- Adopt an additive single-feedback withdrawal endpoint/control as the privacy-preserving default, while retaining profile/account cascade deletion; final legal basis and retention duration remain release-blocking owner/legal decisions rather than fabricated technical policy.
- Require TDD for Tríade domain/contracts and privacy invariants, tests-after for API/UI/export/migration wiring, and Playwright for the authenticated questionnaire-result-consent-feedback-export/delete journey.

## Scope IN

- Read and reconcile all project documentation, implementation evidence, prior decisions, tests, and remaining backlog.
- Audit `/mnt/e/Ocultismo` as a private source corpus, including duplicates, editions, locators, extraction quality, rights, and sensitivity.
- Design the complete Ceremonial Laboratory architecture and its Angelical, Goetic, Olympic, and planetary-intelligence capabilities.
- Define deterministic celestial timing, rule variants, provenance, data contracts, persistence, API/UI boundaries, privacy, safety, accessibility, tests, migrations, rollout, and documentation.
- Integrate the new work with the existing AstroAxe roadmap rather than replacing stable foundations.
- Audit and complete the interrupted Tríade de Regências v3 work: questionnaire, new catalog/matrix/config/scoring, consented feedback, persistence, account export, UI, migration, generated client, tests, documentation and benchmark readiness.

## Scope OUT (Must NOT have)

- No implementation or product-code edits during planning.
- No blending of distinct grimoires, angelic systems, Goetia/Theurgia-Goetia, Enochian, Olympic spirits, planetary intelligences, or Afro-Brazilian traditions into universal equivalences.
- No claim that astronomical timing proves spiritual efficacy, guarantees results, diagnoses users, or replaces religious/specialist guidance.
- No copying or publishing private/copyrighted/restricted archive content without explicit rights and editorial approval.
- No harmful, coercive, illegal, sacrificial, self-harm, violence, medical, financial, or crisis-targeting operational guidance.

## Open questions

- Resolved by owner: **dual-mode coverage**. The published site follows hybrid-by-rights rules; the site running locally provides complete access to the locally available corpus. Harm/coercion restrictions remain mandatory in both modes.

## Approval gate
status: awaiting-approval
approach: First reconcile and protect the current AstroAxe baseline; then create a dual-mode Ceremonial Laboratory backed by one provenance-and-rights registry: complete corpus coverage locally and hybrid-by-rights rendering when published. Add neutral celestial timing, source-bound Angelical/Goetic/Olympic-Planetary workspaces, private planning/session records and safety policy. Finish with migration, policy-isolation, security, accessibility, visual, operational and release gates that prove protected local corpus material cannot reach public surfaces.
next_action: After explicit owner approval, write the single decision-complete plan, run mandatory Metis gap analysis, then run dual high-accuracy Momus and independent Oracle review. No implementation is authorized; execution remains a separate `$start-work` session.
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
