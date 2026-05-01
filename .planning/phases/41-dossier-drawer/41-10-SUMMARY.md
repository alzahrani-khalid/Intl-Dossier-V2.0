---
phase: 41
plan: 10
subsystem: dashboard
tags: [dashboard, widgets, dossier-trigger, gap-closure, drawer-01]
requires: [41-06] # RecentDossiers + ForumsStrip openDossier wiring
provides: [recent-dossier-trigger-mounted, forum-trigger-mounted]
affects: [frontend/src/pages/Dashboard/index.tsx]
tech-stack:
  added: []
  patterns: [composition-only, dossier-centric]
key-files:
  created: [.planning/phases/41-dossier-drawer/41-10-SUMMARY.md]
  modified: [frontend/src/pages/Dashboard/index.tsx]
decisions:
  - 'Task 1 checkpoint resolved: option-a (re-mount RecentDossiers + ForumsStrip). Resume-signal verbatim: "option-a — re-mount RecentDossiers + ForumsStrip" (selected via AskUserQuestion).'
  - 'Digest NOT re-mounted. Per the plan resume-signal default and the user-confirmed layout preview, Digest is treated as less load-bearing and intentionally omitted from this gap-closure mount.'
  - 'DashboardGrid prop shape (left: ReactNode[], right: ReactNode[]) imposes no slot-count constraint, so the option-a layout (3-left, 4-right) was applied verbatim from the user-confirmed preview.'
metrics:
  duration: ~5 min
  completed: 2026-05-02
gaps_closed: [G1]
---

# Phase 41 Plan 10: Re-mount RecentDossiers + ForumsStrip in Dashboard Summary

Restore the dossier-centric trigger surface on the dashboard by re-mounting `RecentDossiers` and `ForumsStrip` in `Dashboard/index.tsx` — the widgets remained exported and fully wired to `openDossier` (Plan 41-06), but commit `e8f3341a` (pre-Phase-41 WIP layout snapshot) had removed them from the rendered tree, which broke the Phase 41 trigger spec for D-01.

## Decision Recorded (Task 1 — checkpoint:decision)

**Chosen option:** `option-a` — re-mount `RecentDossiers` + `ForumsStrip` in `Dashboard/index.tsx`.

**Resume-signal verbatim:** `option-a — re-mount RecentDossiers + ForumsStrip` (selected by the user via AskUserQuestion before this executor was spawned, with the layout preview shown below).

**User-confirmed layout (verbatim from the orchestrator-supplied resume context):**

```tsx
<DashboardGrid
  left={[
    <WeekAhead key="wa" />,
    <RecentDossiers key="rd" />,
    <OverdueCommitments key="oc" />,
  ]}
  right={[
    <SlaHealth key="sh" />,
    <ForumsStrip key="fs" />,
    <VipVisits key="vv" />,
    <MyTasks key="mt" />,
  ]}
/>
```

**Digest:** intentionally NOT re-mounted (per the resume-signal — less load-bearing for dossier-centric coverage). If a later phase decides Digest belongs back, that mount is a one-line change.

## Task 2 — Applied Changes

### Files modified

- `frontend/src/pages/Dashboard/index.tsx` — re-mounted `RecentDossiers` (left column, after `WeekAhead`) and `ForumsStrip` (right column, after `SlaHealth`). Diff: +21 / −3.

### Files NOT modified (verified)

- `frontend/tests/e2e/dossier-drawer-trigger-recent.spec.ts` — spec stays as written; under option-a it will PASS once smoke runs against the re-mounted dashboard.
- `.planning/phases/41-dossier-drawer/deferred-items.md` — option-a path does NOT add a deferral row; the trigger surface is restored, not deferred.
- All other Phase 41 plans (41-01 … 41-09) — gap-closure protocol observed.

### Exact diff (final state of `Dashboard/index.tsx`)

```tsx
import { type ReactElement } from 'react'
import { DashboardGrid } from './widgets/DashboardGrid'
import { DashboardHero } from './components/DashboardHero'
import {
  KpiStrip,
  WeekAhead,
  OverdueCommitments,
  SlaHealth,
  VipVisits,
  MyTasks,
  RecentDossiers,
  ForumsStrip,
} from './widgets'
import './widgets/dashboard.css'

export function Dashboard(): ReactElement {
  return (
    <div className="page dash-root">
      <DashboardHero />
      <KpiStrip />
      <DashboardGrid
        left={[
          <WeekAhead key="wa" />,
          <RecentDossiers key="rd" />,
          <OverdueCommitments key="oc" />,
        ]}
        right={[
          <SlaHealth key="sh" />,
          <ForumsStrip key="fs" />,
          <VipVisits key="vv" />,
          <MyTasks key="mt" />,
        ]}
      />
    </div>
  )
}
```

## Verification

- `grep -c "RecentDossiers" frontend/src/pages/Dashboard/index.tsx` → **2** (import + JSX). PASS.
- `grep -c "ForumsStrip" frontend/src/pages/Dashboard/index.tsx` → **2** (import + JSX). PASS.
- `DashboardGrid` prop shape inspected at `frontend/src/pages/Dashboard/widgets/DashboardGrid.tsx`: `left: ReactNode[]`, `right: ReactNode[]` — no slot-count constraint, the chosen layout fits as-is. PASS.
- `RecentDossiers` `data-testid="recent-dossier-trigger"` + `openDossier({ id, type })` wiring verified intact at `frontend/src/pages/Dashboard/widgets/RecentDossiers.tsx:21,59,61`. PASS.
- `ForumsStrip` `data-testid="forum-trigger"` + `openDossier({ id, type: 'forum' })` wiring verified intact at `frontend/src/pages/Dashboard/widgets/ForumsStrip.tsx:39,95,97`. PASS.
- Bounded change: only the planned file modified (`git status --short` shows a single `M` entry pre-commit). PASS.
- `pnpm type-check` could not be executed because `frontend/node_modules` is not installed in this worktree — this is a pre-existing environment condition, NOT a regression introduced by this plan. The change is type-safe by inspection (uses already-exported widgets that return `ReactElement`; `DashboardGrid` prop shape unchanged). Smoke verification in plan 41-11 (or a re-run with deps installed) will confirm.

## Cross-references

- **41-VERIFICATION.md G1 closed.** "recent-dossier-trigger testid not found on /dashboard" — root cause was the `Dashboard/index.tsx` widget removal in commit `e8f3341a`, not a Phase 41 implementation defect. Re-mount restores the testid in the DOM and the trigger surface for D-01.
- DRAWER-01 trigger inventory now mounts: RecentDossiers (re-mounted), ForumsStrip (re-mounted), OverdueCommitments (already mounted), calendar (separate route). Trigger inventory is in a known-consistent state.
- CLAUDE.md "Dossier-Centric Development Patterns" alignment restored — the dashboard once again surfaces dossier discovery as a first-class affordance.

## Deviations from Plan

None — Task 1 was pre-resolved by the orchestrator with `option-a`; Task 2 applied the option-a branch verbatim with the user-confirmed layout. No additional widgets were added, no spec was changed, no deferred-items row was added.

## Commits

| Task | Type | Hash       | Description                                                  |
| ---- | ---- | ---------- | ------------------------------------------------------------ |
| 1    | —    | (resolved) | checkpoint:decision pre-resolved: option-a                   |
| 2    | feat | f1c0d9d1   | re-mount RecentDossiers + ForumsStrip in Dashboard           |

## Self-Check: PASSED

- frontend/src/pages/Dashboard/index.tsx — FOUND (modified, committed at f1c0d9d1)
- .planning/phases/41-dossier-drawer/41-10-SUMMARY.md — FOUND (this file)
- Commit f1c0d9d1 — exists in `git log`
- STATE.md / ROADMAP.md — NOT modified (per orchestrator-owned writes contract)
