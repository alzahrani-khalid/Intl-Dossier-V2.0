---
phase: 82-date-number-formatting
plan: 05
subsystem: ui
tags: [i18n, digits, latin-digits, rtl, arabic, kanban, calendar, dossier-drawer, vitest, tdd]

# Dependency graph
requires:
  - phase: 82-date-number-formatting
    provides: '82-01 format-date/format-locale/relativeTime Latin-digit lynchpin; 82-02/03/04/07 Wave-2 date-site + shadow unwraps'
provides:
  - 'toArDigits.ts DELETED + its test — zero toArDigits STRING mentions in frontend/src (mechanical D-82-05 proof)'
  - "card.overdueBy i18n key: EN 'Overdue {{days}}d', AR 'متأخر {{days}} يوم' — Latin digits + localized unit, no mixed script (F5 root cause fixed at KCard.tsx)"
  - 'kanban/calendar/dossier-drawer/activity numeric display renders Latin digits app-wide in AR'
affects: [82-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Digit policy D complete: no Arabic-Indic display conversion anywhere; numbers render via raw JS number / date-fns / Intl (all Latin)'
    - 'Overdue label assembled via i18next interpolation key (days var, not count) instead of string concatenation — the concatenation was the F5 mixed-script defect'

key-files:
  created: []
  modified:
    - frontend/src/i18n/en/unified-kanban.json
    - frontend/src/i18n/ar/unified-kanban.json
    - frontend/src/pages/WorkBoard/KCard.tsx
    - frontend/src/pages/WorkBoard/BoardToolbar.tsx
    - frontend/src/pages/WorkBoard/BoardColumn.tsx
    - frontend/src/pages/WorkBoard/__tests__/KCard.test.tsx
    - frontend/src/pages/WorkBoard/__tests__/BoardToolbar.test.tsx
    - frontend/src/pages/WorkBoard/__tests__/BoardColumn.test.tsx
    - frontend/src/components/calendar/CalendarMonthGrid.tsx
    - frontend/src/components/calendar/WeekListMobile.tsx
    - frontend/src/components/calendar/__tests__/CalendarMonthGrid.test.tsx
    - frontend/src/components/calendar/__tests__/WeekListMobile.test.tsx
    - frontend/src/components/dossier/DossierDrawer/DrawerMetaStrip.tsx
    - frontend/src/components/dossier/DossierDrawer/MiniKpiStrip.tsx
    - frontend/src/components/dossier/DossierDrawer/OpenCommitmentsSection.tsx
    - frontend/src/components/dossier/DossierDrawer/UpcomingSection.tsx
    - frontend/src/components/dossier/DossierDrawer/__tests__/DrawerMetaStrip.test.tsx
    - frontend/src/components/dossier/DossierDrawer/__tests__/MiniKpiStrip.test.tsx
    - frontend/src/components/dossier/DossierDrawer/__tests__/UpcomingSection.test.tsx
    - frontend/src/components/activity-feed/ActivityList.tsx
    - frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx
  deleted:
    - frontend/src/lib/i18n/toArDigits.ts
    - frontend/src/lib/i18n/__tests__/toArDigits.test.ts

key-decisions:
  - "New card.overdueBy key uses the `days` interpolation var (NOT `count`) to bypass i18next v25 CLDR plural-suffix resolution — deterministic single string 'متأخر {{days}} يوم' (Pitfall 3)"
  - 'Removed the now-unused `lang` local from BoardToolbar/BoardColumn/DrawerMetaStrip/MiniKpiStrip and the `lang` param from OpenCommitmentsSection.daysLabel — Rule 3 orphan cleanup so no-unused-vars stays green'
  - 'Kept LtrIsolate wrappers (BoardToolbar chip, MiniKpiStrip, calendar day cells, UpcomingSection) — bidi protection stays; only the digit conversion was removed'

patterns-established:
  - 'TDD RED→GREEN on the kanban task: flipped 3 WorkBoard test files to Latin/localized expectations (verified 4 failing), then implemented the fix'
  - 'toArDigits STRING gate: `rg -l "toArDigits" frontend/src` → 0 requires stripping doc-comments and it() test names, not just imports'

requirements-completed: [FMT-04]

# Metrics
duration: ~13min
completed: 2026-07-04
---

# Phase 82 Plan 05: Digit Policy Sweep (retire toArDigits) Summary

**Fixed the F5 mixed-script overdue chip at its true root cause (`KCard.tsx`, a hardcoded Latin `d` after `toArDigits`) via a new `card.overdueBy` i18n key, unwrapped the 10 remaining `toArDigits` consumers, DELETED the module + its test, and flipped 8 Indic-asserting tests to Latin — leaving zero `toArDigits` STRING mentions in the tree.**

## Performance

- **Duration:** ~13 min
- **Completed:** 2026-07-04
- **Tasks:** 2 (Task 1 TDD: RED + GREEN)
- **Files modified:** 21 modified, 2 deleted

## Accomplishments

- **F5 root cause fixed (D-82-04):** new `card.overdueBy` key — EN `Overdue {{days}}d`, AR `متأخر {{days}} يوم`. `KCard.tsx` overdue path now calls `t('card.overdueBy', { days: n })` instead of concatenating a hardcoded Latin `d` after `toArDigits`. AR chip renders `متأخر 62 يوم` (Latin digits + Arabic unit, no bare Latin `d`, no Arabic-Indic digits).
- **BoardToolbar** overdue chip passes the raw count to the existing `overdueChip` key; **BoardColumn** renders `{items.length}` directly — both Latin in AR.
- **Unwrapped 7 remaining consumers:** CalendarMonthGrid + WeekListMobile day numbers (`format(day,'d')` already Latin), DrawerMetaStrip engagement count + last-touched N, MiniKpiStrip KPI values (inside the kept LtrIsolate), OpenCommitmentsSection SLA window (restores spec-true `T-3`/`T+2` Latin mono), UpcomingSection date line + time (date-fns `ar` locale keeps Arabic month/weekday names, digits Latin), ActivityList relative-time column (Arabic `ث/د/س/ي` suffixes preserved).
- **DELETED** `toArDigits.ts` and `toArDigits.test.ts`. `rg -l "toArDigits" frontend/src` → **0** including doc-comments and it() test names.
- **Flipped 8 Indic-asserting tests to Latin** (D-82-05 §3.3): WorkBoard ×3, calendar ×2, DrawerMetaStrip, MiniKpiStrip, UpcomingSection, ActivityList. Fixture DATA strings (ActivityList `إيجاز ١٩`) left byte-identical.

## Task Commits

Each task committed atomically (explicit pathspec; shared main index):

1. **Task 1 (RED): flip WorkBoard tests to Latin + localized unit** — `a9d5b1c9` (test)
2. **Task 1 (GREEN): kanban overdue chip Latin digits + localized unit (F5)** — `187dad3b` (fix)
3. **Task 2: retire toArDigits app-wide — unwrap 7 consumers, delete module, flip 6 tests** — `32b1b525` (refactor)

## Decisions Made

- `card.overdueBy` uses `days`, not `count`, so i18next never engages CLDR plural-suffix resolution (Arabic's six forms). The locked example `متأخر 230 يوم` takes the singular `يوم` for all N anyway (Pitfall 3 / A2).
- Removed orphaned `lang` locals/params created by the unwraps (Rule 3 cleanup) rather than leaving unused variables. `lang` was kept where still used (DOW label selection, `title_ar` selection).
- Left the legacy `card.overdue` key in both JSONs (no remaining consumer after this edit; surgical — not scope-creeping into copy cleanup).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Orphaned `lang` bindings after digit unwrap**

- **Found during:** Task 1 (BoardToolbar/BoardColumn) and Task 2 (DrawerMetaStrip, MiniKpiStrip, OpenCommitmentsSection)
- **Issue:** Removing the `toArDigits(x, lang)` calls left `const lang = i18n.language` (and `daysLabel`'s `lang` param) unused — `@typescript-eslint/no-unused-vars` is error-level.
- **Fix:** Dropped the unused `lang` binding (and the `lang` param + updated the single `daysLabel` call site). Kept `lang` where other code paths still use it.
- **Files modified:** BoardToolbar.tsx, BoardColumn.tsx, DrawerMetaStrip.tsx, MiniKpiStrip.tsx, OpenCommitmentsSection.tsx
- **Verification:** `pnpm type-check` exit 0; touched-area vitest green
- **Committed in:** 187dad3b (Task 1) and 32b1b525 (Task 2)

---

**Total deviations:** 1 auto-fixed (blocking). **Impact:** cleanup only, no behavior change, no scope creep.

## Issues Encountered

- None. All 17 touched-area test files (166 tests) green; `pnpm type-check` exit 0; `node scripts/check-i18n-namespaces.mjs` exit 0 (namespace `unified-kanban` already registered).

## User Setup Required

None — no external service configuration.

## Next Phase Readiness

- Digit policy D is now mechanically complete across `toArDigits`: the module is gone and the grep gate is 0. The remaining app-wide "no `٠-٩` in AR" outcome depends on the §3.4 adjacent Indic producers (`Intl.RelativeTimeFormat('ar-SA')` widgets, chart `'ar-SA'` numbers, `ClassificationBar` `-u-nu-arab`) which are 82-06's scope, plus the FMT-03 regression guard.

## Known Stubs

None — all consumers were wired to real data before and after; only the display conversion was removed.

## Self-Check: PASSED

- FOUND: frontend/src/i18n/en/unified-kanban.json (card.overdueBy)
- FOUND: frontend/src/i18n/ar/unified-kanban.json (card.overdueBy = متأخر {{days}} يوم)
- GONE: frontend/src/lib/i18n/toArDigits.ts (+ its test) — deleted
- GATE: `rg -l "toArDigits" frontend/src` → 0
- Commits a9d5b1c9, 187dad3b, 32b1b525 present in git log

---

_Phase: 82-date-number-formatting_
_Completed: 2026-07-04_
