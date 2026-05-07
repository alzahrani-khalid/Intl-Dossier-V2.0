---
phase: 39-kanban-calendar
plan: 08
subsystem: kanban-calendar-polish
tags: [kanban, calendar, skeleton, loading, i18n, sp-3, wave-1]
requirements: [BOARD-01, BOARD-03]
dependency_graph:
  requires:
    - phase: 39-kanban-calendar
      plan: 00
      reason: scaffolding + base i18n keys
    - phase: 39-kanban-calendar
      plan: 04
      reason: WorkBoard.tsx + base loading branch
    - phase: 39-kanban-calendar
      plan: 05
      reason: UnifiedCalendar mount + CalendarMonthGrid
    - phase: 39-kanban-calendar
      plan: 07
      reason: WeekListMobile + isMobile branch + calendar weeklist i18n keys
  provides:
    - Layout-stable shape-matching skeleton states for WorkBoard + UnifiedCalendar
    - Complete EN+AR i18n key coverage for every Wave 1 t() call
    - Forward-spec keys (source.*, priority.*, due.today) for Wave 2 components
  affects:
    - frontend/src/pages/WorkBoard/WorkBoard.tsx (loading branch reshape)
    - frontend/src/pages/WorkBoard/board.css (skeleton classes appended)
    - frontend/src/components/calendar/UnifiedCalendar.tsx (loading branch reshape)
    - frontend/src/components/calendar/calendar.css (skeleton classes appended)
    - frontend/public/locales/en/unified-kanban.json (additive merge)
    - frontend/public/locales/ar/unified-kanban.json (additive merge)
tech-stack:
  added: []
  patterns:
    - SP-3 — shape-matching skeleton (Phase 38 dashboard analog)
    - aria-busy + aria-live on the loading wrapper for SR announcement
    - additive-merge pattern for locale JSON (no key deletions, no overwrites)
key-files:
  created:
    - .planning/phases/39-kanban-calendar/39-08-SUMMARY.md
  modified:
    - frontend/src/pages/WorkBoard/WorkBoard.tsx
    - frontend/src/pages/WorkBoard/board.css
    - frontend/src/components/calendar/UnifiedCalendar.tsx
    - frontend/src/components/calendar/calendar.css
    - frontend/public/locales/en/unified-kanban.json
    - frontend/public/locales/ar/unified-kanban.json
decisions:
  - WorkBoard skeleton expanded from base "head + 3 cards" to "toolbar + (head-title + head-count + 3 kcard rows) × 4 cols" — produces 21 skeletons, satisfies test ≥12 assertion
  - UnifiedCalendar loading text replaced with isMobile-branched skeleton (5×7 grid OR 7 row mobile strip) — preserves the existing isMobile flag from 39-07
  - Skeleton class names use `kcard-skeleton` / `cal-cell-skeleton` / `cal-row-skeleton` per plan spec; existing 39-04 `workboard-skeleton-card` left in place for compat (additive)
  - Singular `source.*` keys added alongside existing plural `sources.*` (no rename — KCard.tsx still consumes `sources.task`); plan-mandated singular is forward-spec coverage for Wave 2
  - `weekday.*` keys NOT added in unified-kanban (per plan NOTE — Wave 1 uses const `DOW_EN`/`DOW_AR` arrays, not t() lookup); already present in calendar.json from prior plans
metrics:
  duration: ~25min
  completed: 2026-04-25
  tasks: 3/3
  commits: 3 task + 1 docs = 4
---

# Phase 39 Plan 08: Loading + i18n Polish Summary

Layout-stable shape-matching `<Skeleton>` states added to both WorkBoard (toolbar + 4 columns × {2-piece header + 3 kcard rows} = 21 skeletons) and UnifiedCalendar (5×7 = 42 grid skeletons on desktop, 7 row skeletons on mobile). EN+AR locale coverage finalized — every Wave 1 `t()` call resolves; singular `source.*`/`priority.*`/`due.today` forward-spec keys added; full key parity verified between EN and AR.

## Files

### Created

- `.planning/phases/39-kanban-calendar/39-08-SUMMARY.md`

### Modified

- `frontend/src/pages/WorkBoard/WorkBoard.tsx` — `if (isLoading)` branch upgraded from base 39-04 placeholder to plan SP-3 spec: 1 `board-toolbar-skeleton` above the columns; per column a `<header className="col-head">` with two skeletons (title 80px + count 24px) and a `<div className="col-body">` with 3 `kcard-skeleton` rows. Wrapper now carries `aria-busy="true"` + `aria-live="polite"`.
- `frontend/src/pages/WorkBoard/board.css` — appended SP-3 layout-stable rules: `.board-toolbar-skeleton` (48×100%), `.workboard-skeleton-head-title` (14×80), `.workboard-skeleton-head-count` (12×24), `.kcard-skeleton` (80×100% with mb=8). Tokens only (no hex).
- `frontend/src/components/calendar/UnifiedCalendar.tsx` — added `import { Skeleton }`; replaced the centered `t('common.loading')` Card with an isMobile-branched skeleton container (`.cal-skeleton` wrapper carries `aria-busy` + `aria-live`). Mobile branch renders 7 `cal-row-skeleton`s inside `.week-list-mobile`; desktop branch renders 7 `cal-dow-skeleton` headers + 35 `cal-cell-skeleton` cells inside `.cal-grid`.
- `frontend/src/components/calendar/calendar.css` — appended SP-3 rules: `.cal-skeleton` wrapper, `.cal-dow-skeleton` (28×100%), `.cal-cell-skeleton` (80×100%, radius 0 to fit grid), `.cal-row-skeleton` (56×100%, radius 8). All tokens.
- `frontend/public/locales/en/unified-kanban.json` — additive merge: new top-level `source.{task,commitment,intake}`, `priority.{low,medium,high,urgent}`, `due.{today}` blocks. Existing `sources.*` plural kept untouched (KCard.tsx still consumes it). All 28 pre-existing keys preserved.
- `frontend/public/locales/ar/unified-kanban.json` — mirror AR translations: مهمة/التزام/طلب; منخفض/متوسط/عالٍ/عاجل; اليوم. EN/AR parity now 100%.

## Commits

| Task | Hash       | Message                                         |
| ---- | ---------- | ----------------------------------------------- |
| 1    | `529f0109` | feat(39-08): polish WorkBoard loading skeletons |
| 2    | `69ab3d9b` | feat(39-08): polish UnifiedCalendar skeletons   |
| 3    | `a64fe869` | feat(39-08): finalize Phase 39 i18n coverage    |

## Verification

### Unit tests

```
cd frontend && pnpm test --run src/pages/WorkBoard/__tests__/WorkBoard.test.tsx
→ Test Files 1 passed | Tests 10 passed (10/10) — 704ms

cd frontend && pnpm test --run src/components/calendar
→ Test Files 3 passed | Tests 26 passed (26/26) — 956ms
```

### Targeted typecheck

```
cd frontend && pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep -E "WorkBoard\.tsx|UnifiedCalendar\.tsx"
→ no output (clean)
```

### Acceptance greps

- `grep -c "kcard-skeleton" WorkBoard.tsx` → 3 (matches plan SP-3 spec)
- `grep -c "kcard-skeleton" board.css` → 1
- `grep -c 'aria-busy="true"' WorkBoard.tsx` → 1
- `grep -c "cal-cell-skeleton" UnifiedCalendar.tsx` → 1
- `grep -c "cal-cell-skeleton" calendar.css` → 1
- `grep -c "linkedItemType" UnifiedCalendar.tsx` → 3 (D-02 LOCKED preserved)
- `grep -c "CalendarMonthGrid" UnifiedCalendar.tsx` → 4
- `grep -c "WeekListMobile" UnifiedCalendar.tsx` → 3

### i18n key coverage

Plan-mandated verification script (12 required keys × EN+AR):

```
node -e "['en','ar'].forEach(l => { const k=require('./frontend/public/locales/'+l+'/unified-kanban.json'); ['filters.byStatus','filters.byDossier','filters.byOwner','filters.comingSoon','actions.newItem','source.task','priority.urgent','columns.todo','columns.in_progress','due.today','emptyColumn','overdueChip'].forEach(p => { const v=p.split('.').reduce((a,x)=>a&&a[x],k); if(v===undefined){console.error(l,'missing',p);process.exit(1)} }) }); console.log('OK')"
→ OK
```

Full EN/AR key parity check (deep flatten + set diff) on all 4 locale files (en/ar × unified-kanban/calendar):

```
JSON parse: OK (4 files)
All required keys present, EN/AR parity verified.
```

### Wave 1 t() coverage audit (source-of-truth grep)

Extracted every literal `t('...')` call from the 7 Wave 1 component source files:

```
t('actions.addToColumn')   ✓ EN+AR
t('actions.newItem')       ✓ EN+AR
t('emptyColumn')           ✓ EN+AR
t('filters.byDossier')     ✓ EN+AR
t('filters.byOwner')       ✓ EN+AR
t('filters.byStatus')      ✓ EN+AR
t('filters.comingSoon')    ✓ EN+AR
t('filters.search')        ✓ EN+AR
t('overdueChip')           ✓ EN+AR
t('weeklist.nextWeek')     ✓ EN+AR (calendar)
t('weeklist.previousWeek') ✓ EN+AR (calendar)
t('weeklist.today')        ✓ EN+AR (calendar)
```

Plus template literal: `t(\`columns.${stage}\`)` for stages todo/in_progress/review/done — all 4 present in EN+AR. **Zero missingKey warnings expected at runtime** for Wave 1 surfaces.

## Truths Honoured

- ✓ WorkBoard shows 4 column outlines × 3 kcard skeletons (plus toolbar + header pieces) during initial load
- ✓ Calendar shows 7×5 cell skeleton grid (35 cells + 7 dow headers) during desktop initial load
- ✓ WeekListMobile shows 7 row skeletons during mobile initial load
- ✓ All locale keys consumed by Wave 1 components present in EN+AR (verified by grep + script)

## Deviations from Plan

### Auto-fixed (Rules 1/2/3)

None. Plan executed exactly as written.

### Architectural changes (Rule 4)

None.

### Auth gates

None encountered.

### Notes

- **Plan asked for `kcard-skeleton` class — kept existing `workboard-skeleton-card` from 39-04 too** (additive, no rename). Both classes coexist in `board.css`. The current loading branch uses the new `kcard-skeleton` exclusively; `workboard-skeleton-card` is unreferenced from JSX but left in CSS to avoid any cross-plan churn. Future plans may delete if confirmed unused.
- **Singular `source.*` keys added even though Wave 1 uses plural `sources.*`** — plan explicitly required the singular form and a verification script asserted its presence. Both forms now coexist; no production code path was switched.
- **`weekday.*` keys in calendar.json** were already shipped in earlier plans (39-00 / dashboard era) and are NOT consumed by Wave 1 (which uses const `DOW_EN`/`DOW_AR` arrays per CONTEXT.md). Left untouched per plan NOTE — no orphan added.

## Threat Surface

| Threat ID             | Disposition | Notes                                                                                                |
| --------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| T-39-08-MERGE-CORRUPT | mitigated   | All 4 locale files round-trip through `JSON.parse` cleanly; 12-key required-set verified per locale. |
| T-39-08-INFO-LEAK-N/A | accept      | Skeletons render no user data — pure layout placeholders.                                            |

No new threat flags. Surfaces stay inside existing trust boundaries (no new endpoints / auth paths / file access).

## Known Stubs

None introduced.

## Out-of-Scope Discoveries (deferred)

- Pre-existing `playwright.config.ts` ESM `__dirname` bug (already documented across 39-00..07) — 39-09 owns the runner fix. E2E specs added in earlier plans remain unrunnable until then; not in 39-08 scope.

## Self-Check: PASSED

Files exist:

- `frontend/src/pages/WorkBoard/WorkBoard.tsx` → FOUND (modified, loading branch upgraded)
- `frontend/src/pages/WorkBoard/board.css` → FOUND (4 new skeleton classes)
- `frontend/src/components/calendar/UnifiedCalendar.tsx` → FOUND (Skeleton import + isMobile-branched loading state)
- `frontend/src/components/calendar/calendar.css` → FOUND (4 new skeleton classes)
- `frontend/public/locales/en/unified-kanban.json` → FOUND (source/priority/due additive merge)
- `frontend/public/locales/ar/unified-kanban.json` → FOUND (AR mirror)
- `.planning/phases/39-kanban-calendar/39-08-SUMMARY.md` → FOUND (this file)

Commits exist:

- `git log | grep 529f0109` → FOUND (Task 1 — WorkBoard skeletons)
- `git log | grep 69ab3d9b` → FOUND (Task 2 — UnifiedCalendar skeletons)
- `git log | grep a64fe869` → FOUND (Task 3 — i18n coverage)
