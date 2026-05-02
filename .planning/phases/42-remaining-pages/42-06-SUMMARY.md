---
phase: 42-remaining-pages
plan: 06
subsystem: ui
tags: [react, tanstack-router, after-actions, .tbl, rtl, icon-flip, vitest, playwright]

requires:
  - phase: 42-remaining-pages-00
    provides: '<Icon> component with chevron-right glyph (R-01)'
  - phase: 42-remaining-pages-01
    provides: useAfterActionsAll hook + AfterActionRecordWithJoins type (after-actions-list-all Edge Function)
  - phase: 42-remaining-pages-02
    provides: 'after-actions-page i18n namespace (en/ar)'
  - phase: 42-remaining-pages-03
    provides: '.tbl, .icon-flip, .chip CSS classes (handoff stylesheet port)'
  - phase: 42-remaining-pages-04
    provides: 'Playwright after-actions-page.spec.ts scaffold'

provides:
  - AfterActionsTable presentation component (6-column .tbl anatomy)
  - Reskinned /after-actions list route wired to useAfterActionsAll
  - 8 vitest cases pinning the 6-column anatomy + RTL chevron flip
  - 2 functional E2E cases un-skipped (table visibility + row → detail navigation)

affects:
  - 42-remaining-pages-10 # Wave 2 visual baselines for after-actions-page-visual.spec.ts
  - 42-remaining-pages-11 # Wave 2 axe spec for after-actions
  - 42-remaining-pages-12 # Wave 2 touch-targets spec for after-actions

tech-stack:
  added: []
  patterns:
    - 'Presentational table component takes rows as props (caller wires the hook)'
    - 'Bilingual title selection inline via locale ternary (no useResolveLocaleField needed for two-field case)'
    - 'dir="ltr" on date <td> keeps day-first format LTR inside an AR-RTL container (TYPO-04 / Phase 35)'
    - 'Icon name="chevron-right" + className="icon-flip" for RTL scaleX(-1) flip'

key-files:
  created:
    - frontend/src/components/after-actions/AfterActionsTable.tsx
    - frontend/src/components/after-actions/__tests__/AfterActionsTable.test.tsx
  modified:
    - frontend/src/routes/_protected/after-actions/index.tsx
    - frontend/tests/e2e/after-actions-page.spec.ts

key-decisions:
  - 'AfterActionsTable kept presentational — caller passes rows in via props; hook is invoked once at the route level.'
  - 'Date formatted via en-GB locale unconditionally; toArDigits swaps Western digits to Arabic-Indic when locale is ar (D-20).'
  - "Empty-state heading uses var(--font-display); skeleton uses --row-h / --line-soft tokens."

patterns-established:
  - 'Pattern: presentational `.tbl` component reusable across remaining list-page reskins (Wave 1 plan 07/08 should mirror)'
  - "Pattern: route file is a thin shell — <PageHeader/> + presentational table + section[data-loading] for E2E ready marker"

requirements-completed:
  - PAGE-02

duration: 12min
completed: 2026-05-02
---

# Phase 42-06: After-actions page reskin Summary

**Reskinned /after-actions to the IntelDossier handoff `.tbl` 6-column anatomy with RTL-flipping chevron, bilingual title/dossier rendering, and the new useAfterActionsAll cross-dossier hook.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-05-02T17:32:00Z (approx)
- **Completed:** 2026-05-02T17:44:00Z (approx)
- **Tasks:** 2 (Task 1 split into RED/GREEN per TDD)
- **Files created:** 2
- **Files modified:** 2

## Accomplishments

- New `AfterActionsTable` component renders the verbatim 6-column `.tbl` anatomy from the IntelDossier handoff (`frontend/design-system/inteldossier_handoff_design/src/pages.jsx`).
- Chevron uses `<Icon name="chevron-right" className="icon-flip" />` so the glyph flips via `scaleX(-1)` in RTL — pointing visually toward the row's leading edge in Arabic.
- Hook wiring uses `useAfterActionsAll()` (Phase 42-01) for cross-dossier reads, keyed `['after-actions','all', options]` to avoid colliding with the per-dossier cache.
- Engagement title and dossier name select between `*_en` / `*_ar` based on `i18n.language`; counts come from `decisions.length` / `commitments.length` rendered in mono with `text-end`.
- Date column uses day-first `Tue 28 Apr` format with `dir="ltr"` so the cell stays LTR inside an AR-RTL container (TYPO-04 / Phase 35), then `toArDigits` swaps Western digits to Arabic-Indic in AR.
- Whole row is keyboard-focusable (`tabIndex=0`, `role="button"`) — Enter / Space activates and navigates to `/after-actions/$afterActionId`.
- Empty state, loading skeleton (`data-testid="after-actions-skeleton"`), and error state all use design tokens — no hex, no card shadow.
- Section root emits `data-loading` for the Wave 2 visual / axe / touch-target specs.
- Both Playwright functional cases un-skipped (`.tbl` visibility + row→detail navigation); visual baseline spec stays `test.skip` for Wave 2 plan 10.

## Task Commits

1. **Task 1 (RED):** `5ee367b4` — `test(42-06): add failing tests for AfterActionsTable (RED)`
2. **Task 1 (GREEN):** `cf75db12` — `feat(42-06): implement AfterActionsTable .tbl component (GREEN)`
3. **Task 2:** `60ad6a02` — `feat(42-06): rewrite /after-actions route + un-skip functional E2E`

## Files Created/Modified

- **Created** `frontend/src/components/after-actions/AfterActionsTable.tsx` — Presentational `.tbl` component (154 LOC); 6-column anatomy; RTL-flipping chevron; loading/empty/error in-component.
- **Created** `frontend/src/components/after-actions/__tests__/AfterActionsTable.test.tsx` — 8 vitest cases pinning column count, keyboard focus, bilingual title, mono LTR date, chip styling + counts, chevron `icon-flip`, empty state, navigate call shape.
- **Modified** `frontend/src/routes/_protected/after-actions/index.tsx` — Stripped legacy stub (Card + Plus button → engagements). New shell: `<PageHeader/>` + `<AfterActionsTable/>` driven by `useAfterActionsAll()`; section `data-loading` ready marker.
- **Modified** `frontend/tests/e2e/after-actions-page.spec.ts` — Flipped both `test.skip` → `test`. Updated header comment to reflect un-skipped state. Visual spec (`after-actions-page-visual.spec.ts`) intentionally untouched — Wave 2 plan 10 owns baselines.

## Decisions Made

- Inline bilingual title selection (locale ternary) instead of pulling in `useResolveLocaleField` — only two fields, no schema-wide rule needed.
- `formatDayFirst` uses `en-GB` unconditionally (gives `Tue 28 Apr`), then `toArDigits` swaps Western digits to Arabic-Indic in AR. Avoids the documented landmine in `toArDigits.ts` of double-converting through `toLocaleString('ar')`.
- `navigateToDetail` returns `void` and wraps the navigate promise with `void navigate(...)` to satisfy `@typescript-eslint/no-floating-promises` without leaking promise types into JSX handlers.
- Skeleton renders 8 row-shaped placeholders (matches the typical first-page page-size from the Edge Function default).
- `formatDayFirst` returns `'—'` when `engagement_date` is missing or unparseable rather than throwing — defensive against partial Edge Function payloads.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing Critical] Defensive guard for invalid `engagement_date`**

- **Found during:** Task 1 implementation
- **Issue:** Plan's `formatDayFirst` snippet did `new Date(date).toLocaleDateString(...)` without checking for `NaN` / unparseable values. A bad ISO string from the Edge Function would render `Invalid Date` in the table cell.
- **Fix:** Added `if (Number.isNaN(d.getTime())) return '—'`. Same em-dash fallback as the bilingual fallbacks (T-42-06-INFO-1 disposition).
- **Files modified:** `frontend/src/components/after-actions/AfterActionsTable.tsx`
- **Verification:** All 8 vitest cases still pass; bad-date case behavior is now defined.
- **Committed in:** `cf75db12` (Task 1 GREEN)

**2. [Rule 1 — Bug] Stale `test.skip` reference in spec header comment**

- **Found during:** Task 2 verification (`grep -c test.skip` returned 1 instead of 0)
- **Issue:** The plan's verification line `! grep -q "test.skip"` was failing because of a leftover doc comment "`test.skip` until Wave 1 plan 42-06 un-skips…" — comment was still accurate as a label but tripped the grep gate.
- **Fix:** Updated the spec file header comment to reflect the un-skipped state ("Un-skipped by Wave 1 plan 42-06…"). Functionally identical, but now the `grep -c test.skip` gate returns 0 unambiguously.
- **Files modified:** `frontend/tests/e2e/after-actions-page.spec.ts`
- **Verification:** `grep -c "test.skip" → 0` post-fix.
- **Committed in:** `60ad6a02` (Task 2)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Neither deviation expanded scope; both close concrete correctness gaps surfaced by the verification block. No architectural changes.

## Issues Encountered

- Worktree had no `node_modules`. Resolved with `pnpm install --offline --prefer-offline` (15s, all deps cached). Vitest then ran cleanly. Not a deviation — expected onboarding for a fresh worktree.

## Next Phase Readiness

- Wave 2 plan 10 (visual baselines) can now run `playwright test --update-snapshots` against `/after-actions` — the page renders the new `.tbl` anatomy and emits `data-loading` for ready-marker waits.
- Wave 2 plan 11 (axe) and plan 12 (touch-targets) have a stable DOM to assert against.
- The `useAfterActionsAll` hook is wired but the Edge Function (`after-actions-list-all`) was implemented in plan 42-01 — staging deployment is a prerequisite for green E2E runs in CI; functional spec will use `setupPhase42Test` seeded fixtures otherwise.
- No blockers for Wave 1 sibling reskins (plans 07/08); they can mirror the `presentational-table-with-route-shell` pattern established here.

## Threat Flags

None — the surface introduced is render-only of fields already exposed by the upstream Edge Function (RLS gate at `after-actions-list-all` from plan 42-01). No `dangerouslySetInnerHTML`; React default escaping handles bilingual title/dossier interpolation.

## Self-Check

Run after writing this SUMMARY.

- File `frontend/src/components/after-actions/AfterActionsTable.tsx` exists: FOUND
- File `frontend/src/components/after-actions/__tests__/AfterActionsTable.test.tsx` exists: FOUND
- File `frontend/src/routes/_protected/after-actions/index.tsx` modified: FOUND (committed in 60ad6a02)
- File `frontend/tests/e2e/after-actions-page.spec.ts` modified: FOUND (committed in 60ad6a02)
- Commit `5ee367b4` (RED): FOUND
- Commit `cf75db12` (GREEN): FOUND
- Commit `60ad6a02` (route + e2e): FOUND

## Self-Check: PASSED

---

_Phase: 42-remaining-pages_
_Plan: 06_
_Completed: 2026-05-02_
