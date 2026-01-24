# Relationship Management API

## Overview

The Relationship Management API handles dossier-to-dossier relationships, relationship health scoring, graph traversal, and stakeholder analysis. All endpoints support bilingual content and network graph visualization.

## Endpoints

### Manage Relationships

Create, update, or delete relationships between dossiers.

**Endpoint:** `POST /relationships-manage`

**Create Relationship Request:**
```json
{
  "action": "create",
  "from_dossier_id": "dossier-uuid-1",
  "to_dossier_id": "dossier-uuid-2",
  "relationship_type": "bilateral_cooperation",
  "strength": "strong",
  "description_en": "Strategic partnership on climate initiatives",
  "description_ar": "شراكة استراتيجية في مبادرات المناخ",
  "start_date": "2023-01-15T00:00:00Z",
  "metadata": {
    "cooperation_areas": ["environment", "energy"],
    "mou_count": 3
  }
}
```

**Response (201 Created):**
```json
{
  "relationship_id": "rel-uuid",
  "from_dossier_id": "dossier-uuid-1",
  "to_dossier_id": "dossier-uuid-2",
  "relationship_type": "bilateral_cooperation",
  "strength": "strong",
  "health_score": 85.5,
  "created_at": "2024-01-15T10:30:00Z",
  "created_by": "user-uuid"
}
```

**Update Relationship Request:**
```json
{
  "action": "update",
  "relationship_id": "rel-uuid",
  "strength": "moderate",
  "description_en": "Updated partnership scope",
  "description_ar": "نطاق الشراكة المحدث"
}
```

**Delete Relationship Request:**
```json
{
  "action": "delete",
  "relationship_id": "rel-uuid",
  "reason": "Partnership concluded"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid dossier IDs or relationship type
  ```json
  {
    "error": "Invalid relationship type. Must be one of: bilateral_cooperation, multilateral_forum, organizational_member, reporting_line, etc.",
    "error_ar": "نوع العلاقة غير صالح"
  }
  ```
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to manage relationships
- `404 Not Found` - Dossier or relationship not found
- `409 Conflict` - Relationship already exists
- `500 Internal Server Error` - Operation failed

**Implementation Example:**
```typescript
const createRelationship = async (
  fromDossierId: string,
  toDossierId: string,
  type: string,
  strength: 'strong' | 'moderate' | 'weak'
) => {
  const response = await fetch('/relationships-manage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'create',
      from_dossier_id: fromDossierId,
      to_dossier_id: toDossierId,
      relationship_type: type,
      strength
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_ar || error.error);
  }

  return await response.json();
};
```

---

### Relationship Health

Get relationship health scores and indicators.

**Endpoint:** `GET /relationship-health?relationship_id={id}`

**Query Parameters:**
- `relationship_id` (optional): Specific relationship (if omitted, returns all user-accessible relationships)
- `dossier_id` (optional): All relationships for a dossier
- `threshold` (optional): Minimum health score threshold (0-100)

**Response (200 OK):**
```json
{
  "relationships": [
    {
      "relationship_id": "rel-uuid",
      "from_dossier": {
        "id": "dossier-uuid-1",
        "name_en": "Ministry of Foreign Affairs - Country X",
        "name_ar": "وزارة الخارجية - الدولة X"
      },
      "to_dossier": {
        "id": "dossier-uuid-2",
        "name_en": "Ministry of Environment - Country Y",
        "name_ar": "وزارة البيئة - الدولة Y"
      },
      "relationship_type": "bilateral_cooperation",
      "health_score": 72.5,
      "health_trend": "declining",
      "indicators": {
        "engagement_frequency": 8.5,
        "mou_compliance": 85.0,
        "communication_responsiveness": 65.0,
        "commitment_fulfillment": 75.0,
        "recent_activity": 60.0
      },
      "last_interaction": "2024-01-10T15:30:00Z",
      "days_since_interaction": 5,
      "action_items": 3,
      "recommendations": [
        {
          "priority": "medium",
          "recommendation_en": "Schedule follow-up meeting to address pending action items",
          "recommendation_ar": "جدولة اجتماع متابعة لمعالجة البنود المعلقة"
        }
      ]
    }
  ],
  "average_health_score": 72.5,
  "at_risk_count": 2
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to view relationship health
- `404 Not Found` - Relationship not found
- `500 Internal Server Error` - Health calculation failed

**Notes:**
- Health score: 0-100 (higher is better)
- Updated daily via background job
- Factors: engagement frequency, MOU compliance, communication, commitments, activity
- Trends: `improving`, `stable`, `declining`

---

### Calculate Health Score

Recalculate health score for specific relationship.

**Endpoint:** `POST /calculate-health-score`

**Request Body:**
```json
{
  "relationship_id": "rel-uuid",
  "force_recalculate": true
}
```

**Response (200 OK):**
```json
{
  "relationship_id": "rel-uuid",
  "previous_score": 68.5,
  "new_score": 72.5,
  "trend": "improving",
  "calculated_at": "2024-01-15T10:30:00Z",
  "factors_changed": ["engagement_frequency", "recent_activity"]
}
```

**Error Responses:**
- `400 Bad Request` - Invalid relationship_id
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Calculation failed

---

### Trigger Health Recalculation

Trigger health score recalculation for all relationships (cron job).

**Endpoint:** `POST /trigger-health-recalculation`

**Request Body:**
```json
{
  "scope": "all",
  "force": false
}
```

**Response (200 OK):**
```json
{
  "triggered": true,
  "relationships_queued": 245,
  "estimated_completion_minutes": 15,
  "job_id": "job-uuid"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid service role key
- `500 Internal Server Error` - Trigger failed

---

### Graph Traversal

Traverse relationship graph to find connections.

**Endpoint:** `GET /graph-traversal?start_dossier_id={id}&max_depth={depth}`

**Query Parameters:**
- `start_dossier_id` (required): Starting dossier ID
- `max_depth` (optional): Maximum traversal depth (default: 3, max: 5)
- `relationship_types` (optional): Comma-separated relationship types to follow
- `min_health_score` (optional): Minimum health score threshold

**Response (200 OK):**
```json
{
  "start_dossier_id": "dossier-uuid-1",
  "max_depth": 3,
  "nodes": [
    {
      "dossier_id": "dossier-uuid-1",
      "dossier_name_en": "Ministry of Foreign Affairs",
      "dossier_type": "organization",
      "depth": 0
    },
    {
      "dossier_id": "dossier-uuid-2",
      "dossier_name_en": "Country X",
      "dossier_type": "country",
      "depth": 1
    }
  ],
  "edges": [
    {
      "from_dossier_id": "dossier-uuid-1",
      "to_dossier_id": "dossier-uuid-2",
      "relationship_type": "bilateral_cooperation",
      "strength": "strong",
      "health_score": 85.5
    }
  ],
  "total_nodes": 45,
  "total_edges": 78,
  "execution_time_ms": 234
}
```

**Error Responses:**
- `400 Bad Request` - Invalid start_dossier_id or max_depth
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Traversal failed

---

### Advanced Graph Traversal

Advanced graph traversal with path finding and shortest path.

**Endpoint:** `POST /graph-traversal-advanced`

**Request Body:**
```json
{
  "start_dossier_id": "dossier-uuid-1",
  "end_dossier_id": "dossier-uuid-2",
  "algorithm": "shortest_path",
  "constraints": {
    "max_depth": 5,
    "min_health_score": 60,
    "relationship_types": ["bilateral_cooperation", "multilateral_forum"]
  }
}
```

**Response (200 OK):**
```json
{
  "path_found": true,
  "path": [
    {
      "dossier_id": "dossier-uuid-1",
      "dossier_name_en": "Ministry A"
    },
    {
      "dossier_id": "dossier-uuid-3",
      "dossier_name_en": "Country X"
    },
    {
      "dossier_id": "dossier-uuid-2",
      "dossier_name_en": "Ministry B"
    }
  ],
  "path_length": 2,
  "total_health_score": 165.5,
  "alternative_paths_count": 3
}
```

---

### Stakeholder Influence

Calculate stakeholder influence scores.

**Endpoint:** `GET /stakeholder-influence?dossier_id={id}`

**Response (200 OK):**
```json
{
  "dossier_id": "dossier-uuid",
  "influence_score": 78.5,
  "rank": 12,
  "total_stakeholders": 245,
  "metrics": {
    "direct_connections": 24,
    "indirect_connections": 156,
    "relationship_strength_avg": 72.3,
    "betweenness_centrality": 0.45,
    "closeness_centrality": 0.68
  },
  "top_connections": [
    {
      "dossier_id": "conn-uuid",
      "dossier_name_en": "Ministry of Economy",
      "relationship_type": "bilateral_cooperation",
      "influence_contribution": 12.5
    }
  ]
}
```

---

### Stakeholder Timeline

Get timeline of stakeholder interactions.

**Endpoint:** `GET /stakeholder-timeline?dossier_id={id}&period={period}`

**Response (200 OK):**
```json
{
  "dossier_id": "dossier-uuid",
  "period": "90d",
  "interactions": [
    {
      "interaction_id": "int-uuid",
      "type": "engagement",
      "title_en": "Bilateral Meeting on Climate Policy",
      "date": "2024-01-10T10:00:00Z",
      "participants": ["dossier-uuid-2", "dossier-uuid-3"],
      "outcome": "Agreed on joint framework"
    }
  ],
  "total": 45,
  "interactions_by_type": {
    "engagement": 20,
    "mou_signing": 3,
    "commitment": 15,
    "communication": 7
  }
}
```

---

### Graph Export

Export relationship graph in various formats.

**Endpoint:** `GET /graph-export?dossier_id={id}&format={format}`

**Query Parameters:**
- `dossier_id` (required): Root dossier for export
- `format` (optional): Export format (`json`, `graphml`, `cypher`, default: `json`)
- `max_depth` (optional): Maximum depth (default: 3)

**Response (200 OK - JSON format):**
```json
{
  "graph": {
    "nodes": [...],
    "edges": [...]
  },
  "metadata": {
    "exported_at": "2024-01-15T10:30:00Z",
    "format": "json",
    "total_nodes": 45,
    "total_edges": 78
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid format or dossier_id
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Export failed

**Supported Formats:**
- `json` - JSON graph format (nodes + edges)
- `graphml` - GraphML XML format (for Gephi, yEd)
- `cypher` - Neo4j Cypher queries
- `csv` - CSV node and edge lists

---

## Relationship Types

| Type | Description | Directionality |
|------|-------------|----------------|
| `bilateral_cooperation` | Bilateral cooperation agreement | Bidirectional |
| `multilateral_forum` | Multilateral forum membership | Organization → Member |
| `organizational_member` | Organizational membership | Organization → Member |
| `reporting_line` | Reporting hierarchy | Manager → Report |
| `diplomatic_ties` | Diplomatic relations | Bidirectional |
| `economic_partnership` | Economic/trade partnership | Bidirectional |
| `security_alliance` | Security cooperation | Bidirectional |

## Health Score Factors

1. **Engagement Frequency** (20%): Number of interactions in last 90 days
2. **MOU Compliance** (25%): Percentage of active MOUs in good standing
3. **Communication Responsiveness** (15%): Response time to communications
4. **Commitment Fulfillment** (25%): Percentage of commitments fulfilled on time
5. **Recent Activity** (15%): Recency of last interaction

## Related APIs

- [Dossiers](./dossiers.md) - Dossier management
- [Engagements](./engagements.md) - Interaction tracking
- [MOUs](./mous.md) - MOU management
- [Commitments](./commitments.md) - Commitment tracking
