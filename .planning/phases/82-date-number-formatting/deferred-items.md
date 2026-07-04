# Phase 82 — Deferred Items

Out-of-scope discoveries logged during execution (per executor scope-boundary rule).
Not fixed in-phase. Candidates for Phase 83 (token/format debt) or a follow-up sweep.

## D1 — Guard blind spot: ad-hoc `Intl.DateTimeFormat` date sites

**Found during:** 82-06 Task 3 (AR render check + blind-spot scan).

`scripts/check-date-formatting.mjs` detects `toLocaleDateString` + month-first
date-fns literals (RESEARCH §5's two deliberate detectors) but NOT
`new Intl.DateTimeFormat(...).format(date)`. The render check exposed one live
offender on a Task-3 route — the dashboard hero greeting rendered `Sat, Jul 4`
(en-US month-first + comma) because it used
`Intl.DateTimeFormat(toFormatLocale('en'), …)` instead of the canonical
`formatDayFirst`. That one was fixed in 82-06 (Rule 1, on the verification route).

The following ad-hoc `Intl.DateTimeFormat` **date-display** sites remain. They are
OFF the three Task-3 routes (dashboard / kanban / calendar-main), all route through
`toFormatLocale` (Latin-safe — no Arabic-Indic digits), and several legitimately
need non-`Tue 28 Apr` shapes (calendar month headers, day cells). Not migrated:

- `src/components/consistency-panel/ConsistencyPanel.tsx:138`
- `src/pages/engagements/workspace/CalendarTab.tsx:76, 91`
- `src/pages/engagements/workspace/OverviewTab.tsx:55`
- `src/components/timeline/InteractiveTimeline.tsx:191`

(`ScheduleReportDialog.tsx:121` / `ScheduleFormDialog.tsx:102` use
`Intl.DateTimeFormat().resolvedOptions().timeZone` for timezone detection — NOT
date display; correctly excluded.)

**Recommendation for Phase 83:** decide whether to (a) extend the guard with an
`Intl.DateTimeFormat`-with-date-parts detector (needs an allowlist for legit custom
formats + format-date.ts), and/or (b) route the 5 sites above through
`format-date.ts` helpers where the `Tue 28 Apr` shape fits.
