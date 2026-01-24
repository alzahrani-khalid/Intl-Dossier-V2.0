# Commitments & Deliverables API

## Overview

The Commitments & Deliverables API tracks promises made in after-action records, monitors status updates, detects overdue commitments, and maintains commitment statistics. All endpoints support bilingual content and real-time status tracking.

## Endpoints

### Update Commitment Status

Update status of a commitment with evidence and notes.

**Endpoint:** `POST /commitments-update-status`

**Request Body:**
```json
{
  "commitment_id": "comm-uuid",
  "status": "in_progress",
  "progress_percentage": 65,
  "notes_en": "Drafted framework document, pending review",
  "notes_ar": "تم صياغة وثيقة الإطار، بانتظار المراجعة",
  "evidence_urls": [
    "https://storage.supabase.co/documents/draft-framework.pdf"
  ],
  "next_milestone_date": "2024-02-01T00:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "commitment_id": "comm-uuid",
  "status": "in_progress",
  "progress_percentage": 65,
  "previous_status": "not_started",
  "updated_by": "user-uuid",
  "updated_at": "2024-01-15T10:30:00Z",
  "status_history": [
    {
      "status": "not_started",
      "timestamp": "2024-01-01T00:00:00Z"
    },
    {
      "status": "in_progress",
      "timestamp": "2024-01-15T10:30:00Z",
      "notes_en": "Drafted framework document, pending review"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Invalid commitment_id or status value
  ```json
  {
    "error": "Invalid status. Must be one of: not_started, in_progress, completed, blocked, cancelled",
    "error_ar": "حالة غير صالحة. يجب أن تكون إحدى: لم يبدأ، قيد التنفيذ، مكتمل، محظور، ملغى"
  }
  ```
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to update this commitment
- `404 Not Found` - Commitment not found
- `500 Internal Server Error` - Status update failed

**Implementation Example:**
```typescript
const updateCommitmentStatus = async (
  commitmentId: string,
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'cancelled',
  progressPercentage: number,
  notes: { en: string; ar: string }
) => {
  const response = await fetch('/commitments-update-status', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      commitment_id: commitmentId,
      status,
      progress_percentage: progressPercentage,
      notes_en: notes.en,
      notes_ar: notes.ar
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_ar || error.error);
  }

  return await response.json();
};
```

**Notes:**
- Status transitions logged in commitment_status_history table
- Automatic notifications sent to stakeholders on status change
- Progress percentage: 0-100
- Evidence URLs stored in commitment_evidence table

---

### Deliverables

Get deliverables associated with commitments.

**Endpoint:** `GET /deliverables?commitment_id={id}`

**Query Parameters:**
- `commitment_id` (optional): Filter by specific commitment
- `status` (optional): Filter by status (`pending`, `submitted`, `approved`, `rejected`)
- `overdue` (optional): Show only overdue deliverables (boolean)

**Response (200 OK):**
```json
{
  "deliverables": [
    {
      "deliverable_id": "deliv-uuid",
      "commitment_id": "comm-uuid",
      "title_en": "Framework Implementation Plan",
      "title_ar": "خطة تنفيذ الإطار",
      "description_en": "Detailed implementation roadmap",
      "description_ar": "خارطة طريق تنفيذ مفصلة",
      "due_date": "2024-02-15T00:00:00Z",
      "status": "in_progress",
      "submitted_at": null,
      "approved_at": null,
      "document_url": null,
      "is_overdue": false,
      "days_until_due": 31
    }
  ],
  "total": 5,
  "overdue_count": 1
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to view deliverables
- `500 Internal Server Error` - Query failed

---

### Detect Overdue Commitments

Detect and flag overdue commitments (cron job endpoint).

**Endpoint:** `POST /detect-overdue-commitments`

**Request Body:**
```json
{
  "execution_time": "2024-01-15T00:00:00Z",
  "grace_period_days": 3
}
```

**Response (200 OK):**
```json
{
  "processed": true,
  "commitments_checked": 245,
  "newly_overdue": 8,
  "already_overdue": 12,
  "notifications_sent": 20,
  "escalations_created": 3,
  "execution_time_ms": 2341
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid service role key
- `500 Internal Server Error` - Detection failed

**Notes:**
- Called by cron job (typically daily at 00:00 UTC)
- Requires service role authentication
- Sends notifications to commitment owners
- Creates escalations for critically overdue commitments (>30 days)

---

### Refresh Commitment Stats

Refresh materialized view of commitment statistics.

**Endpoint:** `POST /refresh-commitment-stats`

**Request Body:**
```json
{
  "refresh_type": "full"
}
```

**Response (200 OK):**
```json
{
  "refreshed": true,
  "refresh_type": "full",
  "rows_updated": 1543,
  "execution_time_ms": 856,
  "last_refresh": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid service role key or admin role required
- `500 Internal Server Error` - Refresh failed

**Notes:**
- Materialized view: `commitment_stats_mv`
- Full refresh: Recalculates all statistics
- Incremental refresh: Updates changed records only
- Automatically triggered after bulk status updates

---

### Update Aging Buckets

Update commitment aging buckets for reporting.

**Endpoint:** `POST /update-aging-buckets`

**Request Body:**
```json
{
  "execution_time": "2024-01-15T00:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "updated": true,
  "commitments_processed": 245,
  "buckets": {
    "0-30_days": 145,
    "31-60_days": 58,
    "61-90_days": 25,
    "91-180_days": 12,
    "180+_days": 5
  },
  "execution_time_ms": 432
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid service role key
- `500 Internal Server Error` - Update failed

**Notes:**
- Called by cron job (daily at 01:00 UTC)
- Aging calculated from commitment creation date
- Used in analytics dashboards and reports
- Buckets: 0-30, 31-60, 61-90, 91-180, 180+ days

---

## Commitment Status Workflow

```
not_started → in_progress → completed
     ↓             ↓             ↓
  blocked      cancelled     approved
```

**Status Definitions:**
- `not_started`: Commitment created, no work begun
- `in_progress`: Active work underway
- `blocked`: Work halted due to external dependency
- `completed`: Work finished, pending approval
- `approved`: Deliverable approved by stakeholder
- `cancelled`: Commitment cancelled (with justification required)

## Commitment Types

Commitments are created from after-action records with different tracking types:

| Type | Description | Tracking Method |
|------|-------------|-----------------|
| `delivery` | Deliverable-based commitment | Track deliverable submission and approval |
| `follow_up` | External party follow-up | Track contact attempts and responses |
| `sla` | SLA-driven commitment | Track deadline adherence and escalation |

## Notification Triggers

Automatic notifications sent for:
1. **Status Change**: When commitment status updated
2. **Overdue Warning**: 7 days before due date
3. **Overdue Alert**: On due date
4. **Escalation**: 30 days overdue (critical)
5. **Completion**: When marked completed
6. **Approval**: When deliverable approved

## Related APIs

- [After Actions](./after-actions.md) - Source of commitments
- [Notifications](./notifications.md) - Commitment notifications
- [Analytics](./analytics-reporting.md) - Commitment metrics
- [Unified Work](./unified-work.md) - Commitments in unified work view
