# Intake Tickets API

## Overview

The Intake Tickets API manages service requests with SLA tracking, priority-based routing, and workflow management. Supports four request types: engagement, position, mou_action, and foresight. All tickets include bilingual support (English/Arabic) and comprehensive audit logging.

## Endpoints

### Create Ticket

Submit a new intake ticket with automatic ticket number generation and SLA calculation.

**Endpoint:** `POST /intake-tickets-create`

**Request Body:**
```json
{
  "request_type": "engagement",
  "title": "Request for bilateral meeting with France",
  "title_ar": "طلب اجتماع ثنائي مع فرنسا",
  "description": "Requesting coordination for upcoming climate summit...",
  "description_ar": "طلب التنسيق للقمة المناخية القادمة...",
  "type_specific_fields": {
    "proposed_date": "2024-02-15",
    "participants": ["minister", "deputy"]
  },
  "dossier_id": "dossier-550e8400-e29b-41d4-a716-446655440000",
  "urgency": "high",
  "attachments": [
    "attachment-id-1",
    "attachment-id-2"
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "ticket-uuid",
  "ticket_number": "TKT-2024-000123",
  "request_type": "engagement",
  "title": "Request for bilateral meeting with France",
  "title_ar": "طلب اجتماع ثنائي مع فرنسا",
  "status": "submitted",
  "priority": "high",
  "assigned_to": null,
  "assigned_unit": null,
  "sla_status": {
    "acknowledgment": {
      "target_minutes": 60,
      "elapsed_minutes": 0,
      "remaining_minutes": 60,
      "is_breached": false,
      "target_time": "2024-01-15T11:30:00Z"
    },
    "resolution": {
      "target_minutes": 960,
      "elapsed_minutes": 0,
      "remaining_minutes": 960,
      "is_breached": false,
      "target_time": "2024-01-16T02:30:00Z"
    }
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or validation errors
- `401 Unauthorized` - Missing or invalid authorization
- `500 Internal Server Error` - Ticket creation failed

**Field Validation:**
- `title`: Max 200 characters
- `title_ar`: Max 200 characters (optional)
- `description`: Max 5000 characters
- `description_ar`: Max 5000 characters (optional)
- `request_type`: Must be one of: `engagement`, `position`, `mou_action`, `foresight`
- `urgency`: Optional, one of: `low`, `medium`, `high`, `critical` (defaults to `medium`)

**Implementation Example:**
```typescript
const createTicket = async (ticketData: CreateTicketRequest) => {
  const response = await fetch('/intake-tickets-create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      request_type: ticketData.requestType,
      title: ticketData.title,
      title_ar: ticketData.titleAr,
      description: ticketData.description,
      description_ar: ticketData.descriptionAr,
      urgency: ticketData.urgency || 'medium',
      dossier_id: ticketData.dossierId,
      type_specific_fields: ticketData.customFields
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const result = await response.json();

  // Display SLA countdown to user
  displaySLACountdown(result.sla_status.acknowledgment);

  return result;
};
```

**Automatic Behaviors:**
1. **Ticket Number**: Auto-generated as `TKT-YYYY-NNNNNN` (year + 6-digit sequence)
2. **Priority Calculation**: Mapped from urgency (`critical` → `urgent`, `high` → `high`, etc.)
3. **SLA Targets**: Calculated based on priority:
   - **Urgent**: 30min acknowledgment, 8hr resolution
   - **High**: 1hr acknowledgment, 16hr resolution
   - **Medium**: 4hr acknowledgment, 48hr resolution
   - **Low**: 4hr acknowledgment, 48hr resolution
4. **Audit Log**: Automatic creation event logged
5. **Metadata**: IP address and user agent captured

**Notes:**
- Authenticated user is set as `created_by`
- Initial status is always `submitted`
- Attachments are optional and linked via junction table
- Source defaults to `web`

---

### List Tickets

Retrieve paginated list of intake tickets with filtering and SLA status calculation.

**Endpoint:** `GET /intake-tickets-list`

**Query Parameters:**
- `status` (optional): Filter by status (`submitted`, `triaged`, `assigned`, `in_progress`, `awaiting_info`, `converted`, `closed`, `merged`)
- `request_type` (optional): Filter by type (`engagement`, `position`, `mou_action`, `foresight`)
- `sensitivity` (optional): Filter by sensitivity level
- `urgency` (optional): Filter by urgency (`low`, `medium`, `high`, `critical`)
- `assigned_to` (optional): Filter by assignee user ID
- `assigned_unit` (optional): Filter by assigned unit
- `sla_breached` (optional): Filter by SLA breach status (boolean)
- `created_after` (optional): Filter tickets created after date (ISO 8601)
- `created_before` (optional): Filter tickets created before date (ISO 8601)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `include_stats` (optional): Include WIP counters (boolean)

**Response (200 OK):**
```json
{
  "tickets": [
    {
      "id": "ticket-uuid-1",
      "ticket_number": "TKT-2024-000123",
      "request_type": "engagement",
      "title": "Request for bilateral meeting",
      "title_ar": "طلب اجتماع ثنائي",
      "status": "in_progress",
      "priority": "high",
      "assigned_to": "user-id",
      "assigned_unit": "bilateral-relations",
      "sla_status": {
        "acknowledgment": {
          "target_minutes": 60,
          "elapsed_minutes": 45,
          "remaining_minutes": 15,
          "is_breached": false,
          "target_time": "2024-01-15T11:30:00Z"
        },
        "resolution": {
          "target_minutes": 960,
          "elapsed_minutes": 320,
          "remaining_minutes": 640,
          "is_breached": false,
          "target_time": "2024-01-16T02:30:00Z"
        }
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T15:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_pages": 3,
    "total_items": 42
  },
  "stats": {
    "by_status": {
      "new": 8,
      "in_triage": 3,
      "assigned": 12,
      "in_progress": 15,
      "awaiting_info": 4
    },
    "by_unit": {
      "bilateral-relations": 18,
      "multilateral-affairs": 14,
      "protocol": 10
    },
    "by_sla_state": {
      "on_track": 28,
      "at_risk": 9,
      "breached": 5
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authorization
- `500 Internal Server Error` - Query execution failed

**Response Headers:**
- `X-Total-Count`: Total number of matching tickets
- `X-Queue-Stats`: JSON string of WIP counters (if `include_stats=true`)

**Implementation Example:**
```typescript
const listTickets = async (filters: TicketFilters) => {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.slaBreached !== undefined) {
    params.set('sla_breached', String(filters.slaBreached));
  }
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));
  params.set('include_stats', 'true');

  const response = await fetch(
    `/intake-tickets-list?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  // Check for at-risk tickets
  const atRiskCount = data.stats?.by_sla_state.at_risk || 0;
  if (atRiskCount > 0) {
    console.warn(`${atRiskCount} tickets at risk of SLA breach`);
  }

  return data;
};
```

**SLA State Calculation:**
- **On Track**: < 75% of SLA elapsed
- **At Risk**: 75-99% of SLA elapsed
- **Breached**: ≥ 100% of SLA elapsed

**Notes:**
- SLA status calculated in real-time for each ticket
- Tickets with `sla_breached=true` filter include both acknowledgment and resolution breaches
- Stats are calculated across all active tickets (not just current page)
- Results ordered by `created_at DESC` by default

---

### Get Ticket

Retrieve detailed information for a single ticket.

**Endpoint:** `GET /intake-tickets-get?ticket_id={id}`

**Query Parameters:**
- `ticket_id` (required): UUID of the ticket

**Response (200 OK):**
```json
{
  "id": "ticket-uuid",
  "ticket_number": "TKT-2024-000123",
  "request_type": "engagement",
  "title": "Request for bilateral meeting",
  "title_ar": "طلب اجتماع ثنائي",
  "description": "Full description...",
  "description_ar": "الوصف الكامل...",
  "type_specific_fields": {
    "proposed_date": "2024-02-15",
    "participants": ["minister", "deputy"]
  },
  "status": "in_progress",
  "priority": "high",
  "urgency": "high",
  "sensitivity": "internal",
  "assigned_to": "user-id",
  "assigned_unit": "bilateral-relations",
  "dossier_id": "dossier-id",
  "created_by": "requester-id",
  "updated_by": "assignee-id",
  "submitted_at": "2024-01-15T10:30:00Z",
  "triaged_at": "2024-01-15T10:45:00Z",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T15:45:00Z",
  "client_metadata": {
    "user_agent": "Mozilla/5.0...",
    "ip_address": "192.168.1.1"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing ticket_id parameter
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Ticket not found or access denied

---

### Update Ticket

Update ticket fields with audit logging.

**Endpoint:** `PUT /intake-tickets-update`

**Request Body:**
```json
{
  "id": "ticket-uuid",
  "title": "Updated title",
  "title_ar": "العنوان المحدث",
  "description": "Updated description...",
  "urgency": "critical",
  "type_specific_fields": {
    "proposed_date": "2024-02-20"
  }
}
```

**Response (200 OK):**
```json
{
  "id": "ticket-uuid",
  "ticket_number": "TKT-2024-000123",
  "request_type": "engagement",
  "title": "Updated title",
  "title_ar": "العنوان المحدث",
  "status": "in_progress",
  "priority": "urgent",
  "sla_status": {
    "acknowledgment": {
      "target_minutes": 30,
      "elapsed_minutes": 55,
      "remaining_minutes": 0,
      "is_breached": true,
      "target_time": "2024-01-15T11:00:00Z"
    },
    "resolution": {
      "target_minutes": 480,
      "elapsed_minutes": 320,
      "remaining_minutes": 160,
      "is_breached": false,
      "target_time": "2024-01-15T18:30:00Z"
    }
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T16:25:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing ID or validation errors
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User lacks permission to update
- `404 Not Found` - Ticket not found

**Authorization:**
User can update if they are:
- Ticket creator (`created_by`)
- Current assignee (`assigned_to`)
- Supervisor or admin role

**Implementation Example:**
```typescript
const updateTicket = async (
  ticketId: string,
  updates: Partial<TicketUpdate>
) => {
  const response = await fetch('/intake-tickets-update', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: ticketId,
      ...updates
    })
  });

  if (response.status === 403) {
    throw new Error('You do not have permission to update this ticket');
  }

  const result = await response.json();

  // Check if urgency change caused priority recalculation
  if (updates.urgency && result.priority) {
    console.log(`Priority updated to: ${result.priority}`);
  }

  return result;
};
```

**Notes:**
- Partial updates supported (only include changed fields)
- Urgency changes trigger automatic priority recalculation
- Audit log captures old and new values for all changed fields
- SLA targets recalculated if priority changes
- `updated_by` and `updated_at` automatically set

---

### Assign Ticket

Assign a ticket to a user and/or unit.

**Endpoint:** `POST /intake-tickets-assign`

**Request Body:**
```json
{
  "ticket_id": "ticket-uuid",
  "assigned_to": "user-id",
  "assigned_unit": "bilateral-relations",
  "notes": "Assigning to subject matter expert"
}
```

**Response (200 OK):**
```json
{
  "id": "ticket-uuid",
  "status": "assigned",
  "assigned_to": "user-id",
  "assigned_unit": "bilateral-relations",
  "assigned_at": "2024-01-15T11:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid assignment
- `404 Not Found` - Ticket or user not found

---

### Triage Ticket

Perform initial triage and classification.

**Endpoint:** `POST /intake-tickets-triage`

**Request Body:**
```json
{
  "ticket_id": "ticket-uuid",
  "classification": "bilateral_coordination",
  "recommended_unit": "bilateral-relations",
  "recommended_priority": "high",
  "triage_notes": "Urgent request requiring immediate attention"
}
```

**Response (200 OK):**
```json
{
  "id": "ticket-uuid",
  "status": "triaged",
  "classification": "bilateral_coordination",
  "triaged_at": "2024-01-15T10:45:00Z",
  "triaged_by": "triage-officer-id"
}
```

---

### Convert Ticket

Convert a ticket to another entity type (e.g., engagement, position).

**Endpoint:** `POST /intake-tickets-convert`

**Request Body:**
```json
{
  "ticket_id": "ticket-uuid",
  "convert_to": "engagement",
  "conversion_data": {
    "engagement_type": "bilateral_meeting",
    "engagement_date": "2024-02-15"
  }
}
```

**Response (200 OK):**
```json
{
  "ticket_id": "ticket-uuid",
  "ticket_status": "converted",
  "created_entity_type": "engagement",
  "created_entity_id": "engagement-uuid",
  "converted_at": "2024-01-15T12:00:00Z"
}
```

---

### Merge Tickets

Merge duplicate tickets.

**Endpoint:** `POST /intake-tickets-merge`

**Request Body:**
```json
{
  "primary_ticket_id": "ticket-uuid-1",
  "duplicate_ticket_ids": [
    "ticket-uuid-2",
    "ticket-uuid-3"
  ],
  "merge_notes": "Duplicate requests for same meeting"
}
```

**Response (200 OK):**
```json
{
  "primary_ticket": {
    "id": "ticket-uuid-1",
    "ticket_number": "TKT-2024-000123",
    "merged_tickets": ["TKT-2024-000125", "TKT-2024-000127"]
  },
  "duplicate_tickets_status": "merged"
}
```

---

### Find Duplicate Tickets

Detect potential duplicate tickets using similarity matching.

**Endpoint:** `GET /intake-tickets-duplicates?ticket_id={id}`

**Response (200 OK):**
```json
{
  "ticket_id": "ticket-uuid",
  "potential_duplicates": [
    {
      "ticket_id": "duplicate-uuid",
      "ticket_number": "TKT-2024-000125",
      "similarity_score": 0.89,
      "match_reasons": [
        "Similar title",
        "Same dossier",
        "Created within 24 hours"
      ]
    }
  ]
}
```

---

### Get Ticket Attachments

Retrieve attachments for a ticket.

**Endpoint:** `GET /intake-tickets-attachments?ticket_id={id}`

**Response (200 OK):**
```json
{
  "ticket_id": "ticket-uuid",
  "attachments": [
    {
      "id": "attachment-id-1",
      "filename": "meeting_agenda.pdf",
      "file_size": 245760,
      "content_type": "application/pdf",
      "uploaded_at": "2024-01-15T10:30:00Z",
      "uploaded_by": "user-id"
    }
  ]
}
```

---

### Create Intake Link

Link a ticket to related entities (dossiers, positions, etc.).

**Endpoint:** `POST /intake-links-create`

**Request Body:**
```json
{
  "ticket_id": "ticket-uuid",
  "linked_entity_type": "dossier",
  "linked_entity_id": "dossier-uuid",
  "link_type": "related",
  "notes": "Related to ongoing bilateral discussions"
}
```

**Response (201 Created):**
```json
{
  "id": "link-uuid",
  "ticket_id": "ticket-uuid",
  "linked_entity_type": "dossier",
  "linked_entity_id": "dossier-uuid",
  "link_type": "related",
  "created_at": "2024-01-15T11:15:00Z"
}
```

---

### Get Link Suggestions

AI-powered suggestions for ticket linking.

**Endpoint:** `GET /intake-links-suggestions?ticket_id={id}`

**Response (200 OK):**
```json
{
  "ticket_id": "ticket-uuid",
  "suggestions": [
    {
      "entity_type": "dossier",
      "entity_id": "dossier-uuid",
      "entity_name": "France Bilateral Relations",
      "confidence_score": 0.92,
      "reason": "Mentioned in ticket description"
    },
    {
      "entity_type": "position",
      "entity_id": "position-uuid",
      "entity_name": "Climate Policy Framework",
      "confidence_score": 0.78,
      "reason": "Related thematic category"
    }
  ]
}
```

---

### Get Intake Health Metrics

Retrieve health metrics for intake system monitoring.

**Endpoint:** `GET /intake-health`

**Response (200 OK):**
```json
{
  "overall_health": "warning",
  "metrics": {
    "total_active_tickets": 42,
    "sla_breach_rate": 0.12,
    "avg_resolution_time_hours": 18.5,
    "avg_acknowledgment_time_minutes": 45,
    "tickets_by_status": {
      "submitted": 8,
      "triaged": 3,
      "assigned": 12,
      "in_progress": 15,
      "awaiting_info": 4
    },
    "unit_workload": {
      "bilateral-relations": {
        "active_tickets": 18,
        "avg_completion_time_hours": 16.2
      },
      "multilateral-affairs": {
        "active_tickets": 14,
        "avg_completion_time_hours": 22.1
      }
    }
  },
  "alerts": [
    {
      "severity": "warning",
      "message": "SLA breach rate above threshold (12% > 10%)",
      "affected_units": ["multilateral-affairs"]
    }
  ],
  "timestamp": "2024-01-15T16:00:00Z"
}
```

---

## Ticket Lifecycle States

| Status | Description | Next States |
|--------|-------------|-------------|
| `submitted` | Initial state after creation | triaged, assigned |
| `triaged` | Classified and prioritized | assigned |
| `assigned` | Assigned to user/unit | in_progress, awaiting_info |
| `in_progress` | Actively being worked on | awaiting_info, converted, closed |
| `awaiting_info` | Waiting for requester response | in_progress, closed |
| `converted` | Converted to another entity | - (terminal) |
| `closed` | Resolved and closed | - (terminal) |
| `merged` | Merged into another ticket | - (terminal) |

## SLA Targets by Priority

| Priority | Acknowledgment | Resolution |
|----------|----------------|------------|
| Urgent | 30 minutes | 8 hours |
| High | 1 hour | 16 hours |
| Medium | 4 hours | 48 hours |
| Low | 4 hours | 48 hours |

## Common Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| `400` | Bad Request | Validate field constraints and required fields |
| `401` | Unauthorized | Verify authentication token |
| `403` | Forbidden | Check user permissions for update/assign operations |
| `404` | Not Found | Verify ticket ID exists |
| `500` | Server Error | Contact support with correlation_id |

## Best Practices

1. **Always set urgency appropriately** - Directly impacts SLA targets and routing
2. **Provide bilingual content** for better accessibility
3. **Use type_specific_fields** for custom metadata per request type
4. **Monitor SLA status** - Set up alerts for at-risk tickets (75%+ elapsed)
5. **Link related entities** using intake-links for better context
6. **Check for duplicates** before creating new tickets
7. **Include attachments** to reduce back-and-forth communication
8. **Use triage endpoint** for systematic classification
9. **Track metrics** via intake-health endpoint for system monitoring
10. **Handle audit logs** - All updates are automatically logged for compliance
