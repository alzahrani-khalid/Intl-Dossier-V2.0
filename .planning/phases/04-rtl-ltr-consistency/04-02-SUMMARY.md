---
phase: 04-rtl-ltr-consistency
plan: 02
subsystem: ui
tags: [rtl, codemod, useDirection, logical-css, tailwind, i18n]

requires:
  - phase: 04-01
    provides: useDirection() hook, LtrIsolate wrapper, eslint-plugin-rtl-friendly

provides:
  - Zero per-component dir= ternary attributes across 468+ files
  - All direction logic flows through useDirection() hook (439 files)
  - Zero physical CSS properties in frontend TSX files
  - Clean i18n imports (unused i18n destructures removed from 494 files)

affects: [04-03-rtl-ltr-consistency]

tech-stack:
  added: []
  patterns:
    - "useDirection() hook for all RTL/direction logic instead of i18n.language === 'ar'"
    - "Logical CSS properties (ms-/me-/ps-/pe-/text-start/text-end) exclusively"

key-files:
  created: []
  modified:
    - frontend/src/**/*.tsx (536 files)
    - frontend/src/components/ui/heroui-modal.tsx
    - frontend/src/components/ui/heroui-forms.tsx
    - frontend/src/components/legislation/LegislationDetail.tsx

key-decisions:
  - "Preserved dir={isRTLLanguage()} in ContentLanguageSelector as intentional per-content direction override"
  - "Converted isRTL prop pass-throughs to useDirection() calls in sub-components (LegislationDetail)"
  - "Removed isRTL entirely from 95 files where it was only used for dir= attribute"

patterns-established:
  - "useDirection() hook is the single source for all direction logic"
  - "No isRTL prop drilling - each component calls useDirection() directly"
  - "text-end/text-start instead of text-right/text-left in all Tailwind classes"

requirements-completed: [RTL-01, RTL-02, RTL-05]

duration: 20min
completed: 2026-03-25
---

# Phase 04 Plan 02: Bulk RTL Codemod Summary

**Bulk-migrated 536 files to eliminate per-component dir= attributes, replace i18n.language === 'ar' with useDirection() hook, and convert physical CSS to logical properties**

## Performance

- **Duration:** 20 min
- **Started:** 2026-03-25T00:53:40Z
- **Completed:** 2026-03-25T01:13:40Z
- **Tasks:** 2
- **Files modified:** 538

## Accomplishments
- Removed `dir={isRTL ? 'rtl' : 'ltr'}` from 468 files (RTLWrapper root handles dir globally)
- Replaced `const isRTL = i18n.language === 'ar'` with `const { isRTL } = useDirection()` in 485+ files
- Cleaned up 494 files with unused `i18n` destructures after migration
- Replaced all physical CSS properties (`text-right`) with logical equivalents (`text-end`) in heroui wrappers
- Converted isRTL prop-drilling to direct useDirection() calls in sub-components

## Task Commits

Each task was committed atomically:

1. **Task 1: Bulk-remove per-component dir= attributes and replace isRTL patterns** - `3ca98cab` (feat)
2. **Task 2: Replace physical CSS properties with logical equivalents** - `12310336` (fix)

## Files Created/Modified
- `frontend/src/**/*.tsx` (536 files) - Removed dir= ternaries, replaced isRTL patterns with useDirection(), cleaned unused i18n imports
- `frontend/src/components/ui/heroui-modal.tsx` - text-right -> text-end
- `frontend/src/components/ui/heroui-forms.tsx` - text-right -> text-end (7 occurrences)
- `frontend/src/components/legislation/LegislationDetail.tsx` - Converted isRTL prop to useDirection() in 6 sub-components

## Decisions Made
- Preserved `dir={isRTLLanguage(code)}` in ContentLanguageSelector.tsx - these check content language direction (not UI direction), which is an intentional per-content LTR isolation pattern
- Converted isRTL prop pass-throughs to useDirection() hook calls in LegislationDetail sub-components (OverviewTab, DeadlinesTab, AmendmentsTab, SponsorsTab, RelatedTab, HistoryTab) to eliminate prop drilling
- Removed isRTL entirely from 95 files where the only usage was in the `dir=` attribute that was removed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed misplaced useDirection() insertions in multi-component files**
- **Found during:** Task 1 (bulk codemod)
- **Issue:** Automated script inserted `const { isRTL } = useDirection()` inside function parameter destructuring instead of function body in 8 files with multiple sub-components
- **Fix:** Manually corrected placement in SummaryCard, DuplicateComparison, ExportDialog, LegislationDetail, IconRail, ChartWorkItemTrends, WebhooksPage
- **Files modified:** 8 files
- **Verification:** TypeScript compilation passes with zero TS2304/TS1005 errors
- **Committed in:** 3ca98cab (part of Task 1 commit)

**2. [Rule 1 - Bug] Fixed unused i18n destructures causing TS6133 errors**
- **Found during:** Task 1 (bulk codemod)
- **Issue:** After replacing `isRTL = i18n.language === 'ar'` with `useDirection()`, 596 files had unused `i18n` in their `useTranslation()` destructure
- **Fix:** Wrote cleanup script to remove `i18n` from destructuring where no longer used, keeping it where `i18n.changeLanguage()` is called
- **Files modified:** 494 files
- **Verification:** TS6133 'i18n' errors reduced from 596 to 0
- **Committed in:** 3ca98cab (part of Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
- Multi-component files (files with multiple exported functions/components) required multiple passes to handle correctly - the initial regex-based codemod only matched the first declaration per file
- Files where isRTL was passed as a prop to sub-components needed manual conversion to useDirection() calls

## Known Stubs
None - all changes are complete replacements with no placeholder values.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- RTL-01, RTL-02, RTL-05 requirements achieved
- Ready for Plan 03 (testing and verification of RTL consistency)
- All 439 direction-aware files use useDirection() hook consistently

---
*Phase: 04-rtl-ltr-consistency*
*Completed: 2026-03-25*
