---
phase: 82-date-number-formatting
plan: 01
subsystem: ui
tags: [i18n, intl, date-formatting, rtl, arabic, latin-digits, vitest]

# Dependency graph
requires:
  - phase: 82-date-number-formatting
    provides: '82-CONTEXT D-82-01..06 locked decisions; 82-RESEARCH verified inventory'
provides:
  - 'format-date.ts 4-helper canonical surface: formatDayFirst, formatTime, formatDayFirstYear, formatDateTime — Latin digits in BOTH locales, no toArDigits'
  - "toFormatLocale('ar') === 'ar-u-nu-latn' — the lynchpin that flips ~10 Intl number/time consumers to Latin"
  - 'relativeTime Latin digits in AR with localized unit suffix + month name preserved'
  - 'Wave-0 format-date.test.ts (16 assertions) proving shape + Latin-in-ar + em-dash placeholder + new helpers'
affects: [82-02, 82-03, 82-04, 82-05, wave-2-migration, wave-3-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Latin-digit policy D: display formatting never swaps to Arabic-Indic; locale param retained but inert on format-date helpers'
    - "'-u-nu-latn' Unicode extension pins the latn numbering system explicitly (CLDR-drift-proof) instead of relying on bare 'ar'"

key-files:
  created:
    - frontend/src/lib/__tests__/format-date.test.ts
  modified:
    - frontend/src/lib/format-date.ts
    - frontend/src/lib/format-locale.ts
    - frontend/src/lib/i18n/relativeTime.ts
    - frontend/src/lib/i18n/__tests__/relativeTime.test.ts

key-decisions:
  - 'Removed the toArDigits pipe from format-date and relativeTime; digits are Latin app-wide per policy D (§7.4)'
  - "Reworded the format-locale doc comment to avoid the literal 'ar-SA' string so the plan's `! grep -q ar-SA` guard passes while keeping intent (never return the Arabic-Indic 'arab' locale)"
  - 'Kept the locale?/_locale second parameter on all four format-date helpers — 13 consumers pass it positionally; dropping it is a TS compile error'

patterns-established:
  - '4-helper formatter surface (formatDayFirst / formatTime / formatDayFirstYear / formatDateTime) is the single import target for all Wave-2 date migrations'
  - 'TDD RED→GREEN per task: flip/author test first (verified failing), then correct implementation'

requirements-completed: [FMT-01, FMT-04]

# Metrics
duration: ~12min
completed: 2026-07-04
---

# Phase 82 Plan 01: Lib Foundations (Latin-digit lynchpin) Summary

**Corrected the three `lib/` formatting modules to the locked Latin-digit policy (D §7.4) and extended `format-date.ts` to its 4-helper canonical surface — `toFormatLocale('ar')` now returns `'ar-u-nu-latn'`, flipping ~10 Intl consumers to Latin at once with zero test breakage.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-07-04
- **Tasks:** 2 (each TDD: RED test + GREEN impl)
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- `format-date.ts`: dropped the `toArDigits` import + `normalizeLocale` helper; `formatDayFirst`/`formatTime` now emit Latin digits byte-identical for `en` and `ar`. Added `formatDayFirstYear` (`28 Apr 2026`) and `formatDateTime` (`Tue 28 Apr 14:30 GST`) — the full 4-helper surface every Wave-2 migration plan imports.
- `format-locale.ts`: `toFormatLocale` returns `'ar-u-nu-latn'` (was `'ar-SA'` → arab/Indic). Verified `new Intl.NumberFormat('ar-u-nu-latn').resolvedOptions().numberingSystem === 'latn'`.
- `relativeTime.ts`: removed all three `toArDigits` wraps; Latin digits in AR with the localized `ي` unit suffix and date-fns Arabic month name preserved (mixed-script bug is KCard's, handled in plan 82-05).
- New `format-date.test.ts` (16 assertions) + flipped `relativeTime.test.ts` to Latin expectations.

## Task Commits

Each task was committed atomically (explicit pathspec; shared main index):

1. **Task 1 (RED): Wave-0 format-date test** - `186f5e20f` (test)
2. **Task 1 (GREEN): Latin-digit format-date + 2 new helpers** - `9dd86e482` (feat)
3. **Task 2 (RED): flip relativeTime expectations to Latin** - `5457cc445` (test)
4. **Task 2 (GREEN): toFormatLocale ar-u-nu-latn + relativeTime unwrap** - `5508825c9` (fix)

## Files Created/Modified

- `frontend/src/lib/__tests__/format-date.test.ts` (created) - 16 assertions: shapes, Latin-in-ar byte-equality, em-dash placeholder, no Arabic-Indic digits, 4 helpers
- `frontend/src/lib/format-date.ts` - 4-helper Latin formatter, no toArDigits, doc rewritten to policy D
- `frontend/src/lib/format-locale.ts` - `'ar-u-nu-latn'` Latin-safe mapper, doc inverted from the old Indic rationale
- `frontend/src/lib/i18n/relativeTime.ts` - digit-unwrapped; header doc updated from "Arabic-Indic" to Latin policy D
- `frontend/src/lib/i18n/__tests__/relativeTime.test.ts` - Latin expectations (`3ي`, `09:42` ar, Latin `d MMM`)

## Decisions Made

- Reworded the `format-locale.ts` doc comment to drop the literal `ar-SA` token. The RESEARCH-supplied comment text contained "Never return 'ar-SA'", which would trip the plan's `! grep -q "ar-SA"` acceptance guard. Intent is preserved ("never return the Arabic-Indic 'arab' locale"); behavior unchanged.
- Added an AR same-day Latin assertion to `relativeTime.test.ts` to lock the digit-half of D-82-04 on the `HH:mm` branch (strengthening only; no existing exact-string assertion weakened).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] format-locale doc comment tripped the plan's grep guard**

- **Found during:** Task 2 (format-locale correction)
- **Issue:** The RESEARCH "Code Examples" comment text the plan told me to use contains the literal string `'ar-SA'` ("Never return 'ar-SA'"), which fails the plan's own automated guard `! grep -q "ar-SA" src/lib/format-locale.ts`.
- **Fix:** Reworded the comment to "Never return the Arabic-Indic ('arab') locale" — same intent, no forbidden literal. Return value (`'ar-u-nu-latn'`) unchanged.
- **Files modified:** frontend/src/lib/format-locale.ts
- **Verification:** `grep -q "ar-SA" src/lib/format-locale.ts` → not found; `grep -q "ar-u-nu-latn"` → found
- **Committed in:** 5508825c9 (Task 2 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to satisfy the plan's own acceptance guard. No behavior change, no scope creep.

## Issues Encountered

- None beyond the deviation above. Full `src/lib/` vitest suite (8 files / 99 tests) green; `pnpm type-check` exit 0 (all 13 positional-locale callers + ~10 toFormatLocale consumers still compile).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The Latin-digit lynchpin is landed. Wave-2 migration plans (82-02..) can now import the stable 4-helper surface and rely on `toFormatLocale` being genuinely Latin-safe.
- `toArDigits.ts` still exists (13 other consumers across WorkBoard/KCard/calendar remain) — its removal is downstream plan scope (82-05 and the digit-blast-radius plans), not this foundation plan.

## Self-Check: PASSED

- FOUND: frontend/src/lib/**tests**/format-date.test.ts
- FOUND: frontend/src/lib/format-date.ts (no toArDigits)
- FOUND: frontend/src/lib/format-locale.ts (ar-u-nu-latn, no ar-SA)
- FOUND: frontend/src/lib/i18n/relativeTime.ts (no toArDigits)
- Commits 186f5e20f, 9dd86e482, 5457cc445, 5508825c9 present in git log

---

_Phase: 82-date-number-formatting_
_Completed: 2026-07-04_
