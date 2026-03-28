# Deferred Items — Phase 07

## Pre-existing Build Failures (Out of Scope)

These broken imports exist on main before any Phase 07 changes. They block `pnpm build` but are not caused by performance optimization work.

1. **data-retention.tsx** — Imports `usePendingRetentionActions`, `useExpiringEntities`, `useRetentionExecutionLog` from `@/hooks/useRetentionPolicies`, but the re-export file only exports `usePendingActions`, `useExpiringRecords`, `useExecutionLog`. Likely a rename in Phase 06 that missed this consumer.

2. **TagHierarchyManager.tsx** — Imports `useTagHierarchyTree`, `useTagsFlat`, `useMergeTags` from `@/hooks/useTagHierarchy`, but the re-export file only exports `useTagHierarchy`, `useCreateTag`, `useUpdateTag`, `useDeleteTag`. These hooks were either removed or renamed without updating the consumer.

**Impact:** `pnpm build` fails, preventing `pnpm size-limit` verification. The size-limit configuration and all other changes are correct and will work once these pre-existing import errors are fixed.
