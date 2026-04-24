---
phase: 38-dashboard-verbatim
plan: '01'
status: PASS
subsystem: frontend/dashboard/widgets
tags: [kpi, widget, useDashboardStats, accent-token, LtrIsolate, RTL, tdd]
requirements_addressed: [DASH-01, DASH-08, DASH-09]
dependency_graph:
  requires:
    - '38-00 (widgets/ scaffold + dashboard.css `.kpi-strip` + `.kpi-accent::before` ported)'
    - 'frontend/src/domains/operations-hub/hooks/useDashboardStats (Phase 10 hook, untouched)'
    - 'frontend/src/components/ui/ltr-isolate (SP-4 wrapper)'
  provides:
    - 'KpiStrip widget hydrated from `useDashboardStats(user.id)` — 4 cards verbatim from handoff'
    - '`kpi-accent` class on card 3 → `var(--accent)` top-bar via existing `dashboard.css` rule'
    - 'Pattern reference for Wave 1 widgets: useAuth + domain hook + LtrIsolate numerals + plain `.kpi` div (no double-Card wrap)'
  affects:
    - 'frontend/src/components/ui/ltr-isolate.tsx (extended to passthrough HTMLDivElement attrs — backward compatible; existing call sites unaffected)'
    - 'frontend/src/i18n/{en,ar}/dashboard-widgets.json (kpi.*Meta strings populated; surgical append-style edit, no other widgets touched)'
tech_stack:
  added: []
  patterns:
    - 'useDashboardStats(user?.id) destructured to {data, isLoading} — skeleton until both `isLoading===false` AND `data!==undefined`'
    - 'Plain `<div className="kpi">` (no HeroUI Card wrapper) — `.kpi` class in `dashboard.css` already supplies surface/padding/radius (Phase 33 token-driven)'
    - 'LtrIsolate now extends HTMLDivElement attrs — enables `data-testid` + future `aria-live`/`aria-label` without further changes'
    - 'Skeleton mirrors final layout: 4 placeholder cards, card-3 also wears `kpi-accent` so the accent bar paints during loading'
key_files:
  created:
    - frontend/src/pages/Dashboard/widgets/__tests__/KpiStrip.test.tsx
  modified:
    - frontend/src/pages/Dashboard/widgets/KpiStrip.tsx
    - frontend/src/components/ui/ltr-isolate.tsx
    - frontend/src/i18n/en/dashboard-widgets.json
    - frontend/src/i18n/ar/dashboard-widgets.json
decisions:
  - 'Used `<div className="kpi">` instead of `<Card className="kpi">` per the plan example, because `dashboard.css` (ported in Wave 0) already styles `.kpi` with `background: var(--surface)` + `padding: var(--pad)` + `border-radius`. Wrapping in HeroUI `<Card>` would double-paint borders and break the verbatim handoff layout. This is consistent with Phase 38 D-02 (verbatim port mindset).'
  - 'Mapped plan field `upcoming_this_week` to the actual interface field `upcoming_week` (TS shape check, RESEARCH A1). Interface unchanged — the plan text was inaccurate. No mock fallbacks added.'
  - 'Extended `LtrIsolate` props to passthrough HTMLDivElement attrs (Rule 2 — missing critical functionality for testability and a11y discoverability). Removed redundant `style` prop in favor of native HTMLAttributes spread; existing call sites still work because `style` is part of HTMLAttributes.'
  - 'Populated `kpi.*Meta` i18n strings verbatim from handoff `dashboard.jsx` `kpiMeta` array (EN + AR). These are static labels, not derived counts — keeps Wave 1 self-contained without joining new tables.'
  - 'No CSS file modified — Wave 0 already ported `.kpi-strip`, `.kpi`, and `.kpi-accent::before { background: var(--accent) }` rules verbatim from handoff. Plan step 3 was therefore a no-op.'
metrics:
  duration_minutes: 14
  completed_date: '2026-04-25'
  tasks_completed: 2
  files_changed: 5
commits:
  - hash: '9a8f76ae'
    type: test
    title: 'add failing KpiStrip unit tests (RED gate)'
  - hash: 'c1bed03e'
    type: feat
    title: 'hydrate KpiStrip with useDashboardStats + accent card 3 (GREEN)'
tests_run:
  - 'frontend ./node_modules/.bin/vitest run src/pages/Dashboard/widgets/__tests__/KpiStrip.test.tsx → 5/5 passed'
  - 'frontend ./node_modules/.bin/tsc --noEmit (filtered to plan files) → 0 errors'
must_haves_verified:
  - '4 KPI cards hydrated from `useDashboardStats(user.id)` — values 12/8/3/5 in test'
  - 'Third card carries `kpi-accent` class (asserted in test 2)'
  - 'Large numerals wrapped in `<LtrIsolate dir="ltr">` (asserted in test 4: all 4 nodes have dir=ltr)'
  - 'Card 3 visual: `.kpi-accent::before { background: var(--accent); inset-inline-start/end: 0; block-size: 2px; inset-block-start: 0 }` painted via existing CSS rule'
  - 'Zero hardcoded color literals in widget HTML (asserted in test 5)'
deviations:
  - rule: 'Rule 1 — bug avoidance (verbatim port consistency)'
    type: 'spec-vs-CSS-mismatch'
    description: 'Plan example specified `<Card className="kpi">` (HeroUI wrapper). Wave 0 dashboard.css already styles plain `.kpi { background: var(--surface); padding: var(--pad); ... }` — wrapping in <Card> would double-paint surface + add HeroUI''s own border. Used plain `<div className="kpi">` to match the verbatim handoff layout. Tests still assert `.kpi` count by class, so behavior contract is preserved.'
    file: frontend/src/pages/Dashboard/widgets/KpiStrip.tsx
  - rule: 'Rule 2 — missing critical functionality'
    type: 'props-passthrough'
    description: '`LtrIsolate` only accepted children/className/style — could not receive `data-testid` or future `aria-*` attrs. Extended to `Omit<HTMLAttributes<HTMLDivElement>, "dir" | "children">` so the test could query `[data-testid="kpi-value"]` and a11y attrs flow through. Backward compatible — `style` still works (part of HTMLAttributes).'
    file: frontend/src/components/ui/ltr-isolate.tsx
  - rule: 'Spec correction (interface field name)'
    type: 'plan-text-vs-actual-type'
    description: 'Plan referenced `data.upcoming_this_week`; the actual `DashboardStats` field is `upcoming_week` (Phase 10 type, untouched in Wave 0). Used the real field name — no mock fallbacks added. Interface left untouched.'
    file: frontend/src/pages/Dashboard/widgets/KpiStrip.tsx
threat_flags: []
---

# Phase 38 Plan 01: KpiStrip widget Summary

**One-liner:** Replaced the Wave 0 KpiStrip stub with 4 real KPI cards bound to `useDashboardStats(user.id)`, painted card 3's accent top-bar via the existing `kpi-accent` CSS rule (Phase 33 `var(--accent)` token, never hex), and wrapped every Latin numeral in `<LtrIsolate>` so digits stay LTR under `forceRTL` — locked behind 5 unit tests via TDD RED→GREEN.

## Outcome

- 5/5 KpiStrip unit tests pass
- TS clean across plan files (`tsc --noEmit` 0 errors)
- 0 hardcoded color literals in widget HTML
- 0 forbidden RTL classes (`ml-/mr-/pl-/pr-/text-left/text-right`) in widget file
- 2 atomic commits on `worktree-agent-a073e32e30744a197` branch (RED + GREEN)

## Key Decisions Made

1. **Plain `<div className="kpi">` (not `<Card>` wrapper)** — Wave 0 already ported `dashboard.css` `.kpi` rules verbatim (surface, padding, border, radius). Wrapping in HeroUI Card would double-paint borders and break the handoff layout. Decision rooted in Phase 38 D-02 (verbatim port mindset).

2. **`upcoming_week` not `upcoming_this_week`** — TS shape check (RESEARCH A1) revealed the plan text was inaccurate; the real `DashboardStats` interface uses `upcoming_week`. No fallbacks added; no interface extension needed.

3. **`LtrIsolate` extended to passthrough HTML attrs** — was the cleanest way to support `data-testid` (test discoverability) and future `aria-*` flows. Surgical: 5 lines changed, full backward compatibility.

4. **CSS already in place** — Plan step 3 (add `.kpi-accent::before` rule) was a no-op because Wave 0 ported it verbatim. Verified with `grep -c "var(--accent)" dashboard.css` → 2 matches.

## Threat Mitigations Verified

| Threat ID                      | Disposition | Verification                                                                                          |
| ------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------- |
| T-38-01 (mock leak)            | mitigated   | KpiStrip body sources only `useDashboardStats`; skeleton when no data; no `WEEK_AHEAD`/mock constants |
| T-38-02 (DashboardStats shape) | mitigated   | `tsc --noEmit` clean; field name corrected to `upcoming_week`; interface unchanged                    |
| T-38-07 (card 3 accent color)  | mitigated   | grep gate: `grep -cE "#[0-9a-fA-F]{3,6}\|rgb\\("` on KpiStrip.tsx → 0; CSS uses `var(--accent)` only  |

## Self-Check: PASSED

- Files created: 1/1 verified on disk (`KpiStrip.test.tsx`)
- Files modified: 4/4 verified (`KpiStrip.tsx`, `ltr-isolate.tsx`, `i18n/{en,ar}/dashboard-widgets.json`)
- Commits: `9a8f76ae` (RED), `c1bed03e` (GREEN) both present in `git log`
- key_links pattern regexes:
  - `useDashboardStats\(` → matches at `KpiStrip.tsx:42`
  - `\.kpi-accent.*var\(--accent\)` → matches at `dashboard.css:151-158` (block-size 2px top-bar)
  - `LtrIsolate` → 4 matches at `KpiStrip.tsx`
- Hex check (must be 0): 0 ✓
- Forbidden RTL classes (`ml-`/`mr-`/`pl-`/`pr-`/`text-left`/`text-right`) in plan files: 0 ✓
- Unit tests: 5/5 pass ✓
- TDD gate sequence: `test(38-01-TASK-2)` → `feat(38-01-TASK-1)` ✓
