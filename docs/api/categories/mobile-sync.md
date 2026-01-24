# Mobile Sync API

## Overview

The Mobile Sync API provides offline-first synchronization for mobile applications using incremental sync patterns. All endpoints support optimistic updates, conflict resolution, and efficient delta sync to minimize bandwidth usage.

## Endpoints

### Sync Pull

Pull changes from server since last sync (incremental sync).

**Endpoint:** `POST /sync-pull`

**Request Body:**
```json
{
  "device_id": "device-uuid",
  "last_sync_timestamp": "2024-01-14T10:00:00Z",
  "entity_types": ["positions", "dossiers", "assignments", "intake_tickets"],
  "batch_size": 100,
  "include_deletes": true
}
```

**Response (200 OK):**
```json
{
  "sync_id": "sync-uuid",
  "server_timestamp": "2024-01-15T10:30:00Z",
  "changes": {
    "positions": {
      "created": [
        {
          "id": "pos-uuid",
          "title_en": "Climate Policy Framework",
          "title_ar": "إطار سياسة المناخ",
          "content_en": "Policy content...",
          "status": "draft",
          "version": 1,
          "created_at": "2024-01-15T09:00:00Z",
          "updated_at": "2024-01-15T09:00:00Z",
          "sync_metadata": {
            "server_version": 1,
            "checksum": "sha256:..."
          }
        }
      ],
      "updated": [
        {
          "id": "pos-uuid-2",
          "title_en": "Updated Title",
          "status": "published",
          "updated_at": "2024-01-15T08:30:00Z",
          "sync_metadata": {
            "server_version": 3,
            "checksum": "sha256:...",
            "changed_fields": ["title_en", "status"]
          }
        }
      ],
      "deleted": ["pos-uuid-3"]
    },
    "dossiers": {
      "created": [],
      "updated": [
        {
          "id": "dossier-uuid",
          "name_en": "Updated Organization Name",
          "updated_at": "2024-01-15T07:00:00Z"
        }
      ],
      "deleted": []
    },
    "assignments": {
      "created": [
        {
          "id": "assignment-uuid",
          "title_en": "Review Draft Position",
          "assignee_id": "user-uuid",
          "deadline": "2024-01-20T00:00:00Z",
          "status": "pending",
          "created_at": "2024-01-15T06:00:00Z"
        }
      ],
      "updated": [],
      "deleted": []
    }
  },
  "pagination": {
    "has_more": false,
    "next_timestamp": null,
    "total_changes": 5
  },
  "sync_stats": {
    "total_created": 2,
    "total_updated": 2,
    "total_deleted": 1,
    "bandwidth_saved_bytes": 45678,
    "compression_ratio": 0.35
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid device_id or last_sync_timestamp
  ```json
  {
    "error": "Invalid last_sync_timestamp format. Use ISO 8601 format",
    "error_ar": "تنسيق الطابع الزمني للمزامنة الأخيرة غير صالح"
  }
  ```
- `401 Unauthorized` - Not authenticated
- `409 Conflict` - Server version conflict (need full resync)
- `500 Internal Server Error` - Sync failed

**Implementation Example (React Native + WatermelonDB):**
```typescript
import { synchronize } from '@nozbe/watermelondb/sync';
import { Q } from '@nozbe/watermelondb';

const syncPull = async (database, lastSyncTimestamp: string) => {
  const response = await fetch('/sync-pull', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      device_id: DeviceInfo.getUniqueId(),
      last_sync_timestamp: lastSyncTimestamp,
      entity_types: ['positions', 'dossiers', 'assignments'],
      batch_size: 100,
      include_deletes: true
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_ar || error.error);
  }

  const syncData = await response.json();

  // Apply changes to WatermelonDB
  await database.write(async () => {
    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt }) => {
        return {
          changes: syncData.changes,
          timestamp: syncData.server_timestamp
        };
      },
      pushChanges: async ({ changes, lastPulledAt }) => {
        // See sync-push endpoint
      }
    });
  });

  return syncData.server_timestamp;
};
```

**Notes:**
- Incremental sync: Only changes since `last_sync_timestamp`
- Delta sync: Only changed fields sent for updates
- Checksum validation for data integrity
- Gzip compression enabled by default (35% compression ratio typical)
- Batch size configurable (default 100, max 500 records per entity type)
- Conflict resolution: Server wins (optimistic locking with version numbers)

---

### Sync Push

Push local changes to server (optimistic updates).

**Endpoint:** `POST /sync-push`

**Request Body:**
```json
{
  "device_id": "device-uuid",
  "changes": {
    "positions": {
      "created": [
        {
          "local_id": "local-pos-uuid",
          "title_en": "New Position Created Offline",
          "title_ar": "موقف جديد تم إنشاؤه دون اتصال",
          "content_en": "Content...",
          "created_at": "2024-01-15T09:00:00Z",
          "sync_metadata": {
            "local_version": 1,
            "checksum": "sha256:..."
          }
        }
      ],
      "updated": [
        {
          "id": "pos-uuid",
          "title_en": "Updated Title",
          "updated_at": "2024-01-15T09:30:00Z",
          "sync_metadata": {
            "local_version": 2,
            "server_version": 1,
            "changed_fields": ["title_en"]
          }
        }
      ],
      "deleted": ["pos-uuid-2"]
    }
  },
  "client_timestamp": "2024-01-15T10:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "sync_id": "sync-uuid",
  "server_timestamp": "2024-01-15T10:30:00Z",
  "results": {
    "positions": {
      "created": [
        {
          "local_id": "local-pos-uuid",
          "server_id": "pos-uuid-new",
          "status": "success",
          "server_version": 1
        }
      ],
      "updated": [
        {
          "id": "pos-uuid",
          "status": "success",
          "server_version": 2
        }
      ],
      "deleted": [
        {
          "id": "pos-uuid-2",
          "status": "success"
        }
      ]
    }
  },
  "conflicts": [],
  "errors": [],
  "sync_stats": {
    "total_pushed": 3,
    "successful": 3,
    "conflicts": 0,
    "errors": 0
  }
}
```

**Response (207 Multi-Status - With Conflicts):**
```json
{
  "sync_id": "sync-uuid",
  "server_timestamp": "2024-01-15T10:30:00Z",
  "results": {
    "positions": {
      "updated": [
        {
          "id": "pos-uuid",
          "status": "conflict",
          "conflict_type": "version_mismatch",
          "local_version": 2,
          "server_version": 3,
          "server_data": {
            "title_en": "Server Version Title",
            "updated_at": "2024-01-15T09:45:00Z",
            "updated_by": "other-user-uuid"
          }
        }
      ]
    }
  },
  "conflicts": [
    {
      "entity_type": "position",
      "entity_id": "pos-uuid",
      "conflict_type": "version_mismatch",
      "resolution_strategy": "server_wins",
      "local_data": {...},
      "server_data": {...}
    }
  ],
  "sync_stats": {
    "total_pushed": 1,
    "successful": 0,
    "conflicts": 1,
    "errors": 0
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid device_id or changes format
- `401 Unauthorized` - Not authenticated
- `422 Unprocessable Entity` - Validation errors in pushed data
- `500 Internal Server Error` - Sync failed

**Conflict Resolution Strategies:**
- `server_wins` (default): Server data takes precedence
- `client_wins`: Client data takes precedence (requires elevated permissions)
- `merge`: Attempt to merge non-conflicting fields
- `manual`: Flag for manual resolution by user

---

### Incremental Sync

Full bidirectional incremental sync (pull + push combined).

**Endpoint:** `POST /sync-incremental`

**Request Body:**
```json
{
  "device_id": "device-uuid",
  "last_sync_timestamp": "2024-01-14T10:00:00Z",
  "entity_types": ["positions", "dossiers", "assignments"],
  "local_changes": {
    "positions": {
      "created": [],
      "updated": [
        {
          "id": "pos-uuid",
          "title_en": "Updated Title",
          "sync_metadata": {
            "local_version": 2,
            "server_version": 1
          }
        }
      ],
      "deleted": []
    }
  },
  "options": {
    "conflict_resolution": "server_wins",
    "batch_size": 100,
    "compress": true
  }
}
```

**Response (200 OK):**
```json
{
  "sync_id": "sync-uuid",
  "server_timestamp": "2024-01-15T10:30:00Z",
  "pull_changes": {
    "positions": {
      "created": [...],
      "updated": [...],
      "deleted": [...]
    }
  },
  "push_results": {
    "positions": {
      "updated": [
        {
          "id": "pos-uuid",
          "status": "success",
          "server_version": 2
        }
      ]
    }
  },
  "conflicts": [],
  "sync_stats": {
    "pulled_changes": 5,
    "pushed_changes": 1,
    "conflicts": 0,
    "sync_duration_ms": 1234,
    "bandwidth_used_bytes": 45678
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid sync request
- `401 Unauthorized` - Not authenticated
- `409 Conflict` - Unresolvable conflicts (require manual intervention)
- `500 Internal Server Error` - Sync failed

**Implementation Example (Full Sync with WatermelonDB):**
```typescript
import { synchronize } from '@nozbe/watermelondb/sync';
import AsyncStorage from '@react-native-async-storage/async-storage';

const performIncrementalSync = async (database) => {
  const lastSyncTimestamp = await AsyncStorage.getItem('last_sync_timestamp') || null;

  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const response = await fetch('/sync-pull', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_id: DeviceInfo.getUniqueId(),
          last_sync_timestamp: lastPulledAt || lastSyncTimestamp,
          entity_types: ['positions', 'dossiers', 'assignments'],
          batch_size: 100
        })
      });

      const data = await response.json();
      return {
        changes: data.changes,
        timestamp: data.server_timestamp
      };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      await fetch('/sync-push', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_id: DeviceInfo.getUniqueId(),
          changes,
          client_timestamp: new Date().toISOString()
        })
      });
    },
    onWillApplyRemoteChanges: () => {
      // Show loading indicator
    },
    onDidPullChanges: async ({ newTimestamp }) => {
      await AsyncStorage.setItem('last_sync_timestamp', newTimestamp);
    }
  });
};
```

---

## Mobile Sync Best Practices

### 1. Offline-First Architecture

```typescript
// Check connectivity before sync
import NetInfo from '@react-native-community/netinfo';

const syncIfOnline = async (database) => {
  const netInfo = await NetInfo.fetch();

  if (netInfo.isConnected && netInfo.isInternetReachable) {
    await performIncrementalSync(database);
  } else {
    console.log('Offline - sync deferred');
  }
};
```

### 2. Optimistic Updates

```typescript
// Update local database immediately, sync later
const createPosition = async (database, positionData) => {
  await database.write(async () => {
    const position = await database.collections.get('positions').create(pos => {
      pos.title_en = positionData.title_en;
      pos.status = 'draft';
      pos._syncStatus = 'pending'; // Mark for sync
    });
  });

  // Sync in background
  syncIfOnline(database).catch(console.error);
};
```

### 3. Periodic Background Sync

```typescript
// React Native Background Fetch
import BackgroundFetch from 'react-native-background-fetch';

BackgroundFetch.configure({
  minimumFetchInterval: 15, // minutes
  stopOnTerminate: false,
  startOnBoot: true
}, async (taskId) => {
  console.log('[BackgroundFetch] Syncing...');
  await performIncrementalSync(database);
  BackgroundFetch.finish(taskId);
}, (error) => {
  console.error('[BackgroundFetch] Failed:', error);
});
```

### 4. Conflict Resolution UI

```tsx
const ConflictResolutionModal = ({ conflict }) => {
  const [resolution, setResolution] = useState('server_wins');

  return (
    <Modal>
      <Text>Conflict detected for: {conflict.entity_type}</Text>
      <View>
        <Text>Your Version:</Text>
        <Text>{JSON.stringify(conflict.local_data, null, 2)}</Text>
      </View>
      <View>
        <Text>Server Version (by {conflict.server_data.updated_by}):</Text>
        <Text>{JSON.stringify(conflict.server_data, null, 2)}</Text>
      </View>
      <Button onPress={() => resolveConflict(conflict, 'server_wins')}>
        Keep Server Version
      </Button>
      <Button onPress={() => resolveConflict(conflict, 'client_wins')}>
        Keep My Version
      </Button>
    </Modal>
  );
};
```

## Sync Metadata

Each synced entity includes metadata for conflict detection:

```typescript
interface SyncMetadata {
  server_version: number;        // Incremented on each server update
  local_version: number;         // Incremented on each local update
  checksum: string;              // SHA-256 hash for integrity
  last_synced_at: string;        // ISO timestamp of last sync
  sync_status: 'synced' | 'pending' | 'conflict';
  changed_fields?: string[];     // Delta sync: only changed fields
}
```

## Bandwidth Optimization

- **Delta Sync**: Only changed fields transmitted
- **Gzip Compression**: Typical 35% reduction
- **Batch Size**: Configurable (default 100, max 500)
- **Field Filtering**: Request only needed fields
- **Image Optimization**: Thumbnails synced first, full images on-demand

## Related APIs

- [Positions](./positions.md) - Position synchronization
- [Dossiers](./dossiers.md) - Dossier synchronization
- [Assignments](./assignments.md) - Assignment synchronization
- [Unified Work](./unified-work.md) - Unified work item sync
