---
phase: 38-dashboard-verbatim
plan: '03'
status: PASS
subsystem: frontend/dashboard
tags: [widget, overdue-commitments, severity, RTL, expand-toggle, CVA]
requirements_addressed: [DASH-03, DASH-08, DASH-09]
dependency_graph:
  requires:
    - 'usePersonalCommitments adapter (38-00) — internal-only filter baked in'
    - 'WidgetSkeleton primitive (38-00)'
    - 'LtrIsolate primitive (Phase 33)'
    - 'DossierGlyph (Phase 37 signature-visuals)'
    - '.overdue-* CSS rules in dashboard.css (38-00)'
  provides:
    - 'Hydrated OverdueCommitments widget with grouped severity + expand toggle'
    - 'Severity dot CVA pattern (red/amber/yellow → SLA tokens) reusable across widgets'
  affects:
    - 'frontend/src/pages/Dashboard/index.tsx (already wires <OverdueCommitments />)'
tech_stack:
  added: []
  patterns:
    - 'CVA severity variants → CSS-var Tailwind classnames (`bg-[color:var(--sla-bad)]`)'
    - 'Per-group expand state via `useState<Record<string, boolean>>`'
    - '`<LtrIsolate>` for LTR-direction days-overdue chip in RTL pages (T-38-04)'
    - 'Group sort by max severity (red → amber → yellow) using SEVERITY_ORDER lookup'
key_files:
  created:
    - frontend/src/pages/Dashboard/widgets/__tests__/OverdueCommitments.test.tsx
  modified:
    - frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx
decisions:
  - 'Used `bg-[color:var(--sla-*)]` arbitrary-value Tailwind syntax instead of `bg-[var(--sla-*)]` so the test grep on the className contains the exact `var(--sla-bad)`/`var(--sla-risk)` token (passes Phase 33 token-only-color rule and provides a stable test-grep surface)'
  - 'Skipped editing `dashboard.css` and `dashboard-widgets.json` — both already provide all required `.overdue-*` rules and `overdue.{title,empty,expand,collapse}` keys from plan 38-00. No append needed; honors shared-file APPEND-only discipline by simply not touching them.'
  - 'Added a `data-severity` attribute on the dot span so tests can grep without coupling to the CVA-generated className. Same className still contains the token name for visual assertion.'
  - 'Owner-initials chip kept (handoff parity), wrapped in `font-mono` matching `.overdue-owner` CSS rule. Not strictly required by the plan must-haves but renders for free since the adapter exposes `ownerInitials`.'
metrics:
  duration_minutes: 12
  completed_date: '2026-04-25'
  tasks_completed: 2
  files_changed: 2
commits:
  - hash: 'e208dc58'
    type: test
    title: 'add failing tests for OverdueCommitments grouping/expand/severity (RED)'
  - hash: '3bdda6b2'
    type: feat
    title: 'hydrate OverdueCommitments widget with grouped severity + expand (GREEN — bundled with 38-08-01 commit due to parallel-worktree HEAD lock retry)'
tests_run:
  - 'frontend ./node_modules/.bin/vitest run src/pages/Dashboard/widgets/__tests__/OverdueCommitments.test.tsx → 8/8 passed'
coverage_notes: '8 tests cover: loading skeleton, error state, empty state, severity-sort ordering (red→amber→yellow), default-3-visible expand toggle, CVA severity-dot variants (red/amber/yellow tokens), LtrIsolate `dir=ltr` days chip, DossierGlyph iso flag wiring.'
deviations:
  - rule: 'Process — concurrent worktree commit collision'
    type: bundled-commit
    description: 'GREEN-phase commit message was prepared as `feat(38-03-TASK-2): hydrate OverdueCommitments` but the parallel agent on 38-08-01 won the HEAD-lock race and the staged OverdueCommitments.tsx was carried into commit `3bdda6b2`. Net result: file content lands in HEAD with the same diff; commit-message attribution differs from plan. Tracked here per Rule 3 transparency.'
    file: frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx
open_risks:
  - 'Snapshot-style visual regression for severity dot colors deferred to plan 38-09 E2E (D-15 viewport-1280 VR matrix).'
  - 'Days-overdue chip currently renders Latin "d" suffix — Arabic locale display string deferred to a future i18n pass (handoff parity).'
threat_flags: []
---

# Phase 38 Plan 03: OverdueCommitments widget Summary

**One-liner:** Hydrated `OverdueCommitments` from the security-critical `usePersonalCommitments` adapter (internal-only owner filter) with dossier grouping, severity-sorted dots (red ≥7d / amber 3–6d / yellow 1–2d) via CVA + Phase 33 SLA tokens, default-3-visible expand toggle per group, and an LTR-isolated mono days-overdue chip — covering DASH-03 / DASH-08 / DASH-09 with 8/8 unit tests green.

## Outcome

- 1 test file created, 1 widget file replaced (stub → 168-line implementation)
- 8 unit tests pass (loading / error / empty / sort / expand / CVA / LtrIsolate / DossierGlyph)
- RTL grep-gate: 0 forbidden classes (`ml-`/`mr-`/`pl-`/`pr-`/`text-left`/`text-right`)
- All 4 must-have patterns matched in source: `usePersonalCommitments`, `LtrIsolate`, `severityDot`, `cva`
- No mutation of `dashboard.css` or `dashboard-widgets.json` — pre-existing scaffold from 38-00 already covers both, honoring shared-file APPEND-only discipline by no-op

## Must-Haves Verified

| Truth                                                                                  | Verification                                                                                                                    |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| User sees overdue commitments grouped by dossier with severity dot (red/amber/yellow)  | Test "renders groups sorted by highest severity"; CVA `severityDot({ severity })`                                               |
| Each group can expand to show all items (default collapsed to first 3)                 | Test "default shows 3 items per group; expand reveals the rest"                                                                 |
| Days-overdue chip renders with mono font inside `<LtrIsolate>`                         | Test "days-overdue chip is wrapped in LtrIsolate (dir=ltr) with mono font" — chip has `dir="ltr"`, `.overdue-days`, `font-mono` |
| Data comes exclusively from `usePersonalCommitments` (filters `ownerType: 'internal'`) | Source grep: 1 import of `usePersonalCommitments`, no other data hooks                                                          |

## Threat Mitigations Verified

| Threat                                                    | Disposition | Verification                                                                                      |
| --------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| T-38-09 (information disclosure via external commitments) | mitigated   | Widget consumes `usePersonalCommitments` only; adapter test in 38-00 pins `ownerType: 'internal'` |
| T-38-01 (mock leak)                                       | mitigated   | Zero handoff mock constants imported; data sourced from hook                                      |
| T-38-04 (RTL days chip)                                   | mitigated   | `<LtrIsolate>` with `dir="ltr"` wraps `${daysOverdue}d` (test asserts `dir=ltr`)                  |

## Self-Check: PASSED

- Files created: 1/1 verified — `OverdueCommitments.test.tsx` exists
- Files modified: 1/1 verified — `OverdueCommitments.tsx` content matches implementation (commit `3bdda6b2`)
- Commit `e208dc58` (RED test commit) present in `git log`
- Commit `3bdda6b2` includes the GREEN-phase widget body (verified via `git show`)
- key_links pattern regexes:
  - `usePersonalCommitments\(` → matches at OverdueCommitments.tsx:49
  - `LtrIsolate` → matches at OverdueCommitments.tsx:6, 133
  - `severityDot` → matches at OverdueCommitments.tsx:21, 128
  - `cva` → matches at OverdueCommitments.tsx:3, 21
- Forbidden RTL classes (`ml-`/`mr-`/`pl-`/`pr-`/`text-left`/`text-right`) in widget: 0 ✓
- Vitest: 8/8 pass
