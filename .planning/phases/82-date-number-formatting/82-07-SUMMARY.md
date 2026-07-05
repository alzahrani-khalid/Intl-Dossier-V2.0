---
phase: 82-date-number-formatting
plan: 07
subsystem: ui
tags: [i18n, intl, date-formatting, rtl, arabic, latin-digits, wave-2-migration]

# Dependency graph
requires:
  - phase: 82-date-number-formatting
    provides: '82-01 4-helper surface (formatDayFirst/formatDayFirstYear/formatTime/formatDateTime) + toFormatLocale ar-u-nu-latn'
provides:
  - '22 legislation/comparison/viz/ui/layout/meetings/timeline/compliance/list-page components route dates through lib/format-date'
  - 'ClassificationBar Latin day-first ribbon (forced Indic ar-SA-u-nu-arab removed)'
  - 'zero month-first date-fns literals in meeting-minutes/assignments/availability-polling — 82-06 guard lands clean'
affects: [82-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Fixed-option Intl/toLocale date renders → format-date helper; compact chips → date-fns d MMM'
    - 'Variable-options zoom formatter (InteractiveTimeline) keeps Intl.DateTimeFormat but routes locale via toFormatLocale (Latin-safe, zoom-label-preserving)'

key-files:
  created: []
  modified:
    - frontend/src/components/legislation/LegislationDetail.tsx
    - frontend/src/components/legislation/LegislationList.tsx
    - frontend/src/components/entity-comparison/EntityComparisonTable.tsx
    - frontend/src/components/entity-links/EntitySearchDialog.tsx
    - frontend/src/components/geographic-visualization/WorldMapVisualization.tsx
    - frontend/src/components/milestone-planning/MilestoneCard.tsx
    - frontend/src/components/engagement-recommendations/RecommendationCard.tsx
    - frontend/src/components/relationships/AdvancedGraphVisualization.tsx
    - frontend/src/components/report-builder/ReportPreview.tsx
    - frontend/src/components/ui/pull-to-refresh-indicator.tsx
    - frontend/src/components/ui/file-upload.tsx
    - frontend/src/components/layout/ClassificationBar.tsx
    - frontend/src/components/meeting-minutes/MeetingMinutesCard.tsx
    - frontend/src/components/meeting-minutes/ActionItemsList.tsx
    - frontend/src/components/assignments/EscalationDashboard.tsx
    - frontend/src/components/availability-polling/AvailabilityPollVoter.tsx
    - frontend/src/components/availability-polling/AvailabilityPollResults.tsx
    - frontend/src/components/timeline/InteractiveTimeline.tsx
    - frontend/src/components/timeline/TimelineEventCard.tsx
    - frontend/src/components/timeline/EnhancedVerticalTimelineCard.tsx
    - frontend/src/components/compliance/ComplianceViolationAlert.tsx
    - frontend/src/components/list-page/EngagementsList.tsx

key-decisions:
  - 'InteractiveTimeline formatDateLabel kept its Intl.DateTimeFormat + per-zoom options switch and only swapped the ar-SA/en-US locale literal to toFormatLocale(locale) — forcing formatDayFirstYear onto the month/quarter/year zoom branches would have shown wrong labels (a bug), so the Latin-safe locale swap preserves every zoom label while eliminating the Indic source'
  - 'EscalationDashboard number sites (total_escalations/affected_assignments toLocaleString) were already on toFormatLocale from a prior wave — left untouched; only the two month-first date-fns literals fixed'
  - 'Compact chips (RecommendationCard OptimalTimingBadge, availability-polling MMM d) use date-fns d MMM rather than formatDayFirst to avoid adding a weekday to a compact badge'

patterns-established:
  - 'Delete locale-threaded local formatDate helpers when the target helper is locale-agnostic; drop the now-unused i18n/isRTL/toFormatLocale imports the edit orphans'

requirements-completed: [FMT-02, FMT-04]

# Metrics
duration: ~35min
completed: 2026-07-04
---

# Phase 82 Plan 07: Wave-2 Migration Slice 2 (legislation/timeline/compliance/meetings) Summary

**Migrated 22 components onto the `lib/format-date` 4-helper surface, killed the ClassificationBar forced-Indic ribbon, and cleared every month-first date-fns literal in this slice so the 82-06 guard lands on a clean tree.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-07-04
- **Tasks:** 2 (11 files each)
- **Files modified:** 22

## Accomplishments

- **Task 1 (11 files):** legislation/comparison/visualization/ui slice. LegislationDetail's 8 bare date renders → `formatDayFirstYear` + the `changed_at` `.toLocaleString` → `formatDateTime`; LegislationList meta chip; EntityComparisonTable's `Intl.NumberFormat` routed through `toFormatLocale` and its date → `formatDayFirstYear`; EntitySearchDialog / WorldMap / ReportPreview / AdvancedGraph slider labels → `formatDayFirstYear`; MilestoneCard dropped its locale-threaded `formatDate` helper; RecommendationCard OptimalTimingBadge → date-fns `d MMM`; pull-to-refresh relative-time fallbacks → `formatDateTime`/`formatTime`; file-upload modified caption → `formatDayFirstYear`.
- **Task 2 (11 files):** ClassificationBar's `ar-SA-u-nu-arab` forced-Indic ribbon → `formatDayFirstYear` (Latin day-first); MeetingMinutesCard named offender `format(..., 'MMM d, yyyy')` → `formatDayFirstYear`; all month-first date-fns literals (`'MMM d'`, `'MMM dd'`, `'MMM dd, yyyy'`) in ActionItemsList/EscalationDashboard cleared to `d MMM`/`formatDayFirstYear`; availability-polling `'EEEE, MMMM d'` → `formatDayFirst` (weekday kept) and `'MMM d'` → `d MMM`; timeline cards' `ar-SA` Intl.DateTimeFormat formatters → `formatDateTime`/`formatDayFirstYear`/`formatTime`; ComplianceViolationAlert/EngagementsList `ar-SA` renders → `formatDateTime`.

## Task Commits

Each task committed atomically (explicit pathspec; shared working-tree index):

1. **Task 1: legislation/comparison/viz/ui slice** — `48d2f7e0` (feat, 11 files)
2. **Task 2: month-first stragglers + timeline/compliance/list-page** — `4cf87497` (feat, 11 files)

## Decisions Made

- **InteractiveTimeline** `formatDateLabel` builds a variable `Intl.DateTimeFormatOptions` per zoom level (day/week/month/quarter/year/all). The four helpers can't represent "month long + year" or "year only" without showing a spurious day, so I kept the `Intl.DateTimeFormat` + options switch and only swapped `locale === 'ar' ? 'ar-SA' : 'en-US'` → `toFormatLocale(locale)`. That kills the `ar-SA` Indic source (guard clean, Latin digits) while preserving every zoom-level label exactly.
- **EscalationDashboard** number sites (`total_escalations`/`affected_assignments`) already routed through `toFormatLocale` from a prior wave — left as-is; only the two month-first date literals were in scope.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] pull-to-refresh-indicator import name collided with a local `formatTime`**

- **Found during:** Task 1 (type-check gate)
- **Issue:** The second component (`SyncStatusBar`) has a local relative-time helper also named `formatTime`; importing `formatTime` from `@/lib/format-date` and calling it in the else-branch recursed into the local function (`TS6133` on the unused import + latent infinite recursion).
- **Fix:** Imported the canonical helper aliased as `formatGstTime` and called that in the absolute-time fallback.
- **Files modified:** frontend/src/components/ui/pull-to-refresh-indicator.tsx
- **Committed in:** 48d2f7e0

**2. [Rule 1 - Bug avoided] InteractiveTimeline helper-forcing would have produced wrong zoom labels**

- **Found during:** Task 2
- **Issue:** The plan's per-branch rule ("year present → formatDayFirstYear") applied literally to the month/quarter/year zoom branches would render `28 Apr 2026` where the axis must show `April 2026` / `2026`.
- **Fix:** Kept the options switch, swapped only the locale literal to `toFormatLocale(locale)` — Latin-safe, no `ar-SA`, labels intact.
- **Files modified:** frontend/src/components/timeline/InteractiveTimeline.tsx
- **Committed in:** 4cf87497

**Total deviations:** 2 (1 blocking fix, 1 correctness-preserving substitution). No scope creep; observable D-82-05 outcome (no `ar-SA`, Latin digits) fully satisfied in all 22 files.

## Verification

- `rg "toLocaleDateString|toLocaleTimeString"` across all 22 files → **0**
- `rg "'ar-SA'"` across all 22 files → **0**; `rg "u-nu-arab"` ClassificationBar → **0**
- `rg "M{3,4},? d"` (82-06 guard's month-first detector) across meeting-minutes/EscalationDashboard/availability-polling → **0**
- Phase-wide `rg "toLocaleDateString" src` (non-test, excl. `lib/format-date.ts` + `ui/calendar.tsx`) → **0**
- `pnpm type-check` → exit 0
- `pnpm vitest run src/components/timeline src/components/meeting-minutes src/components/availability-polling` → 9 passed; `EngagementsList.test.tsx` → 7 passed

## Known Stubs

None.

## Threat Flags

None — render-time formatting of already-fetched data; no new inputs, dependencies, endpoints, or `dangerouslySetInnerHTML` in any touched file (T-82-01 mitigated by React text-node rendering).

## Self-Check: PASSED

- FOUND: frontend/src/components/meeting-minutes/MeetingMinutesCard.tsx (formatDayFirstYear)
- FOUND: frontend/src/components/layout/ClassificationBar.tsx (formatDayFirstYear, no u-nu-arab)
- FOUND: all 22 modified files present with format-date imports
- Commits 48d2f7e0, 4cf87497 present in git log

---

_Phase: 82-date-number-formatting_
_Completed: 2026-07-04_
