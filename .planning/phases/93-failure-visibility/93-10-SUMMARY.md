---
phase: 93-failure-visibility
plan: 10
subsystem: ui
tags: [tanstack-query, supabase-functions, playwright, cdp, error-states, react]

# Dependency graph
requires:
  - phase: 93-01
    provides: 'QueryErrorState — the one shared query-error component (variant inline used by both surfaces here)'
provides:
  - 'useTagAnalytics fetches the real tag-hierarchy/analytics endpoint (mv_tag_usage_analytics) instead of resolving a hardcoded zero-object'
  - "TagAnalytics error branch keys on isError ONLY — the `error || !stats` collapse that rendered 'Failed to load tags' over a SUCCESS is gone"
  - "AttachmentUploader renders QueryErrorState inline on a rejected attachments query; 'No attachments yet' is gated on !isError"
  - 'tests/e2e/93-tags-attachments-error.spec.ts — 2 CDP-forced rendering oracles, one per surface, positive-controlled'
affects: [93-verification, phase-100-dbsec, phase-102-delegations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'CDP block patterns must be anchored on /functions/v1/ — a bare substring also matches Vite dev module URLs'
    - 'Query-error branches key on isError; empty vocabulary renders only on a RESOLVED-empty result'

key-files:
  created:
    - tests/e2e/93-tags-attachments-error.spec.ts
  modified:
    - frontend/src/domains/tags/hooks/useTagHierarchy.ts
    - frontend/src/components/tags/TagAnalytics.tsx
    - frontend/src/components/positions/AttachmentUploader.tsx

key-decisions:
  - 'D-25 applied literally: repointed useTagAnalytics at the existing tag-hierarchy/analytics endpoint rather than inventing a shape. Measured the live response — 200, 13 rows, 16 columns — and aligned TagAnalyticsRow to the columns that actually exist.'
  - "CDP block patterns anchored on /functions/v1/. A bare `*tag-hierarchy*` also matched Vite's dev module URL for src/types/tag-hierarchy.types.ts, tore a hole in the module graph and took the whole /tags route into the router error boundary — a page-level error that mimics the surface failing."
  - 'The attachments-query retry cap the plan asks for was NOT applied: the option lives in frontend/src/hooks/usePositionAttachments.ts, which is not in this plan’s files_modified. PARKed, not silently skipped.'

patterns-established:
  - 'Positive control before claiming an oracle green: disable the new branch, observe the spec go red on the intended assertion, restore, re-measure.'
  - "Verify the dev server actually serves the code on disk before trusting an E2E result — this machine's Vite watcher dies after one change."

requirements-completed: [TRUST-02]

# Metrics
duration: 40 min
completed: 2026-08-16
---

# Phase 93 Plan 10: Tag Analytics + Position Attachments Honest Rendering Summary

**Repointed the Tag Analytics stub at `tag-hierarchy/analytics` so the component's error branch keys on a real `isError` instead of painting "Failed to load tags" over a success, gave the position-attachments section the inline error branch its `data: x = []` mask suppressed, and proved both with a positive-controlled two-test CDP oracle.**

## Performance

- **Duration:** ~40 min
- **Started:** 2026-08-15T22:45Z
- **Completed:** 2026-08-15T23:12Z
- **Tasks:** 2 / 2
- **Files modified:** 3 modified, 1 created

## Accomplishments

- **The inverse lie is structurally impossible now.** `stats` is always computed (from `analytics?.data ?? []`), so `!stats` cannot participate in an error condition; the branch is `if (isError)` and nothing else. A resolved-empty dataset renders the existing empty vocabulary (`noAssigned` / `noAvailable`); a rejection renders `QueryErrorState variant="inline"`.
- **The stub is gone.** `useTagAnalytics` invokes `tag-hierarchy/analytics` (GET), throws on error, retry capped at 2.
- **A1 (the plan's open assumption) resolved in the GOOD direction and was MEASURED, not assumed** — see the A1 section below. The MV is populated and readable by the test user.
- **The attachments mask is closed.** `isError` is destructured; the empty copy is gated on `!isError`.
- **Both oracles are positive-controlled** — disabling the two new branches turns both tests red on exactly the `query-error-inline` assertion.

## Task Commits

1. **Task 1: Repoint the stub; error branch keys on isError** — `a19ffb6d` (fix)
2. **Task 2: AttachmentUploader inline error + the two-surface spec** — `3967a310` (fix)

## Files Created/Modified

- `frontend/src/domains/tags/hooks/useTagHierarchy.ts` — `useTagAnalytics` repointed at `supabase.functions.invoke('tag-hierarchy/analytics', { method: 'GET' })`, throws on error, `retry: 2`; `TagAnalyticsEnvelope` describes the endpoint's `{ data, total, last_refreshed }` shape.
- `frontend/src/components/tags/TagAnalytics.tsx` — error branch is `if (isError)`; `stats` non-nullable; `QueryErrorState` inline with retry; `TagAnalyticsRow` aligned to the measured MV columns; refresh-button comment corrected.
- `frontend/src/components/positions/AttachmentUploader.tsx` — `isError`/`isRefetching`/`refetch` destructured; inline error branch added; empty copy gated on `!isError`.
- `tests/e2e/93-tags-attachments-error.spec.ts` (NEW) — two CDP-forced oracles, 92-template clone (inline auth, `--no-deps`, 15s retry-backoff budgets, DOM-only assertions).

---

## GATE EVIDENCE — RED before, GREEN after

Both gates were observed in both directions. Commands are verbatim from the plan's `<automated>` blocks; no gate text was edited.

| gate         | RED before (command + output)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | GREEN after (command + output)                                                                                                                                                                                                                                                       | notes                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **93-10_g1** | `cd frontend && F=src/domains/tags/hooks/useTagHierarchy.ts && test -f "$F" && test "$(grep -v '^[[:space:]]*//' "$F" \| grep -c 'Promise\.resolve({ totalTags')" -eq 0 && grep -q 'tag-hierarchy/analytics' "$F" && test "$(grep -v '^[[:space:]]*//' src/components/tags/TagAnalytics.tsx \| grep -cE 'error \|\| !stats')" -eq 0 && pnpm type-check` → **`g1 EXIT=1`**. Clause decomposition at the same tree: `test -f $F -> pass`; `stub-literal count (expect 0, actual): 1`; `grep tag-hierarchy/analytics -> FAIL-absent`; `'error \|\| !stats' count (expect 0, actual): 1`. | Same command verbatim → **`g1 EXIT=0`** (`tsc --noEmit` printed no diagnostics). Re-confirmed twice more: once after the positive-control restore, and once on the final committed state at `3967a310`.                                                                              | RED is attributable to the subject on 3 of 4 clauses (stub present, endpoint absent, collapse present). `pnpm type-check` never ran in the RED because of `&&` short-circuit — see GATE CONCERN 1. |
| **93-10_g2** | `cd frontend && grep -q 'isError' src/components/positions/AttachmentUploader.tsx && grep -q 'QueryErrorState' src/components/positions/AttachmentUploader.tsx && cd .. && OUT=$(pnpm exec playwright test tests/e2e/93-tags-attachments-error.spec.ts --project=chromium-en --no-deps 2>&1) && echo "$OUT" \| grep -qE '\b2 passed'` → **`g2 EXIT=1`**. Decomposition from `frontend/`: `isError count in AttachmentUploader.tsx: 0`; `QueryErrorState count: 0`; `spec file exists: NO`.                                                                                            | Same command verbatim → **`g2 EXIT=0`**, with the captured tail: `✓ 1 … blocked tag-hierarchy renders the shared inline error in the analytics panel (6.3s)` / `✓ 2 … blocked attachments renders the shared inline error, never "No attachments yet" (11.2s)` / `2 passed (11.6s)`. | All three RED clauses are the subject (the branch, the component, the spec file). GREEN measured against a dev server **verified to serve the on-disk code** — see MEASUREMENT HAZARD.             |

### Positive control (the oracle is not vacuous)

`2 passed` alone does not establish that the tests measure this plan's work. Both new branches were disabled in place (`if (isError && CONTROL_DISABLED)` with `CONTROL_DISABLED = false`; `{!isLoading && isError && false && …}`; the `!isError` guard on the empty copy removed), and the spec re-run:

```
✘ 2 … blocked tag-hierarchy renders the shared inline error in the analytics panel (20.1s)
    Error: expect(locator).toBeVisible() failed / element(s) not found
      - waiting for getByRole('tabpanel').getByTestId('query-error-inline')
✘ 1 … blocked attachments renders the shared inline error, never "No attachments yet" (21.1s)
    Error: expect(locator).toHaveCount(expected) failed  Expected: 1  Received: 0
      - waiting for getByTestId('query-error-inline')
  2 failed
```

Both failed on exactly the intended assertion. The control edits were then reverted; `git diff --stat HEAD -- frontend/src/components/tags/TagAnalytics.tsx` returned empty (byte-identical restore) and `grep -cE "CONTROL_DISABLED|isError && false"` returned `0` for both files before the final measurement.

---

## MEASUREMENT HAZARD — a stale dev server produced a FALSE GREEN, and it was caught by the control

This is the most transferable finding in this plan and it belongs to the same class the phase is about: **a correct instrument pointed at the wrong tree.**

The first positive-control run returned **`2 passed` with both branches disabled** — i.e. it claimed the oracle passes without the work. The cause was not the spec: the Vite dev server on `:5173` (PID 69869, `vite@7.3.3`, started long before this session) had a **dead file watcher** and was serving pre-edit module transforms. The discriminating command:

```
$ curl -s "http://localhost:5173/src/components/positions/AttachmentUploader.tsx" | grep -nE "isError && false"
(no match)
$ grep -n "isError && false" frontend/src/components/positions/AttachmentUploader.tsx
326:      {!isLoading && isError && false && (
```

Disk and server disagreed. A cache-busted fetch (`?t=<epoch>`) returned the same stale body, and `touch`ing the file did not help — the watcher was gone, not merely lagging.

**Every E2E result in this SUMMARY was re-measured after restarting the server and confirming it serves the on-disk code**, e.g. `control marker in AttachmentUploader (want 0): 0`. The watcher dies again after each single change, so the protocol used here was: edit → restart server → verify served bytes → run.

Had the control not been run, this plan would have closed with a green that measured nothing. **`2 passed` from a long-lived dev server is not evidence unless the served bytes are checked.**

---

## A1 — the plan's open assumption, MEASURED

The plan flagged (A1) that `mv_tag_usage_analytics`' staleness and grants were unverified, and that an honest error/empty render would be the criterion-correct outcome if the MV were unreadable. **It is readable and populated**, so the good branch obtains:

```
$ curl -s -o /tmp/a1.json -w "HTTP_STATUS=%{http_code}\n" \
    "$SUPABASE_URL/functions/v1/tag-hierarchy/analytics" \
    -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer <TEST_USER jwt>"
HTTP_STATUS=200
keys: data,total,last_refreshed
total: 13
rows: 13
row0 cols: tag_id,name_en,name_ar,parent_id,hierarchy_level,color,is_active,total_assignments,
           dossier_count,document_count,brief_count,engagement_count,auto_assigned_count,
           avg_confidence,last_assigned_at,children_count
```

Service-role cross-check: `select count(*) from mv_tag_usage_analytics` → `13`.

**Column-for-column, with one correction.** All twelve fields the component actually reads are present. Two declared fields were not: `id` does not exist in the view at all, and the parent column is `parent_id`, not `parent_tag_id`. Neither is read anywhere in the component (rows key on `tag.tag_id`; `getTagName` takes only `name_en`/`name_ar`), so this was cosmetic — but D-25's claim is "matches column-for-column", and leaving a required-but-absent `id` in the interface is the quiet kind of mismatch this phase exists to remove. The interface was aligned to the measured columns.

---

## C9b — CROSS-PHASE CONSUMER MEASUREMENT

Sweep run against all **four** derived test roots (`./tests`, `./e2e/tests`, `./frontend/tests`, `./backend/tests`) — not a hardcoded `tests`, per the 2026-08-16 amendment:

| identifier               | consumers found                                     |
| ------------------------ | --------------------------------------------------- |
| `useTagHierarchy`        | none                                                |
| `useTagAnalytics`        | none                                                |
| `TagAnalytics`           | none                                                |
| `tag-hierarchy`          | none                                                |
| `usePositionAttachments` | none                                                |
| `AttachmentUploader`     | `frontend/tests/component/AfterActionForm.test.tsx` |

A colocated sweep (`frontend/src/**/*.test.tsx`) for the same four component/hook identifiers returned none.

**The named consumer, measured before and after:**

| when                                  | command                                                                        | result                                           |
| ------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------ |
| BEFORE (tree at `4e6ad6e8`, pre-edit) | `cd frontend && pnpm exec vitest run tests/component/AfterActionForm.test.tsx` | `Test Files 1 passed (1) / Tests 28 passed (28)` |
| AFTER (post Task 1 + Task 2)          | same command                                                                   | `Test Files 1 passed (1) / Tests 28 passed (28)` |

**No red, so no attribution experiment was needed.** The coupling is by basename only: `AfterActionForm.tsx:18` imports `../attachment-uploader/AttachmentUploader` — a **different file** (`frontend/src/components/attachment-uploader/AttachmentUploader.tsx`) from the one this plan modifies (`frontend/src/components/positions/AttachmentUploader.tsx`). Recording that explicitly so a future sweep does not re-open it as a live coupling.

---

## GATE CONCERN

Three observations. **No gate text was edited.** All three are recorded for the orchestrator to rule on; none of them made a gate falsely green.

**1. `93-10_g1`'s `pnpm type-check` clause is coupled to the WHOLE shared tree, not to this plan's subject (C2 relevance).**
`tsc --noEmit` covers all of `frontend/src`, so any concurrently-executing lane's half-finished edit reds this gate for a reason outside its subject. **Observed live**, not hypothesised: at 01:47 the baseline run returned `EXIT=2` with seven `TS6133` errors, all in `frontend/src/components/dossier/DossierShell.tsx` (a sibling Phase 93 plan's file), e.g. `DossierShell.tsx(32,1): error TS6133: 'QueryErrorState' is declared but its value is never read`. `git status --porcelain` was clean at session start and `git log phase-93-base..HEAD -- <file>` returned nothing, so those were another lane's **uncommitted, in-flight** edits. Five minutes later the same command returned `EXIT=0`. Consequence: a red on this gate must be attributed to a file before it is believed — the gate is sound about its own three greps but its fourth clause can be reddened by anyone.

**2. `93-10_g1`'s stub-literal negative grep strips only `//` lines, so a `/* */` block comment trips it (C8, exactly as C8 predicts).**
`grep -v '^[[:space:]]*//' "$F" | grep -c 'Promise\.resolve({ totalTags'` does not strip JSDoc/block-comment lines, which begin `*`. The plan's own action text effectively invites the author to document what was removed, and my first doc comment did exactly that: `* D-25: this was a refactor stub — \`Promise.resolve({ totalTags: 0, … })\``, which held the count at `1` with the stub genuinely deleted. **I rewrote my prose, not the gate** ("a refactor stub that resolved a hardcoded zero-object and never touched the network"), and the gate went green. Flagging so the next author of this file does not quote the literal in a comment and conclude the gate is broken.

**3. `93-10_g2` conflates "playwright exited non-zero" with "not 2 passed" (informational only).**
`OUT=$(pnpm exec playwright test …) && echo "$OUT" | grep -qE '\b2 passed'` short-circuits on a non-zero playwright exit, so the `grep` never runs on a failing suite. This is **stricter**, not looser — it cannot produce a false green — but it means the gate's failure output is empty rather than diagnostic. It also silently swallowed a real, informative failure once during this plan (the `chromium-en` project not existing when the command was accidentally run from `frontend/`, which resolves the frontend Playwright config instead of the root one). No change requested.

---

## Decisions Made

- **Repoint, don't invent (D-25).** `useTagAnalytics` now calls the existing `tag-hierarchy/analytics` route; the component keeps its own row-shape shim, which is the "one side, smallest diff" the plan permits. The hook returns the endpoint's envelope verbatim.
- **`stats` is non-nullable rather than error-guarded.** Making `stats` always computable is what makes the inverse lie _structurally_ impossible instead of merely currently-absent — there is no longer a value of `stats` that can route a success into the error branch.
- **The refresh button stays disabled.** `useRefreshTagAnalytics` is still a no-op mutation; enabling it would be a new lie in the opposite direction. Its comment was corrected — it previously asserted the analytics query was "also a fake-empty stub", which stopped being true in Task 1.
- **Block patterns anchored on `/functions/v1/`.** See the deviation below; the anchoring is required for correctness in dev, not just tidiness.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CDP block pattern `*tag-hierarchy*` over-matched Vite's dev module URLs**

- **Found during:** Task 2 (first spec run)
- **Issue:** The plan specifies blocking `*tag-hierarchy*`. Under `pnpm dev` Vite serves unbundled ES modules, so that pattern also matched `http://localhost:5173/src/types/tag-hierarchy.types.ts`. The module graph broke and the **entire `/tags` route** fell into the router error boundary — the page snapshot showed only `heading "Unable to load data" [level=2]` and no tablist at all, so the test timed out waiting for the analytics tab. A page-level error that looks exactly like the surface failing, for entirely the wrong reason.
- **Fix:** Anchored both patterns on the edge-function path — `*/functions/v1/tag-hierarchy*` and `*/functions/v1/positions/*/attachments*` — which cannot collide with a source path. Documented in the spec's `blockUrls` helper so the next author does not "simplify" it back.
- **Files modified:** `tests/e2e/93-tags-attachments-error.spec.ts`
- **Verification:** Both tests pass; the attachments test's `heading level=1` assertion (the position title, fetched via `/positions-get?position_id=…`) proves the block still discriminates.
- **Committed in:** `3967a310`

**2. [Rule 1 - Bug] `TagAnalyticsRow` declared two fields the materialized view does not return**

- **Found during:** Task 2 (A1 verification)
- **Issue:** `id: string` (required) does not exist in `mv_tag_usage_analytics`, and `parent_tag_id` is `parent_id` there. The `as unknown as` shim means TypeScript could never catch this.
- **Fix:** Dropped `id`, renamed `parent_tag_id` → `parent_id`. Confirmed by grep that neither is read (`key={tag.tag_id}`, `getTagName` takes only the two name fields).
- **Files modified:** `frontend/src/components/tags/TagAnalytics.tsx`
- **Verification:** `pnpm type-check` clean; `pnpm exec eslint … --max-warnings 0` clean; spec still 2/2.
- **Committed in:** `3967a310`

**3. [Rule 1 - Bug] The refresh button's comment became false in Task 1**

- **Found during:** Task 1
- **Issue:** The comment read "analytics query is also a fake-empty stub" — true before the repoint, false after. A stale comment asserting a lie, in a plan about surfaces that assert lies.
- **Fix:** Rewritten to state what remains true: the query is live, `useRefreshTagAnalytics` is still a no-op, and that is why the button stays disabled.
- **Files modified:** `frontend/src/components/tags/TagAnalytics.tsx`
- **Committed in:** `a19ffb6d`

### PARKED (not done, not silently skipped)

**4. The attachments-query retry cap was NOT applied — file out of scope.**

- Task 2's action says "Cap retries at 2 (invoke-backed)". That option belongs to `usePositionAttachments` in **`frontend/src/hooks/usePositionAttachments.ts`**, which is **not** in this plan's `files_modified`. The executor brief's hard rule 7 ("Only touch files in your plan's `files_modified`") is phase-failing, so the file was left alone.
- **Nothing depends on it:** neither `93-10_g2` nor any `<acceptance_criteria>` in this plan names a retry count (C10 — the criterion and the gate agree on its absence), and the spec's `RETRY_BACKOFF_TIMEOUT = 15_000` already accommodates the uncapped four-attempt ladder (both tests complete in 6.3s / 11.2s).
- **Cost of leaving it:** a blocked attachments query runs 4 attempts instead of 3, i.e. a longer skeleton before the error state. Cosmetic, and it does not affect which state renders.
- Task 1's equivalent cap **was** applied (`retry: 2` in `useTagHierarchy.ts`, which is in scope).

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs) + 1 parked (out-of-scope file).
**Impact on plan:** No scope creep. Deviation 1 was required for the oracle to measure its subject at all; 2 and 3 remove residual untruths in a file this plan already owns. The park is recorded above rather than absorbed.

## Issues Encountered

- **A false green from a stale dev server** — the dominant issue of this plan. Fully written up under MEASUREMENT HAZARD. Resolved by restarting the server and verifying served bytes before every recorded run.
- **A transient false red on `pnpm type-check`** from a sibling lane's uncommitted in-flight edits to `DossierShell.tsx`. Resolved by re-measurement (green five minutes later, and green on the final committed state). Recorded as GATE CONCERN 1 rather than acted on.
- **A stale index entry after the pre-commit hook reformatted `AttachmentUploader.tsx`.** `git commit -- <pathspec>` commits the working tree and bypasses the index, so the pre-prettier `git add` content stayed staged (`MM`). Cleared with `git reset -q -- <that one path>` after confirming `git diff HEAD -- <path>` was empty; this touches the index only and never the working tree, so no other lane's uncommitted work was at risk. All four of this plan's files are clean at `3967a310`; the other lanes' entries (`93-13-SUMMARY.md`, `DossierShell.tsx`, `WorkspaceShell.tsx`, both `ErrorBoundary.tsx`, two untracked 93 specs) were left exactly as found.

## Known Stubs

- `useRefreshTagAnalytics` (`useTagHierarchy.ts:184`) is still `mutationFn: () => Promise.resolve()`. The endpoint exists (`tag-hierarchy/refresh-analytics`, `index.ts:449-451`) but wiring it is a mutation path this plan neither gates nor was scoped to. **The UI is honest about it:** the refresh button is `disabled` with a "Not yet available" title, and its comment now says exactly which half is live.
- `useTagMergeHistory` / `useTagRenameHistory` remain `Promise.resolve([])` stubs. Pre-existing, untouched, out of scope — flagged only so a reader of `/tags` does not infer this plan covered them.

## Intended-broken register — respected, nothing repaired

None of the four deliberately-broken items were touched: `/delegations` still errors; `/admin/data-retention`'s legal-holds region still errors; `/admin/field-permissions`' filters are still silently never sent; `AUDIT-DROP-01` / `AUDIT-ZERO-01` remain filed to Phase 94. No `GRANT SELECT ON auth.users` was proposed or applied.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Criterion 2's last two surfaces hold, in both directions, with rendering oracles that were shown to discriminate.
- The `/tags` analytics surface is now a **live** read of `mv_tag_usage_analytics` (13 rows on staging today), so it will show real data on a natural visit — the phase-correct outcome, and the A1 fallback did not need to be taken.
- Two carry-forwards for whoever picks them up, neither blocking this plan: the `usePositionAttachments` retry cap (PARK 4 above) and the `useRefreshTagAnalytics` mutation (Known Stubs above).

## BLOCKED

None.

---

_Phase: 93-failure-visibility_
_Completed: 2026-08-16_
