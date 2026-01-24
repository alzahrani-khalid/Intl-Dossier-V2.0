# Security & Access Control API

## Overview

The Security & Access Control API manages access requests, permission delegation, field-level security, and access certification workflows. All endpoints enforce Row-Level Security (RLS) and support bilingual error messages.

## Endpoints

### Create Access Request

Submit an access request for additional permissions.

**Endpoint:** `POST /access-requests`

**Request Body:**
```json
{
  "requested_role": "analyst",
  "requested_permissions": ["positions:read", "dossiers:write"],
  "justification_en": "Need access for policy analysis",
  "justification_ar": "الحاجة إلى الوصول لتحليل السياسات",
  "duration_days": 90
}
```

**Response (201 Created):**
```json
{
  "request_id": "req-uuid",
  "user_id": "user-uuid",
  "requested_role": "analyst",
  "requested_permissions": ["positions:read", "dossiers:write"],
  "status": "pending",
  "created_at": "2024-01-15T10:30:00Z",
  "expires_at": "2024-04-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid role or permissions
  ```json
  {
    "error": "Invalid permission format",
    "error_ar": "تنسيق الإذن غير صالح"
  }
  ```
- `401 Unauthorized` - Not authenticated
- `409 Conflict` - Existing pending request
- `500 Internal Server Error` - Request creation failed

**Implementation Example:**
```typescript
const requestAccess = async (
  role: string,
  permissions: string[],
  justification: { en: string; ar: string },
  durationDays: number
) => {
  const response = await fetch('/access-requests', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requested_role: role,
      requested_permissions: permissions,
      justification_en: justification.en,
      justification_ar: justification.ar,
      duration_days: durationDays
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

### User Permissions

Retrieve current user's permissions.

**Endpoint:** `GET /user-permissions`

**Response (200 OK):**
```json
{
  "user_id": "user-uuid",
  "role": "analyst",
  "permissions": [
    "positions:read",
    "dossiers:read",
    "dossiers:write",
    "intake:read"
  ],
  "delegated_permissions": [
    {
      "permission": "positions:approve",
      "delegated_by": "manager-uuid",
      "expires_at": "2024-02-15T10:30:00Z"
    }
  ],
  "temporary_elevations": []
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Failed to retrieve permissions

---

### Delegate Permissions

Delegate permissions to another user temporarily.

**Endpoint:** `POST /delegate-permissions`

**Request Body:**
```json
{
  "delegate_to_user_id": "user-uuid",
  "permissions": ["positions:approve", "assignments:delegate"],
  "duration_hours": 72,
  "reason_en": "Covering during vacation",
  "reason_ar": "التغطية خلال الإجازة"
}
```

**Response (200 OK):**
```json
{
  "delegation_id": "del-uuid",
  "delegate_from_user_id": "manager-uuid",
  "delegate_to_user_id": "user-uuid",
  "permissions": ["positions:approve", "assignments:delegate"],
  "created_at": "2024-01-15T10:30:00Z",
  "expires_at": "2024-01-18T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid user_id or permissions user doesn't have
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Cannot delegate permissions you don't possess
- `500 Internal Server Error` - Delegation failed

---

### Validate Delegation

Check if a delegation is valid and active.

**Endpoint:** `POST /validate-delegation`

**Request Body:**
```json
{
  "delegation_id": "del-uuid",
  "permission": "positions:approve"
}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "delegation_id": "del-uuid",
  "delegate_to_user_id": "user-uuid",
  "permission": "positions:approve",
  "expires_at": "2024-01-18T10:30:00Z",
  "remaining_hours": 48
}
```

**Error Responses:**
- `400 Bad Request` - Missing delegation_id or permission
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Delegation not found or expired

---

### Revoke Delegation

Revoke an active delegation.

**Endpoint:** `POST /revoke-delegation`

**Request Body:**
```json
{
  "delegation_id": "del-uuid"
}
```

**Response (200 OK):**
```json
{
  "revoked": true,
  "delegation_id": "del-uuid",
  "message": "Delegation revoked successfully",
  "message_ar": "تم إلغاء التفويض بنجاح"
}
```

**Error Responses:**
- `400 Bad Request` - Missing delegation_id
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to revoke (not delegator or admin)
- `404 Not Found` - Delegation not found

---

### My Delegations

List delegations created by or granted to current user.

**Endpoint:** `GET /my-delegations?type={given|received}`

**Query Parameters:**
- `type` (optional): Filter by `given` (created by user) or `received` (granted to user)

**Response (200 OK):**
```json
{
  "delegations": [
    {
      "delegation_id": "del-uuid",
      "delegate_from_user_id": "manager-uuid",
      "delegate_to_user_id": "user-uuid",
      "permissions": ["positions:approve"],
      "created_at": "2024-01-15T10:30:00Z",
      "expires_at": "2024-01-18T10:30:00Z",
      "status": "active"
    }
  ],
  "total": 5
}
```

---

### Field Permissions

Get field-level permissions for an entity type.

**Endpoint:** `GET /field-permissions?entity_type={type}`

**Query Parameters:**
- `entity_type` (required): Entity type (e.g., `position`, `dossier`, `intake_ticket`)

**Response (200 OK):**
```json
{
  "entity_type": "position",
  "fields": {
    "title_en": { "read": true, "write": true },
    "title_ar": { "read": true, "write": true },
    "content_en": { "read": true, "write": false },
    "rationale_en": { "read": false, "write": false },
    "status": { "read": true, "write": false }
  }
}
```

---

### Generate Access Review

Generate access certification review for users.

**Endpoint:** `POST /generate-access-review`

**Request Body:**
```json
{
  "review_scope": "department",
  "department_id": "dept-uuid",
  "review_period_days": 90
}
```

**Response (200 OK):**
```json
{
  "review_id": "review-uuid",
  "scope": "department",
  "users_count": 45,
  "permissions_count": 230,
  "created_at": "2024-01-15T10:30:00Z",
  "due_date": "2024-02-15T10:30:00Z"
}
```

---

### Schedule Access Review

Schedule periodic access reviews.

**Endpoint:** `POST /schedule-access-review`

**Request Body:**
```json
{
  "review_name": "Quarterly Department Review",
  "scope": "department",
  "department_id": "dept-uuid",
  "frequency": "quarterly",
  "reviewers": ["manager-uuid-1", "manager-uuid-2"]
}
```

**Response (200 OK):**
```json
{
  "schedule_id": "schedule-uuid",
  "review_name": "Quarterly Department Review",
  "next_review_date": "2024-04-01T00:00:00Z"
}
```

---

### Access Review Detail

Get details of an access review.

**Endpoint:** `GET /access-review-detail?review_id={id}`

**Response (200 OK):**
```json
{
  "review_id": "review-uuid",
  "status": "in_progress",
  "users": [
    {
      "user_id": "user-uuid",
      "user_name": "John Doe",
      "role": "analyst",
      "permissions": ["positions:read", "dossiers:write"],
      "certified": false,
      "last_activity": "2024-01-10T15:30:00Z"
    }
  ],
  "progress": {
    "total_users": 45,
    "certified": 20,
    "pending": 25
  }
}
```

---

### Certify User Access

Certify a user's access during review.

**Endpoint:** `POST /certify-user-access`

**Request Body:**
```json
{
  "review_id": "review-uuid",
  "user_id": "user-uuid",
  "action": "approve",
  "comments": "Access appropriate for role"
}
```

**Response (200 OK):**
```json
{
  "certified": true,
  "user_id": "user-uuid",
  "action": "approve",
  "certified_by": "manager-uuid",
  "certified_at": "2024-01-15T10:30:00Z"
}
```

---

### Complete Access Review

Mark an access review as complete.

**Endpoint:** `POST /complete-access-review`

**Request Body:**
```json
{
  "review_id": "review-uuid",
  "summary_notes": "All users certified, 3 permissions revoked"
}
```

**Response (200 OK):**
```json
{
  "completed": true,
  "review_id": "review-uuid",
  "completed_at": "2024-01-15T10:30:00Z",
  "summary": {
    "total_users": 45,
    "approved": 42,
    "revoked": 3,
    "modified": 5
  }
}
```

---

## Permission Format

Permissions follow the format: `{resource}:{action}`

**Resources:**
- `positions`, `dossiers`, `intake`, `assignments`, `after_actions`, `documents`, `users`

**Actions:**
- `read`, `write`, `create`, `delete`, `approve`, `publish`, `delegate`

**Examples:**
- `positions:read` - Read positions
- `positions:approve` - Approve positions
- `dossiers:write` - Edit dossiers
- `users:create` - Create users (admin only)

## Security Best Practices

1. **Principle of Least Privilege**: Grant minimum permissions needed
2. **Time-Limited Delegations**: Always set expiration on delegations
3. **Regular Reviews**: Conduct access reviews quarterly
4. **Audit Trail**: All permission changes logged in audit_logs
5. **Role-Based Access**: Assign roles, not individual permissions

## Related APIs

- [Authentication](./authentication.md) - User authentication
- [User Management](./user-management.md) - Role assignment
- [Administration](./administration.md) - Audit logs
