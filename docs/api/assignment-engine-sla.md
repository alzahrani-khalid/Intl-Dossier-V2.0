# Assignment Engine & SLA API Documentation

**Version**: 1.0.0
**Base URL**: `https://your-project.supabase.co/functions/v1`
**Authentication**: Bearer token (Supabase JWT)

## Overview

The Assignment Engine & SLA API provides endpoints for auto-routing work items to staff members based on skills, capacity, and availability, with automatic SLA tracking and escalation.

**Key Features**:
- Weighted auto-assignment algorithm (skills + capacity + availability + unit matching)
- Work-In-Progress (WIP) limit enforcement at individual and unit levels
- Priority-based queueing when capacity exhausted
- Real-time SLA tracking with automatic escalation
- Leave management with automatic reassignment

---

## Table of Contents

1. [Authentication](#authentication)
2. [Endpoints](#endpoints)
   - [POST /assignments/auto-assign](#post-assignmentsauto-assign)
   - [POST /assignments/manual-override](#post-assignmentsmanual-override)
   - [GET /assignments/queue](#get-assignmentsqueue)
   - [GET /assignments/my-assignments](#get-assignmentsmy-assignments)
   - [POST /assignments/{id}/escalate](#post-assignmentsidescalate)
   - [GET /capacity/check](#get-capacitycheck)
   - [PUT /staff/availability](#put-staffavailability)
3. [Data Models](#data-models)
4. [Weighted Scoring Algorithm](#weighted-scoring-algorithm)
5. [SLA Matrix](#sla-matrix)
6. [Error Codes](#error-codes)

---

## Authentication

All endpoints require authentication using a Supabase JWT token in the `Authorization` header:

```http
Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN
```

### Role Requirements

| Endpoint | Required Role |
|----------|---------------|
| `/assignments/auto-assign` | Any authenticated user |
| `/assignments/manual-override` | `supervisor` or `admin` |
| `/assignments/queue` | `supervisor` or `admin` |
| `/assignments/my-assignments` | Any authenticated user |
| `/assignments/{id}/escalate` | Assignee, supervisor, or admin |
| `/capacity/check` | User (own capacity), supervisor (unit), admin (all) |
| `/staff/availability` | User (own), supervisor (team), admin (all) |

---

## Endpoints

### POST /assignments/auto-assign

Automatically assigns a work item to the best available staff member based on weighted scoring.

**Endpoint**: `POST /assignments/auto-assign`

**Request Body**:
```json
{
  "work_item_id": "ticket-001",
  "work_item_type": "ticket",
  "required_skills": ["skill-arabic", "skill-writing"],
  "priority": "urgent",
  "target_unit_id": "unit-translation" // Optional
}
```

**Request Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `work_item_id` | string | Yes | Unique identifier of the work item |
| `work_item_type` | enum | Yes | `dossier`, `ticket`, `position`, or `task` |
| `required_skills` | array | Yes | Array of skill IDs required for this work item |
| `priority` | enum | Yes | `urgent`, `high`, `normal`, or `low` |
| `target_unit_id` | string | No | Preferred organizational unit (awards bonus points) |

**Success Response** (200 OK):
```json
{
  "assignment_id": "assign-123",
  "assignee_id": "staff-456",
  "assignee_name": "Ahmed Al-Zahrani",
  "assigned_at": "2025-10-02T10:00:00Z",
  "sla_deadline": "2025-10-02T12:00:00Z",
  "time_remaining_seconds": 7200,
  "priority": "urgent",
  "status": "assigned",
  "score": 94
}
```

**Queued Response** (202 Accepted):
```json
{
  "queued": true,
  "queue_id": "queue-789",
  "queue_position": 3,
  "queued_at": "2025-10-02T10:00:00Z",
  "reason": "All staff at WIP limit",
  "estimated_wait_minutes": 15
}
```

**Error Responses**:
- `400 Bad Request`: Invalid request body or missing required skills
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Work item not found
- `429 Too Many Requests`: Rate limit exceeded (100 req/min per user)

**Example cURL**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/assignments/auto-assign \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "work_item_id": "ticket-001",
    "work_item_type": "ticket",
    "required_skills": ["skill-arabic"],
    "priority": "urgent"
  }'
```

---

### POST /assignments/manual-override

Manually assign a work item to a specific staff member, bypassing auto-assignment logic.

**Endpoint**: `POST /assignments/manual-override`

**Request Body**:
```json
{
  "work_item_id": "ticket-002",
  "work_item_type": "ticket",
  "assignee_id": "staff-789",
  "override_reason": "Subject matter expert required",
  "priority": "high"
}
```

**Request Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `work_item_id` | string | Yes | Unique identifier of the work item |
| `work_item_type` | enum | Yes | `dossier`, `ticket`, `position`, or `task` |
| `assignee_id` | string | Yes | Staff member user_id to assign to |
| `override_reason` | string | Yes | Justification for manual override (min 10 chars) |
| `priority` | enum | Yes | `urgent`, `high`, `normal`, or `low` |

**Success Response** (200 OK):
```json
{
  "assignment_id": "assign-124",
  "assignee_id": "staff-789",
  "assignee_name": "Fatima Al-Rashid",
  "assigned_at": "2025-10-02T10:05:00Z",
  "sla_deadline": "2025-10-03T10:05:00Z",
  "override_by": "supervisor-001",
  "override_reason": "Subject matter expert required",
  "capacity_warning": "Assignee at 5/5 WIP limit"
}
```

**Notes**:
- Bypasses WIP limit checks (per FR-007c) but logs capacity warning
- Creates audit trail entry with override reason
- Only supervisors can override for their unit; admins can override for all units

**Error Responses**:
- `400 Bad Request`: Invalid assignee_id or missing override_reason
- `403 Forbidden`: Insufficient permissions (not supervisor or admin)
- `404 Not Found`: Work item or assignee not found

---

### GET /assignments/queue

Retrieve queued work items awaiting capacity, sorted by priority and creation time.

**Endpoint**: `GET /assignments/queue`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `priority` | enum | No | Filter by priority: `urgent`, `high`, `normal`, `low` |
| `work_item_type` | enum | No | Filter by type: `dossier`, `ticket`, `position`, `task` |
| `unit_id` | string | No | Filter by organizational unit |
| `page` | integer | No | Page number (1-indexed, default: 1) |
| `page_size` | integer | No | Items per page (default: 50, max: 100) |

**Success Response** (200 OK):
```json
{
  "items": [
    {
      "queue_id": "queue-001",
      "work_item_id": "ticket-003",
      "work_item_type": "ticket",
      "required_skills": ["skill-arabic"],
      "priority": "urgent",
      "queue_position": 1,
      "queued_at": "2025-10-02T09:55:00Z",
      "attempts": 2,
      "last_attempt_at": "2025-10-02T10:00:00Z",
      "notes": "All staff at WIP limit"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total_items": 15,
    "total_pages": 1
  }
}
```

**Error Responses**:
- `403 Forbidden`: Non-supervisor/admin trying to view queue
- `400 Bad Request`: Invalid query parameters

**Example cURL**:
```bash
curl "https://your-project.supabase.co/functions/v1/assignments/queue?priority=urgent&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### GET /assignments/my-assignments

Retrieve all assignments for the authenticated user with real-time SLA countdowns.

**Endpoint**: `GET /assignments/my-assignments`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | enum | No | Filter by status: `assigned`, `in_progress`, `completed`, `cancelled` |
| `include_completed` | boolean | No | Include completed assignments (default: false) |

**Success Response** (200 OK):
```json
{
  "assignments": [
    {
      "assignment_id": "assign-123",
      "work_item_id": "ticket-001",
      "work_item_type": "ticket",
      "work_item_title": "Translate Annual Report",
      "assigned_at": "2025-10-02T10:00:00Z",
      "sla_deadline": "2025-10-02T12:00:00Z",
      "time_remaining_seconds": 5400,
      "sla_status": "ok",
      "priority": "urgent",
      "status": "assigned",
      "escalated": false
    },
    {
      "assignment_id": "assign-124",
      "work_item_id": "dossier-002",
      "work_item_type": "dossier",
      "work_item_title": "EU Trade Agreement",
      "assigned_at": "2025-10-01T14:00:00Z",
      "sla_deadline": "2025-10-02T14:00:00Z",
      "time_remaining_seconds": 1800,
      "sla_status": "warning",
      "priority": "high",
      "status": "in_progress",
      "escalated": false
    }
  ],
  "summary": {
    "total_assignments": 2,
    "assigned": 1,
    "in_progress": 1,
    "at_risk": 1,
    "breached": 0
  }
}
```

**SLA Status**:
- `ok`: <75% of SLA elapsed (green)
- `warning`: 75-100% of SLA elapsed (yellow)
- `breached`: >100% of SLA elapsed (red)

**Real-time Updates**:
- Subscribe to Supabase Realtime channel `assignment-updates` for live SLA status changes
- Client-side countdown calculated from `sla_deadline` timestamp

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token

---

### POST /assignments/{id}/escalate

Escalate an assignment that has breached SLA or requires management attention.

**Endpoint**: `POST /assignments/{id}/escalate`

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Assignment ID to escalate |

**Request Body**:
```json
{
  "reason": "sla_breach",
  "notes": "Client requested urgent update"
}
```

**Request Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | enum | Yes | `sla_breach`, `manual`, or `capacity_exhaustion` |
| `notes` | string | No | Additional context for escalation |

**Success Response** (200 OK):
```json
{
  "escalation_id": "esc-001",
  "assignment_id": "assign-123",
  "escalated_from_id": "staff-456",
  "escalated_to_id": "supervisor-001",
  "escalated_to_name": "Omar Al-Sayed",
  "reason": "sla_breach",
  "escalated_at": "2025-10-02T12:05:00Z",
  "notifications_sent": [
    {
      "recipient_id": "staff-456",
      "type": "escalation_assignee",
      "sent_at": "2025-10-02T12:05:01Z"
    },
    {
      "recipient_id": "supervisor-001",
      "type": "escalation_recipient",
      "sent_at": "2025-10-02T12:05:01Z"
    }
  ]
}
```

**Error Responses**:
- `404 Not Found`: Assignment not found
- `403 Forbidden`: User not authorized to escalate this assignment
- `409 Conflict`: Assignment already escalated

---

### GET /capacity/check

Check current capacity utilization for a staff member or organizational unit.

**Endpoint**: `GET /capacity/check`

**Query Parameters** (one required):
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `staff_id` | string | No* | Check individual staff member capacity |
| `unit_id` | string | No* | Check organizational unit capacity |

*Exactly one of `staff_id` or `unit_id` must be provided.

**Success Response (Individual)** (200 OK):
```json
{
  "type": "individual",
  "staff_id": "staff-456",
  "staff_name": "Ahmed Al-Zahrani",
  "current_count": 3,
  "limit": 5,
  "utilization_pct": 60.0,
  "status": "available",
  "breakdown": {
    "assigned": 1,
    "in_progress": 2,
    "completed_today": 2
  }
}
```

**Success Response (Unit)** (200 OK):
```json
{
  "type": "unit",
  "unit_id": "unit-translation",
  "unit_name": "Translation Department",
  "current_count": 18,
  "limit": 20,
  "utilization_pct": 90.0,
  "status": "at_capacity",
  "staff_count": 4,
  "breakdown": {
    "available_staff": 1,
    "staff_at_limit": 3,
    "total_capacity": 20,
    "used_capacity": 18
  }
}
```

**Status Values**:
- `available`: <75% utilization
- `high_utilization`: 75-90% utilization
- `at_capacity`: 90-100% utilization
- `over_capacity`: >100% utilization (manual overrides)

**Error Responses**:
- `400 Bad Request`: Neither or both of `staff_id` and `unit_id` provided
- `403 Forbidden`: Unauthorized capacity check (non-supervisor checking unit)
- `404 Not Found`: Staff member or unit not found

---

### PUT /staff/availability

Update staff availability status and trigger reassignment workflow if going on leave.

**Endpoint**: `PUT /staff/availability`

**Request Body**:
```json
{
  "staff_id": "staff-456",
  "status": "on_leave",
  "unavailable_until": "2025-10-15T00:00:00Z",
  "reason": "Annual leave"
}
```

**Request Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `staff_id` | string | Yes* | Staff member user_id (omit to update own status) |
| `status` | enum | Yes | `available`, `on_leave`, or `unavailable` |
| `unavailable_until` | string (ISO 8601) | No | When availability returns (required if not `available`) |
| `reason` | string | No | Reason for unavailability |

*Supervisors and admins can update team members; users can update their own status.

**Success Response** (200 OK):
```json
{
  "updated": true,
  "staff_id": "staff-456",
  "status": "on_leave",
  "unavailable_until": "2025-10-15T00:00:00Z",
  "reassigned_items": [
    {
      "assignment_id": "assign-123",
      "work_item_id": "ticket-001",
      "priority": "urgent",
      "new_assignee_id": "staff-789",
      "new_assignee_name": "Fatima Al-Rashid",
      "reassigned_at": "2025-10-02T10:10:00Z"
    }
  ],
  "flagged_for_review": [
    {
      "assignment_id": "assign-125",
      "work_item_id": "ticket-003",
      "priority": "normal",
      "reason": "Awaiting supervisor manual reassignment"
    }
  ],
  "notifications_sent": [
    {
      "recipient_id": "supervisor-001",
      "type": "staff_leave_items_for_review",
      "item_count": 1
    }
  ]
}
```

**Reassignment Rules**:
- **Urgent and High priority items**: Automatically reassigned to available staff with matching skills
- **Normal and Low priority items**: Flagged for manual review by supervisor
- Supervisor receives notification with list of items needing review

**Error Responses**:
- `400 Bad Request`: Invalid status or missing unavailable_until when required
- `403 Forbidden`: User trying to update another user's availability without permissions
- `404 Not Found`: Staff member not found

---

## Data Models

### Assignment

```typescript
interface Assignment {
  id: string;
  work_item_id: string;
  work_item_type: 'dossier' | 'ticket' | 'position' | 'task';
  assignee_id: string;
  assigned_at: string; // ISO 8601
  assigned_by: string | null; // null if auto-assigned
  sla_deadline: string; // ISO 8601
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  warning_sent_at: string | null;
  escalated_at: string | null;
  escalation_recipient_id: string | null;
  completed_at: string | null;
}
```

### Queue Entry

```typescript
interface QueueEntry {
  id: string;
  work_item_id: string;
  work_item_type: 'dossier' | 'ticket' | 'position' | 'task';
  required_skills: string[];
  target_unit_id: string | null;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  created_at: string;
  attempts: number;
  last_attempt_at: string | null;
  notes: string | null;
}
```

### Staff Profile

```typescript
interface StaffProfile {
  id: string;
  user_id: string;
  unit_id: string;
  skills: string[];
  individual_wip_limit: number;
  current_assignment_count: number;
  availability_status: 'available' | 'on_leave' | 'unavailable';
  unavailable_until: string | null;
  unavailable_reason: string | null;
  escalation_chain_id: string | null;
  role: 'staff' | 'supervisor' | 'admin';
}
```

---

## Weighted Scoring Algorithm

The auto-assignment algorithm scores each eligible staff member based on four weighted criteria:

### Scoring Formula

```
Total Score (0-100) =
  (Skill Match × 40) +
  (Available Capacity × 30) +
  (Availability Status × 20) +
  (Unit Match × 10)
```

### Component Breakdown

**1. Skill Match (0-40 points)**
```
skill_score = (matched_skills / required_skills) × 40
```
- Example: Staff has 2 of 2 required skills → 40 points
- Example: Staff has 1 of 2 required skills → 20 points
- Example: Staff has 0 of 2 required skills → 0 points

**2. Available Capacity (0-30 points)**
```
capacity_score = (1 - (current_count / wip_limit)) × 30
```
- Example: Staff at 0/5 assignments → 30 points (100% available)
- Example: Staff at 3/5 assignments → 12 points (40% available)
- Example: Staff at 5/5 assignments → 0 points (at limit)

**3. Availability Status (0-20 points or DISQUALIFY)**
- `available` → 20 points
- `unavailable` → DISQUALIFY (-1 score, filtered out)
- `on_leave` → DISQUALIFY (-1 score, filtered out)

**4. Unit Match (0-10 points)**
- Staff in target unit → 10 points
- Staff in different unit → 0 points
- No target unit specified → 0 points (all units equal)

### Example Calculation

**Scenario**: Urgent ticket requiring `skill-arabic` and `skill-writing`, target unit `unit-translation`.

**Staff A**:
- Skills: `[skill-arabic, skill-writing]` → 40 points (perfect match)
- Capacity: 2/5 assignments → (1 - 2/5) × 30 = 18 points
- Availability: `available` → 20 points
- Unit: `unit-translation` → 10 points
- **Total: 88 points**

**Staff B**:
- Skills: `[skill-arabic]` → 20 points (50% match)
- Capacity: 0/5 assignments → (1 - 0/5) × 30 = 30 points
- Availability: `available` → 20 points
- Unit: `unit-analysis` (different) → 0 points
- **Total: 70 points**

**Winner**: Staff A (higher score) receives the assignment.

---

## SLA Matrix

SLA deadlines are calculated based on work item type and priority:

| Work Item Type | Urgent | High | Normal | Low |
|----------------|--------|------|--------|-----|
| **Dossier** | 8 hours | 24 hours | 48 hours | 120 hours (5 days) |
| **Ticket** | 2 hours | 24 hours | 48 hours | 120 hours (5 days) |
| **Position** | 4 hours | 24 hours | 48 hours | 120 hours (5 days) |
| **Task** | 4 hours | 24 hours | 48 hours | 120 hours (5 days) |

### SLA Thresholds

- **OK** (<75% elapsed): Assignment progressing normally (green indicator)
- **Warning** (75-100% elapsed): Assignment at risk, warning notification sent (yellow indicator)
- **Breached** (>100% elapsed): Deadline passed, automatic escalation triggered (red indicator)

### Deadline Calculation

```typescript
sla_deadline = assigned_at + deadline_hours
```

Example:
- Ticket assigned at `2025-10-02T10:00:00Z`
- Priority: `urgent` (2 hours)
- Deadline: `2025-10-02T12:00:00Z`

---

## Queue Processing Behavior

### Processing Rules

1. **Triggered by**: Assignment completion or cancellation (capacity freed)
2. **Debouncing**: Waits 5 seconds for multiple capacity changes
3. **Sorting**: Priority DESC, then created_at ASC (FIFO within priority)
4. **Skill Matching**: Only processes items requiring freed skills
5. **Batch Size**: Processes up to 10 items per invocation
6. **Fallback**: pg_cron checks queue every 60 seconds for missed items

### Priority Order

```
Urgent → High → Normal → Low
```

Within same priority, oldest items processed first (FIFO).

### Example Scenario

**Queue State**:
1. Ticket A (urgent, queued 10:00)
2. Ticket B (high, queued 09:50)
3. Ticket C (urgent, queued 10:05)
4. Ticket D (normal, queued 09:45)

**Processing Order**:
1. Ticket A (urgent, oldest urgent)
2. Ticket C (urgent, newer urgent)
3. Ticket B (high)
4. Ticket D (normal)

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 202 | Accepted | Work item queued (capacity exhausted) |
| 400 | Bad Request | Invalid request body or parameters |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource state conflict (e.g., already escalated) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error, contact support |

### Error Response Format

```json
{
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Only supervisors can override assignments in their unit",
    "details": {
      "required_role": "supervisor",
      "user_role": "staff"
    }
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST_BODY` | Request body validation failed |
| `INSUFFICIENT_PERMISSIONS` | User lacks required role |
| `RESOURCE_NOT_FOUND` | Work item, assignment, or staff member not found |
| `ALREADY_ASSIGNED` | Work item already has active assignment |
| `ALREADY_ESCALATED` | Assignment already escalated |
| `RATE_LIMIT_EXCEEDED` | Too many requests (100/min limit) |
| `WIP_LIMIT_EXCEEDED` | Cannot assign (at capacity) - item will be queued |

---

## Rate Limiting

- **Global limit**: 100 requests per minute per user
- **Endpoint-specific limits**:
  - `/assignments/auto-assign`: 50 requests per minute
  - All other endpoints: 100 requests per minute

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1696248360
```

---

## Changelog

### Version 1.0.0 (2025-10-02)
- Initial release with 7 endpoints
- Weighted auto-assignment algorithm
- WIP limit enforcement
- SLA tracking and escalation
- Priority-based queueing
- Leave management with reassignment

---

## Support

For API support or to report issues:
- **Email**: api-support@gastat.gov.sa
- **Documentation**: https://docs.gastat.gov.sa/assignment-api
- **Supabase Dashboard**: https://your-project.supabase.co

---

**Last Updated**: 2025-10-02
**API Version**: 1.0.0
