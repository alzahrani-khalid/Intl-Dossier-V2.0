---
phase: 93-failure-visibility
plan: 07
subsystem: ui
tags: [tanstack-query, react, playwright, error-states, i18n, trust-01]

requires:
  - phase: 93-01
    provides: QueryErrorState (variant 'inline') + the seven bilingual common:errors.* keys
provides:
  - 'TRUST-01 sites 4 and 5 closed: both catch-and-return fabrications deleted from useDossier.ts'
  - 'DossierListPage counts error branch: em-dash figures (aria-label common:errors.countUnavailable) + QueryErrorState variant B, replacing seven confident zero-cards'
  - 'DossierListPage list-error render carries i18n copy only (D-08 bucket (a) site :817)'
  - 'tests/e2e/93-dossier-list-counts-error.spec.ts — a discriminating forced-error oracle'
affects: [93-14 (this file is its stated exclusion), 96 (COUNT-02 count values), 102]

tech-stack:
  added: []
  patterns:
    - 'Swallow-deletion and its consumer error branch land in the SAME task (D-21)'
    - 'Forced-error oracles discriminate sibling queries by transport path, not by URL blocklist'

key-files:
  created:
    - tests/e2e/93-dossier-list-counts-error.spec.ts
  modified:
    - frontend/src/domains/dossiers/hooks/useDossier.ts
    - frontend/src/pages/dossiers/DossierListPage.tsx

key-decisions:
  - 'The counts/list discriminator is the transport path, not a head:true query-string — the plan hypothesis was wrong and the derived truth is simpler'
  - 'The type stats CARD is not rendered at all on a counts rejection; a card that can only display a number has no honest render for a failed request'
  - 'DossierTypeStatsCard.tsx was NOT modified — it is outside files_modified, so the em-dash chrome is rendered by the page'

patterns-established:
  - 'Em-dash count chrome: data-testid="dossier-count-unavailable" + aria-label t(common:errors.countUnavailable)'

requirements-completed: [TRUST-01]

duration: ~65 min
completed: 2026-08-16
---

# Phase 93 Plan 07: Dossier counts — unknown renders as unknown Summary

**Both `useDossier.ts` counts swallows deleted and `DossierListPage` given the counts `isError`
branch in the same commit, so a rejected counts query renders seven em dashes plus a variant-B
region error instead of seven confident zero-cards — proven by a forced-error spec that blocks the
PostgREST counts read while the `dossiers-list` edge function keeps serving rows.**

## Performance

- **Duration:** ~65 min (approximate; plan start was not timestamped — the committed span is
  2026-08-15T21:50Z → 22:01Z, preceded by read-in, gate RED observation and the drill runs)
- **Completed:** 2026-08-15T22:01:27Z
- **Tasks:** 2 of 2
- **Files modified:** 3 (2 modified, 1 created)

## THE GATE TABLE — both directions observed, per gate

`ACCEPTANCE-P93-EXEC.md` condition 1. Every command below was executed; every output is pasted from
the actual run.

| gate                       | RED before (command + output)                                                                                                                                                                                                                                                                                                                                                                                                                                                      | GREEN after (command + output)                                                                                                                                                                                                        | notes                                                                                                                                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **93-07_g1** (PLAN.md:93)  | Gate run verbatim from repo root → `GATE1_EXIT=1`. Decomposed to attribute the red to its SUBJECT (C2): `clause2 emptyCounts (need 0): 3` / `clause3 countUnavailable (need >=1): 0` / `clause4 error.message renders (need 0): 1` with `817:  {error?.message \|\| t('list.errorMessage')}`. Clause 1 (`test -f`) PASS and `pnpm type-check` clean on the undone tree, so the red is not an environment red.                                                                      | Gate run verbatim → `GATE1_EXIT=0` (tsc emitted no diagnostics). Independently re-run by the phase instrument: `node scripts/gate-drill.mjs .planning/phases/93-failure-visibility` → `93-07_g1  PARSE-OK  exit=0  93-07-PLAN.md:93`. | Three of four clauses red for the subject. See **C8 incident** below — my own comment prose tripped clause 4 once; the COMMENT was changed, never the gate.                                                         |
| **93-07_g2** (PLAN.md:115) | Two reds recorded, weakest first. (a) subject-absent: `Error: No tests found.` → `GATE2_EXIT=1`. (b) **the meaningful red** — spec authored and run against the still-unfixed page: `1 failed`, `getByTestId('dossier-count-unavailable').first()` … `element(s) not found`, and the failure snapshot shows the D-21 lie live: seven `- text: "0"` blocks with `% of total active dossiers 0% Active 0 Inactive 0`, **while line 161 reads `- paragraph: Showing 1 to 12 of 43`**. | `pnpm exec playwright test tests/e2e/93-dossier-list-counts-error.spec.ts --project=chromium-en --no-deps` → `✓ 1 [chromium-en] › … (12.4s)` / `1 passed (12.8s)` → `GATE2_EXIT=0`. Instrument agrees: `93-07_g2  PARSE-OK  exit=0`.  | Red (b) is the strongest form available: the gate failed **on the live defect**, not on an absent file, and the same run positively controlled the discriminator (list alive at 43 rows while counts were blocked). |

**Neither gate was green before its task**, so neither is a vacuous oracle and neither is a mere
regression guard. No `GATE CONCERN` is raised: both gates measure their stated subject.

### The C8 incident — recorded because it is the standard's own failure mode, live

Gate `93-07_g1` clause 4 is a negative grep (`grep -cE 'error\?\.message|error\.message'` … `-eq 0`)
that strips only `//` comments. My first fix at `:817` replaced the operand correctly **and** added a
JSX block comment reading "the `error.message` operand is GONE" — so the gate stayed red at
`clause4 … : 1`, pointing at my own explanatory prose. This is GATE-STANDARD **C8** verbatim ("the
plan's own action text usually instructs the author to mention `X`"). **The comment was reworded;
the gate was not touched.** Recorded so the next author expects it rather than editing the oracle.

## Accomplishments

- **Site 4** (`useDossier.ts:683`, `useDossierCounts`): the `catch` returning `emptyCounts` (six
  zero-filled types) is deleted; the `queryFn` is now its throwing transport call. `emptyCounts`
  count over non-comment lines: **3 → 0**.
- **Site 5** (`useDossier.ts:738`, `useDossierCountByType`): the `catch` returning `0` is deleted.
- **The D-21 pairing, in the same commit** (`dca31b88`): `DossierListPage` now destructures
  `isError` (and `isFetching`) from `useDossierCounts`. On rejection the type-overview region
  renders `QueryErrorState variant="inline"` (retry wired to `refetchCounts`, disabled while
  refetching) above seven em-dash figures, each
  `data-testid="dossier-count-unavailable" aria-label={t('common:errors.countUnavailable')}`.
  **`DossierTypeStatsCard` is not rendered at all in this state** — a card whose only content is a
  number has no honest render for a request that failed, and leaving it out is what makes the digit
  `0` unreachable rather than merely relabelled.
- **The `:817` leak** (D-08 bucket (a), the site 93-14's sweep excludes because this plan owns the
  file): the server-message operand is gone, the i18n fallback remains, and the orphaned `error`
  binding was removed with it.
- **A discriminating oracle** whose third conjunct makes it self-checking.

## The discriminator — DERIVED, and the plan's hypothesis was wrong

The plan instructed me to derive it at authoring time and warned that CDP `setBlockedURLs` might be
too blunt because the counts query was assumed to be a supabase-js `head:true` count against the
same `/rest/v1/dossiers` resource the list also queries. **Measured, that is not the shape.** The two
queries share no transport at all:

| query  | seam                                                     | request                                                                      |
| ------ | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| counts | `services/dossier-api.ts:686` `getDossierCountsByType()` | `GET <supabase>/rest/v1/dossiers?select=type%2Cstatus&status=not.eq.deleted` |
| list   | `services/dossier-api.ts:567` `listDossiers()`           | `GET <supabase>/functions/v1/dossiers-list?<filters>`                        |

PostgREST table read vs. edge function — different path prefixes. So `page.route()` pinned to the
`/rest/v1/dossiers` path **and** `select=type,status` aborts the counts request and structurally
cannot touch the list. The derivation is written into the spec's header, including the corrected
hypothesis, so the next reader does not re-derive it.

## Self-checking evidence beyond the two gates

Run in a throwaway spec (`93-07-drill.tmp.spec.ts`), then **deleted** — `ls` confirms
`No such file or directory` and `git status --porcelain` carries no trace of it.

1. **NEGATIVE CONTROL — the committed spec is not vacuous.** With a deliberately blunt data-layer
   block (counts _and_ `dossiers-list`), conjuncts 1 and 2 still hold but the third
   (`/showing \d+ to \d+ of \d+/`) is **absent**. So a too-blunt block genuinely reds the committed
   spec; the self-check the acceptance criterion claims is real, not asserted. `2 passed (11.6s)`.
   (First attempt at this control failed for the wrong reason — the predicate `pathname.includes('/dossiers')`
   also blocked the SPA document, giving `net::ERR_FAILED at http://localhost:5173/dossiers`. Narrowed
   to the two data endpoints, which is the scenario the criterion actually describes.)
2. **HAPPY-PATH SMOKE — the happy path did not move.** Nothing blocked:
   `.dossier-type-stat-card` → **7**, `dossier-count-unavailable` → **0**, `query-error-inline` → **0**,
   `Showing … of …` visible, and `getByRole('heading', { level: 3 })` (the POM's card selector)
   resolves. Passed.

## C9b — CROSS-PHASE CONSUMERS, triaged with evidence

Five shipped consumers were named: `tests/e2e/03-dossier-navigation.spec.ts`,
`04-command-palette.spec.ts`, `08-export-import.spec.ts`, `ar-smoke/dossier-navigation.ar.spec.ts`,
and the page object `tests/e2e/support/pages/DossierListPage.ts`.

**No happy-path selector moved, so the POM was not edited.** The change is additive on a branch that
only executes when `countsError` is true; the loading and success renders are untouched, which
observation (2) above confirms against the live DOM.

**I attempted to run them anyway rather than assert they were fine, and they fail — for a
pre-existing reason I can pin.** `pnpm exec playwright test 03… 04… 08… --project=chromium-en --no-deps`
→ `4 failed`, first error `locator.fill: Target page, context or browser has been closed`, i.e. a
fixture/auth death, not a DOM assertion. The cause, measured directly from the fixtures:

```
admin    session expires_at -> 2026-06-04T20:51:20.000Z
analyst  session expires_at -> 2026-06-04T20:51:20.000Z
intake   session expires_at -> 2026-06-04T20:51:20.000Z
now      -> 2026-08-15T21:57:01.979Z
```

All three role storage states expired **72 days ago**, and the `setup` project that would refresh
them needs six `E2E_*` role keys that `.env.test` does not carry —
`grep -cE "^E2E_(ADMIN|ANALYST|INTAKE)_(EMAIL|PASSWORD)=" .env.test` → **0**. That is `E2ECRED-01`,
outstanding with the operator and explicitly **not** a Phase 93 dependency (D-20). These four specs
were unrunnable **before** this plan and remain so; nothing here changed their status.

**Population statement (D-18).** The consumer set above is the plan's named five, re-derived by
identifier against `phase-93-base`. What this does **not** cover: a test coupled to this page by
_shape alone_ (`getByRole('alert')` plus visible text, naming no identifier) matches no grep — the
residual defence for that class is running the shipped suite before the phase closes, which
`E2ECRED-01` currently blocks for the role-fixture specs.

## Task Commits

1. **Task 1: delete both swallows AND land the page's counts error branch** — `dca31b88` (fix)
2. **Task 2: discriminating forced-error spec** — `ff6af6af` (test)

Scope diff anchored to the phase tag (C7, never `HEAD`):
`git diff --name-only phase-93-base -- <the three declared paths>` returns exactly those three and
nothing else.

## Files Created/Modified

- `frontend/src/domains/dossiers/hooks/useDossier.ts` — both counts `queryFn`s collapse to their
  throwing transport call; `emptyCounts` and the `0` fallback are gone.
- `frontend/src/pages/dossiers/DossierListPage.tsx` — counts `isError` branch (em-dash chrome +
  `QueryErrorState` variant B); `:817` renders i18n copy only.
- `tests/e2e/93-dossier-list-counts-error.spec.ts` — the forced-error oracle (1 test).

## Decisions Made

- **The stats card is omitted, not zeroed, on a counts rejection.** `DossierTypeStatsCard.tsx` is
  outside this plan's `files_modified`, so the em-dash chrome is rendered by the page. This is the
  better outcome regardless of the constraint: the card's percentage bar and active/inactive split
  have no honest failed-request rendering either, so replacing the whole card removes every
  fabricated figure rather than the headline number alone.
- **`totalDossiersUnfiltered` was left as-is.** On a counts rejection `counts` is `undefined`, so the
  memo returns `undefined` and `ActiveFiltersBar` (`unfilteredTotal !== undefined && …`) renders no
  hidden-results line at all. That is absence, not fabrication, so it does not violate the phase
  boundary — but stating it plainly: **this specific claim is a code read** of
  `DossierListPage.tsx:267-270` and `components/active-filters` `:193-194`, not a rendered
  observation, and it is the one claim in this summary that is not backed by a run. The `43 items`
  visible on-screen in the RED snapshot comes from `SyncStatusBar`, fed by the **list** query, and
  is a real number.
- **The em-dash figures are not headings.** The POM locates dossier cards with
  `getByRole('heading')`; rendering the type labels as plain `span`s keeps that selector's result set
  unchanged in the error state as well as the happy one.

## Deviations from Plan

### 1. [Rule 1 — Bug] The plan's stated discriminator was wrong; the derived one replaces it

- **Found during:** Task 2
- **Issue:** the plan describes the counts query as a `head:true` count against the same
  `/rest/v1/dossiers` resource as the list, and cautions that URL-only blocking may be too blunt.
  `services/dossier-api.ts:686` is a plain `.select('type, status')`, and the list goes to a
  **different service entirely** (`/functions/v1/dossiers-list`).
- **Fix:** derived the real shapes and pinned the route predicate to path + `select=type,status`.
  The corrected derivation and the superseded hypothesis are both written into the spec header.
- **Verification:** the RED run is the positive control — counts blocked, `Showing 1 to 12 of 43`
  still rendered.
- **Committed in:** `ff6af6af`

### 2. [Rule 3 — Blocking] The shared Vite dev server was serving pre-edit code

- **Found during:** Task 1 → Task 2 verification
- **Issue:** after Task 1's edits the spec still saw seven zero-cards.
  `curl http://localhost:5173/src/pages/dossiers/DossierListPage.tsx | grep -c dossier-count-unavailable`
  → **0**, while the file on disk had it. `touch` did not help; a `?t=<epoch>` cache-buster did not
  help. The long-lived dev server's file watcher was dead — it had been serving stale modules.
- **Fix:** killed pid 48161 and restarted `pnpm dev` from `frontend/`. The same curl then returned
  **1** and the gate went green.
- **Impact beyond this plan — worth the orchestrator's attention:** while that server was stale,
  **any** lane's Playwright oracle pointed at `:5173` was testing pre-edit code. That silently
  produces false greens (a fix "verified" against code that was never loaded) and false reds. This
  is not a gate defect and not a `GATE CONCERN` — it is an environment hazard, filed here so it is
  on the record rather than rediscovered. It did not corrupt this plan's evidence: my RED was
  observed before any source edit (stale == current at that moment), and every GREEN was observed
  after the restart.

### 3. [Rule 1 — Bug] Comment prose tripped the plan's own negative grep

- **Found during:** Task 1 — see the **C8 incident** above. The comment was reworded. **No gate text
  was edited.**

---

**Total deviations:** 3 auto-fixed (2 × Rule 1, 1 × Rule 3).
**Impact on plan:** none widened scope. Deviation 1 made the oracle correct rather than approximate;
2 was an environment repair with no code change; 3 was a one-word rewording.

## Intended-broken register — untouched

Confirmed by the scope diff above: nothing outside the three declared files was modified, so
`/delegations`, `/admin/data-retention`'s legal-holds region, `/admin/field-permissions`' filters,
and `AUDIT-DROP-01` / `AUDIT-ZERO-01` are all exactly as this phase intends them. No
`GRANT SELECT ON auth.users` was proposed, written, or applied anywhere in this plan.

## Known Stubs

None. The em-dash chrome is a rendered terminal state, not a placeholder awaiting data.

## Issues Encountered

- **Cross-lane type-check collision (resolved, no action taken by me).** Gate `93-07_g1` ends in a
  repo-wide `pnpm type-check`. On the first GREEN attempt it reported six `TS6133 'error' is declared
but its value is never read` errors in `CommitmentsList.tsx`, `DossierDocumentsTab.tsx`,
  `Countries.tsx`, `WorkItemList.tsx`, `WorkingGroupsPage.tsx`, `scenario-sandbox.tsx` — **none of
  them mine**. `git diff` showed these were plan 93-14's _uncommitted, in-flight_ operand removals,
  orphaning the same `error` binding I had just removed from my own file. I did not touch them and
  did not `git checkout` anything. 93-14 committed as `5ad3b05c` shortly after, and the gate went
  green on re-run. Noted because a repo-wide `tsc` inside a per-plan gate is coupled to every
  concurrent lane's half-finished state, which is a fair source of spurious reds for later lanes.

## Next Phase Readiness

- `TRUST-01` sites 4 and 5 are closed. Sites 1–3 (93-06) and site 6 (93-08) are other plans'.
- `93-14`'s stated exclusion of `DossierListPage.tsx` holds: its `:817` site is fixed here, and this
  plan's gate asserts zero server-message render lines in the file.
- **`COUNT-02` (Phase 96) is untouched by design.** The persons 16-vs-15 and engagements 5-vs-3
  discrepancies are count _values_; this plan makes count _failure_ honest. Nothing here should be
  read as evidence about count correctness.
- Whoever retrofits `DelegationManagementPage` onto the shared `QueryErrorState` must update
  `tests/e2e/92-delegations-error.spec.ts` in the same task (C9b, already recorded in
  `QueryErrorState.tsx`'s header).

## BLOCKED

None.

The four C9b consumer specs cannot run, but that is `E2ECRED-01` — pre-existing, outstanding with
the operator, explicitly not a Phase 93 dependency (D-20), and unchanged by this plan. It blocks no
criterion this plan owns: both gates are green and the happy path was verified by a runnable
inline-auth substitute instead.

---

_Phase: 93-failure-visibility_
_Completed: 2026-08-16_

## Self-Check: PASSED

- All 4 declared files present on disk (`[ -f ]`).
- Both task commits resolve in `git log --all`: `dca31b88`, `ff6af6af`.
- `.planning/STATE.md` and `.planning/ROADMAP.md` untouched — orchestrator-owned.
- `93-07-PLAN.md` unmodified since `phase-93-base`: no gate text was edited.
- Both gates re-run green by the shared instrument (`scripts/gate-drill.mjs`), not only by hand.

## ADDENDUM — RULING-P93-04 Decision 2 (the two unexamined C9b consumers)

Recorded by orchestrator `orch-p93-b` on 2026-08-16, at HEAD `8b70c6fc`, tree clean before and after
(both runs are read-only; no file was modified). This is the **missing half of this plan's
byte-identical happy-path criterion** — the two `DossierListPage.tsx` consumers the 21% C9b sweep
never examined. Neither run was reasoned about; both were executed.

<!-- prettier-ignore -->
| consumer spec | command | result | attribution |
| --- | --- | --- | --- |
| `frontend/tests/unit/routes.test.tsx` | `cd frontend && pnpm exec vitest run tests/unit/routes.test.tsx` | **1 file passed · 14/14 tests passed** | green — no follow-up |
| `frontend/tests/e2e/pull-to-refresh.spec.ts` | `cd frontend && pnpm exec playwright test tests/e2e/pull-to-refresh.spec.ts --no-deps --reporter=line` | **5 failed / 8 passed** (`:92`, `:140`, `:170`, `:193`, `:250`) | **pre-existing — already filed as `E2ESTALE-01`**, owner Phase 101 |

The five reds reproduce `E2ESTALE-01`'s filed measurement **exactly** — same five line numbers, same
`5 failed / 8 passed` split that requirement records at `phase-93-base` **and** at post-change HEAD.
Root cause there is a loose locator (`locator('h1')` → `strict mode violation: resolved to 44
elements`, one `h1` per dossier card), not a product defect and not this plan's change.

**Disposition — and the one place it departs from Decision 2's text.** Decision 2 said "if red, the
fix executes now, in `93-07`'s author-context". These five were subsequently **registered** under
`E2ESTALE-01` (filed 2026-08-16 from `RULING-P93-04` Decision 1 condition 3) with owner Phase 101.
Repairing them now would be an opportunistic fix of registered breakage, which
`ACCEPTANCE-P93-EXEC.md` condition 3 makes a **REJECT**. They are therefore left red and reported as
registered, not as regressions and not as fixed. The overseer is notified; this note stands corrected
by any ruling that says otherwise.

**Population this addendum measured:** the two shipped consumers of `DossierListPage.tsx` named in
the corrected C9b register (`RULING-P93-04` scope note). **Outside it:** every other consumer of the
four `93-07` files; consumers coupled by DOM shape rather than by identifier, which no grep can see —
that residual is `ACCEPTANCE-P93-EXEC.md` condition 4's close-out suite run, not this addendum; and
the four root-`tests/` C9b specs, which remain unrunnable under `E2ECRED-01` (D-20, unchanged).

This addendum **corrects, does not rewrite,** the `BLOCKED: None` close-out above.

### Correction to the addendum above — what `routes.test.tsx`'s 14/14 green does NOT establish

Added by `orch-p93-b` on 2026-08-16, after `93-11` reported the same property for its own subject.

`frontend/tests/unit/routes.test.tsx` **mocks `@/pages/dossiers/DossierListPage`** (line 127): the
mock is a hand-written stand-in that reads `useRouterState` search params and renders checkboxes.
**The real component never renders in that file.** Its 14 assertions are about router search-param
wiring, and they are structurally incapable of moving when `DossierListPage.tsx` changes — they
would stay 14/14 with the component's body deleted.

So the row above is accurate as a _measurement_ and near-worthless as _evidence about this plan's
subject_. The honest statement: `routes.test.tsx` was run, is green, and **did not exercise
`DossierListPage`**; `pull-to-refresh.spec.ts` is the only one of the two consumers that renders the
real page, and its five reds are `E2ESTALE-01`'s, unchanged in both directions.

Recorded rather than quietly amended, because a green that rests on an unstated qualifier is exactly
what `ACCEPTANCE-P93-EXEC.md`'s DOWNGRADE branch is for — and the qualifier was found by reading the
fields, which is where it says it will be found.
