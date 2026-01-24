# System Administration API

## Overview

The System Administration API provides audit logging, compliance reporting, webhook management, field history tracking, and system utilities. All endpoints require elevated permissions and support comprehensive audit trails.

## Endpoints

### Audit Logs Viewer

View system audit logs with advanced filtering.

**Endpoint:** `GET /audit-logs-viewer`

**Query Parameters:**
- `user_id` (optional): Filter by user
- `action` (optional): Filter by action (`create`, `update`, `delete`, `approve`, `publish`)
- `entity_type` (optional): Filter by entity type
- `entity_id` (optional): Filter by specific entity
- `date_from` (optional): Start date for log range
- `date_to` (optional): End date for log range
- `severity` (optional): Filter by severity (`low`, `medium`, `high`, `critical`)
- `ip_address` (optional): Filter by IP address
- `limit` (optional): Page size (default: 50, max: 500)
- `offset` (optional): Page offset

**Response (200 OK):**
```json
{
  "logs": [
    {
      "log_id": "log-uuid",
      "timestamp": "2024-01-15T10:30:00Z",
      "user_id": "user-uuid",
      "user_email": "user@example.com",
      "user_name": "John Doe",
      "action": "update",
      "entity_type": "position",
      "entity_id": "pos-uuid",
      "entity_title": "Climate Policy Framework",
      "changes": {
        "status": {
          "old": "draft",
          "new": "published"
        }
      },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "severity": "medium",
      "metadata": {
        "reason": "Final approval received",
        "approver_id": "manager-uuid"
      }
    }
  ],
  "total": 15234,
  "limit": 50,
  "offset": 0,
  "has_more": true
}
```

**Error Responses:**
- `400 Bad Request` - Invalid query parameters or date range
  ```json
  {
    "error": "Invalid date range. date_from must be before date_to",
    "error_ar": "نطاق تاريخ غير صالح"
  }
  ```
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to view audit logs (requires admin or auditor role)
- `500 Internal Server Error` - Query failed

**Implementation Example:**
```typescript
const getAuditLogs = async (filters?: {
  userId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.userId) params.append('user_id', filters.userId);
  if (filters?.action) params.append('action', filters.action);
  if (filters?.dateFrom) params.append('date_from', filters.dateFrom);
  if (filters?.dateTo) params.append('date_to', filters.dateTo);

  const response = await fetch(`/audit-logs-viewer?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_ar || error.error);
  }

  return await response.json();
};
```

**Notes:**
- All write operations (create, update, delete) automatically logged
- Approval workflows logged with approver details
- Login/logout events logged
- Failed authentication attempts logged with severity `high`
- Logs retained for 7 years (2555 days) per compliance requirements
- Export available via Data Export API

---

### Compliance

Generate compliance reports and check compliance status.

**Endpoint:** `GET /compliance?report_type={type}&period={period}`

**Query Parameters:**
- `report_type` (required): Report type (`access_certification`, `data_retention`, `security_incidents`, `user_activity`)
- `period` (optional): Time period (default: `30d`)
- `format` (optional): Output format (`json`, `pdf`, `xlsx`)

**Response (200 OK - access_certification report):**
```json
{
  "report_type": "access_certification",
  "period": "90d",
  "generated_at": "2024-01-15T10:30:00Z",
  "summary": {
    "total_users": 245,
    "users_reviewed": 220,
    "users_pending_review": 25,
    "access_changes": 45,
    "permissions_revoked": 12,
    "compliance_rate": 89.8
  },
  "findings": [
    {
      "severity": "medium",
      "finding_en": "25 users have not been reviewed in over 90 days",
      "finding_ar": "لم تتم مراجعة 25 مستخدمًا منذ أكثر من 90 يومًا",
      "recommendation_en": "Schedule access review for pending users",
      "recommendation_ar": "جدولة مراجعة الوصول للمستخدمين المعلقين",
      "affected_users": ["user-uuid-1", "user-uuid-2"]
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "recommendation_en": "Implement quarterly access reviews",
      "recommendation_ar": "تنفيذ مراجعات وصول ربع سنوية"
    }
  ],
  "export_url": null
}
```

**Response (200 OK - security_incidents report):**
```json
{
  "report_type": "security_incidents",
  "period": "30d",
  "summary": {
    "total_incidents": 8,
    "by_severity": {
      "critical": 0,
      "high": 2,
      "medium": 4,
      "low": 2
    },
    "by_category": {
      "failed_login": 5,
      "unauthorized_access_attempt": 2,
      "suspicious_activity": 1
    },
    "resolved": 6,
    "pending": 2
  },
  "incidents": [
    {
      "incident_id": "inc-uuid",
      "timestamp": "2024-01-12T14:30:00Z",
      "severity": "high",
      "category": "unauthorized_access_attempt",
      "description_en": "Multiple failed attempts to access restricted position",
      "description_ar": "محاولات متعددة فاشلة للوصول إلى موقف محظور",
      "user_id": "user-uuid",
      "ip_address": "192.168.1.100",
      "status": "resolved",
      "resolution": "User account temporarily suspended, investigation completed"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Invalid report_type
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (requires admin or compliance officer role)
- `500 Internal Server Error` - Report generation failed

**Supported Report Types:**
- `access_certification` - User access review status
- `data_retention` - Data retention policy compliance
- `security_incidents` - Security incidents and resolutions
- `user_activity` - User activity patterns and anomalies

---

### Webhooks

Manage outbound webhooks for event notifications.

**Endpoint:** `GET /webhooks` or `POST /webhooks`

**List Webhooks:**
```http
GET /webhooks
```

**Response (200 OK):**
```json
{
  "webhooks": [
    {
      "webhook_id": "webhook-uuid",
      "name": "Slack Notifications",
      "url": "https://hooks.slack.com/services/...",
      "events": ["position.published", "assignment.completed", "intake_ticket.created"],
      "active": true,
      "created_at": "2023-06-15T10:00:00Z",
      "last_triggered": "2024-01-15T09:45:00Z",
      "delivery_success_rate": 98.5,
      "retry_policy": "exponential_backoff"
    }
  ],
  "total": 5
}
```

**Create Webhook:**

**Request Body:**
```json
{
  "name": "External System Integration",
  "url": "https://api.external-system.com/webhooks",
  "events": ["position.published", "dossier.created"],
  "secret": "webhook-secret-key",
  "headers": {
    "Authorization": "Bearer external-api-key"
  },
  "active": true,
  "retry_policy": "exponential_backoff",
  "max_retries": 3
}
```

**Response (201 Created):**
```json
{
  "webhook_id": "webhook-uuid",
  "name": "External System Integration",
  "created_at": "2024-01-15T10:30:00Z",
  "signing_secret": "whsec_...",
  "test_delivery_sent": true
}
```

**Update Webhook (PUT /webhooks/{id}):**

**Request Body:**
```json
{
  "active": false,
  "events": ["position.published"]
}
```

**Delete Webhook (DELETE /webhooks/{id}):**

**Response (200 OK):**
```json
{
  "deleted": true,
  "webhook_id": "webhook-uuid"
}
```

---

### Webhook Delivery

View webhook delivery logs and retry failed deliveries.

**Endpoint:** `GET /webhook-delivery?webhook_id={id}`

**Query Parameters:**
- `webhook_id` (required): Webhook ID
- `status` (optional): Filter by status (`success`, `failed`, `pending`)
- `limit` (optional): Page size (default: 50)
- `offset` (optional): Page offset

**Response (200 OK):**
```json
{
  "deliveries": [
    {
      "delivery_id": "delivery-uuid",
      "webhook_id": "webhook-uuid",
      "event": "position.published",
      "payload": {
        "event": "position.published",
        "position_id": "pos-uuid",
        "timestamp": "2024-01-15T10:30:00Z"
      },
      "status": "success",
      "http_status": 200,
      "response_time_ms": 145,
      "attempt_count": 1,
      "delivered_at": "2024-01-15T10:30:00Z"
    },
    {
      "delivery_id": "delivery-uuid-2",
      "webhook_id": "webhook-uuid",
      "event": "assignment.completed",
      "status": "failed",
      "http_status": 500,
      "error_message": "Internal Server Error",
      "attempt_count": 3,
      "next_retry_at": "2024-01-15T11:00:00Z",
      "last_attempt_at": "2024-01-15T10:45:00Z"
    }
  ],
  "total": 1234,
  "success_rate": 98.5
}
```

**Retry Failed Delivery:**

**Endpoint:** `POST /webhook-delivery/retry`

**Request Body:**
```json
{
  "delivery_id": "delivery-uuid"
}
```

**Response (200 OK):**
```json
{
  "retried": true,
  "delivery_id": "delivery-uuid",
  "status": "pending"
}
```

---

### Field History

Track field-level change history for auditing.

**Endpoint:** `GET /field-history?entity_type={type}&entity_id={id}`

**Query Parameters:**
- `entity_type` (required): Entity type (e.g., `position`, `dossier`)
- `entity_id` (required): Entity ID
- `field_name` (optional): Specific field to track
- `limit` (optional): Page size (default: 50)

**Response (200 OK):**
```json
{
  "entity_type": "position",
  "entity_id": "pos-uuid",
  "history": [
    {
      "history_id": "history-uuid",
      "field_name": "status",
      "old_value": "draft",
      "new_value": "published",
      "changed_at": "2024-01-15T10:30:00Z",
      "changed_by": "user-uuid",
      "changed_by_name": "John Doe",
      "reason": "Final approval received"
    },
    {
      "history_id": "history-uuid-2",
      "field_name": "title_en",
      "old_value": "Climate Policy",
      "new_value": "Climate Policy Framework",
      "changed_at": "2024-01-14T15:20:00Z",
      "changed_by": "user-uuid",
      "changed_by_name": "Jane Smith",
      "reason": "Title clarification"
    }
  ],
  "total": 45
}
```

**Error Responses:**
- `400 Bad Request` - Invalid entity_type or entity_id
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to view field history
- `404 Not Found` - Entity not found
- `500 Internal Server Error` - Query failed

**Notes:**
- Tracked fields configurable per entity type
- Default: status, title, content, metadata fields
- Retention: 7 years (2555 days)
- Supports rollback to previous values (requires admin approval)

---

## Webhook Events

**Available Events:**
- `position.created`, `position.updated`, `position.published`, `position.deleted`
- `dossier.created`, `dossier.updated`, `dossier.archived`
- `assignment.created`, `assignment.completed`, `assignment.escalated`
- `intake_ticket.created`, `intake_ticket.assigned`, `intake_ticket.resolved`
- `after_action.created`, `after_action.published`
- `commitment.status_changed`, `commitment.overdue`
- `mou.expiring_soon`, `mou.renewed`
- `user.created`, `user.deactivated`, `user.role_changed`

**Webhook Payload Format:**
```json
{
  "event": "position.published",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "position_id": "pos-uuid",
    "title_en": "Climate Policy Framework",
    "status": "published",
    "published_by": "user-uuid"
  },
  "signature": "sha256=..."
}
```

## Compliance Standards

The system supports the following compliance frameworks:
- **GDPR**: Data retention, right to be forgotten, audit trails
- **ISO 27001**: Information security management
- **SOC 2 Type II**: Security, availability, confidentiality

## Related APIs

- [Security & Access](./security-access.md) - Access control and permissions
- [Data Management](./data-management.md) - Data retention policies
- [User Management](./user-management.md) - User lifecycle management
