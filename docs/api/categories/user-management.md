# User Management API

## Overview

The User Management API handles user lifecycle operations including creation, role assignment, deactivation, and onboarding tracking. All endpoints enforce role-based access control and support bilingual content.

## Endpoints

### Create User

Create a new user account (admin only).

**Endpoint:** `POST /create-user`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "full_name": "John Doe",
  "full_name_ar": "جون دو",
  "role": "analyst",
  "department_id": "dept-uuid",
  "send_invitation": true
}
```

**Response (201 Created):**
```json
{
  "user_id": "user-uuid",
  "email": "newuser@example.com",
  "full_name": "John Doe",
  "role": "analyst",
  "status": "pending_activation",
  "created_at": "2024-01-15T10:30:00Z",
  "invitation_sent": true
}
```

**Error Responses:**
- `400 Bad Request` - Invalid email or role
  ```json
  {
    "error": "Email already exists",
    "error_ar": "البريد الإلكتروني موجود بالفعل"
  }
  ```
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (requires admin role)
- `500 Internal Server Error` - User creation failed

**Implementation Example:**
```typescript
const createUser = async (userData: {
  email: string;
  fullName: string;
  fullNameAr: string;
  role: string;
  departmentId: string;
}) => {
  const response = await fetch('/create-user', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: userData.email,
      full_name: userData.fullName,
      full_name_ar: userData.fullNameAr,
      role: userData.role,
      department_id: userData.departmentId,
      send_invitation: true
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
- Requires admin role
- Email must be unique
- Invitation email sent if send_invitation is true
- User status is `pending_activation` until they activate account

---

### Assign Role

Assign or change user role.

**Endpoint:** `POST /assign-role`

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "role": "senior_analyst",
  "effective_date": "2024-02-01T00:00:00Z",
  "justification": "Promotion to senior analyst"
}
```

**Response (200 OK):**
```json
{
  "user_id": "user-uuid",
  "previous_role": "analyst",
  "new_role": "senior_analyst",
  "effective_date": "2024-02-01T00:00:00Z",
  "assigned_by": "manager-uuid",
  "assigned_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid role or user_id
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to assign roles
- `404 Not Found` - User not found
- `500 Internal Server Error` - Role assignment failed

---

### Approve Role Change

Approve pending role change request.

**Endpoint:** `POST /approve-role-change`

**Request Body:**
```json
{
  "request_id": "req-uuid",
  "approved": true,
  "comments": "Approved based on performance review"
}
```

**Response (200 OK):**
```json
{
  "approved": true,
  "request_id": "req-uuid",
  "user_id": "user-uuid",
  "new_role": "senior_analyst",
  "effective_date": "2024-02-01T00:00:00Z",
  "approved_by": "manager-uuid",
  "approved_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request_id
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to approve
- `404 Not Found` - Request not found
- `500 Internal Server Error` - Approval failed

---

### Deactivate User

Deactivate user account.

**Endpoint:** `POST /deactivate-user`

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "reason": "Left organization",
  "transfer_assignments_to": "manager-uuid"
}
```

**Response (200 OK):**
```json
{
  "deactivated": true,
  "user_id": "user-uuid",
  "deactivated_at": "2024-01-15T10:30:00Z",
  "assignments_transferred": 12,
  "message": "User deactivated successfully",
  "message_ar": "تم إلغاء تفعيل المستخدم بنجاح"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid user_id or transfer_to user
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (requires admin or manager role)
- `404 Not Found` - User not found
- `500 Internal Server Error` - Deactivation failed

**Notes:**
- All active assignments transferred to specified user
- Access tokens immediately revoked
- User data retained for audit purposes
- Can be reactivated with reactivate-user endpoint

---

### Reactivate User

Reactivate previously deactivated user.

**Endpoint:** `POST /reactivate-user`

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "reason": "Rejoined organization"
}
```

**Response (200 OK):**
```json
{
  "reactivated": true,
  "user_id": "user-uuid",
  "reactivated_at": "2024-01-15T10:30:00Z",
  "previous_role_restored": true,
  "message": "User reactivated successfully",
  "message_ar": "تم إعادة تفعيل المستخدم بنجاح"
}
```

**Error Responses:**
- `400 Bad Request` - User not deactivated or invalid user_id
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (requires admin role)
- `404 Not Found` - User not found
- `500 Internal Server Error` - Reactivation failed

---

### Inactive Users

List inactive users (no activity in specified period).

**Endpoint:** `GET /inactive-users?days={days}`

**Query Parameters:**
- `days` (optional): Number of days of inactivity (default: 90)
- `department_id` (optional): Filter by department

**Response (200 OK):**
```json
{
  "users": [
    {
      "user_id": "user-uuid",
      "email": "inactive@example.com",
      "full_name": "Jane Smith",
      "role": "analyst",
      "last_login": "2023-10-15T10:30:00Z",
      "days_inactive": 92,
      "active_assignments": 2
    }
  ],
  "total": 15,
  "threshold_days": 90
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (requires manager or admin role)
- `500 Internal Server Error` - Query failed

---

### Onboarding Progress

Track user onboarding completion status.

**Endpoint:** `GET /onboarding-progress?user_id={id}`

**Query Parameters:**
- `user_id` (optional): Specific user (defaults to current user)

**Response (200 OK):**
```json
{
  "user_id": "user-uuid",
  "status": "in_progress",
  "completion_percentage": 75,
  "steps": [
    {
      "step": "profile_setup",
      "completed": true,
      "completed_at": "2024-01-10T10:00:00Z"
    },
    {
      "step": "mfa_setup",
      "completed": true,
      "completed_at": "2024-01-10T10:15:00Z"
    },
    {
      "step": "first_assignment",
      "completed": true,
      "completed_at": "2024-01-11T14:30:00Z"
    },
    {
      "step": "training_modules",
      "completed": false,
      "completed_at": null
    }
  ],
  "started_at": "2024-01-10T09:00:00Z",
  "target_completion": "2024-01-24T23:59:59Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to view other user's progress (unless manager/admin)
- `404 Not Found` - User not found
- `500 Internal Server Error` - Query failed

---

### View Preferences

Get or update user preferences.

**Endpoint:** `GET /view-preferences` or `POST /view-preferences`

**GET Response (200 OK):**
```json
{
  "user_id": "user-uuid",
  "language": "ar",
  "theme": "dark",
  "timezone": "Asia/Riyadh",
  "notifications": {
    "email": true,
    "push": true,
    "sms": false,
    "digest_frequency": "daily"
  },
  "dashboard_layout": {
    "widgets": ["assignments", "positions", "calendar"]
  },
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**POST Request Body:**
```json
{
  "language": "en",
  "theme": "light",
  "notifications": {
    "email": true,
    "push": false
  }
}
```

**POST Response (200 OK):**
```json
{
  "updated": true,
  "message": "Preferences updated successfully",
  "message_ar": "تم تحديث التفضيلات بنجاح"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid preference values
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Update failed

---

## User Roles

| Role | Permissions | Description |
|------|-------------|-------------|
| `admin` | Full system access | System administrators |
| `manager` | Department management, user oversight | Department managers |
| `senior_analyst` | Advanced analysis, approval workflows | Senior policy analysts |
| `analyst` | Standard analysis, content creation | Policy analysts |
| `viewer` | Read-only access | External stakeholders, observers |

## Onboarding Steps

1. **Profile Setup**: Complete basic profile information
2. **MFA Setup**: Configure multi-factor authentication
3. **First Assignment**: Complete first task assignment
4. **Training Modules**: Complete required training (role-specific)
5. **System Tour**: Complete interactive system tour

## Related APIs

- [Authentication](./authentication.md) - Account activation and password management
- [Security & Access](./security-access.md) - Role-based permissions
- [Notifications](./notifications.md) - User notification preferences
