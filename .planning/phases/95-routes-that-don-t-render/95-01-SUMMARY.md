---
phase: 95-routes-that-don-t-render
plan: 01
subsystem: ui
tags: [react, tanstack-query, edge-functions, search, error-states, playwright, vitest]

requires:
  - phase: 93-error-states
    provides: QueryErrorState (the one shared query-error surface) + the AssignmentQueue error-branch analog
provides:
  - adaptSearchEnvelope — the repository-seam adapter from the REAL deployed `search` envelope to DossierFirstSearchResponse
  - a second real request to the deployed `quickswitcher-search` for related_work (never fabricated as [])
  - DossierSearchPage isError branch (QueryErrorState variant page) — the zero-results state is now unreachable while the query is failing
  - tests/e2e/95-search-renders.spec.ts — the behavioural oracle for criterion 1
affects: [95-09 closing derivation, any phase that next deploys the `search` edge function]

tech-stack:
  added: []
  patterns:
    - 'Validate-or-throw at the repository seam: a body the client cannot read becomes an error state, never an empty result set'
    - 'Absent server data stays absent: fields no deployed function returns are optional in the type, not filled with plausible zeros'

key-files:
  created:
    - frontend/src/domains/dossiers/repositories/__tests__/dossiers.repository.search.test.ts
    - tests/e2e/95-search-renders.spec.ts
  modified:
    - frontend/src/domains/dossiers/repositories/dossiers.repository.ts
    - frontend/src/pages/DossierSearchPage.tsx
    - frontend/src/types/dossier-search.types.ts
    - frontend/src/components/search/DossierFirstSearchResults.tsx

key-decisions:
  - 'Fixed the CONTRACT at the repository seam, not the crash site — useDossierFirstSearch.ts:109 still reads searchQuery.data.dossiers.forEach and is now sound'
  - 'related_work comes from a second live quickswitcher-search request; a fabricated [] would answer a question the server was never asked (D-03)'
  - 'Unsourceable client-type fields (dossier stats/matched_fields, work-item created_at/dossier_context) were made OPTIONAL and left absent rather than zero-filled'
  - 'has_more_work compares against the quickswitcher 40% work slice, not the literal requested limit — the plan formula would have been structurally always-false'

patterns-established:
  - 'Crash-vs-honest-error discrimination in e2e: the router defaultErrorComponent shares QueryErrorState copy, so the discriminator is data-testid presence, never the heading text'
  - 'Classification of a debounced page state requires a network gate plus two identical readings — a single post-click reading records the pre-debounce flash'

requirements-completed: [DEAD-01]

duration: 78 min
completed: 2026-08-16
---

# Phase 95 Plan 01: /search Renders Real Results Summary

**`getDossierFirstSearch` now adapts the deployed `search` envelope (`data`/`count`/`metadata.has_more`) into the client contract and asks `quickswitcher-search` for the related-work half, so `/search` renders live results for a typed query and all four suggestion chips instead of crashing in `typeCounts`.**

## Performance

- **Duration:** 78 min
- **Started:** 2026-08-16T22:55Z
- **Completed:** 2026-08-17T00:13Z
- **Tasks:** 3
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments

- Root cause closed at the contract: the deployed `search` fn returns `{data, count, limit, offset, query, took_ms, warnings, metadata}` with no `dossiers` key; `adaptSearchEnvelope` maps it, and `useDossierFirstSearch.ts:109` (`searchQuery.data.dossiers.forEach`) is untouched and now sound. No `?.forEach`, no `|| []`.
- `related_work` is a real second question to the DEPLOYED `quickswitcher-search`, proven issued by a unit case that counts the requests, and observed live: `200 search?q=UN&limit=20&offset=0` + `200 quickswitcher-search?q=UN&limit=20`.
- A malformed body **throws** — the unit oracle's malformed cases fail on any coerce-to-empty implementation.
- `DossierSearchPage` consumes `isError` for the first time; the zero-results state is unreachable while the query is failing.
- Criterion 1 has a behavioural oracle that was **observed red on the undone tree and green after**, with the per-chip settled state recorded.

## Task Commits

1. **Task 1: Repository envelope adapter with real related-work** — `f593bf741` (fix)
2. **Task 2: DossierSearchPage error branch** — `2ec013b19` (fix)
3. **Task 3: Behavioural oracle 95-search-renders.spec.ts** — `0ad3b6d6b` (test)

## Files Created/Modified

- `frontend/src/domains/dossiers/repositories/dossiers.repository.ts` — `adaptSearchEnvelope` + the two-request `getDossierFirstSearch` (page/pageSize → limit/offset)
- `frontend/src/domains/dossiers/repositories/__tests__/dossiers.repository.search.test.ts` — 7 cases: real-envelope mapping, has_more passthrough, 4 malformed-THROWS assertions, malformed quickswitcher, request translation, two-requests-issued, either-rejection-rejects
- `frontend/src/pages/DossierSearchPage.tsx` — `isError` branch (`QueryErrorState variant="page"`, retry wired to `refetch`); work-item navigation suppressed rather than invented when no dossier context exists
- `frontend/src/types/dossier-search.types.ts` — the four unsourceable fields made optional, each with the reason in-file
- `frontend/src/components/search/DossierFirstSearchResults.tsx` — stat row and dossier-context badge render only when the server sent them
- `tests/e2e/95-search-renders.spec.ts` — 2 tests, natural network, `--no-deps`, inline auth

## GATE OBSERVATIONS (both directions)

### Task 1 gate — unit oracle + crash-site + range-scoped greps + type-check

**RED (undone tree, observed):**

```
pnpm exec vitest run src/domains/dossiers/repositories/__tests__/dossiers.repository.search.test.ts
 Test Files  1 failed (1)
      Tests  7 failed (7)          # adaptSearchEnvelope did not exist
```

Range-scoped grep controls against the HEAD artifact `2c80132088` (no checkout — `git show`):

```
sed range over getDossierFirstSearch at HEAD          -> 24 lines   # instrument: the range captures the body
  ... | grep -c 'apiGet'                              -> 1          # positive control
  ... | grep -cE 'quickswitcher-search|getQuickSwitcherSearch' -> 0 # RED: the gate's subject
file-level grep 'quickswitcher-search' at HEAD        -> 1          # vacuously green — why the gate is range-scoped
file-level grep 'adaptSearchEnvelope' at HEAD         -> 0          # RED
```

**GREEN (after Task 1, full gate verbatim):**

```
 Test Files  1 passed (1)
      Tests  7 passed (7)
> tsc --noEmit          (no output)
TASK1_GATE_EXIT=0
```

### Task 2 gate — page greps + type-check

**RED (HEAD artifact):** `QueryErrorState` → 0 occurrences, `isError` → 0 occurrences in `DossierSearchPage.tsx`.
**GREEN:** `TASK2_GATE_EXIT=0`; `error.message` occurrences in the page: **0**; `if (isError)` at line 182 precedes the first results render at line 267.

### Task 3 gate — e2e (labelled UNPROVEN pre-execution; both directions drilled)

**RED (undone tree, before Tasks 1–2 landed — the spec's assertion of record, not an environment error):**

```
TYPED-STATE: UN -> crash          Expected: "rows"   Received: "crash"
CHIP-STATE: Saudi Arabia -> crash  Error: chip "Saudi Arabia" hit the route error boundary
  2 failed
```

**GREEN (after Tasks 1–2, gate verbatim, exit captured directly):**

```
TASK3_GATE_EXIT=0
  2 passed (13.1s)
```

### CHIP-STATE (the four required lines, from the green run)

```
CHIP-STATE: Saudi Arabia -> rows
CHIP-STATE: UN -> rows
CHIP-STATE: G20 -> rows
CHIP-STATE: climate -> rows
```

Plus the typed-query arm: `TYPED-STATE: UN -> rows`. `rows` is only reachable when at least one result card exists — a fully empty response renders the "No results found" state instead, and the classifier reads that as `empty`. **All four chips returned results; none crashed; none fell back to empty or error.**

### Supporting live observation (out-of-tree probe, not a committed test)

Against the running app on staging data, after the fix:

```
=== EDGE REQUESTS ON /search?q=UN ===
200 search?q=UN&limit=20&offset=0
200 quickswitcher-search?q=UN&limit=20
result cards rendered: 2   ("UN ESCWA", "UN Statistical Commission"); summary "2 dossiers, 0 related items"
=== BLOCKED SEARCH (CDP Network.setBlockedURLs '*functions/v1/search?*') ===
query-error-state count: 1   role=alert count: 1   "No results found" count: 0   retry button visible: true
```

The second block is Task 2's behaviour **observed** rather than reasoned: with the search request failing, the page paints the shared error state with retry and the zero-results state is absent. It stays out of the committed spec because the plan mandates exactly 2 natural-network tests there.

## Decisions Made

- **Adapter identifier** is `adaptSearchEnvelope` exactly, as mandated.
- **`relevance_score` ← the server's `rank`** (`search/index.ts:242-257`): a rename of a real ordering value, not an invented score.
- **`matched_fields` ← `[matched_field]`**: quickswitcher names one matched field; the client type holds a list. A real value widened.
- **`related_work_total` ← `related_work.length`**: quickswitcher returns no totals, so the count it sent is the only honest total.
- **Work items with no dossier context are KEPT, not dropped.** `quickswitcher-search` attaches a dossier only where the row has one; tasks and commitments routinely arrive without. Filtering them out to satisfy a required client field would hide real work items behind a silent "none".
- **Navigation suppression over invention**: a work item with no dossier context and no own route (`document`, plus the default branch) does not navigate, mirroring the `getWorkItemUrl` suppression precedent.

## Client-type fields the adapter could NOT source from a real server response

Named per the plan's instruction — each is left ABSENT and made optional in `dossier-search.types.ts`, never zero-filled:

1. **`DossierSearchResult.stats` (`DossierStats`)** — neither `search` nor `quickswitcher-search` returns per-dossier counts (`quickswitcher-search` declares `stats?` and never populates it). The results card now renders the stat row only when stats are present. A zero-filled `DossierStats` would have rendered as "0 engagements, 0 documents…" — a fabricated fact about every dossier.
2. **`DossierSearchResult.matched_fields`** — no server source; the `search` fn computes a rank and a snippet, not a match breakdown. No consumer reads this field (swept: only the two type declarations).
3. **`RelatedWorkItem.created_at`** — `quickswitcher-search` sends `updated_at` only.
4. **`RelatedWorkItem.dossier_context`** — sent only where the row has an owning dossier (see the decision above).

## Deviation from the plan's literal `has_more_work` formula

The plan prescribed `has_more_work: related_work.length >= <the limit sent to quickswitcher>`. `quickswitcher-search` slices its work results to `Math.ceil(limit * 0.4)` before responding, so that comparison can never be true — it would ship a permanent "that is all there is" over responses that may well be truncated. Implemented as `>= Math.ceil(requestedLimit * 0.4)`, which is the same "a full slice means there may be more" heuristic the plan states, measured against the cap the server actually applies. The constant is named `QUICKSWITCHER_WORK_SHARE` and carries the source citation.

## NAMED OMISSION (carried forward, per the plan)

**The deployed `search` function's `validTypes` list is stale and is NOT fixed here.**
`supabase/functions/search/index.ts:99` still reads
`['country','organization','forum','engagement','theme','working_group','person']` — `theme` was
renamed to `topic` in the DB and `elected_official` was added. A `types=topic` filter therefore
**400s**, which now renders the error state truthfully rather than a lie. The default path is
unaffected: `filters.types` defaults to `'all'` and the repository adds no `types` param unless a
type filter is selected. No server deploy in this plan. **Deferred to whichever phase next deploys
`search`** — the fix is one line in the same edit as that deploy.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Unsourceable required fields would have replaced the forEach crash with a second crash**

- **Found during:** Task 1
- **Issue:** `DossierSearchResult.stats` and `RelatedWorkItem.dossier_context` are REQUIRED in the client type and are read unguarded at `DossierFirstSearchResults.tsx:302-330` and `:365,:370`. No deployed function returns either. Honouring the plan's "never invent a value" rule while leaving the type required is impossible; zero-filling them is the invention the rule forbids, and dropping context-less work items hides real rows.
- **Fix:** made the four unsourceable fields optional in `types/dossier-search.types.ts` (each with the reason in-file) and guarded the two render sites so the stat row and the context badge appear only when the server sent the data. `DossierSearchPage.handleWorkItemClick` suppresses navigation instead of dereferencing an absent context.
- **Files modified:** `frontend/src/types/dossier-search.types.ts`, `frontend/src/components/search/DossierFirstSearchResults.tsx`, `frontend/src/pages/DossierSearchPage.tsx`
- **Verification:** `pnpm type-check` clean; the live probe renders 2 real cards with no stat row and no crash; no other file in the tree consumes these fields (swept with an instrument control).
- **Scope note:** both extra files are outside this plan's declared `files_modified` and outside every other Phase 95 plan's write set (verified against all nine plans' `files_modified`), so no lane collision.
- **Committed in:** `f593bf741`

**2. [Rule 1 - Bug] The first draft of the e2e spec passed against known-broken HEAD**

- **Found during:** Task 3 red drill
- **Issue:** the draft classified the DOM immediately after the click. Clicking a chip sets the query but the hook debounces 300ms, so the page renders its zero-results state with no request in flight; the classifier recorded that flash as a settled `empty` and the spec passed on a tree that crashed a second later. It also matched the crash by heading text, which the router's `defaultErrorComponent` shares verbatim with `QueryErrorState`.
- **Fix:** classification is gated on the `search` response and requires two identical readings 300ms apart; the crash is discriminated by the ABSENCE of `data-testid="query-error-state"` beneath that shared heading.
- **Verification:** the rewritten spec goes red on the undone tree (`-> crash`) and green after (`-> rows`), both recorded above.
- **Committed in:** `0ad3b6d6b`

---

**Total deviations:** 2 auto-fixed (1 missing-critical, 1 bug in this plan's own new oracle)
**Impact on plan:** neither changes the plan's mechanism. Deviation 1 is the honest completion of the plan's own "never invent a value" instruction; deviation 2 repaired an instrument before it was trusted.

## Issues Encountered

**`frontend/tests/e2e/search-accessibility.spec.ts` is a pre-existing red consumer of `/search` — NOT repaired here (evidence, not assumption).**
Run after the fix: **4 passed, 11 failed** (`/tmp/95-01-c9b-consumer.txt`). 8 of the 11 fail waiting on `locator('input[role="searchbox"]')`; that attribute exists in **neither** the HEAD artifact `2c80132088` **nor** the current file (`git show … | grep -c 'searchbox'` → 0 in both), so those eight could not have passed before this plan either. The remaining three are an axe scan (violations `button-name`, `color-contrast` on app-shell and results markup), a result-count copy regex (`/\d+.*result/` vs the page's `"2 dossiers, 0 related items"`), and a focus-order check. Every one of them navigates to `/search?q=climate`, which crashed on the undone tree, so the baseline for all eleven was red. The spec targets a search UI this app does not have; repairing it is an a11y retrofit, a different subject from the envelope contract, and outside this plan's write set. Recorded rather than silently left.

## User Setup Required

None - no external service configuration required.

## BLOCKED

None.

## Next Phase Readiness

- Criterion 1 is closed behaviourally: `TYPED-STATE: UN -> rows` and all four `CHIP-STATE … -> rows`, with the red direction recorded.
- For the 95-09 closing derivation: **all four chips returned results** (not merely "did not crash").
- Carried forward for the phase register: the stale `validTypes` omission above, and `frontend/tests/e2e/search-accessibility.spec.ts` as a pre-existing red consumer of a route this phase made reachable.

---

_Phase: 95-routes-that-don-t-render_
_Completed: 2026-08-16_

SUMMARY-END
