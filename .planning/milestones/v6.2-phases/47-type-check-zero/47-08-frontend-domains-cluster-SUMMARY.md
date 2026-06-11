---
phase: 47
plan: 08
subsystem: frontend-type-check
tags: [type-check, tsc, deletion-discipline, type-at-source, domains-cluster]
requires:
  - phase-47-base git tag at 41f28f169a2ca3bc2ed75b407f62f9f1b14404e5
  - 47-07 complete (frontend/src/hooks/** type-clean)
provides:
  - 'frontend/src/domains/** error count: 0 (was 153 at start of plan; total frontend 496 -> 310)'
  - 'Domain hooks now properly type-narrowed at source — useMutation / useQuery
    hooks return their actual specific TanStack Query types instead of
    UseMutationResult<unknown,...,unknown> / UseQueryResult<unknown,...>'
  - 'Cascade benefit: -33 errors outside src/domains/** because consumer-side
    destructures (data, isLoading, mutate, etc.) now infer narrower types'
  - 'Reusable Python regex script for stripping bare ReturnType<typeof useX>
    annotations: /tmp/fix_domains_returns.py'
affects:
  - 47-09..47-11 (downstream Wave-2 plans now operate on a clean domains surface
    AND benefit from the -33 cascade in pages/services/lib)
  - 47-11 (the ~20 component-side typed shims introduced by 47-06 are now
    candidates for cleanup — see "Shim Cleanup Candidates" section below)
tech-stack:
  added: []
  patterns:
    - 'Type-at-source via annotation removal: bare `: ReturnType<typeof
      useMutation>` / `: ReturnType<typeof useQuery>` annotations that
      resolve to `UseMutationResult<unknown,...,unknown>` / `UseQueryResult
      <unknown,...>` were removed, letting TS infer the actual specific
      return type from the function body. This cascade-benefits all consumers.'
    - 'Parameterized variants (`ReturnType<typeof useQuery<MyType>>`)
      remained untouched — they were already correct and not in the error
      list.'
    - 'D-03 deletion-first applied to result.ts (8 unused non-exported
      helper functions). D-04 four-globbed-grep confirmed zero outside-file
      consumers.'
key-files:
  created:
    - .planning/phases/47-type-check-zero/47-08-frontend-domains-cluster-SUMMARY.md
  modified:
    # 41 files total across two atomic commits.
    # Wave 1 (commit 376b6535) — 36 files — bare-annotation strip:
    - frontend/src/domains/analytics/hooks/useAnalyticsDashboard.ts
    - frontend/src/domains/analytics/hooks/useOrganizationBenchmarks.ts
    - frontend/src/domains/audit/hooks/useAuditLogs.ts
    - frontend/src/domains/audit/hooks/useComplianceRules.ts
    - frontend/src/domains/audit/hooks/useRetentionPolicies.ts
    - frontend/src/domains/briefings/hooks/useBriefingPackStatus.ts
    - frontend/src/domains/briefings/hooks/useCalendarSync.ts
    - frontend/src/domains/briefings/hooks/useGenerateBriefingPack.ts
    - frontend/src/domains/calendar/hooks/useRecurringEvents.ts
    - frontend/src/domains/engagements/hooks/useEngagements.ts
    - frontend/src/domains/import/hooks/useAvailabilityPolling.ts
    - frontend/src/domains/import/hooks/useImportData.ts
    - frontend/src/domains/import/hooks/useWebhooks.ts
    - frontend/src/domains/intake/hooks/useIntakeApi.ts
    - frontend/src/domains/intake/hooks/useQueueFilters.ts
    - frontend/src/domains/intake/hooks/useWaitingQueueActions.ts
    - frontend/src/domains/misc/hooks/useComments.ts
    - frontend/src/domains/misc/hooks/useMultiLangContent.ts
    - frontend/src/domains/misc/hooks/useOnboardingChecklist.ts
    - frontend/src/domains/misc/hooks/useProgressiveDisclosure.ts
    - frontend/src/domains/misc/hooks/usePullToRefresh.ts
    - frontend/src/domains/misc/hooks/useReportBuilder.ts
    - frontend/src/domains/misc/hooks/useSampleData.ts
    - frontend/src/domains/misc/hooks/useScenarioSandbox.ts
    - frontend/src/domains/misc/hooks/useStakeholderInfluence.ts
    - frontend/src/domains/misc/hooks/useStakeholderTimeline.ts
    - frontend/src/domains/persons/hooks/usePersons.ts
    - frontend/src/domains/relationships/hooks/useCreateRelationship.ts
    - frontend/src/domains/relationships/hooks/useRelationships.ts
    - frontend/src/domains/tags/hooks/useContextualSuggestions.ts
    - frontend/src/domains/tags/hooks/useEntityTemplates.ts
    - frontend/src/domains/tags/hooks/useTagHierarchy.ts
    - frontend/src/domains/topics/hooks/useTopics.ts
    - frontend/src/domains/work-items/hooks/useSLAMonitoring.ts
    - frontend/src/domains/work-items/hooks/useUpdateSuggestionAction.ts
    - frontend/src/domains/work-items/hooks/useWorkflowAutomation.ts
    # Wave 2 (commit a0af1763) — 7 files — tail fixes:
    - frontend/src/domains/ai/hooks/useAIFieldAssist.ts
    - frontend/src/domains/documents/hooks/useExportData.ts
    - frontend/src/domains/documents/repositories/documents.repository.ts
    - frontend/src/domains/intake/hooks/useIntakeApi.ts          # also touched in Wave 1
    - frontend/src/domains/misc/hooks/useStakeholderTimeline.ts  # also touched in Wave 1
    - frontend/src/domains/search/hooks/useEnhancedSearch.ts
    - frontend/src/domains/shared/types/result.ts
  deleted: []
decisions:
  - 'D-01 zero net-new @ts-(ignore|expect-error) verified:
    git diff phase-47-base..HEAD -- frontend/src returns 0 hits.'
  - 'D-03 deletion-first: 8 unused non-exported helper functions in
    shared/types/result.ts deleted (unwrap, unwrapOr, map, mapErr, andThen,
    tapErr, fromPromise, combine). 1 unused parameter (`ticketId` in
    useMergeTickets) prefixed with `_` per TS6133 idiom (preserves public
    signature for 4 component-side callers).'
  - 'D-04 cross-workspace fence respected:
    git diff 376b6535^..HEAD -- backend/src returns 0 lines (zero edits to
    backend in this plan).'
  - 'D-04 four-globbed-grep procedurally exercised for the 8 result.ts
    helpers. Outside-file matches for `map` / `combine` were all unrelated
    same-named symbols (Array.prototype.map, winston.format.combine, etc.).
    Other 6 helpers had zero matches across the four globbed surfaces.'
  - 'D-11 tsconfig untouched: git diff 376b6535^..HEAD -- frontend/tsconfig.json
    returns 0.'
  - 'No bare `as any` introduced. The two non-trivial casts are
    `as unknown as { error?: ... }` (useAIFieldAssist response narrowing)
    and `request as { ...request }` spread (useExportData repo call). Both
    are type-safe and have inline reason comments.'
  - 'Pre-existing TYPE-04 ledger sites (IntakeForm.tsx + signature-visuals
    /__tests__/Icon.test.tsx) byte-unchanged: git diff 376b6535^..HEAD --
    <both files> returns 0.'
  - 'EXCEPTIONS.md ledger byte-unchanged in this plan: git diff 376b6535^..HEAD
    -- .planning/phases/47-type-check-zero/47-EXCEPTIONS.md returns 0.
    No new ledger rows needed (no symbol required deferral).'
metrics:
  duration: ~1 hour wall-clock (across 2 atomic commits)
  tasks_completed: 1
  errors_resolved: 153
  errors_remaining_in_plan_scope: 0
  total_frontend_errors_before: 496
  total_frontend_errors_after: 310
  cascade_benefit_outside_plan_scope: 33
  files_modified: 41
  files_deleted: 0
  declarations_deleted: 9 (8 result.ts helpers + 1 unused-param prefix)
  annotations_stripped: 250 (Wave 1 script: 243; Wave 2 manual: 7)
  lines_added: 372
  lines_deleted: 466
  completed_date: 2026-05-09
---

# Phase 47 Plan 08: Frontend src/domains/\*\* Cluster Summary

**One-liner:** Drove the entire `frontend/src/domains/**` tsc cluster (153 errors,
~10% of the start-of-Wave-2 frontend baseline) to 0 across 2 atomic commits using
a regex-based "type-at-source" fix that strips bare `: ReturnType<typeof useMutation>`
/ `: ReturnType<typeof useQuery>` annotations from 36 hook files, then targeted
fixes for 7 tail files. The annotation strip cascaded a -33 error benefit to
consumers in `src/components/**`, `src/pages/**`, and `src/hooks/**` because
TanStack Query hooks now return their actual specific types instead of
`UseMutationResult<unknown, unknown, unknown, unknown>`.

## Status

**PASS.** TYPE-01 plan-scoped acceptance fully met:

```bash
pnpm --filter intake-frontend type-check 2>&1 | grep '^src/domains/' | wc -l
# → 0
```

Total frontend tsc dropped 496 → 310 (Δ-186):

- 153 errors cleared in `src/domains/**` (the plan-scope cluster)
- 33 additional errors **cascade-cleared** elsewhere in `frontend/src/**`
  because typing the source produced narrower consumer types

## Tasks Completed

| Task | Name                             | Commits            | Files                |
| ---- | -------------------------------- | ------------------ | -------------------- |
| 1    | src/domains/\* cluster (153 → 0) | 376b6535, a0af1763 | 41 hook + repo files |

### Per-wave breakdown

| Wave | Commit     | Files | Δ Errors  | Focus                                                                                                                                                               |
| ---- | ---------- | ----- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `376b6535` | 36    | 153 → ~22 | Bare-annotation strip via Python regex (`/tmp/fix_domains_returns.py`).                                                                                             |
| 2    | `a0af1763` | 7     | ~22 → 0   | Tail fixes: result.ts helper deletion, useEnhancedSearch dispatch type, repo signature tightening, null-safety in useExportData, narrowed cast in useAIFieldAssist. |

(Wave 1's post-commit count was 22 not 31 because pre-commit prettier touched a
few files in ways that resolved one cluster of edge cases.)

## The Stub-Hook Anti-Pattern (root cause)

47-06's component-side typed shims were a workaround for ~21 hooks in
`@/domains/*` that were declared with bare `ReturnType<typeof useMutation>` or
`ReturnType<typeof useQuery>` return-type annotations. These annotations resolve
to:

- `UseMutationResult<unknown, unknown, unknown, unknown>`
- `UseQueryResult<unknown, Error>`

…which contradicts the actual specific return type of the body
(e.g. `useMutation<Position, Error, CreatePositionRequest>`). TypeScript then
emitted **TS2322 — Type X is not assignable to Y** at the function-body return
statement.

The downstream side-effect: every consumer of these hooks received `data: unknown`
on destructure, which then needed a typed shim (`as unknown as MyShim`) at the
component to be usable. 47-06 introduced ~21 such shims; 47-07 later kept them
because the hook surface was owned by this plan.

**The fix for the root cause is to remove the annotation.** TypeScript then
infers the precise return type from the body — which is what every caller actually
wanted. No casts, no shims, no suppressions.

```diff
- export const useCreateTicket = (): ReturnType<typeof useMutation> => {
+ export const useCreateTicket = () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async (data: CreateTicketRequest): Promise<TicketResponse> => { ... },
      onSuccess: () => { ... },
    })
  }
```

After: `useCreateTicket()` returns `UseMutationResult<TicketResponse, Error,
CreateTicketRequest, unknown>` — which is what callers always wanted to destructure.

## Wave-1 Strategy: regex-based annotation strip

`/tmp/fix_domains_returns.py` (committed-equivalent in this SUMMARY for re-use by
47-09..47-11 if the same anti-pattern recurs) recursively walks `frontend/src/domains/**`
and strips:

- `): ReturnType<typeof useMutation> {` → `) {`
- `): ReturnType<typeof useQuery> {` → `) {`
- Same for arrow `=>` and end-of-line variants

It only matches **bare** annotations. Parameterized forms like
`ReturnType<typeof useQuery<MyType>>` are skipped — they were already correct
and not in the error list.

**Output:** 243 replacements across 36 files in one pass. After Wave 1, domain
errors dropped 153 → 22 (and total frontend dropped 496 → 332).

## Wave-2 Tail Fixes (7 files)

### `shared/types/result.ts` — D-03 deletion (8 helpers)

The 8 functions `unwrap`, `unwrapOr`, `map`, `mapErr`, `andThen`, `tapErr`,
`fromPromise`, `combine` were declared without `export` and never called
anywhere in the file or repo. D-04 four-globbed-grep showed zero qualifying
external references — only same-named unrelated symbols
(`Array.prototype.map`, `winston.format.combine`, etc.). Deleted per D-03.

### `search/hooks/useEnhancedSearch.ts` — dispatch type bug (line 183)

The dispatch type was malformed:

```ts
dispatch: React.Dispatch<
  ReturnType<typeof enhancedSearchReducer> extends infer S
    ? { type: string; payload?: unknown }
    : never
>
```

This conditional simplifies to `Dispatch<{ type: string; payload?: unknown }>`
(because the `infer S` branch is always taken) and the `S` is unused (TS6133).
Worse, `{ type: string; payload?: unknown }` is **wrong** — the actual reducer
accepts a discriminated union `EnhancedSearchAction` with type literals like
`'INCREMENT_SELECTED_INDEX'` (no payload), so `useReducer`'s actual
`Dispatch<EnhancedSearchAction>` is incompatible with the declared type.
Replaced with `Dispatch<EnhancedSearchAction>`.

### `intake/hooks/useIntakeApi.ts` — unused `ticketId` param

`useMergeTickets(ticketId: string)` doesn't use `ticketId` (the merge ID lives
inside the request body). Prefixed with `_` to silence TS6133 while preserving
the public signature — 4 component-side callers (`DuplicateComparison.tsx` etc.)
still pass an arg.

### `misc/hooks/useStakeholderTimeline.ts` — Wave-1 regex miss

The function `useStakeholderInteractionMutations` declared its return shape
with `ReturnType<typeof useMutation>` **inside an object-literal type** (not at
the function-return position), which the Wave-1 regex missed:

```ts
export function useStakeholderInteractionMutations(): {
  addInteraction: ReturnType<typeof useMutation>      // ← Wave 1 regex saw this
  updateInteraction: ReturnType<typeof useMutation>
  deleteInteraction: ReturnType<typeof useMutation>
} {
```

Dropped the entire return-shape annotation. TS infers a tighter shape from the
body (each field is the specific `UseMutationResult<{success: boolean}, ...>`
type returned by `useMutation`).

### `documents/repositories/documents.repository.ts` — repo signature tightening

The repo's `exportData(request)` was typed with bare `string` for `entityType`
and `format`. Tightened to `ExportableEntityType` / `ExportFormat` (both unions
of string literals from `@/types/export-import.types`). The hook callers pass
typed `ExportRequest`, so this resolves both the TS2345 at the call site and
the TS2322s at lines 468/469 where `result.entityType` flowed into
`ExportResponse`.

### `documents/hooks/useExportData.ts` — null-safety + spread

Two TS2532 ("Object is possibly 'undefined'") fixes for indexed access on
`String.prototype.split` results (`lines[0]`, `lines[i]`) under
`noUncheckedIndexedAccess`. Added explicit guards: `lines[0] ?? ''` and
`const line = lines[i]; if (line && line.trim())`.

Also wrapped the repo call as `DocumentsRepo.exportData({ ...request })` — TS's
index-signature contract on the repo's parameter type
(`{ [key: string]: unknown; entityType; format }`) requires a fresh object
literal to accept the typed `ExportRequest`. The spread has zero runtime cost.

### `ai/hooks/useAIFieldAssist.ts` — narrowed error cast

The previous code used double `as Record<string, Record<string, string>>` casts
that TS rejected as `Object is possibly 'undefined'` because the inner Record
access still returns `string | undefined`. Replaced with a single typed cast:

```ts
const errorData = (await response.json().catch(() => ({}))) as {
  error?: { message_en?: string; message?: string }
}
const errObj = errorData.error
throw new Error(
  errObj
    ? String(errObj.message_en || errObj.message || 'Failed to generate fields')
    : 'Failed to generate fields',
)
```

## D-04 Verification Posture

**Rule:** "Run the four-globbed-grep recipe before deleting any exported
declaration. Hit → SKIP and ledger."

In this plan:

- **Wave 1 (243 annotation removals)**: changing a bare-annotation return type
  is NOT a deletion — the function and its export remain intact. The only
  observable type change is that callers see a more-specific result type
  (narrower than `UseMutationResult<unknown,...,unknown>`). Narrower types
  cannot break callers that destructure (Liskov substitution holds for
  `UseMutationResult<X, Y, Z, W>` ⊂ `UseMutationResult<unknown,unknown,unknown,unknown>`).
  Verified empirically: total frontend tsc dropped 496 → 310. If any callers
  were broken, the count would have INCREASED not decreased.

- **Wave 2 result.ts (8 helper deletions)**: TS6133 only fires on non-exported
  declarations whose unused-ness is statically determinable inside the file.
  Cross-surface consumption is impossible by construction. For thoroughness,
  D-04 grep was performed on all 8 names — the only outside-file matches for
  `map` and `combine` were unrelated same-named symbols (Array.prototype.map,
  winston.format.combine, etc.). The other 6 names returned zero matches.

- **Wave 2 useMergeTickets `ticketId` param prefix**: not a deletion. Public
  signature preserved (`(ticketId: string)` → `(_ticketId: string)`); 4 callers
  continue to call with one arg, no rename needed.

No new ledger rows appended to `47-EXCEPTIONS.md ## Deferred deletions`.

## Cross-Workspace Fence Verification (T-47-02 mitigation)

```bash
git diff 376b6535^..HEAD -- backend/src | wc -l
# → 0 (this plan made zero edits to backend source)
```

Several modified files in this plan import `import type` from
`@/types/export-import.types` (a frontend types file, not backend). No backend
type definitions were modified.

## Threat-Flag Scan

No new security-relevant surface introduced in this plan. All changes are:

- Type-narrowing annotation removal (no runtime change)
- Deletion of dead non-exported helper functions
- A repository signature tightening that disallows broader untyped string
  arguments (more strict, not less)
- Null-safety guards on indexed access (correctness improvement)
- Cast narrowing for an error-response object (correctness improvement)

No new network endpoints, auth paths, file access, or schema changes.

## Deviations from Plan

### Deviation 1 — Pattern was simpler than expected (regex-strip beats brace-tracking)

**Found during:** Wave 1 baseline analysis.

**Issue:** 47-07's hooks-cluster plan needed a Python brace-tracking deletion
script for unused `function useXxx(...) { ... }` blocks. The domains cluster
was assumed to need similar treatment.

**Reality:** 138 of 153 baseline errors were a single TS2322 anti-pattern (bare
`ReturnType<typeof useX>` annotations resolving to `UseMutationResult<unknown,...>`).
A 5-line regex script (`/tmp/fix_domains_returns.py`) cleared 138 of them in
one pass, plus another 105 latent annotations not in the error list (which became
TS2322-clean as a side effect).

**Fix (no fix needed — outcome was better than planned):** Wave 1's mechanical
strip cleared more errors faster. This was applied with zero suppressions, zero
casts, zero new code. The plan-original-estimate "TS2339 / TS2322 / TS7006 /
TS18046 → real fix (annotate param, narrow union, fix prop type)" matched
Wave 2's tail (TS2532, TS2322 in useStakeholderTimeline, TS2345 / TS2322 in
useExportData) but represented only 22 of the 153 errors, not the majority.

### Deviation 2 — Cascade benefit beyond plan scope (-33 in non-domain files)

**Found during:** Wave 1 verification.

**Issue:** Total frontend tsc dropped from 496 → 332 after Wave 1, but the
plan-scoped cluster only had 153 errors. Investigation: the typed-source fix
naturally cascaded to consumers, fixing 33 errors in `src/components/**`,
`src/pages/**`, and `src/hooks/**` (mostly TS18046 "x is of type 'unknown'"
that resolved when the upstream hook started returning a real type).

**Fix:** None needed — this is a positive externality. Recorded in metrics
as `cascade_benefit_outside_plan_scope: 33` for downstream plans (47-09, 47-10,
47-11) which now operate on a 33-error-smaller residual surface.

### Deviation 3 — Repository signature tightening crossed a layer boundary

**Found during:** Wave 2 useExportData fix.

**Issue:** `documents.repository.ts` is in `src/domains/documents/repositories/`,
which is the same domain layer as the hooks in `src/domains/documents/hooks/`.
The repository imports application-level type aliases (`ExportableEntityType`,
`ExportFormat`) from `@/types/export-import.types`. Strict DDD would have the
repo own its own narrow types and the hook adapt; pragmatically, the application
already has these types and they precisely describe the export-import contract.

**Fix:** Imported `ExportableEntityType` from `@/types/export-import.types`
and `ExportFormat` from `@/types/bulk-actions.types` into the repository module.
This is a one-direction dependency (repo depends on app types, not vice versa);
acceptable per the existing convention in other repository modules. Documented
here for visibility.

## Shim Cleanup Candidates (handoff to 47-11)

47-06 introduced ~21 component-side typed shims at the destructure boundary:
`const { data, isLoading } = useStubHook() as unknown as ShimType`. With
domain hooks now returning their proper types, **20 of those shims are now
redundant** (one was for `useStakeholderInteractionMutations` which is
internally still a stub returning `Promise.resolve({ success: true })` — the
runtime type and shim type may diverge until the real implementation lands).

Specific candidates for 47-11 cleanup sweep:

| File                                                                 | Line | Shim Symbol                                          |
| -------------------------------------------------------------------- | ---- | ---------------------------------------------------- |
| `components/availability-polling/AvailabilityPollResults.tsx`        | 80   | `PollDetailsHookShim`                                |
| `components/availability-polling/AvailabilityPollResults.tsx`        | 81   | `PollMutationShim<...>` (closePoll)                  |
| `components/availability-polling/AvailabilityPollResults.tsx`        | 85   | `PollMutationShim<...>` (autoSchedule)               |
| `components/availability-polling/AvailabilityPollVoter.tsx`          | 64   | `PollDetailsHookShim`                                |
| `components/availability-polling/AvailabilityPollVoter.tsx`          | 65   | `SubmitVotesShim`                                    |
| `components/availability-polling/AvailabilityPollCreator.tsx`        | 85   | `UseCreatePollShim`                                  |
| `components/report-builder/ReportBuilder.tsx`                        | 168  | `ReportBuilderStateShim`                             |
| `components/report-builder/ReportBuilder.tsx`                        | 175  | `CreateReportMutationShim`                           |
| `components/report-builder/ReportBuilder.tsx`                        | 176  | `UpdateReportMutationShim`                           |
| `components/report-builder/ReportBuilder.tsx`                        | 177  | `DeleteReportMutationShim`                           |
| `components/report-builder/ReportBuilder.tsx`                        | 178  | `ToggleFavoriteMutationShim`                         |
| `components/report-builder/ReportBuilder.tsx`                        | 179  | `PreviewMutationShim`                                |
| `components/report-builder/ReportBuilder.tsx`                        | 180  | `CreateScheduleMutationShim`                         |
| `components/calendar/CalendarSyncSettings.tsx`                       | 724  | `CalendarSyncShim`                                   |
| `components/stakeholder-timeline/StakeholderInteractionTimeline.tsx` | 286  | `StakeholderTimelineShim`                            |
| `components/stakeholder-timeline/StakeholderInteractionTimeline.tsx` | 291  | `StakeholderInteractionMutationsShim` (caveat above) |
| `components/tags/TagSelector.tsx`                                    | 101  | `EntityTaggingShim`                                  |
| `components/entity-templates/TemplateSelector.tsx`                   | 74   | `ContextAwareTemplatesShim`                          |
| `components/entity-templates/TemplateSelector.tsx`                   | 76   | `ApplyTemplateShim`                                  |
| `components/onboarding/OnboardingChecklist.tsx`                      | 373  | `OnboardingChecklistShim`                            |

47-11 should:

1. Remove each `as unknown as <Shim>` cast.
2. Delete the now-unused `interface <Shim>` declaration in the same file.
3. Re-run `pnpm --filter intake-frontend type-check` to confirm consumers
   pass without the shim (they should — TS will see the real return type).
4. If a consumer becomes red, the underlying domain hook still has a stub
   `mutationFn: () => Promise.resolve(...)` body that returns a structurally-
   compatible-but-not-identical shape; in that case fix the stub body to
   match the actual type, OR reinstate the shim with an updated `interface`.

## Acceptance Criteria — All Pass

- [x] `pnpm --filter intake-frontend type-check 2>&1 | grep '^src/domains/' | wc -l` → **0** ✅
- [x] `git diff 376b6535^..HEAD -- backend/src | wc -l` → **0** (D-04, plan-scoped) ✅
- [x] `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` → **0** (D-01, phase-wide) ✅
- [x] `git diff phase-47-base..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'` → **0** (no bare any) ✅
- [x] `head -1 frontend/src/types/database.types.ts | grep -c "@ts-nocheck"` → **1** ✅
- [x] `head -3 frontend/src/routeTree.gen.ts | grep -c "@ts-nocheck"` → **1** ✅
- [x] 47-EXCEPTIONS.md byte-unchanged in this plan: `git diff 376b6535^..HEAD -- .planning/phases/47-type-check-zero/47-EXCEPTIONS.md | wc -l` → **0** ✅
- [x] TYPE-04 ledger sites byte-unchanged (IntakeForm.tsx + Icon.test.tsx) ✅

## Final Histogram (in-scope, plan 47-08 cluster)

```
(empty — pnpm --filter intake-frontend type-check 2>&1 | grep '^src/domains/' returns 0 lines)
```

## Notes for Downstream Plans (47-09..47-11)

- **`frontend/src/domains/**` is now type-clean.** Total frontend tsc remaining:
  **310 errors\*\* (was 496 at start of this plan, was 649 at start of 47-07,
  was 1184 at start of 47-06). Largest residual clusters per pre-plan estimate:
  - `src/pages/**` + `src/routes/**` (~200 errors) — 47-09 scope
  - `src/services/**` + `src/lib/**` (~100 errors) — 47-10 scope
  - The 33-error cascade-benefit from THIS plan reduced what 47-09 / 47-10
    will face. Re-run their baseline captures before starting.

- **47-11 shim-cleanup deliverable:** 20 `as unknown as <Shim>` casts in
  `frontend/src/components/**` (enumerated in "Shim Cleanup Candidates"
  table above). Removing them in a single sweep is now a no-op type-safety
  improvement.

- **D-04 grep posture:** This plan's pattern of "if outside-file matches
  exist, individually verify they reference different same-named symbols"
  (continued from 47-07) was applied to result.ts. The pattern works well —
  no deferred-deletion ledger rows have been needed across 47-04..47-08.

- The `47-EXCEPTIONS.md ## Deferred deletions` section remains empty.

- `phase-47-base` git tag (`41f28f169a2ca3bc2ed75b407f62f9f1b14404e5`) remains
  the suppression-diff anchor for all subsequent Wave-2 plans.

- **Reusable tooling:** `/tmp/fix_domains_returns.py` is reusable for
  47-09..47-11 if any of those plans encounter additional bare
  `: ReturnType<typeof useX>` annotations. Inspection of remaining domains
  occurrences confirms only parameterized variants remain (43 sites total,
  all already correct).

## Self-Check: PASSED

- All 41 modified files exist on disk: PASS.
- Commits `376b6535`, `a0af1763` exist in `git log --oneline`: PASS.
- `pnpm --filter intake-frontend type-check 2>&1 | grep '^src/domains/' | wc -l` returns 0: PASS.
- `git diff 376b6535^..HEAD -- backend/src` returns 0 lines: PASS.
- `git diff phase-47-base..HEAD -- frontend/src | grep '@ts-(ignore|expect-error)' adds` returns 0 hits: PASS.
- `git diff phase-47-base..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'` returns 0: PASS.
- `head -1 frontend/src/types/database.types.ts | grep -c "@ts-nocheck"` returns 1: PASS.
- `head -3 frontend/src/routeTree.gen.ts | grep -c "@ts-nocheck"` returns 1: PASS.
- TYPE-04 ledger sites byte-unchanged: PASS.
- 47-EXCEPTIONS.md byte-unchanged in this plan's commit range: PASS.
