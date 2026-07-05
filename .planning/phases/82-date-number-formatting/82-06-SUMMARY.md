---
phase: 82-date-number-formatting
plan: 06
subsystem: testing
tags: [lint-guard, node-fs, i18n, date-formatting, rtl, ci]

# Dependency graph
requires:
  - phase: 82-01
    provides: lib/format-date.ts canonical formatter + toFormatLocale Latin-safe locale
  - phase: 82-02..82-05
    provides: migrated tree (0 ad-hoc toLocaleDateString / 'ar-SA' / toArDigits)
provides:
  - scripts/check-date-formatting.mjs — CI-blocking regression guard (FMT-03)
  - positive-failure fixture proving the guard fires (both directions)
  - pnpm lint wiring making the guard CI-blocking with zero workflow changes
  - render-verified phase acceptance (zero Arabic-Indic digits, day-first no-comma greeting)
affects: [phase-83-token-format-debt, future-date-work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Standalone check-*.mjs guard over ESLint when flat-config 'off' overrides would swallow the rule"
    - 'Self-proving lint guard: committed positive-failure fixture + CLI dir-arg scan retarget'

key-files:
  created:
    - scripts/check-date-formatting.mjs
    - scripts/fixtures/check-date-formatting/offender.tsx
    - .planning/phases/82-date-number-formatting/deferred-items.md
  modified:
    - frontend/package.json
    - frontend/src/i18n/ar/common.json
    - frontend/src/pages/Dashboard/components/DashboardHero.tsx

key-decisions:
  - "Guard is a script (node:fs), not an ESLint rule — flat-config 'off' overrides on components/ui/** + 16 chart files would silently exempt ~18 real offenders (RESEARCH §5)"
  - "Guard detects 4 patterns: raw toLocaleDateString, month-first date-fns literals, bare 'ar-SA'/'ar-SA-u-nu-arab' locale literals, raw toLocaleTimeString (not via toFormatLocale) — empty offender list, 2-file allowlist"
  - "Kept the two Task-3 render fixes (Rule 1) — they satisfy Task-3's own acceptance criteria (zero Indic; day-first no-comma greeting) that grep could not see (Pitfall 5)"
  - 'Did NOT extend the guard to Intl.DateTimeFormat nor chase 5 off-route ad-hoc sites — logged to deferred-items.md for Phase 83 (scope discipline)'

patterns-established:
  - 'Self-proving guard: fixture under scripts/fixtures/ (outside frontend/src) so it never lints/builds; guard self-test asserts exit 0 clean + exit 1 on fixture'
  - 'Render-verify final acceptance via headless CDP DOM probe on the AR UI, not grep alone'

requirements-completed: [FMT-03]

# Metrics
duration: 35min
completed: 2026-07-04
---

# Phase 82 Plan 06: Regression Guard Summary

**Dependency-free `check-date-formatting.mjs` lint guard (raw toLocaleDateString + month-first date-fns + `'ar-SA'` + raw toLocaleTimeString) wired CI-blocking into `pnpm lint`, self-proven by a positive-failure fixture, plus render-verified AR acceptance (zero Arabic-Indic digits, day-first no-comma greeting) that caught two grep-invisible D-82-01/D-82-05 stragglers.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-07-04T15:05:00Z
- **Completed:** 2026-07-04T15:37:30Z
- **Tasks:** 3
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments

- Landed the FMT-03 regression guard LAST, on the cleaned tree, with an **empty offender list** and a **2-file allowlist** (`lib/format-date.ts`, `components/ui/calendar.tsx`).
- Guard self-proves both directions: clean tree → exit 0 (1531 non-test files scanned); fixture dir → exit 1, naming the raw `toLocaleDateString` line AND the month-first date-fns line (plus the Indic-literal and raw-time bonuses).
- Wired into `pnpm lint` after `check-bootstrap-parity.mjs` — CI-blocking via the existing Lint workflow, zero workflow changes. `pnpm lint` exits 0 with the guard in the chain.
- All phase grep gates green: FMT-02 `toLocaleDateString` outside allowlist = 0; `toArDigits` files = 0; D-82-05 `'ar-SA'` in non-test `.ts/.tsx` source = 0; full frontend vitest suite 1458 passed.
- **Render-verified (CDP DOM probe)** on dashboard / kanban / calendar at **1400 and 1024** in AR: zero Arabic-Indic digits (`/[٠-٩]/ === false`) on all three routes × both widths; kanban overdue chip reads `متأخر 230 يوم` (Latin digits + Arabic unit); greeting + digest timestamps day-first no-comma in EN and AR.

## Task Commits

1. **Task 1: guard + positive-failure fixture** - `a2c8afb4` (feat) — fixture written first (RED), then guard; self-test exit 0 clean / exit 1 fixture
2. **Task 2: wire into pnpm lint + run phase gates** - `abcf95f4` (chore) — lint green with guard; FMT-02/toArDigits/'ar-SA' gates 0; vitest 1458 pass
3. **Task 3: AR render verification** - `9b4e1136` (fix) — two Rule-1 render fixes (below); DOM-probe evidence recorded

**Plan metadata:** _(final docs commit — this SUMMARY + STATE + ROADMAP + REQUIREMENTS + deferred-items)_

## Files Created/Modified

- `scripts/check-date-formatting.mjs` - the guard: node:fs recursive walk of `frontend/src/**/*.{ts,tsx}` (skips `__tests__/` + `*.test.*`), 4 detection checks, 2-file allowlist, CLI dir-arg retarget, exit 1 naming `file:line — why`
- `scripts/fixtures/check-date-formatting/offender.tsx` - intentionally non-compliant fixture (raw toLocaleDateString + `'MMM d, yyyy'` + `'ar-SA'` + raw toLocaleTimeString); lives outside `frontend/src` so it is never linted/built
- `.planning/phases/82-date-number-formatting/deferred-items.md` - guard blind-spot (ad-hoc `Intl.DateTimeFormat` date sites) + 5 off-route sites deferred to Phase 83
- `frontend/package.json` - appended `&& node scripts/check-date-formatting.mjs` to the `lint` chain
- `frontend/src/i18n/ar/common.json` - `shell.footer.sync`: `الإصدار ٢٫٠` → `الإصدار 2.0` (Latin digits, policy D)
- `frontend/src/pages/Dashboard/components/DashboardHero.tsx` - route hero `dateLabel` through canonical `formatDayFirst` (removes ad-hoc `Intl.DateTimeFormat(toFormatLocale(…))`)

## Decisions Made

- **Script, not ESLint** (RESEARCH §5): flat-config `no-restricted-syntax: 'off'` overrides on `components/ui/**` + a 16-file chart carve-out would silently exempt ~18 real offenders; flat-config rules replace per-file rather than merge. A standalone script scans every file with its own allowlist.
- **Four checks, empty offender list:** raw `toLocaleDateString`; month-first date-fns via the RESEARCH §5 verbatim `FMT_CALL` regex + `monthFirst()` (flags `'MMM d, yyyy'`, passes every live `d MMM`); bare `'ar-SA'`/`'ar-SA-u-nu-arab'` literals (locks D-82-05 permanently); raw `toLocaleTimeString` NOT routed through `toFormatLocale` (the 2 live time sites correctly pass).
- **`config.bak` excluded:** the only `'ar-SA'` remaining anywhere is `src/i18n/config.bak:38` — a dead, unreferenced `.bak` backup (not `.ts/.tsx`, never bundled, imported nowhere). The guard's `.ts/.tsx` walker ignores it; the D-82-05 gate is clean for real source.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] AR sidebar version label rendered Arabic-Indic digits**

- **Found during:** Task 3 (AR render check)
- **Issue:** `t('shell.footer.sync')` → `الإصدار ٢٫٠ · متزامن` put Indic `٢٫٠` in the AR sidebar, violating locked digit policy D (D-82-05). Grep-invisible: it is authored copy in `ar/common.json`, not a formatter call.
- **Fix:** `الإصدار ٢٫٠` → `الإصدار 2.0` (Latin), mirroring the EN `v2.0`.
- **Files modified:** frontend/src/i18n/ar/common.json
- **Verification:** re-probe — `/[٠-٩]/.test(document.body.textContent) === false` on all three AR routes × both widths
- **Committed in:** 9b4e1136

**2. [Rule 1 - Bug] Dashboard hero greeting rendered month-first with comma (the D-82-01 "before" bug)**

- **Found during:** Task 3 (AR render check, EN pass)
- **Issue:** `DashboardHero` computed `dateLabel` via ad-hoc `new Intl.DateTimeFormat(toFormatLocale(i18n.language), {weekday,day,month})`. `toFormatLocale('en')` resolves to en-US → EN rendered `Sat, Jul 4` (month-first + comma) — the exact shape D-82-01 exists to eliminate — while AR rendered a localized `السبت، 4 يوليو` inconsistent with the rest of the AR app (list rows + digest already render en-GB day-first). This is an `Intl.DateTimeFormat` site the migration's `toLocaleDateString`/date-fns detectors never caught (guard blind spot).
- **Fix:** route through the canonical `formatDayFirst(now)` → `Sat 04 Jul` (day-first, no comma, Latin, byte-identical en/ar). Removed the now-unused `toFormatLocale` import and the unused `i18n` destructure.
- **Files modified:** frontend/src/pages/Dashboard/components/DashboardHero.tsx
- **Verification:** re-probe — EN & AR greeting `Sat 04 Jul`, `hasComma:false`, `hasIndic:false`; eslint clean on the file; 87 Dashboard tests pass
- **Committed in:** 9b4e1136

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs — both are locked-decision violations D-82-05 / D-82-01 that the render check exposed and grep could not, i.e. Pitfall 5 realized).
**Impact on plan:** Both fixes are the honest completion of Task 3's own acceptance criteria (zero Indic; day-first no-comma greeting in en+ar). Minimal, surgical, route through the phase's own canonical helper. No scope creep — the 5 remaining off-route `Intl.DateTimeFormat` date sites were logged to deferred-items.md, not chased.

## Known Stubs

None.

## Threat Flags

None — the guard reads repo files with `node:` builtins only (no network, no eval, no subprocess), mirroring the vetted `check-i18n-namespaces.mjs` (T-82-02 mitigated).

## Issues Encountered

- **Guard blind spot (deferred):** the render check found the hero greeting bug lived in a `new Intl.DateTimeFormat(...)` call, which the guard's two RESEARCH-scoped detectors (`toLocaleDateString`, month-first date-fns) do not match. Fixed the one live user-visible offender (DashboardHero, on a Task-3 route); logged the other 5 ad-hoc `Intl.DateTimeFormat` date sites (ConsistencyPanel, CalendarTab ×2, OverviewTab, InteractiveTimeline — all off-route, all Latin-safe via `toFormatLocale`, some needing custom formats) to `deferred-items.md` for a Phase-83 decision on extending the guard. Did NOT expand guard scope beyond RESEARCH §5.

## Render Evidence (Task 3)

DOM-probe (CDP, headless Chrome on `localhost:5173`, `localStorage['id.locale']`):

| Route      | Width | `/[٠-٩]/` present | Notes                                                |
| ---------- | ----- | ----------------- | ---------------------------------------------------- |
| /dashboard | 1400  | false             | greeting `Sat 04 Jul`; digest `Fri 08 May 11:44 GST` |
| /kanban    | 1400  | false             | overdue chip `متأخر 230 يوم`                         |
| /calendar  | 1400  | false             | —                                                    |
| /dashboard | 1024  | false             | —                                                    |
| /kanban    | 1024  | false             | overdue chip `متأخر 230 يوم`                         |
| /calendar  | 1024  | false             | —                                                    |

Greeting shape (`.page-sub`) after fix — AR: `Sat 04 Jul · نظرة عامة على المحفظة`; EN: `Sat 04 Jul · Portfolio overview` (both day-first, no comma, Latin). Screenshots captured to the session scratchpad (`dashboard-ar-1400.png`, `kanban-ar-1400.png`); DOM-probe results above are the primary evidence.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Phase 82 is 7/7 plans complete.** The FMT-03 guard is CI-blocking; the phase invariants (day-first no-comma dates, Latin digits app-wide in AR) are locked against regression for the two detected classes and rendered-verified.
- **For Phase 83:** see `deferred-items.md` — decide whether to add an `Intl.DateTimeFormat`-with-date-parts detector to the guard and/or migrate the 5 remaining off-route ad-hoc sites.

## Self-Check: PASSED

- Files: `scripts/check-date-formatting.mjs`, `scripts/fixtures/check-date-formatting/offender.tsx`, `deferred-items.md`, `82-06-SUMMARY.md` — all present.
- Commits: `a2c8afb4`, `abcf95f4`, `9b4e1136` — all in history.

---

_Phase: 82-date-number-formatting_
_Completed: 2026-07-04_
