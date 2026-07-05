---
phase: 82-date-number-formatting
plan: 03
subsystem: ui
tags: [i18n, intl, date-formatting, rtl, arabic, latin-digits, calendar, dossier, commitments]

# Dependency graph
requires:
  - phase: 82-date-number-formatting
    provides: '82-01 format-date 4-helper surface + toFormatLocale ar-u-nu-latn lynchpin'
provides:
  - '30 calendar/dashboard-widgets/dossier/commitments/engagements component files migrated onto the format-date 4-helper surface'
  - 'Dashboard KpiWidget + BenchmarkPreview numbers and the 3 widget Intl.RelativeTimeFormat locales routed through toFormatLocale (Latin digits on the AR dashboard)'
  - 'AfterActionsTable overlap fully resolved: local en-GB shadow + all 3 toArDigits wraps + doc-comment mention removed (imports formatDayFirst)'
affects: [82-05, 82-06, wave-4-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Helper-selection rule applied per site: year → formatDayFirstYear; time-only → formatTime; date+time combo (incl. bare .toLocaleString on a Date) → formatDateTime; else formatDayFirst'
    - 'Hand-rolled `locale === "ar-SA"` AR language branches re-keyed to isRTL (KeyContactsSection, ActivityTimelineSection) since the locale var was deleted'
    - 'Orphaned locale vars / i18n destructures removed wherever the migration made them dead (no-unused-vars is error-level)'

key-files:
  created: []
  modified:
    - frontend/src/components/calendar/ConflictResolution/ReschedulingSuggestions.tsx
    - frontend/src/components/calendar/ConflictResolution/ConflictResolutionPanel.tsx
    - frontend/src/components/calendar/ConflictResolution/SchedulingConflictComparison.tsx
    - frontend/src/components/calendar/ConflictResolution/WhatIfScenarioPanel.tsx
    - frontend/src/components/calendar/RecurrencePatternEditor.tsx
    - frontend/src/components/calendar/CalendarSyncSettings.tsx
    - frontend/src/components/dashboard-widgets/TaskListWidget.tsx
    - frontend/src/components/dashboard-widgets/NotificationsWidget.tsx
    - frontend/src/components/dashboard-widgets/EventsWidget.tsx
    - frontend/src/components/dashboard-widgets/KpiWidget.tsx
    - frontend/src/components/dashboard-widgets/BenchmarkPreview.tsx
    - frontend/src/components/after-actions/AfterActionsTable.tsx
    - frontend/src/components/dossier/dossier-overview/DossierOverview.tsx
    - frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx
    - frontend/src/components/dossier/dossier-overview/sections/KeyContactsSection.tsx
    - frontend/src/components/dossier/dossier-overview/sections/CalendarEventsSection.tsx
    - frontend/src/components/dossier/dossier-overview/sections/ActivityTimelineSection.tsx
    - frontend/src/components/dossier/ActivityTimelineItem.tsx
    - frontend/src/components/dossier/ExpandableDossierCard.tsx
    - frontend/src/components/commitments/CommitmentCard.tsx
    - frontend/src/components/commitments/FilterChips.tsx
    - frontend/src/components/commitments/CommitmentDetailDrawer.tsx
    - frontend/src/components/commitments/deliverables/DeliverableCard.tsx
    - frontend/src/components/engagements/LifecycleTimeline.tsx
    - frontend/src/components/engagements/LifecycleStepperBar.tsx
    - frontend/src/components/approval-chain/ApprovalChain.tsx
    - frontend/src/components/active-filters/useActiveFilters.ts
    - frontend/src/components/advanced-search/DateRangeFilter.tsx
    - frontend/src/components/notifications/NotificationPreferences.tsx
    - frontend/src/components/positions/AttachmentUploader.tsx

key-decisions:
  - 'Migrated toFormatLocale-for-dates files onto the 4-helper surface even though they already produced Latin digits, so the whole slice matches the app-wide day-first shape (D-82-02)'
  - 'Re-keyed ar-SA language branches to isRTL rather than to the corrected toFormatLocale, because those branches select Arabic relative-time STRINGS, not a numbering system'
  - 'Times routed through formatTime gain the canonical `GST` suffix / Asia/Dubai zone (e.g. `14:30 GST`); a time-range therefore reads `14:30 GST - 15:30 GST`'

patterns-established:
  - 'Bare .toLocaleString(locale) on a Date → formatDateTime (Tue 28 Apr 14:30 GST); named local formatDateTime wrappers alias the lib helper (formatDateTime as formatDateTimeGst) to avoid shadowing'

requirements-completed: [FMT-02, FMT-04]

# Metrics
duration: ~30min
completed: 2026-07-04
---

# Phase 82 Plan 03: Wave-2 Migration Slice (calendar / dashboard-widgets / dossier / commitments / engagements) Summary

**Migrated 30 component files onto the `lib/format-date` 4-helper surface, routed the dashboard widgets' `Intl.RelativeTimeFormat` + `KpiWidget`/`BenchmarkPreview` numbers through the Latin-safe `toFormatLocale`, and fully resolved the `AfterActionsTable` overlap (date shadow + all `toArDigits` wraps and its doc-comment mention gone) — zero `'ar-SA'` and zero ad-hoc date/time sites remain across the slice.**

## Performance

- **Duration:** ~30 min
- **Completed:** 2026-07-04
- **Tasks:** 2 (both `type="auto"`)
- **Files modified:** 30

## Accomplishments

- **Task 1 — calendar + dashboard-widgets + AfterActionsTable (12 files):**
  - Calendar ConflictResolution/Recurrence/Sync: date + time render sites → `formatDayFirst`/`formatTime`/`formatDayFirstYear`; `CalendarSyncSettings`' three `'ar-SA'` `.toLocaleString` date+time combos (`last_sync_at` + both conflict snapshots) → `formatDateTime`.
  - Dashboard widgets: `TaskListWidget`/`NotificationsWidget`/`EventsWidget` date sites → helpers, their file-local `'ar-SA'` `Intl.RelativeTimeFormat` locale vars → `toFormatLocale(i18n.language)`; `EventsWidget` same-day time → `formatTime`.
  - `KpiWidget:164` and `BenchmarkPreview:163` (previously-unowned dashboard-rendered Indic number sources) → `toFormatLocale` — mandatory for the 82-06 no-Indic dashboard render check.
  - `AfterActionsTable`: deleted the local en-GB day-first shadow, imported `formatDayFirst` from `@/lib/format-date`, removed the `toArDigits` import + all three call-site wraps AND the doc comment that mentioned `toArDigits` (wave-4 gate greps the string, not imports).
- **Task 2 — dossier + commitments + engagements + remaining (18 files):**
  - `DossierOverview` footer combo → `formatDateTime`; `DocumentsSection`/`KeyContactsSection`/`CalendarEventsSection`/`ActivityTimelineSection` dates+times → helpers; deleted the section `'ar-SA'` locale vars and re-keyed the `locale === 'ar-SA'` AR relative-time language branches in KeyContactsSection/ActivityTimelineSection to `isRTL`.
  - commitments (`CommitmentCard`/`FilterChips`/`CommitmentDetailDrawer`/`DeliverableCard`), engagements (`LifecycleTimeline`/`LifecycleStepperBar`), `ApprovalChain`, `useActiveFilters`, `DateRangeFilter`, `NotificationPreferences`, `AttachmentUploader`: dropped `toFormatLocale`-for-dates onto the 4-helper surface, removing every orphaned `toFormatLocale` import / `i18n` destructure / `locale` var the edit made dead.

## Task Commits

Each task committed atomically (explicit pathspec; shared main index; hooks ran, no `--no-verify`):

1. **Task 1** — `46e94345` (feat) — calendar + dashboard-widgets + AfterActionsTable
2. **Task 2** — `270dfe8c` (feat) — dossier + commitments + engagements + remaining components

## Decisions Made

- Kept named local `formatDate`/`formatTime`/`formatDateTime` wrappers where they are passed as props or used at many call sites; swapped only their internals to call the lib helpers. Where a local wrapper collided with the lib name (`CommitmentDetailDrawer.formatDateTime`), aliased the import (`formatDateTime as formatDateTimeGst`).
- `SchedulingConflictComparison` passed its local `formatDate`/`formatTime` down as props — replaced by passing the lib `formatDayFirst`/`formatTime` directly (compatible `(datetime: string) => string` signature).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `formatDayFirst` type signature rejects `undefined`**

- **Found during:** Task 1 (AfterActionsTable) — `type-check` flagged `r.engagement?.engagement_date` (`string | undefined`) against the lib param type `Date | string | number`.
- **Fix:** Coerced at the call site with `?? ''` (the helper maps `''` → the `—` placeholder, preserving prior behavior). Did NOT widen the 82-01 lib type (out of this plan's scope; shared by parallel plans).
- **Files modified:** frontend/src/components/after-actions/AfterActionsTable.tsx
- **Committed in:** 46e94345

**Total deviations:** 1 auto-fixed (1 blocking). No scope creep.

## Issues Encountered

- The plan's Task-1 verify command `pnpm vitest run src/components/dashboard-widgets` reports "No test files found" — there is **no** test suite under `src/components/dashboard-widgets` (the FROZEN_TIME note was speculative; the only widget test, `WeekAheadStatusKeys.test.ts`, lives under `src/pages/Dashboard/widgets/` and was NOT touched). No date-shape baselines needed updating.
- `src/components/commitments/StatusTimeline.tsx` still holds a `.toLocaleString(toFormatLocale(i18n.language))` combo, but it is **not** in this plan's `files_modified` (another wave-2 plan owns it) and its locale is already the Latin-safe `toFormatLocale` — left untouched per the scope guard.

## Verification

- **Combined gates (all 30 files):** 0 ad-hoc `toLocaleDateString/Time`, 0 bare `'ar-SA'`, 0 Indic-producing bare `Intl` locales (`RelativeTimeFormat('ar'`/`toLocaleString('ar'`/`NumberFormat('ar'`), 0 month-first date-fns literal (`M{3,4},? d`), 0 `toArDigits` string in `AfterActionsTable`.
- `pnpm type-check` exit 0.
- Touched-area vitest (dossier / commitments / engagements / approval-chain / advanced-search / active-filters / notifications / positions / calendar / after-actions): **275 passed**, 19 todo, 3 skipped, 0 failed.
- `pnpm exec eslint` on all 30 files: clean (exit 0) — no orphaned imports/vars.

## Known Stubs

None — all sites render already-fetched data through the shared helpers; no placeholder/empty data introduced.

## Self-Check: PASSED

- FOUND: 82-03-SUMMARY.md (this file)
- Commits 46e94345, 270dfe8c present in git log
- All 30 modified files present and migrated (grep gates return 0)

---

_Phase: 82-date-number-formatting_
_Completed: 2026-07-04_
