---
phase: 44-documentation-toolchain-anti-patterns
plan: 04
subsystem: frontend
tags: [frontend, lint, a11y, i18n]

requires:
  - phase: 43-rtl-a11y-responsive-sweep
    provides: WR-02..WR-06 audit findings and source anchors
provides:
  - WR-02 overdue owner-initials fallback verified closed
  - WR-03 duplicate visible-text label fixes and verified no-ops
  - WR-04 sidebar token wrapper verified closed
  - WR-05 MyTasks checkbox label-in-name fix
  - WR-06 CalendarEntryForm namespace verified closed
affects: [phase-44-browser-verification, frontend-a11y, frontend-lint]

tech-stack:
  added: []
  patterns:
    - visible text IDs with aria-labelledby for controls
    - unknown-safe extraction for optional dossier extension fields

key-files:
  created:
    - .planning/phases/44-documentation-toolchain-anti-patterns/44-04-antipattern-source-fixes-SUMMARY.md
  modified:
    - frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx
    - frontend/src/pages/Dashboard/widgets/__tests__/OverdueCommitments.test.tsx
    - frontend/src/pages/MyTasks.tsx
    - frontend/src/components/calendar/CalendarEntryForm.tsx

key-decisions:
  - 'Verified already-fixed WR-03/WR-04/WR-06 targets as no-ops rather than manufacturing source churn.'
  - 'Kept repo-wide lint backlog out of scope after owned-file ESLint passed with zero errors.'
  - 'Used explicit-path commits because concurrent Phase 44 agents had staged unrelated archive work.'

patterns-established:
  - 'Interactive controls that already render a visible title should reference that title with aria-labelledby.'
  - 'Optional JSON-like extension data should be read through unknown-safe field helpers instead of any casts.'

requirements-completed: [LINT-01, LINT-02, LINT-03, LINT-04, LINT-05]

duration: 11min
completed: 2026-05-07
---

# Phase 44 Plan 04: Antipattern Source Fixes Summary

**WR-02..WR-06 source anti-patterns closed or verified in the six audit-listed frontend files, with owned-file lint errors removed from CalendarEntryForm.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-05-07T18:49:13Z
- **Completed:** 2026-05-07T18:59:53Z
- **Tasks:** 5
- **Files modified:** 3 source files + this summary

## Accomplishments

- Replaced the duplicate dossier-head accessible name in `OverdueCommitments.tsx` with a visible title ID and `aria-labelledby`.
- Replaced the MyTasks checkbox generic `aria-label` with `aria-labelledby={titleId}` pointing at visible task title text, preserving the 44x44 hit area.
- Verified DrawerCtaRow, VipVisits, sidebar token usage, and CalendarEntryForm namespace were already closed.
- Removed scoped `no-explicit-any` lint errors from `CalendarEntryForm.tsx` without changing UI behavior.

## Task Commits

1. **Task 1: Fix OverdueCommitments WR-02/WR-03** - `1ec47c0c` (fix)
2. **Task 2: Verify/fix DrawerCtaRow and VipVisits WR-03 duplicates** - `1502d2c5` (chore, verified no-op)
3. **Task 3: Fix MyTasks checkbox WR-05 with aria-labelledby** - `c684af0c` (fix)
4. **Task 4: Verify/fix sidebar color and CalendarEntryForm namespace** - `19b27e4b` (chore, verified no-op)
5. **Task 5: Run targeted lint and source closure checks** - `2bab64c5` (fix)
6. **Post-wave integration fix: Align OverdueCommitments test with aria-labelledby contract** - `2802fee9`

## Files Created/Modified

- `frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx` - Dossier head button now references visible dossier name text with `aria-labelledby`.
- `frontend/src/pages/Dashboard/widgets/__tests__/OverdueCommitments.test.tsx` - Dossier head test now verifies visible-title `aria-labelledby` and absence of duplicate `aria-label`.
- `frontend/src/pages/MyTasks.tsx` - Checkbox button now references visible task title text with `aria-labelledby={titleId}`.
- `frontend/src/components/calendar/CalendarEntryForm.tsx` - Replaced blocking `any` casts with explicit calendar event, suggestion, and extension-field helpers.
- `.planning/phases/44-documentation-toolchain-anti-patterns/44-04-antipattern-source-fixes-SUMMARY.md` - Execution record.

Verified no-op files:

- `frontend/src/components/dossier/DossierDrawer/DrawerCtaRow.tsx`
- `frontend/src/pages/Dashboard/widgets/VipVisits.tsx`
- `frontend/src/components/ui/sidebar.tsx`

## Decisions Made

- No new labels were added to DrawerCtaRow or VipVisits because current code already exposes visible text without duplicate `aria-label` attributes.
- The sidebar `hsl(var(--sidebar))` issue was already fixed as `backgroundColor: 'var(--sidebar)'`.
- CalendarEntryForm already used `useTranslation('calendar')` and `form.*` keys; the Task 5 edit was limited to owned-scope lint blockers.

## Verification

- `rg "\?\?\s*c\.ownerInitials" frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx` - no matches.
- `rg "aria-label=\{group\.dossierName\}" frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx` - no matches.
- `grep -q "aria-labelledby={titleId}" frontend/src/pages/MyTasks.tsx` - PASS.
- `grep -q "id={titleId}" frontend/src/pages/MyTasks.tsx` - PASS.
- `rg "hsl\(var\(--sidebar\)\)" frontend/src/components/ui/sidebar.tsx` - no matches.
- `rg "calendar\.form\." frontend/src/components/calendar/CalendarEntryForm.tsx` - no matches.
- Targeted closure command for WR-02/WR-03/WR-04/WR-06 patterns - PASS, no matches.
- Scoped ESLint for the six plan-owned files - exit 0 with 0 errors and 3 pre-existing warnings.
- `pnpm -C frontend exec vitest run src/pages/Dashboard/widgets/__tests__/OverdueCommitments.test.tsx` - 11/11 passed after post-wave test alignment.
- `pnpm -C frontend lint` - exit 1 due repo-wide pre-existing backlog: 723 problems, 52 errors, 671 warnings outside the owned source-fix scope.

## Remaining Scoped `aria-label` Attributes

- `sidebar.tsx`: icon-only sidebar trigger and rail controls; no visible text duplicate.
- `MyTasks.tsx`: section region label; not an interactive visible-text duplicate.
- `OverdueCommitments.tsx`: owner initials label includes visible initials plus owner context.
- `aria-labelledby` region and control references remain intentionally in OverdueCommitments, VipVisits, and MyTasks.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cleared owned-file CalendarEntryForm lint errors**

- **Found during:** Task 5 (Run targeted lint and source closure checks)
- **Issue:** Scoped ESLint failed on seven `@typescript-eslint/no-explicit-any` errors in `CalendarEntryForm.tsx`.
- **Fix:** Added explicit event-entry, rescheduling suggestion, and participant extension helpers.
- **Files modified:** `frontend/src/components/calendar/CalendarEntryForm.tsx`
- **Verification:** Scoped ESLint for all six plan-owned files exits 0.
- **Committed in:** `2bab64c5`

---

**Total deviations:** 1 auto-fixed (Rule 3).
**Impact on plan:** The fix stayed inside the owned file scope and was required to make the plan-owned lint surface error-free.

### Post-Wave Integration Fix

The broad post-wave Vitest run exposed that the existing OverdueCommitments unit test still asserted the old duplicate `aria-label`. The component behavior from Task 1 was correct per the Phase 44 accessibility contract, so the test was updated to assert `aria-labelledby` points at the visible dossier title instead.

## Issues Encountered

- Full `pnpm -C frontend lint` remains red because of a repo-wide lint backlog outside this plan's six files. Per D-10 and the scope-boundary rule, those files were not modified.
- The first commit attempt hit a concurrent Git ref/index race while pre-commit hooks were processing another agent's staged archive work. Subsequent commits used explicit path-limited commits to avoid including unrelated staged files.

## Known Stubs

- `DrawerCtaRow.tsx` still contains pre-existing Brief/Follow visual stubs with "coming soon" behavior. This was explicitly outside this plan's scope and was only verified for duplicate labels.
- CalendarEntryForm placeholder props are normal form input hints backed by calendar i18n keys, not mock data.

## User Setup Required

None.

## Next Phase Readiness

Plan 44-05 can run browser-level anti-pattern verification against the source-closed state. The only unresolved verification limitation is the existing repo-wide lint backlog, while the six plan-owned files are scoped-lint clean.

## Self-Check: PASSED

- Summary file created at `.planning/phases/44-documentation-toolchain-anti-patterns/44-04-antipattern-source-fixes-SUMMARY.md`.
- Task commits found: `1ec47c0c`, `1502d2c5`, `c684af0c`, `19b27e4b`, `2bab64c5`.
- No `.planning/STATE.md` or `.planning/ROADMAP.md` changes were staged or committed by this plan.

---

_Phase: 44-documentation-toolchain-anti-patterns_
_Completed: 2026-05-07_
