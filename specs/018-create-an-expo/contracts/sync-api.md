# Sync API Contract: Mobile Offline Synchronization

**Feature**: 018-create-an-expo
**Date**: 2025-10-10
**Purpose**: Define API endpoints for bidirectional sync between WatermelonDB local cache and Supabase backend

---

## Overview

The Sync API enables incremental synchronization between the mobile app's local WatermelonDB cache and the Supabase PostgreSQL backend. The mobile app is **read-only** (no local mutations synced to server), so sync operations primarily pull changes from the server.

### Sync Strategy
- **Incremental Sync**: Only fetch records modified since `last_sync_timestamp`
- **Conflict Resolution**: Server always wins (read-only mobile app)
- **Batch Size**: Maximum 100 records per entity type per request
- **Offline Storage Limit**: 20 recent dossiers + all assigned dossiers

---

## Authentication

All sync endpoints require a valid Supabase Auth JWT token in the `Authorization` header:

```http
Authorization: Bearer <jwt_token>
```

The JWT contains the authenticated user's UUID, which is used to filter synced data based on RLS policies.

---

## 1. Pull Changes (Incremental Sync)

**Endpoint**: `POST /api/v1/sync/pull`

**Description**: Fetch all records modified since the client's last sync timestamp. Returns data for all entity types in a single response to minimize round trips.

### Request

```json
{
  "last_sync_timestamp": 1696118400000,
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "entity_types": [
    "users",
    "dossiers",
    "countries",
    "organizations",
    "positions",
    "briefs",
    "intake_requests",
    "documents",
    "assignments",
    "notifications"
  ]
}
```

**Request Schema**:
- `last_sync_timestamp` (number, required): Unix timestamp (milliseconds) of last successful sync
- `user_id` (string, required): Current user's UUID (from Supabase Auth)
- `entity_types` (array[string], required): List of entities to sync

### Response (Success)

**Status**: `200 OK`

```json
{
  "success": true,
  "sync_timestamp": 1696122000000,
  "changes": {
    "users": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "email": "analyst@gastat.gov.sa",
        "name": "Ahmed Al-Zahrani",
        "role": "analyst",
        "assigned_countries": ["SA", "AE", "KW"],
        "assigned_regions": ["GCC", "MENA"],
        "language": "ar",
        "notification_preferences": {
          "dossier_assignments": true,
          "brief_assignments": true,
          "intake_assignments": false
        },
        "biometric_enabled": true,
        "created_at": 1696000000000,
        "updated_at": 1696118500000
      }
    ],
    "dossiers": [
      {
        "id": "d1e2f3g4-h5i6-7890-jklm-nopqrstuvwxy",
        "title": "Saudi-UAE Trade Relations 2025",
        "title_ar": "العلاقات التجارية السعودية الإماراتية 2025",
        "description": "Comprehensive analysis of bilateral trade agreements",
        "description_ar": "تحليل شامل لاتفاقيات التجارة الثنائية",
        "status": "active",
        "priority": "high",
        "assigned_analyst_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "created_at": 1696100000000,
        "updated_at": 1696120000000
      }
    ],
    "countries": [...],
    "organizations": [...],
    "positions": [...],
    "briefs": [...],
    "intake_requests": [...],
    "documents": [...],
    "assignments": [
      {
        "id": "x1y2z3a4-b5c6-7890-defg-hijklmnopqrs",
        "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "dossier_id": "d1e2f3g4-h5i6-7890-jklm-nopqrstuvwxy",
        "brief_id": null,
        "intake_request_id": null,
        "assignment_date": 1696118000000,
        "priority": "high",
        "notification_sent": true,
        "created_at": 1696118000000,
        "updated_at": 1696118000000
      }
    ],
    "notifications": [
      {
        "id": "n1o2p3q4-r5s6-7890-tuvw-xyzabcdefghi",
        "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "title": "New Dossier Assignment",
        "title_ar": "تعيين ملف جديد",
        "message": "You have been assigned to: Saudi-UAE Trade Relations 2025",
        "message_ar": "تم تعيينك إلى: العلاقات التجارية السعودية الإماراتية 2025",
        "type": "assignment",
        "dossier_id": "d1e2f3g4-h5i6-7890-jklm-nopqrstuvwxy",
        "brief_id": null,
        "intake_request_id": null,
        "read_status": false,
        "created_at": 1696118000000,
        "updated_at": 1696118000000
      }
    ]
  },
  "has_more": false,
  "deleted_ids": {
    "dossiers": ["old-id-1", "old-id-2"],
    "documents": ["doc-id-3"]
  }
}
```

**Response Schema**:
- `success` (boolean): Always `true` for 200 OK
- `sync_timestamp` (number): Server timestamp for this sync (use as `last_sync_timestamp` in next sync)
- `changes` (object): Map of entity type to array of changed records
- `has_more` (boolean): If `true`, client should make another pull request to fetch remaining records
- `deleted_ids` (object): Map of entity type to array of IDs deleted on server (client should delete locally)

### Response (Error)

**Status**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TIMESTAMP",
    "message": "last_sync_timestamp must be a valid Unix timestamp in milliseconds"
  }
}
```

**Status**: `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "JWT token is invalid or expired"
  }
}
```

**Status**: `500 Internal Server Error`

```json
{
  "success": false,
  "error": {
    "code": "SYNC_FAILED",
    "message": "Failed to retrieve changes from database"
  }
}
```

---

## 2. Get Full Dataset (Initial Sync)

**Endpoint**: `POST /api/v1/sync/full`

**Description**: Fetch complete dataset for first-time sync or after local database reset. Returns all records the user has access to based on RLS policies.

### Request

```json
{
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "entity_types": [
    "users",
    "dossiers",
    "countries",
    "organizations",
    "positions",
    "briefs",
    "intake_requests",
    "documents",
    "assignments",
    "notifications"
  ],
  "limit": {
    "dossiers": 20,
    "briefs": 20,
    "intake_requests": 20
  }
}
```

**Request Schema**:
- `user_id` (string, required): Current user's UUID
- `entity_types` (array[string], required): Entities to fetch
- `limit` (object, optional): Maximum records per entity (default: unlimited for metadata entities, 20 for primary entities)

### Response (Success)

**Status**: `200 OK`

```json
{
  "success": true,
  "sync_timestamp": 1696122000000,
  "data": {
    "users": [...],
    "dossiers": [...],
    "countries": [...],
    "organizations": [...],
    "positions": [...],
    "briefs": [...],
    "intake_requests": [...],
    "documents": [...],
    "assignments": [...],
    "notifications": [...]
  },
  "counts": {
    "dossiers": 20,
    "briefs": 15,
    "intake_requests": 8,
    "countries": 245,
    "organizations": 1250
  }
}
```

**Response Schema**:
- `success` (boolean): Always `true` for 200 OK
- `sync_timestamp` (number): Server timestamp (use for next incremental sync)
- `data` (object): Complete dataset for all requested entities
- `counts` (object): Total record counts per entity type

---

## 3. Mark Notifications as Read

**Endpoint**: `POST /api/v1/sync/notifications/mark-read`

**Description**: Update read status for one or more notifications. This is the only write operation supported by the mobile app.

### Request

```json
{
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "notification_ids": [
    "n1o2p3q4-r5s6-7890-tuvw-xyzabcdefghi",
    "n2o3p4q5-r6s7-8901-uvwx-yzabcdefghij"
  ]
}
```

**Request Schema**:
- `user_id` (string, required): Current user's UUID
- `notification_ids` (array[string], required): List of notification IDs to mark as read

### Response (Success)

**Status**: `200 OK`

```json
{
  "success": true,
  "updated_count": 2,
  "timestamp": 1696122500000
}
```

**Response Schema**:
- `success` (boolean): Always `true` for 200 OK
- `updated_count` (number): Number of notifications successfully marked as read
- `timestamp` (number): Server timestamp of the update

---

## 4. Get Sync Status

**Endpoint**: `GET /api/v1/sync/status`

**Description**: Check server health and get user-specific sync metadata.

### Request

**Query Parameters**:
- `user_id` (string, required): Current user's UUID

**Example**: `GET /api/v1/sync/status?user_id=a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Response (Success)

**Status**: `200 OK`

```json
{
  "success": true,
  "server_timestamp": 1696122600000,
  "user_last_sync": 1696122000000,
  "server_status": "healthy",
  "pending_changes": {
    "dossiers": 3,
    "notifications": 5,
    "assignments": 1
  }
}
```

**Response Schema**:
- `success` (boolean): Always `true` for 200 OK
- `server_timestamp` (number): Current server time
- `user_last_sync` (number): Last sync timestamp recorded for this user
- `server_status` (string): Server health status (`healthy`, `degraded`, `unavailable`)
- `pending_changes` (object): Count of unsynced changes per entity type

---

## Rate Limiting

All sync endpoints are rate-limited to prevent abuse:

- **Pull Changes**: 30 requests per minute per user
- **Full Dataset**: 5 requests per hour per user
- **Mark Notifications Read**: 60 requests per minute per user
- **Sync Status**: 120 requests per minute per user

**Rate Limit Response**:

**Status**: `429 Too Many Requests`

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many sync requests. Retry after 60 seconds.",
    "retry_after": 60
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_TIMESTAMP` | 400 | Invalid or malformed timestamp |
| `INVALID_TOKEN` | 401 | JWT token invalid or expired |
| `FORBIDDEN` | 403 | User lacks permission for requested data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SYNC_FAILED` | 500 | Server error during sync operation |
| `DATABASE_ERROR` | 500 | Database connection or query error |

---

## Implementation Notes

### WatermelonDB Integration

The mobile app uses WatermelonDB's sync adapter to orchestrate sync operations:

```typescript
import { synchronize } from '@nozbe/watermelon/sync';

async function syncDatabase() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const response = await fetch('/api/v1/sync/pull', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          last_sync_timestamp: lastPulledAt || 0,
          user_id: currentUserId,
          entity_types: ['dossiers', 'briefs', ...]
        })
      });

      const data = await response.json();
      return {
        changes: data.changes,
        timestamp: data.sync_timestamp
      };
    },
    pushChanges: async () => {
      // No-op: read-only mobile app
      return;
    }
  });
}
```

### Supabase RLS Policies

All sync endpoints respect existing Row-Level Security (RLS) policies on the Supabase backend. Users can only sync data they have permission to view based on:

- **Role**: `analyst`, `field_staff`, `intake_officer`
- **Assigned Countries**: Users see dossiers related to their assigned countries
- **Assignments**: Users always see dossiers/briefs/intake requests assigned to them

### Offline Storage Cleanup

After each successful sync, the mobile app runs a cleanup task:

1. Count total cached dossiers
2. If count > 20 + assigned dossiers:
   - Identify unassigned dossiers (`is_assigned_to_user = false`)
   - Sort by `created_at` (oldest first)
   - Delete oldest unassigned dossiers until count ≤ 20 + assigned
3. Delete orphaned documents (no parent dossier/brief)

---

## Performance Targets

- **Pull Changes**: < 2 seconds for 100 records on 4G
- **Full Dataset**: < 5 minutes for 1000 records on 4G
- **Mark Read**: < 500ms
- **Sync Status**: < 200ms

---

## Security Considerations

1. **JWT Validation**: All endpoints validate JWT signature and expiration
2. **RLS Enforcement**: Database queries respect RLS policies
3. **HTTPS Only**: All sync traffic encrypted with TLS 1.3
4. **Token Rotation**: JWT tokens expire after 30 minutes, refresh tokens used to obtain new JWTs
5. **No Sensitive Data in Logs**: User IDs and entity IDs logged, but no content data
