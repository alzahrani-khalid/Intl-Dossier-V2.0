# Quick Task 260412-hlb: Fix Batch 5 Data Flow & State Management — Summary

**Date:** 2026-04-12
**Commit:** 931a6cc6
**Status:** Complete

## Changes Made

### D-06: Auth store — remove re-throw from login/logout

- **File:** `frontend/src/store/authStore.ts`
- Removed `throw error` from `login()` and `logout()` catch blocks
- Error state is already set via `set({error: ...})` — callers don't need to catch

### D-07: ErrorBoundary around Outlet

- **File:** `frontend/src/routes/_protected.tsx`
- Wrapped `<Outlet />` with `<ErrorBoundary>` from existing error-boundary component
- Child route crashes now show error UI with retry, not white screen

### D-08: Exclude isAuthenticated from persist

- **File:** `frontend/src/store/authStore.ts`
- Changed `partialize` to only persist `user`, not `isAuthenticated`
- Prevents stale `true` surviving page reloads after token expiry

### D-04/D-05: Dossier context cleanup

- **File:** `frontend/src/contexts/dossier-context.tsx`
- Added cleanup return to URL-resolution useEffect that dispatches `RESET`
- Prevents stale context data leaking after navigation

### D-30: After-action invalidates engagement queries

- **File:** `frontend/src/hooks/useAfterAction.ts`
- Added `queryClient.invalidateQueries({ queryKey: ['engagement', data.engagement_id] })`
- Engagement detail page now refreshes after creating an after-action

### D-40: Kanban optimistic revert with snapshot

- **File:** `frontend/src/components/unified-kanban/UnifiedKanbanBoard.tsx`
- Snapshot columns state before mutation; revert to snapshot on failure
- More reliable than reverting to `columnsRecord` which could have changed

### D-72: useAIChat stale closure fix

- **File:** `frontend/src/domains/ai/hooks/useAIChat.ts`
- Added `messagesRef` synced with state on every render
- `conversationHistory` now reads from ref instead of closure variable
- Removed `messages` from `sendMessage` dependency array for stable callback

## Triaged as No-Op

| Finding | Reason                                                              |
| ------- | ------------------------------------------------------------------- |
| D-09    | ChatContext has no subscriptions — pure useState management         |
| D-31    | AfterActionForm already manages its own `saving` state internally   |
| D-50    | Already fixed — dashboard.tsx gates FirstRunModal on `tourComplete` |

## Verification

- `pnpm tsc --noEmit` — no new errors (all errors pre-existing in unrelated files)
- Lint + prettier passed via pre-commit hook
- Build succeeded via pre-commit hook
