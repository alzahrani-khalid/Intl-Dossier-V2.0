# Phase 82: Date/Number Formatting - Context

**Gathered:** 2026-07-04
**Status:** Ready for planning
**Source:** Transcribed from `DESIGN-REFINEMENT-PLAN-260704.md` §3B + §7.4 (locked digit policy) by gsd-driver

<domain>
## Phase Boundary

Phase 82 makes date and number (digit) formatting **consistent and spec-compliant app-wide**,
across dark + light and EN/LTR + AR/RTL, with zero regressions. Two intertwined concerns:

1. **Dates/times** (F4): one canonical formatter emitting day-first no-comma `Tue 28 Apr` and
   `14:30 GST`; migrate the ~66 ad-hoc `toLocaleDateString` sites onto it; add a regression guard.
2. **Digits** (F5, phase name literally "Date/**Number** Formatting"): apply the **locked digit
   policy D** — **Latin digits app-wide in the Arabic UI**, with unit text localized (`يوم`) —
   which means retiring the Arabic-Indic display conversion (`toArDigits`) everywhere it currently
   forces Indic digits. Leaving some AR numbers Indic (kcard counts, calendar days) while dates go
   Latin would recreate the exact mixed-script inconsistency F5 exists to eliminate.

**Existing infra (verified — do NOT rebuild, adopt/correct):**

- `frontend/src/lib/format-date.ts` — ALREADY exists: `formatDayFirst(date, locale)` →
  `Tue 28 Apr` (en-GB, day-first, no comma) and `formatTime(date, locale)` → `14:30 GST`
  (24h, `Asia/Dubai`). **BUG:** both currently pipe through `toArDigits` → Arabic-Indic digits
  in AR, which **violates locked policy D**. Under-adopted: 66 sites still hand-roll dates.
- `frontend/src/lib/format-locale.ts` — `toFormatLocale(language)` maps an i18n lang to a
  BCP-47 locale whose `Intl` numbering system stays Latin (`ar` → Latin per Round-11; the helper
  exists precisely so AR number/date formatting doesn't silently flip to Indic).
- `frontend/src/lib/i18n/toArDigits.ts` — `toArDigits(input, lang)` replaces `0-9` with
  `٠-٩` when `lang==='ar'`. Used in **~23 files** (kcard count, calendar day numbers, overdue
  chip counters, week-list day numbers, `format-date.ts`, `relativeTime.ts`). This is the
  Arabic-Indic display conversion policy D retires.
- `frontend/src/lib/i18n/relativeTime.ts` — `formatRelativeTimeShort`: the overdue/relative path
  (the F5 `متأخر ٢٣٠d` mixed-script source — Indic digits + Latin `d`).
  </domain>

<decisions>
## Implementation Decisions (locked)

### D-82-01 — Single canonical date/time formatter, Latin digits (FMT-01, F4, HIGH)

`lib/format-date.ts` is THE single date/time formatter. Output: day-first, no-comma
`Tue 28 Apr` (weekday short, day 2-digit, month short) and `14:30 GST` (24h, GST/`Asia/Dubai`).
Per locked policy D it emits **Latin digits in BOTH `en` and `ar`** — remove the `toArDigits`
Arabic-Indic conversion from `formatDayFirst`/`formatTime` (or make it a no-op path). Keep the
`—` placeholder for nullish/invalid input. The dashboard greeting ("Sat, Jul 4" today) and the
Intelligence Digest ("May 8, 10:44 AM") must read day-first no-comma after migration.

### D-82-02 — Migrate the ~66 ad-hoc date sites (FMT-02, F4, HIGH)

Migrate every ad-hoc `toLocaleDateString(...)` date render (66 sites, mixed patterns:
`isRTL?'ar-SA':'en-US'`, `toFormatLocale(...)`, `('en-US',{month:'short',day:'numeric',year})`,
etc.) onto `format-date.ts` helpers so the whole app matches the list-row format. Two named
direct-format offenders MUST be included:

- `components/meeting-minutes/MeetingMinutesCard.tsx:95` — date-fns `format(..., 'MMM d, yyyy')`
- `pages/Briefs/BriefsPage.tsx:94` — `toLocaleDateString('en-GB', {weekday,day:'2-digit',month:'short'})`
  Do not change the underlying data/timestamps — only the render path.

### D-82-03 — Regression guard against raw date formatting (FMT-03, F4, HIGH)

Add a lint/grep guard that FAILS on new raw `toLocaleDateString` (and the direct date-fns
`format(...,'…yyyy')` month-first pattern) used for user-visible dates **outside**
`lib/format-date.ts`. Prefer an ESLint `no-restricted-syntax`/`no-restricted-properties` rule or
a `scripts/check-*.mjs` wired into `pnpm lint` (mirror `check-i18n-namespaces.mjs` /
`check-bootstrap-parity.mjs`). `lib/format-date.ts` itself is the single allowed call site.

### D-82-04 — AR overdue/relative unit: Latin digits + localized unit (FMT-04, F5, MEDIUM)

The AR overdue chip renders `متأخر ٢٣٠d` (Arabic-Indic digits + Latin `d`). Fix to **Latin
digits + a localized unit** (`يوم`/`ي`, never a bare Latin `d`), via `relativeTime.ts` /
`lib/format-locale`. Reconcile with `Intl.RelativeTimeFormat('ar')` if cleaner. Result in AR:
Latin number + Arabic unit (e.g. `230 يوم`), no mixed script; EN keeps its form (`230d`/`230 days`).

### D-82-05 — Digit policy D: Latin digits app-wide in AR (FMT-04 + phase "Number" scope, F5, §7.4 LOCKED)

**Latin digits app-wide in the Arabic UI.** Retire the `toArDigits` Arabic-Indic display
conversion across its ~23 consumers (kcard counts, calendar day numbers, overdue counters,
week-list day numbers, dates) so AR renders Latin digits **consistently**. Mechanism is the
planner's call (neutralize `toArDigits` at source as a no-op, or remove call sites) — but the
observable outcome is: no Arabic-Indic digits (`٠-٩`) surface anywhere in the AR UI's numeric
display. Update the affected tests (`toArDigits.test.ts`, `BoardColumn/BoardToolbar/MiniKpiStrip`
tests, etc.) to expect Latin.
**CORRECTION (verified in 82-RESEARCH.md — RESEARCH supersedes this doc on this point):**
`toFormatLocale` currently returns `'ar-SA'` which yields **Indic** digits (not Latin as an
earlier draft of this CONTEXT stated). The lynchpin fix is to change it to `'ar-u-nu-latn'` so it
becomes genuinely Latin-safe — that one edit flips ~10 number/time consumers to Latin at once.
Locale-aware number formatting must go through the corrected `toFormatLocale`, never a bare
`('ar-SA')` / `('ar')` / `('ar-SA-u-nu-arab')` that reintroduces Indic digits. Per RESEARCH, also
neutralize the non-`toArDigits` Indic sources it lists (`Intl.RelativeTimeFormat('ar-SA')` in 3
widgets, chart `toLocaleString('ar-SA')`, `ClassificationBar.tsx:74`).

### D-82-06 — Design/carve-out discipline

Tokens/logical-properties only; no marketing voice; sentence case. **Do NOT touch** the verified
carve-outs: `styles/list-pages.css` `[class~=…]` compat shim, `types/*` migration comments,
`design-system/tokens/` + `index.css` `:root` + `public/bootstrap.js` palette holders. i18n is
static-bundled from `src/i18n` (`public/locales` is DEAD). Any new AR unit strings (`يوم`) go in
`src/i18n/ar/*` with the EN source driving them; register namespaces if new.

### Claude's Discretion

Exact guard mechanism (ESLint rule vs script); whether to neutralize `toArDigits` at source vs
remove call sites; the relative-time unit wording (`يوم` full vs `ي` short); grouping of the
66-site migration into plans/waves.
</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design / policy source of truth

- `DESIGN-REFINEMENT-PLAN-260704.md` §3B (F4/F5 findings + corrections) and §7.4 (LOCKED digit
  policy: Latin digits app-wide in AR, unit localized `يوم`, via `lib/format-locale`)
- `CLAUDE.md` (root): dates `Tue 28 Apr` (day-first, no comma); times `14:30 GST`; SLA windows
  `T-3`/`T+2` mono; i18n colon-namespace rules; RTL logical properties
- `frontend/CLAUDE.md`: i18n static-bundle, `toFormatLocale` rationale, lint-script pattern
  (`check-i18n-namespaces.mjs`, `check-bootstrap-parity.mjs`)

### Primary code targets

- `frontend/src/lib/format-date.ts` (correct to Latin; single formatter) — FMT-01
- the ~66 `toLocaleDateString` call sites + `MeetingMinutesCard.tsx:95` + `Briefs/BriefsPage.tsx:94` — FMT-02
- new lint rule/script + `eslint.config.mjs` / `package.json` lint wiring — FMT-03
- `frontend/src/lib/i18n/relativeTime.ts` (+ the kanban overdue chip render) — FMT-04
- `frontend/src/lib/i18n/toArDigits.ts` + its ~23 consumers + their tests — FMT-04/D-82-05
- `frontend/src/lib/format-locale.ts` (`toFormatLocale`, Latin-safe) — reference
  </canonical_refs>

<specifics>
## Specific Ideas

- **`toFormatLocale` must be CORRECTED to be Latin-safe** — it currently returns `'ar-SA'` =
  Indic (verified in 82-RESEARCH.md, Node 22). Fix it to `'ar-u-nu-latn'`, then route locale-aware
  number/date formatting through it. Per RESEARCH the `'ar-SA'` inventory is **~53 lines** (Group A),
  not 13 — the inline-ternary `isRTL?'ar-SA':'en-US'`, multi-line, and local-`locale`-var forms are
  the Indic-producing offenders to reconcile.
- **Verify by rendering, not just grep.** After migration: the dashboard greeting reads day-first
  no-comma; a grep finds no ad-hoc `toLocaleDateString` outside `format-date.ts`; and the AR UI
  shows **no `٠-٩` Arabic-Indic digits** and no bare Latin `d` overdue unit — at 1400 & 1024.
- **Add a `format-date` unit test** (none exists): assert `formatDayFirst`/`formatTime` output
  shape + Latin digits in AR. This is the natural Dimension-8 validation for this phase.
- **`relativeTime.ts` header comment currently documents Arabic-Indic** ("using Arabic-Indic
  digits") — update the doc when the behavior flips to Latin.
  </specifics>

<deferred>
## Deferred Ideas

- Phases 83 (token debt), 84 (copy), 85 (F16–F21 taste) — separate phases.
- Any non-numeric i18n copy changes beyond the overdue unit — out of scope here.
- Data-gap empty states / `0` counts — seed/RLS, not formatting.
  </deferred>

---

_Phase: 82-date-number-formatting_
_Context gathered: 2026-07-04 — transcribed from the signed-off plan (§3B + §7.4 locked digit policy) by gsd-driver_
