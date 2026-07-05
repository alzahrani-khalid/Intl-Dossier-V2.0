# Phase 82: Date/Number Formatting - Research

**Researched:** 2026-07-04
**Domain:** Frontend date/digit formatting migration (Intl API + i18n digit policy) — no new libraries
**Confidence:** HIGH (every claim below verified by grep/read of the live codebase or by executing Node 22 Intl in this session)

## Summary

The phase is a pure display-layer migration inside `frontend/src`. Verified inventory: **86 ad-hoc
`toLocaleDateString` lines across 65 files** (the design plan's "66" was the file count), splitting
into four mechanical groups; **15 source files consuming `toArDigits`** (+ the module + 2 dedicated
tests); **12 test files asserting Arabic-Indic output** that must flip to Latin; and the F5
mixed-script chip root-caused to **`KCard.tsx:70`** (hardcoded Latin `d` concatenated after
`toArDigits`), not to `relativeTime.ts` (whose AR unit `ي` is already localized — only its digits
are Indic).

**Critical verified finding the planner must internalize:** `toFormatLocale` is NOT Latin-safe
today — it maps `ar → 'ar-SA'`, and `'ar-SA'` resolves to the `arab` (Indic) numbering system
(verified in Node 22.23.1 this session: `(1234).toLocaleString('ar-SA') === '١٬٢٣٤'`; the helper's
own doc comment confirms the same for Chrome 148). It was built in Round-11 to FORCE Indic under
the old policy. D-82-05's sentence "uses `toFormatLocale` (Latin-safe)" is only true AFTER a
one-line correction: return `'ar-u-nu-latn'` for Arabic. That single edit flips the 28
`toFormatLocale` date lines plus ~10 number/time/`Intl.DateTimeFormat` consumers to Latin at once.

**Primary recommendation:** Fix the three `lib/` files first (format-date drop-toArDigits,
format-locale → `'ar-u-nu-latn'`, relativeTime drop-toArDigits) with a new unit test; then migrate
the 65 date files in parallel directory-sliced plans; then sweep the digit policy (remove
`toArDigits` call sites and DELETE the module — not a no-op shim); land the regression guard as a
new `scripts/check-date-formatting.mjs` (NOT an ESLint rule — see the flat-config pitfall) last,
when the tree is clean.

## User Constraints (from CONTEXT.md)

<user_constraints>

### Locked Decisions

- **D-82-01** — `lib/format-date.ts` is THE single date/time formatter: day-first no-comma
  `Tue 28 Apr` + `14:30 GST` (24h, `Asia/Dubai`). Emits **Latin digits in BOTH `en` and `ar`** —
  remove the `toArDigits` conversion (or make it a no-op path). Keep the `—` placeholder. Dashboard
  greeting and Intelligence Digest must read day-first no-comma after migration. (FMT-01)
- **D-82-02** — Migrate every ad-hoc `toLocaleDateString(...)` date render (~66 sites) onto
  `format-date.ts` helpers. Two named direct-format offenders MUST be included:
  `components/meeting-minutes/MeetingMinutesCard.tsx:95` (date-fns `'MMM d, yyyy'`) and
  `pages/Briefs/BriefsPage.tsx:94` (`'en-GB'` local shadow). Render path only — never the
  underlying data/timestamps. (FMT-02)
- **D-82-03** — Lint/grep guard that FAILS on new raw `toLocaleDateString` (and the date-fns
  month-first `format(...,'…yyyy')` pattern) for user-visible dates outside `lib/format-date.ts`.
  ESLint rule or `scripts/check-*.mjs` wired into `pnpm lint`. `lib/format-date.ts` is the single
  allowed call site. (FMT-03)
- **D-82-04** — AR overdue chip `متأخر ٢٣٠d` → **Latin digits + localized unit** (`يوم`/`ي`,
  never bare Latin `d`), via `relativeTime.ts` / `lib/format-locale`. AR result e.g. `230 يوم`;
  EN keeps `230d`/`230 days`. (FMT-04)
- **D-82-05** — **Digit policy D (LOCKED §7.4): Latin digits app-wide in the Arabic UI.** Retire
  the `toArDigits` conversion across its ~23 consumers. Mechanism is the planner's call (no-op at
  source vs remove call sites) — observable outcome: **no `٠-٩` anywhere in the AR UI's numeric
  display**. Update affected tests to expect Latin. Locale-aware number formatting uses
  `toFormatLocale` (Latin-safe), never `('ar-SA')`/`('ar')` that reintroduces Indic.
- **D-82-06** — Tokens/logical-properties only; no marketing voice; sentence case. Do NOT touch
  the carve-outs: `styles/list-pages.css` compat shim, `types/*` migration comments,
  `design-system/tokens/` + `index.css` `:root` + `public/bootstrap.js`. i18n is static-bundled
  from `src/i18n` (`public/locales` is DEAD); new AR unit strings go in `src/i18n/ar/*` with EN
  driving; register namespaces if new.

### Claude's Discretion

Exact guard mechanism (ESLint rule vs script); neutralize `toArDigits` at source vs remove call
sites; relative-time unit wording (`يوم` full vs `ي` short); grouping of the 66-site migration
into plans/waves.

### Deferred Ideas (OUT OF SCOPE)

- Phases 83 (token debt), 84 (copy), 85 (F16–F21 taste) — separate phases.
- Non-numeric i18n copy changes beyond the overdue unit.
- Data-gap empty states / `0` counts — seed/RLS, not formatting.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID     | Description                                                                 | Research Support                                                                                                                                                                             |
| ------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FMT-01 | `format-date.ts` single formatter, Latin digits, `Tue 28 Apr` / `14:30 GST` | §2 gives the exact 3-line edit + the 13 consumer files that flip AR-Latin; digest/greeting fix paths traced (§2.3)                                                                           |
| FMT-02 | Migrate ~66 ad-hoc `toLocaleDateString` sites + 2 named offenders           | §1 full 86-line/65-file inventory grouped by mechanism, with per-group target helper, minimal new helper surface, and the one leave-alone site                                               |
| FMT-03 | Guard fails on new raw `toLocaleDateString` outside the formatter           | §5 recommends `scripts/check-date-formatting.mjs` with concrete detection logic; documents why ESLint no-restricted-syntax would silently miss `components/ui/**` + 16 chart carve-out files |
| FMT-04 | AR overdue unit: Latin digits + localized unit; digit policy D app-wide     | §3 (23-file toArDigits blast radius + removal mechanism + 12 test flips + adjacent Indic producers) and §4 (KCard root cause + exact i18n key fix)                                           |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Dates `Tue 28 Apr` (day-first, no comma); times `14:30 GST`; SLA windows `T-3`/`T+2` mono (root CLAUDE.md).
- i18n static-bundled in `src/i18n/index.ts`; `public/locales` DEAD; colon namespace form; unregistered ns silently falls back EN in BOTH langs; `scripts/check-i18n-namespaces.mjs` guards drift (frontend/CLAUDE.md).
- Logical Tailwind properties only (`ms-*`, `ps-*`, `text-start`); ESLint errors on physical classes.
- ESLint: no raw hex / palette literals; explicit return types on lib functions; single quotes, no semicolons; `src/lib/**` filenames kebab-case.
- Bundle Size Check is a required CI gate — this phase adds no dependencies, no risk.
- GSD workflow entry points required for edits; carve-outs in D-82-06 are byte-untouchable.
- No emoji, no marketing voice in any new EN/AR strings.

## Architectural Responsibility Map

| Capability                     | Primary Tier                           | Secondary Tier | Rationale                                                                 |
| ------------------------------ | -------------------------------------- | -------------- | ------------------------------------------------------------------------- |
| Canonical date/time formatting | Browser (frontend `lib/`)              | —              | Pure render-time transform; timestamps stay ISO in DB/API                 |
| Digit policy (Latin in AR)     | Browser (frontend `lib/` + components) | —              | Display conversion only; no stored data contains formatted digits         |
| Overdue unit localization      | Browser (i18n bundle + KCard)          | —              | i18n string + interpolation; `days_until_due` computed upstream unchanged |
| Regression guard               | CI / lint (`scripts/*.mjs`)            | —              | Mirrors existing `check-i18n-namespaces.mjs` lint-chain pattern           |

Everything is frontend-only. No backend, no Supabase, no migrations, no Edge Functions.

## Standard Stack

No new libraries. Everything needed already exists:

### Core

| Library / Module                     | Version   | Purpose                                      | Why Standard                                          |
| ------------------------------------ | --------- | -------------------------------------------- | ----------------------------------------------------- |
| `Intl.DateTimeFormat` (platform)     | ES2020+   | en-GB day-first shape inside format-date     | Already the engine of `formatDayFirst`/`formatTime`   |
| `frontend/src/lib/format-date.ts`    | in-repo   | THE canonical formatter (correct, extend)    | Locked D-82-01                                        |
| `frontend/src/lib/format-locale.ts`  | in-repo   | Latin-safe locale mapper (must be corrected) | Locked D-82-05 names it — see §2.2                    |
| `date-fns` + `date-fns/locale`       | installed | relativeTime `d MMM`, calendar day numbers   | Already used; its formatting never emits Indic digits |
| `i18next` 25.10 / `react-i18next` 17 | installed | Overdue unit string (`متأخر {{days}} يوم`)   | Static bundle in `src/i18n`                           |
| `vitest`                             | installed | New `format-date.test.ts`                    | Existing test runner (`frontend/src/lib/__tests__/`)  |

**Installation:** none. `[VERIFIED: package.json — i18next ^25.10.10, react-i18next 17.0.0; node v22.23.1 local]`

### Alternatives Considered

| Instead of                     | Could Use                       | Tradeoff                                                                                                                                                                                                                                           |
| ------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flat i18n key for overdue unit | `Intl.RelativeTimeFormat('ar')` | RTF gives `قبل ٢٣٠ يومًا` with **Indic digits** unless locale is `ar-u-nu-latn`; and its phrasing ("before 230 days") doesn't match the chip's `متأخر N يوم` label shape. i18n key is smaller and exact. D-82-04 allows either; recommend the key. |
| `'ar-u-nu-latn'`               | bare `'ar'`                     | Bare `ar` is `latn` in Chrome 148 + Node 22 (verified), but that's a CLDR default that can drift; `-u-nu-latn` pins it for free.                                                                                                                   |
| Script guard                   | ESLint `no-restricted-syntax`   | ESLint would silently miss ~18 offender files due to existing `'off'` overrides — see §5.                                                                                                                                                          |

## Package Legitimacy Audit

**No packages are installed by this phase.** All work uses platform `Intl`, in-repo modules, and
already-installed dependencies (`date-fns`, `i18next`, `vitest`). Slopcheck not applicable.
**Packages removed due to slopcheck [SLOP] verdict:** none. **Packages flagged [SUS]:** none.

---

## 1. Date-Site Inventory (FMT-02)

Verified totals (rg, 2026-07-04, excluding tests and `lib/format-date.ts` itself):
**86 lines across 65 files.** The design plan's "66" was the FILE count (65 today, ±1 drift).

### Group A — `'ar-SA'`-producing sites (Indic digits in AR): 53 lines / ~40 files

These pass `isRTL ? 'ar-SA' : 'en-US'` (or an equivalent `locale` var). In AR they render
Arabic-Indic digits AND (mostly) month-first `en-US` option shapes in EN. All migrate to
`format-date.ts` helpers. This group is 4× larger than CONTEXT's "~13" — that number counted only
one sub-pattern. `[VERIFIED: rg]`

A1 — inline ternary, same line (30 lines):

| File                                                                      | Lines                                 |
| ------------------------------------------------------------------------- | ------------------------------------- |
| `components/audit-logs/AuditLogStatistics.tsx`                            | 127, 131                              |
| `components/audit-logs/AuditLogFilters.tsx`                               | 498, 500                              |
| `components/analytics/RelationshipHealthChart.tsx`                        | 99                                    |
| `components/analytics/EngagementMetricsChart.tsx`                         | 104                                   |
| `components/analytics/CommitmentFulfillmentChart.tsx`                     | 111                                   |
| `components/ui/pull-to-refresh-indicator.tsx`                             | 77 (also `toLocaleTimeString` at 273) |
| `pages/WorkingGroupsPage.tsx`                                             | 445                                   |
| `components/sla-monitoring/SLAComplianceChart.tsx`                        | 68                                    |
| `components/field-history/FieldHistoryTimeline.tsx`                       | 109                                   |
| `components/stakeholder-timeline/StakeholderTimelineCard.tsx`             | 165                                   |
| `components/calendar/ConflictResolution/ReschedulingSuggestions.tsx`      | 63                                    |
| `components/calendar/ConflictResolution/ConflictResolutionPanel.tsx`      | 224                                   |
| `components/calendar/ConflictResolution/SchedulingConflictComparison.tsx` | 101                                   |
| `components/calendar/ConflictResolution/WhatIfScenarioPanel.tsx`          | 114                                   |
| `components/entity-comparison/EntityComparisonTable.tsx`                  | 114                                   |
| `components/milestone-planning/MilestoneCard.tsx`                         | 103                                   |
| `components/activity-feed/ActivityFeedFilters.tsx`                        | 746, 748                              |
| `components/stakeholder-influence/InfluenceReport.tsx`                    | 231, 401, 404                         |
| `components/engagement-recommendations/RecommendationCard.tsx`            | 169                                   |
| `components/stakeholder-influence/InfluenceMetricsPanel.tsx`              | 389                                   |
| `components/legislation/LegislationDetail.tsx`                            | 605, 771                              |
| `pages/Dashboard/components/AttentionItem.tsx`                            | 96                                    |
| `pages/engagements/workspace/DocsTab.tsx`                                 | 58                                    |
| `components/dossier/dossier-overview/sections/DocumentsSection.tsx`       | 101                                   |

A2 — multi-line call, `'ar-SA'` on the continuation line (12 lines):
`pages/IntakeQueue.tsx:527`, `components/tasks/TaskDetail.tsx:272`,
`components/calendar/RecurrencePatternEditor.tsx:149`,
`components/legislation/LegislationList.tsx:396`,
`routes/_protected/stakeholder-influence.tsx:614`,
`components/legislation/LegislationDetail.tsx:417, 429, 469, 484, 499, 694`,
`components/geographic-visualization/WorldMapVisualization.tsx:264`.

A3 — via a file-local `locale`/`dateLocale` var that equals `'ar-SA'` (11 lines):
`components/dashboard-widgets/TaskListWidget.tsx:124`,
`components/dashboard-widgets/NotificationsWidget.tsx:116`,
`components/dashboard-widgets/EventsWidget.tsx:115`,
`pages/Dashboard/widgets/WeekAhead.tsx:60, 61` (weekday/day split — see special cases),
`components/dossier/dossier-overview/sections/KeyContactsSection.tsx:57`,
`components/dossier/dossier-overview/sections/CalendarEventsSection.tsx:80, 98`,
`components/dossier/dossier-overview/sections/ActivityTimelineSection.tsx:116, 124`,
`routes/_protected/approvals/index.tsx:117`.

### Group B — `toFormatLocale(...)` sites: 28 lines

Tagged "already Latin-safe" in CONTEXT — **that is wrong today** (see §2.2): `toFormatLocale('ar')`
returns `'ar-SA'` → Indic. These sites also render assorted non-spec shapes (numeric `28/04/2026`,
`month:'long'`, etc.). All migrate to `format-date.ts` helpers regardless, which also makes the
`toFormatLocale` correction moot for dates. `[VERIFIED: rg + format-locale.ts read]`

Same-line (15): `components/report-builder/ReportPreview.tsx:143`,
`components/approval-chain/ApprovalChain.tsx:261`, `components/commitments/CommitmentCard.tsx:106`,
`components/commitments/FilterChips.tsx:44`, `components/commitments/CommitmentDetailDrawer.tsx:95`,
`components/engagements/LifecycleTimeline.tsx:61`, `components/active-filters/useActiveFilters.ts:95`,
`components/engagements/LifecycleStepperBar.tsx:88`,
`components/relationships/AdvancedGraphVisualization.tsx:907, 910, 913`,
`components/dossier/ActivityTimelineItem.tsx:96`,
`components/advanced-search/DateRangeFilter.tsx:72, 75`,
`pages/engagements/workspace/AuditTab.tsx:96` (date+time options → `formatDateTime`).

Multi-line (13): `components/entity-links/EntitySearchDialog.tsx:586`,
`components/approval-chain/ApprovalChain.tsx:318`,
`components/notifications/NotificationPreferences.tsx:288`, `pages/webhooks/WebhooksPage.tsx:435`,
`pages/advanced-search/AdvancedSearchPage.tsx:209`,
`components/commitments/deliverables/DeliverableCard.tsx:121`,
`pages/users/UsersListPage.tsx:338, 386`, `routes/_protected/admin/approvals.tsx:212`,
`routes/_protected/admin/data-retention.tsx:433, 645`,
`components/dossier/ExpandableDossierCard.tsx:478`,
`components/positions/AttachmentUploader.tsx:344`.

### Group C — `'en-GB'` day-first LOCAL SHADOWS of the lib helper: 3 lines

These duplicate `formatDayFirst` locally (right shape, wrong home) and then wrap output in
`toArDigits`. Migration = delete the local function, import from `@/lib/format-date`:

- `pages/Briefs/BriefsPage.tsx:90-94` — **named offender**; local `formatDayFirst` shadow;
  `toArDigits` wrap at 445.
- `components/after-actions/AfterActionsTable.tsx:23-35` — local shadow; `toArDigits` wraps at
  122, 136, 139.
- `pages/MyTasks.tsx:99` — local `formatDueDate` (`en-GB`, day/month, no weekday); `toArDigits`
  wrap at 318.

### Group D — bare `toLocaleDateString()` (no locale): 2 lines

- `components/ui/file-upload.tsx:113` — `modified {date}` caption, user-visible → migrate to
  `formatDayFirstYear`.
- `components/ui/calendar.tsx:155` — `data-day={day.date.toLocaleDateString()}` — a react-day-picker
  **data attribute, NOT user-visible**. **LEAVE ALONE**; allowlist in the guard. This is the only
  non-user-visible `toLocaleDateString` in the tree. `[VERIFIED: read]`

### Named offender #2 (date-fns, not toLocaleDateString)

- `components/meeting-minutes/MeetingMinutesCard.tsx:95` —
  `format(new Date(minutes.meeting_date), 'MMM d, yyyy')` → migrate to `formatDayFirstYear`.

### Special cases inside the 86

- **`pages/Dashboard/widgets/WeekAhead.tsx:60-61`** builds a weekday-chip + day-number as two
  separate strings. `formatDayFirst` can't be split. Fix: date-fns `format(d, 'EEE')` /
  `format(d, 'dd')` (Latin digits natively, no Indic, day-first-compatible, doesn't trip the
  month-first guard). Its `formatTimeRange` (lines 42-52, `toLocaleTimeString('ar-SA')`, 12-hour)
  should move to `formatTime` in the same edit.
- Chart tick/tooltip labels (`RelationshipHealthChart:99`, `EngagementMetricsChart:104`,
  `CommitmentFulfillmentChart:111`, `SLAComplianceChart:68`) format axis dates. `formatDayFirst`
  (`Tue 28 Apr`) is long for ticks; these currently use `{month:'short', day:'numeric'}`. Options:
  accept `formatDayFirst` or compose date-fns `'d MMM'` (day-first, guard-clean). Recommend
  date-fns `'d MMM'` for axis ticks — matches `relativeTime.ts` precedent. Planner's discretion.

### Minimal new helper surface for `format-date.ts`

Survey of what the 86 lines actually render ⇒ exactly two new exports needed (keep total surface
at four):

| Helper (new/existing)                         | Output                                                                                 | Used by                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `formatDayFirst(date, locale?)` (existing)    | `Tue 28 Apr`                                                                           | near-term dates, list rows, chips                                             |
| `formatTime(date, locale?)` (existing)        | `14:30 GST`                                                                            | times                                                                         |
| **`formatDayFirstYear(date, locale?)`** (new) | `28 Apr 2026` (no weekday — archival dates: last-login, created-at, legislation, MoUs) | ~30 sites that currently include `year`                                       |
| **`formatDateTime(date, locale?)`** (new)     | `Tue 28 Apr 14:30 GST` (compose the two)                                               | audit logs, pull-to-refresh, AuditTab, data-retention `toLocaleString` combos |

Don't add a time-range helper (only 3 call sites; they compose `formatTime` locally). Don't add a
weekday-only helper (WeekAhead uses date-fns).

### Adjacent inventory the planner should see (outside the locked 86 but same defects)

These are NOT in D-82-02's literal scope but violate the same spec and several violate D-82-05's
observable outcome ("no Indic anywhere in the AR UI"). Recommend folding the starred ones into the
migration; the rest are planner's discretion / follow-up note:

- **date-fns month-first + comma** (the exact F4 defect shape):
  `pages/Dashboard/components/ActionBar.tsx:55` ★ (`'EEEE, MMMM d, yyyy'` — **this is the
  dashboard-greeting date named by FMT-01**), `components/assignments/EscalationDashboard.tsx:183`
  (`'MMM dd, yyyy'`), `components/availability-polling/AvailabilityPollVoter.tsx:285` +
  `AvailabilityPollResults.tsx:220, 392` (`'EEEE, MMMM d'` / `'MMM d'`),
  `pages/my-work/components/WorkItemCard.tsx:114` + `pages/Dashboard/widgets/MyTasks.tsx:71`
  (`'MMM d'`). All will trip the new guard's month-first check — migrate ★ and these six in the
  guard wave or allowlist consciously.
- **`Intl.DateTimeFormat` direct date renders** (10 sites; guard does not cover them per D-82-03):
  `dossiers/topics/-TopicsListPage.tsx:67`, `components/layout/ClassificationBar.tsx:74` ★
  (**explicit `'ar-SA-u-nu-arab'` — deliberately forces Indic; must flip under D-82-05**),
  `consistency-panel/ConsistencyPanel.tsx:138`, `timeline/InteractiveTimeline.tsx:190`,
  `timeline/TimelineEventCard.tsx:98`, `timeline/EnhancedVerticalTimelineCard.tsx:112,124`,
  `compliance/ComplianceViolationAlert.tsx:85`, `pages/Dashboard/components/DashboardHero.tsx:31`
  (already day-first via `toFormatLocale` — auto-fixed by §2.2), `engagements/workspace/CalendarTab.tsx:76`.
- **`toLocaleTimeString`** (12 lines, several `'ar-SA'` 12-hour → Indic + AM/PM):
  `PositionEditor:390`, `pull-to-refresh-indicator:273`, `AutoSaveFormWrapper:282`,
  `CalendarEventsSection:99,103`, `ReschedulingSuggestions:68`, `ConflictResolutionPanel:216`,
  `SchedulingConflictComparison:110`, `WeekAhead:43,50`, `StakeholderTimelineCard:170`,
  `EventsWidget:101`. Recommend migrating to `formatTime` alongside each file's date migration
  (most co-locate with Group A/B date lines — zero extra files).
- **`toLocaleString` date+time combos**: `positions/$id/approvals.tsx:168`, `versions.tsx:129`,
  `commitments/StatusTimeline.tsx:52`, `CommitmentDetailDrawer.tsx:104`,
  `admin/data-retention.tsx:823`, `admin/field-permissions.tsx:631` (`'ar-SA'`),
  `calendar/CalendarSyncSettings.tsx:409` (`'ar-SA'`) → `formatDateTime`.

## 2. `format-date.ts` Correction (FMT-01)

### 2.1 The exact edit

`frontend/src/lib/format-date.ts` — three mechanical changes `[VERIFIED: read]`:

1. Delete `import { toArDigits } from '@/lib/i18n/toArDigits'` and the `normalizeLocale` helper.
2. `formatDayFirst` line 36: `return toArDigits(formatted, normalizeLocale(locale))` →
   `return formatted`.
3. `formatTime` line 54: `` return `${toArDigits(formatted, normalizeLocale(locale))} GST` `` →
   `` return `${formatted} GST` ``.

**Keep the `locale?: string` second parameter** (rename to `_locale` or keep as-is with an updated
doc comment): 13 consumer files pass it positionally, and dropping it is a TS compile error at
every call site. `unused-imports/no-unused-vars` is `'off'` in the frontend ESLint block
(eslint.config.mjs:104), so an unused param does not lint-fail. `[VERIFIED: eslint.config.mjs]`
Update the file's header doc (it currently documents the Arabic-Indic swap) and both function
JSDocs. Add the two new helpers from §1 in the same edit.

### 2.2 `format-locale.ts` must also be corrected (lynchpin for D-82-05)

Current code: `language === 'ar' || language.startsWith('ar-') ? 'ar-SA' : language`. Verified in
Node 22.23.1 this session:

```
ar          → numberingSystem: latn   (1234 → "1,234")
ar-SA       → numberingSystem: arab   (1234 → "١٬٢٣٤")  ← what toFormatLocale returns TODAY
ar-u-nu-latn → numberingSystem: latn  (1234 → "1,234"), calendar: gregory
```

The helper's own doc comment confirms the same resolution in Chrome 148 (Round-11 UAT). It was
written to FORCE Indic under the old policy — CONTEXT.md's "Latin-safe" description is inverted.
**Exact fix (one line):** return `'ar-u-nu-latn'` for Arabic (explicit Unicode extension —
CLDR-drift-proof; Arabic month/unit names preserved for the remaining non-date consumers). Update
the doc comment, which currently argues FOR Indic. This single edit flips to Latin, with no other
change: `KpiWidget:136-137`, `SharedSummaryStatsCard:109`, `ElectedOfficialOfficeCard:131`,
`admin/ai-usage.tsx:187,195`, `AdaptiveFilters:137`, `PositionEditor:390`, `AutoSaveFormWrapper:282`,
`ConsistencyPanel:138`, `DashboardHero:31`, `StatusTimeline:52`, and the `toLocaleString` combos —
i.e. most of the non-`toArDigits` Indic surface. `[VERIFIED: node -e Intl probe + rg]`

### 2.3 Consumers that flip AR digits Latin when 2.1 lands (13 files)

`routes/_protected/after-actions/$afterActionId.tsx:144`, `pages/Countries.tsx:283`,
`components/follow-up-list/FollowUpList.tsx:152`, `components/list-page/DossierTable.tsx:126`,
`components/relationships/AnalyticResultView.tsx:219`,
`components/search/DossierFirstSearchResults.tsx:461`,
`components/decision-list/DecisionList.tsx:171`,
`components/commitment-editor/CommitmentEditor.tsx:346`,
`components/dossier/dossier-overview/sections/WorkItemsSection.tsx:170`,
`components/dossier/tabs/DossierEngagementsTab.tsx:305, 358`,
`components/intelligence/DigestReader.tsx:111, 125-126`,
`components/copilot/genui/InlineWorkItemCard.tsx:140`,
`components/intelligence/DigestCard.tsx:81-82, 201-202`.

None of these has a test asserting Indic output through the lib helper (the 12 Indic-asserting
test files in §3 all exercise `toArDigits` directly or local shadows) — **the 2.1 edit breaks zero
existing tests**. Current AR list rows render mixed-script (`Tue ٢٨ Apr` — English month, Indic
day); after the fix they are pure Latin. `[VERIFIED: rg over test files]`

**Intelligence Digest (FMT-01 acceptance):** `DigestCard`/`DigestReader` ALREADY route through
`formatDayFirst`/`formatTime`, and the i18n template is comma-free
(`"Generated {{date}} at {{time}}"` / `"تم الإنشاء في {{date}} عند {{time}}"`,
`intelligence-digests.json:73`). The F4 screenshot ("May 8, 10:44 AM") predates this code. Only
the digit fix applies here — verify by render, not by editing digest components.
**Dashboard greeting:** the month-first + comma greeting date is `ActionBar.tsx:55` (date-fns
`'EEEE, MMMM d, yyyy'`) → migrate to `formatDayFirst(new Date(), lang)`; `DashboardHero.tsx:31` is
already day-first and auto-corrects via §2.2.

## 3. Digit-Policy Blast Radius (FMT-04 / D-82-05)

### 3.1 `toArDigits` consumers — 15 source files (23 refs incl. tests/module)

| File                                                          | Lines                  | What the removal looks like                                                            |
| ------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------- |
| `lib/format-date.ts`                                          | 1, 36, 54              | §2.1                                                                                   |
| `lib/i18n/relativeTime.ts`                                    | 14, 27, 32, 36         | drop all 3 wraps; keep `ي` suffix; update header doc (line 7 documents Arabic-Indic)   |
| `pages/WorkBoard/KCard.tsx`                                   | 23, 70, 79             | line 70 = the F5 chip (§4); line 79 plain removal                                      |
| `pages/WorkBoard/BoardToolbar.tsx`                            | 19, 53                 | `t('overdueChip', { count: overdueCount })` — pass the number                          |
| `pages/WorkBoard/BoardColumn.tsx`                             | 29, 67                 | `{items.length}`                                                                       |
| `components/calendar/CalendarMonthGrid.tsx`                   | 24, 101 (+doc line 9)  | `format(day, 'd')` already Latin — drop wrap + comment                                 |
| `components/calendar/WeekListMobile.tsx`                      | 15, 87 (+doc line 4)   | same                                                                                   |
| `components/dossier/DossierDrawer/DrawerMetaStrip.tsx`        | 20, 49, 59             | pass raw numbers (interp var is `n`, not `count` — no plural machinery)                |
| `components/dossier/DossierDrawer/MiniKpiStrip.tsx`           | 16, 46 (+doc line 10)  | `{c.val}` inside existing `LtrIsolate` (keep the isolate)                              |
| `components/dossier/DossierDrawer/OpenCommitmentsSection.tsx` | 32, 69                 | `` `T${sign}${abs}` `` — restores spec-true `T-3`/`T+2` Latin mono                     |
| `components/dossier/DossierDrawer/UpcomingSection.tsx`        | 19, 72, 75             | date-fns `ar` locale keeps Arabic month names; digits go Latin                         |
| `components/activity-feed/ActivityList.tsx`                   | 28, 149 (+doc line 75) | drop wrap; local `formatRelativeTime` AR suffixes (`ث/د/س/ي`) already localized — keep |
| `components/after-actions/AfterActionsTable.tsx`              | 14, 122, 136, 139      | drop wraps + replace local shadow (§1 Group C)                                         |
| `pages/Briefs/BriefsPage.tsx`                                 | 22, 423, 445           | drop wraps + replace local shadow; `pp` unit at 423 — see Open Questions               |
| `pages/MyTasks.tsx`                                           | 60, 318                | drop wrap + replace local `formatDueDate`                                              |

Plus: `lib/i18n/toArDigits.ts` (delete) and `lib/i18n/__tests__/toArDigits.test.ts` (delete).

### 3.2 Mechanism recommendation: REMOVE call sites + DELETE the module

Not the no-op. Reasoning from the verified inventory: (a) 4 of the 15 files need hand-edits anyway
(KCard unit fix, BoardToolbar count, relativeTime, format-date); (b) every consumer's test needs
updating regardless (§3.3), so the no-op saves no test work; (c) deletion gives the executor a
mechanical proof — `rg -c toArDigits frontend/src` → 0 — and prevents re-adoption; (d) the
remaining 11 files are one-line unwraps. The no-op shim would leave 15 files importing a lie and a
dead module the guard can't reason about. Fallback if the planner wants wave isolation: no-op
first, delete in the same phase's last plan — but that is double work for zero risk reduction.

**No legitimate Arabic-Indic need survives policy D.** Checked every consumer above: all are
counts, day numbers, SLA windows, or dates — exactly the surfaces §7.4 locks to Latin. The one
deliberate Indic site outside toArDigits (`ClassificationBar.tsx:74`, `'ar-SA-u-nu-arab'`) is a
date ribbon, also covered by the locked outcome. `[VERIFIED: read of all 15 files]`

### 3.3 Tests asserting Arabic-Indic output — 12 files to flip

| Test file                                                | Indic assertion to flip                                       |
| -------------------------------------------------------- | ------------------------------------------------------------- |
| `lib/i18n/__tests__/toArDigits.test.ts`                  | delete with module                                            |
| `lib/i18n/__tests__/relativeTime.test.ts:31`             | `'٣ي'` → `'3ي'` (+ any Indic in >7d cases)                    |
| `pages/Briefs/__tests__/BriefsPage.test.tsx:203-204`     | asserts `/[٠-٩]/` PRESENT → invert to absent/Latin            |
| `calendar/__tests__/WeekListMobile.test.tsx:95-96`       | `'٢'` → `'2'`                                                 |
| `calendar/__tests__/CalendarMonthGrid.test.tsx:107-115`  | test name + `/[٠-٩]/` → Latin                                 |
| `pages/WorkBoard/__tests__/KCard.test.tsx:166`           | `/Overdue ٦٢d/` → new EN + AR expectations (§4)               |
| `pages/WorkBoard/__tests__/BoardColumn.test.tsx:133-134` | `'١٢'` → `'12'`                                               |
| `pages/WorkBoard/__tests__/BoardToolbar.test.tsx:134`    | `/٢٧ متأخر/` → `/27 متأخر/`                                   |
| `activity-feed/__tests__/ActivityList.test.tsx:154-162`  | `/٥/` → `/5د/` (line 82 `'إيجاز ١٩'` is fixture DATA — leave) |
| `DossierDrawer/__tests__/DrawerMetaStrip.test.tsx:133`   | `'٢٢'` → `'22'`                                               |
| `DossierDrawer/__tests__/MiniKpiStrip.test.tsx:185-190`  | `'٢٢'` → `'22'`                                               |
| `DossierDrawer/__tests__/UpcomingSection.test.tsx:113+`  | AR_DIGITS presence check → absence/Latin                      |

### 3.4 Indic producers OUTSIDE `toArDigits` (needed for the locked observable outcome)

The "no `٠-٩` anywhere in the AR UI" outcome is NOT reachable via toArDigits alone. Also required:

1. `toFormatLocale` correction (§2.2) — covers all its number/time consumers.
2. Group A date sites (§1) — covered by the FMT-02 migration.
3. **`Intl.RelativeTimeFormat` with `'ar-SA'`**: `TaskListWidget:118-122`, `EventsWidget:97`,
   `NotificationsWidget:105` (their shared `locale` var is `'ar-SA'`) → produce `قبل ٣ أيام`.
   Fix: pass `toFormatLocale(...)` (post-correction) or `'ar'`. `FieldHistoryTimeline:133`
   already uses bare `'ar'` — Latin, fine.
4. **Raw `'ar-SA'` number formatting** (charts): `RelationshipHealthChart:46,67`,
   `WorkloadDistributionChart:44,64`, `SummaryCard:39`, `EngagementMetricsChart:45,65`,
   `CommitmentFulfillmentChart:46,66` → switch to `toFormatLocale(...)`.
5. **`ClassificationBar.tsx:74`** — `'ar-SA-u-nu-arab'` → `'en-GB'` shape via `formatDayFirstYear`
   (it renders `day numeric / month short / year`).
6. `'ar-SA'` in `toLocaleTimeString`/`toLocaleString` sites (§1 adjacent lists).

## 4. Overdue/Relative Unit (FMT-04 / D-82-04)

### Root cause of `متأخر ٢٣٠d` — `KCard.tsx:68-70`, not relativeTime.ts

```ts
// frontend/src/pages/WorkBoard/KCard.tsx:68-70  [VERIFIED: read]
if (item.is_overdue && typeof item.days_until_due === 'number') {
  const n = Math.abs(item.days_until_due)
  return `${t('card.overdue')} ${toArDigits(`${n}d`, lang)}` // ← hardcoded Latin 'd' both langs
}
```

`t('card.overdue')` = `متأخر`/`Overdue` (ns `unified-kanban`, key line 69 in both JSONs). The `d`
is a hardcoded literal; `toArDigits` converts only the digits → `متأخر ٢٣٠d`. `relativeTime.ts` is
a separate path (drawer RecentActivitySection) whose AR unit `ي` is already localized — it only
needs the digit unwrap (§3.1).

### Exact fix

1. **New i18n key** in `frontend/src/i18n/{en,ar}/unified-kanban.json` under `card`:
   - en: `"overdueBy": "Overdue {{days}}d"`
   - ar: `"overdueBy": "متأخر {{days}} يوم"`

   Use interpolation var **`days`, not `count`** — sidesteps i18next v25 plural-suffix resolution
   entirely (deterministic single string; matches the locked example `متأخر 230 يوم`; Arabic
   number-noun agreement for large N takes the singular `يوم` anyway). Namespace `unified-kanban`
   is already registered — no `index.ts` change, `check-i18n-namespaces.mjs` stays green.

2. **KCard.tsx:70** → `return t('card.overdueBy', { days: n })` (note `buildDueText` receives `t`
   typed `(key: string) => string` at line 67 — widen the param type to accept interpolation
   options). Keep `card.overdue` if other renders use it; grep shows only KCard consumes it —
   planner may retire it or leave it.
3. **BoardToolbar.tsx:53** → `t('overdueChip', { count: overdueCount })` (existing key
   `"{{count}} متأخر"`; passing the raw number engages plural-key lookup which falls back to the
   base key when `overdueChip_other` is absent — verify the AR chip renders in the updated test).
4. **relativeTime.ts** — digits only (§3.1); `Nي`/`Nd` compact forms stay. Update the header
   comment (line 7 says "using Arabic-Indic digits").

**Unit wording recommendation (discretion item):** `يوم` (full word) for the KCard overdue chip —
it is a labeled sentence-chip with room, and D-82-04's own example is `230 يوم`. Keep the compact
`ي` in `formatRelativeTimeShort` and `ActivityList.formatRelativeTime` — those are mono
time-columns where EN equally uses compact `d`/`h`/`m`, and their unit is already Arabic script
(no mixed-script defect once digits are Latin). Bidi note: Latin digits between Arabic words are
direction-safe (weak LTR runs); existing `LtrIsolate` wrappers (BoardToolbar chip, MiniKpiStrip)
stay as-is.

## 5. Regression Guard (FMT-03)

### Recommendation: `scripts/check-date-formatting.mjs` (script, NOT ESLint)

Decisive, verified reason ESLint `no-restricted-syntax` is the wrong home: the flat config
(`eslint.config.mjs`) contains later blocks that set `'no-restricted-syntax': 'off'` for
**`frontend/**/components/ui/**`** (line ~238) and for a **16-file Tier-B chart/graph carve-out**
(line ~268: `SLAComplianceChart`, `InfluenceReport`, `InfluenceMetricsPanel`,
`RelationshipHealthChart`, `EngagementMetricsChart`, `CommitmentFulfillmentChart`,
`ReportPreview`, …). Flat-config rules REPLACE per-file rather than merge — so a date selector
appended to the main array would silently never fire in ~18 files that contain REAL offenders
today (`pull-to-refresh-indicator`, `file-upload`, all four chart date sites, `ReportPreview`).
Reworking those overrides to re-declare merged arrays is exactly the kind of config surgery
Phase 83 owns. A standalone script scans every file with its own allowlist and has an established
in-repo template. `[VERIFIED: eslint.config.mjs read]`

### Concrete design (mirror `scripts/check-i18n-namespaces.mjs`)

- Dependency-free `node:fs` walk of `frontend/src/**/*.{ts,tsx}` (accept a CLI dir arg for a
  positive-failure fixture, exactly like the i18n guard).
- **Check 1 — raw `toLocaleDateString`:** flag any line matching `/\.toLocaleDateString\s*\(/`.
  Allowlist (exact relative paths): `frontend/src/lib/format-date.ts`,
  `frontend/src/components/ui/calendar.tsx` (data-attribute use, §1 Group D).
- **Check 2 — date-fns month-first:** for each `format(<expr>, '<literal>'…)` capture the format
  literal and flag when a month token precedes the day token:

  ```js
  const FMT_CALL = /\bformat\s*\([^,()]*(?:\([^()]*\))?[^,()]*,\s*(['"`])([^'"`]+)\1/g
  const monthFirst = (fmt) => {
    const m = fmt.search(/M{3,}/) // MMM / MMMM (textual month)
    const d = fmt.search(/(?<![A-Za-z])d{1,2}(?![A-Za-z])/) // standalone d / dd
    return m !== -1 && d !== -1 && m < d
  }
  ```

  Verified against the live corpus: flags `'MMM d, yyyy'` (MeetingMinutesCard),
  `'EEEE, MMMM d, yyyy'` (ActionBar), `'MMM dd, yyyy'`, `'MMM d'`; passes `'d MMM'`,
  `'d MMM yyyy'`, `'dd MMM yyyy'`, `'EEE'`, `'MMMM yyyy'` (month-year header, no day), `'d'`.

- Exit 1 listing `file:line — offending code` per hit; exit 0 clean.
- **Wire-up:** append `&& node scripts/check-date-formatting.mjs` to the `lint` script in
  `frontend/package.json` (line 17), after `check-i18n-namespaces.mjs`. CI Lint runs `pnpm lint`
  repo-wide, so the guard is CI-blocking with zero workflow changes.
- **Ordering constraint:** the guard must land green — schedule it in the phase's LAST plan (after
  migration), with an empty offender list rather than a seeded allowlist. If the planner keeps the
  six adjacent date-fns month-first sites (§1) out of scope, they must be migrated anyway before
  check 2 can pass, or explicitly allowlisted — recommend migrating (six one-line edits).

## Don't Hand-Roll

| Problem                        | Don't Build                                     | Use Instead                                        | Why                                                                                                     |
| ------------------------------ | ----------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Latin digits in an `ar` locale | post-hoc digit-swapping (what `toArDigits` was) | `-u-nu-latn` Unicode extension / en-GB base locale | Engine-native, composable, no double-conversion landmines (toArDigits.ts's own header warns about this) |
| Day-first date strings         | per-component `toLocaleDateString` options      | `lib/format-date.ts` helpers                       | The entire point of FMT-01/02                                                                           |
| Overdue label assembly         | string concatenation of label + number + unit   | i18next interpolation key                          | Concatenation is what created the F5 mixed-script bug                                                   |
| AST-accurate lint guard        | ESLint selector in the shared flat config       | standalone check script                            | Existing `'off'` overrides swallow the rule in 18 offender files (§5)                                   |

**Key insight:** every defect in this phase came from hand-rolling one of the above at a call site
instead of routing through a shared helper.

## Runtime State Inventory (migration-phase protocol)

| Category            | Items Found                                                                                                                                                                                                                                                                          | Action Required                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Stored data         | **None** — formatting is render-time; DB stores ISO timestamps and raw numbers. Verified: no formatted date/digit strings are persisted by any migrated component (render-path-only edits, D-82-02).                                                                                 | none                                                                    |
| Live service config | **None** — no Edge Function, n8n, or dashboard config embeds display formats.                                                                                                                                                                                                        | none                                                                    |
| OS-registered state | **None.**                                                                                                                                                                                                                                                                            | none                                                                    |
| Secrets/env vars    | **None** — no env var references date/digit formatting.                                                                                                                                                                                                                              | none                                                                    |
| Build artifacts     | Vite bundle only — rebuilt by CI/pre-commit build automatically. Frozen-time visual baselines: dashboard-widgets tests use `FROZEN_TIME` (STATE.md P77 note) — date-shape changes in widget renders may require re-checking those snapshots' expected strings, not the frozen clock. | verify dashboard-widgets vitest suite after migrating the three widgets |

## Common Pitfalls

### Pitfall 1: Trusting CONTEXT's "toFormatLocale is Latin-safe"

**What goes wrong:** Planner routes number sites onto unmodified `toFormatLocale` → Indic persists; FMT-04 verification fails.
**Why:** The helper returns `'ar-SA'` (arab numbering) — built for the OLD policy (§2.2).
**Avoid:** Correct `format-locale.ts` in wave 1, before anything depends on it.
**Warning sign:** `(1234).toLocaleString(toFormatLocale('ar'))` returns `١٬٢٣٤` in a REPL.

### Pitfall 2: ESLint flat-config rule replacement

**What goes wrong:** A date guard appended to `no-restricted-syntax` never fires in `components/ui/**` and the 16 chart carve-out files.
**Avoid:** Use the standalone script (§5).

### Pitfall 3: i18next plural-suffix surprise on `count`

**What goes wrong:** Passing a raw number as `count` for `overdueChip` engages CLDR plural-key lookup (`overdueChip_other`, ar's six forms). Base-key fallback covers it, but a future "fix" adding partial suffixed keys breaks AR silently.
**Avoid:** Use `days` interpolation for the NEW KCard key; keep the BoardToolbar test asserting the AR render (`/27 متأخر/`).

### Pitfall 4: Files in BOTH the date-migration and toArDigits lists

**What goes wrong:** Parallel plans both edit `BriefsPage.tsx`, `AfterActionsTable.tsx`, `MyTasks.tsx` (shadow removal = date work; unwrap = digit work) → merge conflicts.
**Avoid:** Assign each overlapping file to exactly one plan doing BOTH edits (see wave plan).

### Pitfall 5: Grep-only verification

**What goes wrong:** Grep passes but AR UI still shows Indic via `Intl.RelativeTimeFormat('ar-SA')`, chart `toLocaleString('ar-SA')`, or `ClassificationBar`'s `-u-nu-arab` — none contain "toArDigits" or "toLocaleDateString".
**Avoid:** §3.4 list + the D-82-06 render check (no `/[٠-٩]/` in `document.body.textContent` on dashboard/kanban/calendar AR at 1400 & 1024).

### Pitfall 6: "Fixing" the AR shape of formatDayFirst

**What goes wrong:** A well-meaning executor localizes month names for AR (e.g. `الثلاثاء ٢٨ أبريل`).
**Why it's wrong:** D-82-01 locks the en-GB mono shape identical in both languages; existing AR list rows already render `Tue 28 Apr` shape.
**Avoid:** State in plan tasks: output is byte-identical for `en` and `ar`.

## Code Examples

### format-date.ts after correction (core shape)

```ts
// frontend/src/lib/format-date.ts — policy D: Latin digits in BOTH locales (Phase 82)
export function formatDayFirst(date: Date | string | number, _locale?: string): string {
  if (date === null || date === undefined || date === '') return PLACEHOLDER
  const d = toDate(date)
  if (d === null) return PLACEHOLDER
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
}

export function formatDayFirstYear(date: Date | string | number, _locale?: string): string {
  if (date === null || date === undefined || date === '') return PLACEHOLDER
  const d = toDate(date)
  if (d === null) return PLACEHOLDER
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(date: Date | string | number, _locale?: string): string {
  const day = formatDayFirst(date)
  return day === PLACEHOLDER ? PLACEHOLDER : `${day} ${formatTime(date)}`
}
```

### format-locale.ts after correction

```ts
/**
 * Map an i18n language to a BCP-47 locale whose Intl numbering system is
 * ALWAYS Latin (policy D, Phase 82 / plan §7.4). '-u-nu-latn' pins latn
 * explicitly — bare 'ar' happens to resolve latn in Chrome 148 / Node 22,
 * but the extension is CLDR-drift-proof. Never return 'ar-SA' (arab/Indic).
 */
export const toFormatLocale = (language: string): string =>
  language === 'ar' || language.startsWith('ar-') ? 'ar-u-nu-latn' : language
```

### Typical Group-A migration (one line)

```tsx
// before — components/dossier/dossier-overview/sections/DocumentsSection.tsx:101
{
  new Date(document.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')
}
// after
{
  formatDayFirstYear(document.created_at)
}
```

## State of the Art

| Old Approach (this repo, pre-82)                        | Current Approach (post-82)            | When Changed                      | Impact                                           |
| ------------------------------------------------------- | ------------------------------------- | --------------------------------- | ------------------------------------------------ |
| Indic digits in AR via `toArDigits` + `'ar-SA'` locales | Latin digits app-wide, `-u-nu-latn`   | Policy D locked 2026-07-04 (§7.4) | 15 source files, 12 test files, ~40 date files   |
| Per-component `toLocaleDateString`                      | `lib/format-date.ts` 4-helper surface | This phase                        | 65 files converge                                |
| `toFormatLocale` = "force Indic" (Round-11)             | `toFormatLocale` = "force Latin"      | This phase                        | Doc comment + memory note inverted — update both |

**Deprecated by this phase:** `toArDigits.ts` (deleted), local `formatDayFirst`/`formatDueDate` shadows (3 files), `'ar-SA'`/`'ar-SA-u-nu-arab'` locale literals for display formatting.

## Assumptions Log

| #   | Claim                                                                                                  | Section | Risk if Wrong                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Chrome (the deployed target) resolves `'ar-u-nu-latn'` to `latn` exactly like Node 22                  | §2.2    | Indic persists in browser — mitigated: `-u-nu-latn` is spec-mandated (RFC 6067/UTS-35); the in-repo Chrome-148 verification comment covers `ar`→latn already; render check catches it |
| A2  | i18next v25 falls back from `overdueChip_<plural>` to base `overdueChip` when suffixed keys are absent | §4      | AR toolbar chip renders raw key — caught by the existing BoardToolbar test once updated; deterministic alternative (`days` var) documented                                            |
| A3  | The F4 "May 8, 10:44 AM" digest screenshot predates the current formatDayFirst-wired DigestCard        | §2.3    | If another digest surface exists, greps for month-first would have found it (none did); render check on `/dossiers/*/digests` closes it                                               |

## Open Questions

1. **BriefsPage `pp` unit (`٢٣ pp` → `23 pp`)** — after digit flip, AR shows Latin `pp` (pages).
   D-82-04 bans bare Latin `d` for overdue only. What we know: `pp` is mono metadata like `T-3`.
   Recommendation: leave `pp` as mono-Latin (consistent with SLA windows); do not scope-creep into
   copy (Phase 84).
2. **Scope of the six adjacent date-fns month-first sites (§1)** — must be migrated or allowlisted
   for guard check 2 to pass. Recommendation: migrate (six one-line edits, same wave as guard).
3. **Chart axis tick format** — `formatDayFirst` vs date-fns `'d MMM'`. Recommendation: `'d MMM'`
   (compact, day-first, guard-clean). Planner's call per D-82-02's "grouping" discretion.

## Environment Availability

| Dependency                      | Required By            | Available              | Version                                             | Fallback         |
| ------------------------------- | ---------------------- | ---------------------- | --------------------------------------------------- | ---------------- |
| Node + full ICU                 | Intl in vitest         | ✓                      | v22.23.1 (verified: ar/en Intl resolutions correct) | —                |
| pnpm / vitest / eslint          | test + lint chain      | ✓                      | in-repo                                             | —                |
| agent-browser / browser-harness | AR render verification | ✓ (project convention) | —                                                   | manual DOM check |

No missing dependencies.

## Validation Architecture

### Test Framework

| Property           | Value                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| Framework          | Vitest (frontend workspace, jsdom)                                     |
| Config file        | `frontend/vitest.config.ts` (existing)                                 |
| Quick run command  | `cd frontend && pnpm vitest run src/lib/__tests__/format-date.test.ts` |
| Full suite command | `cd frontend && pnpm vitest run`                                       |

### Phase Requirements → Test Map

| Req ID             | Behavior                                                                                                                                                                                                  | Test Type                                                                                    | Automated Command                                                                                                                                 | File Exists?                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| FMT-01             | `formatDayFirst('2026-04-28','ar') === 'Tue 28 Apr'` (Latin, byte-equal to en); `formatTime` → `/^\d{2}:\d{2} GST$/` with `Asia/Dubai`; `—` placeholder; new `formatDayFirstYear`/`formatDateTime` shapes | unit                                                                                         | `cd frontend && pnpm vitest run src/lib/__tests__/format-date.test.ts`                                                                            | ❌ Wave 0                    |
| FMT-02             | No ad-hoc `toLocaleDateString` outside allowlist                                                                                                                                                          | grep gate                                                                                    | `rg -n "toLocaleDateString" frontend/src -g '!**/__tests__/**' \| grep -v "lib/format-date.ts" \| grep -v "components/ui/calendar.tsx"` → 0 lines | ✓ (command)                  |
| FMT-03             | Guard fails on a seeded offender fixture, passes on clean tree                                                                                                                                            | script self-test                                                                             | `node scripts/check-date-formatting.mjs` (exit 0) + fixture dir arg (exit 1)                                                                      | ❌ Wave 0                    |
| FMT-04             | `formatRelativeTimeShort(…,'ar')` → `'3ي'` Latin-digit; KCard AR chip `متأخر 62 يوم`; `rg -c "toArDigits" frontend/src` → 0                                                                               | unit + grep                                                                                  | `cd frontend && pnpm vitest run src/lib/i18n/__tests__/relativeTime.test.ts src/pages/WorkBoard/__tests__/`                                       | ✓ (update 12 files per §3.3) |
| FMT-01/04 (render) | AR dashboard + kanban + calendar at 1400 & 1024: `document.body.textContent` matches no `/[٠-٩]/`; greeting matches `/^[A-Z][a-z]{2} \d{2} [A-Z][a-z]{2}/`; digest line day-first                         | manual-only (agent-browser CDP) — visual/bidi verification cannot be jsdom-asserted app-wide | per D-82-06 verification convention                                                                                                               | manual                       |

### Sampling Rate

- **Per task commit:** the touched files' vitest specs (e.g. `pnpm vitest run src/pages/WorkBoard/__tests__/`)
- **Per wave merge:** `cd frontend && pnpm vitest run` + `pnpm lint` (picks up the guard once wired)
- **Phase gate:** full suite + guard green + AR render check before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/lib/__tests__/format-date.test.ts` — covers FMT-01 (shape + Latin-in-ar + placeholder + new helpers)
- [ ] `scripts/check-date-formatting.mjs` + positive-failure fixture — covers FMT-03
- Framework install: none needed

## Security Domain

No new trust boundaries, inputs, dependencies, or crypto. All changes are render-time string
formatting of already-fetched data through React text nodes (auto-escaped — no `innerHTML`).

| ASVS Category       | Applies  | Standard Control                                                                   |
| ------------------- | -------- | ---------------------------------------------------------------------------------- |
| V5 Input Validation | marginal | `toDate()` NaN-guard + `—` placeholder already handles malformed timestamps (keep) |
| V2/V3/V4/V6         | no       | untouched                                                                          |

| Pattern                   | STRIDE    | Standard Mitigation                                                                     |
| ------------------------- | --------- | --------------------------------------------------------------------------------------- |
| XSS via formatted strings | Tampering | React text-node rendering (unchanged); no `dangerouslySetInnerHTML` in any touched file |

## Suggested Plan/Wave Breakdown

File-overlap analysis baked in; each file appears in exactly one plan.

**Wave 1 — foundations (1 plan, `lib/` only, everything else depends on it):**
`format-date.ts` correction + `formatDayFirstYear`/`formatDateTime` + NEW `format-date.test.ts`;
`format-locale.ts` → `'ar-u-nu-latn'` + doc inversion; `relativeTime.ts` digit unwrap + header
doc + `relativeTime.test.ts` update. Zero component files → breaks zero existing tests (§2.3).

**Wave 2 — date-site migration (2–3 parallel plans, directory-sliced, no shared files):**

- 2a: `components/**` Group A+B files (≈30 files) — include each file's co-located
  `toLocaleTimeString`/`toLocaleString` lines in the same edit.
- 2b: `pages/**` + `routes/**` Group A+B files (≈20 files) + `MeetingMinutesCard.tsx` +
  `ActionBar.tsx` (greeting) + WeekAhead special case + the six adjacent date-fns month-first
  sites.
- 2c (may fold into 2a/2b): the three OVERLAP files — `BriefsPage.tsx`, `AfterActionsTable.tsx`,
  `MyTasks.tsx` — shadow removal + toArDigits unwrap + their tests, done together (Pitfall 4).

**Wave 3 — digit policy sweep (1 plan):** remaining 10 `toArDigits` consumer files (kanban ×3 incl.
KCard `overdueBy` key + `unified-kanban.json` en/ar, calendar ×2, DossierDrawer ×4, ActivityList) +
delete `toArDigits.ts` + its test + flip the remaining §3.3 tests + §3.4 adjacent Indic producers
(RelativeTimeFormat locales, chart `'ar-SA'` numbers, ClassificationBar). Gate:
`rg -c "toArDigits" frontend/src` → 0.

**Wave 4 — guard + verification (1 plan, last):** `scripts/check-date-formatting.mjs` + fixture +
`frontend/package.json` lint wiring; full-suite + grep gates + AR render check (D-82-06 DoD).

## Sources

### Primary (HIGH confidence — direct code reads + executed probes, this session)

- `frontend/src/lib/{format-date,format-locale}.ts`, `lib/i18n/{toArDigits,relativeTime}.ts` — full reads
- `node -e` Intl probe on Node v22.23.1 — numbering systems/calendars for `ar`, `ar-SA`, `ar-u-nu-latn`
- `rg` sweeps: `toLocaleDateString` (86/65), `toArDigits` (23 files), `toFormatLocale` (44 files), `toLocaleTimeString` (12), `Intl.DateTimeFormat` (10), `Intl.RelativeTimeFormat` (7), Indic-digit test assertions (12)
- `eslint.config.mjs` (restricted-syntax blocks + overrides), `frontend/package.json` (lint chain), `scripts/check-i18n-namespaces.mjs` (guard template)
- `DESIGN-REFINEMENT-PLAN-260704.md` §3B F4/F5, `.planning/phases/82-date-number-formatting/82-CONTEXT.md`
- KCard/BoardToolbar/BoardColumn/WeekAhead/ActionBar/DashboardHero/DigestCard/ClassificationBar — targeted reads
- `frontend/src/i18n/{en,ar}/unified-kanban.json`, `intelligence-digests.json`

### Secondary (MEDIUM)

- In-repo verified comments: format-locale.ts Chrome-148 numbering resolution (Round-11 UAT); MEMORY.md Round-11 note

### Tertiary (LOW — flagged in Assumptions Log)

- i18next plural-fallback behavior (A2), Chrome parity with Node for `-u-nu-latn` (A1)

## Metadata

**Confidence breakdown:**

- Site inventory: HIGH — exhaustive rg with per-line classification, cross-checked totals (30+12+11+28+3+2 = 86)
- format-date/format-locale corrections: HIGH — code read + executed Intl verification
- Guard design: HIGH — modeled on an in-repo guard; ESLint pitfall verified in the live config
- Overdue-unit fix: HIGH for root cause; MEDIUM for i18next plural fallback detail (A2, mitigated by `days` var)

**Research date:** 2026-07-04
**Valid until:** ~2026-08-04 (stable in-repo domain; re-run the rg sweeps if other phases land first — line numbers will drift)
