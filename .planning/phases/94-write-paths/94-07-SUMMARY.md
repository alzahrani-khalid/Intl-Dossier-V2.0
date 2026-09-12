---
phase: 94-write-paths
plan: 07
subsystem: api
tags: [supabase, edge-functions, postgrest, i18n, react, playwright, vitest]

requires:
  - phase: 94-02
    provides: the wave-1 REQUIREMENTS.md correction this plan's edit is serialised after
  - phase: 93
    provides: the QueryErrorState error vocabulary and the D-07 degraded-state discriminator
provides:
  - after-actions-list-all composes its engagement/dossier context in code from two batched lookups and is REDEPLOYED
  - scripts/probe-after-actions-list.mjs — deployed-artifact oracle for the list write path
  - common:afterActions.loadError / notFound / notFoundDescription, bilingual
  - after-actions-page:degraded.engagementMissing, bilingual
  - frontend/tests/e2e/after-action-detail-error.spec.ts — the forced-query-error oracle
  - the corrected WRITE-02 register prose and the D-12 correction note
affects: [94-09, 94-10, 95-routes, 99-i18n-masks]

tech-stack:
  added: []
  patterns:
    - 'compose-in-code join: batched .in(id, ids) lookups replacing PostgREST embeds where no FK exists'
    - 'degraded row state: engagement === null renders a named warn label, the row stays listed and navigable'

key-files:
  created:
    - scripts/probe-after-actions-list.mjs
    - frontend/tests/e2e/after-action-detail-error.spec.ts
  modified:
    - supabase/functions/after-actions-list-all/index.ts
    - frontend/src/hooks/useAfterAction.ts
    - frontend/src/routes/_protected/after-actions/$afterActionId.tsx
    - frontend/src/components/after-actions/AfterActionsTable.tsx
    - frontend/src/components/after-actions/__tests__/AfterActionsTable.test.tsx
    - frontend/src/i18n/{en,ar}/common.json
    - frontend/src/i18n/{en,ar}/after-actions-page.json
    - .planning/REQUIREMENTS.md
    - .planning/phases/94-write-paths/94-CONTEXT.md

key-decisions:
  - 'The two-query rewrite is the fix, not a repoint and not a new FK — no table holds the FK (D-12 as corrected by RULING-P94-04 §PARK-94-05)'
  - 'The 500 branch was sanitized as part of the rewrite: it was leaking the raw PostgREST message (D-08, threat T-94-12)'
  - 'AfterActionRecordWithJoins was widened to the nullable composed shape in the SAME commit as the producing function (C9a)'
  - 'The detail route keeps its existing error region and gains role="alert" rather than swapping in QueryErrorState — QueryErrorState renders errors.queryFailed.* and cannot render loadError, which the gate and the criterion both require'

patterns-established:
  - 'A probe that compares the function id set against the base table id set read as the same user is how "nothing is hidden" becomes observable — an inner join drops rows with no error at all'

requirements-completed: [WRITE-02]

duration: 71 min
completed: 2026-08-16
---

# Phase 94 Plan 07: After-actions list + detail translated copy Summary

**`after-actions-list-all` now composes its engagement/dossier context in code from two batched
`.in('id', ids)` lookups — because the live catalog proves no FK exists to embed through — and the
detail route can only ever render translated copy, with a half-joined record shown as visibly
incomplete instead of invisible.**

## Performance

- **Duration:** 71 min
- **Started:** 2026-08-16T14:49:00Z
- **Completed:** 2026-08-16T16:00:00Z
- **Tasks:** 3
- **Files modified:** 13 (2 created)

## THE GATE DRILL — every gate, both directions, real output

`ACCEPTANCE-P94-EXEC.md` condition 1. All three gates read `exit=1` on the undone tree and `exit=0`
after the work, with the commands run verbatim as the plan wrote them.

<!-- prettier-ignore -->
| gate | RED before (command + actual output) | GREEN after (command + actual output) | notes |
| --- | --- | --- | --- |
| `94-07_g1` (:129) | `test -f scripts/probe-after-actions-list.mjs && test "$(grep -c '!inner' supabase/functions/after-actions-list-all/index.ts)" -eq 0 && grep -q ".in('id'" … && node scripts/probe-after-actions-list.mjs` → **`exit=1`**, no stdout. Clause attribution run separately, so the red is provably the gate's subject and not a tooling failure: `test -f probe` → `exit=1` (`ls: scripts/probe-after-actions-list.mjs: No such file or directory`); `grep -c '!inner' index.ts` → **`2`**; `grep -q ".in('id'" index.ts` → `exit=1`. All three sub-clauses red on their own subject. | Same command verbatim → **`exit=0`**, stdout: `records visible to this user : 1` / `engagement ids : 1` / `of which missing extension : 1` / `status=draft -> 200, 1 row(s), total=1` / `status=published -> 200, 0 row(s), total=0` / `status=edit_requested -> 200, 0 row(s), total=0` / `status=edit_approved -> 200, 0 row(s), total=0` / `rows returned across all statuses : 1` / `rows with engagement === null : 0` / `rows with dossier === null : 0` / `rows with engagement_date === null: 1` / `PASS — deployed function answers 200 with the composed shape and hides nothing`. Re-run against the committed tree after both commits: `exit=0`. | Probes the DEPLOYED artifact (D-19), not source. See "What the green does and does not prove" below. |
| `94-07_g2` (:165) | Full chain verbatim → **`exit=1`**. Per-clause, again to attribute the red: common-key clause `exit=1` (`loadError`/`notFound`/`notFoundDescription` absent from `afterActions` in both locales); `degraded.engagementMissing` clause `exit=1`; `grep -q "common:afterActions.loadError" '$afterActionId.tsx'` → `exit=1`; `grep -cE "err\.message" '$afterActionId.tsx'` → **`1`** (needs 0); `test -f tests/e2e/after-action-detail-error.spec.ts` → `exit=1`. | Same command verbatim → **`exit=0`**. Component suite: `Test Files 1 passed (1) / Tests 10 passed (10)` (was 8; +2 degraded-row cases). Spec: `1 passed (13.3s)`. `pnpm type-check` → `tsc --noEmit`, clean. | Discovery asserted before the run: `playwright test … --list` → `Total: 1 test in 1 file`, so the `1 passed` grep is pinned to a hardcoded count and cannot silently partial-run. |
| `94-07_g3` (:193) | `grep -q 'PGRST200' .planning/REQUIREMENTS.md && grep -q 'PARK-94-05' 94-CONTEXT.md && grep -q '\*\*D-12:' 94-CONTEXT.md` → **`exit=1`**. Per-clause: `grep -c 'PGRST200' REQUIREMENTS.md` → **`0`** (`exit=1`); `grep -c 'PARK-94-05' 94-CONTEXT.md` → **`0`** (`exit=1`); `grep -c '\*\*D-12:' 94-CONTEXT.md` → **`1`** (`exit=0`). | Same command verbatim → **`exit=0`**, both before and after the commit. | **Clause 3 was ALREADY GREEN before the work — it is a REGRESSION GUARD, stated explicitly.** It exists so the correction cannot be written by deleting or renumbering the `**D-12:**` marker the coverage extractor keys on. Verified positively rather than by the gate alone: `node scripts/decision-coverage.mjs .planning/phases/94-write-paths 94-CONTEXT.md` → `"uncovered": []` after the edit. Clauses 1 and 2 are the real red→green. |

### Instrument tests run before any zero was believed

Three of this phase's named traps fired during this leg and were caught by control rather than by
luck. Recorded because the next author will otherwise repeat them:

1. **`grep` clause validity.** `grep -c '\*\*D-12:' 94-CONTEXT.md` returned `1` on the undone tree —
   a known-present positive control — before any of the sibling zeros were trusted.
2. **The C9b sweep's `sed` escape silently emptied its own pattern.** BSD `sed` rejected
   `s/[][.*+?^${}()|\\]/\\&/g` (`unbalanced brackets`), `esc` came back empty, the pattern degenerated
   to `\b\b`, and **all four identifiers reported "(none)"**. A positive control on a token known to
   exist exposed it. A clean sweep would otherwise have been recorded.
3. **zsh does not word-split `$ROOTS`,** so the multi-root form passed a single newline-joined
   argument and again reported "(none)". A `bash -c` + `mapfile` rewrite then ran past the 120s
   timeout by recursing into `node_modules`. The form that actually works here is
   `find … -prune … -print > list` then `xargs /usr/bin/grep -lE < list` — note `xargs -a` is GNU-only
   and absent on this machine, and `command` is a shell builtin so `xargs command grep` cannot work.

### What the green does and does not prove — g1, stated rather than assumed

The probe runs against the deployed bundle, so its green is behavioural. Two honest limits:

- **NOT CONSTRUCTED: the probe was never run against a live inner-join bundle.** Doing so means
  redeploying a known-broken function to shared staging. The old failure mode was instead reproduced
  read-only through PostgREST with the function's exact pre-change select list, as the test user:
  `code = PGRST200`, `message = "Could not find a relationship between 'after_action_records' and
'engagements' in the schema cache"`, `hint = "Perhaps you meant 'attachments' instead of
'engagements'."` That is the error the handler turned into a 500 for every caller.
- **The population is one record.** Staging holds exactly one `after_action_record` (`905b6a3a…`,
  `draft`). The probe derives its expectation instead of hardcoding it — it reads the base table as
  the same user under the same RLS and asserts the function's id set covers it — but a one-row
  population cannot exercise a partial drop. The `dossier === null` arm has no live instance and is
  therefore code-verified only, not observed.

The probe's "nothing hidden" arm is nonetheless the only thing that can catch the actual bug class:
an inner join drops rows with **no error at all**, so a 200 and an absence of exceptions is not
evidence. Absence is a FAILURE in this probe, never a pass.

### The two new oracles were observed failing on their subjects

Neither was accepted on a first green.

- **`AfterActionsTable` degraded-row tests (the D-13 oracle).** Controlled A/B: the component's
  degraded branch was removed and the suite re-run → `Tests 2 failed | 8 passed (10)`, both failing
  with `TestingLibraryElementError: Unable to find an element with the text:
degraded.engagementMissing`, and the dumped DOM showing `href="/after-actions/r-degraded"` — i.e.
  the row rendered, the label did not. Branch restored → `Tests 10 passed (10)`.
- **`after-action-detail-error.spec.ts`.** The three touched files were restored to their exact
  pre-fix state from `HEAD` (dot-form `t()`, no `role="alert"`, `loadError` absent from both locale
  bundles) and the spec re-run → **`1 failed`**, `Error: expect(locator).toBeVisible() failed /
Expected: visible / Error: element(s) not found`. The work was then restored and the spec re-run →
  `1 passed`. The failure is the positive assertion, not the negative one, which is the point: "no
  error shown" can never pass this spec.

## Accomplishments

- **The list write path actually reads.** `after-actions-list-all` returns 200 with composed rows
  instead of 500-ing every caller, and is redeployed — deploy evidence below.
- **A half-joined record is visible instead of invisible.** The live `905b6a3a…` row ships with
  `engagement_date: null` and the table names it rather than dropping it.
- **The detail page can only render translated copy** — the missing keys exist in both locales and
  the repaired call sites use the colon form.
- **The falsified diagnosis is corrected where it was filed**, in the same commit as the code that
  disproves it.

## Task Commits

1. **Task 1 + Task 3 (one commit, as `RULING-P94-04` cross-cutting order 1 requires)** — `76b46bb8`
   (`fix`). The fn rewrite, the redeploy's probe, the C9a hook widening, **and** both register
   corrections. Both sides carry real content change: 131 lines changed in `index.ts`, 5 in
   `REQUIREMENTS.md`, 16 in `94-CONTEXT.md`, plus a 220-line new probe.
2. **Task 2** — `6765e4fa` (`fix`). Bilingual keys, colon-form repairs, the degraded row, the two
   component oracles and the new e2e spec.

`git show --stat` was read for both; `git show HEAD:frontend/src/i18n/en/after-actions-page.json`
and `git show HEAD:frontend/src/i18n/ar/common.json` were read back to confirm the committed content
(`"engagementMissing": "Engagement details unavailable"`; `loadError` at AR line 630).

## Deploy evidence (D-19)

```
$ supabase functions deploy after-actions-list-all --project-ref zkrcjzdemdmwhearhfgg
Bundling Function: after-actions-list-all
Deploying Function: after-actions-list-all (script size: 84.15kB)
Deployed Functions on project zkrcjzdemdmwhearhfgg: after-actions-list-all
You can inspect your deployment in the Dashboard: https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions
DEPLOY_EXIT=0
```

The probe was then run against that deployment and passed. A source-only repair would have left the
deployed bundle 500-ing; this is the half `grep` cannot see.

## The derivations, live

Run against staging `zkrcjzdemdmwhearhfgg` on 2026-08-16, not inherited from RESEARCH:

- `pg_constraint` on `public.after_action_records`, `contype='f'` → **5 rows, every one
  `REFERENCES auth.users(id)`** (`created_by`, `updated_by`, `published_by`, `edit_requested_by`,
  `edit_approved_by`). Also present: `after_action_records_engagement_id_key UNIQUE (engagement_id)`
  and the PK — a unique constraint, **not** a foreign key.
- Reverse FK sweep (`confrelid = after_action_records`) → the four child embeds the rewrite KEEPS
  (`decisions`, `aa_commitments`, `aa_risks`, `aa_follow_up_actions`) each carry a real
  `after_action_id` FK. Only the engagement/dossier embeds were unresolvable.
- `engagement_dossiers` columns → keyed by `id` (the dossier id), `start_date timestamptz NOT NULL`.
  This is the extension-table shape, so the batched lookup is `.in('id', engagementIds)`.
- The live record: `905b6a3a…`, `publication_status = draft`,
  `engagement_id = dossier_id = 7c0d830b…`, present in `dossiers` (1) and **absent from
  `engagement_dossiers` (0)**. This is why the probe derives its status population instead of using
  the function's `published` default — a single default call would have measured an empty list and
  called it green.

## C9b consumer sweep (every shipped phase, not just this one)

Derived over **794** test files across all four test roots plus the colocated `src/**/__tests__`
dirs, after the instrument failures recorded above were fixed. Candidates triaged:

<!-- prettier-ignore -->
| consumer | verdict |
| --- | --- |
| `frontend/src/hooks/__tests__/useAfterActionsAll.test.ts` | REAL consumer of the hook contract; mocked at the invoke boundary so it is a NON-ORACLE for the server fix. Reads `engagement?.title_en` — unaffected by the nullable widening. Re-run: green. |
| `frontend/tests/component/after-action-route-wiring.test.tsx` | Consumer of `@/hooks/useAfterAction` (importActual) but of the **engagement** route, not `$afterActionId.tsx`. Asserts `'Failed to publish after action'` resolves — the same key this plan makes render alone, so it corroborates the D-08 change. Re-run: green. |
| `frontend/src/components/after-actions/__tests__/AfterActionsTable.test.tsx` | REAL consumer of the component I changed — **extended in the same task**, per C9b (a). |
| `frontend/tests/unit/i18n/phase-42-i18n-parity.test.ts` | REAL consumer of `after-actions-page.json` EN↔AR parity. `degraded.*` landed in both locales, so it stays green. Re-run: green. |
| `frontend/tests/e2e/after-actions-page.spec.ts` | Asserts `table.tbl` visible, `≥5 th`, and row-click navigation. The degraded change alters cell CONTENT only, never the table's structure or the row's link. NAMED non-consumer. |
| `frontend/tests/e2e/after-action-publish.spec.ts` | Checked against the `:109` change as the plan required. Its only publish-copy locator is `text=After-action published successfully` (`publishSuccess`, untouched); it has **no locator for `publishFailed` or any raw error message**. NAMED non-consumer. Separately note it navigates to `/after-action/create`, a route that does not exist — pre-existing and out of scope. |

Also re-ran `node scripts/check-i18n-namespaces.mjs` → `OK: 1713 file(s) scanned, 802 static
namespace literal(s) checked against 128 registered namespaces`.

## Decisions Made

- **The detail route keeps its existing error region rather than swapping in `QueryErrorState`.**
  94-UI-SPEC §4 permits either ("or the route's existing error region if one exists — never new
  markup"), and the choice is forced: `QueryErrorState`'s page variant renders
  `errors.queryFailed.title`/`.description` and accepts only a bilingual **server envelope**
  (`message_en`/`message_ar`) as an override. It cannot render `common:afterActions.loadError`, which
  both `94-07_g2` and the criterion require. The P93 vocabulary is honoured by adding `role="alert"`
  to the existing region — an attribute on markup that already exists, not new markup, and the only
  thing a DOM oracle can key on given that an RLS denial reads as an empty 200 (W1).
- **`role="alert"` went on the container `div`, not the `Card`.** `Card` re-exports HeroUI's
  primitive, and HeroUI's `filterDOMProps` is already on record in this project for dropping
  attributes it does not recognise. A plain `div` cannot silently swallow it.
- **The degraded label sits INSIDE the row's existing `<Link>`,** so the row stays navigable — the
  UI-SPEC's "the row present, navigable, never hidden" is a property of the anchor, not of the text.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] The 500 branch was leaking the raw PostgREST message**

- **Found during:** Task 1
- **Issue:** `index.ts:104-108` and the catch-all at `:123-130` both returned
  `JSON.stringify({ error: error.message })` to the client. The plan's action text says the branch
  "keeps returning a sanitized error (never raw error.message to the client **if it does not already**)"
  and the threat register's `T-94-12` disposition says the "500 branch stays sanitized" — both read as
  though it already was. It was not: every caller received the raw PostgREST string, which is the
  `LEAK-ATTACH-01` class D-08 exists to prevent, and on this exact function that string was the
  schema-cache hint naming internal table names.
- **Fix:** a single `internalError(where, detail)` helper — `console.error` for diagnostics,
  `{ error: 'internal_error' }` with status 500 to the client. Applied to the base query, both new
  lookups, and the catch-all.
- **Files modified:** `supabase/functions/after-actions-list-all/index.ts`
- **Verification:** no consumer renders the message — `useAfterActionsAll` throws the invoke error and
  `AfterActionsTable` renders `t('error.list')`. `useAfterActionsAll.test.ts` re-run green.
- **Committed in:** `76b46bb8`

**2. [Rule 3 - Blocking] `AfterActionRecordWithJoins` had to be widened in Task 1's commit, not Task 2's**

- **Found during:** Task 1
- **Issue:** the plan lists `useAfterAction.ts` under Task 2 and says to touch it "ONLY if the response
  contract changed in Task 1 (C9a same-edit rule)". It did change: emitting `engagement: null` against
  a declared `engagement?: {…}` (i.e. `… | undefined`) makes the component's `r.engagement === null`
  comparison a TS2367 error, and `engagement_date` is now genuinely nullable. C9a requires the consumer
  to be repointed in the **same edit** as the producer, which puts it in Task 1's commit.
- **Fix:** both sides widened to `| null`, `engagement_date: string | null`, with the reason recorded in
  the docblock.
- **Files modified:** `frontend/src/hooks/useAfterAction.ts`
- **Verification:** `pnpm type-check` clean; `useAfterActionsAll.test.ts` green.
- **Committed in:** `76b46bb8`

---

**Total deviations:** 2 auto-fixed (1 missing-critical/security, 1 blocking/coherence).
**Impact on plan:** both are required for correctness; neither widens scope. No schema change was
made — the `42P17` migration remains the phase's only one, as `D-12`'s correction and this plan's
notes both require.

## Issues Encountered

**A backup loop collided on `basename` and briefly wrote Arabic content into `en/common.json`.**
During the e2e RED-direction A/B, `cp "$f" "$B/$(basename "$f").mine"` mapped both
`frontend/src/i18n/en/common.json` and `.../ar/common.json` to the same backup path, so the AR copy
overwrote the EN one and the restore step then wrote AR content into the EN file. Caught immediately
by reading the file head (`"title": "السمة"` where `"Theme"` belongs). Repaired deterministically
rather than from the corrupt backup: both files were rebuilt from `HEAD` — verified clean with
`git status --short` returning empty for both paths — and the three-key insertion re-applied through
`Edit`. Final integrity check: `git diff` against `HEAD` for the two files is **exactly `3 +++` each,
6 insertions, 0 deletions**, with the EN additions in English and the AR additions in Arabic.
This is the same class as the standing `absolute-paths-in-destructive-commands` lesson — a derived
path that silently aliases two distinct inputs. The durable form is to key backups on the full
relative path, not the basename.

**Two prettier index/worktree ping-pongs.** The pre-commit formatter removed one blank line in
`94-CONTEXT.md` and reflowed one line in `AfterActionsTable.test.tsx`, leaving a stale staged diff
after each commit. `git diff HEAD -- <path>` was empty in both cases (worktree == HEAD), so each was
cleared with a path-scoped `git reset -q HEAD -- <path>`, which touches the index only. No
`git checkout`, `git restore`, `git stash`, or `git clean` was run at any point.

## Named exclusions carried forward, not silently skipped

- **The `conflict.*` sibling group on `$afterActionId.tsx` (`:106`, `:166-167`, `:179`) still survives
  on inline-English defaults.** This is the AR-04a mask population and belongs to **Phase 99**. Left
  exactly as found, per the plan's own must-have. It renders English in Arabic today.
- **Untouched resolving dot-form calls elsewhere on the page were NOT converted** — the i18n dot-form
  class fix is Phase 99's. Note that `t('common.error')` at `:64` resolves (there is a nested
  `common.error` = "Error" inside `common.json`) and was left alone.
- **Arabic naturalness is an OPERATOR park.** The four AR values added here (`loadError` from the
  UI-SPEC Copywriting Contract; `notFound`/`notFoundDescription`/`degraded.engagementMissing`
  authored to it) are grammatical, on-glossary and key-set-equal to their EN twins. **Their
  naturalness is UNREVIEWED and this artifact claims nothing about it.** Pixel-level RTL rendering is
  likewise unverified — the honest bar here is key-set equality plus EN≠AR string inequality, both
  gated.

## Threat Flags

None. The two boundaries in the plan's threat model were both addressed rather than merely accepted:
`T-94-12` (the batched lookups run on the same JWT-scoped client — no service-role widening — and the
500 branch is now genuinely sanitized) and `T-94-13` (the `err.message` operand removed, colon-form
keys, and the spec's copy-rule assertion that no `PGRST`/`42P17`/`23502` pattern renders). Zero
package installs (`T-94-SC`). No new endpoint, auth path, or schema change was introduced.

## GATE CONCERN

None. No `<automated>` gate text was edited, and none needed to be.

## Self-Check

- `[ -f scripts/probe-after-actions-list.mjs ]` → FOUND
- `[ -f frontend/tests/e2e/after-action-detail-error.spec.ts ]` → FOUND
- `git log --oneline --all | grep 76b46bb8` → FOUND
- `git log --oneline --all | grep 6765e4fa` → FOUND
- All three gates re-run verbatim against the committed tree: `g1 exit=0`, `g2 exit=0`, `g3 exit=0`
- `node scripts/decision-coverage.mjs .planning/phases/94-write-paths .planning/phases/94-write-paths/94-CONTEXT.md` → `"uncovered": []`

## Self-Check: PASSED

## BLOCKED

None.

## Next Phase Readiness

- `WRITE-02` is closed behaviourally on both halves: the deployed list function answers 200 with the
  composed shape, and the detail route's error surface is translated and alert-labelled.
- **For 94-09 / 94-10 (the later `REQUIREMENTS.md` writers):** this plan's edit is confined to the
  `WRITE-02` bullet — one replaced line plus three sub-bullets at §WRITE. Wave 1's `94-02` WRITE-03
  correction was read and preserved untouched.
- **Open, and owned elsewhere:** the `conflict.*` inline-English group (Phase 99); Arabic naturalness
  and pixel RTL (operator parks); the `dossier === null` arm of the composed shape has no live
  staging instance and so is code-verified only — a future seed that creates one would make it
  observable.

---

_Phase: 94-write-paths_
_Completed: 2026-08-16_
