# Unified Work Management API

## Overview

The Unified Work Management API provides endpoints for accessing consolidated work items from multiple sources (commitments, tasks, intake tickets) through a single interface. It supports filtering, cursor-based pagination, productivity metrics, and team workload visibility.

**Feature**: 032-unified-work-management
**Implemented**: 2025-11-27
**Edge Function**: `unified-work-list`

## Base Endpoint

```
POST /functions/v1/unified-work-list
```

All requests require authentication via Supabase JWT Bearer token:

```http
Authorization: Bearer <supabase-jwt-token>
Content-Type: application/json
```

## Actions

The API uses an action-based design. Include the `action` field in the request body.

### 1. List Work Items

Retrieve a paginated list of unified work items with optional filters.

**Request**:
```json
{
  "action": "list",
  "source": "commitment" | "task" | "intake" | null,
  "tracking_type": "delivery" | "follow_up" | "sla" | null,
  "priority": "low" | "medium" | "high" | "critical" | "urgent" | null,
  "is_overdue": true | false | null,
  "search": "search text" | null,
  "cursor_deadline": "2025-11-30T00:00:00Z" | null,
  "cursor_id": "uuid" | null,
  "limit": 20
}
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | Must be `"list"` |
| `source` | string | No | Filter by source: `commitment`, `task`, `intake` |
| `tracking_type` | string | No | Filter by type: `delivery`, `follow_up`, `sla` |
| `priority` | string | No | Filter by priority level |
| `is_overdue` | boolean | No | Filter overdue items only |
| `search` | string | No | Text search in title/description |
| `cursor_deadline` | ISO timestamp | No | Cursor for pagination (from previous response) |
| `cursor_id` | UUID | No | Cursor for pagination (from previous response) |
| `limit` | integer | No | Number of items per page (default: 20, max: 100) |

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "source": "commitment",
      "title": "Complete report review",
      "description": "Review quarterly report for accuracy",
      "deadline": "2025-12-01T17:00:00Z",
      "priority": "high",
      "status": "pending",
      "tracking_type": "delivery",
      "assignee_id": "uuid",
      "dossier_id": "uuid",
      "is_overdue": false,
      "days_until_due": 4,
      "created_at": "2025-11-15T10:00:00Z",
      "updated_at": "2025-11-25T14:30:00Z"
    }
  ],
  "cursor": {
    "deadline": "2025-12-05T00:00:00Z",
    "id": "uuid"
  },
  "has_more": true
}
```

**Source Types**:

| Source | Description |
|--------|-------------|
| `commitment` | From `aa_commitments` table |
| `task` | From `tasks` table |
| `intake` | From `intake_tickets` table |

**Tracking Types**:

| Type | Source | Condition |
|------|--------|-----------|
| `delivery` | Commitment | `tracking_mode = 'delivery'` (internal) |
| `follow_up` | Commitment | `tracking_mode = 'follow_up'` (external) |
| `sla` | Task | `sla_deadline IS NOT NULL` |
| `sla` | Intake | Always (urgency-based deadline) |
| `delivery` | Task | `sla_deadline IS NULL` |

---

### 2. Get User Work Summary

Retrieve aggregated work statistics for the authenticated user.

**Request**:
```json
{
  "action": "summary"
}
```

**Response**:
```json
{
  "data": {
    "user_id": "uuid",
    "total_active": 45,
    "overdue_count": 3,
    "due_today_count": 5,
    "due_this_week_count": 12,
    "by_source": {
      "commitment": 15,
      "task": 20,
      "intake": 10
    }
  }
}
```

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `total_active` | integer | All non-completed items assigned to user |
| `overdue_count` | integer | Items past deadline (not completed) |
| `due_today_count` | integer | Items due today |
| `due_this_week_count` | integer | Items due within 7 days |
| `by_source` | object | Breakdown by source type |

---

### 3. Get Productivity Metrics

Retrieve productivity statistics for the authenticated user.

**Request**:
```json
{
  "action": "metrics"
}
```

**Response**:
```json
{
  "data": {
    "user_id": "uuid",
    "completed_30d": 28,
    "on_time_rate_30d": 85.7,
    "avg_completion_hours_30d": 48.5,
    "commitment_completed": 12,
    "task_completed": 10,
    "intake_completed": 6,
    "last_refreshed": "2025-11-27T12:00:00Z"
  }
}
```

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `completed_30d` | integer | Items completed in last 30 days |
| `on_time_rate_30d` | float | % completed before deadline (0-100) |
| `avg_completion_hours_30d` | float | Average hours from creation to completion |
| `commitment_completed` | integer | Commitments completed in period |
| `task_completed` | integer | Tasks completed in period |
| `intake_completed` | integer | Intake tickets completed in period |
| `last_refreshed` | timestamp | When metrics were last calculated |

**Note**: Metrics are stored in a materialized view and refreshed periodically (not real-time).

---

### 4. Get Team Workload

Retrieve workload distribution for team members. **Requires manager role**.

**Request**:
```json
{
  "action": "team",
  "org_id": "uuid"
}
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | Must be `"team"` |
| `org_id` | UUID | Yes | Organization ID to get team workload for |

**Response**:
```json
{
  "data": [
    {
      "user_id": "uuid",
      "user_email": "john.smith@org.com",
      "total_active": 18,
      "overdue_count": 2,
      "on_time_rate_30d": 92.0
    },
    {
      "user_id": "uuid",
      "user_email": "sarah.jones@org.com",
      "total_active": 25,
      "overdue_count": 0,
      "on_time_rate_30d": 100.0
    }
  ]
}
```

**Authorization**:
- Requires `manager`, `admin`, or `owner` role in the organization
- Returns 403 Forbidden if user lacks permission

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | UUID | Team member's user ID |
| `user_email` | string | Team member's email |
| `total_active` | integer | Total non-completed items |
| `overdue_count` | integer | Items past deadline |
| `on_time_rate_30d` | float | On-time completion rate % |

---

## Error Responses

### Invalid Action
```json
{
  "error": "Invalid action: unknown_action"
}
```

### Not Authorized (Team Workload)
```json
{
  "error": "Not authorized to view team workload"
}
```

### Missing Required Parameter
```json
{
  "error": "org_id is required for team workload"
}
```

---

## Database Objects

### Views

| View Name | Description |
|-----------|-------------|
| `unified_work_items` | Combines all work sources |
| `user_work_summary` | Per-user aggregated stats |

### Materialized Views

| View Name | Description | Refresh |
|-----------|-------------|---------|
| `user_productivity_metrics` | Productivity calculations | Manual/Cron |

### RPC Functions

| Function | Description |
|----------|-------------|
| `get_unified_work_items(...)` | Cursor-paginated list query |
| `get_user_work_summary()` | Current user's summary |
| `check_is_manager(org_id)` | Manager authorization check |
| `get_team_workload(org_id)` | Team workload data |

---

## Real-time Updates

Subscribe to changes via Supabase Realtime:

```typescript
// Subscribe to source tables
supabase
  .channel('work-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'aa_commitments',
    filter: `assignee_id=eq.${userId}`
  }, handleUpdate)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks',
    filter: `assignee_id=eq.${userId}`
  }, handleUpdate)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'intake_tickets',
    filter: `assigned_to=eq.${userId}`
  }, handleUpdate)
  .subscribe();
```

**Best Practice**: Use 300ms debounce on invalidations to prevent excessive re-fetching.

---

## Frontend Integration

### Hooks

```typescript
import {
  useUnifiedWorkItems,
  useUserWorkSummary,
  useUserProductivityMetrics,
  useTeamWorkload
} from '@/hooks/useUnifiedWork';

// Infinite scroll list
const { data, fetchNextPage, hasNextPage } = useUnifiedWorkItems(filters);

// Summary stats
const { data: summary } = useUserWorkSummary();

// Productivity metrics
const { data: metrics } = useUserProductivityMetrics();

// Team workload (managers only)
const { data: team } = useTeamWorkload(orgId);
```

### Route

```
/my-work?source=commitment&tracking_type=delivery&is_overdue=true
```

URL parameters are synced with filter state.

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| List items | 100 req/min |
| Summary | 60 req/min |
| Metrics | 30 req/min |
| Team workload | 30 req/min |

---

## Related Documentation

- [Feature Spec](../../specs/032-unified-work-management/spec.md)
- [Commitments API](./front-door-intake.md)
- [Authentication](./authentication.md)
