---
phase: 82-date-number-formatting
plan: 02
subsystem: ui
tags: [i18n, intl, date-formatting, number-formatting, latin-digits, rtl, analytics, sla, tasks]

# Dependency graph
requires:
  - phase: 82-date-number-formatting
    provides: '82-01 4-helper format-date surface + toFormatLocale ar-u-nu-latn (Latin-safe)'
provides:
  - '19 analytics/sla-monitoring/audit/tasks/stakeholder/field-history components migrated off ad-hoc toLocaleDateString/toLocaleString and bare ar-SA number locales'
  - 'Chart axis date ticks standardized on date-fns d MMM (day-first, guard-clean)'
  - 'All locale-aware NUMBER sites in the slice route through toFormatLocale -> Latin digits in AR'
affects: [82-03, 82-04, 82-07, wave-3-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Date site migration: helper by shape (formatDayFirst / formatDayFirstYear / formatTime / formatDateTime), chart ticks -> date-fns d MMM'
    - 'Number site migration: keep .toLocaleString / Intl.NumberFormat / Intl.RelativeTimeFormat call shape, swap the locale arg to toFormatLocale(isRTL ? ar : en)'

key-files:
  created: []
  modified:
    - frontend/src/components/analytics/RelationshipHealthChart.tsx
    - frontend/src/components/analytics/EngagementMetricsChart.tsx
    - frontend/src/components/analytics/CommitmentFulfillmentChart.tsx
    - frontend/src/components/analytics/WorkloadDistributionChart.tsx
    - frontend/src/components/analytics/SummaryCard.tsx
    - frontend/src/components/sla-monitoring/SLAComplianceChart.tsx
    - frontend/src/components/sla-monitoring/SLAOverviewCards.tsx
    - frontend/src/components/sla-monitoring/SLAComplianceTable.tsx
    - frontend/src/components/sla-monitoring/SLAEscalationsList.tsx
    - frontend/src/components/audit-logs/AuditLogStatistics.tsx
    - frontend/src/components/audit-logs/AuditLogFilters.tsx
    - frontend/src/components/activity-feed/ActivityFeedFilters.tsx
    - frontend/src/components/tasks/TaskDetail.tsx
    - frontend/src/components/tasks/TaskCard.tsx
    - frontend/src/components/tasks/SLAIndicator.tsx
    - frontend/src/components/stakeholder-influence/InfluenceReport.tsx
    - frontend/src/components/stakeholder-influence/InfluenceMetricsPanel.tsx
    - frontend/src/components/stakeholder-timeline/StakeholderTimelineCard.tsx
    - frontend/src/components/field-history/FieldHistoryTimeline.tsx

key-decisions:
  - 'Number-locale source is the file-local isRTL (from useDirection); every number site becomes toFormatLocale(isRTL ? ar : en) — byte-identical to the old en-US branch, Latin in AR'
  - 'Bare no-option toLocaleDateString -> formatDayFirst; explicit year / dateStyle:medium -> formatDayFirstYear; date+time combos (bare toLocaleString, dateStyle+timeStyle, month+day+hour+minute) -> formatDateTime; chart ticks -> date-fns d MMM'
  - 'StakeholderTimelineCard date honored the plan-explicit formatDayFirst (not formatDayFirstYear) despite a year option, per the per-file action list'

patterns-established:
  - 'Wave-2 slice migration is mechanical: import the helper(s), rewrite date sites to drop the locale arg, swap number-site locale to toFormatLocale, delete orphaned locale ternaries'

requirements-completed: [FMT-02, FMT-04]

# Metrics
duration: ~18min
completed: 2026-07-04
---

# Phase 82 Plan 02: Analytics / SLA / Audit / Tasks / Stakeholder Date+Number Slice Summary

**Migrated all 19 analytics/sla-monitoring/audit/tasks/stakeholder/field-history components onto the 82-01 canonical helpers — chart date ticks are now day-first `d MMM`, every timestamp routes through `formatDayFirst`/`formatDayFirstYear`/`formatTime`/`formatDateTime`, and every locale-aware number site renders Latin digits in AR via `toFormatLocale`. Zero ad-hoc `toLocaleDateString`/`toLocaleTimeString` and zero bare `'ar-SA'` remain in the slice.**

## Performance

- **Duration:** ~18 min
- **Completed:** 2026-07-04
- **Tasks:** 2 (mechanical per-file migration)
- **Files modified:** 19

## Accomplishments

- **Task 1 (9 files — analytics + sla-monitoring):** 5 analytics charts + 4 SLA components. Chart axis date ticks (`RelationshipHealthChart`, `EngagementMetricsChart`, `CommitmentFulfillmentChart`, `SLAComplianceChart`) now use date-fns `format(d, 'd MMM')`; tooltip/KPI/row-count numbers route through `toFormatLocale`; `SLAEscalationsList` timestamp combo uses `formatDateTime`.
- **Task 2 (10 files — audit/activity/tasks/stakeholder/field-history):** date+time combos (`TaskDetail` created/updated/completed, `TaskCard` created/deadline, `SLAIndicator` deadline, `FieldHistoryTimeline` value+entry) → `formatDateTime`; bare/period dates → `formatDayFirst`; year/dateStyle dates → `formatDayFirstYear`; event counts + `Intl.NumberFormat` → `toFormatLocale`.
- Verified: `pnpm type-check` exit 0; both grep gates 0 (no `toLocaleDateString`/`toLocaleTimeString`, no `'ar-SA'`); no month-first `M{3,4},? d` literal in any owned file; ESLint clean on all touched files; TaskCard + SLAIndicator + overview test suites 56/56 pass.

## Task Commits

Each task committed atomically (explicit pathspec, shared main index):

1. **Task 1: analytics + sla-monitoring (9 files)** — `cff60d40` (feat)
2. **Task 2: audit/activity/tasks/stakeholder/field-history (10 files)** — `72de66c2` (feat)

## Decisions Made

- **Number-locale source = file-local `isRTL`.** Every file already derived `isRTL` from `useDirection()`; number sites became `toFormatLocale(isRTL ? 'ar' : 'en')`. Output is byte-identical to the old `'en-US'` branch and Latin in AR (the 82-01 lynchpin).
- **Helper-by-shape mapping** applied mechanically (see key-decisions). Bare `toLocaleDateString` (no options) mapped to `formatDayFirst` per the plan's "everything else" rule — the app-canonical near-term day-first format; the year is intentionally dropped there per phase D-82-01.
- **`StakeholderTimelineCard` date** used `formatDayFirst` (plan-explicit) even though the old call carried a `year` option — the per-file action list overrides the general year→`formatDayFirstYear` rule.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] FieldHistoryTimeline relative-time left Indic in AR**

- **Found during:** Task 2 (FieldHistoryTimeline)
- **Issue:** `getRelativeTime` used `new Intl.RelativeTimeFormat(isRTL ? 'ar' : 'en', …)`. Bare `'ar'` renders Arabic-Indic digits (`قبل ٣ أيام`), directly contradicting D-82-05's observable outcome ("no Arabic-Indic digits surface anywhere in the AR UI"). The plan's Task-2 site list for this file named `:93`/`:109`/`:228` but not the `:133` relative-time site; the grep gates key on `'ar-SA'` and would not catch a bare `'ar'`.
- **Fix:** Routed it through `toFormatLocale(isRTL ? 'ar' : 'en')` → `'ar-u-nu-latn'` (Latin digits, Arabic words). Same call shape.
- **Files modified:** frontend/src/components/field-history/FieldHistoryTimeline.tsx
- **Verification:** `new Intl.RelativeTimeFormat('ar-u-nu-latn').format(-3,'day')` → Latin `3`; type-check + lint clean.
- **Committed in:** 72de66c2 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — serves this owned file's Latin-digit outcome; trivial one-line, in scope).
**Impact on plan:** None negative — closes an in-file Indic-digit leak the phase exists to eliminate. No scope creep beyond the owned file.

## Issues Encountered

- None. The pre-commit hook (prettier/lint) reformatted a few migrated lines (collapsed multi-line JSX, single-line rtf) — cosmetic, captured in the task commits.

## User Setup Required

None — render-path formatting only; no data, dependency, or config changes.

## Next Phase Readiness

- Slice 1 of 4 done. 82-03 / 82-04 / 82-07 (disjoint files) can proceed independently; wave-3 date-guard (D-82-03) will now find zero raw sites in these 19 files.

## Self-Check: PASSED

- Grep gates: 0 `toLocaleDateString`/`toLocaleTimeString`, 0 `'ar-SA'` across all 19 owned files
- No month-first `M{3,4},? d` literal in any owned file
- `pnpm type-check` exit 0; ESLint clean; 56/56 touched-area tests pass
- Commits cff60d40, 72de66c2 present in git log

---

_Phase: 82-date-number-formatting_
_Completed: 2026-07-04_
