---
phase: 95-routes-that-don-t-render
plan: 05
subsystem: ui
tags: [tanstack-router, routing, tabs, radix, playwright, e2e]

requires:
  - phase: 95-routes-that-don-t-render
    provides: 95-RESEARCH §DEAD-08 state table + inbound-link sweep; 95-UI-SPEC §5 tab contract
provides:
  - 'One owner for the /positions/:id dynamic slot ($positionId.tsx deleted)'
  - 'positions/$id.tsx as a slot layout: header + URL-driven tab strip + <Outlet/>'
  - 'positions/$id/index.tsx — the editor tab as a real child route'
  - 'legislation.tsx as a layout with <Outlet/>, making legislation/$id.tsx reachable'
  - 'legislation/index.tsx — the list body reading search via getRouteApi'
  - 'tests/e2e/95-slots-tabs.spec.ts — behavioural oracle for criterion 5'
affects: [positions, legislation, route-tree, e2e]

tech-stack:
  added: []
  patterns:
    - 'Flat route file + same-named directory = parent layout + children; children render only through the parent <Outlet/>'
    - 'Active tab derived from the matched child route (useChildMatches), navigation in onValueChange — never Link asChild (A2)'
    - 'A status set shared between the trigger conditional and the child redirect, so URL and tab strip cannot disagree'

key-files:
  created:
    - frontend/src/routes/_protected/positions/$id/index.tsx
    - frontend/src/routes/_protected/legislation/index.tsx
    - tests/e2e/95-slots-tabs.spec.ts
  modified:
    - frontend/src/routes/_protected/positions/$id.tsx
    - frontend/src/routes/_protected/positions/$id/approvals.tsx
    - frontend/src/routes/_protected/positions/$id/versions.tsx
    - frontend/src/routes/_protected/positions.tsx
    - frontend/src/routes/_protected/legislation.tsx
    - frontend/src/routeTree.gen.ts
  deleted:
    - frontend/src/routes/_protected/positions/$positionId.tsx

key-decisions:
  - '$id survives as the positions slot (one route-id repoint vs four+, children dir already $id/, Tabs live there)'
  - 'Deep link to /positions/:id/approvals for an out-of-set status replace-redirects to the editor index'
  - 'APPROVALS_TAB_STATUSES exported from $id.tsx and imported by the approvals child — one source of truth for the trigger set'
  - 'PositionAnalyticsCard mount dropped with $positionId.tsx — recorded as a named omission, component file left in place'

patterns-established:
  - 'Oracle assertion order: positive assertion first, absence checks second (toHaveCount(0) on an unrendered page passes vacuously)'
  - 'Opportunistic test arms annotate which branch they took, so an untaken branch cannot read as asserted'

requirements-completed: [DEAD-08]

duration: 37 min
completed: 2026-08-16
---

# Phase 95 Plan 05: Positions/Legislation Slot Consolidation Summary

**One owner for `/positions/:id` with URL-driven tabs behind a layout `<Outlet/>`, `legislation.tsx`
turned into a layout so its detail route can finally render, and a 3-test oracle that fails on the
pre-fix build and passes on this one.**

## Performance

- **Duration:** 37 min
- **Started:** 2026-08-16T19:47:00Z (first evidence artifact: C9b baseline, 22:52 local)
- **Completed:** 2026-08-16T20:24:00Z
- **Tasks:** 3
- **Files modified:** 9 (3 created, 5 modified, 1 deleted)

## Accomplishments

- Deleted the competing `positions/$positionId.tsx` dynamic slot. Both files registered the same
  level, so which one matched `/positions/<uuid>` was rank-order-undefined behaviour. The generated
  tree now carries **zero** `positionId` registrations.
- `positions/$id.tsx` is a layout: page header + tab strip + `<Outlet/>`. The tab value derives from
  the matched child, `onValueChange` navigates, and `approvals`/`versions` are real child routes
  rather than dead files.
- `legislation.tsx` renders `<Outlet/>` (the criterion's own words) with `validateSearch` retained on
  the layout; the list body moved to `legislation/index.tsx` reading search via `getRouteApi`.
- Both C9b REAL consumers re-run before AND after, with the failure step recorded distinctly. No
  globalSetup abort occurred in any of the four runs.

## Task Commits

1. **Task 1: Positions slot consolidation** — `0b752cb86` (refactor)
2. **Task 2: Legislation layout + index child** — `6551454d0` (refactor)
3. **Task 3: Behavioural oracle** — `10a6df39f` (test)

Task 2's original commit was `c1e0bcbf4`; a sibling lane's `git commit --amend` clobbered it and
restored it as `6551454d0` (see `e56060a55 docs(95-08): record deviation 2 — amend clobbered a
sibling commit, reverted`). Final history is correct — see Deviations.

## RE-DERIVED INBOUND-LINK SWEEP (run before any edit)

**Population:** every `.ts`/`.tsx` under `frontend/src`, excluding `routeTree.gen.ts`, matching the
template-string form `` `/positions/${…}` `` and the route-id forms `'/positions/$id'` /
`'/positions/$positionId'` / `'/legislation/$id'`. Instrument-tested first: `createFileRoute`
returned **210 files**, so a zero from this sweep would be believable.

| Site                                           | Form                                          | Disposition                                                                                            |
| ---------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `useQuickSwitcherSearch.ts:95`                 | template `/positions/${item.id}`              | param-name-agnostic — UNAFFECTED                                                                       |
| `LinkedItemsList.tsx:38`                       | template                                      | param-name-agnostic — UNAFFECTED                                                                       |
| `AssignmentDetailsModal.tsx:102,374`           | template                                      | param-name-agnostic — UNAFFECTED                                                                       |
| `EntityLinkManager.tsx:197`                    | template                                      | param-name-agnostic — UNAFFECTED                                                                       |
| `DossierSearchPage.tsx:134`                    | template                                      | param-name-agnostic — UNAFFECTED                                                                       |
| `entityHistoryStore.ts:217`                    | template                                      | param-name-agnostic — UNAFFECTED                                                                       |
| **`positions.repository.ts:155`**              | template `/positions/${positionId}/analytics` | **NEW since research** — an **API endpoint path**, not a router URL. NON-CONSUMER, unchanged           |
| `NewPositionDialog.tsx:239`                    | route-id `/positions/$id`                     | already correct — unchanged                                                                            |
| `approvals/index.tsx:96`                       | route-id `/positions/$id`                     | already correct — unchanged                                                                            |
| `$id/approvals.tsx:89`                         | route-id `/positions/$id` (Back link)         | **DELETED** with the standalone header (child is a tab panel now)                                      |
| `$id/versions.tsx:84`                          | route-id `/positions/$id` (Back link)         | **DELETED** with the standalone header                                                                 |
| **`positions.tsx:306`**                        | route-id `/positions/$positionId`             | **THE ONE REPOINT** → `to: '/positions/$id', params: { id: position.id }`; both `as any` casts deleted |
| `LegislationDetail.tsx:864`                    | route-id `/legislation/$id`                   | path unchanged — re-verified by grep after the move                                                    |
| `LegislationList.tsx:385,454`                  | route-id `/legislation/$id`                   | path unchanged — re-verified                                                                           |
| `legislation.tsx:58` (create-success navigate) | route-id `/legislation/$id`                   | moved with the list body into `legislation/index.tsx:38`, still works                                  |

The research enumeration held exactly, plus one addition (`positions.repository.ts:155`) which is a
non-consumer. **Route-id `/positions/$positionId` consumers: exactly one**, as researched.

## NAMED OMISSION

`positions/$positionId.tsx` uniquely mounted **`PositionAnalyticsCard`** (:235). The file is deleted
and **that mount is dropped with it** — verified by sweep: `PositionAnalyticsCard` now appears only
in its own definition file (`components/positions/PositionAnalyticsCard.tsx`), with **zero mounts**
anywhere in the tree. The component file is left in place; deleting it is not DEAD-08's scope. This
is recorded, not silent.

## C9b CONSUMER DISPOSITIONS (measured, not assumed)

Each consumer run in its OWN invocation (paths are filters, D-14), `E2E_BASE_URL=http://localhost:5173`
so the `webServer` spawn is avoided.

| Consumer                                             | mock-vs-real    | BEFORE                                                                                                                                   | AFTER                                                                | Disposition                                                                                            |
| ---------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `frontend/tests/e2e/version-comparison.spec.ts`      | **REAL**        | exit **1**, 2 failed, both at **step (ii) the spec's own login** — `page.fill('[data-testid="email-input"]')` timeout at `:19` and `:75` | exit **1**, 2 failed, **identical step (ii)** at `:19` and `:75`     | **Branch (a)** — REAL consumer, PRE-EXISTING NON-RUNNABLE. Failure mode unchanged by the consolidation |
| `frontend/tests/e2e/consistency-resolution.spec.ts`  | **REAL**        | exit **1**, 4 failed, all at **step (ii)** — `:19`, `:83`, `:114`, `:142`                                                                | exit **1**, 4 failed, **identical step (ii)** at the same four lines | **Branch (a)** — same                                                                                  |
| `frontend/tests/a11y/positions-a11y-{en,ar}.spec.ts` | —               | not run                                                                                                                                  | not run                                                              | **NAMED NON-CONSUMERS** — contested-surface tests are `test.fixme` (editor/diff a11y debt)             |
| `tests/contract/positions-*`                         | MOCKED/contract | not run                                                                                                                                  | not run                                                              | **NON-CONSUMERS** — `positionId` is a variable name against edge functions, not a route-file reference |

**No globalSetup abort occurred in any of the four runs** — `globalSetup` completed and wrote
`frontend/tests/e2e/.auth/storageState.json` each time, and every spec executed. So **branch (c)
`UNABLE TO MEASURE (C2)` does not apply to any C9b row**, and nothing was folded into branch (a).

Both specs' pre-existing non-runnability has **two independent causes that predate this phase**:
(1) hardcoded credentials (`drafter@gastat.gov.sa`) and a hardcoded position UUID
(`123e4567-…`) absent from staging; (2) the testids they assert (`compare-versions-button`,
`diff-en-container`, `metadata-changes-table`, `version-1`…) exist **nowhere in the tree**. They pin
an aspirational DOM contract the shipped tree never rendered. Satisfying it is feature work, **not**
DEAD-08 slot consolidation — explicitly out of scope and **not fixed here**.

## GATE OBSERVATIONS — red before, green after

**Task 1** (all observed at HEAD _before_ any edit, then after):

| Check                                        | RED (at HEAD)                                                                                                                  | GREEN (after) |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| `positionId` count in `routeTree.gen.ts`     | **13** (gate requires 0)                                                                                                       | **0**         |
| `/positions/$id/approvals` in generated file | **10 hits** — INSTRUMENT TEST proving the grep reads the generated file; present at HEAD, so it proves the read, not the regen | 10 hits       |
| `$id/index.tsx` exists                       | exit **1** (absent)                                                                                                            | exit 0        |
| `$positionId.tsx` absent                     | exit **1** (present)                                                                                                           | exit 0        |
| `<Outlet` in `$id.tsx`                       | **0**                                                                                                                          | 2             |
| `positionId' as any` in `positions.tsx`      | **1** (gate requires 0)                                                                                                        | **0**         |
| `'/positions/$id'` pin in `positions.tsx`    | exit **1** (absent)                                                                                                            | exit 0        |
| `VersionComparison` in `versions.tsx`        | 0-exit (present — panel-content pin)                                                                                           | still present |
| **Full gate incl. `pnpm type-check`**        | **exit 1**                                                                                                                     | **exit 0**    |

**Task 2:**

| Check                                         | RED (at HEAD)                                                                                                                                              | GREEN (after) |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `legislation/index.tsx` exists                | exit **1**                                                                                                                                                 | exit 0        |
| `<Outlet` in `legislation.tsx`                | **0**                                                                                                                                                      | 2             |
| `'/legislation/'` index key in generated tree | **0** — instrument-tested: `'/legislation/$id'` = **5** hits and `'/legislation'` = **8** hits in the same file, so the zero is real, not a broken pattern | **3**         |
| **Full gate incl. `pnpm type-check`**         | **exit 1**                                                                                                                                                 | **exit 0**    |

**Task 3:** `test -f` + `--list` count **3** + run → **exit 0, 3 passed**. See the drill below.

## THE RED/GREEN DRILL FOR THE ORACLE

**GREEN:** against the running app on `:5173` — **exit 0, 3/3 passed** (repeated 3×).

**RED:** drilled on a throwaway detached worktree at the pre-fix commit (`391c27ea1`, the parent of
Task 1) served by a second Vite instance on `:5199`. The shared tree was never mutated and the
worktree was removed afterwards.

- **Test 3 red is ATTRIBUTABLE to DEAD-08.** Against the pre-fix build, `/legislation/<absent-uuid>`
  failed the positive assertion (the detail route's not-found surface never appeared), and the
  captured page snapshot shows the page rendered `heading "Legislation Tracker" [level=1]` and
  `button "Add Legislation"` — **the LIST at a detail URL**, which is exactly the lie the test
  asserts against. That red disappears on the fixed build.
- **Tests 1-2 red is UNABLE TO MEASURE on that instance** — see BLOCKED. Their reds land at the
  data-derivation step because the pre-fix instance cannot load any data.

**A2 (HeroUI `filterDOMProps` drops aria) did NOT bite.** `components/ui/tabs.tsx` re-exports
`heroui-tabs.tsx`, which is a thin wrapper over **`@radix-ui/react-tabs`** — `TabsTrigger` renders
`role="tab"` with a native `aria-selected`. Driving `value`/`onValueChange` (no `Link asChild`, per
the plan) preserves it: test 1 asserts `aria-selected="true"` on the deep-linked approvals trigger
and **passes in-browser**. Verified by render, not by reading the source.

**Deep-link-without-trigger was ORACLED, not just defined.** Staging carries 2 `draft` positions
(out of set) and 2 `published` (in set), so test 2's opportunistic arm executed. The spec annotates
which branch it took; the JSON report reads
`out-of-set-deep-link -> asserted: redirect from an out-of-set (draft) position`. It is **not**
"defined-but-not-oracled".

## Files Created/Modified

- `frontend/src/routes/_protected/positions/$id.tsx` — slot layout: header, URL-driven tab strip,
  `<Outlet/>`; exports `APPROVALS_TAB_STATUSES`
- `frontend/src/routes/_protected/positions/$id/index.tsx` — NEW; the editor panel
- `frontend/src/routes/_protected/positions/$id/approvals.tsx` — stripped to panel content; adds the
  out-of-set replace-redirect
- `frontend/src/routes/_protected/positions/$id/versions.tsx` — stripped to panel content;
  `VersionComparison` mount intact
- `frontend/src/routes/_protected/positions/$positionId.tsx` — DELETED
- `frontend/src/routes/_protected/positions.tsx` — the one repoint, both `as any` casts gone
- `frontend/src/routes/_protected/legislation.tsx` — layout with `<Outlet/>`, `validateSearch` kept
- `frontend/src/routes/_protected/legislation/index.tsx` — NEW; list body via `getRouteApi`
- `frontend/src/routeTree.gen.ts` — regenerated by TanStackRouterVite, committed in the SAME commits
  as the moves, never hand-edited
- `tests/e2e/95-slots-tabs.spec.ts` — NEW; 3 tests

## Decisions Made

- **Survivor `$id`**, per the plan's D-07 discretion and the re-derived sweep (one repoint vs four+).
- **`APPROVALS_TAB_STATUSES` is exported once** from `$id.tsx` and imported by the approvals child.
  Duplicating the status list in both files is how the strip and the redirect drift apart.
- **One `TabsContent` bound to the active value wraps the `<Outlet/>`**, so the active trigger's
  `aria-controls` still resolves. This matches HEAD's a11y posture (Radix unmounts inactive panels).
- **The children's panel content was preserved**, only their standalone headers/Back links removed —
  a wholesale deletion would silently shrink what the C9b consumers could ever assert.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug in my own oracle] `toHaveCount(0)` ran before the page rendered**

- **Found during:** Task 3, while drilling the red
- **Issue:** Test 3 asserted the list heading/button were absent _before_ asserting the detail
  surface was present. On the pre-fix build those absence checks **passed** while the page was still
  blank, and the list rendered moments later — the snapshot proves it. The same ordering would have
  made the GREEN pass for the wrong reason.
- **Fix:** positive assertion first, absence checks after the page has settled; same treatment for
  test 2's post-redirect tab-absence check.
- **Verification:** re-ran both directions — still red on pre-fix, green on fixed.
- **Committed in:** `10a6df39f`

**2. [Rule 3 - Blocking] Three concurrent inline sign-ins parked every test on `/login`**

- **Found during:** Task 3, first gate run (3 failed at the login assertion; the single-test control
  `93-report-notfound.spec.ts` passed in 2.9s, proving the helper itself was fine)
- **Issue:** the root config sets `fullyParallel: true`; three simultaneous sign-ins of one fixture
  account never left `/login`.
- **Fix:** `test.describe.configure({ mode: 'default' })` — spec-side, **gate untouched**.
  Deliberately not `serial`, which skips the rest after a first failure.
- **Verification:** 3/3 green under the verbatim gate command.
- **Committed in:** `10a6df39f`

**3. [Rule 1 - Bug in my own oracle] Two locator defects found by measurement**

- **Issue:** (a) a bare `getByRole('listitem')` also matched AppShell nav items — clicking one went
  to `/dashboard`; (b) the listitem wrapper is not clickable (PositionCard puts `onClick` on the
  title and a footer "View" button); (c) `$`-anchored URL regexes ignored the `/positions` layout's
  `validateSearch` defaults riding along as `?sort=…&order=…`.
- **Fix:** scoped rows to `getByRole('list', { name: /positions list/i })`, click the card's View
  button, and allow an optional query string in the URL patterns.
- **Committed in:** `10a6df39f`

**4. [Shared-tree accident, NOT a code change] Task 2's first commit swept in a sibling lane's file**

- **Issue:** `c1e0bcbf4` included a 2-line **prettier reformat** of
  `.planning/phases/95-routes-that-don-t-render/95-08-SUMMARY.md` (markdown `*"…"*` → `_"…"_`),
  picked up from the shared index by the pre-commit hook despite an explicit pathspec. No semantic
  change to that lane's content.
- **Resolution:** deliberately **not** rewritten — eight lanes share this branch and a history
  rewrite is far more destructive than a cosmetic markdown reformat. Independently, the 95-08 lane's
  own `--amend` then clobbered and restored my commit as `6551454d0`, whose final contents are
  **only my three files**. Net: final history is clean; recorded because it happened.

---

**Total deviations:** 4 (3 auto-fixed bugs in my own test code, 1 shared-tree accident recorded).
**Impact on plan:** none on scope. Deviations 1 and 3 made the oracle stricter, not weaker.

## Issues Encountered

- A leftover `stash@{0}: lint-staged automatic backup` exists in the shared repo containing **Phase
  94** content (`94-05-SUMMARY.md`, `WorkBoard.tsx`, `WorkBoard.test.tsx`). It is **not mine** and
  predates this leg; left untouched rather than dropped.
- The TanStackRouterVite regen is **asynchronous**. Reading `routeTree.gen.ts` immediately after
  writing a route file shows the pre-regen content; the watcher caught up within seconds. Both
  commits were verified to carry the regenerated tree.

## User Setup Required

None — no external service configuration required. Zero package installs (T-95-SC honoured).

## Next Phase Readiness

- Criterion 5 holds behaviourally: one route file per slot, `legislation.tsx` renders an `<Outlet/>`,
  and the positions approvals/versions children drive tab state with deep-link and back-button
  fidelity — all three asserted by `tests/e2e/95-slots-tabs.spec.ts`, green.
- `PositionAnalyticsCard` is now a zero-mount component. Whoever wants position analytics back
  should mount it deliberately (the `usePositionAnalytics` hook is intact); it is not dead-code
  cleanup for this plan to perform.
- The two REAL C9b consumers remain non-runnable for reasons that predate this phase. Making them
  run means real credentials/fixtures plus building the comparison-UI testids they assert — feature
  work, unowned by DEAD-08.

## BLOCKED

- **The pre-fix behavioural RED for oracle tests 1-2 could not be measured.** Drilled on a detached
  worktree at `391c27ea1` served on `:5199`; both tests red at the data-derivation step, and the
  captured page snapshot shows `alert: "Failed to load positions"` — an **environment failure, not
  the DEAD-08 defect**. Cause measured, not assumed: staging's edge-function CORS allowlist admits
  only `http://localhost:5173`.

  ```
  OPTIONS .../functions/v1/positions-get
    Origin: http://localhost:5173 -> access-control-allow-origin: http://localhost:5173
    Origin: http://localhost:5199 -> access-control-allow-origin: null
  ```

  Probed `3000, 4173, 5174, 5175, 5176, 8080` — **all `null`**. So a second app instance able to load
  data is impossible without either taking `:5173` from the seven concurrent lanes or mutating the
  shared staging `ALLOWED_ORIGINS` secret. Both are out of bounds, so this was **left unmeasured and
  is recorded here rather than laundered into a defect-red**. What IS attributable: test 3's red on
  the same instance (the list rendering at a detail URL, snapshot-captured), and every static Task-1
  and Task-2 red observed at HEAD before editing, tabulated above.

SUMMARY-END
