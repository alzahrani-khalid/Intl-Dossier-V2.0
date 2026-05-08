---
phase: 46-visual-baseline-regeneration
plan: 01
subsystem: testing
tags: [playwright, visual-regression, dashboard, supabase-staging]
requires:
  - phase: 45-schema-seed-closure
    provides: Phase 45 dashboard digest and VIP participant staging seed data
provides:
  - dashboard-widgets Playwright visual project
  - eight committed dashboard widget baselines
  - non-empty widget readiness checks for visual capture
affects: [phase-46, visual-regression, dashboard-widgets]
tech-stack:
  added: []
  patterns: [dedicated Playwright screenshot path template, widget-root data-testid selectors]
key-files:
  created:
    - frontend/tests/e2e/dashboard-widgets-visual.spec.ts
    - frontend/tests/e2e/__snapshots__/dashboard-widgets/kpi-strip.png
    - frontend/tests/e2e/__snapshots__/dashboard-widgets/week-ahead.png
    - frontend/tests/e2e/__snapshots__/dashboard-widgets/overdue-commitments.png
    - frontend/tests/e2e/__snapshots__/dashboard-widgets/digest.png
    - frontend/tests/e2e/__snapshots__/dashboard-widgets/sla-health.png
    - frontend/tests/e2e/__snapshots__/dashboard-widgets/vip-visits.png
    - frontend/tests/e2e/__snapshots__/dashboard-widgets/my-tasks.png
    - frontend/tests/e2e/__snapshots__/dashboard-widgets/recent-dossiers.png
  modified:
    - frontend/src/pages/Dashboard/index.tsx
    - frontend/playwright.config.ts
    - frontend/src/pages/Dashboard/widgets/KpiStrip.tsx
    - frontend/src/pages/Dashboard/widgets/WeekAhead.tsx
    - frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx
    - frontend/src/pages/Dashboard/widgets/Digest.tsx
    - frontend/src/pages/Dashboard/widgets/SlaHealth.tsx
    - frontend/src/pages/Dashboard/widgets/VipVisits.tsx
    - frontend/src/pages/Dashboard/widgets/MyTasks.tsx
    - frontend/src/pages/Dashboard/widgets/RecentDossiers.tsx
key-decisions:
  - 'Force-add dashboard PNG baselines because repo-wide *.png ignore does not unignore __snapshots__.'
  - 'Refresh existing Phase 45 staging fixture dates before capture so WeekAhead and VipVisits render seeded rows instead of empty states.'
patterns-established:
  - 'Dashboard widget visual specs wait for content-specific row/value selectors before taking screenshots.'
  - 'Dedicated Playwright projects own screenshot path templates for nonstandard baseline folders.'
requirements-completed: [VIS-01, VIS-04]
duration: 1h
completed: 2026-05-08
---

# Phase 46 Plan 01: Dashboard Widget Baselines Summary

**Widget-level dashboard visual regression now captures eight seeded dashboard surfaces under a dedicated Playwright project.**

## Performance

- **Duration:** ~1h
- **Started:** 2026-05-08T10:18:00Z
- **Completed:** 2026-05-08T11:19:06Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments

- Added `chromium-dashboard-widgets` to `frontend/playwright.config.ts` with a dedicated `__snapshots__/dashboard-widgets` path template.
- Added stable dashboard widget `data-testid` roots and a new `dashboard-widgets-visual.spec.ts` matrix for all eight VIS-01 widgets.
- Rendered the Digest widget in the dashboard layout so the committed digest baseline replays from a clean checkout.
- Regenerated and committed eight dashboard widget PNG baselines, including non-empty WeekAhead and VipVisits rows backed by staging seed data.

## Task Commits

1. **Task 46-01-01: Add dashboard widget visual target** - `06f4ba0c`
2. **Task 46-01-02: Generate and verify eight dashboard widget baselines** - `7f56f4cf`
3. **Follow-up: Render digest dashboard widget** - `9eace5fd`

## Files Created/Modified

- `frontend/playwright.config.ts` - Added `chromium-dashboard-widgets` and excluded the new spec from default `chromium`.
- `frontend/src/pages/Dashboard/index.tsx` - Added the Digest widget to the rendered dashboard layout for VIS-01 capture.
- `frontend/tests/e2e/dashboard-widgets-visual.spec.ts` - Captures eight widget-level screenshots with deterministic setup and content readiness checks.
- `frontend/src/pages/Dashboard/widgets/*.tsx` - Added stable widget root selectors.
- `frontend/tests/e2e/__snapshots__/dashboard-widgets/*.png` - Eight committed VIS-01 baselines.
- `.planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md` - Already contained exact VIS-01 baseline paths; review status remains pending for Phase 46-04.

## Decisions Made

- Kept human review rows pending in `46-VALIDATION.md`; Phase 46-04 owns PASS/DEVIATION/REJECTED sign-off.
- Used forced Git add for dashboard PNGs because `.gitignore` ignores `*.png` and only unignores `*-snapshots`, not `__snapshots__`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Refreshed stale staging seed dates**

- **Found during:** Task 46-01-02
- **Issue:** Phase 45 staging fixture engagement rows existed, but their `start_date` values were April 30 to May 2 while the database clock was May 8. `get_upcoming_events(NULL, 14)` returned zero rows, so WeekAhead and VipVisits rendered empty states.
- **Fix:** Refreshed the existing deterministic `b0000002-*` `engagement_dossiers` rows in staging through Supabase MCP using the canonical seed schedule: today +2h, tomorrow +10h, and +2d/+4d for the VIP visit.
- **Files modified:** none locally; staging data only.
- **Verification:** `get_upcoming_events(NULL, 14)` returned three events, including `Dr. Sari Widodo` with `person_iso='ID'`; dashboard widget update and no-update Playwright runs both passed.
- **Committed in:** `7f56f4cf` contains the resulting baselines and readiness checks.

**2. [Rule 3 - Blocking] Added content readiness gates**

- **Found during:** Task 46-01-02
- **Issue:** A visible widget root alone could allow empty/loading states to be captured as valid baselines.
- **Fix:** Added per-widget readiness selectors before `toHaveScreenshot`.
- **Files modified:** `frontend/tests/e2e/dashboard-widgets-visual.spec.ts`, loading-state selector placement in `KpiStrip`, `WeekAhead`, and `VipVisits`.
- **Verification:** `doppler run -- pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets`
- **Committed in:** `7f56f4cf`

**3. [Rule 3 - Blocking] Rendered Digest in dashboard layout**

- **Found during:** Plan 46-02 pre-commit review of the 46-01 working tree.
- **Issue:** The dashboard digest baseline depended on the Digest widget being present in `/dashboard`, but `frontend/src/pages/Dashboard/index.tsx` had not been included in the original 46-01 commits.
- **Fix:** Added `<Digest />` to the dashboard right column and committed it separately.
- **Files modified:** `frontend/src/pages/Dashboard/index.tsx`
- **Verification:** Pre-commit build passed; dashboard visual replay remains part of final Plan 46-04 no-update verification.
- **Committed in:** `9eace5fd`

---

**Total deviations:** 3 auto-fixed (3 blocking).
**Impact on plan:** Both fixes protect VIS-01 from false empty baselines. No mock UI data was added.

## Issues Encountered

- Initial 46-01 executor stalled after `06f4ba0c` without creating `SUMMARY.md`; orchestration completed the plan inline from the partial commit and working tree diff.

## Verification

- `pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets --list` - PASS, 8 tests listed.
- `doppler run -- pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets --update-snapshots` - PASS, 8 screenshots regenerated.
- `doppler run -- pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets` - PASS, 8/8.
- `find frontend/tests/e2e/__snapshots__/dashboard-widgets -maxdepth 1 -type f -name '*.png' | wc -l` - PASS, 8.

## User Setup Required

None.

## Next Phase Readiness

List-page and drawer baseline regeneration can proceed. Final human review and CI closure remain owned by Plan 46-04.

## Self-Check: PASSED

---

_Phase: 46-visual-baseline-regeneration_
_Completed: 2026-05-08_
