# After Action Records API

## Overview

The After Action Records (AAR) API manages post-engagement documentation including decisions, commitments, risks, and follow-up actions. AARs support versioning, approval workflows, and confidentiality controls. All records are linked to engagements and dossiers with bilingual content support (English/Arabic).

## Endpoints

### Create After Action Record

Create a new after action record with nested decisions, commitments, risks, and follow-up actions.

**Endpoint:** `POST /after-actions-create`

**Request Body:**
```json
{
  "engagement_id": "eng-550e8400-e29b-41d4-a716-446655440000",
  "is_confidential": false,
  "attendees": [
    "Minister of Foreign Affairs",
    "Ambassador to Saudi Arabia",
    "Director of Gulf Affairs"
  ],
  "notes": "Productive bilateral consultation on climate cooperation...",
  "decisions": [
    {
      "description": "Establish joint climate working group",
      "rationale": "Align on COP29 negotiation positions",
      "decision_maker": "Minister of Foreign Affairs",
      "decision_date": "2024-01-15"
    }
  ],
  "commitments": [
    {
      "description": "Submit draft MOU by February 15",
      "priority": "high",
      "owner_type": "internal",
      "owner_user_id": "user-550e8400-e29b-41d4-a716-446655440001",
      "due_date": "2024-02-15",
      "ai_confidence": 0.92
    },
    {
      "description": "Saudi side to nominate technical experts",
      "priority": "medium",
      "owner_type": "external",
      "owner_contact_email": "climate@mofa.gov.sa",
      "owner_contact_name": "Dr. Ahmed Al-Hussain",
      "due_date": "2024-02-01",
      "ai_confidence": 0.88
    }
  ],
  "risks": [
    {
      "description": "Timeline may conflict with G20 preparations",
      "severity": "medium",
      "likelihood": "possible",
      "mitigation_strategy": "Coordinate with G20 team on scheduling",
      "owner": "Director of Gulf Affairs"
    }
  ],
  "follow_up_actions": [
    {
      "description": "Schedule technical working group kickoff meeting",
      "assigned_to": "user-660e8400-e29b-41d4-a716-446655440002",
      "target_date": "2024-01-30"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "aar-770e8400-e29b-41d4-a716-446655440003",
  "engagement_id": "eng-550e8400-e29b-41d4-a716-446655440000",
  "dossier_id": "dos-880e8400-e29b-41d4-a716-446655440004",
  "publication_status": "draft",
  "is_confidential": false,
  "attendees": ["Minister of Foreign Affairs", "Ambassador to Saudi Arabia", "Director of Gulf Affairs"],
  "notes": "Productive bilateral consultation on climate cooperation...",
  "version": 1,
  "created_by": "user-id",
  "created_at": "2024-01-15T16:30:00Z",
  "decisions": [
    {
      "id": "dec-990e8400-e29b-41d4-a716-446655440005",
      "description": "Establish joint climate working group",
      "rationale": "Align on COP29 negotiation positions",
      "decision_maker": "Minister of Foreign Affairs",
      "decision_date": "2024-01-15"
    }
  ],
  "aa_commitments": [
    {
      "id": "com-aa0e8400-e29b-41d4-a716-446655440006",
      "description": "Submit draft MOU by February 15",
      "priority": "high",
      "status": "pending",
      "owner_type": "internal",
      "owner_user_id": "user-550e8400-e29b-41d4-a716-446655440001",
      "tracking_mode": "automatic",
      "due_date": "2024-02-15",
      "ai_confidence": 0.92
    }
  ],
  "aa_risks": [
    {
      "id": "risk-bb0e8400-e29b-41d4-a716-446655440007",
      "description": "Timeline may conflict with G20 preparations",
      "severity": "medium",
      "likelihood": "possible",
      "mitigation_strategy": "Coordinate with G20 team on scheduling",
      "owner": "Director of Gulf Affairs"
    }
  ],
  "aa_follow_up_actions": [
    {
      "id": "fua-cc0e8400-e29b-41d4-a716-446655440008",
      "description": "Schedule technical working group kickoff meeting",
      "assigned_to": "user-660e8400-e29b-41d4-a716-446655440002",
      "target_date": "2024-01-30",
      "completed": false
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Invalid engagement_id or validation errors (max 100 attendees)
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - No access to the engagement's dossier
- `404 Not Found` - Engagement not found
- `500 Internal Server Error` - Failed to create record or nested entities

**Implementation Example:**
```typescript
const createAfterAction = async (aarData: CreateAfterActionRequest) => {
  const response = await fetch('/after-actions-create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(aarData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create after action record');
  }

  return await response.json();
};
```

**Notes:**
- External commitments automatically create `external_contacts` if they don't exist
- Internal commitments use `automatic` tracking mode
- External commitments use `manual` tracking mode (follow-up required)
- All nested entities are created in a transaction (rollback on any failure)
- Initial version is set to 1 with `draft` publication status
- AAR inherits `dossier_id` from parent engagement

---

### Get After Action Record

Retrieve a single after action record with all nested entities.

**Endpoint:** `GET /after-actions-get?id={id}`

**Query Parameters:**
- `id` (required): UUID of the after action record

**Response (200 OK):**
```json
{
  "id": "aar-770e8400-e29b-41d4-a716-446655440003",
  "engagement_id": "eng-550e8400-e29b-41d4-a716-446655440000",
  "dossier_id": "dos-880e8400-e29b-41d4-a716-446655440004",
  "publication_status": "published",
  "is_confidential": false,
  "attendees": ["Minister of Foreign Affairs", "Ambassador to Saudi Arabia"],
  "notes": "Productive bilateral consultation...",
  "version": 3,
  "created_by": "user-id",
  "created_at": "2024-01-15T16:30:00Z",
  "updated_at": "2024-01-18T10:15:00Z",
  "published_at": "2024-01-18T10:20:00Z",
  "decisions": [...],
  "aa_commitments": [...],
  "aa_risks": [...],
  "aa_follow_up_actions": [...]
}
```

**Error Responses:**
- `400 Bad Request` - Missing id parameter
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - Insufficient permissions (confidential record or RLS)
- `404 Not Found` - Record not found

**Implementation Example:**
```typescript
const getAfterAction = async (aarId: string) => {
  const response = await fetch(
    `/after-actions-get?id=${aarId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (response.status === 403) {
    throw new Error('Access denied - confidential record');
  }

  return await response.json();
};
```

---

### List After Action Records

Retrieve paginated list of after action records with filtering.

**Endpoint:** `GET /after-actions-list`

**Query Parameters:**
- `engagement_id` (optional): Filter by engagement
- `dossier_id` (optional): Filter by dossier
- `publication_status` (optional): Filter by status (`draft`, `under_review`, `published`)
- `is_confidential` (optional): Filter by confidentiality (`true` or `false`)
- `created_after` (optional): ISO 8601 timestamp
- `created_before` (optional): ISO 8601 timestamp
- `limit` (optional): Number of results (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "aar-770e8400-e29b-41d4-a716-446655440003",
      "engagement_id": "eng-550e8400-e29b-41d4-a716-446655440000",
      "engagement": {
        "title": "Bilateral Climate Consultation",
        "engagement_date": "2024-01-15"
      },
      "dossier_id": "dos-880e8400-e29b-41d4-a716-446655440004",
      "publication_status": "published",
      "is_confidential": false,
      "version": 3,
      "created_at": "2024-01-15T16:30:00Z",
      "commitments_count": 5,
      "decisions_count": 3
    }
  ],
  "total": 47,
  "limit": 20,
  "offset": 0,
  "has_more": true
}
```

**Error Responses:**
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing authorization header

---

### Update After Action Record

Update an existing after action record. Only allowed in `draft` status unless emergency edit is approved.

**Endpoint:** `PUT /after-actions-update`

**Request Body:**
```json
{
  "id": "aar-770e8400-e29b-41d4-a716-446655440003",
  "notes": "Updated meeting notes with additional context...",
  "attendees": ["Minister of Foreign Affairs", "Ambassador to Saudi Arabia", "Director of Gulf Affairs", "Chief of Protocol"],
  "is_confidential": true
}
```

**Response (200 OK):**
```json
{
  "id": "aar-770e8400-e29b-41d4-a716-446655440003",
  "version": 4,
  "updated_at": "2024-01-19T14:30:00Z",
  "notes": "Updated meeting notes with additional context...",
  "is_confidential": true
}
```

**Error Responses:**
- `400 Bad Request` - Missing id or validation errors
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - Record is published and no edit approval exists
- `404 Not Found` - Record not found

**Notes:**
- Updates to published records require edit approval workflow
- Version is incremented on each update
- Nested entities (decisions, commitments, risks) have separate update endpoints

---

### Publish After Action Record

Publish a draft after action record to make it visible to broader audience.

**Endpoint:** `POST /after-actions-publish`

**Request Body:**
```json
{
  "id": "aar-770e8400-e29b-41d4-a716-446655440003",
  "publish_to_audience": "stakeholders"
}
```

**Response (200 OK):**
```json
{
  "id": "aar-770e8400-e29b-41d4-a716-446655440003",
  "publication_status": "published",
  "published_at": "2024-01-18T10:20:00Z",
  "published_by": "user-id",
  "version": 3
}
```

**Error Responses:**
- `400 Bad Request` - Missing id or record already published
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - Insufficient permissions to publish
- `404 Not Found` - Record not found

**Notes:**
- Only `draft` records can be published
- Publishing is irreversible (use edit workflow for changes)
- Triggers notifications to stakeholders
- Commitments become visible to assignees

---

### Request Edit for Published Record

Initiate edit request workflow for a published after action record.

**Endpoint:** `POST /after-actions-request-edit`

**Request Body:**
```json
{
  "after_action_id": "aar-770e8400-e29b-41d4-a716-446655440003",
  "reason": "Need to add follow-up commitment from subsequent discussion",
  "proposed_changes": "Add commitment: 'Provide technical specifications by March 1'"
}
```

**Response (201 Created):**
```json
{
  "edit_request_id": "edit-dd0e8400-e29b-41d4-a716-446655440009",
  "after_action_id": "aar-770e8400-e29b-41d4-a716-446655440003",
  "status": "pending",
  "requested_by": "user-id",
  "reason": "Need to add follow-up commitment from subsequent discussion",
  "created_at": "2024-01-20T09:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or record not published
- `401 Unauthorized` - Missing authorization header
- `404 Not Found` - Record not found

**Notes:**
- Edit requests require approval from record creator or dossier owner
- Only one pending edit request allowed per record
- Approved edit requests temporarily unlock the record for updates

---

### Approve Edit Request

Approve a pending edit request for a published record.

**Endpoint:** `POST /after-actions-approve-edit`

**Request Body:**
```json
{
  "edit_request_id": "edit-dd0e8400-e29b-41d4-a716-446655440009",
  "approval_notes": "Approved - valid addition to record"
}
```

**Response (200 OK):**
```json
{
  "edit_request_id": "edit-dd0e8400-e29b-41d4-a716-446655440009",
  "status": "approved",
  "approved_by": "user-id",
  "approved_at": "2024-01-20T10:15:00Z",
  "edit_window_expires": "2024-01-21T10:15:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing edit_request_id
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - Insufficient permissions to approve
- `404 Not Found` - Edit request not found

**Notes:**
- Approval grants 24-hour edit window
- Record automatically re-locks after window expires or edit is completed
- Version is incremented when edit is saved

---

### Reject Edit Request

Reject a pending edit request.

**Endpoint:** `POST /after-actions-reject-edit`

**Request Body:**
```json
{
  "edit_request_id": "edit-dd0e8400-e29b-41d4-a716-446655440009",
  "rejection_reason": "Insufficient justification for changes"
}
```

**Response (200 OK):**
```json
{
  "edit_request_id": "edit-dd0e8400-e29b-41d4-a716-446655440009",
  "status": "rejected",
  "rejected_by": "user-id",
  "rejected_at": "2024-01-20T10:30:00Z",
  "rejection_reason": "Insufficient justification for changes"
}
```

**Error Responses:**
- `400 Bad Request` - Missing edit_request_id
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - Insufficient permissions to reject
- `404 Not Found` - Edit request not found

---

### Get After Action Versions

Retrieve version history for an after action record.

**Endpoint:** `GET /after-actions-versions?after_action_id={id}`

**Query Parameters:**
- `after_action_id` (required): UUID of the after action record

**Response (200 OK):**
```json
{
  "after_action_id": "aar-770e8400-e29b-41d4-a716-446655440003",
  "current_version": 3,
  "versions": [
    {
      "version": 1,
      "created_at": "2024-01-15T16:30:00Z",
      "created_by": "user-id",
      "changes": "Initial creation"
    },
    {
      "version": 2,
      "created_at": "2024-01-17T11:20:00Z",
      "created_by": "user-id",
      "changes": "Added 2 additional commitments"
    },
    {
      "version": 3,
      "created_at": "2024-01-18T10:15:00Z",
      "created_by": "user-id",
      "changes": "Published record"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Missing after_action_id
- `401 Unauthorized` - Missing authorization header
- `404 Not Found` - Record not found

---

## Commitment Tracking

After action commitments integrate with the [Unified Work Management API](../unified-work-management.md):

- **Internal commitments** (`owner_type: "internal"`) are automatically tracked via work item views
- **External commitments** (`owner_type: "external"`) require manual status updates
- Commitments appear in assignee's work queues and dashboards
- SLA tracking applies to commitments with `due_date` set

---

## Authentication

All After Actions API endpoints require authentication via Bearer token:

```
Authorization: Bearer <access_token>
```

Tokens are obtained through the [Authentication API](../authentication.md).

---

## Error Handling

All endpoints return bilingual error messages in the following format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message_en": "English error message",
    "message_ar": "رسالة الخطأ بالعربية",
    "details": []
  }
}
```

Common error codes:
- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions or confidential record
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Edit request already pending
- `INTERNAL_ERROR` - Unexpected server error

---

## Row-Level Security (RLS)

After action records enforce RLS policies based on:

1. **Dossier Access**: User must have access to parent dossier
2. **Confidentiality**: `is_confidential` records require explicit permissions
3. **Publication Status**: Draft records only visible to creator and approvers
4. **Edit Permissions**: Updates require creator role or approved edit request

---

## Related APIs

- [Engagements API](./engagements.md) - Parent engagement for AARs
- [Dossiers API](./dossiers.md) - Dossier context for AARs
- [Unified Work Management API](../unified-work-management.md) - Commitment tracking
