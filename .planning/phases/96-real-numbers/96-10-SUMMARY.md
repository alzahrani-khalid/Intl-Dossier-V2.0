---
phase: 96-real-numbers
plan: 10
subsystem: database
tags: [postgres, postgrest, supabase, playwright, materialized-view, tanstack-query]

requires:
  - phase: 96-real-numbers
    provides: 96-RESEARCH Derivation 4 (fixture preconditions, mv machinery), 96-PATTERNS §1
provides:
  - The 7-row type-list read-path classification, gate-pinned at 96-10-CLASSIFICATION.md
  - Behavioural proof that three list surfaces (person, engagement, working_group) drop
    extension-less dossiers, and that the drop lives in three SQL functions, not in TypeScript
  - tests/e2e/96-extension-rows.spec.ts — the re-runnable SC5 fixture oracle
  - The identified mv-freshness mechanism (8 statement-level triggers, no pg_cron)
affects: [COUNT-02 close, any future dossier list surface, staging RPC repair]

tech-stack:
  added: []
  patterns:
    - 'Behavioural CHECK verification: probe the constraint in both directions rather than
      reading pg_constraint, when PostgREST cannot reach pg_catalog'
    - 'Drop-capability classification: extension-first JOIN vs dossier-first merge vs canonical mv'

key-files:
  created:
    - .planning/phases/96-real-numbers/96-10-CLASSIFICATION.md
    - tests/e2e/96-extension-rows.spec.ts
  modified: []

key-decisions:
  - "The plan's instrument test (persons MUST classify canonical-mv) was FALSIFIED by measurement,
    not by a broken instrument: the persons list page calls /functions/v1/persons, not
    /functions/v1/dossiers-list. Recorded with the discriminating probe rather than stopping."
  - 'useCountries.ts and useOrganizations.ts are RECORDED NO-OPS — both are dossier-first with
    absent-as-absent merges; rewriting them would have been damage, not a fix.'
  - 'The drop-capable fix is one migration over three RPCs. NOT APPLIED — plan 96-10 names no
    migration file and the executor brief forbids migrations outside plan-named filenames.'

patterns-established:
  - 'Pattern: a list surface that counts from `dossiers` but renders from an extension-first RPC
    displays N-of-M silently; classify the ROW source and the COUNT source separately.'
  - 'Pattern: verify an enumeration instrument by positive control (a type that DOES classify as
    expected) before believing a surprising classification.'

requirements-completed: []

duration: 23min
completed: 2026-08-17
---

# Phase 96 plan 10: COUNT-02 extension-row joins + SC5 fixture — Summary

**The COUNT-02 drop is real, live, and lives in three SQL functions — not in the two hooks the
plan suspected: `search_persons_advanced`, `search_engagements_advanced` and
`search_working_groups` all read `FROM <extension> JOIN dossiers`, so `/functions/v1/persons`
answers 15 rows above a total of 16. The classification product and the SC5 oracle both ship;
the one-migration fix is BLOCKED on authority, with the DDL recorded below.**

## Performance

- **Duration:** 23 min
- **Started:** 2026-08-17T03:15:00+0300
- **Completed:** 2026-08-17T03:38:00+0300
- **Tasks:** 2 (both products delivered; one gate blocked red — see BLOCKED)
- **Files created:** 2

## Accomplishments

- **Every one of the 7 type-list surfaces mechanically classified**, with the surface file, the
  data mechanism and the drop verdict pinned at
  `.planning/phases/96-real-numbers/96-10-CLASSIFICATION.md` (the gate's subject).
- **The defect located at its root**: three RPCs, one identical mistake. The register's
  `persons 16 vs 15 [V]` is now explained by a specific `JOIN`, not by a guess.
- **The SC5 oracle exists and works end to end** — it inserts, verifies the CHECK live in both
  directions, force-refreshes the mv, observes the DOM, and cleans up. It is red today for the
  defect's own reason, and flips green the moment the migration below lands.
- **The mv-freshness mechanism identified** (research assumption A3 resolved): 8 statement-level
  triggers, synchronous refresh, no cron.
- **Two hooks cleared, not rewritten.** `useCountries.ts` / `useOrganizations.ts` are correct.

## Task Commits

1. **Task 1: Classify every type-list read path; fix only what can drop** — `82062cec6` (docs)
2. **Task 2: The SC5 fixture oracle — 96-extension-rows.spec.ts** — `a4e46f918` (test)

## The 7-row classification table

Home: `.planning/phases/96-real-numbers/96-10-CLASSIFICATION.md` (the gate-pinned artifact —
this is a restatement, that file is authoritative).

<!-- prettier-ignore -->
| type | list surface | data mechanism | classification |
| --- | --- | --- | --- |
| country | `routes/_protected/dossiers/countries/index.tsx` | `useCountries` → `from('dossiers')` + `.in()` merges (`countries`, `engagement_dossiers`) | absent-as-absent |
| organization | `routes/_protected/dossiers/organizations/index.tsx` | `useOrganizations` → `from('dossiers')` + `.in()` tally | absent-as-absent |
| forum | `routes/_protected/dossiers/forums/index.tsx` | `useForums` → `from('dossiers')` + `.in()` on `forums`, merged as `extension: … \|\| {}` | absent-as-absent |
| engagement | `routes/_protected/dossiers/engagements/index.tsx` → `pages/engagements/EngagementsListPage` | `useEngagementsInfinite` → RPC `search_engagements_advanced` (rows AND count) | **drop-capable** |
| topic | `routes/_protected/dossiers/topics/index.tsx` | `useTopics` → `useDossiersByType` → `dossiers-list` → `list_dossiers_optimized` → `dossier_list_mv` | canonical-mv |
| working_group | `routes/_protected/dossiers/working_groups/index.tsx` | `useWorkingGroups` → RPC `search_working_groups` (rows) + separate `dossiers` head count | **drop-capable** |
| person | `routes/_protected/dossiers/persons/index.tsx` | `usePersons` → `apiGet('/persons')` → edge fn → RPC `search_persons_advanced` (rows) + separate `dossiers` head count | **drop-capable** |

**POPULATION DEFINITION (D-15):** the 7 type-list surfaces, one per live `dossiers.type` value
(`dossiers_type_check` re-derived from `pg_constraint` this session — exactly 7 values;
`elected_official` is a person subtype, not a dossier type). **Falls outside:**
extension-by-design readers (detail views, relationship tabs — their population IS extension
rows), the dossiers hub cards (they count `dossiers` directly and are the reference side),
elected-officials surfaces, and the mv's steady-state refresh cadence beyond the forced-refresh
oracle. Enumerated in full in the artifact.

## Re-derived per-type gaps (FLOORS, 2026-08-17, never restated from the register)

<!-- prettier-ignore -->
| type | dossiers | ext rows | gap | vs register |
| --- | --- | --- | --- | --- |
| `person` | 16 | 15 | 1 | matches `16/15 [V]` |
| `engagement` | 5 | 3 | 2 | matches `5/3` |
| `organization` | 5 | 2 | 3 | beyond register (research-new, confirmed) |
| `topic` | 2 | 1 | 1 | beyond register (research-new, confirmed) |
| `country` | 5 | 5 | 0 | — |
| `forum` | 5 | 5 | 0 | — |
| `working_group` | 6 | 6 | 0 | — |

The cross-reading matters: `organization` and `topic` carry real gaps but sound surfaces — those
dossiers already render. `person` and `engagement` carry gaps AND drop-capable surfaces — those
are the live defects. `working_group` is drop-capable with a zero gap: latent.

## No-op-or-fix outcome per named hook

- **`frontend/src/hooks/useCountries.ts` — NO-OP, recorded.** Classified `absent-as-absent`:
  `from('dossiers').eq('type','country')` first, then `.in('id', ids)` merges for `iso_code_2`
  and an `engagement_dossiers` tally defaulting to `0`. A dossier without a `countries` row is
  listed with no flag and a zero count — absent rendered as absent, which is correct. Untouched.
- **`frontend/src/hooks/useOrganizations.ts` — NO-OP, recorded.** Same shape, same verdict.
  Untouched.
- **Not a no-op, and not fixable here:** `person`, `engagement`, `working_group`. See BLOCKED.

## The fixture: id + cleanup proof

Three oracle runs, each with its own namespaced fixture; the last full run:

```
[96-10] CHECK verified live: type='elected_official' rejected (23514)
[96-10] fixture dossier inserted: id=7a652a38-c533-419e-8af0-f22bcd3b13e4 name_en="P96 COUNT02 FIXTURE"
[96-10] with fixture present — hub(dossiers)=17 list(mv)=17
[96-10] fixture cleaned: id=7a652a38-c533-419e-8af0-f22bcd3b13e4
```

Cleanup verified independently after the runs (Supabase MCP, read-only):

```sql
SELECT (SELECT count(*) FROM dossiers WHERE name_en LIKE 'P96 COUNT02%') AS stray_fixtures, -- 0
       (SELECT count(*) FROM dossiers WHERE type='person') AS person_dossiers,              -- 16
       (SELECT count(*) FROM persons) AS persons_ext,                                        -- 15
       (SELECT count(*) FROM dossier_list_mv WHERE type='person') AS mv_person;              -- 16
```

Zero stray rows; staging is exactly as it was found. The negative CHECK probe row is never
committed — the constraint rejects it (`23514`), which is the assertion.

## The hub==list batch result

**hub(`dossiers` type=person) = 17, list(`dossier_list_mv` type=person) = 17, WITH the fixture
present.** The materialized view does NOT drop the extension-less dossier — expected, since its
`FROM` clause is `FROM dossiers d LEFT JOIN countries … LEFT JOIN persons p …` (read live this
session). The canonical path is sound; the drop is downstream of it, in surfaces that never use
it.

Corroborated as a true single statement via the Supabase MCP at execution time (the spec itself
uses two adjacent reads — see Deviation 2):

```sql
SELECT (SELECT count(*) FROM dossiers WHERE type='person')        AS hub,
       (SELECT count(*) FROM dossier_list_mv WHERE type='person') AS list;   -- 16 | 16 (post-cleanup)
```

## Per-gate red→green records

**Task 1 gate** — `test -f <classification> && grep POPULATION && 7 type rows && test -d frontend/src
&& useQuery positive control && zero !inner && pnpm type-check`

- **RED observed:** exit `1`, natural, on the real tree before the artifact existed (the
  subject's own reason — the plan labelled this arm's red NATURAL at revision 1; confirmed).
- **GREEN observed:** exit `0` after the artifact landed. Re-verified against the COMMITTED blob
  (`git show HEAD:…`): population sentence present, type-row count `7`.
- **An intermediate red is recorded honestly:** the first green attempt returned exit `1` at the
  `-eq 7` arm with **14** matches — the gaps table's rows also began `| person `, `| engagement `
  and so on. Fixed by backticking the gaps table's first column so the gate pins exactly one
  type-keyed table. The gate text was NOT edited.

**Task 2 gate** — `test -f <spec> && --list count == 2 && playwright test --no-deps`

- **RED observed (pre-subject):** exit `1`, `test -f` fails, the spec is this task's product.
- **`--list` arm GREEN:** count `2`, hardcoded, asserted after existence (D-17).
- **Final arm RED, exit `1`, captured directly (not through a pipe):** the fixture dossier
  renders **0** times in the persons list while `hub=17` and `mv=17`.

  ```
  Locator: getByRole('main').getByRole('list').getByRole('listitem')
             .filter({ hasText: 'P96 COUNT02 FIXTURE' })
  Expected: 1   Received: 0   (44 × locator resolved to 0 elements)
  ```

  This is the defect, not a spec fault: the assertion is correct, the surface is wrong. **GREEN
  is UNPROVEN and remains so** — see BLOCKED. It cannot be turned green from inside this plan's
  authority, and the gate was not edited or worked around.

## Decisions Made

- **The instrument test was discharged by measurement, not by stopping.** The plan says _"the
  persons list MUST classify canonical-mv … if it does not, the instrument is wrong, stop."_ The
  stop is conditioned on the instrument being wrong. It is not. Positive control: the same
  enumeration returns `canonical-mv` for `topic`, whose chain does terminate in
  `dossier_list_mv`. Discriminating probe, same user, same clock:

  ```
  GET /functions/v1/persons?limit=100          → rows: 15  | pagination.total: 16
  GET /functions/v1/dossiers-list?type=person  → rows: 16  | total_count: 16
  ```

  Research measured the second endpoint and concluded the persons list was sound; it never
  measured the first, which is what the page actually calls. Stopping on a proven-correct
  instrument would have discarded the exact finding COUNT-02 exists to catch.

- **The fix was NOT applied client-side.** Rewriting the three call sites in TypeScript would
  re-implement RPC-side aggregates (`participant_count`, `active_member_count`,
  `total_deliverables`) in the browser, triple the diff, and leave every other consumer of those
  RPCs still dropping rows. That is the fix-where-you-are-standing anti-pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 10 — trivial, recorded] Plan-named hook files were the wrong suspects**

- **Found during:** Task 1
- **Issue:** The plan's frontmatter named `useCountries.ts` / `useOrganizations.ts` as the
  drop-capable candidates. Both are dossier-first and correct. The drop is in three RPCs.
- **Fix:** Both hooks recorded as no-ops (which the frontmatter explicitly permits: _"modify
  ONLY if classified drop-capable (a no-op is recorded)"_). The real drop-capable paths are
  classified and their fix is in BLOCKED.
- **Verification:** Both hooks read in full; the `.in('id', ids)` merge shape and the `?? 0`
  default confirm absent-as-absent.

**2. [Rule 10 — trivial, recorded] The hub==list batch is two adjacent reads, not one statement**

- **Found during:** Task 2
- **Issue:** The plan's acceptance criterion requires _"one statement"_
  (`SELECT (…) AS hub, (…) AS list`). No raw-SQL channel is reachable from a Playwright spec on
  this project: PostgREST cannot express a two-relation scalar batch, `.env.test` carries no
  connection string, and `pg_proc` contains no exec-SQL function (checked).
- **Fix:** Implemented as two adjacent service-role reads with the seam STATED in the spec — the
  fallback sibling plan 96-07 declares condition-7 compliant (_"adjacent same-clock calls with
  the seam stated"_). Bounded: issued back-to-back, no writer in between, both relations written
  only by this spec during the run. The true one-statement batch was ALSO run via the Supabase
  MCP and is recorded above.
- **Files modified:** `tests/e2e/96-extension-rows.spec.ts` (comment block at the capture site)

**3. [Rule 10 — trivial, recorded] CHECK verification is behavioural, not a `pg_constraint` read**

- **Found during:** Task 2
- **Issue:** The plan says _"query `pg_constraint` for `dossiers_type_check` via a service-role
  rpc/select"_. `pg_constraint` is in `pg_catalog`, which PostgREST does not expose, and no
  catalog-reading RPC exists on this project (checked in `pg_proc`).
- **Fix:** The constraint is probed in BOTH directions instead — a type outside the seven-value
  set must be REJECTED (observed: `23514`), and the fixture's own `person` must be ACCEPTED. This
  proves the constraint is ENFORCED, which reading its definition would not. The definition
  itself WAS re-derived from `pg_constraint` at execution time (via the Supabase MCP) and is
  recorded in `96-10-CLASSIFICATION.md`.
- **Verification:** `[96-10] CHECK verified live: type='elected_official' rejected (23514)`

**4. [Rule 10 — trivial, recorded] Strict-mode locator repair + `no-console` lint**

- **Found during:** Task 2
- **Issue:** A bare `getByRole('list')` resolved to 3 elements (AppShell's sidebar `<ul>`s).
  Separately, `console.log` is an ESLint error repo-wide (`no-console`, warn/error only).
- **Fix:** Scoped the grid to `page.getByRole('main').getByRole('list')` with the observation
  recorded in a comment; switched the 6 diagnostic prints to `console.warn`.
- **Verification:** `pnpm exec eslint tests/e2e/96-extension-rows.spec.ts` → exit `0`.

---

**Total deviations:** 4 auto-fixed (1 wrong-suspect record, 2 unreachable-mechanism
substitutions with the substitute stated, 1 locator/lint repair).
**Impact on plan:** No scope creep. No gate text was edited. The plan's semantics — classify,
then fix only what drops — are intact; what changed is WHICH paths drop, which is a finding, not
a redesign.

## Issues Encountered

- The persons/engagements/working-groups list surfaces are the drop-capable ones, and their fix
  is DDL. Plan 96-10 was authored on the premise that the drop was in TypeScript hooks, so it
  names no migration file — leaving the correct fix outside this executor's authority. Recorded
  in full below rather than worked around.

## BLOCKED

**BLOCK-96-10-01 — the three extension-first RPCs need one migration; this plan names none.**

- **What is blocked:** Task 2's final gate arm (`playwright test … --no-deps`), and with it the
  behavioural half of COUNT-02 / success criterion 5. Everything else in both tasks shipped.
- **Everything observed:** `hub(dossiers type=person)=17` and `list(dossier_list_mv type=person)=17`
  with the fixture present, while the persons list renders **0** matching rows (44 polls,
  20s budget). Live, before any fixture: `GET /functions/v1/persons?limit=100` → **15 rows,
  `pagination.total: 16`**. `GET /functions/v1/dossiers-list?type=person` → 16 rows / 16.
- **Root cause, read live from `pg_proc`:** three functions start from the extension table and
  inner-join the dossier.
  - `search_persons_advanced`: `FROM persons p JOIN dossiers d ON d.id = p.id`
  - `search_engagements_advanced`: `FROM engagement_dossiers ed JOIN dossiers d ON d.id = ed.id`
  - `search_working_groups`: `FROM working_groups wg JOIN dossiers d ON d.id = wg.id`
- **Why it was not applied:** the executor brief, rule 6 — _"Migrations: ONLY the exact
  filename(s) your plan names… Any migration outside your plan's named file = STOP and
  `## BLOCKED`."_ Plan 96-10 names no migration file. No other Phase 96 plan mentions these three
  RPCs (checked), so no lane owns this; migration slots `20260817500001`–`500005` are taken by
  other lanes, so a new file needs its own number from whoever authorizes it.
- **The fix, ready to apply** (one migration, three `CREATE OR REPLACE FUNCTION` statements —
  preserve every existing signature, `RETURNS TABLE` column list, filter and `SECURITY`/`STABLE`
  marker verbatim; change only the `FROM` clause, the id source, and the `ORDER BY` null
  placement):
  1. `search_persons_advanced` — `FROM dossiers d LEFT JOIN persons p ON p.id = d.id`; select
     `d.id` (not `p.id`); `ORDER BY p.importance_level DESC NULLS LAST, d.name_en`.
  2. `search_engagements_advanced` — `FROM dossiers d LEFT JOIN engagement_dossiers ed ON ed.id = d.id`;
     select `d.id`; re-point the `participant_count` subquery to `ep.engagement_id = d.id`;
     `ORDER BY ed.start_date DESC NULLS LAST`.
  3. `search_working_groups` — `FROM dossiers d LEFT JOIN working_groups wg ON wg.id = d.id`;
     select `d.id`; re-point the three correlated subqueries
     (`working_group_members`, `working_group_deliverables`, `working_group_meetings`) to `d.id`.

  Each already filters `d.type = '<type>'` and `d.status`, so the dossier-first form stays
  correctly scoped. Note deliberately: with a LEFT JOIN, an ACTIVE filter on an extension column
  (`p_organization_id`, `p_wg_type`, `p_engagement_type`) still excludes extension-less rows —
  that is correct, a filter on a fact the row does not have cannot match it. No `!inner` embed is
  involved anywhere; none was introduced (gate-verified, zero in `frontend/src`).

- **How to confirm the unblock:** re-run this plan's Task 2 gate verbatim. It goes green with no
  edit to the spec:
  ```
  test -f tests/e2e/96-extension-rows.spec.ts && \
  test "$(pnpm exec playwright test tests/e2e/96-extension-rows.spec.ts --project=chromium-en --no-deps --list 2>/dev/null | command grep -c '›')" -eq 2 && \
  pnpm exec playwright test tests/e2e/96-extension-rows.spec.ts --project=chromium-en --no-deps
  ```
- **Ship/no-ship decision, made here:** SHIP. A user hits this defect — the persons list shows
  15 of 16 people today, and the engagements list shows 3 of 5. The fix belongs in the database,
  not in a test workaround or a client patch. It is recorded here with its DDL so it is queued,
  not merely observed.

## User Setup Required

None — no external service configuration required. The fix above needs an operator with
migration authority, not new credentials.

## Next Phase Readiness

- The classification is a durable artifact: any future dossier list surface can be classified
  against it, and the three drop-capable RPCs are named.
- `tests/e2e/96-extension-rows.spec.ts` is the standing regression: it will red again the day
  someone re-introduces an extension-first list read.
- **COUNT-02 is NOT closed.** Its mechanical half (classification, population, mv seam) is done
  and green; its behavioural half is red on a defect whose fix is one migration away.
- Open beyond this plan: `organization` (gap 3) and `topic` (gap 1) dossiers render correctly
  today but their extension rows are genuinely missing — a data question owned by `DATA-01`, not
  a join question.

---

_Phase: 96-real-numbers_
_Completed: 2026-08-17_

---

# ADDENDUM — 2026-08-17: BLOCK-96-10-01 UNBLOCKED, the sixth migration applied

**Authority:** `RULING-P96-03` (`.tickmarkr/overseer/RULING-P96-03-SIXTH-MIGRATION.md`), branch
(a) — authorize the sixth migration under a bounded addendum lane. This lane did exactly the
work that ruling names and nothing else (condition 5). Scope: one migration, one gate re-run,
this record.

**Outcome: `persons` now answers 16 of 16 (was 15 of 16) and `engagements` 5 of 5 (was 3 of 5).
Task 2's final gate arm is GREEN, re-run verbatim, with no edit to the spec or the gate.
COUNT-02's behavioural half is closed.**

## 1. Condition-2 sweep — do any ACCEPTED P92–P96 gates pin these three prosrc bodies?

Population: `<automated>` gate blocks extracted from `.planning/phases/9[23456]-*/*-PLAN.md`
(56 plan files). Extraction is block-based (`awk` from `<automated>` to `</automated>`) because
exactly one gate block spans multiple lines — a line-only `command grep '<automated>'` extraction
returns 138 lines and misses its continuation; the block form returns 139.

```
$ awk '/<automated>/{f=1} f{print} /<\/automated>/{f=0}' .planning/phases/9[23456]-*/*-PLAN.md > /tmp/p96-gate-blocks.txt
$ wc -l < /tmp/p96-gate-blocks.txt
139

THE SWEEP:
$ command grep -nE 'search_persons_advanced|search_engagements_advanced|search_working_groups' /tmp/p96-gate-blocks.txt
SWEEP exit=1            <-- ZERO hits

CONTROL (known-present token, same instrument, same file):
$ command grep -cE 'test -f' /tmp/p96-gate-blocks.txt
60
control exit=0
```

The control is **60**, byte-identical to the orchestrator's recorded control — the instrument is
proven to see the population. The zero is believed only past it (C5).

**Superset sweep**, run additionally because this lane's population differs from the
orchestrator's line count (139 vs 158): every `*-PLAN.md` anywhere under `.planning`, not just
P92–P96 — 1923 gate-block lines, control `test -f` = **165**, sweep = **ZERO hits, exit 1**. No
gate in any phase, accepted or otherwise, pins these three function names. Condition 2 is
discharged in the permissive direction; the migration proceeds.

**Timestamp check (condition 1), instrument-tested:**

```
$ ls supabase/migrations/ | command grep -c '20260817500005'   # known-present control
1   (exit 0)
$ ls supabase/migrations/ | command grep -c '20260817500006'   # the target slot
0   (exit 1)  <-- unused
```

## 2. The prosrc diff — what the migration changes, mechanically

Live `pg_get_functiondef` for all three was pulled via Supabase MCP `execute_sql` **before**
authoring, written to disk, and the rewrite diffed against it. Line counts are identical on all
three (55 / 46 / 48 → 55 / 46 / 48). Every hunk falls in one of the four permitted classes:

<!-- prettier-ignore -->
| function | id source | FROM clause | ORDER BY | correlated subqueries |
| --- | --- | --- | --- | --- |
| `search_persons_advanced` | `p.id` → `d.id` | `FROM persons p JOIN dossiers d` → `FROM dossiers d LEFT JOIN persons p ON p.id = d.id` | `p.importance_level DESC` → `… DESC NULLS LAST` | none |
| `search_engagements_advanced` | `ed.id` → `d.id` | `FROM engagement_dossiers ed JOIN dossiers d` → `FROM dossiers d LEFT JOIN engagement_dossiers ed ON ed.id = d.id` | `ed.start_date DESC` → `… DESC NULLS LAST` | `participant_count`: `ep.engagement_id = ed.id` → `= d.id` |
| `search_working_groups` | `wg.id` → `d.id` | `FROM working_groups wg JOIN dossiers d` → `FROM dossiers d LEFT JOIN working_groups wg ON wg.id = d.id` | unchanged (`d.updated_at DESC` — dossier-side, never null) | all three re-pointed to `d.id`: `working_group_members`, `working_group_deliverables`, `working_group_meetings` |

**Nothing else moved.** Preserved verbatim and confirmed post-apply against `pg_proc`:

<!-- prettier-ignore -->
| function | `prosecdef` before → after | `provolatile` before → after | identity args |
| --- | --- | --- | --- |
| `search_persons_advanced` | `false` → `false` | `s` (STABLE) → `s` | unchanged, 11 params |
| `search_engagements_advanced` | `false` → `false` | `s` (STABLE) → `s` | unchanged, 10 params |
| `search_working_groups` | `true` (SECURITY DEFINER) → `true` | `v` → `v` | unchanged, 7 params |

Every `RETURNS TABLE` column list and every `WHERE` filter is byte-identical to the pre-migration
body — proved, not asserted: the post-apply `md5(pg_get_functiondef(oid))` equals the local md5
of the authored statement, for all three.

```
              local md5 of the authored statement   live md5 post-apply
persons       2d443da78914b348f4b1dae55b317a6c      2d443da78914b348f4b1dae55b317a6c
engagements   fc50e9dbdf19dba310e7ee51db965944      fc50e9dbdf19dba310e7ee51db965944
wg            706f8c552b3dea5b5ff05a115cfd7a40      706f8c552b3dea5b5ff05a115cfd7a40
```

**Semantics stated deliberately (unchanged from BLOCK-96-10-01):** with a LEFT JOIN, an ACTIVE
filter on an extension column (`p_organization_id`, `p_engagement_type`, `p_wg_type`, …) still
excludes extension-less rows. That is correct — a filter on a fact the row does not have cannot
match it — not a residual drop.

## 3. Apply evidence

- **File:** `supabase/migrations/20260817500006_p96_extension_first_rpcs.sql` — exactly the three
  `CREATE OR REPLACE FUNCTION` statements plus a header comment citing `RULING-P96-03`. Nothing
  else rides in it (condition 1).
- **Applied via** Supabase MCP `apply_migration`, project `zkrcjzdemdmwhearhfgg`, name
  `p96_extension_first_rpcs` → `{"success": true}`. Zero DDL through `execute_sql`; `execute_sql`
  was used only for the prosrc read and the recorded-evidence counts below.

## 4. Before / after — the live 15-vs-16 discrepancy

Authenticated as the `.env.test` TEST_USER (password-grant token; no credential echoed or
committed at any point).

```
BEFORE (pre-migration, this lane's own measurement — not restated from 96-10):
  GET /functions/v1/persons?limit=100
    rows: 15   pagination: {"total": 16, "limit": 100, "offset": 0, "has_more": false}

AFTER (post-migration, same endpoint, same user):
  GET /functions/v1/persons?limit=100
    rows: 16   pagination: {"total": 16, "limit": 100, "offset": 0, "has_more": false}
    rows_eq_total: True     null_ids: 0
```

RPC-level, one statement each side (recorded-evidence `execute_sql`, read-only):

<!-- prettier-ignore -->
| relation | RPC rows BEFORE | RPC rows AFTER | dossiers (unarchived) | verdict |
| --- | --- | --- | --- | --- |
| `search_persons_advanced` | 15 | **16** | 16 | drop closed |
| `search_engagements_advanced` | 3 | **5** | 5 | drop closed |
| `search_working_groups` | 6 | 6 | 6 | latent drop removed; count unchanged (gap was 0) |

`working_groups` moving 6→6 is the expected result and worth stating plainly: it was classified
drop-capable with a **zero gap** — latent. The fix removes the capability; there was no live
victim to recover. Also asserted post-migration: `null_person_ids = 0` — the dossier-first form
never emits a NULL `id` for the extension-less row.

## 5. The 96-10 Task 2 gate, re-run VERBATIM — red → green

Gate text taken byte-identically from `.planning/phases/96-real-numbers/96-10-PLAN.md` Task 2
`<automated>`. No spec edit, no gate edit.

**RED** — recorded twice, both pre-migration, both this lane's own clock:

- The gate's own final arm, observed by plan 96-10 at the same gate text on the same spec:
  `Expected: 1  Received: 0` (44 polls) — restated above in §"Per-gate red→green records".
- This lane re-measured the defect directly immediately before applying, so the red is not
  inherited on trust: `GET /functions/v1/persons?limit=100` → **15 rows above `total: 16`**, and
  `search_persons_advanced` → **15** vs 16 unarchived person dossiers. The red condition was
  live and measured by this lane at 2026-08-17, minutes before the apply.

Ordering note, stated rather than papered over: `RULING-P96-03`'s own step order applies the
migration (condition 1) before re-running the gate (condition 3), so the gate's _own exit code_
was not observed red by this lane — its red is 96-10's recorded observation, and this lane's
independent red is the two live measurements above against the identical defect.

**GREEN** — observed, exit code captured directly (not through a pipe):

```
$ test -f tests/e2e/96-extension-rows.spec.ts && \
  test "$(pnpm exec playwright test tests/e2e/96-extension-rows.spec.ts --project=chromium-en --no-deps --list 2>/dev/null | command grep -c '›')" -eq 2 && \
  pnpm exec playwright test tests/e2e/96-extension-rows.spec.ts --project=chromium-en --no-deps

Running 2 tests using 1 worker
[96-10] CHECK verified live: type='elected_official' rejected (23514)
[96-10] fixture dossier inserted: id=38afe693-f687-45bf-9644-bb46a8378d85 name_en="P96 COUNT02 FIXTURE"
[96-10] with fixture present — hub(dossiers)=17 list(mv)=17
  ✓  1 [chromium-en] › tests/e2e/96-extension-rows.spec.ts:189:7 › criterion 5 — a dossier with no extension row is listed and counted › the persons list renders the extension-less fixture and agrees with the hub count (3.9s)
[96-10] fixture cleaned: id=38afe693-f687-45bf-9644-bb46a8378d85
  ✓  2 [chromium-en] › tests/e2e/96-extension-rows.spec.ts:215:7 › criterion 5 — a dossier with no extension row is listed and counted › the fixture row renders its absent extension fields as absent, never fabricated (3.9s)

  2 passed (9.6s)
GATE_EXIT=0
```

Both tests pass, including Test 2's absent-renders-as-absent assertion — the extension-less
dossier now renders and its empty extension cells carry no fabricated `undefined`/`NaN`/`null`
literals. The `--list` arm still counts exactly 2, hardcoded, asserted after existence.

**Fixture cleanup verified independently** after the run (Supabase MCP, read-only):
`SELECT count(*) FROM dossiers WHERE name_en LIKE 'P96 COUNT02%'` → **0**. Staging is exactly as
it was found; the only persistent change from this lane is the three function bodies.

## 6. Status of BLOCK-96-10-01

**CLOSED.** The SHIP decision recorded in that block was executed where the defect lives — in the
database tier, one migration over three RPCs — not worked around in a test or patched per call
site. `tests/e2e/96-extension-rows.spec.ts` stands as the regression: it reds again the day
someone re-introduces an extension-first list read.

Unchanged and still open beyond this lane (not this lane's scope, restated so it is not lost):
`organization` (gap 3) and `topic` (gap 1) dossiers have genuinely missing extension rows — a
data question owned by `DATA-01`, not a join question.

_Addendum completed: 2026-08-17 — RULING-P96-03, bounded addendum lane 96-10A_

SUMMARY-END
