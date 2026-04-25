---
phase: 39-kanban-calendar
plan: 05
subsystem: calendar
tags: [calendar, month-grid, rtl, i18n, design-system, wave-1]
requires:
  - 39-00 (toArDigits, calendar i18n keys, E2E spec stubs)
provides:
  - frontend/src/components/calendar/CalendarMonthGrid.tsx
  - frontend/src/components/calendar/CalendarEventPill.tsx (placeholder; replaced by 39-06)
  - frontend/src/components/calendar/calendar.css (.cal-grid, .cal-dow, .cal-cell, .cal-d)
  - Active E2E coverage: calendar-render, calendar-rtl
affects:
  - frontend/src/components/calendar/UnifiedCalendar.tsx (in-place month-view surgery)
tech-stack:
  added: []
  patterns:
    - In-place reskin of UnifiedCalendar (no rename — D-02 LOCKED)
    - Static const arrays for bilingual dow labels (verbatim handoff)
    - LtrIsolate wrapping numeric content to prevent bidi mirroring
    - CSS tokens only (var(--surface), var(--line), var(--ink-mute), var(--accent-ink), var(--font-mono))
key-files:
  created:
    - frontend/src/components/calendar/CalendarMonthGrid.tsx
    - frontend/src/components/calendar/CalendarEventPill.tsx
    - frontend/src/components/calendar/calendar.css
    - frontend/src/components/calendar/__tests__/CalendarMonthGrid.test.tsx
  modified:
    - frontend/src/components/calendar/UnifiedCalendar.tsx
    - frontend/tests/e2e/calendar-render.spec.ts
    - frontend/tests/e2e/calendar-rtl.spec.ts
decisions:
  - CalendarEventPill placeholder created in 39-05 (Plan 39-06 replaces it).
  - Day numbers always pass through toArDigits — never rely on toLocaleString('ar').
  - LtrIsolate around `.cal-d` numeric span prevents day-number bidi mirroring.
  - Spec uses localStorage key `id.locale` (project i18next lookup), not default `i18nextLng`.
metrics:
  duration: ~25m
  completed: 2026-04-25
  tasks: 3/3
  commits: 3
  unit_tests: 9 passing
---

# Phase 39 Plan 05: CalendarMonthGrid Summary

In-place surgery on `UnifiedCalendar.tsx`: replaced the legacy Tailwind `grid-cols-7` month-view block with a verbatim handoff `.cal-grid` 7×N layout via a new `CalendarMonthGrid` component. Bilingual dow header, today highlight on `var(--accent-ink)`, other-month dim at opacity 0.4, Arabic-Indic day digits, and `linkedItemType`/`linkedItemId` props preserved for Phase 41.

## Commits

| Task | SHA        | Message                                                        |
| ---- | ---------- | -------------------------------------------------------------- |
| 1    | `b3621e2d` | feat(39-05): build CalendarMonthGrid 7xN bilingual layout      |
| 2    | `c3d3cc84` | feat(39-05): mount CalendarMonthGrid into UnifiedCalendar      |
| 3    | `0deed101` | test(39-05): activate calendar-render + calendar-rtl E2E specs |

## Verification

- `pnpm test --run src/components/calendar` → **9/9 passing** (CalendarMonthGrid.test.tsx)
- Targeted typecheck on calendar files via `tsc --noEmit` → **0 errors**
- E2E spec parse via `tsc` (standalone) → **0 errors**
- Acceptance grep checks all green:
  - `<CalendarMonthGrid` mounted in UnifiedCalendar.tsx
  - `linkedItemType` (3 hits) and `linkedItemId` (4 hits) preserved
  - `import './calendar.css'` present
  - Old `grid-cols-7` Tailwind pattern removed (0 hits)
- E2E specs no longer skipped (`grep -c test.describe.skip` returns 0 in both)

## Truths Honoured

- 7×N `.cal-grid` rendered with 1px gap on `var(--line)` background ✓
- DOW header: English (`Sun..Sat`) in en, Arabic (`أحد..سبت`) in ar ✓
- Today's `.cal-d` styled `color: var(--accent-ink); font-weight: 700;` via CSS rule ✓
- Other-month cells: `.cal-cell.other { opacity: 0.4 }` and clickable `onMonthChange` ✓
- Day numbers run through `toArDigits` in `ar` locale ✓
- `UnifiedCalendar` props `linkedItemType` / `linkedItemId` preserved (D-02) ✓

## Deviations from Plan

### Auto-fixed (Rule 1/2/3)

**1. [Rule 3 — Cleanup] Removed unused imports + memos in UnifiedCalendar surgery**

- **Found during:** Task 2
- **Issue:** Replacing the month-view block left `eachDayOfInterval`, `isSameMonth`, `isSameDay`, the `Clock` icon, the `useMemo` import, and the `calendarDays`/`eventsByDay` memos unused. The project ESLint enforces `@typescript-eslint/no-unused-vars: error`.
- **Fix:** Removed the unused imports + memos in the same commit so build stays green.
- **Files modified:** frontend/src/components/calendar/UnifiedCalendar.tsx
- **Commit:** c3d3cc84

**2. [Rule 3 — Naming hygiene] Const arrays renamed to UPPER_CASE**

- **Found during:** Task 1
- **Issue:** Plan suggested `const dowEn` / `const dowAr`. Project ESLint convention treats top-level immutable arrays as constants.
- **Fix:** Used `DOW_EN` / `DOW_AR` (still verbatim values from handoff). Acceptance criterion was the array literal, which matches.
- **Files modified:** frontend/src/components/calendar/CalendarMonthGrid.tsx

### Auth gates

None.

### Architectural changes (Rule 4)

None.

## Threat Surface

| Threat ID    | Disposition | Notes                                                                                          |
| ------------ | ----------- | ---------------------------------------------------------------------------------------------- |
| T-39-05-XSS  | mitigated   | DOW labels are static const arrays; event titles flow through React text nodes (auto-escaped). |
| T-39-05-IDOR | accepted    | `onEventClick` delegates to UnifiedCalendar's existing prop — no new auth surface.             |

No new threat flags discovered (no new endpoints, no new file access, no schema changes).

## Known Stubs

**`CalendarEventPill.tsx`** — 1-line stub button rendering `event.title_en ?? event.title_ar ?? event.id` with a `data-testid="cal-event-pill-stub"` marker. Plan 39-06 replaces this with the verbatim handoff pill (badge + AR digit time + bilingual title fallback). Acceptable because:

- It compiles, renders, and fires `onEventClick` (functional);
- The 39-05 unit tests assert _count and grouping_ of pills (not their internal markup);
- 39-06 is a Wave 1 sibling and will land before any user-facing release.

## Out-of-Scope Discoveries (deferred)

- The pre-existing `playwright.config.ts` ESM bug (already documented in 39-00) prevents `playwright test --list` from succeeding. 39-09 owns the runner fix. The activated specs parse cleanly via standalone `tsc` and follow the same shape as `dashboard-rtl.spec.ts`.

## Self-Check: PASSED

- frontend/src/components/calendar/CalendarMonthGrid.tsx → FOUND
- frontend/src/components/calendar/CalendarEventPill.tsx → FOUND
- frontend/src/components/calendar/calendar.css → FOUND
- frontend/src/components/calendar/**tests**/CalendarMonthGrid.test.tsx → FOUND
- frontend/src/components/calendar/UnifiedCalendar.tsx → FOUND (modified)
- frontend/tests/e2e/calendar-render.spec.ts → FOUND (activated)
- frontend/tests/e2e/calendar-rtl.spec.ts → FOUND (activated)
- Commit b3621e2d → FOUND in `git log`
- Commit c3d3cc84 → FOUND in `git log`
- Commit 0deed101 → FOUND in `git log`
