---
phase: 82-date-number-formatting
plan: 04
subsystem: ui
tags: [i18n, intl, date-formatting, rtl, arabic, latin-digits, dashboard, my-work]

# Dependency graph
requires:
  - phase: 82-date-number-formatting
    provides: '82-01 lib foundations — formatDayFirst/formatTime/formatDayFirstYear/formatDateTime + toFormatLocale (ar-u-nu-latn)'
provides:
  - 'FMT-01 acceptance surface: ActionBar greeting day-first no-comma via formatDayFirst; Intelligence Digest row timestamps day-first via formatDateTime (both render ON the dashboard)'
  - 'All 29 pages/** and routes/** date sites migrated onto the 4-helper format-date surface (D-82-02), including named offender BriefsPage + previously-unowned AssignmentQueue/CalendarTab/dossier-list sites'
  - 'my-work number surfaces (WorkSummaryHeader/WorkItemTabs/ProductivityMetrics/TeamWorkloadPanel) route through toFormatLocale — Latin digits in AR (D-82-05)'
  - 'BriefsPage + pages/MyTasks toArDigits wraps removed; BriefsPage test flipped to assert Latin (no toArDigits string remains)'
affects: [82-05, 82-06, wave-2-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'WeekAhead special case: date-fns EEE/dd for the weekday-chip/day-number split (Latin natively, day-first-compatible, does not trip the future month-first guard); formatTime composed for the time range'
    - 'Intl.DateTimeFormat objects consumed by children keep their contract — only the locale swaps to toFormatLocale (CalendarTab), rather than a helper substitution that would break .format() call sites'

key-files:
  created:
    - .planning/phases/82-date-number-formatting/82-04-SUMMARY.md
  modified:
    - frontend/src/pages/Dashboard/components/ActionBar.tsx
    - frontend/src/pages/Dashboard/widgets/Digest.tsx
    - frontend/src/pages/Dashboard/widgets/WeekAhead.tsx
    - frontend/src/pages/Briefs/BriefsPage.tsx
    - frontend/src/pages/MyTasks.tsx
    - frontend/src/pages/engagements/workspace/CalendarTab.tsx

key-decisions:
  - 'CalendarTab: swapped the Intl.DateTimeFormat locale to toFormatLocale (removes ar-SA, Latin digits) rather than replacing the formatter with a format-date helper — the formatter is passed to children as an Intl.DateTimeFormat (long-month + weekday shape no helper matches, children call .format())'
  - 'WebhooksPage :1017 and other toLocaleString date+time combos already routed through toFormatLocale left as-is (already Latin, outside D-82-02s locked toLocaleDateString scope)'
  - 'widgets/MyTasks + WorkItemCard keep their date-fns { locale } option, flipping only MMM d -> d MMM (minimal diff; date-fns ar yields Latin digits, so digit policy holds)'

patterns-established:
  - 'Owned-file grep gates are the acceptance contract: zero toLocaleDate/Time, zero ar-SA, no month-first literal, no toArDigits under Briefs/MyTasks'

requirements-completed: [FMT-01, FMT-02, FMT-04]

# Metrics
duration: ~26min
completed: 2026-07-04
---

# Phase 82 Plan 04: Pages/Routes Date+Number Migration Summary

**All 29 pages/** and routes/** date+number sites migrated onto the format-date 4-helper surface — the FMT-01 dashboard greeting now reads day-first no-comma, Digest timestamps read day-first, my-work numbers are Latin via toFormatLocale, and the BriefsPage/MyTasks overlap files are fully digit-unwrapped.**

## Performance

- **Duration:** ~26 min
- **Completed:** 2026-07-04
- **Tasks:** 2 (both `type=auto`)
- **Files modified:** 29 (+ 1 flipped test, + this SUMMARY)

## Accomplishments

- **FMT-01 acceptance surface (dashboard):** `ActionBar` greeting `format(new Date(), 'EEEE, MMMM d, yyyy')` → `formatDayFirst(new Date())` (day-first no-comma — fixes the F4 "Sat, Jul 4" greeting); `Digest` row timestamps `.toLocaleString('ar-SA', {…})` → `formatDateTime` (both render ON the dashboard, so the 82-06 no-Indic dashboard check depends on them).
- **WeekAhead special case:** weekday-chip/day-number split → date-fns `format(d,'EEE')` / `format(d,'dd')` (Latin, day-first-compatible); the time range → composed `formatTime(...)` calls; both `'ar-SA'` locale vars deleted and the now-unused `language` plumbing (WeekRow prop + `i18n`) removed.
- **my-work number surfaces (D-82-05):** `WorkSummaryHeader`, `WorkItemTabs`, `ProductivityMetrics`, `TeamWorkloadPanel` route their `toLocaleString`/`Intl.NumberFormat` through `toFormatLocale` — Latin digits in AR, call shape preserved.
- **Overlap files fully resolved:** `BriefsPage` (named offender) — local `formatDayFirst` shadow deleted, imported from `@/lib/format-date`, `toArDigits` import + both wraps removed; `pages/MyTasks` — local `formatDueDate` replaced with `formatDayFirst`, `toArDigits` removed. `BriefsPage.test.tsx` inverted to assert Latin (absent Indic) and stripped of every `toArDigits` string (header doc + `it()` name).
- **Task 2 pages/routes:** engagements workspace (Docs/Audit/Calendar), queues (Assignment/Intake), admin routes (approvals, data-retention, field-permissions), stakeholder-influence, and the previously-unowned dossier list pages (topics/forums) migrated to `formatDayFirst`/`formatDayFirstYear`/`formatDateTime`.

## Task Commits

Each task was committed atomically (explicit pathspec; shared working-tree index):

1. **Task 1: Dashboard greeting + Digest + WeekAhead + my-work + BriefsPage/MyTasks overlaps (15 files)** — `c65354ca` (feat)
2. **Task 2: Engagements workspace + queues + admin/dossier routes (14 files)** — `8afc2ca3` (feat)

**Plan metadata:** this commit (docs: complete plan)

## Files Created/Modified

**Task 1 (15):** ActionBar.tsx, AttentionItem.tsx, WeekAhead.tsx, widgets/MyTasks.tsx, Digest.tsx, my-work/{WorkItemCard, WorkSummaryHeader, WorkItemTabs, ProductivityMetrics, TeamWorkloadPanel}.tsx, pages/MyTasks.tsx, Briefs/BriefsPage.tsx, Briefs/**tests**/BriefsPage.test.tsx, WorkingGroupsPage.tsx, IntakeQueue.tsx

**Task 2 (14):** engagements/workspace/{DocsTab, AuditTab, CalendarTab}.tsx, AssignmentQueue.tsx, webhooks/WebhooksPage.tsx, advanced-search/AdvancedSearchPage.tsx, users/UsersListPage.tsx, routes/\_protected/approvals/index.tsx, routes/\_protected/admin/{approvals, data-retention, field-permissions}.tsx, routes/\_protected/stakeholder-influence.tsx, routes/\_protected/dossiers/topics/-TopicsListPage.tsx, routes/\_protected/dossiers/forums/index.tsx

## Decisions Made

- **CalendarTab formatter swap, not replacement.** The plan asked to "replace the formatter with the matching format-date helper". The `dateFormatter` at :74 is an `Intl.DateTimeFormat` (long month + weekday) passed to two child components (`dateFormatter: Intl.DateTimeFormat`) that call `.format()`. Substituting a helper would break the child prop contract and change the visual shape (long "April" → short "Apr"). Instead the `'ar-SA'` locale var was swapped to `toFormatLocale(i18n.language)` — this removes the raw `'ar-SA'` literal and yields Latin digits in AR while preserving the Intl contract. Satisfies the D-82-05 acceptance grep (zero `'ar-SA'`) exactly. (Rule 3 — plan instruction infeasible against the actual code contract.)
- **`toLocaleString` combos already-migrated left in place.** `WebhooksPage :1017` and `data-retention` sibling combos already routed through `toFormatLocale` (Latin) are outside D-82-02's locked `toLocaleDateString` scope — left untouched per the plan's out-of-scope note (only `data-retention :823` was explicitly in-scope → `formatDateTime`).
- **widgets/MyTasks + WorkItemCard kept `{ locale }`.** Only the literal flipped `'MMM d'` → `'d MMM'`; date-fns `ar` emits Latin digits (verified), so the digit policy holds and the diff stays minimal.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `formatDayFirst` type signature rejects `null` (pages/MyTasks)**

- **Found during:** Task 1 (pages/MyTasks overlap)
- **Issue:** `task.sla_deadline` is `string | null`; the old local `formatDueDate` accepted `null`, but the imported `formatDayFirst(date: Date | string | number, …)` does not — `tsc` error TS2345.
- **Fix:** `formatDayFirst(task.sla_deadline ?? '')` — the helper returns the em-dash placeholder for empty input, matching the old null behavior.
- **Files modified:** frontend/src/pages/MyTasks.tsx
- **Verification:** `pnpm type-check` exit 0.
- **Committed in:** c65354ca (Task 1 commit)

**2. [Rule 3 - Blocking] Orphaned `isRTL`/`i18n` after date-site removal**

- **Found during:** Task 2 (DocsTab, WebhooksPage)
- **Issue:** Removing the `'ar-SA'`/`toFormatLocale` date sites orphaned the `BriefCard` `isRTL` prop (DocsTab) and the `WebhookCard` `i18n` destructure (WebhooksPage) — `tsc` TS6133 (noUnusedLocals is on).
- **Fix:** Dropped the unused `isRTL` prop + its pass-through, and the unused `i18n` destructure. Same cleanup applied inline to AuditTab (`i18n`) and AssignmentQueue/approvals-index (`i18n` + `dateLocale`).
- **Files modified:** DocsTab.tsx, WebhooksPage.tsx, AuditTab.tsx, AssignmentQueue.tsx, approvals/index.tsx
- **Verification:** `pnpm type-check` exit 0.
- **Committed in:** 8afc2ca3 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both blocking). Plus one documented decision (CalendarTab formatter swap) recorded under Decisions Made.
**Impact on plan:** All auto-fixes were compile-blockers surfaced by the migration; the CalendarTab decision satisfies the acceptance grep without breaking the Intl child contract. No scope creep.

## Issues Encountered

- None beyond the deviations above. Owned-file grep gates all clean (zero `toLocaleDate/Time`, zero `'ar-SA'`, no month-first literal, no `toArDigits` under Briefs/MyTasks), `pnpm type-check` exit 0, BriefsPage suite green (5/5), touched-area specs green (WeekAhead/Digest/widgets-MyTasks 18/18; CalendarTabCtas/Forums/Topics 17/17).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- FMT-02 wave-2 slice 4 of 4 landed. Phase-wide FMT-02 gate now shows 20 remaining `toLocaleDateString` sites — all in the other wave-2 plans' files (82-07 not yet landed); zero remain in this plan's 29 owned files.
- The dashboard no-Indic surface (ActionBar greeting + Digest) is in place for the 82-06 Task-3 `/[٠-٩]/` render check.
- `toArDigits` still exists for downstream consumers (KCard/calendar); its full deletion is 82-05 scope.

## Self-Check: PASSED

- FOUND: .planning/phases/82-date-number-formatting/82-04-SUMMARY.md
- FOUND: commit c65354ca (Task 1), 8afc2ca3 (Task 2)
- Gates: zero toLocaleDate/Time + zero 'ar-SA' across all 29 owned files; ActionBar no month-first literal; no toArDigits under src/pages/Briefs or MyTasks.tsx

---

_Phase: 82-date-number-formatting_
_Completed: 2026-07-04_
