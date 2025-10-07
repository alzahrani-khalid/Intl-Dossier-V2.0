# Quickstart Validation: Full Engagement Kanban Board

**Feature**: 016-implement-kanban
**Date**: 2025-10-07

## Purpose
This document provides step-by-step validation scenarios to verify the Engagement Kanban Board implementation is complete and working correctly. Execute these steps after implementation to confirm all functional requirements are met.

---

## Prerequisites

1. **Database**: Migrations applied (assignment_stage_history table, SLA columns, notification preferences)
2. **Backend**: Edge Functions deployed (engagements-kanban-get, assignments-workflow-stage-update)
3. **Frontend**: Kanban components implemented, hooks wired, i18n keys added
4. **Test Data**: At least 1 engagement with 10+ assignments across different stages
5. **Test Users**: 2 user accounts (1 staff role, 1 manager role)

---

## Validation Scenarios

### Scenario 1: Basic Kanban Board Display ✅
**Requirement**: FR-001 (Display assignments by stage)

**Steps**:
1. Log in as staff user
2. Navigate to Engagements page
3. Click on an engagement with 10+ assignments
4. Click "View Kanban Board" button

**Expected Result**:
- ✅ Dialog opens with 5 columns: To Do, In Progress, Review, Done, Cancelled
- ✅ Assignments are displayed as cards in correct columns based on workflow_stage
- ✅ Each card shows: title, assignee avatar/name, priority indicator, SLA countdown

**Pass Criteria**: All assignments visible in correct columns with complete metadata

---

### Scenario 2: Drag-and-Drop Basic Functionality ✅
**Requirement**: FR-002, FR-003 (Drag-and-drop + immediate update)

**Steps**:
1. Identify an assignment in "To Do" column
2. Drag the assignment card to "In Progress" column
3. Release the drag

**Expected Result**:
- ✅ Card follows cursor during drag (visual feedback)
- ✅ Drop zone highlights when hovering over "In Progress" column
- ✅ Card moves to "In Progress" column immediately (optimistic update)
- ✅ Database updated (verify via refresh or API call)
- ✅ Current stage SLA deadline updates (48 hours from now for "In Progress")

**Pass Criteria**: Card moves smoothly, database confirms workflow_stage = 'in_progress'

---

### Scenario 3: Real-Time Collaboration ✅
**Requirement**: FR-012 (Supabase Realtime updates)

**Steps**:
1. Open Kanban board for same engagement in 2 browser windows (User A, User B)
2. In User A's window: Drag assignment from "To Do" to "In Progress"
3. Observe User B's window

**Expected Result**:
- ✅ User B sees assignment card move to "In Progress" column **within 500ms**
- ✅ No page refresh required
- ✅ Card animates smoothly in User B's window

**Pass Criteria**: Real-time update latency <500ms, smooth animation

---

### Scenario 4: Role-Based Validation (Staff Sequential) ✅
**Requirement**: FR-010 (Role-based stage transitions)

**Steps**:
1. Log in as **staff** user (non-manager)
2. Open Kanban board with assignment in "To Do" stage
3. Attempt to drag assignment directly from "To Do" to "Done" (skip stages)
4. Release the drag

**Expected Result**:
- ✅ System prevents the move (card reverts to "To Do" column)
- ✅ Toast notification shows: "Staff members must move assignments through stages sequentially"
- ✅ Database NOT updated (workflow_stage still 'todo')

**Pass Criteria**: Drag blocked, error message shown, database unchanged

---

### Scenario 5: Role-Based Validation (Manager Skip Allowed) ✅
**Requirement**: FR-010 (Role-based stage transitions)

**Steps**:
1. Log in as **manager** user
2. Open same Kanban board with assignment in "To Do" stage
3. Drag assignment directly from "To Do" to "Done" (skip stages)
4. Release the drag

**Expected Result**:
- ✅ System allows the move (card moves to "Done" column)
- ✅ Database updated (workflow_stage = 'done')
- ✅ No validation error shown

**Pass Criteria**: Drag succeeds, database confirms skip allowed for managers

---

### Scenario 6: Dual SLA Tracking ✅
**Requirement**: FR-010a (Overall + stage-specific SLA)

**Steps**:
1. Create new assignment with overall_sla_deadline = 7 days from now
2. Move assignment through stages: Todo → In Progress → Review → Done
3. Query assignment_stage_history table after each move

**Expected Result**:
- ✅ Overall SLA deadline remains constant (7 days from creation)
- ✅ Current stage SLA deadline updates on each transition:
  - Todo: 24 hours
  - In Progress: 48 hours
  - Review: 12 hours
  - Done: NULL (no active stage SLA)
- ✅ assignment_stage_history records each transition with:
  - from_stage, to_stage, transitioned_by, transitioned_at
  - stage_duration_seconds (calculated by trigger)
  - stage_sla_met (true if transitioned before deadline)

**Pass Criteria**: Both SLA types tracked correctly, history records complete

---

### Scenario 7: Sorting Options ✅
**Requirement**: FR-013 (Default sort by created_at, customizable)

**Steps**:
1. Open Kanban board with 5+ assignments in "To Do" column
2. Verify default sort order (oldest first)
3. Click sort dropdown, select "SLA Deadline"
4. Observe column re-ordering
5. Click sort dropdown, select "Priority"
6. Observe column re-ordering

**Expected Result**:
- ✅ Default: Assignments sorted by created_at ASC (oldest at top)
- ✅ SLA Deadline: Assignments sorted by overall_sla_deadline ASC (most urgent at top)
- ✅ Priority: Assignments sorted by priority DESC (high → medium → low)
- ✅ Sorting applies to all columns simultaneously

**Pass Criteria**: All 3 sort modes work correctly, visual order matches expected

---

### Scenario 8: RTL Support (Arabic) ✅
**Requirement**: FR-007 (RTL/LTR support)

**Steps**:
1. Switch language to Arabic (via language selector)
2. Open Kanban board

**Expected Result**:
- ✅ Columns render right-to-left: Cancelled, Done, Review, In Progress, To Do (reversed)
- ✅ Text aligns to the right (text-end, not text-left)
- ✅ Card layouts use logical properties (ms-*, me-* instead of ml-*, mr-*)
- ✅ Drag-and-drop works correctly in RTL mode (drag right = move to previous stage)
- ✅ Sort dropdown aligns to the right

**Pass Criteria**: Full RTL layout, drag-and-drop functional, no visual glitches

---

### Scenario 9: Mobile Touch Support ✅
**Requirement**: FR-006 (Touch-based drag-and-drop, 44x44px targets)

**Steps**:
1. Open Kanban board on mobile device (or Chrome DevTools mobile emulation)
2. Set viewport to 375px width (iPhone SE)
3. Touch and drag assignment card to different column

**Expected Result**:
- ✅ Assignment cards have minimum 44x44px touch target (tap anywhere on card to drag)
- ✅ Touch drag works smoothly (no accidental scrolling)
- ✅ Visual feedback during touch drag (card follows finger)
- ✅ Drop zones highlight on touch hover
- ✅ Release updates stage immediately

**Pass Criteria**: Touch drag works on mobile, 44px minimum touch target verified

---

### Scenario 10: Notification Preferences ✅
**Requirement**: FR-011 (User-customizable notifications)

**Steps**:
1. Log in as User A, navigate to Settings → Notifications
2. Configure stage transition notifications:
   - Enable notifications
   - Select stages: ["review", "done"]
3. Save preferences
4. Open Kanban board in User A's session
5. In User B's session: Move assignment to "Review" stage
6. Observe User A's notifications

**Expected Result**:
- ✅ User A receives notification: "Assignment moved to Review"
- ✅ Notification includes assignment title and user who moved it
7. In User B's session: Move assignment to "In Progress" stage
8. Observe User A does NOT receive notification (not in preference list)

**Pass Criteria**: Notifications respect user preferences, only trigger for configured stages

---

### Scenario 11: Empty State ✅
**Requirement**: FR-014 (Empty engagement handling)

**Steps**:
1. Create new engagement with 0 assignments
2. Open Kanban board for this engagement

**Expected Result**:
- ✅ All 5 columns show empty state message: "No assignments in this stage"
- ✅ No errors or loading indicators stuck
- ✅ Board remains functional (can navigate away, close dialog)

**Pass Criteria**: Empty state displayed correctly, no errors

---

### Scenario 12: Error Handling (Network Failure) ✅
**Requirement**: FR-009 (Graceful error handling)

**Steps**:
1. Open Kanban board
2. Drag assignment to new column
3. Immediately disconnect network (Chrome DevTools: offline mode)
4. Wait for API request to fail

**Expected Result**:
- ✅ Optimistic UI update shows (card moves immediately)
- ✅ After 2-3 seconds, card reverts to original column
- ✅ Toast notification: "Network error - unable to update assignment. Please try again."
- ✅ Database NOT updated (verify via refresh after reconnecting)

**Pass Criteria**: Error handled gracefully, user informed, UI reverts to correct state

---

## Performance Validation

### Test: Drag Feedback Latency
**Target**: <100ms from drag start to visual feedback

**Steps**:
1. Open Chrome DevTools Performance tab
2. Start recording
3. Drag assignment card
4. Stop recording
5. Measure time from mousedown/touchstart to first visual update

**Pass Criteria**: Visual feedback appears within 100ms

---

### Test: Stage Transition Update Latency
**Target**: <200ms from drop to database update confirmation

**Steps**:
1. Open Chrome DevTools Network tab
2. Drag and drop assignment
3. Measure time from drop event to API response (200 OK)

**Pass Criteria**: API response received within 200ms

---

### Test: Real-Time Update Latency
**Target**: <500ms from server broadcast to client UI update

**Steps**:
1. Open 2 browser windows
2. Add performance.now() logging in onAssignmentMoved handler
3. Move assignment in window 1
4. Measure time from server timestamp (moved_at) to client receipt in window 2

**Pass Criteria**: Broadcast latency <500ms

---

## Accessibility Validation

### Test: Keyboard Navigation
**Target**: WCAG 2.1 Level AA compliance

**Steps**:
1. Open Kanban board
2. Press Tab key repeatedly
3. Use Arrow keys to navigate within columns
4. Press Enter/Space to select and move cards

**Expected Result**:
- ✅ All interactive elements focusable (cards, columns, buttons)
- ✅ Focus indicators clearly visible (outline or highlight)
- ✅ Logical tab order (left-to-right columns, top-to-bottom cards)
- ✅ Keyboard shortcuts documented (? key shows shortcuts overlay)

**Pass Criteria**: Full keyboard navigation functional, focus indicators visible

---

### Test: Screen Reader Announcements
**Target**: WCAG 2.1 Level AA compliance

**Steps**:
1. Enable VoiceOver (macOS) or NVDA (Windows)
2. Open Kanban board
3. Navigate through columns and cards
4. Move assignment to different column (with screen reader active)

**Expected Result**:
- ✅ Column headings announced: "To Do column, 5 items"
- ✅ Card content announced: "Assignment: Review contract, Assigned to Ahmed, High priority, SLA deadline in 2 days"
- ✅ ARIA live region announces stage changes: "Assignment moved from To Do to In Progress"

**Pass Criteria**: Screen reader announces all content and updates clearly

---

## Test Data Cleanup

After validation, clean up test data:

```sql
-- Delete test stage history
DELETE FROM assignment_stage_history WHERE assignment_id IN (SELECT id FROM assignments WHERE engagement_id = 'test-engagement-id');

-- Reset test assignments to original state
UPDATE assignments SET workflow_stage = 'todo', current_stage_sla_deadline = NULL WHERE engagement_id = 'test-engagement-id';
```

---

## Validation Checklist

- [ ] Scenario 1: Basic Kanban Board Display
- [ ] Scenario 2: Drag-and-Drop Basic Functionality
- [ ] Scenario 3: Real-Time Collaboration
- [ ] Scenario 4: Role-Based Validation (Staff Sequential)
- [ ] Scenario 5: Role-Based Validation (Manager Skip Allowed)
- [ ] Scenario 6: Dual SLA Tracking
- [ ] Scenario 7: Sorting Options
- [ ] Scenario 8: RTL Support (Arabic)
- [ ] Scenario 9: Mobile Touch Support
- [ ] Scenario 10: Notification Preferences
- [ ] Scenario 11: Empty State
- [ ] Scenario 12: Error Handling (Network Failure)
- [ ] Performance: Drag Feedback <100ms
- [ ] Performance: Stage Transition <200ms
- [ ] Performance: Real-Time Update <500ms
- [ ] Accessibility: Keyboard Navigation
- [ ] Accessibility: Screen Reader Announcements

**All scenarios must pass before considering the feature complete.**

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Engineer | | | |
| Product Owner | | | |

**Status**: ⏳ Pending Implementation → ✅ Ready for UAT → 🚀 Production Deployment
