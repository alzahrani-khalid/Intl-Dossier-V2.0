# Positions API

## Overview

The Positions API manages bilateral policy positions with versioning, approval workflows, and multi-stage review processes. All positions support bilingual content (English/Arabic) and enforce Row-Level Security (RLS) based on user roles and audience groups.

## Endpoints

### Create Position

Create a new position with bilingual content and audience group assignments.

**Endpoint:** `POST /positions-create`

**Request Body:**
```json
{
  "position_type_id": "550e8400-e29b-41d4-a716-446655440000",
  "title_en": "Climate Change Cooperation Framework",
  "title_ar": "إطار التعاون في مجال تغير المناخ",
  "content_en": "Detailed position content in English...",
  "content_ar": "محتوى الموقف التفصيلي بالعربية...",
  "rationale_en": "Strategic rationale...",
  "rationale_ar": "الأساس المنطقي الاستراتيجي...",
  "alignment_notes_en": "Alignment with national strategy...",
  "alignment_notes_ar": "التوافق مع الاستراتيجية الوطنية...",
  "thematic_category": "environment",
  "audience_groups": [
    "group-id-1",
    "group-id-2"
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "pos-550e8400-e29b-41d4-a716-446655440000",
  "position_type_id": "550e8400-e29b-41d4-a716-446655440000",
  "title_en": "Climate Change Cooperation Framework",
  "title_ar": "إطار التعاون في مجال تغير المناخ",
  "content_en": "Detailed position content in English...",
  "content_ar": "محتوى الموقف التفصيلي بالعربية...",
  "status": "draft",
  "current_stage": 0,
  "version": 1,
  "author_id": "user-id",
  "consistency_score": 0,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or invalid position_type_id
- `401 Unauthorized` - Missing or invalid authorization header
- `500 Internal Server Error` - Failed to create position or audience groups

**Implementation Example:**
```typescript
const createPosition = async (positionData: CreatePositionRequest) => {
  const response = await fetch('/positions-create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      position_type_id: positionData.typeId,
      title_en: positionData.titleEn,
      title_ar: positionData.titleAr,
      content_en: positionData.contentEn,
      content_ar: positionData.contentAr,
      audience_groups: positionData.audienceGroups
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
- Both `title_en` and `title_ar` are required
- At least one audience group must be specified
- Position is created in `draft` status with version 1
- Initial version record is automatically created
- Author is set from authenticated user JWT

---

### Get Position

Retrieve a single position by ID with RLS-based access control.

**Endpoint:** `GET /positions-get?position_id={id}`

**Query Parameters:**
- `position_id` (required): UUID of the position

**Response (200 OK):**
```json
{
  "id": "pos-550e8400-e29b-41d4-a716-446655440000",
  "position_type_id": "550e8400-e29b-41d4-a716-446655440000",
  "title_en": "Climate Change Cooperation Framework",
  "title_ar": "إطار التعاون في مجال تغير المناخ",
  "content_en": "Detailed position content...",
  "content_ar": "محتوى الموقف التفصيلي...",
  "rationale_en": "Strategic rationale...",
  "rationale_ar": "الأساس المنطقي...",
  "status": "published",
  "current_stage": 3,
  "version": 5,
  "author_id": "user-id",
  "consistency_score": 85,
  "emergency_correction": false,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:45:00Z",
  "audience_groups": []
}
```

**Error Responses:**
- `400 Bad Request` - Missing position_id parameter
- `401 Unauthorized` - Missing authorization header
- `404 Not Found` - Position not found or access denied (RLS enforcement)

**Access Control (RLS):**
- **Draft**: Only author can view
- **Under Review**: Approvers at current stage can view
- **Published**: Users in assigned audience groups can view

**Implementation Example:**
```typescript
const getPosition = async (positionId: string) => {
  const response = await fetch(
    `/positions-get?position_id=${positionId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (response.status === 404) {
    throw new Error('Position not found or access denied');
  }

  return await response.json();
};
```

---

### List Positions

Retrieve paginated list of positions with filtering and search.

**Endpoint:** `GET /positions-list`

**Query Parameters:**
- `status` (optional): Filter by status (`draft`, `under_review`, `approved`, `published`)
- `thematic_category` (optional): Filter by thematic category
- `author_id` (optional): Filter by author
- `dossierId` (optional): Filter by linked dossier (via engagement_positions)
- `search` (optional): Search in bilingual titles (case-insensitive)
- `sort` (optional): Sort field (default: `updated_at`)
- `order` (optional): Sort order (`asc` or `desc`, default: `desc`)
- `limit` (optional): Page size (default: 20, max: 100)
- `offset` (optional): Page offset (default: 0)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "pos-1",
      "title_en": "Climate Change Cooperation",
      "title_ar": "التعاون في مجال تغير المناخ",
      "thematic_category": "environment",
      "status": "published",
      "current_stage": 3,
      "version": 5,
      "emergency_correction": false,
      "author_id": "user-id",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:45:00Z"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0,
  "has_more": true
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authorization
- `500 Internal Server Error` - Query execution failed

**Implementation Example:**
```typescript
const listPositions = async (filters: PositionFilters) => {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  params.set('limit', String(filters.limit || 20));
  params.set('offset', String(filters.offset || 0));

  const response = await fetch(
    `/positions-list?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      }
    }
  );

  return await response.json();
};
```

**Notes:**
- Results respect RLS policies (users only see positions they have access to)
- Search supports bilingual matching across `title_en` and `title_ar`
- Response includes `Cache-Control: private, max-age=30` header
- Only essential fields returned for list view (no full content)

---

### Update Position

Update a draft position with optimistic locking to prevent concurrent modifications.

**Endpoint:** `PUT /positions-update`

**Request Body:**
```json
{
  "position_id": "pos-550e8400-e29b-41d4-a716-446655440000",
  "version": 3,
  "title_en": "Updated Climate Framework",
  "title_ar": "إطار المناخ المحدث",
  "content_en": "Updated content...",
  "content_ar": "المحتوى المحدث...",
  "rationale_en": "Updated rationale...",
  "rationale_ar": "الأساس المنطقي المحدث..."
}
```

**Response (200 OK):**
```json
{
  "id": "pos-550e8400-e29b-41d4-a716-446655440000",
  "title_en": "Updated Climate Framework",
  "title_ar": "إطار المناخ المحدث",
  "version": 4,
  "updated_at": "2024-01-21T09:15:00Z",
  "status": "draft"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or non-draft status
- `401 Unauthorized` - Not authenticated or not the author
- `404 Not Found` - Position not found
- `409 Conflict` - Version mismatch (concurrent modification detected)

**Optimistic Locking:**
The `version` field must match the current database version. On successful update:
1. Version is incremented
2. Previous version marked as superseded
3. New version record created with 7-year retention

**Implementation Example:**
```typescript
const updatePosition = async (
  positionId: string,
  currentVersion: number,
  updates: Partial<Position>
) => {
  try {
    const response = await fetch('/positions-update', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        position_id: positionId,
        version: currentVersion,
        ...updates
      })
    });

    if (response.status === 409) {
      // Handle conflict - user needs to refresh
      const error = await response.json();
      throw new Error(
        `Version conflict. Current: ${error.current_version}, ` +
        `Provided: ${error.provided_version}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Update failed:', error);
    throw error;
  }
};
```

**Notes:**
- Only draft positions can be updated
- RLS ensures only the author can update
- All content fields are optional (partial updates supported)
- Version increment is atomic

---

### Submit Position

Submit a draft position for approval workflow.

**Endpoint:** `POST /positions-submit`

**Request Body:**
```json
{
  "position_id": "pos-550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**
```json
{
  "position": {
    "id": "pos-550e8400-e29b-41d4-a716-446655440000",
    "status": "under_review",
    "current_stage": 1,
    "updated_at": "2024-01-21T10:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing position_id or incomplete bilingual content
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Submission failed

**Pre-Submission Validation:**
- Both `content_en` and `content_ar` must be present
- Position must be in `draft` status
- User must be the author (RLS enforced)

**Implementation Example:**
```typescript
const submitPosition = async (positionId: string) => {
  const response = await fetch('/positions-submit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ position_id: positionId })
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.error?.includes('Bilingual content')) {
      throw new Error('Both English and Arabic content are required');
    }
    throw new Error(error.error);
  }

  return await response.json();
};
```

---

### Approve Position

Approve a position at the current approval stage.

**Endpoint:** `POST /positions-approve`

**Request Body:**
```json
{
  "position_id": "pos-550e8400-e29b-41d4-a716-446655440000",
  "approval_notes": "Approved with minor formatting suggestions"
}
```

**Response (200 OK):**
```json
{
  "position": {
    "id": "pos-550e8400-e29b-41d4-a716-446655440000",
    "status": "approved",
    "current_stage": 3,
    "updated_at": "2024-01-22T14:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Position not in approval workflow
- `403 Forbidden` - User not an approver at current stage
- `404 Not Found` - Position not found

**Notes:**
- Moves position to next approval stage
- If final stage, status becomes `approved`
- Approval recorded in audit log

---

### Publish Position

Publish an approved position to make it accessible to audience groups.

**Endpoint:** `POST /positions-publish`

**Request Body:**
```json
{
  "position_id": "pos-550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**
```json
{
  "position": {
    "id": "pos-550e8400-e29b-41d4-a716-446655440000",
    "status": "published",
    "published_at": "2024-01-23T09:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Position not approved
- `403 Forbidden` - User lacks publish permission

---

### Unpublish Position

Remove a position from published status.

**Endpoint:** `POST /positions-unpublish`

**Request Body:**
```json
{
  "position_id": "pos-550e8400-e29b-41d4-a716-446655440000",
  "reason": "Policy update required"
}
```

**Response (200 OK):**
```json
{
  "position": {
    "id": "pos-550e8400-e29b-41d4-a716-446655440000",
    "status": "approved",
    "published_at": null
  }
}
```

---

### Get Position Versions

Retrieve version history for a position.

**Endpoint:** `GET /positions-versions-list?position_id={id}`

**Response (200 OK):**
```json
{
  "versions": [
    {
      "version_number": 5,
      "author_id": "user-id",
      "created_at": "2024-01-20T14:45:00Z",
      "superseded": false,
      "retention_until": "2031-01-20T14:45:00Z"
    },
    {
      "version_number": 4,
      "author_id": "user-id",
      "created_at": "2024-01-18T11:20:00Z",
      "superseded": true
    }
  ]
}
```

---

### Compare Position Versions

Compare two versions of a position side-by-side.

**Endpoint:** `GET /positions-versions-compare?position_id={id}&version_a={v1}&version_b={v2}`

**Response (200 OK):**
```json
{
  "version_a": {
    "version_number": 3,
    "content_en": "Original content...",
    "content_ar": "المحتوى الأصلي..."
  },
  "version_b": {
    "version_number": 5,
    "content_en": "Updated content...",
    "content_ar": "المحتوى المحدث..."
  },
  "diff": {
    "content_en_changed": true,
    "content_ar_changed": true,
    "title_en_changed": false
  }
}
```

---

### Link Position to Dossier

Create links between positions and dossiers.

**Endpoint:** `POST /positions-dossiers-create`

**Request Body:**
```json
{
  "position_id": "pos-550e8400-e29b-41d4-a716-446655440000",
  "dossier_id": "dossier-123",
  "link_type": "primary"
}
```

**Response (201 Created):**
```json
{
  "id": "link-id",
  "position_id": "pos-550e8400-e29b-41d4-a716-446655440000",
  "dossier_id": "dossier-123",
  "link_type": "primary",
  "created_at": "2024-01-23T10:00:00Z"
}
```

---

### Get Position Analytics

Retrieve analytics for a specific position.

**Endpoint:** `GET /position-analytics-get?position_id={id}`

**Response (200 OK):**
```json
{
  "position_id": "pos-550e8400-e29b-41d4-a716-446655440000",
  "view_count": 342,
  "reference_count": 28,
  "engagement_count": 12,
  "last_viewed_at": "2024-01-23T14:30:00Z",
  "most_active_users": [
    {
      "user_id": "user-1",
      "view_count": 15
    }
  ]
}
```

---

### Get Consistency Check

Run consistency check between positions.

**Endpoint:** `POST /positions-consistency-check`

**Request Body:**
```json
{
  "position_ids": [
    "pos-1",
    "pos-2",
    "pos-3"
  ]
}
```

**Response (200 OK):**
```json
{
  "consistency_score": 78,
  "conflicts": [
    {
      "position_a": "pos-1",
      "position_b": "pos-2",
      "conflict_type": "contradiction",
      "description": "Conflicting stance on trade policy"
    }
  ],
  "recommendations": [
    "Review positions pos-1 and pos-2 for alignment"
  ]
}
```

---

## Position Workflow States

| Status | Description | Allowed Actions |
|--------|-------------|-----------------|
| `draft` | Initial creation, editable by author | update, submit, delete |
| `under_review` | In approval workflow | approve, request_revisions |
| `approved` | Passed all approval stages | publish, unpublish |
| `published` | Accessible to audience groups | unpublish, emergency_correct |

## Common Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| `400` | Bad Request | Check required fields and validation rules |
| `401` | Unauthorized | Verify authentication token |
| `403` | Forbidden | User lacks required permissions |
| `404` | Not Found | Position doesn't exist or RLS denies access |
| `409` | Conflict | Version mismatch - refresh and retry |
| `500` | Server Error | Contact support with correlation ID |

## Best Practices

1. **Always include version for updates** to prevent concurrent modification conflicts
2. **Provide bilingual content** for all user-facing fields (titles, content, rationale)
3. **Use optimistic locking** pattern for update operations
4. **Cache list results** with 30-second TTL to reduce server load
5. **Handle RLS 404 errors** as access denied, not missing resources
6. **Validate audience groups** exist before position creation
7. **Use search parameter** for user-facing position lookups (supports Arabic)
