# Utilities & Support API

## Overview

The Utilities & Support API provides miscellaneous helper functions, CQRS patterns, event sourcing, monitoring, watchlists, tags, themes, and system utilities. All endpoints support various cross-cutting concerns not covered by domain-specific APIs.

## Endpoints

### Activity Feed

Get user activity feed with real-time updates.

**Endpoint:** `GET /activity-feed?user_id={id}&limit={limit}`

**Query Parameters:**
- `user_id` (optional): User ID (defaults to current user)
- `activity_types` (optional): Comma-separated activity types
- `limit` (optional): Number of items (default: 50, max: 200)
- `offset` (optional): Pagination offset

**Response (200 OK):**
```json
{
  "activities": [
    {
      "activity_id": "activity-uuid",
      "timestamp": "2024-01-15T10:30:00Z",
      "activity_type": "position_published",
      "title_en": "Published Climate Policy Framework",
      "title_ar": "نشرت إطار سياسة المناخ",
      "actor_id": "user-uuid",
      "actor_name": "John Doe",
      "entity_type": "position",
      "entity_id": "pos-uuid",
      "metadata": {
        "position_title": "Climate Policy Framework",
        "version": 5
      }
    }
  ],
  "total": 234,
  "unread_count": 12
}
```

---

### Watchlist

Manage user watchlists for entities.

**Endpoint:** `GET /watchlist` or `POST /watchlist`

**Add to Watchlist:**

**Request Body:**
```json
{
  "entity_type": "dossier",
  "entity_id": "dossier-uuid",
  "notification_preferences": {
    "updates": true,
    "comments": true,
    "assignments": true
  }
}
```

**Response (201 Created):**
```json
{
  "watchlist_id": "watch-uuid",
  "entity_type": "dossier",
  "entity_id": "dossier-uuid",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Get Watchlist:**
```http
GET /watchlist?entity_type=dossier
```

**Response (200 OK):**
```json
{
  "watched_entities": [
    {
      "watchlist_id": "watch-uuid",
      "entity_type": "dossier",
      "entity_id": "dossier-uuid",
      "entity_title_en": "Ministry of Environment - Country X",
      "unread_updates": 5,
      "last_activity": "2024-01-15T09:00:00Z",
      "notification_preferences": {
        "updates": true,
        "comments": true
      }
    }
  ],
  "total": 24
}
```

---

### Tags Management

Manage hierarchical tags for entities.

**Endpoint:** `POST /tags-manage` or `GET /tags-manage`

**Create Tag:**

**Request Body:**
```json
{
  "action": "create",
  "tag_name_en": "Climate Change",
  "tag_name_ar": "تغير المناخ",
  "parent_tag_id": null,
  "tag_type": "thematic",
  "color": "#4CAF50"
}
```

**Response (201 Created):**
```json
{
  "tag_id": "tag-uuid",
  "tag_name_en": "Climate Change",
  "tag_name_ar": "تغير المناخ",
  "tag_type": "thematic",
  "usage_count": 0
}
```

**List Tags:**
```http
GET /tags-manage?tag_type=thematic
```

**Response (200 OK):**
```json
{
  "tags": [
    {
      "tag_id": "tag-uuid",
      "tag_name_en": "Climate Change",
      "tag_name_ar": "تغير المناخ",
      "parent_tag_id": null,
      "children_count": 5,
      "usage_count": 245,
      "color": "#4CAF50"
    }
  ],
  "total": 87
}
```

---

### Tag Hierarchy

Get hierarchical tag tree.

**Endpoint:** `GET /tag-hierarchy?root_tag_id={id}`

**Response (200 OK):**
```json
{
  "tree": {
    "tag_id": "root-uuid",
    "tag_name_en": "Policy Areas",
    "tag_name_ar": "مجالات السياسة",
    "children": [
      {
        "tag_id": "child-uuid-1",
        "tag_name_en": "Climate Change",
        "tag_name_ar": "تغير المناخ",
        "children": [
          {
            "tag_id": "grandchild-uuid-1",
            "tag_name_en": "Renewable Energy",
            "children": []
          }
        ]
      }
    ]
  }
}
```

---

### Themes

Manage UI themes and customization.

**Endpoint:** `GET /themes` or `POST /themes`

**List Themes:**
```http
GET /themes
```

**Response (200 OK):**
```json
{
  "themes": [
    {
      "theme_id": "theme-uuid",
      "theme_name": "Default Light",
      "theme_type": "light",
      "is_default": true,
      "colors": {
        "primary": "#1976D2",
        "secondary": "#424242",
        "background": "#FFFFFF",
        "text": "#000000"
      }
    },
    {
      "theme_id": "theme-uuid-2",
      "theme_name": "Dark Mode",
      "theme_type": "dark",
      "colors": {
        "primary": "#90CAF9",
        "background": "#121212",
        "text": "#FFFFFF"
      }
    }
  ]
}
```

**Create Custom Theme:**

**Request Body:**
```json
{
  "theme_name": "Custom Corporate",
  "theme_type": "light",
  "colors": {
    "primary": "#006400",
    "secondary": "#FFD700",
    "background": "#F5F5F5"
  }
}
```

---

### CQRS Commands

Execute CQRS commands.

**Endpoint:** `POST /cqrs-commands`

**Request Body:**
```json
{
  "command_type": "CreatePosition",
  "aggregate_id": "pos-uuid",
  "command_data": {
    "title_en": "New Position",
    "content_en": "Content...",
    "author_id": "user-uuid"
  },
  "metadata": {
    "correlation_id": "corr-uuid",
    "causation_id": "cause-uuid"
  }
}
```

**Response (202 Accepted):**
```json
{
  "command_id": "cmd-uuid",
  "status": "accepted",
  "aggregate_id": "pos-uuid",
  "sequence_number": 1,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### CQRS Queries

Execute CQRS read model queries.

**Endpoint:** `POST /cqrs-queries`

**Request Body:**
```json
{
  "query_type": "GetPositionsByStatus",
  "parameters": {
    "status": "published",
    "limit": 20
  }
}
```

**Response (200 OK):**
```json
{
  "query_id": "query-uuid",
  "results": [...],
  "total": 45,
  "execution_time_ms": 12
}
```

---

### Event Store

Query event store for event sourcing.

**Endpoint:** `GET /event-store?aggregate_id={id}`

**Query Parameters:**
- `aggregate_id` (optional): Filter by aggregate ID
- `event_type` (optional): Filter by event type
- `from_sequence` (optional): Start sequence number
- `to_sequence` (optional): End sequence number

**Response (200 OK):**
```json
{
  "events": [
    {
      "event_id": "event-uuid",
      "event_type": "PositionCreated",
      "aggregate_id": "pos-uuid",
      "aggregate_type": "Position",
      "sequence_number": 1,
      "event_data": {
        "title_en": "New Position",
        "author_id": "user-uuid"
      },
      "metadata": {
        "timestamp": "2024-01-15T10:30:00Z",
        "user_id": "user-uuid",
        "correlation_id": "corr-uuid"
      }
    }
  ],
  "total": 15
}
```

---

### Multilingual Content

Manage multilingual content variations.

**Endpoint:** `GET /multilang-content?entity_id={id}` or `POST /multilang-content`

**Get Translations:**
```http
GET /multilang-content?entity_type=position&entity_id=pos-uuid
```

**Response (200 OK):**
```json
{
  "entity_type": "position",
  "entity_id": "pos-uuid",
  "translations": {
    "en": {
      "title": "Climate Policy Framework",
      "content": "Framework content..."
    },
    "ar": {
      "title": "إطار سياسة المناخ",
      "content": "محتوى الإطار..."
    },
    "fr": {
      "title": "Cadre de politique climatique",
      "content": "Contenu du cadre..."
    }
  },
  "default_language": "en",
  "available_languages": ["en", "ar", "fr"]
}
```

---

### Citation Tracking

Track citations and references between entities.

**Endpoint:** `GET /citation-tracking?entity_id={id}`

**Response (200 OK):**
```json
{
  "entity_id": "pos-uuid",
  "cited_by": [
    {
      "citing_entity_id": "pos-uuid-2",
      "citing_entity_type": "position",
      "citing_entity_title": "Related Position Paper",
      "citation_context": "As stated in Climate Policy Framework...",
      "cited_at": "2024-01-12T10:00:00Z"
    }
  ],
  "cites": [
    {
      "cited_entity_id": "doc-uuid",
      "cited_entity_type": "document",
      "cited_entity_title": "IPCC Report 2023",
      "citation_context": "According to IPCC Report..."
    }
  ],
  "citation_count": 15,
  "citation_score": 8.5
}
```

---

### Entity Dependencies

Get entity dependency graph.

**Endpoint:** `GET /entity-dependencies?entity_id={id}`

**Response (200 OK):**
```json
{
  "entity_id": "pos-uuid",
  "entity_type": "position",
  "dependencies": [
    {
      "depends_on_id": "dossier-uuid",
      "depends_on_type": "dossier",
      "dependency_type": "linked_dossier",
      "critical": false
    }
  ],
  "dependent_entities": [
    {
      "dependent_id": "assignment-uuid",
      "dependent_type": "assignment",
      "dependency_type": "related_work"
    }
  ]
}
```

---

### Entity Duplicates

Detect potential duplicate entities.

**Endpoint:** `GET /entity-duplicates?entity_type={type}`

**Response (200 OK):**
```json
{
  "entity_type": "dossier",
  "potential_duplicates": [
    {
      "group_id": "dup-group-uuid",
      "similarity_score": 0.92,
      "entities": [
        {
          "entity_id": "dossier-uuid-1",
          "name_en": "Ministry of Environment",
          "created_at": "2023-01-15T10:00:00Z"
        },
        {
          "entity_id": "dossier-uuid-2",
          "name_en": "Ministry of Environment - Country X",
          "created_at": "2024-01-10T14:00:00Z"
        }
      ],
      "suggested_action": "merge",
      "matching_fields": ["name", "location", "organization_type"]
    }
  ],
  "total_groups": 5
}
```

---

### Capacity Check

Check user capacity and workload.

**Endpoint:** `GET /capacity-check?user_id={id}`

**Response (200 OK):**
```json
{
  "user_id": "user-uuid",
  "current_workload": {
    "active_assignments": 12,
    "pending_commitments": 8,
    "intake_tickets": 5,
    "total_work_items": 25
  },
  "capacity_metrics": {
    "capacity_percentage": 85,
    "capacity_status": "high",
    "available_capacity": 15,
    "recommended_max": 30
  },
  "workload_trend": "increasing",
  "overdue_items": 3,
  "recommendation": "Consider delegating or extending deadlines"
}
```

---

### Operation Progress

Track long-running operation progress.

**Endpoint:** `GET /operation-progress?operation_id={id}`

**Response (200 OK):**
```json
{
  "operation_id": "op-uuid",
  "operation_type": "bulk_import",
  "status": "in_progress",
  "progress_percentage": 65,
  "current_step": "Validating records",
  "total_steps": 5,
  "started_at": "2024-01-15T10:00:00Z",
  "estimated_completion": "2024-01-15T10:35:00Z",
  "records_processed": 650,
  "records_total": 1000
}
```

---

### Milestone Planning

Manage project milestones.

**Endpoint:** `GET /milestone-planning?project_id={id}` or `POST /milestone-planning`

**Response (200 OK):**
```json
{
  "project_id": "project-uuid",
  "milestones": [
    {
      "milestone_id": "milestone-uuid",
      "title_en": "Draft MOU Completion",
      "due_date": "2024-02-15T00:00:00Z",
      "status": "on_track",
      "completion_percentage": 75,
      "dependencies": ["milestone-uuid-0"],
      "deliverables": 5
    }
  ]
}
```

---

## System Monitoring

Real-time system health and metrics available to admin users:

**Endpoint:** `GET /system-health` (admin only)

**Response:**
```json
{
  "status": "healthy",
  "uptime_seconds": 2592000,
  "metrics": {
    "api_requests_per_minute": 450,
    "database_connections": 45,
    "cache_hit_rate": 0.85,
    "average_response_time_ms": 120
  }
}
```

## Related APIs

- [Administration](./administration.md) - Audit logs and compliance
- [Notifications](./notifications.md) - Activity feed notifications
- [Data Management](./data-management.md) - Data import/export utilities
