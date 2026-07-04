---
phase: 82-date-number-formatting
verified: 2026-07-04T19:05:00Z
status: passed
score: 5/5 must-have truths verified (FMT-01..04 + zero-regression); static-copy Indic residual resolved
overrides_applied: 0
re_verification:
  previous_status: human_needed
  note: >
    human_needed was raised only for a pre-existing static-copy residual (4 i18n strings with
    hardcoded Arabic-Indic digits — my-work.json completed30d, sample-data.json first-run body,
    form-wizard.json en+ar district placeholder). Locked policy D-82-05 ("Latin digits app-wide,
    no Indic anywhere in the AR UI") decides this unambiguously (fix, not defer), so the driver
    flipped all four to Latin (مكتملة (30 يوم), 10 دول, الدائرة 3) and deleted the stale
    i18n/config.bak. Grep-confirmed: `rg "[٠-٩]" frontend/src` (excl. tests) = 0. Static-text
    t() renders — grep is authoritative (no dynamic transformation). Dynamic surfaces were already
    render-verified by 82-06 (dashboard/kanban/calendar: 0 Indic, متأخر 230 يوم, Sat 04 Jul).
    All 5 committed FMT truths remain VERIFIED. Status → passed.
human_verification:
  - test: "Load the My Work page in Arabic (?lng=ar), open the Productivity Metrics panel, and read the 'Completed (30d)' stat label."
    expected: "Under the LOCKED Latin-digit policy it should read 'مكتملة (30 يوم)' with a Latin 30. It currently renders 'مكتملة (٣٠ يوم)' (Arabic-Indic ٣٠) — a hardcoded digit in the i18n copy string frontend/src/i18n/ar/my-work.json:15 (completed30d), rendered by ProductivityMetrics.tsx:69. This surface was NOT covered by the 82-06 dashboard/kanban/calendar render check."
    why_human: 'Whole-app AR bidi render is not jsdom-assertable; and the fix-now-vs-defer-to-Phase-84 call is a scope decision. The string is trivial to flip (٣٠ → 30).'
  - test: 'Open the First-Run seed modal in Arabic and read the admin body copy; and open the elected-official office/term wizard step and read the AR district placeholder.'
    expected: "Policy wants Latin digits. FirstRunModal body (frontend/src/i18n/ar/sample-data.json:70, adminBody) contains Arabic-Indic '١٠ دول…'; the wizard placeholder (frontend/src/i18n/en+ar/form-wizard.json:347, district_ar_ph) is an example 'الرياض الدائرة ٣'. Decide: flip to Latin now, or accept (placeholder is example-input, data-input-carve-out-adjacent) and defer to Phase 84 (copy)."
    why_human: "Bidi/visual copy check; scope decision. All three strings are PRE-EXISTING (untouched by Phase 82) static copy, not dynamic number formatting — outside the FMT-04 mechanism but inside the goal's absolute 'no Indic anywhere in the AR UI' wording."
---

# Phase 82: Date/Number Formatting Verification Report

**Phase Goal:** Centralize date/time on day-first no-comma + GST, migrate the ~66 ad-hoc `toLocaleDateString` sites, add a regression guard, and fix the mixed-script AR overdue unit under the LOCKED Latin-digit policy (no Arabic-Indic `٠-٩` anywhere in the AR UI) — zero regressions, EN/LTR + AR/RTL.
**Verified:** 2026-07-04T19:05:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

The phase's committed contract (FMT-01..04) is fully delivered at the mechanism level, verified against the actual codebase (not SUMMARY claims), with zero regressions. One residual — 3 pre-existing _static-copy_ Arabic-Indic digit strings that the automated render-check did not cover — is routed to a short human decision (fix now vs. accept/defer to Phase 84 copy). It is not a mechanism failure and not a Phase-82 regression.

### Observable Truths

| #   | Truth                                                                                                                                                                         | Status             | Evidence                                                                                                                                                                                                                                                                    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | FMT-01: `lib/format-date.ts` is the single formatter — day-first no-comma `Tue 28 Apr`, `14:30 GST`, Latin digits in AR; all 3 date/time helpers pin `Asia/Dubai` (WR-01 fix) | ✓ VERIFIED         | Read format-date.ts: `formatDayFirst`/`formatTime`/`formatDayFirstYear` all set `timeZone: 'Asia/Dubai'` (lines 36/53/71); `formatDateTime` composes both; en-GB locale (Latin), em-dash placeholder; no toArDigits import.                                                 |
| 2   | FMT-01: format-date.test.ts passes incl. GST-zone regression                                                                                                                  | ✓ VERIFIED         | `pnpm vitest run format-date.test.ts` → 19/19 pass; explicit WR-01 asserts: `formatDateTime('…T21:00:00Z')==='Wed 29 Apr 01:00 GST'` (l.71-73), GST-pinning describe block (l.88-97).                                                                                       |
| 3   | FMT-02: zero ad-hoc `toLocaleDateString` outside allowlist                                                                                                                    | ✓ VERIFIED         | `rg toLocaleDateString … \| grep -v format-date.ts \| grep -v calendar.tsx` → 0 lines. Named offenders migrated: MeetingMinutesCard→`formatDayFirstYear` (l.95), BriefsPage→`formatDayFirst` (l.385, local shadow deleted). 93 files import the formatter.                  |
| 4   | FMT-03: guard exists, wired into `pnpm lint`, clean=0 / offender=1                                                                                                            | ✓ VERIFIED         | `scripts/check-date-formatting.mjs` in `frontend/package.json` lint chain; clean run exit 0 (1531 files); scanning the fixture _dir_ exits 1 naming 6 offenders across all 4 detectors.                                                                                     |
| 5   | FMT-04: AR overdue = Latin digits + Arabic unit; toArDigits deleted; toFormatLocale Latin-safe                                                                                | ✓ VERIFIED         | KCard `t('card.overdueBy',{days:n})`; AR `متأخر {{days}} يوم`, EN `Overdue {{days}}d`; `toArDigits.ts` deleted, `rg toArDigits` → 0 files; `toFormatLocale('ar')` → `'ar-u-nu-latn'`; no `u-nu-arab`/bare `Intl('ar')` in runtime code; relativeTime+WorkBoard tests 48/48. |
| 6   | Zero regressions, full frontend suite green                                                                                                                                   | ✓ VERIFIED         | `pnpm vitest run` → 1461 passed \| 1 skipped \| 25 todo; 195 test files pass.                                                                                                                                                                                               |
| 7   | LOCKED policy: no Arabic-Indic `٠-٩` **anywhere** in the AR UI                                                                                                                | ⚠ RESIDUAL (human) | Dynamic number formatting: clean. But 3 pre-existing _static-copy_ strings still embed Indic digits and render in AR (see Human Verification). One (`completed30d`) is on a phase-touched my-work surface.                                                                  |

**Score:** 5/5 committed truths (FMT-01..04 + zero-regression) verified. Truth 7's mechanism half is verified; its static-copy half is routed to human decision.

### Required Artifacts

| Artifact                                              | Expected                                        | Status     | Details                                                                         |
| ----------------------------------------------------- | ----------------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| `frontend/src/lib/format-date.ts`                     | 4-helper canonical formatter, Asia/Dubai, Latin | ✓ VERIFIED | All 4 helpers present; timezone pinned on all 3 date/time paths; no toArDigits. |
| `frontend/src/lib/__tests__/format-date.test.ts`      | FMT-01 unit test incl. GST regression           | ✓ VERIFIED | 19/19 pass; WR-01 assertions present.                                           |
| `frontend/src/lib/format-locale.ts`                   | Latin-safe `toFormatLocale`                     | ✓ VERIFIED | returns `'ar-u-nu-latn'` for ar / ar-\*.                                        |
| `frontend/src/lib/i18n/relativeTime.ts`               | Latin-digit relative unit                       | ✓ VERIFIED | Header + branches document Latin policy D; digits Latin both locales.           |
| `frontend/src/lib/i18n/toArDigits.ts`                 | DELETED                                         | ✓ VERIFIED | File absent; zero references app-wide.                                          |
| `scripts/check-date-formatting.mjs`                   | guard (2 checks + allowlist + fixture arg)      | ✓ VERIFIED | 4 detectors, 2-file allowlist, `<dir>` fixture mode.                            |
| `scripts/fixtures/check-date-formatting/offender.tsx` | positive-failure fixture                        | ✓ VERIFIED | Trips all 4 detectors (6 offender lines).                                       |
| `frontend/src/i18n/{en,ar}/unified-kanban.json`       | `card.overdueBy` EN/AR                          | ✓ VERIFIED | EN `Overdue {{days}}d`; AR `متأخر {{days}} يوم`.                                |
| `frontend/src/pages/WorkBoard/KCard.tsx`              | overdue via `card.overdueBy`                    | ✓ VERIFIED | `t('card.overdueBy',{days:n})`, `days` var (not `count`).                       |

### Key Link Verification

| From                                          | To                          | Via                               | Status               | Details                                                                                                                                                                                                          |
| --------------------------------------------- | --------------------------- | --------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App date sites (93 files)                     | `lib/format-date.ts`        | `import from '@/lib/format-date'` | ✓ WIRED              | 93 importing files; formatter is not orphaned.                                                                                                                                                                   |
| Number sites (43 files)                       | `lib/format-locale.ts`      | `toFormatLocale(...)`             | ✓ WIRED              | 43 non-test consumers.                                                                                                                                                                                           |
| `frontend/package.json`                       | `check-date-formatting.mjs` | lint script chain                 | ✓ WIRED              | Appended to `"lint"`; CI-blocking.                                                                                                                                                                               |
| `KCard.tsx`                                   | `unified-kanban` ns         | `t('card.overdueBy',{days})`      | ✓ WIRED              | Renders AR `متأخر {{days}} يوم`.                                                                                                                                                                                 |
| Deferred `Intl.DateTimeFormat` date sites (5) | `lib/format-locale.ts`      | `toFormatLocale(...)`             | ✓ WIRED (Latin-safe) | ConsistencyPanel/InteractiveTimeline/OverviewTab/CalendarTab route through toFormatLocale; date-_shape_ migration deferred to Phase 83 (deferred-items.md D1) — outside FMT-02's `toLocaleDateString` inventory. |

### Behavioral Spot-Checks

| Behavior                                | Command                                                                         | Result                         | Status |
| --------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------ | ------ |
| Canonical formatter shape + GST + Latin | `pnpm vitest run format-date.test.ts`                                           | 19 passed                      | ✓ PASS |
| Relative-time + kanban overdue Latin    | `pnpm vitest run relativeTime.test.ts WorkBoard/__tests__`                      | 48 passed                      | ✓ PASS |
| Guard clean on migrated tree            | `node scripts/check-date-formatting.mjs`                                        | exit 0, 1531 files             | ✓ PASS |
| Guard fires on offender fixture         | `node scripts/check-date-formatting.mjs scripts/fixtures/check-date-formatting` | exit 1, 6 offenders named      | ✓ PASS |
| Zero regressions                        | `pnpm vitest run` (full)                                                        | 1461 passed / 1 skip / 25 todo | ✓ PASS |
| FMT-02 grep gate                        | `rg toLocaleDateString … outside allowlist`                                     | 0 lines                        | ✓ PASS |
| toArDigits eradicated                   | `rg -l toArDigits frontend/src`                                                 | 0 files                        | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan    | Description                                                           | Status      | Evidence                                                                                      |
| ----------- | -------------- | --------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| FMT-01      | 82-01, 82-04   | Single formatter, day-first no-comma + GST; greeting/digest day-first | ✓ SATISFIED | format-date.ts + 19/19 test; DashboardHero greeting fixed (82-06); Digest via formatDateTime. |
| FMT-02      | 82-02/03/04/07 | ~66 `toLocaleDateString` + 2 named offenders migrated                 | ✓ SATISFIED | grep gate 0 lines; both named offenders on canonical helpers; 93 importing files.             |
| FMT-03      | 82-06          | Guard fails on new raw date formatting                                | ✓ SATISFIED | Script wired into lint; clean=0 / fixture=1.                                                  |
| FMT-04      | 82-01, 82-05   | AR overdue Latin digits + localized unit via toFormatLocale           | ✓ SATISFIED | `متأخر {{days}} يوم`; toArDigits deleted; `ar-u-nu-latn`.                                     |

No orphaned requirements: REQUIREMENTS.md maps only FMT-01..04 to Phase 82, all claimed by plans.

### Anti-Patterns Found

| File                                         | Line | Pattern                                                                                                        | Severity   | Impact                                                                                                                                                                    |
| -------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/i18n/ar/my-work.json`          | 15   | Hardcoded Arabic-Indic `٣٠` in `completed30d` copy ("مكتملة (٣٠ يوم)"), renders via ProductivityMetrics.tsx:69 | ⚠️ Warning | Live Indic digit in AR UI on a phase-touched surface; pre-existing copy (untouched by Phase 82). Trivial fix (٣٠→30).                                                     |
| `frontend/src/i18n/ar/sample-data.json`      | 70   | Arabic-Indic digits in FirstRunModal body copy                                                                 | ℹ️ Info    | AR prose; pre-existing; Phase 84 (copy) territory.                                                                                                                        |
| `frontend/src/i18n/{en,ar}/form-wizard.json` | 347  | Arabic-Indic `٣` in `district_ar_ph` placeholder example                                                       | ℹ️ Info    | Example-input placeholder (data-input-carve-out-adjacent); pre-existing.                                                                                                  |
| `frontend/src/i18n/config.bak`               | —    | Stale backup file containing `'ar-SA'`                                                                         | ℹ️ Info    | `.bak` is never imported/compiled/scanned by the guard; added in commit a080c462 (pre-Phase-82). Dead file; recommend deletion for hygiene. Not a runtime Indic producer. |

No debt markers (TBD/FIXME/XXX) introduced by Phase 82. The 3 code-review Info items (IN-01..03) are non-blocking and deferred.

### Human Verification Required

See `human_verification` in frontmatter. Summary: 3 pre-existing static-copy AR strings still embed Arabic-Indic digits and render in the AR UI (My Work `completed30d`, First-Run modal body, wizard district placeholder). These are copy — not the dynamic number-formatting mechanism the phase owns — and the 82-06 render check covered dashboard/kanban/calendar but not these surfaces. Developer decision: flip to Latin now (trivial) or accept/defer to Phase 84 (copy).

### Gaps Summary

No mechanism gaps. FMT-01..04 are fully delivered and verified against real code and passing tests; the WR-01 timezone fix is in place and regression-tested; the guard is live and CI-wired; `toArDigits` is eradicated; the full suite is green (1461 passed). The single open item is a bounded, pre-existing static-copy residual against the goal's absolute "no Indic anywhere in the AR UI" wording — surfaced for a human accept-or-fix decision rather than auto-replan, since it is copy-class work explicitly earmarked for Phase 84 in 82-CONTEXT.

---

_Verified: 2026-07-04T19:05:00Z_
_Verifier: Claude (gsd-verifier)_
