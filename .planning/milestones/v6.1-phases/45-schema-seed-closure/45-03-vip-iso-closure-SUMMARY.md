---
phase: 45-schema-seed-closure
plan: 03
plan_name: vip-iso-closure
subsystem: database-dashboard-ui
tags:
  - schema
  - seed-closure
  - dashboard
  - vip-visits
  - tdd
requirements:
  - DATA-03
dependency_graph:
  requires:
    - 45-02-digest-widget-closure
  provides:
    - additive person metadata fields in get_upcoming_events
    - VIP visit country glyph rendering from person ISO data
  affects:
    - supabase get_upcoming_events RPC
    - operations hub TimelineEvent contract
    - VIP visits dashboard hook and widget
tech_stack:
  added: []
  patterns:
    - Supabase SECURITY DEFINER RPC migration
    - nullable RPC metadata projection
    - Vitest RED/GREEN hook and widget coverage
key_files:
  created:
    - supabase/migrations/20260507211000_phase45_vip_iso_events.sql
  modified:
    - frontend/src/domains/operations-hub/types/operations-hub.types.ts
    - frontend/src/hooks/useVipVisits.ts
    - frontend/src/hooks/__tests__/useVipVisits.test.ts
    - frontend/src/pages/Dashboard/widgets/VipVisits.tsx
    - frontend/src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx
    - frontend/src/i18n/en/dashboard-widgets.json
    - frontend/src/i18n/ar/dashboard-widgets.json
decisions:
  - Keep VIP visit detection person-driven with legacy vip_visit fallback only.
  - Render VIP person countries through DossierGlyph country glyphs using person_iso.
  - Recreate get_upcoming_events in migration because PostgreSQL cannot replace a changed RETURNS TABLE shape in place.
metrics:
  started_at: 2026-05-07T21:43:26Z
  completed_at: 2026-05-07T21:51:47Z
  duration: 8m 21s
  tasks_completed: 3
  task_commits: 5
---

# Phase 45 Plan 03: VIP ISO Closure Summary

VIP visits now flow from person metadata in `get_upcoming_events` through the operations hub hook into the dashboard widget, where the displayed VIP person can render a country glyph from ISO data. The migration is additive at the RPC result level and does not add `vip_visit` enum or check values.

## Tasks Completed

| Task                                | Result                                                                                                                                                                                        | Commit                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 45-03-01 SQL migration              | Added nullable `person_id`, `person_name`, `person_name_ar`, `person_role`, and `person_iso` fields to `get_upcoming_events`; sourced ISO from nationality with represented-country fallback. | `0d2b2596`             |
| 45-03-02 Hook tests and mapping     | Added failing hook coverage, then mapped person metadata to `VipVisit` while preserving legacy `vip_visit` fallback.                                                                          | `5ba07fa1`, `59341853` |
| 45-03-03 Widget tests and rendering | Added failing widget coverage, then rendered `DossierGlyph type="country"` with `iso={visit.personFlag}` and localized VIP copy.                                                              | `b91e3958`, `fdb85ead` |

## TDD Evidence

| Gate         | Command                                                                                                                              | Result                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Hook RED     | `pnpm -C frontend exec vitest run src/hooks/__tests__/useVipVisits.test.ts`                                                          | Failed as expected: person-backed official visit was filtered out and mapping still used event title. |
| Hook GREEN   | `pnpm -C frontend exec vitest run src/hooks/__tests__/useVipVisits.test.ts`                                                          | Passed: 8 tests.                                                                                      |
| Widget RED   | `pnpm -C frontend exec vitest run src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx`                                          | Failed as expected: glyph type was still `person`, and VIP-specific empty/error copy was absent.      |
| Widget GREEN | `pnpm -C frontend exec vitest run src/hooks/__tests__/useVipVisits.test.ts src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx` | Passed: 19 tests across 2 files.                                                                      |

## Verification

| Check                                | Result                                                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Focused hook and widget tests        | Passed: 2 files, 19 tests.                                                                               |
| Migration projects person ISO fields | `person_iso TEXT`, `LEFT JOIN LATERAL`, `nationality.iso_code_2`, and `represented.iso_code_2` verified. |
| No VIP enum/check additions          | Verified no `CHECK.*vip_visit`, `ADD VALUE.*vip_visit`, or `ALTER TYPE.*vip_visit` in the migration.     |
| Hook data contract                   | `TimelineEvent.person_iso` and `VipVisit.personFlag` verified.                                           |
| Widget glyph rendering               | `DossierGlyph type="country"` and `iso={visit.personFlag}` verified.                                     |
| Shared tracking files                | No `.planning/STATE.md`, `.planning/ROADMAP.md`, or `.planning/REQUIREMENTS.md` changes made.            |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Recreated get_upcoming_events before replacing return shape**

- **Found during:** Task 45-03-01
- **Issue:** PostgreSQL cannot change a function's `RETURNS TABLE` columns with `CREATE OR REPLACE FUNCTION` alone.
- **Fix:** Added `DROP FUNCTION IF EXISTS get_upcoming_events(UUID, INTEGER);` before recreating the `SECURITY DEFINER` RPC, then restored the authenticated execute grant.
- **Files modified:** `supabase/migrations/20260507211000_phase45_vip_iso_events.sql`
- **Commit:** `0d2b2596`

## Auth Gates

None.

## Known Stubs

None. Stub-pattern scanning found no placeholder UI/data stubs in plan-owned files.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/45-schema-seed-closure/45-03-vip-iso-closure-SUMMARY.md`.
- Task commits verified: `0d2b2596`, `5ba07fa1`, `59341853`, `b91e3958`, `fdb85ead`.
- Shared tracking files remain untouched: `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`.
