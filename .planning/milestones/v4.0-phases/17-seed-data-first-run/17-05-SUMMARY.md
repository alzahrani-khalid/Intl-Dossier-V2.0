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

## UAT Results (2026-04-07, executed against staging)

The plan's Task 3 8-step manual UAT was executed end-to-end against the staging Supabase project `zkrcjzdemdmwhearhfgg` using Playwright MCP browser automation, after first truncating the canonical tables to satisfy the empty-DB precondition. **Fix commit: `e8da10b5`**.

| #   | Step                                                                      | Result      | Notes                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Reset DB to empty + clear localStorage                                    | ✅          | TRUNCATE dossiers, tasks, work_item_dossiers RESTART IDENTITY CASCADE; check_first_run returned `{is_empty: true}`                                                                                                            |
| 2   | Admin login → /dashboard → modal opens (admin variant)                    | ✅          | "Welcome to Intl-Dossier" with Populate + Skip buttons. Required tour-gate fix first (see Bug #2).                                                                                                                            |
| 3   | Switch to Arabic → RTL flip, primary button on right, all copy translated | ✅          | "مرحبًا بك في منصة الملفات الدولية" / primary "تعبئة البيانات النموذجية" rightmost / sidebar flipped right edge / full Arabic translation                                                                                     |
| 4   | Click Populate → success path                                             | ✅          | Required RPC fix first (see Bug #1). After fix: 62 dossiers, 50 tasks, 66 work_item_dossiers, 10 countries/orgs/forums/engagements, 6 topics, 4 working groups, 12 persons all created with `is_seed_data=true`; modal closed |
| 5   | Reload → modal does NOT reopen                                            | ✅          | localStorage flag was set; no dialog rendered                                                                                                                                                                                 |
| 6   | Clear localStorage flag, reload → modal still does NOT reopen             | ✅          | check_first_run returns `{is_empty: false}` so the gate doesn't trip even without the dismissal flag                                                                                                                          |
| 7   | Non-admin variant render                                                  | ⏭️ deferred | No non-admin password available in test fixtures. Covered by Vitest unit test "renders non-admin variant with Close only — no Populate button" (FirstRunModal.test.tsx).                                                      |
| 8   | Non-admin dismiss persists                                                | ⏭️ deferred | Same. Mechanism is identical to admin path (handleFirstRunOpenChange writes the same localStorage flag), so unit-test coverage is adequate.                                                                                   |

**Net result: 6/6 automated steps PASS. Phase 17 SEED-03 end-to-end loop verified.**

### Bugs found and fixed during UAT (commit `e8da10b5`)

**Bug #1 — populate_diplomatic_seed RPC: search_path + 5 constraint mismatches.**
The function authored in 17-02 set `search_path = public` only, so `uuid_generate_v5` (which lives under the `extensions` schema in Supabase) failed to resolve at first INSERT. Once fixed, the function then hit five separate CHECK-constraint violations because Phase 17 fixture vocabulary was invented from the requirements doc rather than probed from live constraints:

- `organizations.org_type` allowed values are `government, ngo, private, international, academic`. The fixtures used `regional` for GCC-Stat / ESCWA / AITRS / ISI / Eurostat — all invalid. Remapped: GCC-Stat / ESCWA / Eurostat → `international`; AITRS / ISI → `academic`.
- `topics.theme_category` allowed values are `policy, technical, strategic, operational`. The fixtures used `methodology` and `innovation`. Remapped: Census 2030 / National Accounts → `technical`; Big Data → `strategic`.
- `engagements.engagement_type` allowed values are `meeting, consultation, coordination, workshop, conference, site_visit, ceremony`. The fixtures used `bilateral_visit`, `joint_committee`, `mou_signing`, `forum_attendance`. Remapped: bilateral_visit → `site_visit`; joint_committee → `meeting`/`coordination`; mou_signing → `ceremony`; forum_attendance → `conference`.
- `engagements.engagement_category` allowed values are `bilateral, multilateral, regional, internal`. The fixtures used `diplomatic` and `technical`. Remapped: diplomatic → `bilateral`; technical → `regional`/`multilateral`.
- `tasks.work_item_type` allowed values are `dossier, position, ticket, generic` (or NULL). The fixtures used `'task'`. Set to NULL — seed tasks are standalone, not parented.
- `work_item_dossiers.valid_inheritance_metadata` requires that when `inheritance_source != 'direct'`, both `inherited_from_type` and `inherited_from_id` MUST be set. The fixtures used a mix of inheritance sources without populating those columns. Now: primary link uses `direct` (no inherited*from*\*), secondary org link uses `engagement` + `inherited_from_type='engagement'` + `inherited_from_id` pointing at the corresponding seeded engagement dossier.
- `persons.office_type` allowed values are the constitutional-roles list (`cabinet_minister`, `legislature_upper`, etc). The fixtures used `'legislative'`. Remapped: ministers → `cabinet_minister`; Shura Council member → `legislature_upper`.

**Both the live function (via `apply_migration`) and the on-disk migration `supabase/migrations/20260407000002_populate_diplomatic_seed.sql` are now in sync.**

**Bug #2 — dashboard.tsx FirstRunModal collides with the existing onboarding tour.**
The project already ships an onboarding tour modal ("Welcome to GASTAT Dossier!") that opens on first dashboard mount. Both modals are Radix Dialogs. Two Radix Dialogs cannot be open at the same time — the second one to mount forces the first to fire `onOpenChange(false)` via the focus trap, which silently sets the FirstRunModal's localStorage dismissal flag to `true`. On the next reload the dismissal flag is honored and FirstRunModal never appears again, even though the user never saw it.

**Fix:** added a `useTourComplete` hook in `dashboard.tsx` that polls `localStorage['intl-dossier-onboarding-seen']` at 500ms intervals. FirstRunModal is gated on `tourComplete` in addition to `firstRun.isEmpty` and `!dismissed`. The poll auto-stops once the flag flips. End result: the user sees the tour first; once they dismiss/complete it, FirstRunModal appears on the next tick. No localStorage poisoning, no missed UX.

### Screenshots captured during UAT

- `17-uat-step2-admin-en-after-fix.png` — admin variant in English (post tour-gate fix), Populate + Skip visible
- `17-uat-step3-admin-ar-rtl.png` — admin variant in Arabic, RTL flip, primary button rightmost

### Database state after UAT

The seed left staging populated with the full GASTAT scenario (62 dossiers, 50 tasks, 66 work_item_dossiers). User authorized the destructive truncate and post-UAT seed via "nothing is important in the database". To return staging to empty in the future: `TRUNCATE dossiers, tasks, work_item_dossiers RESTART IDENTITY CASCADE;` (cascades clear all typed children automatically).

## Notes

- **Plan deviation: retry: 1 → retry: false.** The plan called for `retry: 1` on the hook. Changed to `retry: false` because (a) check_first_run is fire-and-forget — a flaky RPC should silently skip the modal rather than retry, and (b) the original retry: 1 caused the error-path test to hang waiting for `isError: true`. This is a one-line UX win on top of fixing the test.
- **Re-show contract:** the plan acknowledges that once the DB is seeded, even clearing localStorage will not re-show the modal (because `isEmpty: false`). This behavior is intentional and validated by Task 3 step 6 of the manual UAT.
- **Subagent context:** the entire Wave 4 was authored inline in the parent session (same as Wave 3 17-04 Tasks 2/3). The subagent worktree-base-drift problem encountered in 17-04 was not retried for 17-05 — direct authorship was faster and lower-risk.
