---
phase: 38-dashboard-verbatim
plan: '02'
status: PASS
subsystem: frontend/dashboard
tags: [widget, week-ahead, day-grouping, expand-toggle, RTL, LtrIsolate, DossierGlyph]
requirements_addressed: [DASH-02, DASH-08, DASH-09]
dependency_graph:
  requires:
    - '38-00 (useWeekAhead adapter, dashboard.css week-* rules, widget barrel, i18n weekAhead namespace)'
  provides:
    - 'WeekAhead widget body — day-grouped engagement list with per-group expand'
    - 'weekAhead.status.* i18n namespace (en + ar) for lifecycle stages'
  affects:
    - 'frontend/src/pages/Dashboard/widgets/WeekAhead.tsx (stub → full implementation)'
    - 'frontend/src/pages/Dashboard/widgets/dashboard.css (APPEND .week-group)'
    - 'frontend/src/i18n/{en,ar}/dashboard-widgets.json (APPEND weekAhead.status)'
tech_stack:
  added: []
  patterns:
    - 'SP-1 widget shell (skeleton / error / empty / data branches)'
    - 'SP-3 i18n via dashboard-widgets namespace + locale-aware date/time formatting'
    - 'SP-4 LtrIsolate around all LTR-direction numerals (day digits + time range)'
    - 'SP-7 DossierGlyph from @/components/signature-visuals barrel'
    - 'SP-8 logical Tailwind classes only (text-start / mb-/me-)'
    - 'Per-group expand pattern (TimelineZone analog) using Record<TimelineGroup, boolean> state'
key_files:
  created:
    - .planning/phases/38-dashboard-verbatim/38-02-SUMMARY.md
  modified:
    - frontend/src/pages/Dashboard/widgets/WeekAhead.tsx
    - frontend/src/pages/Dashboard/widgets/__tests__/WeekAhead.test.tsx
    - frontend/src/pages/Dashboard/widgets/dashboard.css
    - frontend/src/i18n/en/dashboard-widgets.json
    - frontend/src/i18n/ar/dashboard-widgets.json
decisions:
  - 'Adapter returns the real `TimelineEvent` shape from `operations-hub` (start_date / end_date / engagement_name / lifecycle_stage). The plan stub used a draft shape (counterpart / counterpartFlag / status). Implementation follows the adapter contract pinned by Wave 0 unit tests — not the plan stub. Dossier glyph passes `name={engagement_name ?? title}` (initials fallback per Phase 37 D-09).'
  - 'Status chip key path: `weekAhead.status.{lifecycle_stage}` with i18n `defaultValue: stage` so unknown stages still render. Added six lifecycle keys to en + ar (Rule 2 — required for correct rendering).'
  - "CSS: appended only `.week-group { display: block }` — handoff `.week-row`, `.week-time`, `.week-list`, etc. were already ported in Wave 0. Shared-file discipline preserved (zero edits to other widgets' rules)."
  - 'Test fixtures use real `TimelineEvent` shape; assertions match i18n key strings (regex tolerant) so the test does not require the i18n bundle to be loaded in the jsdom env (matches existing project test setup).'
metrics:
  duration_minutes: 12
  completed_date: '2026-04-25'
  tasks_completed: 2
  files_changed: 5
commits:
  - hash: '8c665902'
    type: test
    title: 'add WeekAhead unit tests (RED)'
  - hash: '137d6fe3'
    type: feat
    title: 'hydrate WeekAhead widget with day-grouped engagements (GREEN)'
tests_run:
  - 'frontend ./node_modules/.bin/vitest run src/pages/Dashboard/widgets/__tests__/WeekAhead.test.tsx → 7/7 passed'
  - 'frontend ./node_modules/.bin/tsc --noEmit (filtered to plan files) → 0 errors'
coverage_notes: 'WeekAhead component covers: 4-group rendering, max-visible expand toggle, DossierGlyph rendering, .week-time inside dir="ltr" LtrIsolate, status chip via data-testid, skeleton/empty/error branches. Localised time formatting (Intl.DateTimeFormat) is exercised indirectly through the time-range render assertions.'
deviations:
  - rule: 'Rule 2 — auto-add missing critical functionality'
    type: i18n-keys-missing
    description: 'weekAhead.status.{scheduled,confirmed,pending,in_progress,completed,cancelled} keys absent from both locales — without them lifecycle chips would render the raw enum value. Appended to en + ar (no other namespaces touched).'
    file: frontend/src/i18n/{en,ar}/dashboard-widgets.json
  - rule: 'Convention — adapter contract over plan stub'
    type: shape-realignment
    description: 'Plan illustrated a draft TimelineEvent shape (counterpart / counterpartFlag / status). The Wave 0 adapter exposes the real shape (start_date / engagement_name / lifecycle_stage). Implementation follows the adapter — keeps T-38-02 mitigation intact.'
    file: frontend/src/pages/Dashboard/widgets/WeekAhead.tsx
must_haves_verified:
  truths:
    - 'User sees upcoming engagements grouped by day with day labels Today / Tomorrow / This Week / Next Week — verified by `renders 4 day group headers when all 4 buckets are populated`'
    - 'Each row shows DossierGlyph + title + counterpart + location + status chip + LTR-isolated time range — verified by `renders DossierGlyph and a .week-time element with dir=ltr isolation` + `renders a status chip when lifecycle_stage is present`'
    - 'Groups can expand beyond MAX_VISIBLE_EVENTS via show-more toggle — verified by `shows at most 5 rows per group; expand button reveals the rest`'
    - 'Data hydrates from useWeekAhead (Wave 0 adapter) — verified by `useWeekAhead(user?.id)` import + 13 grep matches for DossierGlyph|LtrIsolate|useWeekAhead in WeekAhead.tsx'
  artifacts:
    - path: frontend/src/pages/Dashboard/widgets/WeekAhead.tsx
      provides: 'day-grouped list with expand toggle, real-data hydration'
      lines: 213
  rtl_grep_gate: '0 matches for ml-/mr-/pl-/pr-/text-left/text-right in WeekAhead.tsx'
threat_flags: []
---

# Phase 38 Plan 02: WeekAhead Widget Summary

**One-liner:** Hydrated `WeekAhead` with the Wave 0 `useWeekAhead` adapter — renders upcoming engagements in fixed day-bucket order (today / tomorrow / this_week / next_week), each row composed of `<DossierGlyph type="country" name={engagement_name}>` + title + meta + `<LtrIsolate>`-wrapped time range + lifecycle status chip, with a per-group expand toggle once `events.length > 5`.

## Outcome

- 5 files changed (1 new SUMMARY, 4 modified — widget body, test, dashboard.css, en/ar i18n)
- 2 atomic commits on worktree branch (test RED `8c665902` → feat GREEN `137d6fe3`)
- 7/7 unit tests pass (`vitest run`)
- TypeScript clean across plan files
- Zero forbidden RTL classes in the new widget body

## Key Decisions Made

1. **Adapter contract is the source of truth, not the plan stub.** The plan illustrated a draft `TimelineEvent` shape (`counterpart` / `counterpartFlag` / `status`); the Wave 0 adapter exposes the real shape (`start_date` / `engagement_name` / `lifecycle_stage`). The widget consumes the real shape — keeps T-38-02 (adapter contract mitigation) intact and avoids a fictitious data path.

2. **`DossierGlyph` initials fallback path.** No `iso` is available on the `TimelineEvent` shape — `<DossierGlyph type="country" name={engagement_name ?? title}>` triggers the Phase 37 initials-fallback (1–2 chars) inside a circle. When the underlying source surfaces ISO codes, the same call site upgrades to flag without a refactor.

3. **Status i18n appended (Rule 2 — missing critical functionality).** Added six lifecycle keys (`scheduled`, `confirmed`, `pending`, `in_progress`, `completed`, `cancelled`) to en + ar. `t()` uses `defaultValue: stage` so future enum members render without a code change.

4. **Shared-file discipline honoured.** `dashboard.css` only gained `.week-group { display: block }`; the existing `.week-row`, `.week-time`, etc. (Wave 0) were untouched. The two i18n files only appended `weekAhead.status.*` — every other widget's section was preserved byte-for-byte.

## Threat Mitigations Verified

| Threat ID                           | Disposition | Verification                                                                                                          |
| ----------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------- |
| T-38-01 (mock-data leak)            | mitigated   | `WeekAhead.tsx` has zero const arrays — only `useWeekAhead(user?.id)` flows in; widget body shows skeleton if pending |
| T-38-02 (TimelineEvent shape drift) | mitigated   | `TimelineEvent` + `TimelineGroup` imported from `@/domains/operations-hub/types/operations-hub.types` (single source) |
| T-38-04 (RTL time-range flip)       | mitigated   | `<LtrIsolate className="week-time">` wrapper renders `dir="ltr"`; `.week-time` lookup + ancestor assertion in tests   |

## Self-Check: PASSED

- Files modified: 4/4 verified on disk
- Files created: 1/1 verified on disk (this SUMMARY)
- Commits: `8c665902` (test) + `137d6fe3` (feat) both present in `git log`
- Tests: 7/7 pass via `vitest run src/pages/Dashboard/widgets/__tests__/WeekAhead.test.tsx`
- key-link patterns:
  - `useWeekAhead\(` → matches in `WeekAhead.tsx`
  - `DossierGlyph` → matches in `WeekAhead.tsx` (1 use site, multiple references in imports/jsx)
  - `LtrIsolate` → matches in `WeekAhead.tsx` (3 uses: day, time, root)
- RTL grep gate (must be 0): 0 ✓ (`grep -E "ml-|mr-|pl-|pr-|text-left|text-right" WeekAhead.tsx`)
- Shared-file discipline:
  - `dashboard.css` diff: only `.week-group { display: block }` block added (zero changes to other widgets' rules)
  - `dashboard-widgets.json` (en + ar): only `weekAhead.status` block added (other namespaces byte-identical)
