# Feature Specification: Full Assignment Detail Page

**Feature Branch**: `014-full-assignment-detail`
**Created**: 2025-10-03
**Status**: Draft
**Input**: User description: "Full Assignment Detail Page with comments and progress and interactions. Build proper assignment detail flow: 1. Click assignment → /assignments/{id} 2. Shows assignment metadata (SLA, status, actions) 3. Embeds/links to actual work item content 4. Users can escalate, mark complete, or view full dossier/ticket. Needs: Backend: Edge function GET /assignments/{id}, Frontend: Route, hook, and component"

## Execution Flow (main)
```
1. Parse user description from Input
   → Feature: Assignment detail view with metadata, actions, and work item content
2. Extract key concepts from description
   → Actors: Staff members with assignments
   → Actions: View details, escalate, mark complete, navigate to work item
   → Data: Assignment metadata, SLA tracking, comments, progress updates
   → Constraints: Assignment must exist, user must have permission to view
3. For each unclear aspect:
4. Fill User Scenarios & Testing section
   → Primary flow: Staff views assignment to understand requirements and take action
5. Generate Functional Requirements
   → View assignment details, track SLA, perform actions, add comments/updates
6. Identify Key Entities
   → Assignment, Work Item (dossier/ticket), Comments, Status History
7. Run Review Checklist
   → WARN "Spec has uncertainties regarding comment permissions and progress tracking"
8. Return: SUCCESS (spec ready for planning after clarifications)
```

---

## Clarifications

### Session 2025-10-03
- Q: Who can add comments to an assignment? → A: Assigned staff member + supervisor + anyone with view permission to the assignment
- Q: How should progress tracking be implemented for assignments? → A: Checklist-based progress tracking (manual items + template import) + separate freeform comments section
- Q: What types of interactions should be supported beyond comments and checklist items? → A: Reactions + @mentions
- Q: What should happen when an escalation is triggered (manually or by SLA breach)? → A: Escalation creates supervisor as observer + sends notification, supervisor can later accept/reassign if needed
- Q: What is the acceptable maximum latency for real-time updates (SLA countdown, new comments, status changes)? → A: <1 second (near-instant)
- Q: How should assignments relate to engagements and show context? → A: Assignment can be part of engagement (multi-task event) or standalone (from intake). Show engagement context, related tasks, progress across all tasks, and kanban view for workflow visualization

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story
As a staff member with assigned work items, when I click on an assignment from my assignments list, I need to see comprehensive details about that assignment including SLA deadlines, current status, assignment history, and available actions. **If this assignment is part of a larger engagement (e.g., preparing for a minister visit), I want to see the engagement context, other related tasks, overall progress, and a kanban view showing where all tasks stand in the workflow.** I should be able to escalate if needed, mark the assignment as complete, add progress comments, view interaction history, and easily navigate to the full work item (dossier, ticket, or engagement) to perform the actual work.

### Acceptance Scenarios

1. **Given** I am logged in as a staff member with an active assignment, **When** I click on the assignment card from My Assignments page, **Then** I am taken to a detail page showing assignment metadata (assigned date, SLA deadline, time remaining, priority, status, assignee name)

2. **Given** I am viewing an assignment detail page, **When** I review the assignment information, **Then** I can see the work item title, type, and a summary/preview of the work content without leaving the assignment view

3. **Given** I am viewing an assignment that is approaching its SLA deadline (75%+ elapsed), **When** I look at the SLA indicator, **Then** I see a clear warning visualization showing time remaining and percentage of SLA consumed

4. **Given** I am viewing an assignment detail page, **When** I need to perform the actual work, **Then** I can click a link/button to navigate to the full dossier or ticket detail page

5. **Given** I am viewing an assignment that is overdue or at risk, **When** I click the "Escalate" action, **Then** the assignment is escalated to my supervisor, the supervisor is added as an observer, a notification is sent to the supervisor, escalation is recorded in the assignment history, and I remain the primary assignee

5a. **Given** my supervisor is viewing an escalated assignment as an observer, **When** they review the escalation, **Then** they can choose to accept the assignment (become the new assignee), reassign it to another staff member, or continue as an observer without taking action

6. **Given** I have completed work on my assignment, **When** I click the "Mark Complete" action, **Then** the assignment status changes to completed, the SLA tracking stops, and the assignment is removed from my active assignments list

7. **Given** I am viewing an assignment detail page, **When** I add a progress comment, **Then** the comment is saved with timestamp and my user information, and appears in the interaction history

7a. **Given** I am viewing an assignment detail page, **When** I add a checklist item manually, **Then** the item is added to the assignment's checklist with incomplete status

7b. **Given** I am viewing an assignment detail page with no checklist, **When** I import a checklist template, **Then** all items from the template are added to the assignment's checklist with incomplete status

7c. **Given** I am viewing an assignment with a checklist, **When** I mark a checklist item as complete, **Then** the item shows as completed with timestamp and my name, and the overall progress percentage updates

7d. **Given** I am viewing an assignment with a checklist, **When** I review the progress section, **Then** I see both the checklist with completion status and the separate freeform comments section

7e. **Given** I am viewing a comment on an assignment, **When** I add an emoji reaction (e.g., 👍), **Then** the reaction is recorded and displayed with a count showing how many users reacted with that emoji

7f. **Given** I am writing a comment, **When** I use @username syntax to mention another user with view permission, **Then** the mentioned user receives a notification and the username appears as a clickable link in the comment

8. **Given** I am viewing an assignment detail page, **When** I review the interaction history, **Then** I see a chronological timeline of all events including assignment creation, status changes, comments, checklist updates, reactions, escalations, and completion

9. **Given** I am viewing an assignment with escalation history, **When** I review the details, **Then** I can see who escalated it, when, to whom, and the current escalation status

10. **Given** I try to access an assignment that doesn't exist or I don't have permission to view, **When** I navigate to that assignment URL, **Then** I see an appropriate error message and am redirected to my assignments list

### Engagement Context & Related Tasks

11. **Given** I am viewing an assignment that is part of an engagement (e.g., "Prepare briefing for Minister Visit"), **When** I look at the top of the page, **Then** I see an engagement context banner showing the engagement title, type, date, and overall progress (e.g., "2 of 5 tasks complete - 40%")

11a. **Given** I am viewing an engagement-linked assignment, **When** I click "View Full Engagement" in the context banner, **Then** I navigate to the engagement detail page with the Tasks tab selected

11b. **Given** I am viewing an engagement-linked assignment, **When** I scroll to the "Related Tasks" section, **Then** I see all other assignments for the same engagement with their assignee, status, and workflow stage

11c. **Given** I am viewing a related task in the list, **When** I click on it, **Then** I navigate to that assignment's detail page

12. **Given** I am viewing an assignment that is part of an engagement, **When** I click "Show Kanban" button, **Then** a kanban board modal opens showing all engagement tasks across 4 workflow stages: To Do, In Progress, Review, Done

12a. **Given** I am viewing the kanban board, **When** I look at the columns, **Then** my current assignment is highlighted with a visual indicator (e.g., star icon or border)

12b. **Given** I am viewing the kanban board, **When** I drag a task card from "To Do" to "In Progress", **Then** the task's workflow stage updates, the assignment status changes, and the change is reflected in real-time for all viewers

12c. **Given** I am viewing the kanban board, **When** I click on any task card, **Then** I navigate to that assignment's detail page

12d. **Given** I am viewing the kanban board, **When** another user moves a task to a different column, **Then** I see the card move in real-time within 1 second

13. **Given** I am viewing a standalone assignment (not part of engagement), **When** I look at the page, **Then** I do NOT see the engagement context banner or "Show Kanban" button

13a. **Given** I am viewing a standalone assignment that shares the same dossier with other assignments, **When** I scroll to "Related Tasks", **Then** I see other assignments for the same dossier in a simple list format (no kanban)

### Edge Cases

- What happens when an assignment is escalated while I'm viewing the detail page? (Real-time update expected - observer added notification should appear)
- What happens if I try to mark an assignment complete that has already been marked complete by another user? (Optimistic locking conflict detection)
- What happens when the SLA deadline passes while I'm viewing the assignment detail page? (Real-time countdown expected)
- How does the system handle comments or interactions being added by other users while I'm viewing the page? (Real-time updates)
- What happens if the underlying work item (dossier/ticket) is deleted while the assignment still exists? (Orphaned assignment handling)
- What happens when I try to escalate an assignment that has already been escalated? (Prevent duplicate escalation)
- What happens when a supervisor accepts/reassigns an escalated assignment while the original assignee is viewing it? (Real-time update with notification)
- How does the system behave if I navigate away and return to an assignment detail page? (State should be preserved)

## Requirements

**Note**: API endpoint specifications (HTTP methods, paths, request/response schemas) are defined in `contracts/api-spec.yaml`. Functional requirements below describe capabilities; refer to contract specification for technical implementation details.

### Functional Requirements

**Assignment Detail Display**
- **FR-001**: System MUST display assignment metadata including assignment ID, assigned date/time, assignee name, priority level, current status, and assignment source
- **FR-002**: System MUST display SLA tracking information including deadline date/time, time remaining, percentage of SLA elapsed, and visual indicator of SLA health (safe/warning/breached)
- **FR-003**: System MUST display work item information including work item type (dossier/ticket/position/task), work item title, and work item ID
- **FR-004**: System MUST provide a summary or preview of the work item content without requiring navigation to the full work item
- **FR-005**: System MUST display required skills or qualifications associated with the assignment

**Assignment Actions**
- **FR-006**: System MUST allow users to escalate an assignment to their supervisor or designated escalation contact
- **FR-006a**: When an assignment is escalated (manually or by SLA breach), system MUST add the supervisor as an observer with view permission to the assignment
- **FR-006b**: When an assignment is escalated, system MUST send a notification to the supervisor
- **FR-006c**: System MUST keep the original assignee as the primary responsible party after escalation
- **FR-006d**: System MUST allow the supervisor (observer) to optionally accept the assignment (becoming the new assignee), reassign to another staff member, or continue observing without taking action
- **FR-007**: System MUST allow users to mark an assignment as complete when work is finished
- **FR-008**: System MUST provide a clear call-to-action to navigate to the full work item detail page (dossier/ticket)
- **FR-009**: System MUST prevent duplicate actions (e.g., cannot mark complete twice, cannot escalate already escalated assignment)
- **FR-010**: System MUST record all actions taken with timestamp and user information for audit trail

**Comments and Progress Tracking**
- **FR-011**: System MUST allow the assigned staff member, their supervisor, and anyone with view permission to the assignment to add freeform progress comments or notes
- **FR-012**: System MUST display all comments in chronological order with author name and timestamp
- **FR-013**: System MUST support checklist-based progress tracking where users can add individual checklist items manually
- **FR-013a**: System MUST allow users to import checklist items from predefined checklist templates
- **FR-013b**: System MUST track completion status of each checklist item (completed/incomplete) with timestamp and user who completed it
- **FR-013c**: System MUST calculate and display overall progress percentage based on completed vs total checklist items
- **FR-013d**: System MUST maintain both checklist progress tracking and freeform comments as separate but complementary features

**Reactions and Mentions**
- **FR-014**: System MUST allow users to add emoji reactions to comments (e.g., 👍, ✅, ❓, ❤️)
- **FR-014a**: System MUST display reaction counts and allow users to see who reacted with each emoji
- **FR-014b**: System MUST support @mention functionality in comments to tag and notify other users
- **FR-014c**: System MUST send notifications to users when they are @mentioned in a comment
- **FR-014d**: System MUST validate that @mentioned users have view permission to the assignment before allowing the mention
- **FR-014e**: System MUST display @mentioned usernames as clickable links showing user profile information

**Interaction History and Timeline**
- **FR-015**: System MUST display a complete interaction history showing all events related to the assignment including creation, status changes, comments, escalations, and completion
- **FR-016**: System MUST display timeline events in chronological order with timestamps, event type, and actor information
- **FR-017**: System MUST highlight critical events such as SLA warnings, breaches, and escalations in the timeline
- **FR-018**: System MUST show escalation details including who escalated, when, reason (if provided), and escalation recipient

**Real-time Updates**
- **FR-019**: System MUST update SLA countdown in real-time without requiring page refresh with maximum latency of <1 second
- **FR-020**: System MUST reflect status changes made by other users in real-time with maximum latency of <1 second
- **FR-021**: System MUST show new comments or interactions added by other users in real-time with maximum latency of <1 second
- **FR-021a**: System MUST display new checklist item completions by other users in real-time with maximum latency of <1 second
- **FR-021b**: System MUST update escalation status and observer additions in real-time with maximum latency of <1 second
- **FR-021c**: System MUST show new reactions and @mentions in real-time with maximum latency of <1 second

**Access Control and Permissions**
- **FR-022**: System MUST only allow users to view assignments they are assigned to or have supervisory access to
- **FR-023**: System MUST prevent users from modifying assignments they don't own unless they have supervisor privileges
- **FR-024**: System MUST display appropriate error messages when users attempt to access assignments without permission

**Navigation and User Experience**
- **FR-025**: System MUST provide breadcrumb navigation showing path from My Assignments to current assignment
- **FR-026**: System MUST provide a "Back to My Assignments" navigation option
- **FR-027**: System MUST deep-link to specific assignments via URL pattern /assignments/{id}
- **FR-028**: System MUST handle non-existent assignment IDs gracefully with appropriate error messaging

**Engagement Context & Related Tasks**
- **FR-029**: System MUST display engagement context banner when assignment is linked to an engagement
- **FR-029a**: Engagement context banner MUST show engagement title, type, date, and overall progress (% of tasks complete)
- **FR-029b**: System MUST provide link from context banner to full engagement detail page
- **FR-030**: System MUST display "Related Tasks" section showing all sibling assignments (same engagement or dossier)
- **FR-030a**: Each related task MUST show assignee name, status, workflow stage, and SLA indicator
- **FR-030b**: Related tasks MUST be clickable to navigate to their detail pages
- **FR-030c**: System MUST calculate and display engagement-level progress: X of Y tasks complete, percentage
- **FR-031**: System MUST provide "Show Kanban" button for engagement-linked assignments
- **FR-031a**: Kanban board MUST display 4 workflow columns: To Do, In Progress, Review, Done
- **FR-031b**: System MUST highlight current assignment in kanban board with visual indicator
- **FR-031c**: System MUST support drag-and-drop to move tasks between kanban columns
- **FR-031d**: Moving task in kanban MUST update workflow_stage and sync with assignment status
- **FR-031e**: Kanban updates MUST be real-time across all viewers within 1 second latency
- **FR-032**: System MUST automatically sync workflow_stage with assignment status changes
- **FR-032a**: Status "assigned" maps to workflow_stage "todo"
- **FR-032b**: Status "in_progress" maps to workflow_stage "in_progress"
- **FR-032c**: Status "completed" maps to workflow_stage "done"
- **FR-033**: System MUST NOT display engagement context or kanban for standalone assignments (no engagement link)
- **FR-033a**: For standalone assignments with same dossier, system MUST show simple related tasks list without kanban

### Key Entities

- **Assignment**: Represents a work item assigned to a staff member with SLA tracking, status, priority, and metadata. Contains assignment ID, work item reference, assignee reference, assigned timestamp, SLA deadline, status (pending/assigned/in_progress/completed/cancelled), priority level, escalation status, **engagement_id (optional link to parent engagement), and workflow_stage (todo/in_progress/review/done for kanban visualization)**

- **Work Item**: The underlying content being worked on (dossier, ticket, position, task, or engagement). Referenced by assignment but displayed in summary form on the assignment detail page. Contains work item ID, type, title, and content preview

- **Engagement**: A specific event or activity within a dossier (e.g., meeting, workshop, site visit) that can have multiple related assignments. Contains engagement ID, dossier reference, title, type, date, location, and description. Serves as parent container for multi-task workflows

- **Assignment Comment**: Freeform progress notes or updates added by the assigned staff member, their supervisor, or any user with view permission to the assignment. Contains comment text (with support for @mentions), author information, timestamp, list of emoji reactions with counts, and reference to parent assignment

- **Comment Reaction**: Emoji reaction to a comment. Contains emoji type, user who reacted, timestamp, and reference to parent comment

- **Comment Mention**: Reference to a user mentioned in a comment using @username syntax. Contains mentioned user reference, comment reference, and notification status

- **Assignment Checklist Template**: Predefined set of checklist items that can be imported into an assignment. Contains template ID, template name, template description, list of checklist item texts, and applicable work item types

- **Assignment Checklist Item**: Individual task or step within an assignment's progress checklist. Contains item text, completion status (completed/incomplete), order/sequence, completion timestamp (if completed), user who completed it (if completed), and reference to parent assignment

- **Assignment Event**: Historical record of actions taken on an assignment. Contains event type (created/status_changed/escalated/completed/commented), timestamp, actor information, and event details

- **Escalation**: Record of assignment escalation including escalation trigger (manual/SLA breach), escalation timestamp, escalating user, supervisor (observer) user, original assignee, escalation reason, supervisor action taken (accepted/reassigned/observing), and resolution timestamp

- **Assignment Observer**: User added as an observer to an assignment (typically supervisor after escalation). Contains user reference, assignment reference, added timestamp, observer role (supervisor/other), and can view all assignment details and optionally take action (accept/reassign)

- **SLA Tracking**: Service level agreement information for the assignment including target deadline, elapsed time, remaining time, warning threshold (75%), breach status, and warning notification history

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

### Non-Functional Requirements
- **Performance**: Real-time updates MUST have maximum latency of <1 second measured end-to-end (user action → database update → WebSocket broadcast → UI render complete) for: SLA countdown, comments, status changes, checklist updates, reactions, escalations, kanban task movements
- **Performance - Kanban**: Drag-and-drop operations in kanban board MUST provide instant visual feedback (<100ms optimistic UI update), followed by server confirmation and database persistence within 1 second (end-to-end)
- **Scalability**: Assignment detail page MUST support concurrent viewing by assignee + multiple observers without performance degradation
- **Scalability - Engagement**: Kanban board MUST efficiently render engagements with up to 50 related assignments without UI lag
- **Reliability**: Real-time subscription mechanism MUST automatically reconnect on network interruption with <2 second recovery time
- **Reliability - Kanban**: Failed drag-and-drop operations MUST rollback visually and display error message, preserving original task position
- **Observability**: System MUST log all assignment actions (escalate, complete, comment, checklist updates, workflow stage changes) with timestamp and user for audit trail
- **Usability**: Engagement context MUST be visually distinct (banner/card) to clearly differentiate engagement-linked vs standalone assignments
- **Accessibility - Kanban**: Kanban board MUST support keyboard-only drag-and-drop (arrow keys to move tasks between columns) and screen reader announcements for column changes

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities resolved via clarification session
- [x] User scenarios defined and expanded
- [x] Requirements generated with measurable criteria
- [x] Entities identified and detailed
- [x] Review checklist passed

---
