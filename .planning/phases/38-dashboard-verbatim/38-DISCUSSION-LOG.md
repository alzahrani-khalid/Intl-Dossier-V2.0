# Phase 38: dashboard-verbatim - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 38-dashboard-verbatim
**Areas discussed:** Handoff restoration, Missing hooks, Route strategy, Widget organization, Plan granularity, Loading states, Breakpoints, E2E scope

---

## Handoff bundle restoration

| Option | Description | Selected |
|--------|-------------|----------|
| I'll restore it now | User re-extracts/re-places handoff at /tmp/inteldossier-handoff/inteldossier/ before continuing | ✓ |
| It's elsewhere — tell me path | Handoff lives at different path (iCloud, repo-internal, other) | |
| Work from Phase 37 artifacts only | Skip pixel-exact verification, use spec text as source of truth | |
| Defer Phase 38 | Stop discuss-phase, come back after restoration | |

**User's choice:** "I'll restore it now"
**Notes:** Blocker flagged in CONTEXT.md D-01 — planning MUST halt if bundle still missing at `/gsd-plan-phase 38` time. Phase 37 precedent of verbatim port is preserved.

---

## Missing hooks (useWeekAhead, usePersonalCommitments)

| Option | Description | Selected |
|--------|-------------|----------|
| Create thin adapter hooks | Add both hooks as Phase 38 infra (Wave 0), deriving from existing engagement/commitments sources | ✓ |
| Use closest existing hooks as-is | Wire widgets directly to existing hooks with no new abstractions | |
| Split into separate prerequisite | Plan a 38.0 prep phase for hooks, then widgets | |
| You decide | Claude picks during research/planning | |

**User's choice:** "Create thin adapter hooks"
**Notes:** Both hooks land in `frontend/src/hooks/` (consistent with `useDashboardTrends`, `useMyTasks` convention). `usePersonalCommitments` is a thin filter over `useCommitments`. `useWeekAhead` derives day-grouped upcoming from existing engagement/event sources — researcher confirms exact source.

---

## Route strategy (OperationsHub replacement)

| Option | Description | Selected |
|--------|-------------|----------|
| Replace OperationsHub outright | Delete OperationsHub + rewrite dashboard.tsx; keep FirstRunModal wiring | ✓ |
| Parallel component, flag-switch | Feature-flagged rollout at ?design=v6, swap later | |
| Replace but archive | Move OperationsHub to `pages/Dashboard/legacy/` for reference | |

**User's choice:** "Replace OperationsHub outright"
**Notes:** Git history is the archive. FirstRunModal + onboarding-tour wiring (`useFirstRunCheck`, `useTourComplete`) stays at route level verbatim — only the rendered dashboard body changes. Matches Phase 33/34 "legacy cut" pattern.

---

## Widget organization

| Option | Description | Selected |
|--------|-------------|----------|
| pages/Dashboard/widgets/ | Single folder + barrel index.ts (mirrors signature-visuals/) | ✓ |
| Co-located per domain | WeekAhead → engagements, Overdue → commitments, MyTasks → tasks, etc. | |
| Hybrid | Layout widgets centralized, data-heavy widgets in domain folders | |

**User's choice:** "pages/Dashboard/widgets/"
**Notes:** Matches Phase 37 signature-visuals/ layout precedent. Easier to find, single import surface for `dashboard.tsx`.

---

## Plan granularity

| Option | Description | Selected |
|--------|-------------|----------|
| One plan per widget (~10 plans) | Wave 0 infra + 1 plan per widget + E2E plan (matches Phase 37 cadence) | ✓ |
| Grouped by data needs (~5 plans) | Fewer, coarser plans grouped by data source | |
| You decide during plan-phase | Claude picks based on plan-checker feedback | |

**User's choice:** "One plan per widget (~10 plans)"
**Notes:** Maximizes Wave 1 parallelism. Wave 0 = infra (folder + barrel + adapter hooks + route rewrite stub + VR baseline capture). Wave 1 = 8 widget plans in parallel. Wave 2 = E2E + legacy deletion.

---

## Loading states

| Option | Description | Selected |
|--------|-------------|----------|
| Per-widget Skeleton | Each widget owns a shape-matching skeleton | ✓ |
| Single FullscreenLoader on first paint | Block full dashboard until all queries resolve | |
| Match handoff exactly | Defer decision to researcher | |

**User's choice:** "Per-widget Skeleton"
**Notes:** Initial hydration already covered by Phase 37's AppShell Suspense + FullscreenLoader. Per-widget skeletons handle refetches without blocking the whole page.

---

## Responsive breakpoints

| Option | Description | Selected |
|--------|-------------|----------|
| Port handoff CSS verbatim | Grid-template/flex rules come from dashboard.jsx 1:1 | ✓ |
| Single-col → 2-col → handoff desktop | Improvise mobile-first reflow | |
| You decide | Claude picks pixel-exact desktop + derives mobile | |

**User's choice:** "Port handoff CSS verbatim"
**Notes:** Fidelity-first. If handoff CSS is desktop-only, researcher flags gap and planner writes mobile rules as explicit additive plan (documented per-widget).

---

## E2E coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Match Phase 37 (4 tests) | Render + axe + RTL + reduced-motion | |
| Heavier — per-widget + visual regression | Per-widget render, hooks-wiring asserts, axe, RTL, visual regression in 4 dirs × 2 modes | ✓ |
| Lighter — smoke + a11y only | One smoke test + axe, defer visual regression | |

**User's choice:** "Heavier — per-widget + visual regression"
**Notes:** DASH-09 "zero mock data" + pixel-exact across 4 directions requires visual regression. 8 baselines at 1280 px (4 directions × 2 modes). maxDiffPixelRatio 0.02. Baselines captured in Wave 0 after handoff restoration.

---

## Claude's Discretion

- Widget ARIA landmarks & heading levels (follow Phase 37 `<section aria-labelledby>` pattern)
- Empty-state fallback copy when handoff is silent (use existing `DashboardEmptyState.tsx`)
- Digest widget "source" field wiring (researcher confirms real source — activity_log vs feed vs other)
- Per-widget realtime debounce reuse (existing 1s tasks/transitions subscription sufficient; no new channels)

## Deferred Ideas

- Flag-switch parallel rollout
- Co-located widgets per domain
- Grouped plans by data needs
- Lighter E2E (smoke + a11y only)
- Legacy OperationsHub archive folder
- Per-widget Supabase realtime subscriptions
- Custom/user-configurable dashboards work
- Kanban / Calendar / Lists / Dossier Drawer (Phases 39-41)
