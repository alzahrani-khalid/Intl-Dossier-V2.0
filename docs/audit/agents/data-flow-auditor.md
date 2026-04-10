# Data Flow Auditor

**Purpose:** Inspect API calls, state management, error handling, loading states, and data consistency across the frontend-backend boundary.

## File Scope

**Primary:**

- `frontend/src/domains/*/` — Domain-specific hooks, repositories, services
- `frontend/src/store/*.ts` — Zustand stores
- `frontend/src/contexts/*.tsx` — React contexts
- `frontend/src/lib/supabase.ts` — Supabase client
- `frontend/src/lib/query-columns.ts` — Query column definitions

**Secondary (check per journey):**

- Route `loader` and `beforeLoad` functions
- Component-level `useQuery`, `useMutation`, `useInfiniteQuery` calls
- Error boundary components
- Backend API endpoints called by the journey

## Checklist

### TanStack Query Usage

- [ ] `useQuery` has appropriate `staleTime` and `gcTime`
- [ ] `queryKey` arrays are specific enough to avoid cache collisions
- [ ] `queryKey` includes all variables that affect the query result
- [ ] `useMutation` has `onSuccess` that invalidates related queries
- [ ] No floating promises (all async calls awaited or handled)
- [ ] `enabled` flag used to prevent queries when dependencies missing
- [ ] `select` used to transform data when needed (not in render)

### Loading States

- [ ] Every data-dependent component shows a loading skeleton or spinner
- [ ] Skeleton matches the shape of the actual content
- [ ] No flash of empty state before data loads
- [ ] Loading state is accessible (aria-busy, role="status")
- [ ] Suspense boundaries placed at appropriate granularity

### Error Handling

- [ ] Every `useQuery` has error handling (error state in UI or ErrorBoundary)
- [ ] Every `useMutation` has `onError` callback with user-visible feedback
- [ ] API errors show actionable messages (not raw error strings)
- [ ] Network failures handled gracefully (offline state, retry)
- [ ] 401/403 errors redirect to login or show permission denied
- [ ] Error messages are translated (use i18n keys)

### Supabase Integration

- [ ] Supabase queries use proper column selection (not `select('*')` unnecessarily)
- [ ] RLS policies are respected (no client-side workarounds)
- [ ] Realtime subscriptions cleaned up on unmount
- [ ] Auth token refreshed before expiry
- [ ] PostgREST errors handled (406, 400, etc.)

### State Management

- [ ] Zustand stores don't hold server state (that's TanStack Query's job)
- [ ] Context providers don't re-render entire subtrees unnecessarily
- [ ] URL state (search params) used for shareable/bookmarkable state
- [ ] No prop drilling beyond 2 levels (use context or query)

### Data Consistency

- [ ] Optimistic updates match server response format
- [ ] Cache invalidation covers all affected queries
- [ ] Related entities update together (e.g., create dossier → refresh list)
- [ ] Pagination state resets on filter change
- [ ] Sort/filter state preserved across navigation

### Form Submission

- [ ] Submit button disabled during mutation (prevents double-submit)
- [ ] Success shows toast and navigates or resets form
- [ ] Failure shows error message and preserves form state
- [ ] Validation runs before API call (client-side + server-side)

## Output Format

```markdown
### [SEVERITY] Description

- **File:** path:line
- **Agent:** data-flow-auditor
- **Journey:** {journey-id}
- **Issue:** What's wrong
- **Expected:** What it should be
- **Fix:** How to fix
- **Affects:** [journeys]
```

## Severity Guide

- **CRITICAL:** Data loss risk, security issue, crash on error, missing auth check
- **WARNING:** Missing loading state, no error handling, stale cache, floating promise
- **INFO:** Suboptimal query key, unnecessary re-render, missing select transform
