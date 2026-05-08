---
phase: 46-visual-baseline-regeneration
plan: 02
subsystem: testing
tags: [playwright, visual-regression, list-pages, rtl]
requires:
  - phase: 40-list-pages
    provides: Unified ListPageShell routes and deterministic list-page visual spec
provides:
  - fourteen regenerated list-page visual baselines
  - verified no-update replay for list-pages-visual.spec.ts
  - corrected persons visual route targeting the Phase 40 ListPageShell page
affects: [phase-46, visual-regression, list-pages]
tech-stack:
  added: []
  patterns: [ListPageShell ready-marker screenshot capture, route-specific visual baselines]
key-files:
  created: []
  modified:
    - frontend/tests/e2e/list-pages-visual.spec.ts
    - frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/countries-en-chromium-darwin.png
    - frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/countries-ar-chromium-darwin.png
    - frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/organizations-en-chromium-darwin.png
    - frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/organizations-ar-chromium-darwin.png
    - frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/persons-en-chromium-darwin.png
    - frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/persons-ar-chromium-darwin.png
    - frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/forums-en-chromium-darwin.png
    - frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/forums-ar-chromium-darwin.png
    - frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/topics-en-chromium-darwin.png
    - frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/topics-ar-chromium-darwin.png
    - frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/working-groups-en-chromium-darwin.png
    - frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/working-groups-ar-chromium-darwin.png
    - frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/engagements-en-chromium-darwin.png
    - frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/engagements-ar-chromium-darwin.png
key-decisions:
  - 'Preserve the existing Phase 40 determinism stack instead of rewriting list-page UI or visual helpers.'
  - 'Point the persons visual baseline at /dossiers/persons because /persons is the legacy page without ListPageShell readiness markers.'
patterns-established:
  - 'Visual baseline specs should target canonical production routes, not legacy aliases that bypass deterministic page shells.'
requirements-completed: [VIS-02, VIS-04]
duration: 20min
completed: 2026-05-08
---

# Phase 46 Plan 02: List-Page Baselines Summary

**List-page visual regression now has 14 refreshed LTR/RTL baselines replaying cleanly against canonical Phase 40 routes.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-05-08T11:05:00Z
- **Completed:** 2026-05-08T11:24:41Z
- **Tasks:** 1
- **Files modified:** 15

## Accomplishments

- Regenerated all 14 list-page baselines for countries, organizations, persons, forums, topics, working groups, and engagements in English and Arabic.
- Verified `list-pages-visual.spec.ts` without snapshot updates; all 14 tests passed.
- Confirmed the snapshot folder contains exactly 14 PNG baselines and `46-VALIDATION.md` names all expected VIS-02 files.

## Task Commits

1. **Task 46-02-01: Regenerate fourteen list-page baselines** - `69de2fcc`

## Files Created/Modified

- `frontend/tests/e2e/list-pages-visual.spec.ts` - Corrected the persons route to `/dossiers/persons`.
- `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/*.png` - Refreshed 14 VIS-02 list-page baselines.
- `.planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md` - Already named all 14 VIS-02 baseline paths; PASS/DEVIATION/REJECTED sign-off remains owned by Plan 46-04.

## Decisions Made

- Kept `46-VALIDATION.md` review rows pending because Plan 46-04 owns human review closure.
- Did not broaden snapshot updates beyond `list-pages-visual.spec.ts`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected stale persons visual route**

- **Found during:** Task 46-02-01 no-update/update run.
- **Issue:** The spec targeted `/persons`, which renders the legacy Persons page without `ListPageShell` or `data-loading="false"`, causing both persons visual tests to time out.
- **Fix:** Changed the persons route in `list-pages-visual.spec.ts` to `/dossiers/persons`, the Phase 40 unified list route.
- **Files modified:** `frontend/tests/e2e/list-pages-visual.spec.ts`
- **Verification:** `doppler run -- pnpm -C frontend exec playwright test list-pages-visual.spec.ts --project=chromium --update-snapshots` and the no-update replay both passed 14/14.
- **Committed in:** `69de2fcc`

---

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** The route correction aligns the spec with the Phase 40 list-page baseline scope; no UI rewrite or extra snapshot scope was introduced.

## Issues Encountered

- Initial snapshot update passed 12/14 and failed only the persons EN/AR routes due to the stale legacy route. After correcting the route, the full 14-test update and replay passed.

## Verification

- `doppler run -- pnpm -C frontend exec playwright test list-pages-visual.spec.ts --project=chromium --update-snapshots` - PASS, 14/14.
- `doppler run -- pnpm -C frontend exec playwright test list-pages-visual.spec.ts --project=chromium` - PASS, 14/14.
- `find frontend/tests/e2e/list-pages-visual.spec.ts-snapshots -maxdepth 1 -type f -name '*.png' | wc -l` - PASS, 14.
- `rg "countries-en|countries-ar|organizations-en|organizations-ar|persons-en|persons-ar|forums-en|forums-ar|topics-en|topics-ar|working-groups-en|working-groups-ar|engagements-en|engagements-ar" .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md` - PASS, all 14 rows present.

## User Setup Required

None.

## Next Phase Readiness

Drawer baseline regeneration can proceed. Final human review and CI closure remain owned by Plan 46-04.

## Self-Check: PASSED

---

_Phase: 46-visual-baseline-regeneration_
_Completed: 2026-05-08_
