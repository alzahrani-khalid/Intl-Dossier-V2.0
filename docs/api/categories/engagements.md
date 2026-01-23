# Engagements API

## Overview

The Engagements API manages diplomatic meetings, consultations, missions, and other bilateral/multilateral interactions. Engagements are first-class dossier entities that support position attachments, AI-generated briefs, recommendations, and Kanban workflow visualization. All engagements support bilingual content (English/Arabic) and enforce Row-Level Security (RLS) based on dossier access.

## Endpoints

### Create Engagement

Create a new engagement with dossier linkage and metadata.

**Endpoint:** `POST /engagements`

**Request Body:**
```json
{
  "dossier_id": "dos-550e8400-e29b-41d4-a716-446655440000",
  "title": "Bilateral Climate Cooperation Consultation",
  "engagement_type": "consultation",
  "engagement_date": "2024-02-15T14:00:00Z",
  "location": "Ministry of Foreign Affairs, Riyadh",
  "description": "High-level consultation on joint climate initiatives and COP29 coordination"
}
```

**Response (201 Created):**
```json
{
  "id": "eng-660e8400-e29b-41d4-a716-446655440001",
  "dossier_id": "dos-550e8400-e29b-41d4-a716-446655440000",
  "title": "Bilateral Climate Cooperation Consultation",
  "engagement_type": "consultation",
  "engagement_date": "2024-02-15T14:00:00Z",
  "location": "Ministry of Foreign Affairs, Riyadh",
  "description": "High-level consultation on joint climate initiatives and COP29 coordination",
  "created_by": "user-id",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Valid Engagement Types:**
- `meeting` - Bilateral or multilateral meeting
- `consultation` - Policy consultation session
- `coordination` - Coordination meeting
- `workshop` - Technical workshop
- `conference` - International conference
- `site_visit` - Official site visit or tour
- `other` - Other engagement types

**Error Responses:**
- `400 Bad Request` - Invalid engagement_type or missing required fields
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - No access to specified dossier
- `500 Internal Server Error` - Failed to create engagement

**Implementation Example:**
```typescript
const createEngagement = async (engagementData: CreateEngagementRequest) => {
  const response = await fetch('/engagements', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dossier_id: engagementData.dossierId,
      title: engagementData.title,
      engagement_type: engagementData.type,
      engagement_date: engagementData.date,
      location: engagementData.location,
      description: engagementData.description
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create engagement');
  }

  return await response.json();
};
```

**Notes:**
- Engagement inherits dossier access permissions via RLS
- Creator is automatically set from authenticated user
- Engagement date must be ISO 8601 format
- Location is optional but recommended

---

### Get Engagement

Retrieve a single engagement by ID.

**Endpoint:** `GET /engagements/{id}`

**Path Parameters:**
- `id` (required): UUID of the engagement

**Response (200 OK):**
```json
{
  "id": "eng-660e8400-e29b-41d4-a716-446655440001",
  "dossier_id": "dos-550e8400-e29b-41d4-a716-446655440000",
  "dossier": {
    "id": "dos-550e8400-e29b-41d4-a716-446655440000",
    "name_en": "Kingdom of Saudi Arabia",
    "name_ar": "المملكة العربية السعودية",
    "type": "country"
  },
  "title": "Bilateral Climate Cooperation Consultation",
  "engagement_type": "consultation",
  "engagement_date": "2024-02-15T14:00:00Z",
  "location": "Ministry of Foreign Affairs, Riyadh",
  "description": "High-level consultation on joint climate initiatives...",
  "created_by": "user-id",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - No access to engagement's dossier
- `404 Not Found` - Engagement not found

**Implementation Example:**
```typescript
const getEngagement = async (engagementId: string) => {
  const response = await fetch(`/engagements/${engagementId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 404) {
    throw new Error('Engagement not found or access denied');
  }

  return await response.json();
};
```

---

### Update Engagement

Update an existing engagement's metadata.

**Endpoint:** `PATCH /engagements/{id}`

**Path Parameters:**
- `id` (required): UUID of the engagement

**Request Body:**
```json
{
  "title": "Updated Consultation Title",
  "location": "Virtual Meeting",
  "description": "Updated description with additional context"
}
```

**Response (200 OK):**
```json
{
  "id": "eng-660e8400-e29b-41d4-a716-446655440001",
  "title": "Updated Consultation Title",
  "location": "Virtual Meeting",
  "description": "Updated description with additional context",
  "updated_at": "2024-01-16T11:20:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid update fields
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Engagement not found

**Notes:**
- Only creator or dossier owners can update engagements
- `updated_at` timestamp is automatically updated
- `dossier_id` and `engagement_type` cannot be changed after creation

---

### List Engagements for Dossier

Retrieve paginated list of engagements for a specific dossier.

**Endpoint:** `GET /dossiers/{dossierId}/engagements`

**Path Parameters:**
- `dossierId` (required): UUID of the dossier

**Query Parameters:**
- `limit` (optional): Number of results (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `engagement_type` (optional): Filter by engagement type
- `date_from` (optional): ISO 8601 timestamp (filter engagements after this date)
- `date_to` (optional): ISO 8601 timestamp (filter engagements before this date)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "eng-660e8400-e29b-41d4-a716-446655440001",
      "title": "Bilateral Climate Cooperation Consultation",
      "engagement_type": "consultation",
      "engagement_date": "2024-02-15T14:00:00Z",
      "location": "Ministry of Foreign Affairs, Riyadh",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 87,
  "limit": 20,
  "offset": 0
}
```

**Error Responses:**
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - No access to dossier

**Notes:**
- Results are sorted by `engagement_date` in descending order (most recent first)
- Includes both upcoming and past engagements

---

### Attach Position to Engagement

Link a policy position to an engagement for reference during discussions.

**Endpoint:** `POST /engagements-positions-attach`

**Request Body:**
```json
{
  "engagement_id": "eng-660e8400-e29b-41d4-a716-446655440001",
  "position_id": "pos-770e8400-e29b-41d4-a716-446655440002",
  "relevance_note": "Key talking points for climate cooperation discussion"
}
```

**Response (201 Created):**
```json
{
  "id": "ep-880e8400-e29b-41d4-a716-446655440003",
  "engagement_id": "eng-660e8400-e29b-41d4-a716-446655440001",
  "position_id": "pos-770e8400-e29b-41d4-a716-446655440002",
  "relevance_note": "Key talking points for climate cooperation discussion",
  "attached_at": "2024-01-16T09:00:00Z",
  "attached_by": "user-id"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - No access to engagement or position
- `404 Not Found` - Engagement or position not found
- `409 Conflict` - Position already attached to this engagement

**Notes:**
- Positions must be in `published` status to be attached
- Attached positions appear in engagement briefing packs
- Multiple positions can be attached to a single engagement

---

### Detach Position from Engagement

Remove a position attachment from an engagement.

**Endpoint:** `DELETE /engagements-positions-detach`

**Request Body:**
```json
{
  "engagement_id": "eng-660e8400-e29b-41d4-a716-446655440001",
  "position_id": "pos-770e8400-e29b-41d4-a716-446655440002"
}
```

**Response (204 No Content)**

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Attachment not found

---

### List Positions Attached to Engagement

Retrieve all positions attached to an engagement.

**Endpoint:** `GET /engagements-positions-list?engagement_id={id}`

**Query Parameters:**
- `engagement_id` (required): UUID of the engagement

**Response (200 OK):**
```json
{
  "engagement_id": "eng-660e8400-e29b-41d4-a716-446655440001",
  "positions": [
    {
      "id": "pos-770e8400-e29b-41d4-a716-446655440002",
      "title_en": "Climate Change Cooperation Framework",
      "title_ar": "إطار التعاون في مجال تغير المناخ",
      "status": "published",
      "relevance_note": "Key talking points for climate cooperation discussion",
      "attached_at": "2024-01-16T09:00:00Z",
      "attached_by": "user-id"
    }
  ],
  "total": 3
}
```

**Error Responses:**
- `400 Bad Request` - Missing engagement_id
- `401 Unauthorized` - Missing authorization header
- `404 Not Found` - Engagement not found

---

### Get Engagement Kanban Board

Retrieve engagement workflow visualization in Kanban format.

**Endpoint:** `GET /engagements-kanban-get?dossier_id={id}`

**Query Parameters:**
- `dossier_id` (optional): Filter by specific dossier

**Response (200 OK):**
```json
{
  "columns": [
    {
      "id": "upcoming",
      "title": "Upcoming",
      "cards": [
        {
          "id": "eng-660e8400-e29b-41d4-a716-446655440001",
          "title": "Bilateral Climate Cooperation Consultation",
          "engagement_type": "consultation",
          "engagement_date": "2024-02-15T14:00:00Z",
          "location": "Riyadh",
          "dossier": {
            "id": "dos-550e8400-e29b-41d4-a716-446655440000",
            "name_en": "Kingdom of Saudi Arabia"
          },
          "positions_count": 3,
          "has_after_action": false
        }
      ]
    },
    {
      "id": "in_progress",
      "title": "In Progress",
      "cards": []
    },
    {
      "id": "completed",
      "title": "Completed",
      "cards": [
        {
          "id": "eng-770e8400-e29b-41d4-a716-446655440004",
          "title": "G20 Coordination Meeting",
          "engagement_type": "coordination",
          "engagement_date": "2024-01-10T10:00:00Z",
          "has_after_action": true,
          "after_action_status": "published"
        }
      ]
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing authorization header

**Notes:**
- Kanban columns: `upcoming`, `in_progress`, `completed`
- Engagements are categorized based on date and after-action status
- `upcoming`: Future engagements without after-action records
- `in_progress`: Past engagements without after-action records (overdue)
- `completed`: Engagements with published after-action records

---

### Get Engagement Briefs

List AI-generated or manually linked briefs for an engagement.

**Endpoint:** `GET /engagement-briefs/{engagementId}`

**Path Parameters:**
- `engagementId` (required): UUID of the engagement

**Response (200 OK):**
```json
{
  "engagement_id": "eng-660e8400-e29b-41d4-a716-446655440001",
  "briefs": [
    {
      "id": "brief-990e8400-e29b-41d4-a716-446655440005",
      "title": "Climate Cooperation Background Brief",
      "brief_type": "ai_generated",
      "generated_at": "2024-02-10T08:00:00Z",
      "content_preview": "Saudi Arabia has been a key partner in climate initiatives...",
      "sources": [
        "Recent bilateral meetings",
        "Published positions on climate policy",
        "Commitments from previous AARs"
      ]
    }
  ],
  "total": 2
}
```

**Error Responses:**
- `401 Unauthorized` - Missing authorization header
- `404 Not Found` - Engagement not found

---

### Generate AI Brief for Engagement

Trigger AI generation of a contextual brief for an engagement.

**Endpoint:** `POST /engagement-briefs/{engagementId}/generate`

**Path Parameters:**
- `engagementId` (required): UUID of the engagement

**Request Body:**
```json
{
  "include_recent_interactions": true,
  "include_positions": true,
  "include_commitments": true,
  "lookback_days": 90
}
```

**Response (202 Accepted):**
```json
{
  "job_id": "job-aa0e8400-e29b-41d4-a716-446655440006",
  "status": "processing",
  "estimated_completion": "2024-02-10T08:05:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing authorization header
- `404 Not Found` - Engagement not found
- `429 Too Many Requests` - Rate limit exceeded (max 5 brief generations per hour)

**Notes:**
- Brief generation is asynchronous (check status via job_id)
- AI pulls context from:
  - Recent interactions with dossier entities
  - Published positions linked to engagement
  - Active commitments from previous AARs
  - Relationship context from dossier graph

---

### Get Engagement Recommendations

Retrieve AI-driven recommendations for an engagement.

**Endpoint:** `GET /engagement-recommendations?engagement_id={id}`

**Query Parameters:**
- `engagement_id` (optional): Filter recommendations for specific engagement
- `dossier_id` (optional): Filter recommendations for specific dossier
- `status` (optional): Filter by status (`pending`, `accepted`, `rejected`, `implemented`)
- `limit` (optional): Number of results (default: 10, max: 50)

**Response (200 OK):**
```json
{
  "recommendations": [
    {
      "id": "rec-bb0e8400-e29b-41d4-a716-446655440007",
      "engagement_id": "eng-660e8400-e29b-41d4-a716-446655440001",
      "recommendation_type": "position_attachment",
      "title": "Attach Climate Policy Framework Position",
      "description": "Based on engagement topic, recommend attaching position #45 on Climate Cooperation",
      "confidence_score": 0.87,
      "rationale": "Engagement mentions climate cooperation; position covers relevant policy framework",
      "status": "pending",
      "generated_at": "2024-01-16T07:30:00Z"
    }
  ],
  "total": 5
}
```

**Error Responses:**
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing authorization header

**Recommendation Types:**
- `position_attachment` - Suggest attaching a relevant position
- `participant_invitation` - Suggest inviting specific stakeholders
- `follow_up_action` - Suggest post-engagement follow-up
- `dossier_linkage` - Suggest linking to related dossier

---

### Get Engagement Context for Brief Generation

Retrieve contextual information used for AI brief generation.

**Endpoint:** `GET /engagement-briefs/{engagementId}/context`

**Path Parameters:**
- `engagementId` (required): UUID of the engagement

**Response (200 OK):**
```json
{
  "engagement": {
    "id": "eng-660e8400-e29b-41d4-a716-446655440001",
    "title": "Bilateral Climate Cooperation Consultation",
    "engagement_type": "consultation",
    "engagement_date": "2024-02-15T14:00:00Z"
  },
  "dossier": {
    "id": "dos-550e8400-e29b-41d4-a716-446655440000",
    "name_en": "Kingdom of Saudi Arabia",
    "type": "country"
  },
  "recent_interactions": [
    {
      "type": "engagement",
      "title": "G20 Climate Working Group Session",
      "date": "2024-01-10T10:00:00Z"
    }
  ],
  "relevant_positions": [
    {
      "id": "pos-770e8400-e29b-41d4-a716-446655440002",
      "title_en": "Climate Change Cooperation Framework",
      "status": "published"
    }
  ],
  "active_commitments": [
    {
      "id": "com-cc0e8400-e29b-41d4-a716-446655440008",
      "description": "Provide technical specifications for carbon offset program",
      "due_date": "2024-02-01",
      "status": "pending"
    }
  ],
  "relationship_context": {
    "organizations": ["Gulf Cooperation Council", "G20"],
    "multilateral_forums": ["COP29", "UNFCCC"]
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing authorization header
- `404 Not Found` - Engagement not found

**Notes:**
- Context endpoint is useful for previewing what information will be included in AI-generated briefs
- Includes relationship graph traversal up to 2 degrees of separation

---

## Authentication

All Engagements API endpoints require authentication via Bearer token:

```
Authorization: Bearer <access_token>
```

Tokens are obtained through the [Authentication API](../authentication.md).

---

## Error Handling

All endpoints return error messages in the following format:

```json
{
  "error": "Error message describing what went wrong"
}
```

HTTP status codes follow REST conventions:
- `2xx` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

---

## Row-Level Security (RLS)

Engagement operations enforce RLS policies based on:

1. **Dossier Access**: User must have access to parent dossier via `dossier_owners` table
2. **Creator Permissions**: Engagement creator has full CRUD access
3. **Team Access**: Users in same organizational unit can view engagements

---

## Related APIs

- [Dossiers API](./dossiers.md) - Parent dossier for engagements
- [After Actions API](./after-actions.md) - Post-engagement documentation
- [Positions API](./positions.md) - Policy positions attached to engagements
