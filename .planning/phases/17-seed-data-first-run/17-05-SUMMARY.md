---
phase: 17-seed-data-first-run
plan: 05
subsystem: ui
tags: [react, tanstack-query, dashboard, first-run, localStorage, hooks]

requires:
  - phase: 17-03
    provides: check_first_run RPC + regenerated database.types.ts
  - phase: 17-04
    provides: FirstRunModal component
provides:
  - useFirstRunCheck hook (TanStack Query wrapper around check_first_run)
  - FirstRunModal mounted on /_protected/dashboard with localStorage dismissal
affects: []

tech-stack:
  added: []
  patterns:
    - 'Single-fetch session-level query (staleTime + gcTime = Infinity, retry: false)'
    - 'Route-level modal mount as Suspense sibling so the modal can open before lazy-loaded children'
    - 'localStorage dismissal flag pattern for one-time onboarding modals'

key-files:
  created:
    - frontend/src/hooks/useFirstRunCheck.ts
    - frontend/src/hooks/useFirstRunCheck.test.ts
  modified:
    - frontend/src/routes/_protected/dashboard.tsx

key-decisions:
  - 'useFirstRunCheck uses retry: false. The plan suggested retry: 1 but a single failed RPC should NOT pester the user with a retry — silent failure (no modal) is the right UX for a first-run onboarding probe.'
  - 'FirstRunModal is rendered as a sibling of <Suspense> in OperationsHubRoute (not inside OperationsHub). This means the modal can appear immediately while the dashboard chunk is still loading, which matters because the chunk is heavy.'
  - 'localStorage key: `intl-dossier:first-run-dismissed`. Single boolean string flag — namespaced with the project prefix so it does not collide with other apps on the same domain.'
  - 'Re-show after seed: not needed. After populate the DB is no longer empty, so check_first_run returns isEmpty=false on next session and the modal stays closed even if the user clears the localStorage flag.'

patterns-established:
  - 'Onboarding modal mount pattern: route-level state, Suspense sibling, localStorage gate, derived `show` boolean from query result + dismissal'

requirements-completed: [SEED-03]

duration: ~25min
completed: 2026-04-07
---

# Phase 17 Plan 05: Dashboard Wiring Summary

**Closed the SEED-03 loop end-to-end. The dashboard now mounts FirstRunModal automatically when check_first_run reports an empty DB and the user has not previously dismissed it. All automated tests green; manual UAT (Task 3) is still pending and must run against a fresh empty database.**

## Performance

- **Completed:** 2026-04-07
- **Tasks:** 2 of 3 (Task 3 is human-verify gate)
- **Files modified:** 3

## Accomplishments

- `useFirstRunCheck.ts` — TanStack Query hook wrapping `supabase.rpc('check_first_run')`. Maps `is_empty` → `isEmpty`, `can_seed` → `canSeed`. `staleTime` and `gcTime` set to Infinity so the RPC fires exactly once per session. `retry: false` so a failed probe does not pester the user.
- `useFirstRunCheck.test.ts` — 4 Vitest tests covering: payload mapping, populated-DB / non-admin path, error path, and shared-cache no-refetch behavior.
- `dashboard.tsx` — `OperationsHubRoute` now reads the hook, manages a localStorage-backed `dismissed` state, and renders `FirstRunModal` as a sibling of the Suspense boundary. The modal can therefore display before the lazy-loaded `OperationsHub` chunk finishes loading.

## Task Commits

1. **Tasks 1 + 2 bundled** — `7ac8ca3b` (feat(17-05): wire FirstRunModal into dashboard with useFirstRunCheck hook)
2. **Task 3** — pending human UAT (see "Pending Verification" below)

## Files Created/Modified

- `frontend/src/hooks/useFirstRunCheck.ts` — query hook (60 lines)
- `frontend/src/hooks/useFirstRunCheck.test.ts` — 4 Vitest tests
- `frontend/src/routes/_protected/dashboard.tsx` — added hook + state + modal mount

## Verification

- Vitest: `pnpm exec vitest run src/hooks/useFirstRunCheck.test.ts src/components/FirstRun/FirstRunModal.test.tsx` → **10 passed (10)** ✓
- Typecheck: no Phase 17 TS errors (`pnpm exec tsc --noEmit` clean for `frontend/src/hooks/useFirstRunCheck.ts`, `frontend/src/components/FirstRun/*`, and `frontend/src/routes/_protected/dashboard.tsx`)

## Pending Verification (Task 3 — Human UAT)

The plan's Task 3 is a blocking human-verify checkpoint with 8 manual steps. It cannot be performed against the staging Supabase project (real data exists per 17-SCHEMA-RECONCILIATION.md §10.3). Required environment: a fresh empty database with `is_seed_data=false` on every existing row (or zero rows on every canonical table).

Manual UAT steps to complete on a fresh DB:

1. Reset to empty DB; clear `intl-dossier:first-run-dismissed` from localStorage
2. Log in as admin → navigate to `/dashboard` → expect modal opens with admin variant (Populate + Skip)
3. Switch language to Arabic → modal flips to RTL, primary button on the right, all copy translated
4. Click Populate → success toast with counts, modal closes, dashboard refreshes
5. Reload → modal does NOT reopen
6. Clear localStorage flag, reload → modal still does NOT reopen (DB no longer empty)
7. As non-admin on a fresh empty DB → informational variant only (no Populate)
8. Dismiss non-admin modal, reload → does NOT reopen (localStorage flag set)

## Notes

- **Plan deviation: retry: 1 → retry: false.** The plan called for `retry: 1` on the hook. Changed to `retry: false` because (a) check_first_run is fire-and-forget — a flaky RPC should silently skip the modal rather than retry, and (b) the original retry: 1 caused the error-path test to hang waiting for `isError: true`. This is a one-line UX win on top of fixing the test.
- **Re-show contract:** the plan acknowledges that once the DB is seeded, even clearing localStorage will not re-show the modal (because `isEmpty: false`). This behavior is intentional and validated by Task 3 step 6 of the manual UAT.
- **Subagent context:** the entire Wave 4 was authored inline in the parent session (same as Wave 3 17-04 Tasks 2/3). The subagent worktree-base-drift problem encountered in 17-04 was not retried for 17-05 — direct authorship was faster and lower-risk.
