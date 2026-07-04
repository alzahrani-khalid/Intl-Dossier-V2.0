---
phase: 81-visible-bugs
plan: 03
subsystem: frontend-ui
tags: [dashboard, week-ahead, kpi-strip, i18n, bug-fix, rtl, linear-design]
requires:
  - Phase 81 CONTEXT decisions D-81-04, D-81-05, D-81-06
  - frontend/src/types/lifecycle.types.ts (LifecycleStage / LIFECYCLE_STAGES)
provides:
  - Every LifecycleStage value has a sentence-case weekAhead.status label in EN + AR (no raw DB enum can surface as a Week Ahead pill)
  - KPI labels render on a single line at <=1024 in EN and AR
  - Real-JSON coverage guard that fails if any LifecycleStage key is dropped from either bundle
affects:
  - frontend/src/i18n/en/dashboard-widgets.json
  - frontend/src/i18n/ar/dashboard-widgets.json
  - frontend/src/pages/Dashboard/widgets/dashboard.css
tech-stack:
  added: []
  patterns:
    - i18n key-gap fix (add missing keys) rather than a render rewrite — WeekAhead.tsx untouched, defaultValue net kept
    - Coverage test imports the REAL JSON bundles + LIFECYCLE_STAGES (no mocked t) so a missing key cannot be masked
    - CSS single-line label via nowrap + ellipsis fallback + a <=1024 size reduction declared last to win on source order over the .dir-linear base
key-files:
  created:
    - frontend/src/pages/Dashboard/widgets/__tests__/WeekAheadStatusKeys.test.ts
  modified:
    - frontend/src/i18n/en/dashboard-widgets.json
    - frontend/src/i18n/ar/dashboard-widgets.json
    - frontend/src/pages/Dashboard/widgets/dashboard.css
decisions:
  - 'BUG-04 fixed as an i18n key gap: added the six LifecycleStage labels (intake/preparation/briefing/execution/follow_up/closed) to weekAhead.status in EN + AR, mirroring the canonical lifecycle.json labels; kept the six pre-existing keys and the t(...,{defaultValue: stage}) safety net. WeekAhead.tsx unmodified.'
  - 'Coverage test imports the real en/ar dashboard-widgets.json bundles + LIFECYCLE_STAGES and asserts each stage has a non-raw label in both languages — deliberately no mocked t, per the project lesson that mocked-t masks key gaps.'
  - 'BUG-05: .kpi-label gets white-space:nowrap + min-width:0 + ellipsis fallback (wrap is the defect) and a @media (max-width:1024px) block reduces label size to 10px / 0.05em for both .kpi-label and .dir-linear .kpi-label. Live measurement showed the long AR "SLA at risk" label fits single-line without ellipsis, so no AR copy shortening was needed.'
metrics:
  duration: ~12m
  tasks_completed: 3
  files_modified: 4
  completed: 2026-07-04
requirements: [BUG-04, BUG-05]
---

# Phase 81 Plan 03: Raw Enum Status Pills + KPI Label Wrap Summary

Closed the last two Phase-81 dashboard-widget bugs: the Week Ahead pills now render sentence-case lifecycle labels (Follow-up / التحضير) instead of raw snake_case DB enums, and the KPI-strip labels stay on a single line at the 1024 analyst width in both EN and AR — verified live at 1024 and 1400 across both languages with zero raw-enum leaks.

## What Was Built

### BUG-04 — Raw enum status pills (D-81-04)

`WeekAhead.tsx` already localizes each event's `lifecycle_stage` via
`statusLabel(stage) = t('weekAhead.status.' + stage, { defaultValue: stage })`.
The loaded `dashboard-widgets` namespace, however, only defined
`scheduled/confirmed/pending/in_progress/completed/cancelled` — none of the six
real `LifecycleStage` values — so the `defaultValue` net leaked the raw
snake_case enum (`preparation`, `follow_up`) as a user-visible pill.

Fix is a pure key-gap addition (not a render rewrite):

- Added `intake/preparation/briefing/execution/follow_up/closed` under
  `weekAhead.status` in **`i18n/en/dashboard-widgets.json`** (Intake / Preparation /
  Briefing / Execution / Follow-up / Closed) and **`i18n/ar/dashboard-widgets.json`**
  (الاستقبال / التحضير / الإحاطة / التنفيذ / المتابعة / مغلق), mirroring the
  canonical `i18n/{en,ar}/lifecycle.json` `stages` labels and
  `LIFECYCLE_STAGE_LABELS`.
- Kept the six pre-existing status keys (harmless safety) and the
  `{ defaultValue: stage }` net. **`WeekAhead.tsx` was not touched** (git diff clean).
- Added **`__tests__/WeekAheadStatusKeys.test.ts`** — imports `LIFECYCLE_STAGES`
  and the two real JSON bundles (no react-i18next mock, no render) and asserts, for
  every stage in both languages, that `weekAhead.status.<stage>` exists, is a
  non-empty string, and is not equal to the raw snake_case key (guards
  `Follow-up` vs `follow_up`). 12 assertions (6 stages × 2 langs).

### BUG-05 — KPI label wrap at 1024 (D-81-05)

`.kpi-label` (10.5px base / 11px `.dir-linear`, uppercase, 0.08–0.1em tracking)
wrapped to two lines at 1024px ("ACTIVE ENGAGEMENTS"; the long AR "SLA at risk"
label is worst).

- `.kpi-label` gains `white-space: nowrap` + `min-width: 0` + `overflow: hidden` +
  `text-overflow: ellipsis` — the label can no longer wrap; ellipsis is the
  sanctioned controlled-truncation fallback.
- New `@media (max-width: 1024px)` block reduces `.kpi-label` **and**
  `.dir-linear .kpi-label` to `font-size: 10px; letter-spacing: 0.05em`. It is
  declared **last** in the file so it overrides the `.dir-linear .kpi-label` base
  (the default active direction) on source order without inflating specificity.
- Uppercase `text-transform` is preserved (allowed mono/label affordance).
- Live measurement showed all four labels — including the long AR "SLA at risk"
  ("اتفاقيات مستوى الخدمة المعرضة للخطر") — fit on one line without ellipsis at
  1024, so **no AR label copy was shortened** (`ar/dashboard-widgets.json` needed
  no `kpi.*` change).

Task 3 was verification-only and produced no source change beyond Tasks 1–2.

## Verification

- **Coverage test:** `vitest run src/pages/Dashboard/widgets/__tests__/WeekAheadStatusKeys.test.ts` — 12/12 pass. Existing `WeekAhead.test.tsx` — 7/7 pass. Full widgets suite `vitest run src/pages/Dashboard/widgets` — **83/83 pass across 11 files** (incl. the new guard + the no-placeholder-data gate).
- **Live browser (dev :5173), DOM-measured at 1024 EN, 1024 AR, 1400 EN:**
  - Week Ahead pills render `Preparation` / `Follow-up` (EN) and `التحضير` / `المتابعة` (AR); a `body.innerText` regex for `follow_up|preparation|in_progress|briefing|execution` returned **`[]`** (zero raw-enum leaks) at every width/language.
  - All four KPI labels single-line (`computed white-space: nowrap`, height == one line, `scrollWidth <= clientWidth` → `truncated: false`) at 1024 in EN and AR — including "Active Engagements" and the long AR "SLA at risk" label — and at 1400.
  - `capture_screenshot()` returned 42-byte artifacts (browser-harness quirk); the DOM assertions (`truncated:false`, one-line height, empty raw-leak regex) are stronger single-line / no-leak evidence than pixels and stand as the verification record.
- **Plan Task-2 grep gate:** `grep -A6 '^\.kpi-label' dashboard.css | grep -q nowrap` && `grep -q 'max-width: 1024px' dashboard.css` → PASS.

## Deviations from Plan

None affecting scope.

- **Harness-flag correction (carried from 81-02):** the plan's automated verify used `vitest --reporter=basic`, which vitest 4.1.7 no longer ships (errors at reporter load). Re-ran the same commands with the default reporter — all green. No source change.
- **AR copy left unchanged:** the plan permitted shortening the long AR `kpi.slaAtRisk` _if_ it still ellipsized badly at the reduced size. Live measurement showed it fits single-line (`truncated:false`), so per D-81-05 no copy change was made — keeps the diff to `dashboard.css` only.

## Design Compliance (D-81-06)

Tokens and logical properties only. The new CSS introduces no raw hex, no
Tailwind color literal, no card shadow, no physical left/right/margin properties
(verified via `git diff` grep). Radii/row-height tokens untouched. Carve-outs
(`styles/list-pages.css` shim, `types/*` comments, `design-system/tokens/`,
`index.css` `:root`, `public/bootstrap.js`) byte-untouched. i18n edited only under
`src/i18n` (the dead `public/locales` was not touched). No emoji, no marketing
voice; Arabic verified rendering under `<html dir=rtl>`.

## Self-Check: PASSED

- Commit `99ea30b4` (Task 1 — i18n keys + coverage test) — FOUND
- Commit `19a39bdd` (Task 2 — KPI label CSS) — FOUND
- `frontend/src/i18n/en/dashboard-widgets.json` (weekAhead.status.follow_up) — FOUND
- `frontend/src/i18n/ar/dashboard-widgets.json` (weekAhead.status.follow_up) — FOUND
- `frontend/src/pages/Dashboard/widgets/__tests__/WeekAheadStatusKeys.test.ts` — FOUND
- `frontend/src/pages/Dashboard/widgets/dashboard.css` (nowrap + max-width:1024px) — FOUND
