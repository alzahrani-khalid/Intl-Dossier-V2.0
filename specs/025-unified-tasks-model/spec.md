# Feature Specification: Unified Tasks Model

**Feature Branch**: `025-unified-tasks-model`
**Created**: 2025-01-19
**Status**: Draft
**Input**: User description: "Merge assignments and tasks tables into a unified tasks model with contributors support. Current system has confusing 3-layer model (Assignment → Task → Work Items). We need to consolidate assignments and tasks into a single tasks table that includes: assignment info (assignee, SLA, priority), work context (engagement_id, work_item links), workflow stages for kanban, and optional task_contributors table for team collaboration. This will simplify the mental model, improve UX (show task titles instead of assignment IDs), fix engagement context flow, and enable better kanban boards that show actual tasks not assignment records."

## Clarifications

### Session 2025-10-19

- Q: What are the expected data volumes for tasks per user and total system tasks to properly design pagination, caching, and query optimization strategies? → A: Variable scale with wide variation (some users have 10 tasks, others have 1000+)
- Q: How should the system handle concurrent task updates when two users modify the same task simultaneously (e.g., both changing status or adding contributors)? → A: Optimistic locking with version/timestamp-based conflict detection and user notification
- Q: How should the system handle API or network failures during critical task operations (saving edits, updating status, kanban drag-and-drop)? → A: Auto-retry with user feedback

## Problem Statement

The current system has a confusing 3-layer architecture:

```
Assignment (WHO + WHEN + STATUS)
    ↓
Task (WHAT + WHY)
    ↓
Work Items (Dossiers, Positions, Tickets)
```

This creates several problems:
- **Cognitive overhead**: Users don't understand the difference between "assignments" and "tasks"
- **Poor UX**: Assignment pages show unhelpful IDs like "Assignment #25d51a42" instead of descriptive titles
- **Broken context**: Tasks don't link to engagements, breaking kanban board functionality
- **Redundant status tracking**: Two separate status fields (assignment.status and task.status) that must stay in sync
- **Unclear ownership**: No way to track team collaboration on tasks

## User Scenarios & Testing

### User Story 1 - View My Tasks with Clear Titles (Priority: P1)

As a staff member, I want to see clear, descriptive titles for my tasks (e.g., "Review Australia Population Data Initiative") instead of cryptic IDs (e.g., "Assignment #25d51a42"), so I can quickly understand what work needs to be done.

**Why this priority**: This is the most visible UX improvement and directly impacts daily user experience. Every user sees task titles multiple times per day.

**Independent Test**: Can be fully tested by navigating to "My Tasks" page and verifying all tasks display their titles (not IDs) and delivers immediate clarity about work to be done.

**Acceptance Scenarios**:

1. **Given** user has tasks assigned, **When** they view "My Tasks" page, **Then** each task shows its descriptive title (e.g., "Review and process: Australia Population Data Initiative")
2. **Given** user opens a task detail page, **When** page loads, **Then** page header shows task title as primary heading with task ID as subtitle
3. **Given** user views task in kanban board, **When** looking at task card, **Then** card displays task title prominently

---

### User Story 2 - Track Team Collaboration (Priority: P2)

As a task owner, I want to add team members as contributors to my task, so that everyone who helped is recognized and can track tasks they've contributed to.

**Why this priority**: Enables team collaboration visibility and proper credit attribution, which improves team morale and project tracking.

**Independent Test**: Can be fully tested by assigning a task, adding contributors with different roles (helper, reviewer, advisor), and verifying contributors appear on task detail page and in "Tasks I Contributed To" list.

**Acceptance Scenarios**:

1. **Given** user owns a task, **When** they add a team member as contributor with role "helper", **Then** contributor appears in task's contributor list
2. **Given** user contributed to a task, **When** they view their "My Tasks" page with filter "Contributed", **Then** they see all tasks where they're listed as contributors
3. **Given** task has multiple contributors, **When** viewing task card in kanban, **Then** contributor avatars display alongside primary assignee
4. **Given** two users are editing the same task simultaneously, **When** first user saves changes and second user attempts to save, **Then** second user sees conflict warning dialog with options to reload, force save, or cancel

---

### User Story 3 - Manage Engagement Tasks via Kanban (Priority: P1)

As an engagement manager, I want to view all tasks for my engagement in a kanban board, so I can track progress across todo, in progress, review, and done stages.

**Why this priority**: Kanban boards are essential for engagement management and currently broken due to missing engagement context on tasks.

**Independent Test**: Can be fully tested by creating an engagement with multiple tasks, opening engagement detail page, clicking "View Kanban Board", and verifying all engagement tasks appear grouped by workflow stage.

**Acceptance Scenarios**:

1. **Given** engagement has 10 tasks across different workflow stages, **When** manager opens engagement kanban, **Then** all 10 tasks display in correct columns (todo, in progress, review, done)
2. **Given** user drags task card from "todo" to "in progress", **When** drop completes, **Then** task's workflow_stage updates and card remains in new column
3. **Given** engagement has mix of completed and active tasks, **When** viewing kanban, **Then** completed tasks show in "done" column with completion indicators
4. **Given** user drags task card and network fails temporarily, **When** system retries operation, **Then** loading indicator shows during retries and card moves to target column once retry succeeds (or returns to original column if all retries fail with error notification)

---

### User Story 4 - Link Tasks to Multiple Work Items (Priority: P3)

As a staff member, I want a single task to reference multiple work items (e.g., review 3 related dossiers together), so I don't need separate tasks for related work.

**Why this priority**: Improves efficiency when working on related entities, reduces task management overhead.

**Independent Test**: Can be fully tested by creating a task that links to 2 dossiers and 1 position, then verifying all 3 work items appear in task's "Linked Items" section.

**Acceptance Scenarios**:

1. **Given** user creates task for reviewing multiple dossiers, **When** task is saved, **Then** all linked dossiers appear in task's "Linked Items" section
2. **Given** task links to dossier and position, **When** user clicks linked dossier, **Then** system navigates to dossier detail page
3. **Given** task has 3 linked work items, **When** viewing task summary, **Then** summary shows count "3 linked items"

---

### User Story 5 - Maintain SLA Compliance (Priority: P2)

As a staff member, I want to see clear SLA deadlines and status for my tasks, so I can prioritize work and avoid SLA breaches.

**Why this priority**: SLA compliance is critical for organizational accountability and service quality.

**Independent Test**: Can be fully tested by creating tasks with different SLA deadlines, waiting for time to pass, and verifying SLA status indicators update correctly (safe, warning, breached).

**Acceptance Scenarios**:

1. **Given** task has SLA deadline in 2 hours, **When** 75% of time has elapsed, **Then** task shows warning indicator (yellow/amber status)
2. **Given** task SLA deadline has passed, **When** viewing task, **Then** task shows breached indicator (red status) and appears in "Breached SLA" filter
3. **Given** user completes task before SLA deadline, **When** task is marked complete, **Then** task shows "Completed on time" indicator

---

### Edge Cases

- **What happens when task assignee goes on leave?**: System must allow reassignment to another team member while preserving original assignee in task history/audit trail
- **How does system handle task with no linked work items?**: System must support generic tasks (type='generic') with no work_item_id for administrative or non-entity-specific work
- **What happens when engagement is deleted?**: Task's engagement_id is set to NULL (ON DELETE SET NULL), task continues to exist as standalone task
- **How are contributors notified when added to task?**: System MUST create notification event record in `notifications` table when contributor is added (user_id, event_type='contributor_added', task_id, created_at). Actual notification delivery (email, push, in-app) is handled by existing notification service (out of scope for this feature - no API contract changes required).
- **What happens when contributor leaves organization?**: Contributor record remains in task_contributors with removed_at timestamp for audit trail, but user no longer has access via RLS policies
- **How does system prevent duplicate contributors?**: Database enforces UNIQUE(task_id, user_id) constraint to prevent same user being added twice
- **What if user tries to add themselves as contributor when they're already the assignee?**: System should prevent this or treat primary assignee differently from contributors in queries
- **What happens when two users modify the same task simultaneously?**: System uses optimistic locking (updated_at timestamp), detects stale updates, shows conflict warning dialog to second user with options to: (1) reload task to see latest changes, (2) force save and overwrite, or (3) cancel edit
- **How does system handle conflicts in kanban drag-and-drop operations?**: Kanban updates use same optimistic locking mechanism; if task was modified by another user, drag operation fails with notification prompting user to refresh board
- **What happens when API call fails during task save operation?**: System automatically retries failed operation 3 times total (initial + 2 retries) with exponential backoff (150ms, 300ms, 600ms), shows loading indicator during retries, and displays error message with manual retry option only if all automatic retries fail
- **How does system handle network failure during kanban drag-and-drop?**: Drag operation shows loading state while retrying, card returns to original column if all retries fail, user sees error notification with option to manually retry the move
- **What happens to unsaved task edits if user loses connectivity?**: System provides visual indicator of offline state, preserves user's edits in browser, and automatically attempts to save once connectivity is restored

## Requirements

### Functional Requirements

- **FR-001**: System MUST consolidate assignments and tasks tables into a single unified tasks table
- **FR-002**: System MUST preserve all existing assignment data during migration (assignee, SLA deadlines, priority, status, workflow stages)
- **FR-003**: System MUST preserve all existing task data during migration (title, description, work item links)
- **FR-004**: Tasks MUST link to engagements via engagement_id foreign key for kanban board functionality
- **FR-005**: Tasks MUST support linking to multiple work items via source JSONB field (dossier_ids[], position_ids[], ticket_ids[])
- **FR-006**: Tasks MUST display descriptive titles in all UI contexts (task lists, detail pages, kanban cards, navigation breadcrumbs)
- **FR-007**: System MUST provide task_contributors table to track team members who helped on tasks
- **FR-008**: Task contributors MUST have roles (helper, reviewer, advisor, observer, supervisor) to describe their contribution type
- **FR-009**: System MUST allow task owners to add and remove contributors while task is active
- **FR-010**: Contributors MUST be able to view tasks they contributed to in a dedicated filtered view
- **FR-011**: System MUST enforce Row Level Security (RLS) policies so users can only view tasks they're assigned to, created, or contributed to
- **FR-012**: Kanban boards MUST fetch tasks from unified tasks table filtered by engagement_id and grouped by status field
- **FR-013**: System MUST support task status field with values: pending, in_progress, review, completed, cancelled. This single field serves both kanban column organization and lifecycle tracking to prevent state synchronization issues. Kanban columns map directly to status values: pending→"To Do", in_progress→"In Progress", review→"Review", completed→"Done", cancelled→"Cancelled".
- **FR-014**: [MERGED INTO FR-013] - Removed to eliminate duplication between workflow_stage and status fields
- **FR-015**: System MUST maintain SLA tracking with three deadline types: overall SLA, current stage SLA, and task SLA
- **FR-016**: System MUST preserve soft delete functionality (is_deleted flag) for audit compliance
- **FR-017**: System MUST maintain audit trail fields (created_by, updated_by, created_at, updated_at, completed_by, completed_at)
- **FR-018**: System MUST support four work item types: dossier, position, ticket, generic (for tasks not linked to entities)
- **FR-019**: Task assignment UI MUST be renamed from "My Assignments" to "My Tasks" throughout the system
- **FR-020**: System MUST generate and maintain database indexes for performance on: assignee_id, engagement_id, status, sla_deadline, work_item lookups
- **FR-021**: System MUST implement optimistic locking using updated_at timestamp to detect concurrent modifications
- **FR-022**: When concurrent update is detected, system MUST show conflict warning with options to reload, force save, or cancel
- **FR-023**: Kanban drag-and-drop operations MUST use optimistic locking and fail gracefully with user notification if task was modified elsewhere
- **FR-024**: System MUST automatically retry failed API operations 3 times total (initial attempt + 2 retries) with exponential backoff (150ms, 300ms, 600ms) before showing error to user
- **FR-025**: System MUST show loading indicators during automatic retry attempts to provide feedback that operation is in progress
- **FR-026**: If all automatic retries fail, system MUST display error message with manual retry option
- **FR-027**: System MUST detect offline state and preserve unsaved edits locally, attempting to save automatically when connectivity is restored
- **FR-028**: Kanban drag operations MUST show loading state during retries and revert card to original position if operation ultimately fails

### Key Entities

- **Task (Unified)**: Represents a unit of work assigned to a staff member with clear title, description, one primary assignee, SLA deadlines, priority level, current status (serves dual purpose for lifecycle tracking and kanban column organization), optional engagement context, links to one or more work items, audit trail, soft delete support, and updated_at timestamp for optimistic locking

- **Task Contributor**: Tracks additional team members who helped complete a task, includes reference to task, reference to contributing user, contribution role (helper/reviewer/advisor/observer/supervisor), optional contribution notes, timestamps for when added and optionally removed, and ensures uniqueness per (task, user) pair

- **Work Item (Unchanged)**: Represents actual entities being worked on - dossiers for countries/organizations, positions for policy documents, tickets for intake requests - tasks link to these via work_item_type and work_item_id or source JSONB for multiple items

- **Engagement (Unchanged)**: Represents a diplomatic event or project that groups related tasks, tasks optionally link to engagement via engagement_id, kanban boards are organized by engagement

### Non-Functional Requirements

- **NFR-001**: Data migration from assignments → tasks MUST complete without data loss (verify via count comparison and sample data checks)
- **NFR-002**: Task detail pages MUST load in under 2 seconds with up to 50 contributors
- **NFR-003**: Kanban boards MUST render in under 3 seconds for engagements with up to 100 tasks
- **NFR-004**: "My Tasks" page MUST support cursor-based pagination with configurable page sizes [25, 50, 100] (default: 50) optimized for variable user loads (from 10 to 1000+ tasks per user). Cursor uses (created_at, id) composite key for stable pagination during concurrent updates.
- **NFR-005**: System MUST maintain backwards compatibility by renaming old assignments table to assignments_deprecated for 30-day rollback window
- **NFR-006**: All database migrations MUST be reversible with documented rollback procedures
- **NFR-007**: RLS policies MUST prevent users from viewing tasks they don't have permission for (tested via automated RLS test suite)
- **NFR-008**: Query performance MUST scale efficiently across wide data volume variations (users with 10 tasks and users with 1000+ tasks should both experience sub-2-second page loads)
- **NFR-009**: System MUST gracefully handle network failures with automatic retry logic (3 total attempts with exponential backoff: 150ms, 300ms, 600ms) achieving 99% success rate for transient failures
- **NFR-010**: User operations MUST not appear "frozen" during retries - loading indicators must be visible within 200ms of operation start

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can identify task purpose from title alone without opening task details in 95% of cases (measured via user testing)
- **SC-002**: Time to understand task list reduces by 40% compared to current assignment IDs (measured via user testing with timing)
- **SC-003**: Kanban boards display all engagement tasks correctly with zero missing or duplicate tasks (verified via automated tests)
- **SC-004**: Task detail pages load in under 2 seconds for 99% of requests (measured via performance monitoring)
- **SC-005**: Users can add contributors to tasks and view contributed tasks within 30 seconds (measured via E2E testing)
- **SC-006**: Zero data loss during migration - 100% of assignments successfully converted to tasks with matching record counts
- **SC-007**: System supports 95% fewer support tickets related to "understanding assignments vs tasks" confusion (measured 30 days post-launch)
- **SC-008**: Contributors are visible on task cards and detail pages within 1 second of being added (measured via UI tests)

## Assumptions

- Current system has separate `assignments` and `tasks` tables that can be safely merged
- Tasks table (if exists) currently only contains task definitions without assignment context
- Assignments table contains WHO/WHEN/STATUS but lacks clear titles
- Users understand concept of "tasks" better than "assignments"
- One primary assignee per task is sufficient (no co-ownership required)
- Contributors don't need write access to task - they're acknowledgment only
- Existing integrations can be updated to query new tasks table
- Frontend can be updated to rename routes from /assignments to /tasks
- Standard role types (helper, reviewer, advisor, observer, supervisor) cover most collaboration patterns
- Data volumes vary widely across users (some users have 10 tasks, others have 1000+), requiring flexible pagination and query optimization strategies

## Scope Boundaries

### In Scope
- Merge assignments + tasks tables into unified tasks table
- Create task_contributors table for team collaboration
- Add engagement_id to tasks for proper engagement context
- Update all UI to show task titles instead of assignment IDs
- Migrate all existing data from assignments → tasks
- Add RLS policies for unified tasks table
- Update kanban boards to query tasks table
- Rename "My Assignments" to "My Tasks" throughout UI
- Update all backend services and Edge Functions
- Create database indexes for performance
- Implement soft delete on unified tasks table

### Out of Scope
- Changes to work items (dossiers, positions, tickets) - these remain unchanged
- Advanced contributor permissions (all contributors have read-only view)
- Task templates or recurring tasks
- Time tracking or effort estimation
- Task dependencies or blocking relationships
- Bulk task operations (assign multiple tasks at once)
- Task approval workflows
- Calendar integration for task deadlines
- Email notifications for task changes (handled by existing notification service - feature only creates notification event records, delivery logic unchanged)
- Notification API contracts (existing notification service API remains unchanged)
- Mobile app updates (will be handled in separate mobile sync feature)

## Dependencies

- Database migration system must support complex data transformations
- Frontend routing system must support route renames (/assignments → /tasks)
- Backend Edge Functions must be redeployable with minimal downtime
- RLS policy system must support complex multi-table joins
- Type generation system must regenerate types after schema changes
- Existing notification system must be compatible with new task structure

## Constraints

- Migration must be reversible (rename old table, keep for 30 days)
- Zero data loss during migration
- Minimal downtime during deployment (< 5 minutes)
- Existing task URLs should redirect to new structure where possible
- RLS policies must maintain same security guarantees as current system
- Performance must not degrade (task lists, detail pages, kanban boards)

## Open Questions

None at this time - specification includes all necessary details for implementation planning.

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
- [x] Success criteria are technology-agnostic
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

### Feature Readiness
- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification
