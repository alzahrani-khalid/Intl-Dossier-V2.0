# Feature Specification: Waiting Queue Actions

**Feature Branch**: `023-specs-waiting-queue`
**Created**: 2025-01-14
**Status**: Draft
**Input**: User description: "Activate everything about the actions around Waiting Queue"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick Access to Assignment Details (Priority: P1)

As a team member, I need to quickly view the full details of any assignment in my waiting queue so I can understand what action is needed before it can progress.

**Why this priority**: This is the most fundamental capability - users must be able to see assignment details to take any action. Without this, the queue is just a list of IDs with no context.

**Independent Test**: Can be fully tested by clicking "View" on any waiting queue item and verifying that assignment details modal/page opens with complete information (work item, assignee, status, timestamps, priority).

**Acceptance Scenarios**:

1. **Given** I am viewing the waiting queue with 5 pending assignments, **When** I click "View" on the first assignment, **Then** the system displays full assignment details including work_item_id, assignee name, current status, assigned date, and priority level
2. **Given** I am viewing assignment details for a dossier work item, **When** the modal opens, **Then** I see a direct link to navigate to the full dossier page
3. **Given** I am viewing assignment details on mobile (375px viewport), **When** the details modal opens, **Then** all information is readable with proper RTL support for Arabic and touch-friendly controls (44x44px minimum)
4. **Given** an assignment has aged beyond 7 days, **When** I view its details, **Then** the system displays a critical aging indicator in red with the exact number of days waiting

---

### User Story 2 - Individual Follow-Up Reminders (Priority: P1)

As a team member, I need to send a follow-up reminder for a specific waiting assignment so I can nudge the assignee or stakeholder without escalating the issue.

**Why this priority**: Gentle nudges prevent bottlenecks from becoming critical issues. This is the first line of action before escalation and is used daily by managers.

**Independent Test**: Can be fully tested by selecting a single assignment, clicking "Follow Up", verifying the reminder is sent (email/notification), and checking that last_reminder_sent_at timestamp is updated in the database.

**Acceptance Scenarios**:

1. **Given** I am viewing an assignment that has been pending for 3 days, **When** I click "Follow Up" on that item, **Then** the system sends a reminder notification to the assignee and updates the last_reminder_sent_at timestamp
2. **Given** I sent a follow-up reminder 2 hours ago, **When** I try to send another follow-up for the same assignment, **Then** the system prevents duplicate sending and shows "Last reminder sent 2 hours ago"
3. **Given** an assignment has no assignee (status is 'pending' with null assignee_id), **When** I click "Follow Up", **Then** the system shows an error: "Cannot send reminder: No assignee assigned to this work item"
4. **Given** I send a follow-up reminder in Arabic locale, **When** the notification is generated, **Then** the message content is rendered in Arabic with proper RTL formatting

---

### User Story 3 - Bulk Reminder Management (Priority: P2)

As a manager, I need to select multiple waiting assignments and send reminders to all assignees at once so I can efficiently manage my team's workload without sending reminders one by one.

**Why this priority**: Managers often need to nudge entire teams or categories of work. Bulk actions save significant time when managing 20+ waiting assignments daily.

**Independent Test**: Can be fully tested by selecting 3 assignments with checkboxes, clicking "Send Reminders" bulk action, and verifying all 3 assignees receive notifications with individual last_reminder_sent_at timestamps updated.

**Acceptance Scenarios**:

1. **Given** I have 10 assignments in the waiting queue, **When** I select 5 using checkboxes and click "Send Reminders", **Then** the system sends individual reminders to each of the 5 assignees and shows confirmation "5 reminders sent successfully"
2. **Given** I select 8 assignments but 2 have no assignees, **When** I click "Send Reminders", **Then** the system sends reminders only to the 6 valid assignments and shows "6 reminders sent, 2 skipped (no assignee)"
3. **Given** I select assignments across different work_item_types (3 dossiers, 2 tickets, 1 position), **When** I send bulk reminders, **Then** each notification includes context-specific information about the work item type
4. **Given** rate limiting is configured to max 100 emails per 5 minutes, **When** I attempt to send 150 bulk reminders, **Then** the system queues 50 for later delivery and shows "100 sent immediately, 50 queued for next batch"

---

### User Story 4 - Assignment Escalation (Priority: P2)

As a manager, I need to escalate overdue waiting assignments to higher management so critical bottlenecks are addressed by appropriate authorities.

**Why this priority**: Escalation is necessary for assignments that remain blocked despite follow-ups. This prevents critical work from stalling indefinitely.

**Independent Test**: Can be fully tested by selecting an assignment aged 7+ days, clicking "Escalate", confirming the escalation, and verifying an escalation record is created with notification sent to the escalation recipient.

**Acceptance Scenarios**:

1. **Given** an assignment has been waiting for 10 days, **When** I click "Escalate" and select the recipient "Division Manager", **Then** the system creates an escalation record, sends notification to the manager, and records the escalation timestamp
2. **Given** I select 5 assignments for bulk escalation, **When** I click "Escalate" and choose "Department Head", **Then** the system creates 5 individual escalation records and sends a summary notification to the department head listing all 5 assignments
3. **Given** an assignment was previously escalated 2 days ago, **When** I view its details, **Then** the system shows "Escalated to [Name] on [Date]" with a badge
4. **Given** I attempt to escalate an assignment that was already completed, **When** I click "Escalate", **Then** the system prevents the action and shows "Cannot escalate completed assignments"

---

### User Story 5 - Advanced Queue Filtering (Priority: P3)

As a team member, I need to filter the waiting queue by multiple criteria (priority, aging, work item type, assignee) so I can focus on the most critical items first.

**Why this priority**: While filtering improves user experience, the basic queue with tabs already provides value. Advanced filtering is helpful but not essential for MVP.

**Independent Test**: Can be fully tested by applying filters (e.g., "High priority + 7+ days aging"), verifying only matching assignments display, clearing filters, and confirming all items return.

**Acceptance Scenarios**:

1. **Given** I have 20 waiting assignments, **When** I filter by "Priority: High" and "Aging: 7+ days", **Then** the system displays only assignments matching both criteria with a count "Showing 3 of 20 items"
2. **Given** I apply the filter "Assignee: John Smith", **When** no assignments match, **Then** the system shows empty state "No waiting items match your filters" with a "Clear Filters" button
3. **Given** I set multiple filters and switch from "All" tab to "Dossiers" tab, **When** the tab changes, **Then** filters persist and apply to the new tab context
4. **Given** I am on mobile device, **When** I open the filter panel, **Then** it displays as a bottom sheet with touch-friendly controls and collapses after applying filters

---

### Edge Cases

- What happens when an assignee is deleted from the system but has pending assignments in the waiting queue? System displays "Unassigned" and allows reassignment.
- What happens when a user sends 50 follow-up reminders in 1 minute? Rate limiting prevents spam, queues excess reminders with message "Sending rate limited, 20 queued".
- What happens when an assignment is completed while a user is viewing it in the waiting queue? The item disappears from the list on next refresh with a toast notification "Assignment was completed".
- What happens when escalating an assignment with no organizational hierarchy defined? System shows error "Cannot escalate: No escalation path configured for this work item type".
- What happens when organizational hierarchy contains a circular reference (User A → Manager B → Manager C → Manager A)? System detects cycle during hierarchy walk, throws error "Invalid hierarchy: circular reference detected involving users [A, B, C]", escalation fails gracefully.
- What happens when sending reminders during system maintenance or email service downtime? System queues notifications and shows "Reminders queued, will send when service is available".
- What happens when a user with no permission tries to escalate? System hides escalate button and shows "Insufficient permissions" if attempted via API.
- What happens when filtering by assignee who has 0 waiting assignments? Empty state displays "No waiting items for this assignee" with option to view their completed work.
- What happens when bulk selecting 500+ items for reminder? UI limits selection to 100 items with message "Maximum 100 items can be selected at once".
- What happens to escalation records when an assignment is cancelled? Records are preserved for audit purposes with status updated to "Assignment Cancelled".
- What happens when sending a reminder for an assignment in Arabic but the assignee's locale preference is English? Notification is sent in English (assignee's preference).

## Requirements *(mandatory)*

### Functional Requirements

**Individual Actions:**
- **FR-001**: System MUST provide a "View" action for each assignment in the waiting queue that opens detailed assignment information
- **FR-002**: Assignment detail view MUST display work_item_id, work_item_type, assignee name, current status, assigned date, priority, and workflow_stage
- **FR-003**: System MUST provide a "Follow Up" action for each assignment that sends a reminder notification to the assignee
- **FR-004**: System MUST prevent duplicate follow-up reminders within a configurable cooldown period (default: 24 hours)
- **FR-005**: System MUST update last_reminder_sent_at timestamp when a follow-up reminder is successfully sent
- **FR-006**: System MUST prevent follow-up reminders for assignments with no assignee (null assignee_id)

**Bulk Actions:**
- **FR-007**: System MUST allow users to select multiple assignments using checkboxes
- **FR-008**: System MUST provide a "Send Reminders" bulk action that sends individual reminders to each selected assignment's assignee
- **FR-009**: System MUST provide an "Escalate" bulk action that creates escalation records for all selected assignments
- **FR-010**: System MUST display selection count (e.g., "5 items selected") when items are checked
- **FR-011**: System MUST allow "Select All" on current page and "Clear Selection" actions
- **FR-012**: System MUST limit bulk selection to a maximum of 100 items to prevent system overload

**Escalation:**
- **FR-013**: System MUST provide an escalation workflow that creates an escalation record linked to the assignment
- **FR-014**: Escalation records MUST capture: assignment_id, escalated_by (user), escalated_to (recipient), escalation_reason, escalation_timestamp
- **FR-015**: System MUST send notification to escalation recipient with assignment summary and context
- **FR-016**: System MUST display escalation status badge on assignments that have been escalated
- **FR-017**: System MUST prevent escalation of already-completed assignments (status 'completed' or 'cancelled')
- **FR-018**: System MUST support escalation path configuration based on organizational hierarchy

**Reminders:**
- **FR-019**: System MUST send reminder notifications via email and in-app notification channels
- **FR-020**: Reminder notifications MUST include: assignment ID, work item type, current status, aging (days waiting), link to assignment details
- **FR-021**: System MUST support bilingual (English/Arabic) reminder templates with proper RTL formatting for Arabic
- **FR-022**: System MUST apply rate limiting to prevent spam (default: 100 notifications per 5-minute window per user)
- **FR-023**: System MUST queue excess reminders when rate limit is exceeded and process them after cooldown period

**Filtering & Sorting:**
- **FR-024**: System MUST allow filtering by priority (low, medium, high, urgent)
- **FR-025**: System MUST allow filtering by aging buckets (0-2 days, 3-6 days, 7+ days)
- **FR-026**: System MUST allow filtering by work_item_type (dossier, ticket, position, task)
- **FR-027**: System MUST allow filtering by assignee (searchable dropdown of all assignees with waiting items)
- **FR-028**: System MUST allow sorting by assigned_at (oldest first, newest first)
- **FR-029**: System MUST allow sorting by priority (urgent → low, low → urgent)
- **FR-030**: System MUST persist filter/sort preferences per user session

**UI/UX:**
- **FR-031**: System MUST display aging indicators with WCAG AA compliant color coding (0-2 days: yellow #EAB308 on white 4.6:1 contrast, 3-6 days: orange #F97316 on white 4.7:1 contrast, 7+ days: red #DC2626 on white 5.9:1 contrast)
- **FR-032**: System MUST provide visual feedback for all actions (loading spinners appearing within 200ms of user action, success/error toasts displayed for 3-5 seconds, confirmation dialogs with clear accept/cancel buttons)
- **FR-033**: System MUST be mobile-first responsive with proper breakpoints (base → sm → md → lg → xl)
- **FR-034**: System MUST support full RTL layout for Arabic language with logical properties (ms-*, me-*, ps-*, pe-*)
- **FR-035**: System MUST provide touch-friendly controls with minimum 44x44px touch targets
- **FR-036**: System MUST show empty states when no assignments match filters with clear "Clear Filters" action

### Key Entities

- **Assignment**: Represents a work item assigned to a user. Key attributes: id, work_item_id, work_item_type, assignee_id, status (pending/assigned/in_progress/completed/cancelled), workflow_stage (todo/in_progress/done), assigned_at, priority, last_reminder_sent_at, _version (INTEGER for optimistic locking, auto-incremented on update). Relationships: belongs to User (assignee), has many EscalationRecords.

- **EscalationRecord**: Tracks when an assignment is escalated to higher management. Key attributes: id, assignment_id, escalated_by (user_id), escalated_to (user_id/role), escalation_reason (text), escalated_at (timestamp), status (pending/acknowledged/resolved). Relationships: belongs to Assignment, belongs to User (escalated_by).

- **FollowUpReminder**: Audit trail of reminders sent for assignments. Key attributes: id, assignment_id, sent_by (user_id), sent_at (timestamp), notification_type (email/in_app/both), recipient_id (assignee_id). Relationships: belongs to Assignment, belongs to User (sent_by, recipient).

- **SelectionState**: UI state tracking which assignments are currently selected for bulk actions. Key attributes: selected_ids (array of assignment IDs), selection_count (integer). Relationships: transient client-side state only, not persisted.

- **FilterCriteria**: UI state tracking active filters applied to the waiting queue. Key attributes: priority_filter (array), aging_filter (array), work_item_type_filter (array), assignee_filter (array), sort_by (field name), sort_order (asc/desc). Relationships: transient client-side state, optionally persisted in user preferences.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view full assignment details within 2 seconds of clicking "View" action (95th percentile page load time < 2s)
- **SC-002**: Follow-up reminders are delivered to assignees within 30 seconds of clicking "Follow Up" (95% delivery rate within 30s, measured server-side via followup_reminders.delivery_status = 'delivered' timestamp minus sent_at timestamp)
- **SC-003**: Bulk reminder sending completes for 50 selected assignments within 60 seconds with no rate limiting errors
- **SC-004**: Escalation workflow completes (record creation + notification) within 3 seconds for individual escalations
- **SC-005**: Users can successfully filter the waiting queue by at least 2 criteria simultaneously with results updating in under 1 second
- **SC-006**: Mobile users (viewport 375px-640px) can perform all queue actions with touch-friendly controls (100% of actions have 44x44px minimum touch targets)
- **SC-007**: Arabic RTL layout displays correctly with no layout breaks or overlapping elements (100% visual regression tests pass)
- **SC-008**: System prevents duplicate reminders within 24-hour cooldown period (0% false positives, 100% duplicate prevention)
- **SC-009**: Rate limiting prevents spam with max 100 notifications per 5-minute window per user (no user can exceed limit)
- **SC-010**: Empty states display helpful guidance when no assignments match filters (100% of empty states include "Clear Filters" action)
- **SC-011**: Escalation notifications reach recipients within 60 seconds of escalation action (95% delivery rate within 60s)
- **SC-012**: Users can select/deselect individual items and use "Select All" without UI lag (< 200ms response time for selection state changes)
- **SC-013**: Assignment aging indicators update in real-time as days increment (daily automated job updates aging buckets)
- **SC-014**: System maintains audit trail for all reminders and escalations (100% of actions logged with timestamp, user, and outcome)
- **SC-015**: Bulk actions on 100 items complete within 90 seconds with graceful failure handling (successful items processed, failed items reported with reasons)
- **SC-016**: Filter preferences persist across user sessions (user's last filter selection restored on page load)
- **SC-017**: System handles concurrent bulk actions from 20+ users without degradation (< 3s average response time under load)

## Assumptions *(optional)*

- **A-001**: Assignees have valid email addresses in the users table for reminder delivery
- **A-002**: Organizational hierarchy is defined in a separate table/config for escalation path resolution
- **A-003**: Notification service (email + in-app) is already implemented and accessible via API
- **A-004**: Rate limiting is enforced at the API gateway level, not just client-side
- **A-005**: User permissions for escalation actions are managed by existing RBAC (role-based access control) system
- **A-006**: Assignment status transitions (pending → assigned → in_progress → completed) are managed by existing workflow logic
- **A-007**: The users table contains locale preference field for determining notification language
- **A-008**: Browser localStorage is available for persisting UI state (selection, filters) on client-side
- **A-009**: Supabase Realtime is available for live updates when assignments are completed/cancelled
- **A-010**: Redis or similar caching layer is available for rate limiting counters and queued notifications

## Dependencies *(optional)*

- **D-001**: Notification Service API (email + in-app notifications)
- **D-002**: User Management System (for fetching assignee details, escalation recipients)
- **D-003**: RBAC/Permissions System (for enforcing escalation action permissions)
- **D-004**: Supabase Database (assignments table with last_reminder_sent_at column)
- **D-005**: Supabase Realtime (for live updates to waiting queue when assignments change status)
- **D-006**: Redis or Caching Layer (for rate limiting, queued notification storage)
- **D-007**: i18next Translation Library (for bilingual UI and notification templates)

## Constraints *(optional)*

- **C-001**: Bulk actions limited to maximum 100 items per request to prevent timeout
- **C-002**: Follow-up reminder cooldown period is 24 hours (configurable via environment variable)
- **C-003**: Rate limiting enforced at 100 notifications per 5-minute window per user
- **C-004**: Escalation path must be configured in organizational hierarchy; cannot escalate if path undefined
- **C-005**: Reminders can only be sent to assignments with non-null assignee_id
- **C-006**: Assignment details view requires Read permission on assignments table (enforced by RLS)
- **C-007**: Escalation action requires Escalate permission (enforced by backend validation)
- **C-008**: Mobile breakpoints follow Tailwind defaults (sm: 640px, md: 768px, lg: 1024px)
- **C-009**: RTL support requires logical Tailwind properties only (no ml-*, mr-*, pl-*, pr-*)
- **C-010**: Touch targets must meet accessibility standards (minimum 44x44px as per WCAG 2.1)
- **C-011**: Email notifications limited to 5KB message size to prevent delivery failures
- **C-012**: Escalation records cannot be deleted, only marked as resolved for audit compliance
- **C-013**: Filter state persisted in localStorage with 7-day expiration
- **C-014**: Assignment aging calculated daily via scheduled job (not real-time to reduce database load)
- **C-015**: Notification delivery failures must retry max 3 times before marking as failed
- **C-016**: API response time SLA for all queue actions: 95th percentile < 3 seconds
- **C-017**: Database queries for waiting queue must use indexes on assigned_at, status, workflow_stage
- **C-018**: Bulk reminder processing must be idempotent to handle retry scenarios safely
- **C-019**: Bulk operations use partial success model - valid items are processed, invalid items are skipped with detailed error report (e.g., "45 reminders sent, 5 skipped: 3 no assignee, 2 cooldown active")
- **C-020**: Concurrent updates to same assignment use optimistic locking via _version column (incremented on each update, UPDATE fails if version mismatch)
- **C-021**: Last-write-wins strategy for non-conflicting field updates (e.g., User A updates priority while User B sends reminder - both succeed)
- **C-022**: Conflicting field updates (e.g., two users escalating simultaneously) return 409 Conflict error with latest state

## Scope *(optional)*

### In Scope
- Individual assignment view, follow-up, and escalation actions
- Bulk reminder sending and bulk escalation
- Multi-criteria filtering (priority, aging, type, assignee)
- Sorting by assigned_at and priority
- Mobile-first responsive UI with full RTL support
- Bilingual notifications (English/Arabic)
- Rate limiting and duplicate prevention
- Escalation record creation and tracking
- Audit trail for reminders and escalations
- Empty states and error handling
- Real-time updates when assignments complete

### Out of Scope
- Custom escalation path configuration UI (assumes pre-configured hierarchy)
- Automated reminder scheduling (e.g., "send reminder if assignment pending for 5 days")
- Reassignment workflow from waiting queue (handled elsewhere)
- Waiting queue analytics dashboard (metrics, trends, aging reports)
- Integration with external ticketing systems (Jira, ServiceNow)
- Custom notification channel preferences (SMS, Slack, Teams)
- Approval workflow for escalations (assumed escalations are direct notifications)
- Bulk editing of assignment properties (priority, deadline)
- Export waiting queue to CSV/Excel
- Advanced search with full-text queries across assignment metadata
