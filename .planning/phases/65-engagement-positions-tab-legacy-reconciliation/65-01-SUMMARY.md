---
phase: 65-engagement-positions-tab-legacy-reconciliation
plan: 01
subsystem: engagement-workspace
tags: [positions, tab-nav, i18n, routing, tdd]
requires:
  - DossierPositionsTab (shipped Phase 64 component, reused verbatim)
  - position_dossier_links (staging table + clearance SELECT/INSERT RLS, migration 20260610000002)
provides:
  - routed engagement workspace Positions tab on the canonical data plane
  - WORKSPACE_TABS positions nav entry (between context and tasks)
  - workspace.json en+ar key set for the whole phase (tabs.positions + calendar.* reader keys + UI-SPEC copy updates)
affects:
  - frontend/src/routeTree.gen.ts (new route id)
  - downstream phase 65-05 (consumes the calendar.* reader keys added here)
tech-stack:
  added: []
  patterns:
    - route-file-direct lazy tab render (countries-route precedent)
    - colon-form i18n key parity gated by unit test (Pitfall 7)
key-files:
  created:
    - frontend/src/routes/_protected/engagements/$engagementId/positions.tsx
    - frontend/src/components/positions/__tests__/EngagementPositionsTab.test.tsx
  modified:
    - frontend/src/routeTree.gen.ts
    - frontend/src/components/workspace/WorkspaceTabNav.tsx
    - frontend/src/i18n/en/workspace.json
    - frontend/src/i18n/ar/workspace.json
decisions:
  - 'ENGPOS-01: canonical positions source for an engagement = position_dossier_links keyed by dossier_id = engagementId (engagementId IS a dossiers.id). Legacy engagement_positions (0 rows, write-deny RLS, no migration provenance) and the engagements-positions-* edges are deprecated — never read or written by new code.'
  - 'Tab body reuses DossierPositionsTab verbatim with dossierId={engagementId}; attach-existing keeps default link_type related_to and create-new keeps applies_to (Phase 64 D-09 posture carried).'
  - 'Plan 01 is the single owner of ALL workspace.json edits this phase; the calendar.* reader keys are added here even though their consumer ships in plan 65-05 (keeps wave-1 plans file-disjoint).'
metrics:
  duration_minutes: 12
  completed_date: 2026-06-12
  tasks_completed: 2
  files_changed: 6
---

# Phase 65 Plan 01: Engagement Positions Tab Mount Summary

Mounted a routed, navigable engagement-workspace Positions tab on the canonical `position_dossier_links` plane by reusing the shipped `DossierPositionsTab` with `dossierId = engagementId`, added one `WORKSPACE_TABS` nav entry between Context and Tasks, recorded the ENGPOS-01 canonical-source decision in the route-file header, and landed the phase's full bilingual workspace.json key set in a single commit — all pinned by a Wave-0 unit suite (TDD RED → GREEN).

## What Was Built

- **Route** `frontend/src/routes/_protected/engagements/$engagementId/positions.tsx` — lazy `DossierPositionsTab` under `Suspense` + `TabSkeleton type="list"`, param `engagementId`, with the ENGPOS-01 decision header comment. Route id registered in the regenerated `routeTree.gen.ts`.
- **Nav** `WORKSPACE_TABS` gains `{ key: 'positions', labelKey: 'tabs.positions', path: 'positions' }` placed after `context`, before `tasks` (UI-SPEC A-1). No style/RTL/scroll-snap changes — all inherited.
- **i18n** `frontend/src/i18n/{en,ar}/workspace.json` — new `tabs.positions` (EN "Positions" / AR "المواقف"), new `calendar.{scheduledEvents,entriesEmpty,entriesError}`, and the UI-SPEC sentence-case / drop-"+" copy updates to `actions.{createTask,addEvent}` (EN only — AR unchanged per contract) and `empty.{tasks,calendar,docs,context}` bodies/actions. Orphaned keys (`actions.transitionStage`, `actions.linkDossier`, `empty.context.action`, `docs.upload`) intentionally NOT removed (UI-SPEC marks the sweep optional; wave-1 plans stay decoupled).
- **Tests** `EngagementPositionsTab.test.tsx` — 6 cases: ENGPOS-01 nav-entry placement + en/ar key parity (incl. AR == "المواقف"); ENGPOS-02 reader-id pin + onAttach persist/invalidate/partial-toast contract against an engagement-shaped uuid.

## ENGPOS-01 Decision (verbatim, for the phase roll-up)

> The canonical positions source for an engagement is `position_dossier_links` keyed by `dossier_id = engagementId` — an engagement's `engagementId` IS a `dossiers.id`. The legacy `engagement_positions` table (0 rows, write-deny RLS, no migration provenance) and the `engagements-positions-*` edges are deprecated and are never read or written by new code. Recorded in the route-file header comment and this plan's frontmatter.

## TDD Gate Compliance

- `test(65-01)` commit `c7e8bd21` — RED: nav entry + i18n parity failing (3 fail), ENGPOS-02 attach pins passing (3 pass) as designed (regression pins).
- `feat(65-01)` commit `d3b72831` — GREEN: all 6 tests pass.
- Gate sequence (test → feat) present in git log. No REFACTOR commit needed.

## Verification Run

- `vitest run EngagementPositionsTab.test.tsx` → 6 passed.
- `tsc --noEmit` (frontend `pnpm type-check`) → exit 0.
- `pnpm build` regenerated `routeTree.gen.ts` with `/engagements/$engagementId/positions` (verified via fixed-string grep + import line).
- i18n parity python assertion (plan verify) → `I18N_OK`.

## Deviations from Plan

None — plan executed exactly as written. No auto-fixes (Rules 1-3) triggered; no architectural decisions (Rule 4) surfaced; no auth gates. The plan's interface block matched the live component/route contracts (export paths, `onAttach` signature, query-key prefix) on first read.

## Threat Surface

No new security-relevant surface. The tab reads via the existing clearance-gated `position_dossier_links` SELECT policy (migration 20260610000002) and writes attach links through the existing `createPositionDossierLink` path under clearance INSERT RLS — no service-role client, no RLS changes, no new endpoints (T-65-01/-02/-03 mitigated by reuse + decision header, per the plan threat model). No package installs.

## Known Stubs

None. The `calendar.*` reader keys added here have no consumer until plan 65-05 ships the CalendarTab "Scheduled events" reader — this is intentional and documented (plan 01 is the single owner of workspace.json this phase). The keys are inert data, not a rendering stub.

## Self-Check: PASSED

- FOUND: frontend/src/routes/\_protected/engagements/$engagementId/positions.tsx
- FOUND: frontend/src/components/positions/**tests**/EngagementPositionsTab.test.tsx
- FOUND commit c7e8bd21 (test, RED)
- FOUND commit d3b72831 (feat, GREEN)
