# Quick Task 260412-hlb: Fix Batch 5 Data Flow & State Management

**Date:** 2026-04-12
**Status:** Ready for execution

## Triage Summary

| Finding   | Status        | Action                                                    |
| --------- | ------------- | --------------------------------------------------------- |
| D-04+D-05 | Needs fix     | Add cleanup to dossier context useEffect                  |
| D-06      | Needs fix     | Remove re-throw from login/logout after error state set   |
| D-07      | Needs fix     | Wrap Outlet with ErrorBoundary                            |
| D-08      | Needs fix     | Exclude isAuthenticated from persist partialize           |
| D-09      | Already clean | ChatContext has no subscriptions — skip                   |
| D-30      | Needs fix     | Add engagement query invalidation in useCreateAfterAction |
| D-31      | Needs fix     | Pass isSubmitting to AfterActionForm                      |
| D-40      | Needs fix     | Snapshot columns before drag for reliable revert          |
| D-50      | Already fixed | dashboard.tsx gates FirstRunModal on tourComplete         |
| D-72      | Needs fix     | Use messagesRef to avoid stale closure in sendMessage     |

## Plan 01: Data flow & state management fixes

### Task 1: Auth store fixes (D-06, D-08)

- **Files:** `frontend/src/store/authStore.ts`
- **Action:**
  - D-06: Remove `throw error` from login() catch and logout() catch blocks
  - D-08: Exclude `isAuthenticated` from partialize (derive from user !== null on hydration)
- **Verify:** Login failure shows error toast without uncaught exception; stale token → clean state on reload

### Task 2: ErrorBoundary around Outlet (D-07)

- **Files:** `frontend/src/routes/_protected.tsx`
- **Action:** Wrap `<Outlet />` with ErrorBoundary + translated fallback component
- **Verify:** Component crash shows error UI, not white screen

### Task 3: Dossier context cleanup (D-04, D-05)

- **Files:** `frontend/src/contexts/dossier-context.tsx`
- **Action:** Add cleanup return to useEffect that dispatches RESET on unmount
- **Verify:** No stale dossier data after navigation

### Task 4: After-action improvements (D-30, D-31)

- **Files:** `frontend/src/hooks/useAfterAction.ts`, `frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx`
- **Action:**
  - D-30: Add engagement query invalidation in useCreateAfterAction onSuccess
  - D-31: Pass isSubmitting={createAfterAction.isPending} to AfterActionForm
- **Verify:** Creating after-action refreshes engagement; submit button disabled during save

### Task 5: Kanban optimistic revert (D-40)

- **Files:** `frontend/src/components/unified-kanban/UnifiedKanbanBoard.tsx`
- **Action:** Snapshot columns state before mutation, use snapshot for revert on failure
- **Verify:** Failed drag-drop → card returns to original column

### Task 6: useAIChat stale closure fix (D-72)

- **Files:** `frontend/src/domains/ai/hooks/useAIChat.ts`
- **Action:** Use messagesRef to build conversationHistory, remove `messages` from sendMessage deps
- **Verify:** Rapid messages don't lose earlier entries
