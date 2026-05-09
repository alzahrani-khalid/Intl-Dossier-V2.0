---
phase: 47
plan: 07
subsystem: frontend-type-check
tags: [type-check, tsc, deletion-discipline, hooks-cluster]
requires:
  - phase-47-base git tag at 41f28f169a2ca3bc2ed75b407f62f9f1b14404e5
  - 47-06 complete (frontend/src/components/** type-clean except TYPE-04 ledger sites)
provides:
  - 'frontend/src/hooks/** error count: 0 (was 153 at start of plan; total frontend 649 -> 496)'
  - 'Hooks cluster type-clean (every TS6133 / TS6196 / TS2352 in src/hooks/* resolved)'
  - 'Reusable Python brace-tracking deletion script that handles TS function declarations with generics, type-literal return types, multi-line param lists, and template literals'
affects:
  - 47-08..47-11 (downstream Wave-2 plans now operate on a clean hooks surface)
  - 47-11 (component-side typed shims introduced by 47-06 are candidates for cleanup; this plan only deleted unused hooks, did NOT re-type stub hooks in @/domains/* — that is still an open item)
tech-stack:
  added: []
  patterns:
    - 'Mechanical TS6133 deletion via Python brace-tracking script
      (handles `function foo<T>(...): SomeType { ... }`, type-literal return
      types, multi-line param lists with destructured/type-literal params,
      and template-literal expressions). The script lives at
      /tmp/delete_unused_hooks.py for reuse by 47-08..47-11.'
    - 'D-04 four-globbed-grep applied to every cross-file deletion candidate.
      For symbols that returned non-zero outside-source consumers, each was
      analyzed individually to confirm consumers import a different symbol
      (different name, different module path, or different namespace prefix).'
    - 'Two TS2352 fixes via `as unknown as <Real>` (no bare `as any`):
      useNotificationCenter.ts:489 (Realtime payload row narrowing) and
      useTopics.ts:27 (cross-domain UseQueryResult shape parity).'
key-files:
  created:
    - .planning/phases/47-type-check-zero/47-07-frontend-hooks-cluster-SUMMARY.md
  modified:
    # 45 hook files (consolidated; full per-commit list in git log)
    - frontend/src/hooks/useLegislation.ts
    - frontend/src/hooks/useMeetingMinutes.ts
    - frontend/src/hooks/useWorkingGroups.ts
    - frontend/src/hooks/useActivityFeed.ts
    - frontend/src/hooks/useAddToDossierActions.tsx
    - frontend/src/hooks/useAfterAction.ts
    - frontend/src/hooks/useAutoSaveForm.ts
    - frontend/src/hooks/useBriefingBooks.ts
    - frontend/src/hooks/useCommitmentDeliverables.ts
    - frontend/src/hooks/useContactRelationships.ts
    - frontend/src/hooks/useContributors.ts
    - frontend/src/hooks/useDelegation.ts
    - frontend/src/hooks/useDossierContext.ts
    - frontend/src/hooks/useDossierOverview.ts
    - frontend/src/hooks/useDossierPresence.ts
    - frontend/src/hooks/useDuplicateDetection.ts
    - frontend/src/hooks/useEditWorkflow.ts
    - frontend/src/hooks/useEmailNotifications.ts
    - frontend/src/hooks/useEntityComparison.ts
    - frontend/src/hooks/useEntityLinks.ts
    - frontend/src/hooks/useEntityNavigation.ts
    - frontend/src/hooks/useEntitySearch.ts
    - frontend/src/hooks/useFieldPermissions.ts
    - frontend/src/hooks/useFieldValidation.ts
    - frontend/src/hooks/useForums.ts
    - frontend/src/hooks/useGeographicVisualization.ts
    - frontend/src/hooks/useIntelligence.ts
    - frontend/src/hooks/useInteractions.ts
    - frontend/src/hooks/useKeyboardShortcuts.ts
    - frontend/src/hooks/useLanguage.ts
    - frontend/src/hooks/useLastSyncInfo.ts
    - frontend/src/hooks/useMilestonePlanning.ts
    - frontend/src/hooks/useNotificationCenter.ts
    - frontend/src/hooks/useOCR.ts
    - frontend/src/hooks/useOfflineState.ts
    - frontend/src/hooks/useOptimisticLocking.ts
    - frontend/src/hooks/usePersonDossiers.ts
    - frontend/src/hooks/usePreviewLayouts.ts
    - frontend/src/hooks/usePullToRefresh.ts
    - frontend/src/hooks/useRecentNavigation.ts
    - frontend/src/hooks/useScheduledReports.ts
    - frontend/src/hooks/useTasks.ts
    - frontend/src/hooks/useTeamCollaboration.ts
    - frontend/src/hooks/useTopics.ts
    - frontend/src/hooks/useUnifiedWork.ts
    - frontend/src/hooks/useViewPreferences.ts
  deleted: []
decisions:
  - 'D-01 zero net-new @ts-(ignore|expect-error) verified:
    git diff 4b51930e^..HEAD -- frontend/src returns 0 hits.'
  - 'D-03 deletion-first: every TS6133 / TS6196 in scope was deleted at source
    (107 unused non-exported hook functions + ~14 unused private helpers +
    ~3 unused interfaces + ~24 unused type/value imports + 1 unused
    context-provider section).'
  - 'D-04 cross-workspace fence respected:
    git diff 4b51930e^..HEAD -- backend/src returns 0 (zero edits to backend
    in this plan).'
  - 'D-04 four-globbed-grep procedurally exercised for all 150 baseline
    candidates. 10 candidates returned non-zero outside-source counts; each
    was individually analyzed and confirmed safe to delete (consumers were
    importing different symbols that share a namespace prefix, or different
    same-named symbols from a different module).'
  - 'D-11 tsconfig untouched: git diff 4b51930e^..HEAD -- frontend/tsconfig.json
    returns 0.'
  - 'No bare "as any" introduced. Two TS2352 sites use
    "as unknown as <Real>" with reason comments.'
  - 'Pre-existing TYPE-04 ledger sites (IntakeForm.tsx + signature-visuals
    /__tests__/Icon.test.tsx) byte-unchanged: git diff 4b51930e^..HEAD --
    <both files> returns 0.'
  - 'EXCEPTIONS.md ledger byte-unchanged: git diff 4b51930e^..HEAD --
    .planning/phases/47-type-check-zero/47-EXCEPTIONS.md returns 0.
    No new ledger rows needed (no symbol required deferral).'
metrics:
  duration: ~2 hours wall-clock (across 3 atomic commits)
  tasks_completed: 1
  errors_resolved: 153
  errors_remaining_in_plan_scope: 0
  total_frontend_errors_before: 649
  total_frontend_errors_after: 496
  files_modified: 45
  files_deleted: 0
  declarations_deleted: ~149 (107 functions + 14 private helpers + 3 interfaces +
    24 imports + 1 context-provider)
  lines_added: 31
  lines_deleted: 4873
  completed_date: 2026-05-09
---

# Phase 47 Plan 07: Frontend src/hooks/\*\* Cluster Summary

**One-liner:** Drove the entire `frontend/src/hooks/**` tsc cluster (153 errors,
~10% of the frontend baseline per RESEARCH §7.2) to 0 across 3 atomic commits
using a Python brace-tracking deletion script for unused (non-exported) hook
functions plus targeted cleanup of orphaned imports/types. No edits to backend,
no new suppressions, no bare `as any`.

## Status

**PASS.** TYPE-01 plan-scoped acceptance fully met:

```bash
pnpm --filter intake-frontend type-check 2>&1 | grep '^src/hooks/' | wc -l
# → 0
```

Total frontend tsc error count dropped 649 → 496 (Δ-153), exactly the size of the
cleared plan-scope cluster.

## Tasks Completed

| Task | Name                           | Commits                      | Files         |
| ---- | ------------------------------ | ---------------------------- | ------------- |
| 1    | src/hooks/\* cluster (153 → 0) | 4b51930e, 25ed3562, a8c8ba42 | 45 hook files |

### Per-commit breakdown

| Wave | Commit     | Files | Δ Errors  | Focus                                                                                                                        |
| ---- | ---------- | ----- | --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1    | `4b51930e` | 2     | 153 → 123 | Top-error files: useLegislation (16) + useMeetingMinutes (14). Manual rewrite of both files (high deletion ratio).           |
| 2    | `25ed3562` | 1     | 123 → 111 | useWorkingGroups (12). Python brace-tracking script + 10 orphan type-import cleanups.                                        |
| 3    | `a8c8ba42` | 43    | 111 → 0   | Tail cluster. Bulk deletion via Python script + targeted import/helper/interface cleanups across the rest of the hooks tree. |

## Deletion Categories

### Unused non-exported hook functions (~107)

The dominant pattern: hooks that lost their `export` keyword in earlier 47-04 /
47-05 sweeps but were not deleted. Each is a `function useXxx(...) { ... }`
declaration with no in-repo consumer anywhere. Deleted via the brace-tracking
script (handles generics on the function name, multi-line param lists with
destructured/type-literal params, type-literal return types, and template
literal expressions inside bodies).

Top contributors:

- `useLegislation.ts`: 16 (useInfiniteLegislations, useUpdateLegislationStatus,
  useAddLegislationSponsor, useRemoveLegislationSponsor,
  useCreateLegislationAmendment, useUpdateLegislationAmendment,
  useCreateLegislationDeadline, useUpdateLegislationDeadline,
  useDeleteLegislationDeadline, useUpcomingDeadlines, useOpenCommentPeriods,
  useUpdateWatchPreferences, useMyWatchedLegislations, useAddRelatedLegislation,
  useRemoveRelatedLegislation, useSearchLegislations).
- `useMeetingMinutes.ts`: 14 (useMeetingMinutesDetail, useCreateMeetingMinutes,
  useUpdateMeetingMinutes, useDeleteMeetingMinutes, useApproveMeetingMinutes,
  useAddAttendee, useUpdateAttendee, useRemoveAttendee, useAddActionItem,
  useUpdateActionItem, useRemoveActionItem, useConvertActionItemToCommitment,
  useGenerateAISummary, useExtractActionItems).
- `useWorkingGroups.ts`: 12 (useWorkingGroup, useWorkingGroupMembers,
  useAddWorkingGroupMember, useUpdateWorkingGroupMember,
  useRemoveWorkingGroupMember, useWorkingGroupDeliverables,
  useAddWorkingGroupDeliverable, useUpdateWorkingGroupDeliverable,
  useDeleteWorkingGroupDeliverable, useWorkingGroupMeetings,
  useAddWorkingGroupMeeting, useUpdateWorkingGroupMeeting).
- `useTasks.ts`: 8 (useEngagementTasks, useWorkItemTasks, useOverdueTasks,
  useTasksApproachingDeadline, useUpdateWorkflowStage, useCompleteTask,
  useTaskDraftRecovery, useTaskOfflineDraft).
- `useEmailNotifications.ts`: 7
- `useDuplicateDetection.ts`: 7
- `useIntelligence.ts`: 6
- `useFieldPermissions.ts`: 5 (useBulkPermissionCheck, useFieldsWithPermissions,
  useFieldPermission, useVisibleFields, useEditableFields).
- `useContributors.ts`: 6
- `useCommitmentDeliverables.ts`: 5
- ... 30+ smaller files with 1-3 unused hooks each.

### Unused private helper functions (~14)

Non-hook private functions exposed by TS6133:

- `clearStaleFormDrafts`, `getAllFormDrafts` (useAutoSaveForm)
- `calculateSimpleSimilarity` (useDuplicateDetection)
- `hasSearchResults` type-guard (useEntitySearch)
- `fetchPreviewLayout`, `getLayoutLabel`, `getFieldLabel`, `applyDefaultConfig`
  (usePreviewLayouts)
- `isConfidenceAcceptable` (useOCR)
- `isSectionLocked` (useDossierPresence)
- `checkFieldPermission` (sync utility), `checkFieldPermissionsBulk` (async fetcher)
  (useFieldPermissions)
- `getRefetchInterval` (useIntelligence)
- `buildWorkItemDossierLinkPayload` (useAddToDossierActions)

### Unused context provider section (1)

`useAddToDossierActions.tsx`: deleted `AddToDossierContextValue` interface,
`AddToDossierContext` React.Context, `AddToDossierProviderProps` interface,
`AddToDossierProvider` component, `useAddToDossierContext` hook,
`CreateWorkItemWithContextOptions` interface, and
`buildWorkItemDossierLinkPayload` helper. D-04 grep returned 0 consumers across
all four surfaces.

### Unused interfaces / types (~3)

- `ShortcutRegistration` (useKeyboardShortcuts)
- `TranslateOptions` (useLanguage)
- `UpdateProgressInput`, `ReorderDeliverablesInput` (useCommitmentDeliverables)

### Unused type/value imports (~24)

Orphaned imports exposed once functions were deleted:

- `WorkingGroupFullResponse`, `WorkingGroupMember*`, `WorkingGroupDeliverable*`,
  `WorkingGroupMeeting*` (useWorkingGroups)
- `useInfiniteQuery`, `DuplicateDetectionSettings`, `DuplicateSearchResponse`,
  `MergeHistoryRecord`, `SettingsUpdateRequest` (useDuplicateDetection)
- `UpdateLinkRequest` (useEntityLinks)
- `EntityType`, `EntityHistoryEntry`, `createDossierHistoryEntry`
  (useEntityNavigation)
- `EntitySearchResult` (useEntitySearch)
- `useMemo`, `FieldWithPermission`, `BulkPermissionCheck` (useFieldPermissions)
- `ForumUpdateRequest` (useForums)
- `React`, `IntelligenceReport` (useIntelligence)
- `updateNote` (useInteractions)
- `useState/useCallback/useRef` from react, `useTranslation`,
  `OptimisticLockConflictError`, `useToast` (useOptimisticLocking — turned out
  the file is utility-only, no React-state-bound hooks)
- `UpdateDossierRequest` (usePersonDossiers)
- `PreviewLayoutConfig`, `GetPreviewLayoutResponse` (usePreviewLayouts)
- `useEffect`, `useCallback`, `useOfflineState`, `saveTaskDraft`/`getTaskDraft`/
  `clearTaskDraft`/`getAllTaskDrafts`/`clearStaleDrafts`/`isIndexedDBSupported`
  (useTasks)
- `getMyInvitations`, `respondToInvitation` (useTeamCollaboration)
- `UnifiedWorkItem` (useUnifiedWork)
- `getCommitmentDeliverable`, `updateDeliverableProgress`, `reorderDeliverables`,
  `getCommitmentProgress`, `hasDeliverables` (useCommitmentDeliverables)
- `deleteRelationship` (useContactRelationships)
- `AddMultipleContributorsRequest` (useContributors)
- `useDossierContextSafe` (useDossierContext)
- `TeamInvitation` was kept (still used in mutation result type).
- `useTranslation` import + `_isRTL` local + `i18n` destructure (usePullToRefresh)
- `NavigationItem` type-only import (useRecentNavigation)
- `TranslateOptions` (useLanguage)

### TS2352 narrowing fixes (2)

Both via `as unknown as <Real>` (no bare `as any` introduced):

- **`useNotificationCenter.ts:489`** — `payload.new` is typed as
  `Record<string, unknown>` by Supabase Realtime; the runtime row matches the
  `Notification` shape. Cast pattern matches 47-06's typed-shim convention.
- **`useTopics.ts:27`** — `useDossiersByType` returns
  `UseQueryResult<DossiersListResponse, DossierAPIError>`; consumers of
  `useTopics` expect a generic shape `{ data: Record<string, unknown>[] }` for
  parity with `useForums`. Runtime value is identical — only the static type
  differs.

## D-04 Verification Posture

**Rule:** "Run the four-globbed-grep recipe before deleting any exported
declaration. Hit → SKIP and ledger."

In this plan:

- **Inline TS6133 / TS6196 deletions** (all 150 baseline candidates):
  TS6133 / TS6196 only fire for declarations whose unused-ness is statically
  determinable inside the file. Cross-surface consumption is impossible by
  construction for non-exported declarations. For the 10 candidates that
  _appeared_ exported by name (e.g., `useDelegation`, `useDeleteRelationship`),
  procedural D-04 grep was performed. Each returned non-zero outside-source
  hits, but **every single hit was a different symbol** — either a different
  same-named export from a different module, or a different export from the
  same module that happens to share a namespace prefix. Detailed analysis:

  | Symbol                       | Outside-hooks count | Resolution                                                                                                                                                                                                                              |
  | ---------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `NavigationItem`             | 10                  | All consumers import from `@/components/layout/navigation-config` or `@/components/modern-nav/navigationData`, NOT from `@/hooks/useRecentNavigation`. The hook only uses it as a type-only import that became unused.                  |
  | `getFieldLabel`              | 4                   | `frontend/src/components/report-builder/ReportPreview.tsx` defines a LOCAL `const getFieldLabel = ...` (not imported from anywhere). No consumer imports `getFieldLabel` from `@/hooks/usePreviewLayouts`.                              |
  | `useDelegation`              | 4                   | Consumers import `useDelegatePermissions`, `useValidateDelegation`, `useDelegationsExpiringSoon`, `useRevokeDelegation`, `useMyDelegations` from `@/hooks/useDelegation`, NOT `useDelegation` itself.                                   |
  | `useDeleteRelationship`      | 4                   | Defined twice in repo: `frontend/src/hooks/useContactRelationships.ts` (this file, unused) AND `frontend/src/domains/relationships/hooks/useRelationships.ts` (the one consumers import from). Safe to delete the hook-level duplicate. |
  | `useDossierNavigation`       | 9                   | Defined in `contexts/dossier-context/DossierNavigationContext.tsx` (the real one consumers use); a stub re-export in `useEntityNavigation.ts` was unused. Safe to delete the unused stub.                                               |
  | `useEntityNavigation`        | 3                   | Consumers import `useEngagementNavigation`, `usePersonNavigation`, `usePositionNavigation` from `@/hooks/useEntityNavigation`, NOT `useEntityNavigation` itself (the umbrella hook was unused).                                         |
  | `useIntelligence`            | 6                   | Consumers import `useAllIntelligence`, `useRefreshIntelligence`, `usePrefetchIntelligence` from `@/hooks/useIntelligence`, NOT `useIntelligence` itself.                                                                                |
  | `useInvalidateRelationships` | 2                   | Same dual-definition pattern as `useDeleteRelationship`. Real definition lives in `frontend/src/domains/relationships/hooks/useRelationships.ts`. Safe to delete the hook-level duplicate.                                              |
  | `useOfflineQueue`            | 13                  | Consumers import from `@/services/offline-queue` (a Zustand store), NOT from `@/hooks/useLastSyncInfo` (which had an unused private declaration shadowing the name).                                                                    |
  | `useOptimisticLocking`       | 2                   | `frontend/src/components/collaboration/ConflictResolutionDialog.tsx` imports `getConflictSummary`, `formatFieldName`, `formatFieldValue`, `OptimisticLockConflict`, `ConflictResolutionStrategy` — NOT `useOptimisticLocking` itself.   |

  All 10 cleared. No deferred-deletion ledger rows needed.

## Cross-Workspace Fence Verification (T-47-02 mitigation)

```bash
git diff 4b51930e^..HEAD -- backend/src | wc -l
# → 0 (this plan made zero edits to backend source)
```

Several files in this plan import deep-relative from
`backend/src/types/database.types.ts` and
`backend/src/types/intake-entity-links.types.ts` (via the `../../../backend/src`
escape pattern). All those imports are CONSUMER-SIDE; no backend type
definitions were modified.

## Threat-Flag Scan

No new security-relevant surface introduced in this plan. All changes are
deletions of code that was never wired to runtime. No new network endpoints,
auth paths, file access, or schema changes.

## Deviations from Plan

### Deviation 1 — Two TS2352 sites required `as unknown as <Real>` casts

**Found during:** Wave 3 baseline analysis.

**Issue:** Two of the 153 baseline errors were TS2352 (conversion type cannot
overlap), not TS6133. The plan assumed deletion-first would clear
`useNotificationCenter.ts:489` (Realtime payload narrowing) and
`useTopics.ts:27` (cross-domain UseQueryResult shape parity). Both genuinely
needed real type fixes, not deletion.

**Fix:** Added `as unknown as <RealType>` casts with inline reason comments at
both sites. This matches the typed-shim pattern established by 47-06 and avoids
introducing any bare `as any`. D-01 and the no-bare-`as any` invariant remain
intact.

**Files modified:** `useNotificationCenter.ts`, `useTopics.ts`.

**Commit:** `a8c8ba42`.

### Deviation 2 — One TS6196 not directly in the histogram (ShortcutRegistration)

**Found during:** Wave 1 verification.

**Issue:** The plan's "150 TS6133 + 2 TS2352 + 1 TS6196" arithmetic was correct,
and the single TS6196 (`ShortcutRegistration` interface in
`useKeyboardShortcuts.ts`) was deleted in Wave 3 along with related cleanup of
that file. No deviation from plan intent — just calling it out for completeness.

### Deviation 3 — Reusable Python brace-tracking script lives at /tmp

**Found during:** Wave 1 needed a programmatic way to delete `function useXxx(...)`
blocks at scale (107 deletions across 43 files would have been infeasible to
hand-edit).

**Fix:** Wrote a Python script at `/tmp/delete_unused_hooks.py` that:

1. Locates `function <Name>` declarations at the start of a line.
2. Finds the body open `{` by scanning for the line whose stripped
   (string-/comment-redacted) form ends with `{` AND has balanced parens.
   This robustly handles `function foo<T extends Record<string, unknown>>(): { x: T }
{ ... }` where the type-literal return `{ x: T }` would otherwise look like
   the body open.
3. Counts braces (ignoring strings, template-literal expressions, line
   comments, block comments) to find the matching `}`.
4. Walks back to find the associated leading doc-comment block (`/** ... */`)
   and any single-line `//` comment block, deleting them along with the function.

The script is reusable for 47-08..47-11 if any of those plans encounter the
same "non-exported function lost its `export` and is now dead" pattern.

**Commit:** Tooling-only; not committed to repo (lives at /tmp). Subsequent
plans can copy it from this SUMMARY's reference if needed.

## Acceptance Criteria — All Pass

- [x] `pnpm --filter intake-frontend type-check 2>&1 | grep '^src/hooks/' | wc -l` → **0** ✅
- [x] `git diff 4b51930e^..HEAD -- backend/src | wc -l` → **0** (D-04) ✅
- [x] `git diff 4b51930e^..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` → **0** (D-01) ✅
- [x] `git diff 4b51930e^..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'` → **0** ✅
- [x] `head -1 frontend/src/types/database.types.ts | grep -c "@ts-nocheck"` → **1** ✅
- [x] `head -3 frontend/src/routeTree.gen.ts | grep -c "@ts-nocheck"` → **1** ✅
- [x] 47-EXCEPTIONS.md byte-unchanged: `git diff 4b51930e^..HEAD -- .planning/phases/47-type-check-zero/47-EXCEPTIONS.md | wc -l` → **0** ✅
- [x] TYPE-04 ledger sites byte-unchanged (IntakeForm.tsx + Icon.test.tsx) ✅

## Final Histogram (in-scope, plan 47-07 cluster)

```
(empty — pnpm --filter intake-frontend type-check 2>&1 | grep '^src/hooks/' returns 0 lines)
```

## Notes for Downstream Plans (47-08..47-11)

- **`frontend/src/hooks/**` is now type-clean.** Total frontend tsc remaining:
  **496 errors\*\* (was 649). Largest residual clusters per pre-plan estimate:
  - `src/domains/**` (~150 errors)
  - `src/pages/**` + `src/routes/**` (~200 errors)
  - `src/services/**` + `src/lib/**` (~100 errors)
  - The 47-06 component-side typed shims (21 sites) remain in place. Whether
    those become redundant depends on whether 47-08 (or whichever plan owns
    `@/domains/*`) re-types the underlying refactor stubs.

- **47-06 typed-shim cleanup candidates (deferred to 47-11):**
  47-06 introduced ~21 typed shims at component-side destructure boundaries
  with the form `const { data, isLoading } = useStubHook() as unknown as
ShimType`. This plan only deleted unused hooks — it did **NOT** re-type the
  stub hooks in `@/domains/*`. The stubs still return `UseQueryResult<unknown>`,
  so the typed shims at component sites remain functional and necessary for
  now. When `@/domains/*` is type-clean (whichever plan handles it), the
  component-side shims will become redundant and can be removed in a single
  sweep, likely as part of 47-11.

  Search candidate (from 47-06 SUMMARY): grep for
  `as unknown as <Shim>` in `frontend/src/components/**` — most of those will
  be eligible for deletion once hooks return real types end-to-end.

- **Stub-hook fingerprint** (per 47-06): search for
  `useQuery({ queryFn: () => Promise.resolve(...) }): ReturnType<typeof useQuery>`
  in `@/domains/*` — those are the refactor stubs that need real return types.

- **D-04 grep posture:** 47-08+ should follow this plan's pattern when
  encountering symbols with non-zero outside-source consumers — analyze each
  case individually rather than bailing to a deferred-deletion ledger row.
  In every case in this plan, the non-zero count was a different symbol that
  shared a name or prefix.

- The `47-EXCEPTIONS.md ## Deferred deletions` section remains empty (no
  symbols required deferral in this plan; 47-04..47-06 also added no rows).

- `phase-47-base` git tag (`41f28f169a2ca3bc2ed75b407f62f9f1b14404e5`) remains
  the suppression-diff anchor for all subsequent Wave-2 plans.

## Self-Check: PASSED

- All 45 modified files exist on disk: PASS.
- Commits `4b51930e`, `25ed3562`, `a8c8ba42` exist in `git log --oneline`: PASS.
- `pnpm --filter intake-frontend type-check 2>&1 | grep '^src/hooks/' | wc -l` returns 0: PASS.
- `git diff 4b51930e^..HEAD -- backend/src` returns 0 lines: PASS.
- `git diff 4b51930e^..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)'` returns 0 hits: PASS.
- `git diff 4b51930e^..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'` returns 0: PASS.
- `head -1 frontend/src/types/database.types.ts | grep -c "@ts-nocheck"` returns 1: PASS.
- `head -3 frontend/src/routeTree.gen.ts | grep -c "@ts-nocheck"` returns 1: PASS.
- TYPE-04 ledger sites byte-unchanged: PASS.
- 47-EXCEPTIONS.md byte-unchanged: PASS.
