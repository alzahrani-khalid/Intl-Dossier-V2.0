# Assignment Detail API Documentation

**Feature**: 014-full-assignment-detail
**Version**: 1.0
**Base URL**: `https://your-project.supabase.co/functions/v1`

## Overview

The Assignment Detail API provides comprehensive endpoints for viewing and managing individual assignments, including:
- Assignment metadata and work item details
- Comment threads with @mentions and reactions
- Checklist management with templates
- Escalation and observer management
- Engagement context and kanban board
- Real-time updates via Supabase Realtime

## Authentication

All endpoints require authentication via Supabase JWT token:

```
Authorization: Bearer <supabase-jwt-token>
```

## Rate Limits

- **General API**: 60 requests/minute per user
- **Comment Creation**: 10 comments/minute per assignment
- **Escalation**: 1 escalation/hour per assignment

## Endpoints

### 1. Get Assignment Detail

Retrieve comprehensive assignment information including metadata, comments, checklist, timeline, and engagement context.

**Endpoint**: `GET /assignments-get/{id}`

**Path Parameters**:
- `id` (string, required): Assignment UUID

**Response**: `200 OK`
```json
{
  "assignment": {
    "id": "uuid",
    "assignee_id": "uuid",
    "work_item_type": "dossier",
    "work_item_id": "DSR-2025-001",
    "priority": "high",
    "status": "assigned",
    "sla_deadline": "2025-10-05T14:00:00Z",
    "sla_remaining_seconds": 3600,
    "sla_health_status": "safe",
    "engagement_id": "uuid",
    "workflow_stage": "todo",
    "created_at": "2025-10-04T10:00:00Z",
    "updated_at": "2025-10-04T12:00:00Z"
  },
  "assignee": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "avatar_url": "https://..."
  },
  "work_item": {
    "type": "dossier",
    "id": "DSR-2025-001",
    "title": "Dossier Title",
    "content_preview": "First 200 characters...",
    "required_skills": ["Document Review", "Arabic Translation"]
  },
  "comments": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_name": "John Doe",
      "text": "@supervisor please review",
      "mentions": [
        {
          "user_id": "uuid",
          "username": "supervisor"
        }
      ],
      "reactions": [
        {
          "emoji": "👍",
          "count": 3,
          "users": ["Alice", "Bob", "Carol"]
        }
      ],
      "created_at": "2025-10-04T11:00:00Z",
      "updated_at": "2025-10-04T11:00:00Z"
    }
  ],
  "checklist": {
    "items": [
      {
        "id": "uuid",
        "text": "Review documents",
        "completed": true,
        "completed_at": "2025-10-04T11:30:00Z",
        "completed_by": "uuid",
        "completed_by_name": "John Doe",
        "sequence": 1
      }
    ],
    "progress": {
      "completed": 1,
      "total": 3,
      "percentage": 33
    }
  },
  "observers": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_name": "Supervisor Name",
      "role": "supervisor",
      "added_at": "2025-10-04T12:00:00Z"
    }
  ],
  "timeline": [
    {
      "id": "uuid",
      "event_type": "created",
      "actor_user_id": "uuid",
      "actor_name": "System",
      "event_data": {},
      "created_at": "2025-10-04T10:00:00Z"
    }
  ],
  "engagement_context": {
    "id": "uuid",
    "title_en": "Minister Visit",
    "title_ar": "زيارة الوزير",
    "engagement_type": "minister_visit",
    "start_date": "2025-10-10T00:00:00Z",
    "end_date": "2025-10-12T00:00:00Z",
    "progress": {
      "total_assignments": 5,
      "completed_assignments": 2,
      "progress_percentage": 40
    }
  }
}
```

**Error Responses**:
- `403 Forbidden`: User lacks view permission
- `404 Not Found`: Assignment does not exist
- `429 Too Many Requests`: Rate limit exceeded

---

### 2. Create Comment

Add a comment to an assignment with optional @mentions.

**Endpoint**: `POST /assignments-comments-create`

**Request Body**:
```json
{
  "assignment_id": "uuid",
  "text": "@supervisor please review this assignment"
}
```

**Response**: `201 Created`
```json
{
  "comment": {
    "id": "uuid",
    "assignment_id": "uuid",
    "user_id": "uuid",
    "text": "@supervisor please review this assignment",
    "created_at": "2025-10-04T12:00:00Z",
    "updated_at": "2025-10-04T12:00:00Z"
  },
  "mentions": [
    {
      "id": "uuid",
      "comment_id": "uuid",
      "mentioned_user_id": "uuid",
      "notified_at": "2025-10-04T12:00:00Z"
    }
  ]
}
```

**Validation**:
- `text`: max 5000 characters, required
- @mentions: validated for user existence and view permission

**Error Responses**:
- `400 Bad Request`: Invalid input (text too long, empty)
- `403 Forbidden`: User lacks comment permission
- `429 Too Many Requests`: Exceeded 10 comments/minute limit

---

### 3. Toggle Comment Reaction

Add or remove emoji reaction to a comment.

**Endpoint**: `POST /assignments-comments-reactions-toggle`

**Request Body**:
```json
{
  "comment_id": "uuid",
  "emoji": "👍"
}
```

**Response**: `200 OK`
```json
{
  "reaction": {
    "id": "uuid",
    "comment_id": "uuid",
    "user_id": "uuid",
    "emoji": "👍",
    "created_at": "2025-10-04T12:05:00Z"
  },
  "action": "added"
}
```

**Allowed Emojis**: `👍`, `✅`, `❓`, `❤️`, `🎯`, `💡`

**Behavior**:
- If reaction exists: Remove it (toggle off), return `action: "removed"`
- If reaction doesn't exist: Add it (toggle on), return `action: "added"`

**Error Responses**:
- `400 Bad Request`: Invalid emoji
- `403 Forbidden`: User lacks view permission
- `404 Not Found`: Comment does not exist

---

### 4. Create Checklist Item

Add a single checklist item to an assignment.

**Endpoint**: `POST /assignments-checklist-create-item`

**Request Body**:
```json
{
  "assignment_id": "uuid",
  "text": "Verify data accuracy"
}
```

**Response**: `201 Created`
```json
{
  "checklist_item": {
    "id": "uuid",
    "assignment_id": "uuid",
    "text": "Verify data accuracy",
    "completed": false,
    "sequence": 4,
    "created_at": "2025-10-04T12:10:00Z"
  }
}
```

**Validation**:
- `text`: max 500 characters, required

**Error Responses**:
- `400 Bad Request`: Invalid input
- `403 Forbidden`: User lacks permission

---

### 5. Import Checklist Template

Bulk create checklist items from a predefined template.

**Endpoint**: `POST /assignments-checklist-import-template`

**Request Body**:
```json
{
  "assignment_id": "uuid",
  "template_id": "uuid"
}
```

**Response**: `201 Created`
```json
{
  "imported_items": [
    {
      "id": "uuid",
      "assignment_id": "uuid",
      "text": "Review documents",
      "completed": false,
      "sequence": 1,
      "created_at": "2025-10-04T12:15:00Z"
    },
    {
      "id": "uuid",
      "assignment_id": "uuid",
      "text": "Verify data",
      "completed": false,
      "sequence": 2,
      "created_at": "2025-10-04T12:15:00Z"
    }
  ],
  "template": {
    "id": "uuid",
    "name_en": "Dossier Review Template",
    "name_ar": "قالب مراجعة الملف"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Template not found or not applicable to work item type
- `403 Forbidden`: User lacks permission

---

### 6. Toggle Checklist Item

Mark checklist item as complete or incomplete.

**Endpoint**: `POST /assignments-checklist-toggle-item`

**Request Body**:
```json
{
  "item_id": "uuid",
  "completed": true
}
```

**Response**: `200 OK`
```json
{
  "checklist_item": {
    "id": "uuid",
    "assignment_id": "uuid",
    "text": "Review documents",
    "completed": true,
    "completed_at": "2025-10-04T12:20:00Z",
    "completed_by": "uuid",
    "sequence": 1
  },
  "progress": {
    "completed": 2,
    "total": 3,
    "percentage": 67
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input
- `403 Forbidden`: User lacks permission
- `404 Not Found`: Checklist item does not exist

---

### 7. Escalate Assignment

Add supervisor as observer and trigger notification.

**Endpoint**: `POST /assignments-escalate`

**Request Body**:
```json
{
  "assignment_id": "uuid",
  "reason": "SLA approaching deadline"
}
```

**Response**: `200 OK`
```json
{
  "observer": {
    "id": "uuid",
    "assignment_id": "uuid",
    "user_id": "uuid",
    "role": "supervisor",
    "added_at": "2025-10-04T12:25:00Z"
  },
  "notification_sent": true,
  "timeline_event_id": "uuid"
}
```

**Validation**:
- `reason`: max 1000 characters, required
- Rate limit: 1 escalation/hour per assignment

**Error Responses**:
- `400 Bad Request`: Already escalated within last hour
- `403 Forbidden`: User lacks escalate permission
- `429 Too Many Requests`: Rate limit exceeded

---

### 8. Complete Assignment

Mark assignment as completed and stop SLA tracking.

**Endpoint**: `POST /assignments-complete`

**Request Body**:
```json
{
  "assignment_id": "uuid",
  "completion_notes": "All tasks completed successfully"
}
```

**Response**: `200 OK`
```json
{
  "assignment": {
    "id": "uuid",
    "status": "completed",
    "workflow_stage": "done",
    "completed_at": "2025-10-04T12:30:00Z",
    "completed_by": "uuid"
  },
  "timeline_event_id": "uuid"
}
```

**Validation**:
- `completion_notes`: max 2000 characters, optional
- Optimistic locking: checks version field to prevent concurrent updates

**Error Responses**:
- `400 Bad Request`: Assignment already completed
- `403 Forbidden`: User lacks permission
- `409 Conflict`: Concurrent update detected (version mismatch)

---

### 9. Observer Action

Handle observer actions: accept assignment, reassign, or continue observing.

**Endpoint**: `POST /assignments-observer-action`

**Request Body**:
```json
{
  "assignment_id": "uuid",
  "action": "accept",
  "reassign_to_user_id": null
}
```

**Actions**:
- `accept`: Observer becomes assignee
- `reassign`: Reassign to another user (requires `reassign_to_user_id`)
- `observe`: Continue observing (no changes)

**Response**: `200 OK`
```json
{
  "assignment": {
    "id": "uuid",
    "assignee_id": "uuid",
    "updated_at": "2025-10-04T12:35:00Z"
  },
  "action_taken": "accept",
  "timeline_event_id": "uuid"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid action or missing reassign_to_user_id
- `403 Forbidden`: User is not an observer
- `404 Not Found`: Assignment does not exist

---

### 10. Get Related Assignments

Retrieve sibling assignments in the same engagement or dossier.

**Endpoint**: `GET /assignments-related-get/{id}`

**Path Parameters**:
- `id` (string, required): Assignment UUID

**Response**: `200 OK`
```json
{
  "context_type": "engagement",
  "context_id": "uuid",
  "related_assignments": [
    {
      "id": "uuid",
      "title": "Prepare briefing materials",
      "assignee": {
        "id": "uuid",
        "name": "Alice Smith"
      },
      "status": "in_progress",
      "workflow_stage": "in_progress",
      "sla_remaining_seconds": 7200,
      "priority": "high"
    }
  ],
  "engagement_context": {
    "id": "uuid",
    "title_en": "Minister Visit",
    "title_ar": "زيارة الوزير",
    "progress_percentage": 40
  }
}
```

**Context Types**:
- `engagement`: Assignment linked to multi-task engagement
- `dossier`: Standalone assignment from dossier
- `ticket`: Standalone assignment from intake ticket

**Error Responses**:
- `403 Forbidden`: User lacks view permission
- `404 Not Found`: Assignment does not exist

---

### 11. Get Engagement Kanban Board

Retrieve all assignments for an engagement grouped by workflow stage.

**Endpoint**: `GET /engagements-kanban-get/{engagement_id}`

**Path Parameters**:
- `engagement_id` (string, required): Engagement UUID

**Response**: `200 OK`
```json
{
  "engagement": {
    "id": "uuid",
    "title_en": "Minister Visit",
    "title_ar": "زيارة الوزير"
  },
  "kanban_columns": {
    "todo": [
      {
        "id": "uuid",
        "title": "Prepare briefing materials",
        "assignee": {
          "id": "uuid",
          "name": "Alice Smith"
        },
        "sla_remaining_seconds": 7200,
        "priority": "high",
        "is_current_user_assignment": false
      }
    ],
    "in_progress": [
      {
        "id": "uuid",
        "title": "Review dossier",
        "assignee": {
          "id": "uuid",
          "name": "Bob Jones"
        },
        "sla_remaining_seconds": 3600,
        "priority": "high",
        "is_current_user_assignment": true
      }
    ],
    "review": [],
    "done": [
      {
        "id": "uuid",
        "title": "Compile contact list",
        "assignee": {
          "id": "uuid",
          "name": "Carol White"
        },
        "completed_at": "2025-10-03T14:00:00Z",
        "priority": "medium",
        "is_current_user_assignment": false
      }
    ]
  },
  "progress": {
    "total_assignments": 5,
    "completed_assignments": 2,
    "in_progress_assignments": 2,
    "todo_assignments": 1,
    "progress_percentage": 40
  }
}
```

**Error Responses**:
- `403 Forbidden`: User lacks view permission to engagement
- `404 Not Found`: Engagement does not exist

---

### 12. Update Workflow Stage

Update assignment workflow stage (for kanban drag-and-drop).

**Endpoint**: `PATCH /assignments-workflow-stage-update/{id}`

**Path Parameters**:
- `id` (string, required): Assignment UUID

**Request Body**:
```json
{
  "workflow_stage": "in_progress"
}
```

**Allowed Values**: `todo`, `in_progress`, `review`, `done`

**Response**: `200 OK`
```json
{
  "assignment": {
    "id": "uuid",
    "workflow_stage": "in_progress",
    "updated_at": "2025-10-04T12:40:00Z"
  },
  "timeline_event_id": "uuid",
  "realtime_broadcast_sent": true
}
```

**Behavior**:
- Updates workflow_stage only (status unchanged)
- Creates timeline event
- Broadcasts real-time update to all viewers
- Auto-synced with status when status changes (via trigger)

**Error Responses**:
- `400 Bad Request`: Invalid workflow stage
- `403 Forbidden`: User lacks permission
- `404 Not Found`: Assignment does not exist

---

## Real-time Subscriptions

All assignment data supports real-time updates via Supabase Realtime. Subscribe to changes using:

```typescript
const channel = supabase
  .channel(`assignment:${assignmentId}`)
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'assignments', filter: `id=eq.${assignmentId}` },
    (payload) => {
      // Handle assignment updates
    }
  )
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'assignment_comments', filter: `assignment_id=eq.${assignmentId}` },
    (payload) => {
      // Handle new comments
    }
  )
  .subscribe()
```

**Tables with Real-time Support**:
- `assignments` (status, workflow_stage updates)
- `assignment_comments` (new comments)
- `comment_reactions` (reactions added/removed)
- `assignment_checklist_items` (checklist completion)
- `assignment_events` (timeline updates)
- `assignment_observers` (observers added)

**Latency Target**: < 1 second for all real-time updates

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific_field",
    "reason": "validation failure reason"
  }
}
```

**Common Error Codes**:
- `UNAUTHORIZED`: Missing or invalid authentication token
- `FORBIDDEN`: User lacks permission for this resource
- `NOT_FOUND`: Resource does not exist
- `VALIDATION_ERROR`: Invalid input data
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `CONFLICT`: Concurrent update detected

---

## Pagination

Comments and timeline events support pagination:

**Query Parameters**:
- `limit` (integer): Items per page (default: 50, max: 100)
- `offset` (integer): Items to skip (default: 0)

**Example**:
```
GET /assignments-get/{id}?comments_limit=50&comments_offset=100
```

---

## Bilingual Support

All user-facing text fields support both English and Arabic:

**Response Fields**:
- `title_en`, `title_ar`: Engagement titles
- `name_en`, `name_ar`: Template names
- `description_en`, `description_ar`: Template descriptions

**Request Headers**:
- `Accept-Language`: `en` or `ar` (determines localized error messages)

---

## Security

### Row Level Security (RLS)

All tables enforce RLS policies:
- **Assignees**: Full access to their assignments
- **Observers**: View access to observed assignments
- **Unauthorized users**: No access

### Rate Limiting

Enforced at multiple levels:
- Per-user global limit: 60 requests/minute
- Per-assignment comment limit: 10 comments/minute
- Per-assignment escalation limit: 1 escalation/hour

### Input Validation

- Text fields: HTML sanitized
- @mentions: User existence and permission validated
- Emoji reactions: Whitelist enforced
- SQL injection: Parameterized queries only

---

## Changelog

### Version 1.0 (2025-10-04)
- Initial release
- 12 endpoints for assignment detail management
- Engagement context and kanban board support
- Real-time updates via Supabase Realtime
- Bilingual support (English/Arabic)
- WCAG 2.1 AA accessibility compliance

---

**Status**: Documentation complete ✅
**Last Updated**: 2025-10-04
