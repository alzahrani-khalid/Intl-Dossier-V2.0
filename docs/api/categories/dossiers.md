# Dossiers API

## Overview

The Dossiers API provides unified management for countries, organizations, forums, persons, and working groups. Dossiers are the central organizing concept of the system, with support for relationships, activity timelines, statistics, and context resolution. All dossiers support bilingual content (English/Arabic) and enforce Row-Level Security (RLS) based on ownership and access permissions.

## Endpoints

### Create Dossier

Create a new dossier with bilingual naming and configurable sensitivity levels.

**Endpoint:** `POST /dossiers-create`

**Request Body:**
```json
{
  "name_en": "Kingdom of Saudi Arabia",
  "name_ar": "المملكة العربية السعودية",
  "type": "country",
  "sensitivity_level": "medium",
  "summary_en": "Strategic bilateral partner in the Gulf region",
  "summary_ar": "شريك استراتيجي ثنائي في منطقة الخليج",
  "tags": ["gcc", "g20", "energy"],
  "review_cadence": "quarterly"
}
```

**Response (201 Created):**
```json
{
  "id": "dos-550e8400-e29b-41d4-a716-446655440000",
  "name_en": "Kingdom of Saudi Arabia",
  "name_ar": "المملكة العربية السعودية",
  "type": "country",
  "sensitivity_level": "medium",
  "summary_en": "Strategic bilateral partner in the Gulf region",
  "summary_ar": "شريك استراتيجي ثنائي في منطقة الخليج",
  "tags": ["gcc", "g20", "energy"],
  "status": "active",
  "version": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields (name_en, name_ar, type) or validation errors
- `401 Unauthorized` - Missing or invalid authorization header
- `403 Forbidden` - Insufficient permissions to create dossiers
- `500 Internal Server Error` - Failed to create dossier

**Implementation Example:**
```typescript
const createDossier = async (dossierData: CreateDossierRequest) => {
  const response = await fetch('/dossiers-create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name_en: dossierData.nameEn,
      name_ar: dossierData.nameAr,
      type: dossierData.type,
      sensitivity_level: dossierData.sensitivityLevel || 'low',
      summary_en: dossierData.summaryEn,
      summary_ar: dossierData.summaryAr,
      tags: dossierData.tags
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message_ar || error.error?.message_en || 'Failed to create dossier');
  }

  return await response.json();
};
```

**Notes:**
- Both `name_en` and `name_ar` are required (max 200 characters each)
- Valid types: `country`, `organization`, `forum`, `theme`
- Valid sensitivity levels: `low`, `medium`, `high` (default: `low`)
- Maximum 20 tags, each max 50 characters
- Creator is automatically assigned as dossier owner
- Status is set to `active` by default

---

### Get Dossier

Retrieve a single dossier by ID with full details.

**Endpoint:** `GET /dossiers-get?id={id}`

**Query Parameters:**
- `id` (required): UUID of the dossier

**Response (200 OK):**
```json
{
  "id": "dos-550e8400-e29b-41d4-a716-446655440000",
  "name_en": "Kingdom of Saudi Arabia",
  "name_ar": "المملكة العربية السعودية",
  "type": "country",
  "sensitivity_level": "medium",
  "summary_en": "Strategic bilateral partner in the Gulf region",
  "summary_ar": "شريك استراتيجي ثنائي في منطقة الخليج",
  "tags": ["gcc", "g20", "energy"],
  "status": "active",
  "version": 3,
  "review_cadence": "quarterly",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:45:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing id parameter
- `401 Unauthorized` - Missing authorization header
- `404 Not Found` - Dossier not found or access denied (RLS)
- `500 Internal Server Error` - Query failure

**Implementation Example:**
```typescript
const getDossier = async (dossierId: string) => {
  const response = await fetch(
    `/dossiers-get?id=${dossierId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (response.status === 404) {
    throw new Error('Dossier not found or access denied');
  }

  return await response.json();
};
```

---

### List Dossiers

Retrieve a paginated list of dossiers with filtering and sorting.

**Endpoint:** `GET /dossiers-list`

**Query Parameters:**
- `type` (optional): Filter by dossier type (`country`, `organization`, `forum`, `theme`)
- `status` (optional): Filter by status (`active`, `archived`)
- `sensitivity_level` (optional): Filter by sensitivity (`low`, `medium`, `high`)
- `search` (optional): Full-text search across name_en and name_ar
- `tags` (optional): Comma-separated list of tags to filter by
- `limit` (optional): Number of results (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `sort` (optional): Sort field (default: `name_en`)
- `order` (optional): Sort order (`asc` or `desc`, default: `asc`)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "dos-550e8400-e29b-41d4-a716-446655440000",
      "name_en": "Kingdom of Saudi Arabia",
      "name_ar": "المملكة العربية السعودية",
      "type": "country",
      "sensitivity_level": "medium",
      "status": "active",
      "tags": ["gcc", "g20"],
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0,
  "has_more": true
}
```

**Error Responses:**
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing authorization header

**Implementation Example:**
```typescript
const listDossiers = async (filters?: {
  type?: string;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}) => {
  const params = new URLSearchParams();

  if (filters?.type) params.append('type', filters.type);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.tags) params.append('tags', filters.tags.join(','));
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());

  const response = await fetch(
    `/dossiers-list?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return await response.json();
};
```

---

### Update Dossier

Update an existing dossier's metadata and content.

**Endpoint:** `PUT /dossiers-update`

**Request Body:**
```json
{
  "id": "dos-550e8400-e29b-41d4-a716-446655440000",
  "name_en": "Kingdom of Saudi Arabia",
  "name_ar": "المملكة العربية السعودية",
  "summary_en": "Updated strategic summary",
  "summary_ar": "ملخص استراتيجي محدث",
  "tags": ["gcc", "g20", "vision2030"],
  "sensitivity_level": "high",
  "review_cadence": "monthly"
}
```

**Response (200 OK):**
```json
{
  "id": "dos-550e8400-e29b-41d4-a716-446655440000",
  "name_en": "Kingdom of Saudi Arabia",
  "name_ar": "المملكة العربية السعودية",
  "summary_en": "Updated strategic summary",
  "summary_ar": "ملخص استراتيجي محدث",
  "tags": ["gcc", "g20", "vision2030"],
  "version": 4,
  "updated_at": "2024-01-21T09:15:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing id or validation errors
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - Insufficient permissions to update dossier
- `404 Not Found` - Dossier not found
- `500 Internal Server Error` - Update failed

**Implementation Example:**
```typescript
const updateDossier = async (dossierId: string, updates: Partial<Dossier>) => {
  const response = await fetch('/dossiers-update', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: dossierId,
      ...updates
    })
  });

  if (!response.ok) {
    throw new Error('Failed to update dossier');
  }

  return await response.json();
};
```

**Notes:**
- Only dossier owners can update (enforced via RLS)
- Version is automatically incremented on update
- `updated_at` timestamp is automatically set

---

### Archive Dossier

Archive a dossier to mark it as inactive while preserving historical data.

**Endpoint:** `POST /dossiers-archive`

**Request Body:**
```json
{
  "id": "dos-550e8400-e29b-41d4-a716-446655440000",
  "reason": "Diplomatic relations suspended",
  "archive_date": "2024-02-01T00:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "id": "dos-550e8400-e29b-41d4-a716-446655440000",
  "status": "archived",
  "archived_at": "2024-02-01T00:00:00Z",
  "archive_reason": "Diplomatic relations suspended"
}
```

**Error Responses:**
- `400 Bad Request` - Missing id
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Dossier not found

**Notes:**
- Archived dossiers are hidden from default list views
- All related entities (engagements, positions) remain accessible
- Can be restored by updating status back to `active`

---

### Create Dossier Relationship

Create a relationship between two dossiers with type and metadata.

**Endpoint:** `POST /dossiers-relationships-create`

**Request Body:**
```json
{
  "from_dossier_id": "dos-550e8400-e29b-41d4-a716-446655440000",
  "to_dossier_id": "dos-660e8400-e29b-41d4-a716-446655440001",
  "relationship_type": "member_of",
  "metadata": {
    "since": "2020-01-15",
    "role": "founding member"
  }
}
```

**Response (201 Created):**
```json
{
  "id": "rel-770e8400-e29b-41d4-a716-446655440002",
  "from_dossier_id": "dos-550e8400-e29b-41d4-a716-446655440000",
  "to_dossier_id": "dos-660e8400-e29b-41d4-a716-446655440001",
  "relationship_type": "member_of",
  "metadata": {
    "since": "2020-01-15",
    "role": "founding member"
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or invalid relationship type
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - Insufficient permissions
- `409 Conflict` - Relationship already exists

**Valid Relationship Types:**
- `member_of` - Country is member of organization/forum
- `partnered_with` - Bilateral partnership
- `hosted_by` - Event/forum hosted by country/organization
- `subsidiary_of` - Organizational hierarchy
- `collaborates_with` - Working group collaboration

---

### Get Dossier Relationships

Retrieve all relationships for a specific dossier.

**Endpoint:** `GET /dossiers-relationships-get?dossier_id={id}`

**Query Parameters:**
- `dossier_id` (required): UUID of the dossier
- `relationship_type` (optional): Filter by relationship type
- `direction` (optional): `outgoing`, `incoming`, or `both` (default: `both`)

**Response (200 OK):**
```json
{
  "dossier_id": "dos-550e8400-e29b-41d4-a716-446655440000",
  "relationships": [
    {
      "id": "rel-770e8400-e29b-41d4-a716-446655440002",
      "from_dossier_id": "dos-550e8400-e29b-41d4-a716-446655440000",
      "to_dossier_id": "dos-660e8400-e29b-41d4-a716-446655440001",
      "to_dossier": {
        "id": "dos-660e8400-e29b-41d4-a716-446655440001",
        "name_en": "Gulf Cooperation Council",
        "name_ar": "مجلس التعاون الخليجي",
        "type": "organization"
      },
      "relationship_type": "member_of",
      "metadata": {
        "since": "1981-05-25"
      },
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 12
}
```

**Error Responses:**
- `400 Bad Request` - Missing dossier_id
- `401 Unauthorized` - Missing authorization header
- `404 Not Found` - Dossier not found

**Implementation Example:**
```typescript
const getDossierRelationships = async (dossierId: string, type?: string) => {
  const params = new URLSearchParams({ dossier_id: dossierId });
  if (type) params.append('relationship_type', type);

  const response = await fetch(
    `/dossiers-relationships-get?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return await response.json();
};
```

---

### Delete Dossier Relationship

Remove a relationship between two dossiers.

**Endpoint:** `DELETE /dossiers-relationships-delete`

**Request Body:**
```json
{
  "relationship_id": "rel-770e8400-e29b-41d4-a716-446655440002"
}
```

**Response (204 No Content)**

**Error Responses:**
- `400 Bad Request` - Missing relationship_id
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Relationship not found

---

### Get Dossier Activity Timeline

Retrieve paginated activity timeline for a dossier with cursor-based pagination.

**Endpoint:** `GET /dossier-activity-timeline?dossier_id={id}`

**Query Parameters:**
- `dossier_id` (required): UUID of the dossier
- `limit` (optional): Number of activities (default: 50, max: 200)
- `cursor` (optional): Pagination cursor from previous response
- `activity_type` (optional): Filter by type (`engagement`, `position`, `commitment`, `document`)

**Response (200 OK):**
```json
{
  "activities": [
    {
      "id": "act-880e8400-e29b-41d4-a716-446655440003",
      "activity_type": "engagement",
      "title_en": "Bilateral Coordination Meeting",
      "title_ar": "اجتماع التنسيق الثنائي",
      "timestamp": "2024-01-20T14:00:00Z",
      "actor": {
        "id": "user-id",
        "name": "John Doe"
      },
      "metadata": {
        "engagement_type": "meeting",
        "location": "Riyadh"
      }
    }
  ],
  "next_cursor": "eyJpZCI6ImFjdC04ODBlODQwMC...",
  "has_more": true,
  "total_count": 487
}
```

**Error Responses:**
- `400 Bad Request` - Missing dossier_id
- `401 Unauthorized` - Missing authorization header
- `404 Not Found` - Dossier not found

**Performance Target:**
- < 2 seconds for up to 500 activities

**Implementation Example:**
```typescript
const getDossierTimeline = async (dossierId: string, cursor?: string) => {
  const params = new URLSearchParams({ dossier_id: dossierId });
  if (cursor) params.append('cursor', cursor);

  const response = await fetch(
    `/dossier-activity-timeline?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return await response.json();
};
```

---

### Get Dossier Dashboard

Retrieve dashboard data including recent activity, pending work, and statistics.

**Endpoint:** `GET /dossier-dashboard`

**Query Parameters:**
- `action` (required): Dashboard action (`my-dossiers`, `recent-activity`, `pending-work`, `summary`)
- `limit` (optional): Number of results (default: 10)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK) - `my-dossiers`:**
```json
{
  "dossiers": [
    {
      "id": "dos-550e8400-e29b-41d4-a716-446655440000",
      "name_en": "Kingdom of Saudi Arabia",
      "name_ar": "المملكة العربية السعودية",
      "type": "country",
      "stats": {
        "pending_positions": 3,
        "upcoming_engagements": 5,
        "active_commitments": 12
      }
    }
  ],
  "total": 8
}
```

**Response (200 OK) - `summary`:**
```json
{
  "total_dossiers": 42,
  "by_type": {
    "country": 15,
    "organization": 12,
    "forum": 8,
    "theme": 7
  },
  "recent_activity_count": 23,
  "pending_work_count": 18
}
```

**Error Responses:**
- `400 Bad Request` - Missing or invalid action parameter
- `401 Unauthorized` - Missing authorization header

---

### Get Dossier Statistics

Retrieve detailed statistics for a specific dossier.

**Endpoint:** `GET /dossier-stats?dossier_id={id}`

**Query Parameters:**
- `dossier_id` (required): UUID of the dossier

**Response (200 OK):**
```json
{
  "dossier_id": "dos-550e8400-e29b-41d4-a716-446655440000",
  "positions": {
    "total": 45,
    "draft": 5,
    "published": 38,
    "archived": 2
  },
  "engagements": {
    "total": 87,
    "upcoming": 12,
    "completed": 75
  },
  "commitments": {
    "total": 34,
    "pending": 12,
    "completed": 20,
    "overdue": 2
  },
  "documents": 156,
  "relationships": 18,
  "last_activity": "2024-01-20T14:45:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing dossier_id
- `401 Unauthorized` - Missing authorization header
- `404 Not Found` - Dossier not found

---

### Resolve Dossier Context

Resolve dossier context from entity relationships with sub-100ms performance target.

**Endpoint:** `POST /resolve-dossier-context`

**Request Body:**
```json
{
  "entity_type": "engagement",
  "entity_id": "eng-990e8400-e29b-41d4-a716-446655440004"
}
```

**Response (200 OK):**
```json
{
  "dossiers": [
    {
      "id": "dos-550e8400-e29b-41d4-a716-446655440000",
      "name_en": "Kingdom of Saudi Arabia",
      "name_ar": "المملكة العربية السعودية",
      "type": "country",
      "inheritance_source": "direct"
    }
  ],
  "resolution_path": "engagement → dossier",
  "resolved_in_ms": 42
}
```

**Supported Entity Types:**
- `dossier` - Direct dossier reference
- `engagement` - Via engagement.dossier_id
- `after_action` - Via after_action.engagement_id → engagement.dossier_id
- `position` - Via position_dossier_links junction table

**Error Responses:**
- `400 Bad Request` - Missing or invalid entity_type/entity_id
- `401 Unauthorized` - Missing authorization header
- `404 Not Found` - Entity not found

**Performance Target:**
- < 100ms resolution time

**Implementation Example:**
```typescript
const resolveDossierContext = async (entityType: string, entityId: string) => {
  const response = await fetch('/resolve-dossier-context', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      entity_type: entityType,
      entity_id: entityId
    })
  });

  return await response.json();
};
```

---

## Authentication

All Dossiers API endpoints require authentication via Bearer token:

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
- `FORBIDDEN` - Insufficient permissions (RLS)
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `INTERNAL_ERROR` - Unexpected server error

---

## Row-Level Security (RLS)

All dossier operations enforce RLS policies based on:

1. **Ownership**: Users with `owner` or `editor` role in `dossier_owners` table
2. **Team Access**: Users in the same organizational unit
3. **Sensitivity Level**: Higher sensitivity requires explicit permissions

---

## Related APIs

- [Engagements API](./engagements.md) - Diplomatic meetings and events
- [After Actions API](./after-actions.md) - Post-engagement documentation
- [Positions API](./positions.md) - Policy positions linked to dossiers
