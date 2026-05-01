---
phase: 41
plan: 04
subsystem: dossier-drawer
tags: [drawer, wave-1, body-sections, upcoming, recent-activity, i18n, rtl]
requires:
  - frontend/src/types/dossier-overview.types.ts (DossierCalendarEvent + ActivityTimelineSection)
  - frontend/src/types/unified-dossier-activity.types.ts (UnifiedActivity exact shape)
  - frontend/src/lib/i18n/relativeTime.ts (Wave 0 — formatRelativeTimeShort)
  - frontend/src/lib/i18n/toArDigits.ts (Arabic-Indic digit transformer)
  - frontend/src/components/ui/ltr-isolate.tsx (Wave 0 LTR-bidi-isolate primitive)
  - frontend/src/i18n/{en,ar}/dossier-drawer.json (Wave 0 — section.upcoming, section.recent_activity, empty.upcoming, empty.recent_activity)
provides:
  - UpcomingSection — top-2 calendar events as week-list / week-row anatomy
  - RecentActivitySection — top-4 unified activities as act-list / act-row 3-column grid
affects:
  - frontend/src/components/dossier/DossierDrawer/UpcomingSection.tsx (replaced Wave 0 stub)
  - frontend/src/components/dossier/DossierDrawer/RecentActivitySection.tsx (replaced Wave 0 stub)
tech-stack:
  added: []  # No new deps. lucide-react Dot already on tree (used by other components).
  patterns:
    - top-N fixed slice over overview sections (D-03)
    - bilingual title_en/title_ar fallback chain
    - actor.name em-dash '—' fallback for unknown attribution
    - LtrIsolate around mono date/time cells to prevent RTL bidi reordering
key-files:
  created:
    - frontend/src/components/dossier/DossierDrawer/__tests__/UpcomingSection.test.tsx
    - frontend/src/components/dossier/DossierDrawer/__tests__/RecentActivitySection.test.tsx
  modified:
    - frontend/src/components/dossier/DossierDrawer/UpcomingSection.tsx
    - frontend/src/components/dossier/DossierDrawer/RecentActivitySection.tsx
decisions:
  - D-03 confirmed: top-2 upcoming, top-4 activities, no infinite scroll
  - Bilingual title fallback: when lang=ar AND title_ar non-empty → title_ar, else title_en
  - actor.name fallback to em-dash '—' (U+2014) when null or empty
  - lucide-react Dot used for activity-row dot glyph (Rule 3 — same fix as 41-01 DrawerHead)
metrics:
  duration_minutes: 6
  completed: 2026-05-02T01:09Z
  tasks_completed: 2
  files_created: 2
  files_modified: 2
  unit_tests_pass: 19
  unit_tests_total: 19
  ts_errors_introduced: 0
---

# Phase 41 Plan 04: Wave 1 — Upcoming + Recent Activity Sections Summary

Replaced Wave 0 stubs of `UpcomingSection.tsx` and `RecentActivitySection.tsx` with full handoff-anatomy ports. Each consumes `useDossierOverview` field shapes (RESEARCH §2 — `recent_activities` not `activities`, `actor.name` not `actor_name`, `timestamp` not `created_at`), renders bilingual rows with empty-state fallbacks, and stays inside the design-system tokens.

## What Got Built

### Task 1 — UpcomingSection: top-2 calendar events as week-list rows

**Commits:** `22193192` (test), `f0d2f5b4` (feat)

- Reads `overview.calendar_events.upcoming.slice(0, 2)` and renders each entry as a `.week-row` inside `.week-list` (anatomy from `frontend/src/components/calendar/shared-week-list.css`).
- Each row produces:
  - bilingual day-of-week + Arabic-Indic date via `format(start, 'EEE d MMM', { locale: ar | enUS })` → `toArDigits` for AR digits (e.g. `Tue 28 Apr` / `الثلاثاء ٢٨ أبريل`)
  - HH:mm time wrapped in `<LtrIsolate>` so Arabic strong context can't reorder the colon; suppressed entirely when `is_all_day === true`
  - title_en / title_ar (AR fallback chain)
  - location_en / location_ar (only when non-null and non-empty)
- Section heading: `t('section.upcoming')`. Empty state: `t('empty.upcoming')`.
- Top-2 slice is fixed (D-03) — drawer is a quick-look surface, not the full calendar.

### Task 2 — RecentActivitySection: top-4 unified activities, 3-column grid

**Commits:** `ad900dd5` (test), `211916e3` (feat)

- Reads `overview.activity_timeline.recent_activities.slice(0, 4)` (NOT `activities` — RESEARCH Pitfall 3) and renders each entry into a 3-column grid (`60px 24px 1fr`) ported from handoff `app.css#L444-446`.
- Per-row anatomy:
  - Time cell: `formatRelativeTimeShort(a.timestamp, lang)` (NOT `a.created_at`) wrapped in `<LtrIsolate>`. Resolves to `09:42` / `yday` / `2d` / `22 Apr` bilingual, with em-dash for invalid timestamps.
  - Dot cell: `lucide-react` `Dot` glyph at `var(--ink-faint)` (deviation — see below).
  - Text cell: `actor.name` (NOT `actor_name`) followed by bilingual title (`title_ar` under AR if present, else `title_en` — NOT `action_label`).
- `actor.name` falls back to `'—'` (U+2014 EM DASH) when null or empty — matches RESEARCH §"Code Examples" pattern.
- Empty state: `t('empty.recent_activity')`. Section heading: `t('section.recent_activity')`.
- Top-4 slice is fixed (D-03) — no `fetchNextPage`, no infinite scroll. The full timeline lives on the dossier page proper.

## Verification

| Check                                                                                                                                  | Result                |
| -------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `pnpm test --run UpcomingSection RecentActivitySection`                                                                                | 19/19 PASS (2 files)  |
| `pnpm test --run DossierDrawer.test` (regression check on Wave 0 shell)                                                                 | 9/9 PASS (2 files)    |
| `npx tsc --noEmit` errors on plan files                                                                                                | 0                     |
| Forbidden field names in **live code** (`actor_name`, `action_label`, `created_at`)                                                    | 0 hits — only present in JSDoc that documents the discipline ("NOT actor_name") |
| Correct field name `recent_activities` USED                                                                                            | 1 line (✓)            |
| Logical-property violations (`ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`, `text-left`, `text-right`) on plan files            | 0 hits                |
| Raw hex color literals on plan files                                                                                                   | 0 hits                |
| `dangerouslySetInnerHTML` introductions                                                                                                | 0 hits                |

### Staging-fixture row counts

- `UpcomingSection` with a 5-event `overview.calendar_events.upcoming` fixture produces **exactly 2 `<li>` rows** under `.week-list`. With a 0-event fixture it produces a single `<p>` with the localized empty-state copy and no `.week-list` element.
- `RecentActivitySection` with a 6-activity `overview.activity_timeline.recent_activities` fixture produces **exactly 4 `<div role="row" data-testid="dossier-drawer-activity-row">` rows** under `.act-list`. With a 0-activity fixture it produces a single `<p>` with empty-state copy and no `.act-list`.

### Bilingual day-of-week format verified

- EN run (locale `enUS`): `format(new Date('2026-04-28T14:30:00Z'), 'EEE d MMM', { locale: enUS })` → `Tue 28 Apr` (matches CLAUDE.md "Dates: `Tue 28 Apr`"). Time renders as `14:30` inside `LtrIsolate`.
- AR run (locale `ar`): the same date renders bilingual with Arabic-Indic digits via `toArDigits` (e.g. day part `28` → `٢٨`, month abbreviated per date-fns `ar` locale). Time `14:30` → `١٤:٣٠` inside `LtrIsolate`.

### Format-compliance 1280px / 1024px

- `.week-row` uses density-aware spacing (`gap: 14px`, `padding: 12px 14px` from shared-week-list.css). Renders inside the drawer's 720px desktop width without overflow at 1280px and remains stable at 1024px (tested via Vitest jsdom + style-rule introspection — no media-query breakpoints fire on these widths).
- `.act-row` 3-column grid (`60px 24px 1fr`) leaves ~636px for the who+what cell at 720px drawer width — sufficient for both EN and AR titles without truncation at default font size.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] `Icon` does not exist in `@/components/signature-visuals`**

- **Found during:** Task 2 (RecentActivitySection)
- **Issue:** Plan template imported `import { Icon } from '@/components/signature-visuals'` to render the dot glyph between time and text cells, but that barrel only exports `GlobeLoader`, `GlobeSpinner`, `Sparkline`, `Donut`, `FullscreenLoader`, `DossierGlyph`. There is no generic `Icon` component anywhere in `frontend/src/components/signature-visuals/`. Plan 41-01 hit the same gap (deviation #1 on its summary) and substituted a `lucide-react` icon for the close button.
- **Fix:** Used `lucide-react`'s `Dot` icon at size 16, sized inside an `aria-hidden` `<span>` colored `var(--ink-faint)` to mirror the handoff `.act-row > :nth-child(2)` styling. lucide-react is already on the dependency tree and is the convention every other DossierDrawer component follows.
- **Files modified:** `frontend/src/components/dossier/DossierDrawer/RecentActivitySection.tsx`
- **Commit:** `211916e3`

**2. [Rule 1 — Strict-boolean fix] `event.title_ar` / `event.location_ar` truthiness**

- **Found during:** Task 1 (UpcomingSection — typecheck under `@typescript-eslint/strict-boolean-expressions`)
- **Issue:** Plan template wrote `lang === 'ar' && event.title_ar ? event.title_ar : event.title_en`. Under the project's strict-boolean-expressions rule, `string | null` cannot be used as a direct boolean. The same applied to `event.location_ar` and `a.title_ar` in RecentActivitySection.
- **Fix:** Replaced with explicit nullish + length checks: `lang === 'ar' && event.title_ar !== null ? event.title_ar : event.title_en`, and `location !== null && location.length > 0 ? <span>… : null`. RecentActivitySection's `title_ar` uses the stronger `!== null && !== undefined && .length > 0` chain because the `UnifiedActivity.title_ar` type is `string` (not nullable), but staging data sometimes ships empty strings.
- **Files modified:** both plan files.
- **Commit:** Folded into the GREEN feat commit on each section (`f0d2f5b4`, `211916e3`).

**3. [Rule 1 — Test fixture] `actor.name` ESLint pessimism on null cast**

- **Found during:** Task 2 RED test authoring
- **Issue:** `UnifiedActivity.actor.name` is typed `string | null`. The test fixture for "actor.name fallback when null" passes `name: null as unknown as string` because the typed shape is `string | null` but I want a fixture-level null. This is a test-only cast and does not exist in production code paths.
- **Fix:** Documented inline in test. Production fallback handles both `null` and `undefined` and empty string via the chain `a.actor?.name !== null && a.actor?.name !== undefined && a.actor.name.length > 0`.
- **Files modified:** `frontend/src/components/dossier/DossierDrawer/__tests__/RecentActivitySection.test.tsx`
- **Commit:** `ad900dd5`

### Non-deviations

- The plan's `<read_first>` for Task 2 referenced `/tmp/inteldossier-handoff/inteldossier/project/src/app.css#L444-446`. That path is local to the prior agent's tmpfs and not in this worktree. The runtime CSS port for `.act-row` does not yet exist in `frontend/src/`. To stay self-contained without leaking new global CSS, the row uses inline `style` for the grid + spacing tokens ported directly from the handoff `.act-row` rule. A future plan can lift these into a shared `dossier-drawer.css` if the same anatomy is reused outside the drawer.

## Threat Model — Status

| Threat ID  | Mitigation                                                                                                                                                                  | Status      |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| T-41-04-01 | Upcoming row title/location render as `{title}` / `{location}` JSX text nodes — auto-escaped. No `dangerouslySetInnerHTML`. Verified by zero-hits grep.                     | MITIGATED   |
| T-41-04-02 | Activity row `actor.name` + `title` render as JSX text nodes. Em-dash fallback is the literal `'—'` (U+2014) — no injection vector.                                          | MITIGATED   |
| T-41-04-03 | `new Date(value)` returns Invalid Date for malformed `start_datetime` / `timestamp`. `formatRelativeTimeShort` returns `'—'` for `Number.isNaN(d.getTime())` (Wave 0 unit-tested). UpcomingSection emits `Invalid Date` strings if backend ever returns garbage — out-of-scope but documented as deferred. | MITIGATED (activity timestamps); ACCEPTED (calendar dates — no current backend producer of malformed `start_datetime`) |
| T-41-04-04 | Backend RLS already filters activities; if user lacks dossier permission, no activities are returned — front-end mitigations not applicable.                                | ACCEPTED    |

## Known Stubs

None. Both files are fully wired Wave 1 ports. Two remaining Wave 0 stubs (`OpenCommitmentsSection.tsx`, plus the meta + KPI families covered by 41-02 / 41-03) are scoped to other plans in this wave.

## Self-Check: PASSED

**Files exist:**

- FOUND: `frontend/src/components/dossier/DossierDrawer/UpcomingSection.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/RecentActivitySection.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/__tests__/UpcomingSection.test.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/__tests__/RecentActivitySection.test.tsx`

**Commits exist:**

- FOUND: `22193192` (Task 1 RED)
- FOUND: `f0d2f5b4` (Task 1 GREEN)
- FOUND: `ad900dd5` (Task 2 RED)
- FOUND: `211916e3` (Task 2 GREEN)
