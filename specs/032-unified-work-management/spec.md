# Feature Specification: Unified Work Management System

**Feature Branch**: `032-unified-work-management`
**Created**: 2025-11-27
**Implemented**: 2025-11-27
**Status**: Implemented
**Input**: User description: "Unified Work Management System - Create a unified dashboard and data layer that consolidates all work items from multiple sources (commitments, tasks, intake queue) into a single 'My Work' view. Track three types of work items: delivery (internal commitments), follow-up (external commitments), and SLA (tasks with SLA deadlines). Provide workload, productivity, progress monitoring, and obligation overview."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Unified Work Dashboard (Priority: P1)

As a staff member, I need to see all my work obligations in one place regardless of their source (commitments, tasks, intake tickets) so that I can understand my total workload and prioritize effectively.

**Why this priority**: This is the core value proposition of the feature. Without a unified view, users must check multiple pages to understand their workload, leading to missed deadlines and inefficiency.

**Independent Test**: Can be fully tested by logging in, navigating to "My Work" dashboard, and verifying all work items from different sources appear in a single, organized list. Delivers immediate value by eliminating context-switching between multiple views.

**Acceptance Scenarios**:

1. **Given** I have commitments assigned to me, **When** I open the My Work dashboard, **Then** I see my commitments displayed with source indicator "Commitment"
2. **Given** I have tasks assigned to me, **When** I open the My Work dashboard, **Then** I see my tasks displayed with source indicator "Task"
3. **Given** I have intake tickets assigned to me, **When** I open the My Work dashboard, **Then** I see my intake tickets displayed with source indicator "Intake" and SLA countdown
4. **Given** I have commitments, tasks, and intake tickets, **When** I view the dashboard summary cards, **Then** I see the total count and breakdown by all three source types
5. **Given** I am viewing the dashboard, **When** I look at any work item, **Then** I can clearly identify its source, deadline, priority, and status
6. **Given** I am on a mobile device, **When** I open the dashboard, **Then** the layout is optimized for touch with readable content and accessible controls

---

### User Story 2 - Filter and Navigate Work Items (Priority: P1)

As a staff member, I need to filter my work by source type, status, priority, and tracking type so that I can focus on specific subsets of my workload (e.g., only overdue items, only follow-ups).

**Why this priority**: Filtering is essential for daily productivity. Users need to quickly identify what needs immediate attention without scrolling through all items.

**Independent Test**: Can be fully tested by opening filter panel, selecting source "Commitments" and status "Overdue", and verifying only matching items appear. Tapping an item should navigate to its original source detail view.

**Acceptance Scenarios**:

1. **Given** I am on the My Work dashboard, **When** I tap the filter button, **Then** a filter panel opens with options for source (Commitment/Task/Intake), status, priority, and tracking type
2. **Given** I select source filter "Commitments", **When** filters are applied, **Then** only commitment-sourced items appear in the list
3. **Given** I select source filter "Intake", **When** filters are applied, **Then** only intake ticket items appear in the list
4. **Given** I select multiple filters (e.g., status: pending AND priority: high), **When** filters are applied, **Then** only items matching all criteria appear
5. **Given** active filters are applied, **When** I view the list, **Then** filter chips appear above the list showing active filters with ability to remove individual filters
6. **Given** I tap on a work item card, **When** the item is a commitment, **Then** I am navigated to the commitment detail drawer in the commitments page
7. **Given** I tap on a work item card, **When** the item is a task, **Then** I am navigated to the task detail page
8. **Given** I tap on a work item card, **When** the item is an intake ticket, **Then** I am navigated to the intake ticket detail page

---

### User Story 3 - Track Deadlines and Overdue Items (Priority: P2)

As a staff member, I need to see upcoming deadlines and overdue items prominently displayed so that I can take action before missing important obligations.

**Why this priority**: Deadline visibility directly impacts compliance and performance. Missing this creates risk of SLA breaches and unfulfilled commitments.

**Independent Test**: Can be fully tested by having items with various due dates, opening dashboard, and verifying upcoming deadlines section shows items sorted by urgency with visual indicators for overdue/at-risk items.

**Acceptance Scenarios**:

1. **Given** I have work items due within the next 7 days, **When** I view the dashboard, **Then** an "Upcoming Deadlines" section displays these items sorted by due date (soonest first)
2. **Given** I have overdue work items, **When** I view the dashboard, **Then** the overdue count is prominently displayed in a warning card with red styling
3. **Given** an item is overdue, **When** it appears in any list, **Then** it has a red visual indicator and shows "X days overdue" badge
4. **Given** an item is due within 24 hours, **When** it appears in any list, **Then** it has an amber/yellow visual indicator
5. **Given** I am viewing the dashboard in Arabic, **When** I see date-related text, **Then** all labels and relative times display correctly in RTL layout

---

### User Story 4 - Distinguish Tracking Types (Priority: P2)

As a staff member, I need to understand the tracking type of each work item (Delivery, Follow-up, SLA) so that I know which items I must personally complete versus which items I need to monitor and follow up on.

**Why this priority**: Different tracking types require different user behaviors. Confusing a "follow-up" (external party responsible) with a "delivery" (user responsible) leads to mismanaged expectations.

**Independent Test**: Can be fully tested by viewing work items from different sources, verifying each has a clear tracking type indicator with distinct visual styling, and confirming filtering by tracking type works correctly.

**Acceptance Scenarios**:

1. **Given** I have an internal commitment (owner_type = internal), **When** it appears in the list, **Then** it shows "Delivery" tracking type with a blue indicator
2. **Given** I have an external commitment (owner_type = external), **When** it appears in the list, **Then** it shows "Follow-up" tracking type with a purple indicator and shows the external contact name
3. **Given** I have a task with SLA deadline, **When** it appears in the list, **Then** it shows "SLA" tracking type with an orange indicator and remaining time
4. **Given** I filter by tracking type "Follow-up", **When** filters are applied, **Then** only external commitment items appear
5. **Given** I tap on a Follow-up item, **When** viewing the detail, **Then** I see the external contact information and can initiate follow-up action

---

### User Story 5 - View Productivity Metrics (Priority: P3)

As a staff member, I need to see my productivity metrics (completed items, on-time rate, average completion time) so that I can understand my performance and identify areas for improvement.

**Why this priority**: Metrics provide self-awareness and motivation. While not blocking daily work, they support continuous improvement and performance discussions.

**Independent Test**: Can be fully tested by completing several work items over time, then viewing the productivity section and verifying metrics accurately reflect completion history.

**Acceptance Scenarios**:

1. **Given** I have completed work items in the past 30 days, **When** I view the productivity section, **Then** I see the count of completed items
2. **Given** I have completed some items on time and some late, **When** I view productivity metrics, **Then** I see an on-time completion rate percentage
3. **Given** I have completed items with varying completion times, **When** I view productivity metrics, **Then** I see average time from assignment to completion
4. **Given** I have no completed items in the period, **When** I view productivity metrics, **Then** I see appropriate empty state messaging
5. **Given** I am a manager, **When** I access the team view, **Then** I see aggregated productivity metrics for my team members

---

### User Story 6 - View Team Workload (Priority: P3)

As a manager, I need to see my team's workload distribution so that I can identify overloaded team members and balance assignments effectively.

**Why this priority**: Team visibility enables better resource allocation. This is management-focused and doesn't block individual productivity.

**Independent Test**: Can be fully tested by a manager opening the team view, seeing all team members with their work counts, and identifying any workload imbalances.

**Acceptance Scenarios**:

1. **Given** I am a manager with team members, **When** I switch to "Team View" on the dashboard, **Then** I see a list of my team members with their active work counts
2. **Given** a team member has more than 20 active items, **When** I view team workload, **Then** they are highlighted as potentially overloaded
3. **Given** a team member has overdue items, **When** I view team workload, **Then** their overdue count is prominently displayed in red
4. **Given** I tap on a team member's row, **When** the detail expands, **Then** I see breakdown of their work by source and tracking type
5. **Given** I am not a manager, **When** I try to access team view, **Then** I see only my personal dashboard (no team toggle visible)

---

### Edge Cases

- What happens when a user has no work items assigned? (Answer: Show welcome/empty state with guidance on how items get assigned)
- How does the system handle items that belong to multiple categories? (Answer: Items appear once with their primary source; commitments always show as commitments regardless of whether linked to tasks)
- What happens when a commitment's linked dossier is deleted? (Answer: Commitment still appears with "Dossier removed" indicator)
- How are follow-up items tracked when no response is received? (Answer: Item remains in list with increasing "days since last follow-up" indicator; no automatic escalation in v1)
- What happens when filters return zero results? (Answer: Show empty state with suggestion to adjust filters or clear all)
- How does the system handle time zone differences for deadlines? (Answer: All deadlines are displayed in user's local time zone with original time zone noted if different)

## Requirements *(mandatory)*

### Functional Requirements

**Unified Data Layer**
- **FR-001**: System MUST aggregate work items from commitments (aa_commitments), tasks, and intake_tickets tables into a unified view
- **FR-002**: System MUST classify each work item by tracking type: "Delivery" (internal commitments, tasks without SLA), "Follow-up" (external commitments), or "SLA" (tasks with SLA deadlines, intake tickets)
- **FR-003**: System MUST display the source type (Commitment, Task, Intake) for each work item with distinct visual indicators
- **FR-004**: System MUST maintain real-time sync with source tables (changes in commitments/tasks/intake immediately reflected in unified view with 300ms debounce)

**Dashboard Display**
- **FR-005**: System MUST display summary cards showing total active items, breakdown by source, and overdue count
- **FR-006**: System MUST display an "Upcoming Deadlines" section sorted by due date (soonest first)
- **FR-007**: System MUST display overdue items with red visual indicator and "X days overdue" badge
- **FR-008**: System MUST display at-risk items (due within 24 hours) with amber visual indicator

**Filtering and Navigation**
- **FR-009**: System MUST support filtering by source type (Commitment, Task), status, priority, and tracking type (Delivery, Follow-up, SLA)
- **FR-010**: System MUST display active filters as removable chips above the work list
- **FR-011**: System MUST allow navigation to the original source item when a work item is tapped (commitment detail drawer, task detail page)
- **FR-012**: System MUST preserve filter state in URL for shareability and browser back/forward navigation

**Productivity Metrics**
- **FR-013**: System MUST calculate and display completed item count for configurable time period (default: 30 days)
- **FR-014**: System MUST calculate and display on-time completion rate (items completed before deadline / total completed)
- **FR-015**: System MUST calculate and display average completion time (time from creation/assignment to completion)
- **FR-016**: System MUST refresh metrics when new completions occur

**Team Management (Manager Role)**
- **FR-017**: System MUST provide team workload view for users with manager role
- **FR-018**: System MUST display each team member's active work count and overdue count
- **FR-019**: System MUST highlight team members with workload above threshold (configurable, default: 20 items)
- **FR-020**: System MUST restrict team view access to users with manager permissions

**User Experience**
- **FR-021**: System MUST support mobile-first responsive design with minimum 44x44px touch targets
- **FR-022**: System MUST fully support RTL layout for Arabic language including text alignment and icon direction
- **FR-023**: System MUST display relative time for deadlines (e.g., "Due in 2 days", "3 days overdue")
- **FR-024**: System MUST provide empty states with helpful guidance when no items exist

### Key Entities

- **Unified Work Item**: A read-only aggregate representing any tracked work obligation. Combines data from commitments and tasks. Key attributes: source_type, source_id, title, description, deadline, priority, status, tracking_type, assignee, external_contact (for follow-ups).
- **Tracking Type**: Classification of work behavior - "Delivery" (user must complete), "Follow-up" (user monitors external party), "SLA" (strict time-bound with escalation). Derived from source characteristics.
- **Productivity Metrics**: Aggregated statistics for a user or team. Key attributes: period, completed_count, on_time_rate, average_completion_time, overdue_count.
- **Team Workload**: Manager-visible aggregate of team member work distribution. Key attributes: member_id, active_count, overdue_count, by_source_breakdown, by_tracking_type_breakdown.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view all their work items from any source in a single dashboard within 2 seconds of page load
- **SC-002**: Users can filter work items and see results update within 500ms
- **SC-003**: Users can identify the source and tracking type of any work item without clicking into details
- **SC-004**: Users can navigate from a unified work item to its source detail view in 1 tap/click
- **SC-005**: Managers can view team workload for up to 20 team members without performance degradation
- **SC-006**: On-time completion rate is calculated correctly (verified against source completion timestamps)
- **SC-007**: 100% of dashboard components render correctly in both LTR (English) and RTL (Arabic) layouts
- **SC-008**: All interactive elements meet minimum 44x44px touch target size on mobile devices
- **SC-009**: Overdue items are identified with 100% accuracy (no false positives or negatives)
- **SC-010**: Dashboard handles users with up to 500 active work items without performance degradation

## Clarifications

### Session 1 - 2025-11-27 (Schema Analysis)

**Discovery**: Schema analysis during implementation planning:

1. **Commitment Table Status**:
   - The `aa_commitments` table was verified and already has all required columns
   - Key column: `tracking_mode` (not `commitment_type` as initially assumed)
   - **Resolution**: No rebuild needed - table is ready for unified work integration

2. **Intake Queue Inclusion**:
   - **Question**: Should intake queue be included in v1?
   - **Answer**: YES - Include intake tickets in the unified view
   - **Verified**: `intake_tickets` table has all required fields (urgency, submitted_at, assigned_to, status, title, dossier_id)

3. **Team Structure**:
   - **Question**: How to determine team membership for manager workload view?
   - **Answer**: Use existing `organization_members` table with role-based filtering
   - **Roles**: manager, admin, owner have team visibility

4. **Canonical Data Source**:
   - `aa_commitments` is the canonical table (used by services, hooks, components)
   - `tracking_mode` column determines Delivery vs Follow-up classification

### Session 2 - 2025-11-27 (Implementation)

**Implementation completed**:

1. **Database Migrations Applied**:
   - `add_aa_commitments_indexes` - Performance indexes
   - `create_unified_work_items_view` - Main unified VIEW
   - `create_user_work_summary_view` - Summary aggregations
   - `create_user_productivity_metrics_mv` - Materialized view for metrics
   - `create_team_workload_functions` - Manager authorization + workload
   - `create_unified_work_rpc_functions` - Cursor pagination
   - `fix_get_unified_work_items_types` - Type casting fix for RPC

2. **Edge Function Deployed**:
   - `unified-work-list` - API for list, summary, metrics, team workload

3. **Frontend Completed**:
   - Route: `/my-work` with URL state sync
   - 8 components: Dashboard, Header, Metrics, Tabs, Filters, List, Card, Team Panel
   - 5 hooks: Items, Summary, Metrics, Team, Realtime
   - i18n: English and Arabic translations

4. **Testing Verified**:
   - VIEW combines 17 commitments + 30 tasks + 2057 intake tickets
   - RPC pagination and filtering working
   - Materialized view refreshes correctly

## Assumptions

- Users are already authenticated via existing Supabase Auth system
- The `aa_commitments` table already has all required columns: `title`, `description`, `due_date`, `priority`, `status`, `tracking_mode`, `assignee_id`, `is_overdue`, etc. (✅ verified)
- The existing `tasks` table has `sla_deadline` field for SLA tracking (✅ verified)
- The existing `intake_tickets` table has `urgency`, `submitted_at`, `assigned_to`, `status` fields (✅ verified)
- Manager role permissions use `organization_members.role IN ('manager', 'admin', 'owner')`
- Team membership is determined via `organization_members` table
- Productivity metrics do not require historical data migration; metrics start from feature deployment date
- All three source tables have RLS enabled (✅ verified: aa_commitments, tasks, intake_tickets)

## Out of Scope

- Automatic follow-up reminders/notifications for external commitments
- Bulk operations (mass reassignment, bulk status updates)
- Custom dashboard layouts or widget arrangement
- Export functionality for metrics reports
- Integration with external calendar systems
- Gamification features (badges, leaderboards)
- Historical trend analysis beyond 30-day rolling window

## Dependencies

### Required Features (Must Be Complete)
- **Feature 031**: Commitments Management - Provides `aa_commitments` table (✅ verified ready)
- **Feature 025**: Unified Tasks Model - Provides `tasks` table with `sla_deadline`, `workflow_stage`, `assignee_id`
- **Feature 008**: Front Door Intake - Provides `intake_tickets` table with urgency-based SLA

### Database Dependencies
- `aa_commitments` table (existing, verified - has `tracking_mode` column)
- `tasks` table (existing, verified)
- `intake_tickets` table (existing, verified)
- `organization_members` table (existing, for team workload)
- `dossiers` table (for dossier context)
- `external_contacts` table (for follow-up contact info)

## Data Model

### Unified Work Item (Virtual Entity - SQL VIEW)

The unified work item is a **read-only aggregate** that combines data from three source tables. It is implemented as a PostgreSQL VIEW (not a physical table) to ensure real-time accuracy.

**Normalized Schema**:
| Field | Type | Source Mapping |
|-------|------|----------------|
| `source_id` | UUID | Primary key from source table |
| `source_type` | TEXT | 'commitment' \| 'task' \| 'intake' |
| `title` | TEXT | Commitment: title, Task: title, Intake: title |
| `description` | TEXT | From source |
| `deadline` | TIMESTAMPTZ | Commitment: due_date, Task: sla_deadline, Intake: calculated from urgency |
| `priority` | TEXT | 'low' \| 'medium' \| 'high' \| 'critical' \| 'urgent' |
| `status` | TEXT | Normalized from each source's status enum |
| `tracking_type` | TEXT | 'delivery' \| 'follow_up' \| 'sla' (derived) |
| `assignee_id` | UUID | User assigned to the work item |
| `external_contact_id` | UUID | For follow-up items only |
| `dossier_id` | UUID | Related dossier (optional) |
| `is_overdue` | BOOLEAN | Calculated: deadline < NOW() AND status not terminal |
| `days_until_due` | INT | Calculated: deadline - NOW() in days |
| `created_at` | TIMESTAMPTZ | From source |
| `updated_at` | TIMESTAMPTZ | From source |

### Tracking Type Derivation Rules

| Source | Condition | Tracking Type | Color |
|--------|-----------|---------------|-------|
| Commitment | `owner_type = 'internal'` | Delivery | Blue |
| Commitment | `owner_type = 'external'` | Follow-up | Purple |
| Task | `sla_deadline IS NOT NULL` | SLA | Orange |
| Task | `sla_deadline IS NULL` | Delivery | Blue |
| Intake | Always | SLA | Orange |

### Intake Ticket SLA Calculation

| Urgency Level | SLA Deadline |
|---------------|--------------|
| Critical | `submitted_at + 4 hours` |
| High | `submitted_at + 8 hours` |
| Medium | `submitted_at + 24 hours` |
| Low | `submitted_at + 48 hours` |

### User Productivity Metrics (Materialized View)

Aggregated per user, refreshed every 15 minutes:
- `completed_count`: Items completed in last 30 days
- `on_time_rate`: % completed before deadline
- `avg_completion_hours`: Average time from creation to completion
- `commitment_completed`, `task_completed`, `intake_completed`: Breakdown by source

### Team Workload (Function with Authorization)

Manager-only access enforced via `SECURITY DEFINER` function:
- `member_id`, `member_role`: Team member info
- `total_active`, `overdue_count`: Workload indicators
- `is_overloaded`: TRUE if total_active >= 20
- Breakdown by source type and tracking type

## Security Model

### View Access Control

| View/Function | Access | Enforcement |
|---------------|--------|-------------|
| `unified_work_items` | Users see only assigned items | RLS inherited from source tables |
| `user_work_summary` | Users see own summary only | WHERE clause on assignee_id |
| `user_productivity_metrics` | Users see own metrics only | WHERE clause on user_id |
| `get_team_workload(org_id)` | Managers only | SECURITY DEFINER with role check |

### RLS Inheritance

The `unified_work_items` VIEW inherits RLS from source tables:
- **aa_commitments**: Owner or dossier assignment role
- **tasks**: Assignee, creator, or contributor
- **intake_tickets**: Creator, assignee, or unit member with clearance

## Technical Constraints

### Performance Requirements
- Dashboard initial load: < 2 seconds for 500 items
- Filter response time: < 500ms
- Real-time update latency: < 1 second
- Virtualized list for 500+ items (using @tanstack/react-virtual)

### Real-time Strategy
- Subscribe to individual source tables (not the VIEW)
- 300ms debounce on invalidations to prevent thrash
- Filter significant changes only (skip updated_at-only changes)

### Pagination Strategy
- Cursor-based pagination using RPC function
- Cursor format: `{deadline}|{source_id}`
- Stable ordering: `ORDER BY deadline ASC NULLS LAST, source_id ASC`

### Migration Strategy
- No rebuild needed - `aa_commitments` already has all required columns
- Type regeneration required after migration

## Implementation Details *(added post-implementation)*

### Database Objects Created

#### PostgreSQL Enums
```sql
CREATE TYPE tracking_type AS ENUM ('delivery', 'follow_up', 'sla');
CREATE TYPE work_source AS ENUM ('commitment', 'task', 'intake');
```

#### Views

**1. `unified_work_items` VIEW**
Combines work items from all three sources into a single queryable view:
- Source: `aa_commitments` → source = 'commitment'
- Source: `tasks` → source = 'task'
- Source: `intake_tickets` → source = 'intake'

Tracking type derivation:
- Commitments: `tracking_mode = 'follow_up'` → 'follow_up', else → 'delivery'
- Tasks: `sla_deadline IS NOT NULL` → 'sla', else → 'delivery'
- Intake: Always → 'sla'

**2. `user_work_summary` VIEW**
Aggregated stats per user:
- `total_active` - All non-completed items
- `overdue_count` - Items past deadline
- `due_today_count` - Items due today
- `due_this_week_count` - Items due within 7 days
- `by_source` - JSONB breakdown {commitment, task, intake}

**3. `user_productivity_metrics` MATERIALIZED VIEW**
Performance metrics (refreshed manually or via cron):
- `completed_30d` - Items completed in last 30 days
- `on_time_rate_30d` - % completed before deadline
- `avg_completion_hours_30d` - Average completion time
- `commitment_completed`, `task_completed`, `intake_completed` - By source

#### RPC Functions

**1. `check_is_manager(org_id UUID)`**
- Returns BOOLEAN
- SECURITY DEFINER
- Checks if current user has manager/admin/owner role

**2. `get_team_workload(p_org_id UUID)`**
- Returns TABLE of team member workloads
- SECURITY DEFINER with manager check
- Includes: user_id, user_email, total_active, overdue_count, on_time_rate_30d

**3. `get_unified_work_items(...)` (Cursor Pagination)**
```sql
FUNCTION get_unified_work_items(
  p_source work_source DEFAULT NULL,
  p_tracking_type tracking_type DEFAULT NULL,
  p_priority TEXT DEFAULT NULL,
  p_is_overdue BOOLEAN DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_cursor_deadline TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20
)
```
- Cursor-based pagination for infinite scroll
- Filters: source, tracking_type, priority, overdue, search
- Ordering: deadline ASC NULLS LAST, id ASC

**4. `get_user_work_summary()`**
- Returns current user's work summary
- Uses `auth.uid()` for RLS

#### Indexes
```sql
-- Performance indexes on aa_commitments
CREATE INDEX idx_aa_commitments_assignee_status ON aa_commitments(assignee_id, status);
CREATE INDEX idx_aa_commitments_due_date ON aa_commitments(due_date);
CREATE INDEX idx_aa_commitments_tracking_mode ON aa_commitments(tracking_mode);
CREATE INDEX idx_aa_commitments_is_overdue ON aa_commitments(is_overdue) WHERE is_overdue = true;
```

### Edge Function API

**Endpoint**: `POST /functions/v1/unified-work-list`

**Supported Actions**:

1. **List Work Items** (`action: 'list'`)
```json
{
  "action": "list",
  "source": "commitment" | "task" | "intake" | null,
  "tracking_type": "delivery" | "follow_up" | "sla" | null,
  "priority": "low" | "medium" | "high" | "critical" | "urgent" | null,
  "is_overdue": true | false | null,
  "search": "search text" | null,
  "cursor_deadline": "ISO timestamp" | null,
  "cursor_id": "UUID" | null,
  "limit": 20
}
```

2. **Get Summary** (`action: 'summary'`)
```json
{
  "action": "summary"
}
```

3. **Get Metrics** (`action: 'metrics'`)
```json
{
  "action": "metrics"
}
```

4. **Get Team Workload** (`action: 'team'`)
```json
{
  "action": "team",
  "org_id": "UUID"
}
```

### Frontend Implementation

#### Route: `/my-work`
- File: `frontend/src/routes/_protected/my-work/index.tsx`
- URL State: `source`, `tracking_type`, `priority`, `is_overdue`, `search`

#### Components
| Component | File | Purpose |
|-----------|------|---------|
| `MyWorkDashboard` | `pages/my-work/MyWorkDashboard.tsx` | Main container |
| `WorkSummaryHeader` | `components/WorkSummaryHeader.tsx` | Stats cards |
| `ProductivityMetrics` | `components/ProductivityMetrics.tsx` | User metrics |
| `WorkItemTabs` | `components/WorkItemTabs.tsx` | Source tabs |
| `WorkItemFiltersBar` | `components/WorkItemFiltersBar.tsx` | Filters + search |
| `WorkItemList` | `components/WorkItemList.tsx` | Virtualized list |
| `WorkItemCard` | `components/WorkItemCard.tsx` | Item card |
| `TeamWorkloadPanel` | `components/TeamWorkloadPanel.tsx` | Manager view |

#### Hooks
- `useUnifiedWorkItems(filters)` - Infinite query for work items
- `useUserWorkSummary()` - Summary stats query
- `useUserProductivityMetrics()` - Productivity metrics query
- `useTeamWorkload(orgId)` - Team workload query (managers)
- `useUnifiedWorkRealtime(onInvalidate)` - Realtime subscriptions with 300ms debounce

#### Types
- `UnifiedWorkItem` - Work item interface
- `UserWorkSummary` - Summary stats interface
- `UserProductivityMetrics` - Metrics interface
- `TeamMemberWorkload` - Team workload interface
- `WorkSource`, `TrackingType` - Type unions

#### i18n
- English: `frontend/public/locales/en/my-work.json`
- Arabic: `frontend/public/locales/ar/my-work.json`

### Verified Test Results

1. **unified_work_items VIEW**: 17 commitments, 30 tasks, 2057 intake tickets
2. **user_work_summary VIEW**: Returns correct aggregations
3. **user_productivity_metrics**: Materialized view refreshes correctly
4. **get_unified_work_items RPC**: Pagination and filtering working
