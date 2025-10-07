# Feature Specification: Full Engagement Kanban Board

**Feature Branch**: `016-implement-kanban`
**Created**: 2025-10-07
**Status**: Draft
**Input**: User description: "implement the full Kanban board functionality that would involve: 1. Creating a hook to fetch all assignments for this engagement 2. Uncommenting the EngagementKanbanDialog component 3. Implementing the drag-and-drop functionality to move tasks between workflow stages (todo → in_progress → review → done and/or cancelled) when developing the UI .. please use shadcn mcp to grap https://www.kibo-ui.com/components/kanban"

## Execution Flow (main)
```
1. Parse user description from Input
   → Feature involves Kanban board for engagement assignments ✓
2. Extract key concepts from description
   → Actors: Staff members managing assignments
   → Actions: View assignments, drag-and-drop to change workflow stages
   → Data: Assignments grouped by workflow stage
   → Constraints: Must work within engagement context ✓
3. For each unclear aspect:
   → Real-time updates using Supabase Realtime subscriptions ✓
   → Role-based stage transition validation (managers can skip, staff sequential) ✓
   → Dual SLA tracking (overall + per-stage) ✓
   → User-customizable notification preferences ✓
   → Default sort by creation date with customizable sort options ✓
4. Fill User Scenarios & Testing section ✓
5. Generate Functional Requirements ✓
6. Identify Key Entities ✓
7. Run Review Checklist
   → WARN "Spec has uncertainties - clarification needed on 4 items"
8. Return: SUCCESS (spec ready for planning after clarifications)
```

---

## Clarifications

### Session 2025-10-07
- Q: Should the Kanban board show real-time updates when other users move assignments? → A: Yes, real-time updates using Supabase Realtime subscriptions to immediately show changes when other users move assignments (live collaboration)
- Q: Should the system enforce sequential stage transitions, or can users skip stages? → A: Role-based rules - Different roles have different permissions (e.g., managers can skip stages, staff must follow sequential flow)
- Q: What happens to SLA timers and deadlines when assignments move between stages? → A: Dual SLA tracking - Overall assignment SLA from creation to completion, plus individual SLA targets per workflow stage
- Q: Should stage transitions via drag-and-drop trigger notifications? → A: User-customizable notification preferences for stage transitions (users can configure which stage changes trigger notifications for them)
- Q: How should assignments be sorted within each Kanban column? → A: Default sort by creation date (oldest first), with user-selectable sort options including SLA deadline, priority, and other criteria

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a staff member managing an engagement, I need to visualize all assignments related to this engagement in a Kanban board format so that I can quickly understand the status of work and move tasks through workflow stages by dragging and dropping them between columns.

### Acceptance Scenarios
1. **Given** I am viewing an engagement with 10 assignments across different workflow stages, **When** I open the Kanban board dialog, **Then** I see columns for each workflow stage (To Do, In Progress, Review, Done, Cancelled) with assignments displayed as cards in their respective columns

2. **Given** I see the Kanban board with assignments, **When** I drag an assignment card from "To Do" column to "In Progress" column, **Then** the assignment moves to the new column and the assignment's workflow stage is updated in the system

3. **Given** I am viewing the Kanban board, **When** another user in a different session moves an assignment to a different stage, **Then** I see the assignment card immediately move to the new column in real-time without needing to refresh the page

4. **Given** I have an assignment in "In Progress" stage with an overall SLA countdown and a stage-specific SLA, **When** I drag it to "Done" column, **Then** the assignment is marked as complete, the overall SLA timer stops, and both the overall SLA status and the "In Progress" stage SLA status are recorded

5. **Given** I am a staff member (non-manager) and attempt to drag an assignment from "To Do" directly to "Done", **When** I release the drag, **Then** the system prevents the move and shows a validation message that I must move through stages sequentially (To Do → In Progress → Review → Done)

5a. **Given** I am a manager and attempt to drag an assignment from "To Do" directly to "Done", **When** I release the drag, **Then** the system allows the move and updates the assignment to "Done" stage

6. **Given** assignments are displayed in the Kanban board, **When** I click on an assignment card, **Then** I am taken to the assignment detail page for that assignment

7. **Given** I am viewing the Kanban board in Arabic (RTL mode), **When** I interact with the board, **Then** the columns and drag-and-drop functionality work correctly in right-to-left layout

8. **Given** I am viewing the Kanban board on a mobile device, **When** I attempt to drag assignments, **Then** touch-based drag-and-drop works smoothly with adequate touch targets

9. **Given** I have configured my notification preferences to receive alerts when assignments move to "Review" or "Done" stages, **When** another user moves an assignment I'm observing to "Review" stage, **Then** I receive a notification about the stage change

9a. **Given** I have disabled notifications for stage changes in my preferences, **When** assignments are moved between stages, **Then** I do not receive any notifications but can still see the real-time updates on the Kanban board

10. **Given** I am viewing the Kanban board with multiple assignments in the "To Do" column, **When** I open the board, **Then** assignments are sorted by creation date (oldest first) by default

10a. **Given** I am viewing the Kanban board, **When** I select "SLA Deadline" from the sort dropdown, **Then** assignments within each column re-sort to show those closest to SLA breach at the top

10b. **Given** I am viewing the Kanban board, **When** I select "Priority" from the sort dropdown, **Then** assignments within each column re-sort to show high priority assignments at the top, followed by medium, then low priority

### Edge Cases
- What happens when I try to move an assignment to "Done" but it has incomplete checklist items or dependencies?
- How does the system handle drag operations that are cancelled mid-way (user releases outside a valid drop zone)?
- What happens when the engagement has 50+ assignments? Should there be pagination or infinite scroll within columns?
- What happens when I try to move a cancelled assignment to another stage?
- What happens if there are network errors during a drag-and-drop operation?
- What happens when a staff member tries to skip stages but lacks manager permissions?
- How does the system handle role changes - if a user's role changes while they have the Kanban board open?
- What happens when assignments have the same creation date/priority/SLA deadline in a sorted column?
- How is the user's selected sort preference persisted (per session, per user, per engagement)?

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST display all assignments for a specific engagement organized by their current workflow stage (To Do, In Progress, Review, Done, Cancelled)

- **FR-002**: System MUST allow users to drag assignment cards from one workflow stage column to another workflow stage column

- **FR-003**: System MUST update the assignment's workflow stage immediately when a drag-and-drop operation completes successfully

- **FR-004**: System MUST display assignment cards with key information visible: assignment title, assignee name/avatar, priority indicator, overall SLA countdown, and current stage SLA indicator

- **FR-005**: System MUST provide visual feedback during drag operations (e.g., card follows cursor, drop zones highlight)

- **FR-006**: System MUST support touch-based drag-and-drop for mobile devices with minimum 44x44px touch targets

- **FR-007**: System MUST work correctly in both LTR (English) and RTL (Arabic) layouts

- **FR-008**: Users MUST be able to click on an assignment card to navigate to the full assignment detail page

- **FR-009**: System MUST handle errors gracefully if a stage transition fails (e.g., network error) and revert the card to its original position

- **FR-010**: System MUST enforce role-based stage transition validation: staff members must move assignments through stages sequentially (To Do → In Progress → Review → Done), while managers can skip stages and move assignments directly to any stage

- **FR-010a**: System MUST track two types of SLA timers for each assignment: (1) an overall assignment SLA from creation to completion, and (2) individual stage-specific SLA targets that track time spent in each workflow stage

- **FR-011**: System MUST respect user notification preferences when stage transitions occur, allowing users to configure which stage changes (e.g., moves to "Review", "Done", or all transitions) trigger notifications for assignments they are assigned to or observing

- **FR-012**: System MUST use Supabase Realtime subscriptions to immediately display assignment moves made by other users in real-time without requiring manual refresh

- **FR-013**: System MUST sort assignments within each column by creation date (oldest first) by default, and provide a sort dropdown allowing users to re-order by SLA deadline (most urgent first), priority level (high to low), or creation date

- **FR-014**: System MUST display an appropriate message when an engagement has no assignments

- **FR-015**: System MUST handle large numbers of assignments (50+) without performance degradation [NEEDS CLARIFICATION: Should there be pagination, virtual scrolling, or "load more" within columns?]

### Key Entities
- **Engagement**: A project or initiative that has multiple assignments associated with it; the context for the Kanban board view
- **Assignment**: A work item that belongs to an engagement, has a workflow stage (To Do, In Progress, Review, Done, Cancelled), an assignee, priority level, SLA deadline, and other metadata
- **Workflow Stage**: The current status category of an assignment (To Do, In Progress, Review, Done, Cancelled); determines which Kanban column displays the assignment

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain (4 clarifications needed)
- [ ] Requirements are testable and unambiguous (partially - needs clarifications)
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked (4 items need clarification)
- [x] User scenarios defined
- [x] Requirements generated (15 functional requirements)
- [x] Entities identified (3 key entities)
- [ ] Review checklist passed (blocked on clarifications)

---

## Required Clarifications Before Planning

1. **Large Dataset Handling**: For engagements with 50+ assignments, what UX pattern should be used (pagination, virtual scrolling, "load more" buttons)?
