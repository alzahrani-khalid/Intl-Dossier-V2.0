---
phase: 66-overview-error-contract-timeline-cross-links
plan: 06
subsystem: ui
tags: [dossier-drawer, error-states, i18n, overview]

requires:
  - phase: 66-overview-error-contract-timeline-cross-links
    provides: 66-01 fail-the-query service contract
provides:
  - DossierDrawer error branch (kills the permanent-skeleton dishonest mode) with Retry
  - DrawerHead em-dash fallback instead of empty strings on missing data
  - Raw PostgREST error.message renders removed (generic localized copy only)
affects: [66-08, verify-work]

tech-stack:
  added: []
  patterns: [drawer error branch reusing dormant bilingual error.* keys]

key-files:
  modified:
    - frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx
    - frontend/src/components/dossier/DossierDrawer/DrawerHead.tsx
    - frontend/src/components/dossier/DossierDrawer/__tests__/DossierDrawer.test.tsx
    - frontend/src/components/dossier/DossierActivityTimeline.tsx
    - frontend/src/components/dossier/dossier-overview/DossierOverview.tsx
    - frontend/src/i18n/en/dossier-overview.json

key-decisions:
  - 'Drawer error branch reuses the dormant bilingual dossier-drawer:error.load_failed_*/retry keys — zero new drawer translation work (UI-SPEC verified claim)'
  - 'Only en/dossier-overview.json needed the raw-message fix; the AR string was already generic (parity verified post-merge)'

patterns-established:
  - 'Error branch precedence in drawers: loading skeleton → error (with Retry) → data; never an unresolvable skeleton'

requirements-completed: [OVRERR-01]

duration: 9min
completed: 2026-06-13
---

# Phase 66 Plan 06: Drawer error branch + raw-message removal Summary

**The DossierDrawer now renders an explicit bilingual error branch with Retry instead of a permanent skeleton, DrawerHead falls back to em-dashes, and no surface renders raw PostgREST error.message text.**

## Orchestrator note (agent failure recovery)

The executor agent completed ALL THREE task commits, then died on an API socket error before writing this SUMMARY. The orchestrator verified the work post-merge (spot-check protocol): commits `12e43ada` (RED tests), `44cda1b0` (drawer branch GREEN), `1a537339` (raw-message fix) all present; 87/87 drawer-suite tests pass; `tsc --noEmit` exit 0; EN↔AR dossier-overview.json parity confirmed. This SUMMARY was written by the orchestrator from the verified commit contents.

## What shipped

1. **Drawer error branch (Task 1+2):** `DossierDrawer.tsx` renders heading + body + Retry (via `refetch`) from the dormant `dossier-drawer:error.*` keys when the overview query errors — replacing the previous unresolvable `data-loading` skeleton. 108 lines of new RED-first tests.
2. **DrawerHead fallback:** missing name/type fields render `—` instead of empty strings.
3. **Raw-message removal (Task 3, Pitfall 9):** `DossierOverview.tsx` and `DossierActivityTimeline.tsx` no longer interpolate `error?.message`; `en/dossier-overview.json` string made generic (AR was already generic).

## Verification

- Drawer suite: 87/87 passed (post-merge re-run by orchestrator)
- `pnpm type-check`: exit 0
- EN↔AR key parity: zero diffs
- TDD gate: `test(66-06)` commit precedes `feat(66-06)` in history

## Self-Check: PASSED (orchestrator-verified)
