---
phase: 45-schema-seed-closure
plan: 02
subsystem: dashboard-ui
tags: [dashboard, digest, tanstack-query, supabase, i18n, tdd]
dependency_graph:
  requires:
    - 45-01 intelligence_digest schema, RLS, and deterministic seed data
  provides:
    - Typed useIntelligenceDigest hook for dashboard digest reads
    - Digest widget render path backed by intelligence_digest.source_publication
    - Digest-specific English and Arabic widget copy
  affects:
    - DATA-02
    - 45-03-vip-iso-closure
tech_stack:
  added: []
  patterns:
    - TanStack Query hook over direct Supabase table reads
    - Source-guard widget tests for prohibited legacy dependencies
key_files:
  created:
    - frontend/src/hooks/useIntelligenceDigest.ts
    - frontend/src/hooks/__tests__/useIntelligenceDigest.test.ts
  modified:
    - frontend/src/pages/Dashboard/widgets/Digest.tsx
    - frontend/src/pages/Dashboard/widgets/__tests__/Digest.test.tsx
    - frontend/src/i18n/en/dashboard-widgets.json
    - frontend/src/i18n/ar/dashboard-widgets.json
decisions:
  - Use a focused useIntelligenceDigest hook instead of adapting useActivityFeed so the widget cannot leak actor_name.
  - Preserve the existing Digest widget structure, skeleton, spinner overlay, and refresh affordance while changing only the data source.
  - Limit dashboard-widgets i18n edits to digest keys so later Phase 45 widget plans can own their copy changes.
metrics:
  started: 2026-05-07T21:30:13Z
  completed: 2026-05-07T21:40:03Z
  duration: 10m
  tasks_completed: 2
  requirements_completed: [DATA-02]
---

# Phase 45 Plan 02: Digest Widget Closure Summary

Typed intelligence digest hook with publication-source rendering for the Dashboard Digest widget.

## Objective

Replace the Phase 38 Digest source compromise with a typed `useIntelligenceDigest` hook and render publication names from `source_publication`, while preserving the existing widget layout, loading state, and refresh behavior.

## Completed Tasks

| Task           | Name                                 | Commit   | Result                                                                                                                                                                                                |
| -------------- | ------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 45-02-01 RED   | Add failing digest hook tests        | 061c8cae | Added hook contract tests before implementation; RED failed because `../useIntelligenceDigest` did not exist.                                                                                         |
| 45-02-01 GREEN | Add typed useIntelligenceDigest hook | f805340b | Implemented typed TanStack Query hook over `intelligence_digest`, including source publication selection, descending occurrence ordering, default limit 6, cache timing, and Supabase error wrapping. |
| 45-02-02       | Rewire Digest widget and copy        | 6b8ec3e3 | Digest now imports `useIntelligenceDigest`, maps `source_publication`, removes `useActivityFeed` render-path dependency, updates tests, and limits i18n changes to digest keys.                       |

## Verification

| Command                                                                                                                                    | Result                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `pnpm -C frontend exec vitest run src/hooks/__tests__/useIntelligenceDigest.test.ts src/pages/Dashboard/widgets/__tests__/Digest.test.tsx` | Passed: 2 files, 9 tests.                                          |
| `rg "useIntelligenceDigest" frontend/src/pages/Dashboard/widgets/Digest.tsx`                                                               | Passed: widget imports and calls the hook.                         |
| `rg "source_publication" frontend/src/pages/Dashboard/widgets/Digest.tsx frontend/src/hooks/useIntelligenceDigest.ts`                      | Passed: hook selects the column and widget maps it to source text. |
| `rg "actor_name\|useActivityFeed" frontend/src/pages/Dashboard/widgets/Digest.tsx frontend/src/hooks/useIntelligenceDigest.ts`             | Passed: no matches.                                                |
| `pnpm -C frontend exec eslint src/pages/Dashboard/widgets/__tests__/Digest.test.tsx src/pages/Dashboard/widgets/Digest.tsx --fix`          | Passed after resolving the touched test-title lint issue.          |

## TDD Evidence

- RED: `pnpm -C frontend exec vitest run src/hooks/__tests__/useIntelligenceDigest.test.ts` failed before implementation because the hook module was missing. Commit: `061c8cae`.
- GREEN: the focused hook test passed after adding `useIntelligenceDigest`. Commit: `f805340b`.
- Integration verification: the hook and Digest widget tests pass together after the widget rewire. Commit: `6b8ec3e3`.

## Decisions Made

- The Digest widget now consumes a dedicated digest hook rather than adapting `useActivityFeed`; this satisfies the internal username leakage threat mitigation by removing `actor_name` from the render path.
- The widget keeps its existing card structure, `WidgetSkeleton`, `GlobeSpinner`, `.digest-overlay`, `Button`, and `.digest-*` class structure.
- English and Arabic copy updates were constrained to `digest` keys in `dashboard-widgets.json`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed forbidden physical RTL class-name wording from a touched test title**

- **Found during:** Task 45-02-02 commit hook.
- **Issue:** The lint hook flagged the modified Digest widget test because a test title mentioned physical class-name prefixes.
- **Fix:** Renamed the test title to describe RTL-safe logical classes without forbidden literal class-name text.
- **Files modified:** `frontend/src/pages/Dashboard/widgets/__tests__/Digest.test.tsx`
- **Commit:** `6b8ec3e3`

## Known Stubs

None. Stub-pattern scanning found only nullable database-field checks and a test helper default; neither is UI placeholder data or unfinished functionality.

## Threat Notes

- T-45-04 mitigated: Digest render-path files no longer reference `actor_name` or `useActivityFeed`.
- T-45-05 remains owned by Plan 45-01 RLS; this plan added no new network endpoint, auth path, file-access trust boundary, or schema change.

## Requirements Satisfied

- DATA-02: Digest reads `intelligence_digest` through a typed hook and renders publication source names instead of internal actor names.

## Self-Check: PASSED

- Verified all created and modified plan-owned files exist.
- Verified task commits exist: `061c8cae`, `f805340b`, `6b8ec3e3`.
- Verified `.planning/STATE.md`, `.planning/ROADMAP.md`, and `.planning/REQUIREMENTS.md` are not modified by this plan.
