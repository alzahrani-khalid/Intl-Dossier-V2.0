# Unified Work Management API

## Overview

The Unified Work Management API provides consolidated views of commitments, tasks, and intake tickets with unified timelines and dossier context. All endpoints support real-time updates and advanced filtering.

## Endpoints

### Unified Work List

Get consolidated list of work items from all sources (commitments, tasks, intake tickets).

**Endpoint:** `GET /unified-work-list`

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `in_progress`, `review`, `completed`, `cancelled`)
- `priority` (optional): Filter by priority (`low`, `medium`, `high`, `urgent`)
- `assignee_id` (optional): Filter by assignee (defaults to current user)
- `source` (optional): Filter by source (`commitment`, `task`, `intake`)
- `tracking_type` (optional): Filter by tracking type (`delivery`, `follow_up`, `sla`)
- `dossier_id` (optional): Filter by linked dossier
- `overdue_only` (optional): Show only overdue items (boolean)
- `sort` (optional): Sort field (`deadline`, `priority`, `created_at`, default: `deadline`)
- `order` (optional): Sort order (`asc` or `desc`, default: `asc`)
- `cursor` (optional): Pagination cursor for cursor-based pagination
- `limit` (optional): Page size (default: 20, max: 100)

**Response (200 OK):**
```json
{
  "work_items": [
    {
      "work_item_id": "wi-uuid",
      "source": "commitment",
      "source_id": "comm-uuid",
      "title_en": "Draft MOU Framework Document",
      "title_ar": "صياغة وثيقة إطار مذكرة التفاهم",
      "description_en": "Create comprehensive MOU framework for climate cooperation",
      "description_ar": "إنشاء إطار شامل لمذكرة التفاهم للتعاون في مجال المناخ",
      "status": "in_progress",
      "priority": "high",
      "tracking_type": "delivery",
      "assignee_id": "user-uuid",
      "assignee_name": "John Doe",
      "deadline": "2024-02-15T00:00:00Z",
      "is_overdue": false,
      "days_until_due": 31,
      "progress_percentage": 65,
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "dossiers": [
        {
          "dossier_id": "dossier-uuid",
          "dossier_type": "country",
          "dossier_name_en": "Country X",
          "dossier_name_ar": "الدولة X",
          "inheritance_source": "direct"
        }
      ],
      "metadata": {
        "after_action_id": "aar-uuid",
        "engagement_id": "engagement-uuid"
      }
    },
    {
      "work_item_id": "wi-uuid-2",
      "source": "intake",
      "source_id": "ticket-uuid",
      "title_en": "Request for Position Paper on Trade Policy",
      "title_ar": "طلب ورقة موقف بشأن السياسة التجارية",
      "status": "pending",
      "priority": "urgent",
      "tracking_type": "sla",
      "assignee_id": "user-uuid",
      "deadline": "2024-01-18T00:00:00Z",
      "is_overdue": false,
      "days_until_due": 3,
      "sla_status": "at_risk",
      "sla_remaining_hours": 68,
      "created_at": "2024-01-13T09:00:00Z",
      "dossiers": []
    },
    {
      "work_item_id": "wi-uuid-3",
      "source": "task",
      "source_id": "task-uuid",
      "title_en": "Review Draft Climate Position",
      "title_ar": "مراجعة مسودة موقف المناخ",
      "status": "review",
      "priority": "medium",
      "tracking_type": "delivery",
      "assignee_id": "user-uuid",
      "deadline": "2024-01-20T00:00:00Z",
      "is_overdue": false,
      "days_until_due": 5,
      "workflow_stage": "review",
      "created_at": "2024-01-10T14:00:00Z",
      "dossiers": [
        {
          "dossier_id": "dossier-uuid-2",
          "dossier_type": "organization",
          "dossier_name_en": "Ministry of Environment",
          "inheritance_source": "engagement"
        }
      ]
    }
  ],
  "summary": {
    "total": 45,
    "by_status": {
      "pending": 12,
      "in_progress": 20,
      "review": 8,
      "completed": 5
    },
    "by_priority": {
      "urgent": 3,
      "high": 15,
      "medium": 20,
      "low": 7
    },
    "by_source": {
      "commitment": 18,
      "task": 15,
      "intake": 12
    },
    "overdue_count": 4,
    "at_risk_count": 8
  },
  "pagination": {
    "next_cursor": "cursor-string",
    "has_more": true,
    "total": 45,
    "limit": 20
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid query parameters
  ```json
  {
    "error": "Invalid status value",
    "error_ar": "قيمة الحالة غير صالحة"
  }
  ```
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Query failed

**Implementation Example:**
```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

const useUnifiedWorkList = (filters?: {
  status?: string;
  priority?: string;
  overdueOnly?: boolean;
}) => {
  return useInfiniteQuery({
    queryKey: ['unified-work', filters],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.overdueOnly) params.append('overdue_only', 'true');
      if (pageParam) params.append('cursor', pageParam);
      params.append('limit', '20');

      const response = await fetch(`/unified-work-list?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_ar || error.error);
      }

      return await response.json();
    },
    getNextPageParam: (lastPage) => lastPage.pagination.next_cursor,
    refetchInterval: 30000 // Refetch every 30 seconds
  });
};
```

**Notes:**
- Unified view powered by `unified_work_items` materialized view
- Real-time updates via Supabase Realtime subscriptions
- Cursor-based pagination for efficient large result sets
- Dossier context inherited from engagements, after-actions, and positions
- Status normalization across different source types
- SLA tracking for intake tickets with `at_risk` and `breached` indicators

---

### Unified Timeline

Get chronological timeline of all work-related activities.

**Endpoint:** `GET /unified-timeline`

**Query Parameters:**
- `user_id` (optional): Filter by user (defaults to current user)
- `dossier_id` (optional): Filter by dossier
- `event_types` (optional): Comma-separated event types filter
- `date_from` (optional): Start date for timeline
- `date_to` (optional): End date for timeline
- `limit` (optional): Page size (default: 50, max: 200)
- `offset` (optional): Page offset

**Response (200 OK):**
```json
{
  "timeline_events": [
    {
      "event_id": "event-uuid",
      "timestamp": "2024-01-15T10:30:00Z",
      "event_type": "work_item_completed",
      "title_en": "Completed: Draft MOU Framework Document",
      "title_ar": "مكتمل: صياغة وثيقة إطار مذكرة التفاهم",
      "description_en": "Work item marked as completed",
      "description_ar": "تم وضع علامة على عنصر العمل كمكتمل",
      "user_id": "user-uuid",
      "user_name": "John Doe",
      "entity_type": "commitment",
      "entity_id": "comm-uuid",
      "metadata": {
        "previous_status": "in_progress",
        "new_status": "completed",
        "completion_percentage": 100
      },
      "dossiers": [
        {
          "dossier_id": "dossier-uuid",
          "dossier_name_en": "Country X"
        }
      ]
    },
    {
      "event_id": "event-uuid-2",
      "timestamp": "2024-01-15T09:15:00Z",
      "event_type": "work_item_assigned",
      "title_en": "New Assignment: Review Climate Position",
      "title_ar": "مهمة جديدة: مراجعة موقف المناخ",
      "user_id": "user-uuid",
      "entity_type": "task",
      "entity_id": "task-uuid",
      "metadata": {
        "assigned_by": "manager-uuid",
        "priority": "high",
        "deadline": "2024-01-20T00:00:00Z"
      }
    },
    {
      "event_id": "event-uuid-3",
      "timestamp": "2024-01-14T16:30:00Z",
      "event_type": "deadline_approaching",
      "title_en": "Deadline Reminder: Position Paper Request",
      "title_ar": "تذكير بالموعد النهائي: طلب ورقة موقف",
      "entity_type": "intake",
      "entity_id": "ticket-uuid",
      "metadata": {
        "days_until_due": 3,
        "sla_status": "at_risk"
      }
    },
    {
      "event_id": "event-uuid-4",
      "timestamp": "2024-01-13T11:00:00Z",
      "event_type": "commitment_created",
      "title_en": "New Commitment: Follow-up Meeting with Country Y",
      "title_ar": "التزام جديد: اجتماع متابعة مع الدولة Y",
      "user_id": "user-uuid",
      "entity_type": "commitment",
      "entity_id": "comm-uuid-2",
      "metadata": {
        "after_action_id": "aar-uuid",
        "tracking_type": "follow_up",
        "deadline": "2024-02-01T00:00:00Z"
      },
      "dossiers": [
        {
          "dossier_id": "dossier-uuid-3",
          "dossier_name_en": "Country Y"
        }
      ]
    }
  ],
  "total": 234,
  "date_range": {
    "from": "2024-01-01T00:00:00Z",
    "to": "2024-01-15T23:59:59Z"
  },
  "event_counts_by_type": {
    "work_item_completed": 45,
    "work_item_assigned": 30,
    "deadline_approaching": 15,
    "commitment_created": 20,
    "status_changed": 60,
    "priority_escalated": 8
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid query parameters or date range
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Timeline generation failed

**Supported Event Types:**
- `work_item_created` - New work item created
- `work_item_assigned` - Work item assigned to user
- `work_item_completed` - Work item marked completed
- `status_changed` - Work item status updated
- `priority_escalated` - Priority increased
- `deadline_approaching` - Deadline within warning threshold
- `deadline_overdue` - Deadline passed
- `commitment_created` - New commitment from after-action
- `task_reassigned` - Task reassigned to different user
- `sla_at_risk` - Intake ticket SLA at risk
- `sla_breached` - Intake ticket SLA breached

---

### Work Item Dossiers

Manage dossier associations for work items.

**Endpoint:** `POST /work-item-dossiers` or `GET /work-item-dossiers`

**Link Work Item to Dossiers:**

**Request Body:**
```json
{
  "work_item_id": "wi-uuid",
  "dossier_ids": ["dossier-uuid-1", "dossier-uuid-2"],
  "inheritance_source": "direct"
}
```

**Response (201 Created):**
```json
{
  "linked": 2,
  "work_item_id": "wi-uuid",
  "dossiers": [
    {
      "dossier_id": "dossier-uuid-1",
      "dossier_type": "country",
      "dossier_name_en": "Country X",
      "inheritance_source": "direct",
      "linked_at": "2024-01-15T10:30:00Z"
    },
    {
      "dossier_id": "dossier-uuid-2",
      "dossier_type": "organization",
      "dossier_name_en": "Ministry of Environment",
      "inheritance_source": "direct",
      "linked_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Get Work Item Dossiers:**
```http
GET /work-item-dossiers?work_item_id=wi-uuid
```

**Response (200 OK):**
```json
{
  "work_item_id": "wi-uuid",
  "dossiers": [
    {
      "dossier_id": "dossier-uuid",
      "dossier_type": "country",
      "dossier_name_en": "Country X",
      "dossier_name_ar": "الدولة X",
      "inheritance_source": "engagement",
      "linked_via_entity_type": "engagement",
      "linked_via_entity_id": "engagement-uuid"
    }
  ],
  "total": 3
}
```

**Delete Dossier Link (DELETE /work-item-dossiers):**

**Request Body:**
```json
{
  "work_item_id": "wi-uuid",
  "dossier_id": "dossier-uuid"
}
```

**Response (200 OK):**
```json
{
  "unlinked": true,
  "work_item_id": "wi-uuid",
  "dossier_id": "dossier-uuid"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid work_item_id or dossier_id
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to link dossiers
- `404 Not Found` - Work item or dossier not found
- `500 Internal Server Error` - Operation failed

---

## Work Item Sources

Work items originate from three sources:

| Source | Description | Typical Use Case |
|--------|-------------|------------------|
| `commitment` | Promises from after-action records | Deliverables, follow-ups from meetings |
| `task` | Internal operational tasks | Assignments, reviews, approvals |
| `intake` | Service requests through intake system | Support tickets, policy requests |

## Tracking Types

Work items are categorized by tracking method:

| Tracking Type | Description | Key Metrics |
|---------------|-------------|-------------|
| `delivery` | Deliverable-based tracking | Progress %, completion date |
| `follow_up` | External party follow-up | Contact attempts, responses |
| `sla` | SLA-driven with deadlines | SLA compliance, breach risk |

## Dossier Context Inheritance

Work items can be linked to dossiers through various inheritance sources:

| Inheritance Source | Description |
|--------------------|-------------|
| `direct` | Directly linked by user |
| `engagement` | Inherited from parent engagement |
| `after_action` | Inherited from after-action record |
| `position` | Inherited from position paper |
| `mou` | Inherited from MOU agreement |

## Real-Time Updates

Subscribe to work item changes via Supabase Realtime:

```typescript
const supabase = createClient(projectUrl, anonKey);

const channel = supabase
  .channel('unified-work-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'unified_work_items',
      filter: `assignee_id=eq.${userId}`
    },
    (payload) => {
      console.log('Work item changed:', payload);
      // Refetch work list
    }
  )
  .subscribe();
```

## Related APIs

- [Commitments](./commitments.md) - Commitment tracking
- [Assignments](./assignments.md) - Task management
- [Intake](./intake.md) - Service request processing
- [Dossiers](./dossiers.md) - Dossier context
