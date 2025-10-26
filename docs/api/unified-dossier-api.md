# Unified Dossier Architecture API Reference

**Version**: 1.0.0
**Last Updated**: 2025-01-23
**Base URL**: `https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1`

## Table of Contents

1. [Authentication](#authentication)
2. [Dossier Operations](#dossier-operations)
3. [Relationship Operations](#relationship-operations)
4. [Graph Traversal Operations](#graph-traversal-operations)
5. [Search Operations](#search-operations)
6. [Calendar Operations](#calendar-operations)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Examples](#examples)

---

## Authentication

All API requests require authentication via Supabase Auth JWT token.

### Request Headers

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Obtaining a Token

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Use data.session.access_token for API requests
```

---

## Dossier Operations

### Create Dossier

Create a new dossier with type-specific extension data.

**Endpoint**: `POST /dossiers`

**Request Body**:
```json
{
  "type": "country",
  "name": "Saudi Arabia",
  "status": "active",
  "sensitivity_classification": "internal",
  "description": "Kingdom of Saudi Arabia",
  "tags": ["gcc", "middle-east", "g20"],
  "extension_data": {
    "iso_alpha2": "SA",
    "iso_alpha3": "SAU",
    "iso_numeric": "682",
    "capital": "Riyadh",
    "region": "Asia",
    "subregion": "Western Asia"
  }
}
```

**Response**: `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "country",
  "name": "Saudi Arabia",
  "status": "active",
  "sensitivity_classification": "internal",
  "description": "Kingdom of Saudi Arabia",
  "tags": ["gcc", "middle-east", "g20"],
  "created_at": "2025-01-23T10:00:00Z",
  "updated_at": "2025-01-23T10:00:00Z",
  "created_by": "user-uuid",
  "extension_data": {
    "iso_alpha2": "SA",
    "iso_alpha3": "SAU",
    "iso_numeric": "682",
    "capital": "Riyadh",
    "region": "Asia",
    "subregion": "Western Asia"
  }
}
```

**Supported Dossier Types**:
- `country` - Nations and territories
- `organization` - International organizations, ministries, agencies
- `forum` - Multi-lateral forums (G20, UN, etc.)
- `engagement` - Diplomatic events, negotiations, conferences
- `theme` - Policy themes, strategic priorities
- `working_group` - Sub-committees, task forces
- `person` - VIPs, ambassadors, ministers

**Type-Specific Extension Fields**:

<details>
<summary><strong>Country Extension Fields</strong></summary>

```json
{
  "iso_alpha2": "SA",         // ISO 3166-1 alpha-2 (required, unique)
  "iso_alpha3": "SAU",        // ISO 3166-1 alpha-3 (required, unique)
  "iso_numeric": "682",       // ISO 3166-1 numeric
  "capital": "Riyadh",        // Capital city
  "region": "Asia",           // Geographic region
  "subregion": "Western Asia" // Geographic subregion
}
```
</details>

<details>
<summary><strong>Organization Extension Fields</strong></summary>

```json
{
  "organization_code": "MFA", // Unique identifier
  "organization_type": "government", // Type: government, international, ngo, private
  "parent_organization_id": "uuid", // Parent org (optional)
  "headquarters_location": "Riyadh",
  "founding_date": "1932-09-23"
}
```
</details>

<details>
<summary><strong>Forum Extension Fields</strong></summary>

```json
{
  "forum_type": "multilateral", // Type: multilateral, bilateral, regional
  "founding_date": "1999-09-25",
  "member_count": 20,
  "secretariat_location": "Various"
}
```
</details>

<details>
<summary><strong>Engagement Extension Fields</strong></summary>

```json
{
  "engagement_type": "summit", // Type: summit, conference, negotiation, etc.
  "start_date": "2025-03-01",
  "end_date": "2025-03-03",
  "location": "Riyadh",
  "outcome": "Joint declaration signed"
}
```
</details>

<details>
<summary><strong>Theme Extension Fields</strong></summary>

```json
{
  "theme_category": "trade", // Category: trade, security, climate, etc.
  "priority_level": "high",  // Priority: high, medium, low
  "strategic_framework": "Vision 2030"
}
```
</details>

<details>
<summary><strong>Working Group Extension Fields</strong></summary>

```json
{
  "parent_forum_id": "uuid",    // Parent forum (required)
  "mandate": "Trade liberalization",
  "chair_country_id": "uuid",   // Chair country (optional)
  "establishment_date": "2020-01-01"
}
```
</details>

<details>
<summary><strong>Person Extension Fields</strong></summary>

```json
{
  "title": "Ambassador",
  "organization_id": "uuid",    // Associated organization
  "nationality_country_id": "uuid", // Nationality
  "date_of_birth": "1970-05-15",
  "biography": "Career diplomat with 20 years of experience",
  "photo_url": "https://example.com/photo.jpg"
}
```
</details>

---

### Get Dossier

Retrieve a single dossier with extension data.

**Endpoint**: `GET /dossiers/:id`

**Response**: `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "country",
  "name": "Saudi Arabia",
  "status": "active",
  "sensitivity_classification": "internal",
  "description": "Kingdom of Saudi Arabia",
  "tags": ["gcc", "middle-east", "g20"],
  "created_at": "2025-01-23T10:00:00Z",
  "updated_at": "2025-01-23T10:00:00Z",
  "created_by": "user-uuid",
  "extension_data": {
    "iso_alpha2": "SA",
    "iso_alpha3": "SAU",
    "iso_numeric": "682",
    "capital": "Riyadh",
    "region": "Asia",
    "subregion": "Western Asia"
  }
}
```

---

### List Dossiers

Retrieve a list of dossiers with optional filtering.

**Endpoint**: `GET /dossiers`

**Query Parameters**:
- `type` (optional): Filter by dossier type
- `status` (optional): Filter by status (active, archived, draft)
- `sensitivity` (optional): Filter by sensitivity classification
- `search` (optional): Search by name/description
- `tags` (optional): Filter by tags (comma-separated)
- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 20, max: 100): Items per page

**Example Request**:
```http
GET /dossiers?type=country&status=active&page=1&pageSize=20
```

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "country",
      "name": "Saudi Arabia",
      "status": "active",
      "sensitivity_classification": "internal",
      "description": "Kingdom of Saudi Arabia",
      "tags": ["gcc", "middle-east", "g20"],
      "created_at": "2025-01-23T10:00:00Z",
      "updated_at": "2025-01-23T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalCount": 92
  }
}
```

---

### Update Dossier

Update an existing dossier.

**Endpoint**: `PUT /dossiers/:id`

**Request Body** (partial update):
```json
{
  "name": "Kingdom of Saudi Arabia",
  "status": "active",
  "description": "Updated description",
  "tags": ["gcc", "g20", "opec"],
  "extension_data": {
    "capital": "Riyadh City"
  }
}
```

**Response**: `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "country",
  "name": "Kingdom of Saudi Arabia",
  "status": "active",
  "updated_at": "2025-01-23T11:00:00Z",
  // ... full dossier object
}
```

---

### Delete Dossier

Delete a dossier and all associated data (cascade delete).

**Endpoint**: `DELETE /dossiers/:id`

**Response**: `204 No Content`

**Cascade Behavior**:
- ✅ Extension table row deleted
- ✅ All relationships deleted (source and target)
- ✅ All calendar events deleted
- ✅ All event participations deleted
- ✅ All document links deleted

---

## Relationship Operations

### Create Relationship

Create a directed relationship between two dossiers.

**Endpoint**: `POST /relationships`

**Request Body**:
```json
{
  "source_id": "550e8400-e29b-41d4-a716-446655440000",
  "target_id": "660e8400-e29b-41d4-a716-446655440001",
  "relationship_type": "bilateral_relation",
  "description": "Strategic partnership",
  "metadata": {
    "established_date": "2020-01-15",
    "strength": "strong"
  }
}
```

**Relationship Types**:
- `bilateral_relation` - Country to country diplomatic relations
- `membership` - Country/organization membership in forum
- `engagement_participation` - Entity participation in engagement
- `parent_child` - Hierarchical relationships
- `affiliated_with` - Organization affiliations
- `works_on` - Person/organization working on theme
- `assigned_to` - Staff assignments

**Response**: `201 Created`
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "source_id": "550e8400-e29b-41d4-a716-446655440000",
  "target_id": "660e8400-e29b-41d4-a716-446655440001",
  "relationship_type": "bilateral_relation",
  "description": "Strategic partnership",
  "metadata": {
    "established_date": "2020-01-15",
    "strength": "strong"
  },
  "created_at": "2025-01-23T10:00:00Z",
  "created_by": "user-uuid"
}
```

**Validation Rules**:
- ❌ Self-referential relationships (source_id == target_id) are rejected
- ❌ Circular parent/child relationships are rejected
- ✅ Duplicate relationships are allowed (same source/target/type)

---

### Get Relationships for Dossier

Retrieve all relationships for a specific dossier.

**Endpoint**: `GET /relationships?dossierId=:id`

**Query Parameters**:
- `dossierId` (required): Dossier UUID
- `direction` (optional): `outgoing`, `incoming`, or `both` (default: `both`)
- `relationshipType` (optional): Filter by relationship type
- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 20, max: 100): Items per page

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "source_id": "550e8400-e29b-41d4-a716-446655440000",
      "target_id": "660e8400-e29b-41d4-a716-446655440001",
      "relationship_type": "bilateral_relation",
      "description": "Strategic partnership",
      "source_dossier": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "type": "country",
        "name": "Saudi Arabia"
      },
      "target_dossier": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "type": "country",
        "name": "United States"
      },
      "created_at": "2025-01-23T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 2,
    "totalCount": 35
  }
}
```

---

### Delete Relationship

Delete a specific relationship.

**Endpoint**: `DELETE /relationships/:id`

**Response**: `204 No Content`

---

## Graph Traversal Operations

### Traverse Relationship Graph

Perform recursive graph traversal starting from a specific dossier.

**Endpoint**: `POST /graph/traverse`

**Request Body**:
```json
{
  "start_id": "550e8400-e29b-41d4-a716-446655440000",
  "depth": 3,
  "relationship_types": ["bilateral_relation", "membership"],
  "include_metadata": true
}
```

**Request Parameters**:
- `start_id` (required): Starting dossier UUID
- `depth` (optional, default: 2, max: 10): Maximum traversal depth
- `relationship_types` (optional): Filter by relationship types
- `include_metadata` (optional, default: false): Include full dossier data

**Response**: `200 OK`
```json
{
  "root_id": "550e8400-e29b-41d4-a716-446655440000",
  "depth": 3,
  "node_count": 47,
  "edge_count": 82,
  "nodes": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "country",
      "name": "Saudi Arabia",
      "depth": 0
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "type": "country",
      "name": "United States",
      "depth": 1
    }
    // ... more nodes
  ],
  "edges": [
    {
      "source_id": "550e8400-e29b-41d4-a716-446655440000",
      "target_id": "660e8400-e29b-41d4-a716-446655440001",
      "relationship_type": "bilateral_relation",
      "depth": 1
    }
    // ... more edges
  ],
  "complexity_score": 45
}
```

**Complexity Limits**:
- Max depth: 10 degrees
- Max nodes: 1000 nodes
- Query timeout: 30 seconds

---

### Find Shortest Path

Find the shortest path between two dossiers in the relationship graph.

**Endpoint**: `POST /graph/shortest-path`

**Request Body**:
```json
{
  "source_id": "550e8400-e29b-41d4-a716-446655440000",
  "target_id": "770e8400-e29b-41d4-a716-446655440005",
  "max_depth": 5
}
```

**Response**: `200 OK`
```json
{
  "found": true,
  "path_length": 3,
  "path": [
    {
      "dossier_id": "550e8400-e29b-41d4-a716-446655440000",
      "dossier_name": "Saudi Arabia",
      "dossier_type": "country"
    },
    {
      "relationship_type": "membership",
      "relationship_id": "880e8400-e29b-41d4-a716-446655440010"
    },
    {
      "dossier_id": "660e8400-e29b-41d4-a716-446655440002",
      "dossier_name": "G20",
      "dossier_type": "forum"
    },
    {
      "relationship_type": "membership",
      "relationship_id": "990e8400-e29b-41d4-a716-446655440011"
    },
    {
      "dossier_id": "770e8400-e29b-41d4-a716-446655440005",
      "dossier_name": "United Nations",
      "dossier_type": "forum"
    }
  ]
}
```

**Response (No Path Found)**: `200 OK`
```json
{
  "found": false,
  "message": "No path found within max depth of 5"
}
```

---

## Search Operations

### Unified Search

Search across all dossier types with weighted ranking.

**Endpoint**: `GET /search`

**Query Parameters**:
- `q` (required): Search query string
- `type` (optional): Filter by dossier type
- `status` (optional): Filter by status
- `limit` (optional, default: 20, max: 100): Results limit
- `offset` (optional, default: 0): Results offset

**Example Request**:
```http
GET /search?q=climate%20change&type=theme&limit=20
```

**Response**: `200 OK`
```json
{
  "query": "climate change",
  "total_results": 45,
  "results": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440020",
      "type": "theme",
      "name": "Climate Change Mitigation",
      "description": "Global efforts to reduce greenhouse gas emissions",
      "rank": 0.95,
      "matched_terms": ["climate", "change"],
      "highlights": {
        "description": "Global efforts to address <mark>climate change</mark>"
      }
    },
    {
      "id": "990e8400-e29b-41d4-a716-446655440021",
      "type": "engagement",
      "name": "COP28 Climate Summit",
      "description": "2023 UN Climate Change Conference",
      "rank": 0.87,
      "matched_terms": ["climate"]
    }
    // ... more results
  ],
  "facets": {
    "by_type": {
      "theme": 15,
      "engagement": 12,
      "organization": 10,
      "forum": 8
    },
    "by_status": {
      "active": 40,
      "archived": 5
    }
  }
}
```

**Ranking Algorithm**:
1. Exact name match (rank 1.0)
2. Name contains query (rank 0.8)
3. Description contains query (rank 0.6)
4. Tags contain query (rank 0.5)
5. Status (active > archived > draft)
6. Alphabetical sorting

---

## Calendar Operations

### Create Calendar Event

Create a new calendar event associated with a dossier.

**Endpoint**: `POST /calendar/events`

**Request Body**:
```json
{
  "dossier_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_type": "meeting",
  "title": "Bilateral Trade Talks",
  "description": "Negotiations on trade agreement",
  "location": "Riyadh",
  "start_datetime": "2025-03-15T09:00:00Z",
  "end_datetime": "2025-03-15T17:00:00Z",
  "status": "confirmed",
  "participants": [
    {
      "dossier_id": "660e8400-e29b-41d4-a716-446655440001",
      "role": "attendee"
    },
    {
      "dossier_id": "770e8400-e29b-41d4-a716-446655440030",
      "role": "organizer"
    }
  ]
}
```

**Event Types**:
- `meeting` - Standard meetings
- `deadline` - Important deadlines
- `milestone` - Project milestones
- `session` - Conference sessions

**Event Statuses**:
- `planned` - Tentative
- `confirmed` - Confirmed
- `cancelled` - Cancelled
- `completed` - Past event

**Response**: `201 Created`
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440040",
  "dossier_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_type": "meeting",
  "title": "Bilateral Trade Talks",
  "description": "Negotiations on trade agreement",
  "location": "Riyadh",
  "start_datetime": "2025-03-15T09:00:00Z",
  "end_datetime": "2025-03-15T17:00:00Z",
  "status": "confirmed",
  "created_at": "2025-01-23T10:00:00Z",
  "participants": [
    {
      "dossier_id": "660e8400-e29b-41d4-a716-446655440001",
      "dossier_name": "United States",
      "role": "attendee"
    },
    {
      "dossier_id": "770e8400-e29b-41d4-a716-446655440030",
      "dossier_name": "Ambassador John Smith",
      "role": "organizer"
    }
  ]
}
```

---

### Get Events for Dossier

Retrieve all calendar events associated with a specific dossier.

**Endpoint**: `GET /calendar/events?dossierId=:id`

**Query Parameters**:
- `dossierId` (required): Dossier UUID
- `status` (optional): Filter by event status
- `eventType` (optional): Filter by event type
- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 20, max: 100): Items per page

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440040",
      "event_type": "meeting",
      "title": "Bilateral Trade Talks",
      "start_datetime": "2025-03-15T09:00:00Z",
      "end_datetime": "2025-03-15T17:00:00Z",
      "status": "confirmed"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "totalCount": 8
  }
}
```

---

### Get Events in Date Range

Retrieve calendar events within a specific date range.

**Endpoint**: `GET /calendar/events`

**Query Parameters**:
- `startDate` (required): Start date (ISO 8601 format)
- `endDate` (required): End date (ISO 8601 format)
- `eventType` (optional): Filter by event type
- `status` (optional): Filter by event status
- `limit` (optional, default: 20, max: 500): Results limit

**Example Request**:
```http
GET /calendar/events?startDate=2025-03-01&endDate=2025-03-31&eventType=meeting
```

**Response**: `200 OK`
```json
{
  "start_date": "2025-03-01",
  "end_date": "2025-03-31",
  "total_events": 12,
  "events": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440040",
      "dossier_id": "550e8400-e29b-41d4-a716-446655440000",
      "dossier_name": "Saudi Arabia",
      "event_type": "meeting",
      "title": "Bilateral Trade Talks",
      "start_datetime": "2025-03-15T09:00:00Z",
      "end_datetime": "2025-03-15T17:00:00Z",
      "status": "confirmed"
    }
    // ... more events
  ]
}
```

**Complexity Limits**:
- Max date range: 365 days
- Max events per query: 500

---

### Update Calendar Event

Update an existing calendar event.

**Endpoint**: `PUT /calendar/events/:id`

**Request Body** (partial update):
```json
{
  "title": "Updated Trade Talks",
  "status": "cancelled",
  "cancellation_reason": "Rescheduled due to conflict"
}
```

**Response**: `200 OK`

---

### Delete Calendar Event

Delete a calendar event.

**Endpoint**: `DELETE /calendar/events/:id`

**Response**: `204 No Content`

---

## Error Handling

### Standard Error Response

All errors follow a consistent format:

```json
{
  "error": "ValidationError",
  "message": "Invalid dossier type",
  "details": {
    "field": "type",
    "received": "invalid_type",
    "allowed": ["country", "organization", "forum", "engagement", "theme", "working_group", "person"]
  },
  "request_id": "req_abc123xyz",
  "timestamp": "2025-01-23T10:00:00Z"
}
```

### HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `204 No Content` - Resource deleted successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient clearance level
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate or conflicting resource
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Common Error Types

**ValidationError**:
```json
{
  "error": "ValidationError",
  "message": "Required field missing",
  "details": {
    "field": "name",
    "constraint": "required"
  }
}
```

**AuthorizationError**:
```json
{
  "error": "AuthorizationError",
  "message": "Insufficient clearance level",
  "details": {
    "required_clearance": "confidential",
    "user_clearance": "internal"
  }
}
```

**ComplexityBudgetError**:
```json
{
  "error": "ComplexityBudgetError",
  "message": "Graph traversal depth exceeds maximum",
  "details": {
    "limit": 10,
    "actual": 15,
    "parameter": "depth"
  }
}
```

**NotFoundError**:
```json
{
  "error": "NotFoundError",
  "message": "Dossier not found",
  "details": {
    "resource": "dossier",
    "id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## Rate Limiting

### Rate Limits by Endpoint

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `/dossiers` (GET) | 100 req/min | 1 minute |
| `/dossiers` (POST/PUT/DELETE) | 30 req/min | 1 minute |
| `/relationships` | 100 req/min | 1 minute |
| `/graph/traverse` | 10 req/min | 1 minute |
| `/search` | 20 req/min | 1 minute |
| `/calendar/events` | 50 req/min | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705923600
```

### Rate Limit Exceeded Response

```json
{
  "error": "RateLimitExceeded",
  "message": "Rate limit exceeded for /search endpoint",
  "details": {
    "limit": 20,
    "window": "1 minute",
    "reset_at": "2025-01-23T10:01:00Z"
  }
}
```

---

## Examples

### Example 1: Create a Multi-Party Engagement

```typescript
// Step 1: Create engagement dossier
const engagement = await fetch(`${API_URL}/dossiers`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'engagement',
    name: 'China-Saudi Trade Talks 2025',
    status: 'active',
    sensitivity_classification: 'confidential',
    description: 'Bilateral trade negotiations',
    extension_data: {
      engagement_type: 'negotiation',
      start_date: '2025-03-15',
      end_date: '2025-03-17',
      location: 'Beijing'
    }
  })
})

const engagementData = await engagement.json()

// Step 2: Link China to engagement
await fetch(`${API_URL}/relationships`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    source_id: engagementData.id,
    target_id: CHINA_DOSSIER_ID,
    relationship_type: 'engagement_participation',
    description: 'Host country'
  })
})

// Step 3: Link Saudi Arabia to engagement
await fetch(`${API_URL}/relationships`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    source_id: engagementData.id,
    target_id: SAUDI_DOSSIER_ID,
    relationship_type: 'engagement_participation',
    description: 'Participating country'
  })
})
```

### Example 2: Search and Visualize Relationship Graph

```typescript
// Step 1: Search for climate-related themes
const searchResponse = await fetch(
  `${API_URL}/search?q=climate&type=theme&limit=10`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
)

const searchResults = await searchResponse.json()
const themeId = searchResults.results[0].id

// Step 2: Traverse graph to find related entities
const graphResponse = await fetch(`${API_URL}/graph/traverse`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    start_id: themeId,
    depth: 2,
    include_metadata: true
  })
})

const graphData = await graphResponse.json()

// Step 3: Visualize with React Flow
const nodes = graphData.nodes.map(node => ({
  id: node.id,
  data: { label: node.name, type: node.type },
  position: calculatePosition(node)
}))

const edges = graphData.edges.map(edge => ({
  id: edge.id,
  source: edge.source_id,
  target: edge.target_id,
  label: edge.relationship_type
}))
```

### Example 3: Create Multi-Day Forum with Calendar Events

```typescript
// Step 1: Create forum dossier
const forum = await fetch(`${API_URL}/dossiers`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'forum',
    name: 'G20 Summit 2025',
    status: 'active',
    sensitivity_classification: 'public',
    extension_data: {
      forum_type: 'multilateral',
      founding_date: '1999-09-25',
      member_count: 20
    }
  })
})

const forumData = await forum.json()

// Step 2: Create opening ceremony event
await fetch(`${API_URL}/calendar/events`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    dossier_id: forumData.id,
    event_type: 'session',
    title: 'Opening Ceremony',
    start_datetime: '2025-11-30T09:00:00Z',
    end_datetime: '2025-11-30T11:00:00Z',
    status: 'confirmed'
  })
})

// Step 3: Create working sessions (Day 1, 2, 3)
for (let day = 0; day < 3; day++) {
  await fetch(`${API_URL}/calendar/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dossier_id: forumData.id,
      event_type: 'session',
      title: `Working Session Day ${day + 1}`,
      start_datetime: `2025-11-${30 + day}T14:00:00Z`,
      end_datetime: `2025-11-${30 + day}T18:00:00Z`,
      status: 'confirmed'
    })
  })
}

// Step 4: Create closing ceremony
await fetch(`${API_URL}/calendar/events`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    dossier_id: forumData.id,
    event_type: 'session',
    title: 'Closing Ceremony',
    start_datetime: '2025-12-02T16:00:00Z',
    end_datetime: '2025-12-02T18:00:00Z',
    status: 'confirmed'
  })
})
```

---

## Changelog

### Version 1.0.0 (2025-01-23)
- Initial release of Unified Dossier Architecture API
- Support for 7 dossier types with class table inheritance
- Universal relationship model with graph traversal
- Unified search across all entity types
- Calendar operations with temporal separation
- Comprehensive error handling and rate limiting

---

## Support & Feedback

**Documentation**: https://github.com/your-org/intl-dossier-v2/docs/api/
**Issues**: https://github.com/your-org/intl-dossier-v2/issues
**Email**: api-support@example.com

For security vulnerabilities, please email security@example.com directly.
