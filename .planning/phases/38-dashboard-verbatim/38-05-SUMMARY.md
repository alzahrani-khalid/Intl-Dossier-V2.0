---
phase: 38-dashboard-verbatim
plan: '05'
status: PASS-WITH-DEVIATION
subsystem: frontend/dashboard/widgets
tags: [widget, signature-visuals, donut, sparkline, RTL, sla, tdd]
requirements_addressed: [DASH-05, DASH-08, DASH-09]
dependency_graph:
  requires:
    - 'Phase 37 signature-visuals barrel (`Donut`, `Sparkline`)'
    - 'Phase 33 SLA color tokens (`--sla-ok`, `--sla-risk`, `--sla-bad`)'
    - '38-00 widget scaffold (`WidgetSkeleton`, `dashboard.css` `.sla-*` rules, i18n keys)'
  provides:
    - 'First domain consumer of `Donut` + `Sparkline` (Phase 37 primitives)'
    - 'Pattern for composing two signature visuals + legend in one widget'
  affects:
    - 'frontend/src/pages/Dashboard/widgets/SlaHealth.tsx (stub → hydrated)'
tech_stack:
  added: []
  patterns:
    - 'Donut variants tuple ([ok%, risk%, bad%]) with shared --ok/--risk/--bad token strokes'
    - 'Sparkline auto-flip respect (NO parent scaleX wrapper) per Phase 37 37-08-04'
    - 'useDashboardTrends("30d").slice(-14) — TrendRange does not accept "14d"'
    - 'TDD RED → GREEN with vi.mock spies on signature-visual primitives'
key_files:
  created:
    - frontend/src/pages/Dashboard/widgets/__tests__/SlaHealth.test.tsx
  modified:
    - frontend/src/pages/Dashboard/widgets/SlaHealth.tsx
decisions:
  - 'Adapted plan-spec Donut prop shape (`segments: [{value, color}]`) to the real Phase 37 API (`value, variants: [n,n,n]`). Tokens still drive arc colors via the shared `--ok/--risk/--bad` cascade; legend swatches still bind to SLA-specific `--sla-ok/--sla-risk/--sla-bad`.'
  - 'Adapted Sparkline `w/h` prop names to real `width/height`.'
  - '`DashboardStats` exposes only `sla_at_risk` + `open_tasks`. Mapped: risk=sla_at_risk, ok=max(open_tasks-risk,0), bad=0 (reserved). Documented in widget header and open_risks below.'
metrics:
  duration_minutes: 22
  completed_date: '2026-04-25'
  tasks_completed: 1
  files_changed: 2
commits:
  - hash: '855083f5'
    type: test
    title: 'add failing tests for SlaHealth Donut+Sparkline composition'
  - hash: '29c5bbae'
    type: feat
    title: 'hydrate SlaHealth with Donut + 14-day Sparkline + 3-row legend'
tests_run:
  - 'frontend ./node_modules/.bin/vitest run src/pages/Dashboard/widgets/__tests__/SlaHealth.test.tsx → 6/6 passed'
coverage_notes: 'Six tests cover: variants tuple shape, 14-pt sparkline slice, no double-flip (parent transform), 3-row legend, loading skeleton, error region.'
deviations:
  - rule: 'Rule 3 — blocking issue'
    type: api-mismatch
    description: |
      Plan task spec described `<Donut segments={[{value,color}]}>` and
      `<Sparkline w={} h={}>`. The real Phase 37 API uses
      `<Donut value variants={[n,n,n]}>` (token strokes hardcoded inside)
      and `<Sparkline width height>`. Adapted both component call shapes
      and the test assertions to the real surface; preserved the plan's
      truths (3 segments worth, 14-pt sparkline, no double-flip, 3-row
      legend, var(--sla-*) bindings via legend swatches).
    file: frontend/src/pages/Dashboard/widgets/SlaHealth.tsx
  - rule: 'Rule 3 — blocking issue'
    type: schema-gap
    description: |
      `DashboardStats` does not expose separate `sla_ok / sla_risk / sla_bad`
      counts (only `sla_at_risk` + `open_tasks`). Derived a 3-band split:
      risk = sla_at_risk, ok = max(open_tasks − risk, 0), bad = 0 (reserved).
      The bad band currently renders 0 until the dashboard repository is
      extended (Plan 38-09 or follow-up). Tests pass with this shape; the
      Donut's third arc is empty when bad=0, matching the visual contract.
    file: frontend/src/pages/Dashboard/widgets/SlaHealth.tsx
open_risks:
  - 'Donut "bad" segment is hardcoded to 0 until DashboardStats schema gains a dedicated breached/bad count. Follow-up: extend `getDashboardStats` repository SELECT to include `sla_breached` (or rename `sla_at_risk` to two fields).'
  - 'Sparkline series uses `max(created - completed, 0)` as a proxy for "open SLA load" — concrete mapping per DASH-05 but distinct from a true SLA-burn series. Verify with stakeholders during Wave 2 visual review.'
threat_flags: []
---

# Phase 38 Plan 05: SlaHealth Donut + 14-day Sparkline composite Summary

**One-liner:** First domain consumer of Phase 37 `<Donut>` + `<Sparkline>` — composes a 3-band SLA donut (OK / Risk / Bad), 3-row count legend bound to `var(--sla-*)` tokens, and a 14-day net-open-load sparkline derived from `useDashboardTrends('30d').slice(-14)`, with the Phase 37 internal RTL flip respected (no parent `scaleX` wrapper).

## Outcome

- 2 files changed (1 created, 1 hydrated)
- 2 atomic commits on `DesignV2` (RED → GREEN gates both present)
- 6/6 vitest specs pass
- 0 hex literals, 0 parent transform on Sparkline, 4 `var(--sla-*)` bindings

## Key Decisions Made

1. **Adapted to the real Phase 37 API** — the plan-spec assumed
   `Donut.segments` and `Sparkline.w/h`; the real shipped surfaces are
   `Donut.{value,variants}` (token strokes hardcoded inside) and
   `Sparkline.{width,height}`. Adapted both component calls and tests.

2. **Schema gap for `bad` band** — `DashboardStats` only exposes
   `sla_at_risk`. Mapped risk=sla_at_risk, ok=max(open_tasks−risk,0),
   bad=0 (reserved for repository extension). This keeps the widget
   shippable today and the visual contract stable.

3. **No parent `transform` on `<Sparkline>`** — Phase 37 plan 37-08-04
   already applies the `scaleX(-1)` flip internally via `useLocale()`.
   Wrapping with another mirror would double-flip back to LTR
   (RESEARCH Pitfall 1). Test `does NOT wrap <Sparkline> in a parent`
   guards this with two regex checks (CSS transform + Tailwind class).

## Threat Mitigations Verified

| Threat ID | Disposition | Verification                                                                                |
| --------- | ----------- | ------------------------------------------------------------------------------------------- |
| T-38-05   | mitigated   | `grep -i "scalex\|scale-x"` → 0 matches; unit test `does NOT wrap <Sparkline>` passes       |
| T-38-01   | mitigated   | Data sourced from `useDashboardStats` + `useDashboardTrends` only; no mock constants        |
| T-38-02   | mitigated   | TS compile clean against actual `DashboardStats`; deviation documented (no silent fallback) |

## TDD Gate Compliance

- RED gate: commit `855083f5` (`test(38-05-01)`) — 4 of 6 specs failed against
  the stub (variants/14-pt/legend/error); 2 specs passed trivially (skeleton
  - no-double-flip on a stub that contains neither).
- GREEN gate: commit `29c5bbae` (`feat(38-05-01)`) — all 6 specs pass.
- REFACTOR: not needed; widget is already at minimum shape.

## Self-Check: PASSED

- `frontend/src/pages/Dashboard/widgets/SlaHealth.tsx` exists ✓
- `frontend/src/pages/Dashboard/widgets/__tests__/SlaHealth.test.tsx` exists ✓
- Commits `855083f5` (test) + `29c5bbae` (feat) both present in `git log` ✓
- `grep "var(--sla-ok)\|var(--sla-risk)\|var(--sla-bad)" SlaHealth.tsx` → 4 ✓
- `grep -i "scalex\|scale-x" SlaHealth.tsx` → 0 ✓
- `grep -E "#[0-9a-fA-F]{3,6}" SlaHealth.tsx` → 0 ✓
- vitest: 6/6 pass ✓
- Forbidden RTL classes (`ml-/mr-/pl-/pr-/text-left/text-right`) in plan files: 0 ✓
- Shared-file discipline: `dashboard.css` and i18n JSON not modified (sla rules + sla.legend\_\* keys already present from 38-00) ✓
