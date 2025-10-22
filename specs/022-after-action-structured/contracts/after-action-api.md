# API Contract: After-Action CRUD Operations

**Version**: 1.0.0  
**Base URL**: `/functions/v1/after-action`  
**Authentication**: JWT Bearer Token (Supabase Auth)  
**Date**: 2025-01-14

## Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/create` | Create new draft after-action | Yes |
| PUT | `/update/:id` | Update existing draft | Yes |
| POST | `/publish/:id` | Publish after-action & create tasks | Yes |
| POST | `/request-edit/:id` | Request edit for published record | Yes |
| POST | `/approve-edit/:id` | Approve/reject edit request (supervisor) | Yes |
| GET | `/list` | List after-actions for dossier | Yes |
| GET | `/get/:id` | Get single after-action with details | Yes |
| DELETE | `/delete/:id` | Delete draft after-action | Yes |

---

## POST /create

Create a new draft after-action record.

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body**:
```json
{
  "engagement_id": "uuid",
  "dossier_id": "uuid",
  "title": "string (5-200 chars)",
  "description": "string (optional)",
  "confidentiality_level": "public" | "internal" | "confidential" | "secret",
  "attendance_list": [
    {
      "name": "string",
      "role": "string",
      "organization": "string"
    }
  ],
  "decisions": [
    {
      "description": "string (10-2000 chars)",
      "rationale": "string (optional)",
      "decision_maker": "string",
      "decided_at": "ISO8601 timestamp",
      "supporting_context": "string (optional)",
      "ai_extracted": boolean,
      "confidence_score": number (0.00-1.00, optional)
    }
  ],
  "commitments": [
    {
      "description": "string (10-2000 chars)",
      "owner_type": "internal" | "external",
      "owner_internal_id": "uuid (if internal)",
      "owner_external_id": "uuid (if external)",
      "due_date": "ISO8601 date",
      "priority": "low" | "medium" | "high" | "critical",
      "ai_extracted": boolean,
      "confidence_score": number (0.00-1.00, optional)
    }
  ],
  "risks": [
    {
      "description": "string (10-2000 chars)",
      "severity": "low" | "medium" | "high" | "critical",
      "likelihood": "rare" | "unlikely" | "possible" | "likely" | "certain",
      "mitigation_strategy": "string (optional)",
      "owner_id": "uuid (optional)",
      "ai_extracted": boolean,
      "confidence_score": number (0.00-1.00, optional)
    }
  ],
  "follow_up_actions": [
    {
      "description": "string (10-2000 chars)",
      "owner_id": "uuid (optional)",
      "due_date": "ISO8601 date (optional)",
      "ai_extracted": boolean,
      "confidence_score": number (0.00-1.00, optional)
    }
  ]
}
```

### Response

**Success (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "engagement_id": "uuid",
    "dossier_id": "uuid",
    "title": "string",
    "description": "string",
    "confidentiality_level": "internal",
    "status": "draft",
    "attendance_list": [...],
    "created_by": "uuid",
    "created_at": "ISO8601 timestamp",
    "_version": 1,
    "decisions": [...],
    "commitments": [...],
    "risks": [...],
    "follow_up_actions": []
  },
  "message": "After-action draft created successfully"
}
```

**Error (400 Bad Request)**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "issue": "Title must be between 5 and 200 characters"
      }
    ]
  }
}
```

**Error (403 Forbidden)**:
```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You do not have access to this dossier"
  }
}
```

**Error (404 Not Found)**:
```json
{
  "success": false,
  "error": {
    "code": "ENGAGEMENT_NOT_FOUND",
    "message": "Engagement does not exist"
  }
}
```

### Validation Rules

- `engagement_id` must exist and belong to `dossier_id`
- User must have dossier assignment for `dossier_id`
- User role must be 'staff', 'supervisor', or 'admin'
- `title` length: 5-200 characters
- Commitment `owner_internal_id` OR `owner_external_id` required (not both)
- Commitment `owner_internal_id` must exist in users table
- Commitment `owner_external_id` must exist in external_contacts table
- All array items validated against their respective schemas

### Business Logic

- Creates after_action_record with status='draft'
- Creates related entities (decisions, commitments, risks, follow_ups) in single transaction
- Sets `created_by` to authenticated user ID
- Initializes `_version` to 1
- Does NOT create task records (only on publish)
- Does NOT send notifications (only on publish)

---

## PUT /update/:id

Update an existing draft after-action.

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**URL Parameters**:
- `id`: UUID of after-action record

**Body**: Same structure as POST /create (all fields optional, only include fields to update)

### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "...": "updated fields",
    "updated_by": "uuid",
    "updated_at": "ISO8601 timestamp",
    "_version": 2
  },
  "message": "After-action updated successfully"
}
```

**Error (400 Bad Request - Optimistic Lock)**:
```json
{
  "success": false,
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "Record was modified by another user. Please refresh and try again.",
    "current_version": 3,
    "provided_version": 2
  }
}
```

**Error (403 Forbidden)**:
```json
{
  "success": false,
  "error": {
    "code": "CANNOT_UPDATE_PUBLISHED",
    "message": "Cannot update published after-action. Use request-edit endpoint instead."
  }
}
```

**Error (404 Not Found)**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "After-action record not found"
  }
}
```

### Validation Rules

- Record must exist and status must be 'draft'
- User must be creator OR have supervisor role
- User must have dossier assignment
- Optimistic locking: client must send `_version`, server checks match
- Increments `_version` on successful update

### Business Logic

- Updates after_action_record and related entities (decisions, commitments, risks, follow_ups)
- For nested arrays: performs diff (add new, update existing, delete removed)
- Sets `updated_by` and `updated_at`
- Increments `_version`
- Returns updated record with all related entities

---

## POST /publish/:id

Publish a draft after-action and create task records from commitments.

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**URL Parameters**:
- `id`: UUID of after-action record

**Body**:
```json
{
  "_version": number,
  "send_notifications": boolean (default: true)
}
```

### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "data": {
    "after_action": {
      "id": "uuid",
      "status": "published",
      "published_by": "uuid",
      "published_at": "ISO8601 timestamp",
      "_version": 2
    },
    "created_tasks": [
      {
        "id": "uuid",
        "commitment_id": "uuid",
        "description": "string",
        "owner_id": "uuid",
        "due_date": "ISO8601 date",
        "status": "pending"
      }
    ],
    "notifications_sent": 5
  },
  "message": "After-action published successfully. 5 tasks created."
}
```

**Error (400 Bad Request)**:
```json
{
  "success": false,
  "error": {
    "code": "MISSING_REQUIRED_FIELDS",
    "message": "Cannot publish: missing required information",
    "details": [
      {
        "issue": "Commitment at index 2 has no owner assigned"
      }
    ]
  }
}
```

**Error (403 Forbidden)**:
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_PUBLISHED",
    "message": "After-action is already published"
  }
}
```

### Validation Rules

- Record must exist and status must be 'draft'
- User must be creator OR have supervisor/admin role
- All commitments must have owner assigned (internal or external)
- All required fields must be completed

### Business Logic

1. Validate all data completeness
2. Update after_action status to 'published'
3. Set `published_by` and `published_at`
4. Increment `_version`
5. Create task records for each commitment with `owner_type='internal'` (in same transaction)
6. If `send_notifications=true`: Queue notifications for commitment owners
7. Send email to external contacts (if `email_enabled=true`)
8. Create version snapshot (version_number=1)
9. Return published record + created tasks

**Atomicity**: All operations in single database transaction. Rollback if any step fails.

---

## POST /request-edit/:id

Request permission to edit a published after-action (creator only).

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**URL Parameters**:
- `id`: UUID of after-action record

**Body**:
```json
{
  "reason": "string (10-500 chars, required)"
}
```

### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "data": {
    "after_action": {
      "id": "uuid",
      "status": "edit_pending",
      "edit_requested_by": "uuid",
      "edit_requested_at": "ISO8601 timestamp",
      "edit_request_reason": "string"
    },
    "supervisor_notified": true
  },
  "message": "Edit request submitted. Awaiting supervisor approval."
}
```

**Error (403 Forbidden)**:
```json
{
  "success": false,
  "error": {
    "code": "EDIT_ALREADY_PENDING",
    "message": "An edit request is already pending for this record"
  }
}
```

**Error (403 Forbidden)**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_CREATOR",
    "message": "Only the creator can request edits"
  }
}
```

### Validation Rules

- Record must exist and status must be 'published'
- User must be creator
- No pending edit request already exists
- `reason` length: 10-500 characters

### Business Logic

1. Update status to 'edit_pending'
2. Set `edit_requested_by`, `edit_requested_at`, `edit_request_reason`
3. Identify supervisor: user's manager OR dossier supervisor
4. Send notification to supervisor with edit request details
5. Lock record (prevent other edits until approved/rejected)

---

## POST /approve-edit/:id

Approve or reject edit request (supervisor only).

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**URL Parameters**:
- `id`: UUID of after-action record

**Body**:
```json
{
  "action": "approve" | "reject",
  "feedback": "string (optional, 0-500 chars)"
}
```

### Response

**Success (200 OK) - Approved**:
```json
{
  "success": true,
  "data": {
    "after_action": {
      "id": "uuid",
      "status": "published",
      "edit_approved_by": "uuid",
      "edit_approved_at": "ISO8601 timestamp",
      "_version": 3
    },
    "version_snapshot_created": true,
    "creator_notified": true
  },
  "message": "Edit request approved. Record is now editable."
}
```

**Success (200 OK) - Rejected**:
```json
{
  "success": true,
  "data": {
    "after_action": {
      "id": "uuid",
      "status": "published",
      "edit_rejection_reason": "string",
      "edit_requested_by": null,
      "edit_requested_at": null
    },
    "creator_notified": true
  },
  "message": "Edit request rejected."
}
```

**Error (403 Forbidden)**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Only supervisors can approve edit requests"
  }
}
```

### Validation Rules

- Record must exist and status must be 'edit_pending'
- User must have 'supervisor' or 'admin' role
- User must have dossier assignment

### Business Logic

**If Approved**:
1. Set `edit_approved_by`, `edit_approved_at`
2. Keep status as 'published' (record remains editable temporarily)
3. Create version snapshot (before edits)
4. Notify creator: "Your edit request was approved. You can now make changes."
5. Set expiry timer: edit window closes after 24 hours OR after next update

**If Rejected**:
1. Set `edit_rejection_reason` from feedback
2. Clear edit request fields (`edit_requested_by`, `edit_requested_at`, `edit_request_reason`)
3. Return status to 'published'
4. Notify creator: "Your edit request was rejected. Reason: [feedback]"

---

## GET /list

List after-actions for a dossier with filtering and pagination.

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `dossier_id` (required): UUID
- `status` (optional): `draft` | `published` | `edit_pending` (comma-separated)
- `created_by` (optional): UUID (filter by creator)
- `from_date` (optional): ISO8601 date (filter by created_at >= date)
- `to_date` (optional): ISO8601 date (filter by created_at <= date)
- `page` (optional): integer, default 1
- `limit` (optional): integer, default 20, max 100

### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "engagement_id": "uuid",
        "title": "string",
        "status": "published",
        "confidentiality_level": "internal",
        "created_by": "uuid",
        "created_at": "ISO8601 timestamp",
        "published_at": "ISO8601 timestamp",
        "decisions_count": 5,
        "commitments_count": 8,
        "risks_count": 3,
        "attachments_count": 2
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_items": 45,
      "total_pages": 3,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

**Error (403 Forbidden)**:
```json
{
  "success": false,
  "error": {
    "code": "NO_DOSSIER_ACCESS",
    "message": "You do not have access to this dossier"
  }
}
```

### Validation Rules

- User must have dossier assignment for `dossier_id`
- `limit` capped at 100 items per page

### Business Logic

- Returns after-actions for dossier with aggregate counts
- Applies RLS policies (user sees only assigned dossiers)
- Orders by `created_at DESC` by default
- Includes related entity counts (not full entities)

---

## GET /get/:id

Get single after-action with full details.

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**URL Parameters**:
- `id`: UUID of after-action record

**Query Parameters**:
- `include_attachments` (optional): boolean, default true
- `include_version_history` (optional): boolean, default false (supervisors only)

### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "engagement_id": "uuid",
    "dossier_id": "uuid",
    "title": "string",
    "description": "string",
    "confidentiality_level": "internal",
    "status": "published",
    "attendance_list": [...],
    "created_by": "uuid",
    "created_at": "ISO8601 timestamp",
    "updated_by": "uuid",
    "updated_at": "ISO8601 timestamp",
    "published_by": "uuid",
    "published_at": "ISO8601 timestamp",
    "_version": 2,
    "decisions": [...],
    "commitments": [...],
    "risks": [...],
    "follow_up_actions": [...],
    "attachments": [...],
    "version_history": [...]  // if requested and authorized
  }
}
```

**Error (404 Not Found)**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "After-action record not found"
  }
}
```

### Validation Rules

- User must have dossier assignment
- `include_version_history=true` requires supervisor role

### Business Logic

- Returns complete after-action with all related entities
- Generates signed URLs for attachments (24h expiry)
- Redacts confidential fields based on user role and confidentiality_level
- Includes version history only for supervisors/admins

---

## DELETE /delete/:id

Delete a draft after-action (creator only, drafts only).

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**URL Parameters**:
- `id`: UUID of after-action record

### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "message": "After-action draft deleted successfully"
}
```

**Error (403 Forbidden)**:
```json
{
  "success": false,
  "error": {
    "code": "CANNOT_DELETE_PUBLISHED",
    "message": "Cannot delete published after-actions. Archive instead."
  }
}
```

**Error (404 Not Found)**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "After-action record not found"
  }
}
```

### Validation Rules

- Record must exist and status must be 'draft'
- User must be creator
- User must have dossier assignment

### Business Logic

- Deletes after_action_record (CASCADE deletes related entities)
- Does NOT delete attachments from storage (orphaned files cleaned by cron job)
- Cannot delete published records (archive feature out of scope for this version)

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Request body validation failed |
| VERSION_CONFLICT | 400 | Optimistic lock conflict |
| MISSING_REQUIRED_FIELDS | 400 | Required fields missing for operation |
| PERMISSION_DENIED | 403 | User lacks permission for operation |
| NO_DOSSIER_ACCESS | 403 | User not assigned to dossier |
| NOT_CREATOR | 403 | Operation requires being creator |
| INSUFFICIENT_PERMISSIONS | 403 | Requires higher role (e.g., supervisor) |
| ALREADY_PUBLISHED | 403 | Cannot perform operation on published record |
| CANNOT_UPDATE_PUBLISHED | 403 | Use request-edit for published records |
| EDIT_ALREADY_PENDING | 403 | Edit request already exists |
| CANNOT_DELETE_PUBLISHED | 403 | Published records cannot be deleted |
| NOT_FOUND | 404 | Resource not found |
| ENGAGEMENT_NOT_FOUND | 404 | Referenced engagement does not exist |
| INTERNAL_ERROR | 500 | Server error (see logs for details) |

---

## Rate Limiting

- **General endpoints**: 100 requests per minute per user
- **Create/Update endpoints**: 20 requests per minute per user
- **Publish endpoint**: 10 requests per minute per user (prevents accidental duplicate publishes)

Rate limit headers included in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704902400
```

---

## Webhook Events

After certain operations, webhook events are emitted for external integrations:

| Event | Trigger | Payload |
|-------|---------|---------|
| `after_action.created` | Draft created | `{id, dossier_id, created_by}` |
| `after_action.published` | After-action published | `{id, dossier_id, published_by, tasks_created}` |
| `after_action.edit_requested` | Edit requested | `{id, requested_by, reason}` |
| `after_action.edit_approved` | Edit approved | `{id, approved_by}` |
| `after_action.edit_rejected` | Edit rejected | `{id, rejected_by, reason}` |

Configure webhooks via Supabase dashboard or Edge Function configuration.

---

## Next Steps

Proceed to generate AI extraction API contracts in `ai-extraction-api.md`.
