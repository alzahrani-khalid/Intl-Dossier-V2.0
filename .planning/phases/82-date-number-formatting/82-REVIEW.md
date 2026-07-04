---
phase: 82-date-number-formatting
reviewed: 2026-07-04T15:47:38Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - frontend/src/lib/format-date.ts
  - frontend/src/lib/format-locale.ts
  - frontend/src/lib/i18n/relativeTime.ts
  - frontend/src/lib/__tests__/format-date.test.ts
  - scripts/check-date-formatting.mjs
  - scripts/fixtures/check-date-formatting/offender.tsx
  - frontend/src/pages/WorkBoard/KCard.tsx
  - frontend/src/i18n/en/unified-kanban.json
  - frontend/src/i18n/ar/unified-kanban.json
  - frontend/src/pages/Dashboard/components/DashboardHero.tsx
  - frontend/src/components/meeting-minutes/MeetingMinutesCard.tsx
  - frontend/src/pages/Briefs/BriefsPage.tsx
  - frontend/src/components/calendar/ConflictResolution/ReschedulingSuggestions.tsx
findings:
  critical: 0
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 82: Code Review Report

**Reviewed:** 2026-07-04T15:47:38Z
**Depth:** standard (foundations + guard) / spot-check (migration sites)
**Files Reviewed:** 13
**Status:** issues_found (advisory — non-blocking)

## Summary

Reviewed the load-bearing Phase 82 changes: the canonical `format-date.ts`, the
Latin-safe `toFormatLocale`, `relativeTime.ts`, the FMT-03 guard + fixture, the F5
`card.overdueBy` i18n pair, and the `DashboardHero` greeting fix — plus spot-checks
of three migration slices (MeetingMinutesCard → `formatDayFirstYear`, BriefsPage →
`formatDayFirst`, ReschedulingSuggestions local splitter) and all five deferred
`Intl.DateTimeFormat` sites.

The digit-policy work is sound and well-tested: `toFormatLocale('ar')` → `'ar-u-nu-latn'`
genuinely pins `numberingSystem: 'latn'`; the `toArDigits` module is fully deleted with
**zero** dangling references; the guard runs clean on the tree (exit 0) and fires on the
fixture (exit 1) as claimed; `card.overdueBy` is byte-parallel EN/AR with a single `{{days}}`
var and no plural machinery; and all five deferred `Intl.DateTimeFormat` sites route through
`toFormatLocale` (Latin-safe) — the deferred blind spot is acceptable for the _digit_ invariant.

The one substantive finding is a **timezone incoherence in the canonical formatter itself**:
`formatTime` pins `Asia/Dubai` but `formatDayFirst`/`formatDayFirstYear` pin no timezone, so
they render the viewer's _local_ calendar day. This is orthogonal to the digit policy the phase
delivered, but Phase 82 promoted these helpers to THE single formatter and migrated ~150 sites
onto them — which widens the blast radius. The unit test tacitly documents the problem (it uses
local no-`Z` strings and shape-only assertions specifically to dodge the host-TZ sensitivity).

## Warnings

### WR-01: `formatDayFirst`/`formatDayFirstYear` render the viewer's local calendar day, not GST — off-by-one dates and self-contradicting `formatDateTime`

**File:** `frontend/src/lib/format-date.ts:29-34, 59-68, 75-78`

**Issue:** `formatTime` pins `timeZone: 'Asia/Dubai'` (line 49), but `formatDayFirst`
(line 29) and `formatDayFirstYear` (line 63) pass **no** `timeZone`, so `toLocaleDateString`
uses the host's local zone. Two concrete consequences:

1. **Date-only DB values shift a day in any host west of UTC.** `formatDayFirstYear` is used
   for `meeting_date`, legislation dates, MoUs, `created_at` — some backed by `DATE` columns
   that arrive as date-only strings. `new Date('2026-04-28')` parses as UTC midnight; in a
   `UTC-4` host it renders **`27 Apr 2026`**. `MeetingMinutesCard.tsx` (`formatDayFirstYear(minutes.meeting_date)`)
   is exactly this pattern.

2. **`formatDateTime` can print a date and time from different calendar days.** It composes
   `formatDayFirst(date)` (local zone) with `formatTime(date)` (Dubai). For `'2026-04-28T21:00:00Z'`
   in a UTC host: date part → `Tue 28 Apr`, time part → `01:00 GST` — but 01:00 GST is Apr **29**.
   Result: `Tue 28 Apr 01:00 GST`. `formatDateTime` has 23 callers (TaskCard/TaskDetail/SLAIndicator/
   EngagementsList/CalendarSyncSettings …) all exposed to this near-midnight incoherence.

The behavior is host-conditioned (correct only when the viewer's machine is on `Asia/Dubai`),
which is why `format-date.test.ts` uses local no-`Z` strings (line 14 comment: _"so the host
timezone cannot shift the calendar day"_) and asserts `formatDateTime` with a **shape-only** regex
(line 67, _"TZ-robust shape"_) rather than exact values — the test cannot assert the values
because they are non-deterministic. For a diplomatic workstation used internationally, where
times are deliberately canonical GST, the paired dates diverging is a correctness defect (not
data loss / crash / security, hence Warning-tier under this rubric — but blocker-adjacent for an
international user base). Pre-existing helper, but the ~150-site migration makes it phase-relevant.

**Fix:** pin the same zone the time uses so dates are GST-canonical and `formatDateTime` is
internally coherent (also makes the unit test deterministic and fixes the date-only off-by-one,
since `Asia/Dubai` is UTC+4):

```ts
// formatDayFirst
return d.toLocaleDateString('en-GB', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  timeZone: 'Asia/Dubai',
})

// formatDayFirstYear
return d.toLocaleDateString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Dubai',
})
```

Note the deferred `CalendarTab.tsx` formatters already pin `timeZone: 'UTC'` — the canonical
helper being the _only_ unpinned date path is the inconsistency to close.

## Info

### IN-01: Guard Check-3 only locks the literal `'ar-SA'`; other Indic-producing locales slip through

**File:** `scripts/check-date-formatting.mjs:94`

**Issue:** `INDIC_LOCALE = /(['"`])(ar-SA(?:-u-nu-arab)?)\1/`matches only`'ar-SA'`/`'ar-SA-u-nu-arab'`. It does **not** catch other Indic-producing constructs: `'ar-EG'`(Egypt defaults to Indic), a bare`'ar'`combined with an explicit`{ numberingSystem: 'arab' }`option, or`-u-nu-arab` on any base (`'en-u-nu-arab'`). The 82-06 SUMMARY claims the guard
"locks D-82-05 permanently" — that overstates it: it locks the one literal form the RESEARCH
inventory found. Real-world regression risk is low (nobody is reaching for `ar-EG`today), and
the phase's render-check independently verified zero Indic, so this is a scope note, not a defect.
The`Intl.DateTimeFormat`blind spot is separately (and correctly) documented in`deferred-items.md`,
and all five listed sites route through `toFormatLocale` — verified Latin-safe.

**Fix (optional, Phase 83):** broaden to `/-u-nu-arab\b/` plus a bare-region `ar-[A-Z]{2}` probe,
or assert `numberingSystem !== 'arab'` — or simply soften the SUMMARY's "permanently" claim.

### IN-02: Guard Check-4 is line-scoped; a wrapped `toFormatLocale` arg would false-positive

**File:** `scripts/check-date-formatting.mjs:92, 122-133`

**Issue:** `TIME_STRING` and the `timeMatch[1] === undefined` test evaluate a single line. A
Prettier-wrapped call where `.toLocaleTimeString(` ends one line and `toFormatLocale(lang)` begins
the next would be flagged as a raw offender even though it is correctly routed. Both live time
sites currently fit on one line, so it ships green, but a future reflow at the 100-col boundary
could trip a false positive.

**Fix:** none required now; if it bites, scan the joined source (or a 2-line window) instead of
per-line for the time check.

### IN-03: `relativeTime.ts` localizes month names to Arabic while the canonical formatter always uses English months — visible AR inconsistency

**File:** `frontend/src/lib/i18n/relativeTime.ts:37`

**Issue:** For the `>7 days` branch, `format(d, 'd MMM', { locale: ar })` yields Arabic month
names (e.g. `22 أبريل`) in the AR activity timeline, whereas `formatDayFirst` (en-GB, hard-wired)
renders English months everywhere else (`22 Apr`). Digits are Latin on both paths, so the D-82
digit policy is satisfied — this is a month-**name** divergence, not a digit one, and out of Phase
82's stated scope. Flagging so it is not lost: the AR UI now mixes `أبريل`-style month names in
timelines with `Apr`-style everywhere else.

**Fix (defer to the Phase 84 copy pass):** decide one month-name policy for AR — either localize
`format-date.ts` months too, or drop the `ar` locale from `relativeTime` so both read English
month abbreviations.

---

_Reviewed: 2026-07-04T15:47:38Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
