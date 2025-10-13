# API Contract: Sync API

**Feature**: 021-apply-gusto-design
**Created**: 2025-10-13
**Version**: 1.0
**Base URL**: `https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1`

## Overview

The Sync API provides incremental synchronization between the mobile WatermelonDB database and the Supabase backend. It implements a pull-then-push strategy with optimistic locking for conflict detection and resolution.

### Sync Strategy

1. **Pull Phase**: Fetch server changes since `last_pulled_at` timestamp
2. **Local Merge**: Apply server changes to WatermelonDB with conflict resolution
3. **Push Phase**: Send local changes to server with version validation
4. **Conflict Resolution**: Hybrid strategy (auto-merge non-conflicting, user-prompted for conflicts)

### Authentication

All endpoints require JWT authentication via Supabase Auth:

```
Authorization: Bearer <supabase_jwt_token>
```

## Endpoints

### 1. Pull Changes (Incremental Sync)

Fetch all entity changes since the last sync timestamp.

**Endpoint**: `GET /sync-incremental`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `last_pulled_at` | number | No | Unix timestamp (ms) of last successful pull. If null/omitted, returns all data (full sync) |
| `schema_version` | number | Yes | WatermelonDB schema version (current: 1) |
| `entity_types` | string[] | No | Comma-separated list of entities to sync. If omitted, syncs all entities |

**Request Example**:

```http
GET /sync-incremental?last_pulled_at=1697555200000&schema_version=1&entity_types=dossiers,assignments
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Success (200 OK)**:

```json
{
  "timestamp": 1697558800000,
  "schema_version": 1,
  "changes": {
    "dossiers": {
      "created": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "dossier_type": "country",
          "name_en": "Germany",
          "name_ar": "ألمانيا",
          "code": "DEU",
          "status": "active",
          "priority": "high",
          "tags": ["eu", "g7"],
          "created_by_id": "user-uuid-123",
          "created_at": 1697555400000,
          "updated_at": 1697555400000,
          "_version": 1,
          "last_modified": 1697555400000
        }
      ],
      "updated": [
        {
          "id": "660e8400-e29b-41d4-a716-446655440001",
          "name_en": "France (Updated)",
          "name_ar": "فرنسا (محدث)",
          "status": "active",
          "priority": "medium",
          "updated_at": 1697556000000,
          "_version": 3,
          "last_modified": 1697556000000
        }
      ],
      "deleted": [
        "770e8400-e29b-41d4-a716-446655440002"
      ]
    },
    "assignments": {
      "created": [],
      "updated": [
        {
          "id": "880e8400-e29b-41d4-a716-446655440003",
          "status": "completed",
          "completed_at": 1697557000000,
          "updated_at": 1697557000000,
          "_version": 2,
          "last_modified": 1697557000000
        }
      ],
      "deleted": []
    }
  }
}
```

**Response Schema**:

```typescript
interface SyncPullResponse {
  timestamp: number;                    // Server timestamp (ms) for next pull
  schema_version: number;               // Server schema version
  changes: Record<EntityType, EntityChanges>;
}

interface EntityChanges {
  created: EntityRecord[];              // New records since last_pulled_at
  updated: Partial<EntityRecord>[];     // Changed fields only (partial records)
  deleted: string[];                    // Array of deleted record IDs
}

interface EntityRecord {
  id: string;                           // Server UUID
  [field: string]: any;                 // Entity-specific fields
  _version: number;                     // Optimistic locking version
  last_modified: number;                // Server modification timestamp (ms)
}

type EntityType =
  | 'dossiers'
  | 'assignments'
  | 'calendar_entries'
  | 'countries'
  | 'organizations'
  | 'forums'
  | 'positions'
  | 'mous'
  | 'intelligence_signals'
  | 'intake_tickets'
  | 'notifications'
  | 'dossier_countries'
  | 'dossier_organizations'
  | 'dossier_forums'
  | 'position_dossier_links';
```

**Error Responses**:

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `invalid_schema_version` | Client schema version incompatible with server |
| 401 | `unauthorized` | Missing or invalid JWT token |
| 429 | `rate_limit_exceeded` | Too many requests (limit: 30 req/min) |
| 500 | `internal_error` | Server error during sync operation |

**Error Response Example**:

```json
{
  "error": {
    "code": "invalid_schema_version",
    "message": "Client schema version 1 is incompatible with server version 2. Please update the app.",
    "details": {
      "client_version": 1,
      "server_version": 2,
      "migration_required": true
    }
  }
}
```

### 2. Push Changes

Send local changes to the server with optimistic locking validation.

**Endpoint**: `POST /sync-push`

**Request Headers**:

```
Content-Type: application/json
Authorization: Bearer <supabase_jwt_token>
```

**Request Body**:

```typescript
interface SyncPushRequest {
  schema_version: number;
  last_pulled_at: number;               // Timestamp from last successful pull
  changes: Record<EntityType, PushChanges>;
}

interface PushChanges {
  created: EntityRecord[];              // New records created offline
  updated: EntityUpdate[];              // Modified records
  deleted: string[];                    // Record IDs to soft-delete
}

interface EntityUpdate {
  id: string;                           // Server UUID
  _version: number;                     // Expected version (for conflict detection)
  changes: Partial<EntityRecord>;       // Only changed fields
}
```

**Request Example**:

```json
{
  "schema_version": 1,
  "last_pulled_at": 1697558800000,
  "changes": {
    "dossiers": {
      "created": [
        {
          "id": "local-temp-uuid-001",
          "dossier_type": "organization",
          "name_en": "World Bank",
          "name_ar": "البنك الدولي",
          "status": "draft",
          "priority": "medium",
          "tags": ["finance", "development"],
          "created_by_id": "user-uuid-123",
          "created_at": 1697559000000,
          "updated_at": 1697559000000,
          "_version": 1,
          "last_modified": 1697559000000
        }
      ],
      "updated": [
        {
          "id": "660e8400-e29b-41d4-a716-446655440001",
          "_version": 3,
          "changes": {
            "status": "archived",
            "updated_at": 1697559500000
          }
        }
      ],
      "deleted": []
    },
    "assignments": {
      "created": [],
      "updated": [],
      "deleted": ["880e8400-e29b-41d4-a716-446655440003"]
    }
  }
}
```

**Response Success (200 OK)**:

```json
{
  "timestamp": 1697560000000,
  "results": {
    "dossiers": {
      "created": [
        {
          "local_id": "local-temp-uuid-001",
          "server_id": "990e8400-e29b-41d4-a716-446655440004",
          "_version": 1,
          "status": "success"
        }
      ],
      "updated": [
        {
          "id": "660e8400-e29b-41d4-a716-446655440001",
          "_version": 4,
          "status": "success"
        }
      ],
      "deleted": []
    },
    "assignments": {
      "created": [],
      "updated": [],
      "deleted": [
        {
          "id": "880e8400-e29b-41d4-a716-446655440003",
          "status": "success"
        }
      ]
    }
  },
  "conflicts": []
}
```

**Response Schema**:

```typescript
interface SyncPushResponse {
  timestamp: number;                    // Server timestamp for next sync
  results: Record<EntityType, PushResults>;
  conflicts: Conflict[];                // Array of conflicting updates
}

interface PushResults {
  created: CreateResult[];
  updated: UpdateResult[];
  deleted: DeleteResult[];
}

interface CreateResult {
  local_id: string;                     // Temporary client UUID
  server_id: string;                    // Assigned server UUID
  _version: number;                     // Server version (always 1 for new records)
  status: 'success' | 'error';
  error?: string;                       // Error message if status is 'error'
}

interface UpdateResult {
  id: string;                           // Server UUID
  _version: number;                     // New version after update
  status: 'success' | 'error' | 'conflict';
  error?: string;
}

interface DeleteResult {
  id: string;
  status: 'success' | 'error';
  error?: string;
}

interface Conflict {
  entity_type: EntityType;
  id: string;                           // Server UUID
  client_version: number;               // Version sent by client
  server_version: number;               // Current server version
  client_changes: Partial<EntityRecord>;
  server_changes: Partial<EntityRecord>;
  conflicting_fields: string[];         // Fields with conflicting updates
  resolution_required: boolean;         // True if user must choose resolution
}
```

**Conflict Response Example (207 Multi-Status)**:

When conflicts are detected, the server returns a 207 status with partial success:

```json
{
  "timestamp": 1697560000000,
  "results": {
    "dossiers": {
      "created": [],
      "updated": [
        {
          "id": "660e8400-e29b-41d4-a716-446655440001",
          "_version": 3,
          "status": "conflict"
        }
      ],
      "deleted": []
    }
  },
  "conflicts": [
    {
      "entity_type": "dossiers",
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "client_version": 3,
      "server_version": 5,
      "client_changes": {
        "status": "archived",
        "updated_at": 1697559500000
      },
      "server_changes": {
        "status": "active",
        "priority": "high",
        "updated_at": 1697559800000
      },
      "conflicting_fields": ["status"],
      "resolution_required": true
    }
  ]
}
```

**Error Responses**:

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `invalid_request` | Malformed request body or missing required fields |
| 401 | `unauthorized` | Missing or invalid JWT token |
| 409 | `version_conflict` | All updates failed due to version conflicts |
| 422 | `validation_error` | Entity validation failed (e.g., invalid status value) |
| 429 | `rate_limit_exceeded` | Too many requests (limit: 10 req/min for push) |
| 500 | `internal_error` | Server error during push operation |

### 3. Resolve Conflict

User-initiated conflict resolution after reviewing conflicting changes.

**Endpoint**: `POST /sync-resolve-conflict`

**Request Body**:

```typescript
interface ConflictResolutionRequest {
  entity_type: EntityType;
  id: string;                           // Server UUID
  resolution: 'client' | 'server' | 'merge';
  merge_result?: Partial<EntityRecord>; // Required if resolution is 'merge'
  client_version: number;               // Original client version that conflicted
}
```

**Request Example (Merge Resolution)**:

```json
{
  "entity_type": "dossiers",
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "resolution": "merge",
  "merge_result": {
    "status": "active",
    "priority": "high",
    "updated_at": 1697560200000
  },
  "client_version": 3
}
```

**Response Success (200 OK)**:

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "_version": 6,
  "status": "resolved",
  "timestamp": 1697560300000
}
```

**Response Schema**:

```typescript
interface ConflictResolutionResponse {
  id: string;
  _version: number;                     // New version after resolution
  status: 'resolved' | 'error';
  error?: string;
  timestamp: number;
}
```

**Error Responses**:

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `invalid_resolution` | Invalid resolution type or missing merge_result |
| 404 | `conflict_not_found` | No conflict exists for this entity/version |
| 409 | `stale_conflict` | Conflict already resolved or entity updated again |
| 500 | `internal_error` | Server error during resolution |

## Sync Flow Diagram

```
Client (Mobile)                    Server (Supabase)
     |                                    |
     |---(1) GET /sync-incremental------>|
     |    last_pulled_at=1697555200000   |
     |                                    |
     |<-------(2) 200 OK-----------------|
     |    {changes: {...}, timestamp}    |
     |                                    |
  [Local merge with WatermelonDB]        |
  [Detect conflicts]                     |
     |                                    |
     |---(3) POST /sync-push------------>|
     |    {created, updated, deleted}    |
     |                                    |
     |<-------(4) 207 Multi-Status-------|
     |    {results, conflicts: [...]}    |
     |                                    |
  [User reviews conflicts]               |
  [User chooses resolution]              |
     |                                    |
     |---(5) POST /sync-resolve-conflict>|
     |    {resolution: 'merge', ...}     |
     |                                    |
     |<-------(6) 200 OK-----------------|
     |    {_version: 6, status: resolved}|
     |                                    |
  [Update local WatermelonDB]            |
  [Save last_pulled_at timestamp]       |
```

## Conflict Resolution Strategies

### Automatic Merge (Non-Conflicting Fields)

If client and server modify **different fields**, automatically merge:

**Client changes**: `{ status: 'archived' }`
**Server changes**: `{ priority: 'high' }`
**Result**: `{ status: 'archived', priority: 'high', _version: 6 }`

### User-Prompted Resolution (Conflicting Fields)

If client and server modify the **same field**, prompt user:

**Client changes**: `{ status: 'archived' }`
**Server changes**: `{ status: 'active' }`
**Conflicting field**: `status`
**User chooses**: `'server'` → Use `status: 'active'`

### Last-Write-Wins (Optional Strategy)

For low-priority conflicts, automatically accept server changes:

```typescript
// Client-side config
const conflictStrategy = {
  'tags': 'last-write-wins',          // Server always wins for tags
  'priority': 'user-prompt',          // User resolves priority conflicts
  'status': 'user-prompt',            // User resolves status conflicts
};
```

## Rate Limiting

| Endpoint | Limit | Window | Retry-After Header |
|----------|-------|--------|-------------------|
| GET /sync-incremental | 30 req | 1 min | 60 seconds |
| POST /sync-push | 10 req | 1 min | 60 seconds |
| POST /sync-resolve-conflict | 20 req | 1 min | 60 seconds |

**Rate Limit Response (429)**:

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Retry after 45 seconds.",
    "retry_after": 45
  }
}
```

## Performance Expectations

- **Full Sync (first launch)**: ≤5s for 500 records across all entities
- **Incremental Pull**: ≤1s for 50 modified records
- **Push Operation**: ≤2s for 20 local changes
- **Conflict Detection**: ≤500ms per entity
- **Background Sync**: Every 15 minutes when app is active

## Security Considerations

1. **JWT Validation**: All endpoints validate Supabase JWT with `auth.uid()` check
2. **Row-Level Security**: Supabase RLS policies enforce user access permissions
3. **Soft Deletes**: Never hard-delete records; use `is_deleted` flag for audit trails
4. **Version Validation**: Always check `_version` before applying updates
5. **User Isolation**: Users only sync entities they have access to (via assignments)

## Testing Strategy

### Unit Tests

```typescript
describe('Sync API - Pull Changes', () => {
  it('should return all changes since last_pulled_at', async () => {
    const lastPulledAt = Date.now() - 3600000; // 1 hour ago
    const response = await fetch(`/sync-incremental?last_pulled_at=${lastPulledAt}&schema_version=1`);
    const data = await response.json();

    expect(data.timestamp).toBeGreaterThan(lastPulledAt);
    expect(data.changes.dossiers).toBeDefined();
    expect(data.changes.dossiers.created.length).toBeGreaterThanOrEqual(0);
  });

  it('should return 400 for invalid schema version', async () => {
    const response = await fetch('/sync-incremental?schema_version=999');
    expect(response.status).toBe(400);

    const error = await response.json();
    expect(error.error.code).toBe('invalid_schema_version');
  });
});

describe('Sync API - Push Changes', () => {
  it('should create new dossier and return server UUID', async () => {
    const pushData = {
      schema_version: 1,
      last_pulled_at: Date.now(),
      changes: {
        dossiers: {
          created: [{
            id: 'local-temp-001',
            dossier_type: 'country',
            name_en: 'Test Country',
            name_ar: 'دولة اختبار',
            status: 'draft',
            _version: 1,
            last_modified: Date.now(),
          }],
          updated: [],
          deleted: [],
        },
      },
    };

    const response = await fetch('/sync-push', {
      method: 'POST',
      body: JSON.stringify(pushData),
    });

    const result = await response.json();
    expect(result.results.dossiers.created[0].server_id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('should detect version conflict', async () => {
    const pushData = {
      schema_version: 1,
      last_pulled_at: Date.now(),
      changes: {
        dossiers: {
          created: [],
          updated: [{
            id: 'existing-uuid-123',
            _version: 2, // Outdated version
            changes: { status: 'archived' },
          }],
          deleted: [],
        },
      },
    };

    const response = await fetch('/sync-push', {
      method: 'POST',
      body: JSON.stringify(pushData),
    });

    expect(response.status).toBe(207); // Multi-Status
    const result = await response.json();
    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.conflicts[0].entity_type).toBe('dossiers');
  });
});
```

### Integration Tests

```typescript
describe('End-to-End Sync Flow', () => {
  it('should complete full pull-push cycle', async () => {
    // 1. Pull initial state
    const pullResponse = await fetch('/sync-incremental?schema_version=1');
    const pullData = await pullResponse.json();
    const lastPulledAt = pullData.timestamp;

    // 2. Create local change
    const localChange = {
      id: 'local-temp-002',
      dossier_type: 'organization',
      name_en: 'Test Org',
      name_ar: 'منظمة اختبار',
      status: 'draft',
      _version: 1,
      last_modified: Date.now(),
    };

    // 3. Push local change
    const pushResponse = await fetch('/sync-push', {
      method: 'POST',
      body: JSON.stringify({
        schema_version: 1,
        last_pulled_at: lastPulledAt,
        changes: {
          dossiers: {
            created: [localChange],
            updated: [],
            deleted: [],
          },
        },
      }),
    });

    const pushResult = await pushResponse.json();
    const serverUuid = pushResult.results.dossiers.created[0].server_id;

    // 4. Verify server has the new record
    const verifyResponse = await fetch(`/sync-incremental?last_pulled_at=${lastPulledAt}&schema_version=1`);
    const verifyData = await verifyResponse.json();

    const createdDossier = verifyData.changes.dossiers.created.find(d => d.id === serverUuid);
    expect(createdDossier).toBeDefined();
    expect(createdDossier.name_en).toBe('Test Org');
  });
});
```

## References

- [WatermelonDB Sync Documentation](https://watermelondb.dev/docs/Sync/Intro)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Optimistic Locking Pattern](https://en.wikipedia.org/wiki/Optimistic_concurrency_control)
- Feature Specification: `specs/021-apply-gusto-design/spec.md`
- Data Model: `specs/021-apply-gusto-design/data-model.md`
- Research Findings: `specs/021-apply-gusto-design/research.md`
