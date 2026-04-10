# Journey 4 — My Work / Task Board

**Date:** 2026-04-10
**Status:** Code audit complete, browser verification pending
**Agents:** Component, Data Flow, Responsive

## Summary

- **Critical:** 0
- **Warning:** 3
- **Info:** 5

---

## Findings

### [WARNING] D-40: Mutation error doesn't guarantee optimistic revert

- **File:** frontend/src/components/unified-kanban/UnifiedKanbanBoard.tsx:175-189
- **Agent:** data-flow-auditor
- **Journey:** 4-work-board
- **Issue:** handleDragEnd calls onStatusChange() and awaits mutation. On error, reverts via setColumns() but board.tsx's handleStatusChange calls mutateAsync() without try-catch. Columns state can become inconsistent.
- **Expected:** Full optimistic revert on error via TanStack Query's onError rollback
- **Fix:** Wrap mutateAsync in try-catch with explicit state rollback, or use onError callback
- **Affects:** [4-work-board, data integrity on network failures]

### [WARNING] C-40: Missing aria-label on draggable kanban cards

- **File:** frontend/src/components/unified-kanban/UnifiedKanbanBoard.tsx:265-269
- **Agent:** component-auditor
- **Journey:** 4-work-board
- **Issue:** Draggable cards lack role="button" and aria-label for keyboard/screen reader users
- **Expected:** Each card: role="button" aria-label="Move {itemName} from {column}"
- **Fix:** Add aria attributes to UnifiedKanbanCard
- **Affects:** [4-work-board, accessibility]

### [WARNING] D-41: Filter state not persisted to URL

- **File:** frontend/src/routes/\_protected/my-work/board.tsx:29-33
- **Agent:** data-flow-auditor
- **Journey:** 4-work-board
- **Issue:** Source filter uses local state. Page reload loses filter selection.
- **Expected:** Sync filters to URL search params
- **Fix:** Use navigate() to update URL on filter change
- **Affects:** [4-work-board, UX]

### [INFO] RS-40: Mobile columns not optimized for <640px

- **File:** frontend/src/components/unified-kanban/UnifiedKanbanBoard.tsx:283
- **Agent:** responsive-auditor
- **Journey:** 4-work-board
- **Issue:** Columns fixed at 320px on sm:. On mobile, no stacking or scroll snap.
- **Expected:** 100% width with horizontal scroll snap on mobile
- **Fix:** Add w-screen sm:w-[320px] and scroll-snap-type: x mandatory

### [INFO] RS-41: Touch drag-drop sensors not verified

- **File:** frontend/src/components/unified-kanban/UnifiedKanbanBoard.tsx:120-192
- **Agent:** responsive-auditor
- **Journey:** 4-work-board
- **Issue:** @dnd-kit TouchSensor configuration not visible. Touch drag may not work.
- **Fix:** Verify DndContext includes TouchSensor in sensor list

### [INFO] RS-42: Header actions overlap on <375px

- **File:** frontend/src/components/unified-kanban/UnifiedKanbanHeader.tsx
- **Agent:** responsive-auditor
- **Journey:** 4-work-board
- **Issue:** Filter, mode switch, refresh buttons may overlap on very small phones
- **Fix:** Use dropdown menu on mobile instead of separate buttons

### [INFO] D-42: Cache invalidation pattern unclear after status change

- **File:** frontend/src/routes/\_protected/my-work/board.tsx:51-55
- **Agent:** data-flow-auditor
- **Journey:** 4-work-board
- **Issue:** No explicit cache invalidation on mutation success visible
- **Fix:** Add queryClient.invalidateQueries() in onSuccess

### [INFO] C-41: Verify key props on WorkItem card renders

- **File:** frontend/src/components/unified-kanban/UnifiedKanbanBoard.tsx:273-276
- **Agent:** component-auditor
- **Journey:** 4-work-board
- **Issue:** Column keys correct (columnKey), but card item keys need verification
- **Fix:** Verify each card uses key={item.id}
