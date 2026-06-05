---
phase: quick-260605-hqn
plan: 01
subsystem: intake
tags: [intake, tanstack-query, cache-invalidation, dead-code]
requires:
  - intakeKeys query-key factory (frontend/src/domains/intake/hooks/useIntakeApi.ts)
provides:
  - Intake queue list nested under the intakeKeys.tickets() prefix
  - useApplyTriage invalidating the tickets() prefix on success
affects:
  - frontend/src/pages/IntakeQueue.tsx
  - frontend/src/domains/intake/hooks/useIntakeApi.ts
  - frontend/src/domains/intake/repositories/intake.repository.ts
tech-stack:
  added: []
  patterns:
    - TanStack Query prefix-match invalidation via a shared query-key factory
key-files:
  created: []
  modified:
    - frontend/src/pages/IntakeQueue.tsx
    - frontend/src/domains/intake/hooks/useIntakeApi.ts
    - frontend/src/domains/intake/repositories/intake.repository.ts
decisions:
  - Re-keyed the queue under intakeKeys.ticketList(filters) instead of adding the queue's
    bespoke ['intake-queue'] key to every mutation — one prefix reaches all five mutations.
  - Converted file-local QueueFilters from interface to type alias so it gains the implicit
    index signature required to satisfy ticketList's Record<string, unknown> param.
metrics:
  duration: ~10m
  completed: 2026-06-05
  tasks: 2
  files: 3
---

# Quick 260605-hqn: Unify intake queue cache + remove dead assignTicket Summary

Re-keyed the intake queue's `useQuery` under the `intakeKeys.tickets()` prefix and added a
`tickets()` invalidation to `useApplyTriage`, so triage/create/convert/merge/close all
auto-refresh the queue by prefix match; also deleted the unused `assignTicket()` repository wrapper.

## What changed

### FIX 1 — Queue cache unification (real bug)

The queue list `useQuery` used a bespoke key `['intake-queue', filters]` that **no mutation
invalidated**, so triaging/creating/converting/merging/closing a ticket left the list stale until a
manual refetch.

- `frontend/src/pages/IntakeQueue.tsx`
  - Imported `intakeKeys` from the `@/hooks/useIntakeApi` shim.
  - Re-keyed the queue `useQuery` from `['intake-queue', filters]` to
    `intakeKeys.ticketList(filters)` → `['intake','tickets','list',filters]`, nesting it under the
    `intakeKeys.tickets()` prefix that the four existing mutations already invalidate.
  - Converted the file-local `QueueFilters` from `interface` to a `type` alias (required so it is
    assignable to `ticketList`'s `Record<string, unknown>` param — interfaces lack the implicit
    index signature). No other `QueueFilters` usage changed.
  - `queryFn`, `staleTime`, `useLastSyncInfo('intake-queue')`, and the empty-state testId were left
    untouched (those strings are not query keys).
- `frontend/src/domains/intake/hooks/useIntakeApi.ts`
  - Added a third invalidation in `useApplyTriage`'s `onSuccess`:
    `void queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() })`, alongside the existing
    `ticket(id)` and `triage(id)` invalidations. File-wide `tickets()`-invalidation count rises from
    4 (create/convert/merge/close) to 5.

### FIX 2 — Dead `assignTicket` wrapper removal

- `frontend/src/domains/intake/repositories/intake.repository.ts`
  - Deleted the unused `export async function assignTicket(...)` wrapper (zero importers in
    `frontend/src`; `useIntakeApi` never imported it).
  - Renamed the now-stale section banner from `Assignment & Conversion` to `Conversion` (only
    `convertTicket` remains there).
  - The backend `intake-tickets-assign` edge function and `backend/tests/contract/assign.test.ts`
    are LIVE and were not touched.

## Verification

- `cd frontend && pnpm type-check` (`tsc --noEmit`) passes clean after each task.
- `grep -nF "intakeKeys.ticketList(filters)" frontend/src/pages/IntakeQueue.tsx` matches (line 133);
  the old `['intake-queue', filters]` literal is gone.
- `grep -A12 "const useApplyTriage =" .../useIntakeApi.ts | grep "intakeKeys.tickets()"` matches.
- `grep -rn "assignTicket" frontend/src` returns nothing; `convertTicket` and all other repository
  functions intact.
- Each commit passed the pre-commit `pnpm build` hook (no `--no-verify`).

## Deviations from Plan

None — plan executed exactly as written. (lint-staged/prettier re-flowed `findDuplicates`'s
signature onto one line during the Task 2 commit; cosmetic, in-scope for the touched file.)

## Commits

| Task | Description                                 | Commit     |
| ---- | ------------------------------------------- | ---------- |
| 1    | Unify intake queue cache invalidation       | `a6168d27` |
| 2    | Remove dead assignTicket repository wrapper | `5684099e` |

## Self-Check: PASSED

- FOUND: frontend/src/pages/IntakeQueue.tsx (modified, committed)
- FOUND: frontend/src/domains/intake/hooks/useIntakeApi.ts (modified, committed)
- FOUND: frontend/src/domains/intake/repositories/intake.repository.ts (modified, committed)
- FOUND commit: a6168d27
- FOUND commit: 5684099e
