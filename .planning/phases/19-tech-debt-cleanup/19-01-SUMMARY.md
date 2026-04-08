---
phase: 19-tech-debt-cleanup
plan: 01
subsystem: frontend/router
tags: [debt, router, type-safety, tests]
requires: []
provides: [typed-engagement-nav, ops07-no-string-nav-verified]
affects: [OPS-03, OPS-07]
key-files:
  created:
    - frontend/src/pages/Dashboard/components/__tests__/EngagementStageGroup.test.tsx
  modified:
    - frontend/src/pages/Dashboard/components/EngagementStageGroup.tsx
    - frontend/src/pages/Dashboard/components/ActionBar.tsx
decisions:
  - 'Inline typed navigate() at 2 callsites; no buildDashboardRoute() helper (overhead > value at N=2)'
metrics:
  duration: ~10m
  completed: 2026-04-08
requirements: [DEBT-01]
---

# Phase 19 Plan 01: Typed Router Navigation Summary

Replaced the two string-template `navigate({ to: \`/engagements/${id}\` })`callsites in`EngagementStageGroup.tsx`with TanStack Router typed`to`/`params`form, added 4 RTL unit tests (click + Enter + Space + negative key), and documented`ActionBar.tsx` as intentionally containing zero router navigations.

## What Was Built

- **Task 1 (RED):** New Vitest file `EngagementStageGroup.test.tsx` mocks `useNavigate` and asserts the exact typed navigation object shape. Initially 3/4 tests failed (the negative-key test passed at RED, as expected). Commit `4b30b2bf`.
- **Task 2 (GREEN):** Both `onClick` and `onKeyDown` handlers in `EngagementStageGroup.tsx` now call `navigate({ to: '/engagements/$engagementId', params: { engagementId: engagement.id } })`. All 4 tests green. Commit `c63f8f96`.
- **Task 3:** Added a verification comment block above `ActionBar` documenting that "New Engagement / New Request" use `useWorkCreation().openPalette(...)` and "Cmd+K" dispatches a synthetic keyboard event — neither is a router navigation. Commit `b75d5570`.

## Verification

| Check                                                           | Result                                          |
| --------------------------------------------------------------- | ----------------------------------------------- |
| `pnpm test EngagementStageGroup --run`                          | 4/4 passed                                      |
| `tsc --noEmit` for `EngagementStageGroup.tsx` / `ActionBar.tsx` | clean (zero errors in scope)                    |
| grep `/engagements/\${` in EngagementStageGroup.tsx             | 0 hits                                          |
| grep `navigate(` in ActionBar.tsx                               | 0 real callsites (only the documenting comment) |

Note: `tsc --noEmit` reports unrelated pre-existing TS6133/TS6196 errors in `types/*` and `utils/*` — out of scope per Rule (scope boundary).

## Deviations from Plan

None — plan executed exactly as written. Linter (Prettier) reformatted both touched files to single-line `const greetingText` / `visibleEngagements` expressions; no behavioral change.

## Self-Check: PASSED

- Created file exists: `frontend/src/pages/Dashboard/components/__tests__/EngagementStageGroup.test.tsx` — FOUND
- Commit `4b30b2bf` — FOUND
- Commit `c63f8f96` — FOUND
- Commit `b75d5570` — FOUND
