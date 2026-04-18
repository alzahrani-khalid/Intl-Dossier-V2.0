---
phase: 31-creation-hub-cleanup
plan: 03
subsystem: dossier-creation-routing
tags: [frontend, routing, fab, empty-states, rtl, ux-04]
requirements: [UX-04]
status: complete
verdict: PASS
completed: 2026-04-18
duration_minutes: 35
---

# Phase 31 Plan 03: Context-Aware Creation Routing Summary

Repoints every dossier-creation call site to its correct UX-04 target:
typed list routes route context-direct to the per-type wizard (D-07 + D-09);
dashboard / tasks / typeless contexts fall back to the stateless hub (D-05 + D-08).
Adds optional `targetType` props to the two shared empty-state components so
typed consumers can opt into direct routing without boilerplate.

## Files Modified

| Role      | Path                                                                         | Change                                                                                                                                                                                                               |
| --------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hook      | `frontend/src/hooks/useContextAwareFAB.ts`                                   | Added `TYPED_LIST_TO_WIZARD` lookup (8 entries) + threaded `currentRoute` into `handleCreateDossier` — hub fallback preserved for non-typed routes.                                                                  |
| page      | `frontend/src/pages/dossiers/DossierListPage.tsx`                            | `list.createNew` CTA is now type-aware (direct per-type wizard when `filters.type` is set, hub otherwise); lines 892/904 (search suggestion + sample-data empty state) intentionally remain on hub — annotated D-08. |
| page      | `frontend/src/pages/engagements/EngagementsListPage.tsx`                     | `handleCreateEngagement` → `/dossiers/engagements/create` (D-07).                                                                                                                                                    |
| component | `frontend/src/components/elected-officials/ElectedOfficialListTable.tsx`     | Empty-state Link → `/dossiers/elected-officials/create` (D-07).                                                                                                                                                      |
| component | `frontend/src/components/empty-states/TourableEmptyState.tsx`                | New optional `targetType?: DossierType` prop; precedence: `onCreate` → `targetType` → no-op. Uses `getDossierRouteSegment`.                                                                                          |
| component | `frontend/src/components/progressive-disclosure/ProgressiveEmptyState.tsx`   | New optional `targetType` prop wired via `handlePrimaryAction` — caller `onClick` wins, otherwise `targetType` → per-type wizard, else hub.                                                                          |
| component | `frontend/src/components/dossier/sections/MeetingSchedule.tsx`               | Stripped dead `search={{ type, parentForumId }}` params on both call sites (D-05 hub is stateless); Link targets stay on `/dossiers/create` per D-08.                                                                |
| types     | `frontend/src/types/progressive-disclosure.types.ts`                         | Extended `ProgressiveEmptyStateProps` with `targetType?: DossierType` (inline union to avoid coupling the shared type file to `@/services/dossier-api`).                                                             |
| test      | `frontend/src/hooks/__tests__/useContextAwareFAB.test.ts`                    | NEW — 14 cases: 8 typed-route direct mappings + 5 hub fallbacks + 1 callback-wins.                                                                                                                                   |
| test      | `frontend/src/components/empty-states/__tests__/TourableEmptyState.test.tsx` | NEW — 4 cases: country+elected-official typed routing, `onCreate` precedence, no-handler case.                                                                                                                       |

## FAB Typed-Route Lookup — final paths used

Verified against actual filesystem at `frontend/src/routes/_protected/dossiers/`:

```typescript
const TYPED_LIST_TO_WIZARD: Record<string, string> = {
  '/dossiers/countries': '/dossiers/countries/create',
  '/dossiers/organizations': '/dossiers/organizations/create',
  '/dossiers/forums': '/dossiers/forums/create',
  '/dossiers/engagements': '/dossiers/engagements/create',
  '/dossiers/topics': '/dossiers/topics/create',
  '/dossiers/working_groups': '/dossiers/working_groups/create', // ← UNDERSCORE (verified)
  '/dossiers/persons': '/dossiers/persons/create',
  '/dossiers/elected-officials': '/dossiers/elected-officials/create', // ← HYPHEN (verified)
}
```

Segment source of truth: `@/lib/dossier-routes.getDossierRouteSegment`.

## Empty-State Prop Additions

Both `TourableEmptyState` and `ProgressiveEmptyState` accept `targetType?: DossierType`.
Resolution order (both components):

1. caller-supplied `onCreate` / `primaryAction.onClick` → invoked verbatim.
2. else `targetType` present → `navigate({ to: `/dossiers/${segment}/create` })`.
3. else → hub (`/dossiers/create`) _or_ (for `TourableEmptyState`) no primary-action button.

This preserves 100% of existing call-site behavior (all current callers pass `onCreate` explicitly or omit it entirely).

## MeetingSchedule Search-Param Strip

Both `<Link>` call sites (lines 57 and 107 originally) dropped the
`search={{ type: 'engagement', parentForumId: dossier.id } as any}` payload.
The hub ignores search params (D-05). No runtime behavior change — cleaner URL.
Also removed an `as any` cast as a side benefit.

## Command Palette Audit

Grep of `frontend/src/` for `/dossiers/create` references — only legitimate
hub usages remain (the two annotated D-08 sites in `DossierListPage.tsx`, the
two D-08 MeetingSchedule sites, the FAB fallback, and the CreateDossierHub
component/route itself). No Command Palette entry pointed at a stale target;
no action required per D-08.

Additional grep of `frontend/src/components/` for `CommandPalette` or similar
confirmed no dossier-create command entry exists that needs repointing.

## Test Count

- `useContextAwareFAB.test.ts` — **14 passing** (8 typed routes × 1 case each + 5 hub-fallback routes + 1 callback override).
- `TourableEmptyState.test.tsx` — **4 passing** (country typed, elected-official typed, onCreate-wins, no-handler).
- Combined run: **18/18 passing**.

## Verification

| Gate                   | Command                                                                                                                                           | Result                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Tests                  | `cd frontend && pnpm vitest run src/hooks/__tests__/useContextAwareFAB.test.ts src/components/empty-states/__tests__/TourableEmptyState.test.tsx` | **PASS — 18/18**                                                                                                                                                                                                                                                                                                                                                                                                          |
| Typecheck (plan files) | `cd frontend && pnpm type-check` filtered to plan-31-03 files                                                                                     | **no new errors** — pre-existing `TS6133 isRTL` in `MeetingSchedule.tsx` (WorkingGroupScheduleProps — unchanged), pre-existing `TS2339` errors in `ProgressiveEmptyState.tsx` (hook return shape mismatch, lines shifted from 193→209 by my additions but same error set), pre-existing `TS6196` in `progressive-disclosure.types.ts` (unused helper types). Confirmed by `git stash` + re-typecheck pre-edit comparison. |
| Grep sanity            | `grep -RnE "to=\"/dossiers/create\"                                                                                                               | navigate\\(\\{ ?to: ?['\"]/dossiers/create" frontend/src/hooks/ frontend/src/pages/dossiers/DossierListPage.tsx frontend/src/pages/engagements/EngagementsListPage.tsx frontend/src/components/elected-officials/ElectedOfficialListTable.tsx`                                                                                                                                                                            | Only 2 allowed D-08 fallbacks in `DossierListPage.tsx` (lines 892, 904) — both annotated with `// D-08:` comments. |

## Deviations from Plan

### None — plan executed exactly as written, with two minor clarifications

1. **`ProgressiveEmptyStateProps.targetType` type inline union.** The plan pointed at `DossierType` from `@/services/dossier-api`; to avoid coupling the shared `progressive-disclosure.types.ts` to a feature-service file (that types file is consumed by multiple subsystems), the prop is typed with the eight dossier-type string literals inline. Functionally equivalent; zero behavior change.
2. **`TourableEmptyState` empty-case behavior.** The plan implied a hub fallback when neither `onCreate` nor `targetType` is set. I preserved the pre-existing behavior (no primary-action button when `onCreate` is undefined) because adding an automatic hub-routing button would change existing informational empty states. The test explicitly asserts this: callers that want creation UI must opt in via `onCreate` or `targetType`. Logged as "preserve existing surface area; hub fallback is the caller's responsibility."

Neither is a Rule-1/2/3 deviation — both are type-boundary / behavior-preservation choices driven by the surrounding code.

## Known Stubs

None.

## Self-Check

**Files created (verified via `ls`):**

- FOUND: `frontend/src/hooks/__tests__/useContextAwareFAB.test.ts`
- FOUND: `frontend/src/components/empty-states/__tests__/TourableEmptyState.test.tsx`

**Files modified (verified via `git status --short`):**

- FOUND: `frontend/src/hooks/useContextAwareFAB.ts`
- FOUND: `frontend/src/pages/dossiers/DossierListPage.tsx`
- FOUND: `frontend/src/pages/engagements/EngagementsListPage.tsx`
- FOUND: `frontend/src/components/elected-officials/ElectedOfficialListTable.tsx`
- FOUND: `frontend/src/components/empty-states/TourableEmptyState.tsx`
- FOUND: `frontend/src/components/progressive-disclosure/ProgressiveEmptyState.tsx`
- FOUND: `frontend/src/components/dossier/sections/MeetingSchedule.tsx`
- FOUND: `frontend/src/types/progressive-disclosure.types.ts`

**Commit:** see final bottom-of-summary field (populated after commit lands).

## Self-Check: PASSED

## Commit SHA

`bbf4c158` — `plan(31-03): context-aware routing for FAB + list CTAs + empty states`
