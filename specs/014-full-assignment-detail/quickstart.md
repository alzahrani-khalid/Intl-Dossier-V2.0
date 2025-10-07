# Quickstart: Full Assignment Detail Page

**Feature**: 014-full-assignment-detail
**Date**: 2025-10-03

## Prerequisites

- Supabase project running (zkrcjzdemdmwhearhfgg)
- Database migrations applied
- Frontend development server running
- Test user credentials with staff role
- Test assignment ID with active status

## Quick Test (5 minutes)

### 1. Navigate to Assignment Detail

```bash
# Start frontend dev server (if not running)
cd frontend
npm run dev

# Open browser
open http://localhost:5173/assignments/test-assignment-id
```

**Expected**: Assignment detail page loads showing:
- Assignment metadata (ID, date, assignee, priority, status)
- SLA tracking with countdown timer
- Work item preview
- Empty comments section
- Empty checklist
- Timeline with "Assignment Created" event

### 2. Add a Comment

```typescript
// In browser console or via UI
const comment = await fetch('/functions/v1/assignments-comments-create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    assignment_id: 'test-assignment-id',
    text: 'Starting work on this assignment @supervisor'
  })
})
```

**Expected**:
- Comment appears immediately (optimistic update)
- @supervisor username highlighted as link
- Notification sent to supervisor
- Timeline shows "Comment Added" event

### 3. Import Checklist Template

```bash
# Via UI: Click "Import Checklist" → Select "Dossier Review Template"
```

**Expected**:
- Checklist items appear (e.g., "Review documents", "Verify data", "Prepare brief")
- Progress shows 0% (0/3 items completed)
- Timeline shows "Checklist Imported" event

### 4. Complete Checklist Items

```bash
# Via UI: Click checkbox next to "Review documents"
```

**Expected**:
- Checkbox marked complete
- Progress updates to 33% (1/3 completed)
- Completed timestamp and your name shown
- Timeline shows "Checklist Item Completed" event

### 5. Add Emoji Reaction

```bash
# Via UI: Hover over comment → Click 👍 reaction
```

**Expected**:
- 👍 badge appears with count "1"
- Hover shows your name in reaction tooltip
- Real-time update visible to other viewers

### 6. Escalate Assignment

```bash
# Via UI: Click "Escalate" button → Confirm
```

**Expected**:
- Escalation modal appears
- After confirmation:
  - Supervisor added as observer (visible in sidebar)
  - Notification sent to supervisor
  - Timeline shows "Assignment Escalated" event
  - Escalate button disabled (can't escalate twice)

### 7. Test Real-time Updates (Requires 2 Browser Windows)

```bash
# Window 1: Staff member view
open http://localhost:5173/assignments/test-assignment-id

# Window 2: Supervisor view (different user session)
open http://localhost:5173/assignments/test-assignment-id
```

**Actions**:
1. Window 1: Add comment "Testing real-time sync"
2. Window 2: Should see comment appear within 1 second
3. Window 2: React with ✅ emoji
4. Window 1: Should see reaction count update within 1 second
5. Window 1: Complete checklist item
6. Window 2: Should see progress percentage update within 1 second

**Expected**: All updates appear in both windows < 1 second latency

## Full Integration Test (30 minutes)

### Step 1: Setup Test Data

```bash
# Run seed script to create test assignment
cd backend
npm run seed:assignments
```

This creates:
- Test assignment with ID `test-001` assigned to user `staff@example.com`
- Supervisor user `supervisor@example.com` with supervisory access
- 2 checklist templates ("Dossier Review", "Ticket Processing")

### Step 2: Test Assignment Detail Display (FR-001 to FR-005)

```bash
# Login as staff@example.com
# Navigate to /assignments/test-001
```

**Verify**:
- [ ] Assignment ID displayed
- [ ] Assigned date/time shown
- [ ] Assignee name: "Test Staff"
- [ ] Priority badge: "High"
- [ ] Status indicator: "Assigned"
- [ ] SLA deadline shown
- [ ] Time remaining calculated correctly
- [ ] SLA percentage < 75% (safe zone, green indicator)
- [ ] Work item type: "Dossier"
- [ ] Work item title: "Test Dossier for Review"
- [ ] Work item ID: "DSR-2025-001"
- [ ] Content preview shows first 200 characters
- [ ] Required skills listed: "Document Review, Arabic Translation"

### Step 3: Test Comment Creation (FR-011, FR-012)

```bash
# Add comment with @mention
```

**Input**:
```
Reviewed initial documents. @supervisor please confirm priority level for this dossier.
```

**Verify**:
- [ ] Comment appears immediately (optimistic update)
- [ ] Comment text displayed correctly
- [ ] Author name: "Test Staff"
- [ ] Timestamp shows current time
- [ ] @supervisor rendered as clickable link
- [ ] Click @supervisor shows user profile tooltip
- [ ] Timeline shows "Comment Added" event
- [ ] Notification sent to supervisor (check notifications table)

### Step 4: Test Checklist Management (FR-013 to FR-013d)

**4a. Import Template**:
```bash
# Click "Import Checklist" → Select "Dossier Review Template"
```

**Verify**:
- [ ] Template modal shows 5 items
- [ ] All items imported with sequence preserved
- [ ] Progress shows 0% (0/5 completed)
- [ ] Each item has empty checkbox
- [ ] Timeline shows "Checklist Imported from Template: Dossier Review"

**4b. Add Manual Item**:
```bash
# Click "Add Item" → Enter "Custom verification step"
```

**Verify**:
- [ ] New item appears at bottom of list
- [ ] Progress shows 0% (0/6 completed now)
- [ ] Timeline shows "Checklist Item Added"

**4c. Complete Items**:
```bash
# Check off first 3 items
```

**Verify**:
- [ ] Each item shows completed timestamp
- [ ] Each item shows "Completed by: Test Staff"
- [ ] Progress updates: 50% (3/6 completed)
- [ ] Timeline shows 3 "Checklist Item Completed" events

**4d. Verify Separation from Comments**:
- [ ] Checklist section separate from Comments section
- [ ] Both visible simultaneously
- [ ] Can scroll checklist and comments independently

### Step 5: Test Reactions (FR-014 to FR-014a)

**5a. Add Reactions**:
```bash
# On first comment: Click 👍
# On second comment: Click ✅
# On second comment: Click ❤️
```

**Verify**:
- [ ] 👍 appears on first comment with count "1"
- [ ] ✅ and ❤️ appear on second comment each with count "1"
- [ ] Hover on 👍 shows "Test Staff"
- [ ] Click 👍 again removes reaction (toggle behavior)
- [ ] Count decrements to "0", badge disappears

**5b. Multiple Users (requires second session)**:
```bash
# Login as supervisor@example.com in incognito window
# Navigate to same assignment
# React with 👍 on first comment
```

**Verify**:
- [ ] Count updates to "2" in both windows < 1 second
- [ ] Hover shows both names: "Test Staff, Test Supervisor"
- [ ] Real-time update visible to staff user

### Step 6: Test @Mentions (FR-014b to FR-014e)

**6a. Create Mention**:
```bash
# Add comment: "@supervisor @staff_2 This needs urgent review"
```

**Verify**:
- [ ] Both usernames rendered as links
- [ ] Click @supervisor opens user profile
- [ ] Notifications sent to both users (check notifications table)
- [ ] Mentioned users have view permission (enforced by RLS)

**6b. Invalid Mention**:
```bash
# Add comment: "@nonexistent_user Please review"
```

**Verify**:
- [ ] Comment saved successfully
- [ ] @nonexistent_user NOT rendered as link (no match)
- [ ] No notification sent
- [ ] No error shown to user

**6c. Unauthorized Mention**:
```bash
# Add comment: "@admin_user Review needed"
# Where admin_user does not have view permission
```

**Verify**:
- [ ] Comment saved
- [ ] @admin_user NOT rendered as link
- [ ] No notification sent (server validation blocks it)

### Step 7: Test Escalation (FR-006 to FR-006d)

**7a. Trigger Escalation**:
```bash
# Click "Escalate" button
# Enter reason: "SLA approaching deadline, need supervisor input"
# Confirm
```

**Verify**:
- [ ] Escalation modal closes
- [ ] Supervisor added to "Observers" section
- [ ] Observer shows: "Test Supervisor (Supervisor)"
- [ ] Timeline shows "Assignment Escalated" event with reason
- [ ] Notification sent to supervisor
- [ ] Escalate button disabled/hidden
- [ ] Original assignee still "Test Staff" (unchanged)

**7b. Supervisor Actions (switch to supervisor session)**:
```bash
# Login as supervisor@example.com
# Navigate to /assignments/test-001
```

**Verify**:
- [ ] Assignment visible (RLS grants view permission via observer)
- [ ] All comments, checklist, timeline visible
- [ ] Action buttons visible: "Accept Assignment", "Reassign", "Continue Observing"
- [ ] Original assignee shown: "Test Staff"

**7c. Supervisor Accepts**:
```bash
# Click "Accept Assignment" → Confirm
```

**Verify**:
- [ ] Assignee changes to "Test Supervisor"
- [ ] Observer list updates (supervisor removed from observers)
- [ ] Timeline shows "Assignment Reassigned: Test Supervisor"
- [ ] Staff user sees update in real-time < 1 second
- [ ] Notification sent to original staff member

### Step 8: Test Assignment Completion (FR-007)

**8a. Mark Complete**:
```bash
# As current assignee, click "Mark Complete"
# Enter completion notes: "All documents reviewed and approved"
# Confirm
```

**Verify**:
- [ ] Status changes to "Completed"
- [ ] SLA countdown stops
- [ ] Completion timestamp shown
- [ ] Completed by: Current assignee name
- [ ] Timeline shows "Assignment Completed" event with notes
- [ ] Assignment removed from "My Assignments" list
- [ ] Detail page still accessible via direct URL
- [ ] Actions disabled (can't escalate/complete again)

**8b. Prevent Duplicate Completion**:
```bash
# Try to complete again (edge case)
```

**Verify**:
- [ ] "Mark Complete" button disabled
- [ ] Error shown if attempting via API directly
- [ ] Status remains "Completed" (no duplicate event)

### Step 9: Test Real-time Updates (FR-019 to FR-021c)

**Setup**: 2 browser windows (staff + supervisor)

**9a. SLA Countdown**:
- [ ] SLA timer updates every second in both windows
- [ ] When SLA crosses 75% threshold:
  - [ ] Status changes from "safe" (green) to "warning" (yellow)
  - [ ] Warning notification shown
  - [ ] Timeline shows "SLA Warning Threshold Reached"

**9b. Comment Real-time**:
```bash
# Window 1: Add comment
```
- [ ] Window 2: Comment appears < 1 second
- [ ] Proper RTL/LTR rendering if Arabic comment
- [ ] Timeline updates in both windows

**9c. Checklist Real-time**:
```bash
# Window 1: Complete checklist item
```
- [ ] Window 2: Checkbox updates < 1 second
- [ ] Window 2: Progress percentage updates
- [ ] Window 2: Timeline shows update

**9d. Reaction Real-time**:
```bash
# Window 2: React with 🎯
```
- [ ] Window 1: Reaction appears < 1 second
- [ ] Window 1: Count updates

**9e. Escalation Real-time**:
```bash
# Window 1: Escalate assignment
```
- [ ] Window 2: Observer added < 1 second
- [ ] Window 2: Timeline shows escalation
- [ ] Window 2: Notification toast appears

### Step 10: Test Access Control (FR-022 to FR-024)

**10a. Assignee Access**:
```bash
# Login as assignee (staff@example.com)
# Navigate to /assignments/test-001
```
- [ ] Full access (view + comment + checklist + actions)

**10b. Observer Access**:
```bash
# Login as observer (supervisor@example.com, after escalation)
# Navigate to /assignments/test-001
```
- [ ] View access granted
- [ ] Can comment
- [ ] Can react
- [ ] Can view checklist (but not modify until accepting)
- [ ] Observer actions available

**10c. Unauthorized Access**:
```bash
# Login as different user (staff_2@example.com)
# Navigate to /assignments/test-001
```
- [ ] Access denied (403 Forbidden)
- [ ] Error page shown: "You don't have permission to view this assignment"
- [ ] Redirect to /assignments after 3 seconds

**10d. Non-existent Assignment**:
```bash
# Navigate to /assignments/non-existent-id
```
- [ ] 404 error shown
- [ ] Message: "Assignment not found"
- [ ] Redirect to /assignments after 3 seconds

### Step 11: Test Navigation (FR-025 to FR-028)

**11a. Breadcrumbs**:
- [ ] Breadcrumbs show: "My Assignments > Assignment #test-001"
- [ ] Click "My Assignments" → navigates to /assignments
- [ ] Browser back button works correctly

**11b. Work Item Link**:
- [ ] "View Full Dossier" button visible
- [ ] Click → navigates to /dossiers/DSR-2025-001
- [ ] Back button returns to assignment detail

**11c. Deep Linking**:
- [ ] Direct URL /assignments/test-001 loads correctly
- [ ] Share URL with colleague → they can access (if permission granted)

### Step 12: Test Engagement Context & Related Tasks (FR-029 to FR-030)

**12a. View Engagement-Linked Assignment**:
```bash
# Navigate to assignment that's part of an engagement
# (e.g., test-engagement-assignment-001)
```

**Verify**:
- [ ] Engagement context banner displayed at top
- [ ] Banner shows: Engagement title, type, date
- [ ] Progress bar shows: "40% (2/5 tasks complete)"
- [ ] "View Full Engagement" link present
- [ ] "Show Kanban" button visible
- [ ] Related Tasks section shows 4 sibling tasks
- [ ] Each related task shows: Title, assignee, status, workflow stage
- [ ] Current assignment NOT listed in related tasks (only siblings)
- [ ] Can click on sibling task → navigate to that assignment detail

**12b. View Standalone Assignment**:
```bash
# Navigate to standalone assignment (from intake, no engagement)
# (e.g., test-standalone-assignment-001)
```

**Verify**:
- [ ] No engagement context banner (hidden)
- [ ] No "Show Kanban" button
- [ ] Related Tasks section empty or shows simple dossier-level tasks
- [ ] Page otherwise functions normally

**12c. Navigate Between Related Tasks**:
```bash
# On engagement-linked assignment, click first sibling task
```

**Verify**:
- [ ] Navigates to sibling assignment detail page
- [ ] Engagement context still visible (same engagement)
- [ ] Related tasks list updates (current assignment now excluded)
- [ ] Breadcrumbs update to new assignment ID
- [ ] Can navigate back via browser back button

### Step 13: Test Kanban Board (FR-031)

**13a. Open Kanban Modal**:
```bash
# On engagement-linked assignment, click "Show Kanban" button
```

**Verify**:
- [ ] Modal opens with full-screen kanban view
- [ ] Modal title shows engagement name
- [ ] Progress bar at top: "40% (2/5 complete)"
- [ ] 4 columns visible: "To Do", "In Progress", "Review", "Done"
- [ ] Each column shows count: "To Do (2)", "In Progress (2)", etc.
- [ ] Current assignment highlighted (⭐ or border)
- [ ] All 5 tasks visible across columns
- [ ] Each card shows: Title, assignee, SLA remaining, priority

**13b. Drag Task Between Columns**:
```bash
# Drag a "To Do" task card to "In Progress" column
```

**Verify**:
- [ ] Card moves visually during drag
- [ ] Drop zone highlighted in target column
- [ ] Card snaps into new column on drop
- [ ] Column counts update: "To Do (1)", "In Progress (3)"
- [ ] Progress bar updates: "40%" → "40%" (no completed tasks moved)
- [ ] Timeline on assignment detail shows "Workflow Stage Changed" event
- [ ] Database updated: workflow_stage = 'in_progress'

**13c. Real-time Kanban Updates (2 windows)**:
```bash
# Window 1: Open kanban modal for engagement
# Window 2: Open same kanban modal (different user)
```

**Actions**:
1. Window 1: Drag task from "In Progress" to "Done"
2. Window 2: Should see task move < 1 second
3. Window 2: Progress updates to "60% (3/5 complete)"
4. Window 1: Close modal, reopen → changes persisted

**Verify**:
- [ ] Real-time updates < 1 second latency
- [ ] No flickering or visual glitches
- [ ] Column counts accurate in both windows
- [ ] Progress percentage synchronized

**13d. Click Kanban Card to Navigate**:
```bash
# Click on any kanban card (not current assignment)
```

**Verify**:
- [ ] Modal closes
- [ ] Navigates to clicked assignment detail page
- [ ] New assignment loads with full detail
- [ ] Kanban still accessible from new assignment

**13e. Keyboard Navigation in Kanban**:
```bash
# Open kanban, press Tab to navigate
```

**Verify**:
- [ ] Tab moves focus between cards (top-to-bottom, left-to-right)
- [ ] Focus indicator visible on current card
- [ ] Enter opens focused card's detail page
- [ ] Arrow keys move focus within column
- [ ] Esc closes kanban modal
- [ ] Screen reader announces column changes

### Step 14: Test Workflow Stage Sync (FR-032)

**14a. Status Change Triggers Workflow Stage**:
```bash
# On assignment detail, change status from "assigned" to "in_progress"
```

**Verify**:
- [ ] workflow_stage automatically updates to 'in_progress'
- [ ] If engagement-linked: Kanban shows task in "In Progress" column
- [ ] Timeline shows "Status Changed" event (not separate workflow event)
- [ ] Trigger function executed (check database logs)

**14b. Manual Workflow Stage Change**:
```bash
# Open kanban, drag task from "In Progress" to "Review"
```

**Verify**:
- [ ] workflow_stage updates to 'review'
- [ ] Assignment status remains "in_progress" (not auto-changed)
- [ ] Task appears in "Review" column
- [ ] Staff can still work on assignment (status unchanged)

**14c. Completion Moves to Done**:
```bash
# Mark assignment as complete via "Mark Complete" button
```

**Verify**:
- [ ] status → "completed"
- [ ] workflow_stage → 'done' (via trigger)
- [ ] If engagement-linked: Kanban moves task to "Done" column
- [ ] Progress updates: "60%" → "80%" (4/5 complete)
- [ ] Real-time update visible to other viewers

### Step 15: Test Bilingual Support

**12a. Switch to Arabic**:
```bash
# Click language switcher → Select العربية
```

**Verify**:
- [ ] Page direction changes to RTL
- [ ] All UI text translated
- [ ] Assignment metadata labels in Arabic
- [ ] Timeline events in Arabic
- [ ] Action buttons in Arabic
- [ ] Comments preserve original language (user-generated)
- [ ] Timestamps formatted in Arabic locale

**15b. RTL Layout**:
- [ ] Comments right-aligned
- [ ] Avatars on right side
- [ ] Timeline line on right side
- [ ] Action buttons right-aligned
- [ ] Breadcrumbs RTL order

**15c. Engagement Context in Arabic**:
```bash
# Switch to Arabic, view engagement-linked assignment
```

**Verify**:
- [ ] Engagement context banner RTL
- [ ] Engagement title in Arabic (if bilingual engagement)
- [ ] Related tasks section RTL
- [ ] Kanban modal RTL (columns right-to-left)
- [ ] Drag-and-drop still functional in RTL mode

### Step 16: Test Accessibility (WCAG 2.1 AA)

**16a. Keyboard Navigation**:
- [ ] Tab through all interactive elements
- [ ] Focus indicators visible on all buttons/links
- [ ] Enter/Space activates buttons
- [ ] Esc closes modals
- [ ] Keyboard shortcut `E` triggers Escalate (with focus)
- [ ] Keyboard shortcut `C` focuses comment input

**16b. Screen Reader (VoiceOver/NVDA)**:
- [ ] Page title announced: "Assignment Detail: #test-001"
- [ ] Timeline announced as "feed" with X items
- [ ] New comments announced via aria-live="polite"
- [ ] SLA countdown updates announced every 30 seconds
- [ ] Checklist progress announced when item completed
- [ ] All buttons have accessible labels
- [ ] Images have alt text

**16c. Screen Reader for Kanban**:
```bash
# Open kanban modal with screen reader enabled
```

**Verify**:
- [ ] Modal announced: "Kanban board for {engagement name}"
- [ ] Columns announced as regions with counts
- [ ] Cards announced with title, assignee, SLA
- [ ] Drag-and-drop announced: "Moved {task} to {column}"
- [ ] Progress updates announced via aria-live

**16d. Color Contrast**:
- [ ] SLA safe (green) vs background: ratio > 4.5:1
- [ ] SLA warning (yellow) vs background: ratio > 4.5:1
- [ ] SLA breached (red) vs background: ratio > 4.5:1
- [ ] Text on all buttons readable

## Performance Validation

### Real-time Latency

```bash
# Measure latency using browser DevTools
# Network tab → Filter: WS (WebSocket)
```

**Targets**:
- [ ] Comment added → appears in other window: < 1 second
- [ ] Checklist toggled → updates in other window: < 1 second
- [ ] Reaction added → updates in other window: < 1 second
- [ ] Escalation → observer added in other window: < 1 second
- [ ] SLA countdown updates every 1 second (client-side only)

### Bundle Size

```bash
cd frontend
npm run build
```

**Targets**:
- [ ] Initial bundle: < 300 KB (gzipped)
- [ ] Assignment detail route chunk: < 50 KB (gzipped)
- [ ] i18n locale files: < 20 KB each (lazy loaded)

### Database Queries

```bash
# Check Supabase dashboard → Database → Performance Insights
```

**Targets**:
- [ ] Get assignment detail: < 100ms p95
- [ ] Add comment: < 50ms p95
- [ ] Toggle checklist: < 50ms p95
- [ ] All queries use indexes (no sequential scans)

## Edge Cases & Error Handling

### Network Interruption

```bash
# Disconnect network while viewing assignment
# Wait 5 seconds
# Reconnect network
```

**Verify**:
- [ ] Real-time connection lost indicator shown
- [ ] Attempting to comment shows "Offline" error
- [ ] After reconnect: Connection restored < 2 seconds
- [ ] Missed updates fetched and displayed
- [ ] Timeline shows all events (no gaps)

### Optimistic Update Failure

```bash
# Add comment with network throttled to fail
```

**Verify**:
- [ ] Comment appears immediately (optimistic)
- [ ] After failure: Comment removed
- [ ] Toast error shown: "Failed to post comment"
- [ ] Timeline does not show event

### Concurrent Edits

```bash
# Window 1 & 2: Both try to complete checklist item at same time
```

**Verify**:
- [ ] Both windows show optimistic update
- [ ] Server processes first request
- [ ] Second request succeeds (idempotent operation)
- [ ] Both windows show consistent state after sync

## Success Criteria

- ✅ All functional requirements (FR-001 to FR-028) validated
- ✅ All acceptance scenarios pass
- ✅ Real-time updates < 1 second latency
- ✅ Bilingual support (Arabic RTL + English LTR)
- ✅ WCAG 2.1 AA accessibility compliance
- ✅ Performance targets met
- ✅ Edge cases handled gracefully

---

**Status**: Quickstart complete ✅
**Next**: Execute /tasks to generate implementation tasks
