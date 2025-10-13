# Data Model: Complete Mobile Development

**Feature**: 020-complete-the-development | **Date**: 2025-10-12

## Overview

This document defines the WatermelonDB schema for the mobile application's offline-first architecture. All entities mirror the Supabase PostgreSQL schema with additional sync metadata for conflict resolution and offline queue management.

## Sync Metadata Fields (All Entities)

Every WatermelonDB entity includes these sync metadata fields:

```typescript
// Sync metadata (present on ALL entities)
_status: 'synced' | 'created' | 'updated' | 'deleted'  // Sync queue status
_version: number                                        // Optimistic locking version
_synced_at: Date | null                                // Last successful sync timestamp
```

## Entity Definitions

### 1. MobileIntakeTicket

Represents intake request submitted from mobile with offline queue status, attachment sync state, AI triage results.

```typescript
@tableSchema({
  name: 'mobile_intake_tickets',
  columns: [
    { name: 'id', type: 'string', isIndexed: true },
    { name: 'ticket_number', type: 'string', isIndexed: true },
    { name: 'request_type', type: 'string' }, // 'engagement' | 'position' | 'mou' | 'foresight'
    { name: 'title_ar', type: 'string' },
    { name: 'title_en', type: 'string' },
    { name: 'description_ar', type: 'string' },
    { name: 'description_en', type: 'string' },
    { name: 'sensitivity', type: 'string' }, // 'public' | 'internal' | 'confidential' | 'secret'
    { name: 'urgency', type: 'string' }, // 'low' | 'medium' | 'high' | 'urgent'
    { name: 'submitter_id', type: 'string', isIndexed: true },
    { name: 'linked_dossier_id', type: 'string', isOptional: true },
    { name: 'ai_triage_type', type: 'string', isOptional: true },
    { name: 'ai_triage_sensitivity', type: 'string', isOptional: true },
    { name: 'ai_triage_urgency', type: 'string', isOptional: true },
    { name: 'ai_triage_recommended_owner', type: 'string', isOptional: true },
    { name: 'ai_triage_confidence', type: 'number', isOptional: true },
    { name: 'sla_deadline', type: 'number' }, // Unix timestamp
    { name: 'submitted_at', type: 'number' }, // Unix timestamp
    { name: 'offline_queue_status', type: 'string' }, // 'pending' | 'uploading' | 'uploaded' | 'failed'
    { name: 'attachment_sync_status', type: 'string' }, // 'none' | 'pending' | 'uploading' | 'completed' | 'failed'
    { name: 'attachment_count', type: 'number' },
    { name: 'attachment_total_size', type: 'number' }, // Bytes
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
    // Sync metadata
    { name: '_status', type: 'string' },
    { name: '_version', type: 'number' },
    { name: '_synced_at', type: 'number', isOptional: true },
  ]
})
class MobileIntakeTicket extends Model {
  static table = 'mobile_intake_tickets'

  @field('ticket_number') ticketNumber!: string
  @field('request_type') requestType!: 'engagement' | 'position' | 'mou' | 'foresight'
  @field('title_ar') titleAr!: string
  @field('title_en') titleEn!: string
  @field('sensitivity') sensitivity!: 'public' | 'internal' | 'confidential' | 'secret'
  @field('urgency') urgency!: 'low' | 'medium' | 'high' | 'urgent'
  @field('offline_queue_status') offlineQueueStatus!: 'pending' | 'uploading' | 'uploaded' | 'failed'
  @field('_status') syncStatus!: 'synced' | 'created' | 'updated' | 'deleted'
  @date('sla_deadline') slaDeadline!: Date
  @date('submitted_at') submittedAt!: Date
}
```

**Validation Rules**:
- `title_ar` and `title_en` required (min 10 chars, max 200 chars)
- `description_ar` and `description_en` required (min 50 chars, max 5000 chars)
- `attachment_count` max 10 files
- `attachment_total_size` max 100MB (104857600 bytes)
- `sensitivity` determines encryption: confidential+ requires iOS Keychain/Android Keystore storage

**State Transitions**:
- Draft → Pending (user saves draft) → Uploading (connectivity returns) → Uploaded (sync complete) | Failed (sync error)

---

### 2. MobileSearchIndex

Local cached search index covering all entity types with last sync timestamp, offline availability indicator.

```typescript
@tableSchema({
  name: 'mobile_search_index',
  columns: [
    { name: 'id', type: 'string', isIndexed: true },
    { name: 'entity_type', type: 'string', isIndexed: true }, // 'dossier' | 'person' | 'engagement' | 'position' | 'mou' | 'document'
    { name: 'entity_id', type: 'string', isIndexed: true },
    { name: 'title_ar', type: 'string' },
    { name: 'title_en', type: 'string' },
    { name: 'snippet_ar', type: 'string' },
    { name: 'snippet_en', type: 'string' },
    { name: 'keywords_ar', type: 'string' }, // Space-separated for FTS
    { name: 'keywords_en', type: 'string' },
    { name: 'metadata', type: 'string' }, // JSON string: {country, organization, status, etc.}
    { name: 'last_activity_at', type: 'number' }, // Unix timestamp
    { name: 'offline_available', type: 'boolean' },
    { name: 'search_rank', type: 'number' }, // Pre-calculated relevance score
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
    // Sync metadata
    { name: '_status', type: 'string' },
    { name: '_version', type: 'number' },
    { name: '_synced_at', type: 'number', isOptional: true },
  ]
})
class MobileSearchIndex extends Model {
  static table = 'mobile_search_index'

  @field('entity_type') entityType!: 'dossier' | 'person' | 'engagement' | 'position' | 'mou' | 'document'
  @field('entity_id') entityId!: string
  @field('keywords_ar') keywordsAr!: string
  @field('keywords_en') keywordsEn!: string
  @field('offline_available') offlineAvailable!: boolean
  @field('search_rank') searchRank!: number
  @date('last_activity_at') lastActivityAt!: Date
}
```

**Indexing Strategy**:
- Full-text search (FTS) on `keywords_ar` and `keywords_en` using SQLite FTS5 virtual table
- Composite index on `(entity_type, search_rank DESC)` for filtered searches
- Index on `last_activity_at DESC` for recency sorting

**Search Algorithm**:
1. Tokenize query (Arabic/English), apply stemming
2. Query FTS5 index: `SELECT * FROM mobile_search_index_fts WHERE keywords_ar MATCH ? OR keywords_en MATCH ?`
3. Filter by `entity_type` if specified
4. Sort by `search_rank DESC` (pre-calculated based on: entity importance, recency, user interaction frequency)
5. Return top 20 results, load more on scroll

---

### 3. MobileAssignment

Work item assigned to mobile user with SLA countdown timer, escalation state, notification preferences.

```typescript
@tableSchema({
  name: 'mobile_assignments',
  columns: [
    { name: 'id', type: 'string', isIndexed: true },
    { name: 'assignment_type', type: 'string' }, // 'intake' | 'engagement' | 'position' | 'mou' | 'review'
    { name: 'entity_id', type: 'string', isIndexed: true },
    { name: 'assigned_to_id', type: 'string', isIndexed: true },
    { name: 'assigned_by_id', type: 'string' },
    { name: 'title_ar', type: 'string' },
    { name: 'title_en', type: 'string' },
    { name: 'priority', type: 'string' }, // 'low' | 'medium' | 'high' | 'urgent'
    { name: 'status', type: 'string' }, // 'pending' | 'in_progress' | 'completed' | 'escalated'
    { name: 'sla_deadline', type: 'number' }, // Unix timestamp
    { name: 'sla_elapsed_percent', type: 'number' }, // 0-100 (calculated client-side)
    { name: 'escalation_level', type: 'number' }, // 0 (none), 1 (first), 2 (second), 3 (final)
    { name: 'wip_position', type: 'number' }, // Position in user's WIP queue (1-based)
    { name: 'notification_preference', type: 'string' }, // 'all' | 'urgent_only' | 'none'
    { name: 'assigned_at', type: 'number' },
    { name: 'started_at', type: 'number', isOptional: true },
    { name: 'completed_at', type: 'number', isOptional: true },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
    // Sync metadata
    { name: '_status', type: 'string' },
    { name: '_version', type: 'number' },
    { name: '_synced_at', type: 'number', isOptional: true },
  ]
})
class MobileAssignment extends Model {
  static table = 'mobile_assignments'

  @field('assignment_type') assignmentType!: string
  @field('priority') priority!: 'low' | 'medium' | 'high' | 'urgent'
  @field('status') status!: 'pending' | 'in_progress' | 'completed' | 'escalated'
  @field('sla_elapsed_percent') slaElapsedPercent!: number
  @field('escalation_level') escalationLevel!: number
  @date('sla_deadline') slaDeadline!: Date

  // Computed property for SLA color coding
  get slaColorCode(): 'green' | 'yellow' | 'red' | 'breached' {
    if (this.status === 'completed') return 'green'
    if (this.slaElapsedPercent > 100) return 'breached'
    if (this.slaElapsedPercent >= 75) return 'red'
    if (this.slaElapsedPercent >= 50) return 'yellow'
    return 'green'
  }
}
```

**Validation Rules**:
- `sla_deadline` must be future timestamp when created
- `escalation_level` auto-increments: 0 (no escalation) → 1 (75% SLA) → 2 (100% breach) → 3 (supervisor escalation)
- `wip_position` enforced by WIP limit (e.g., max 5 concurrent assignments per user)

**State Transitions**:
- Pending → In Progress (user starts work) → Completed (submission) | Escalated (SLA breach)

---

### 4. MobileKanbanCard

Visual representation of assignment in Kanban board with drag state, animation queue, real-time sync status.

```typescript
@tableSchema({
  name: 'mobile_kanban_cards',
  columns: [
    { name: 'id', type: 'string', isIndexed: true },
    { name: 'assignment_id', type: 'string', isIndexed: true },
    { name: 'board_id', type: 'string', isIndexed: true }, // e.g., 'engagement-board', 'intake-board'
    { name: 'column_id', type: 'string', isIndexed: true }, // 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
    { name: 'position', type: 'number' }, // Position within column (0-based)
    { name: 'title_ar', type: 'string' },
    { name: 'title_en', type: 'string' },
    { name: 'assignee_name', type: 'string' },
    { name: 'assignee_avatar_url', type: 'string', isOptional: true },
    { name: 'priority', type: 'string' },
    { name: 'sla_deadline', type: 'number' },
    { name: 'stage_sla_deadline', type: 'number' }, // Per-stage SLA timer
    { name: 'drag_state', type: 'string' }, // 'idle' | 'dragging' | 'dropping'
    { name: 'animation_queue', type: 'string' }, // JSON array of pending animations
    { name: 'realtime_sync_status', type: 'string' }, // 'synced' | 'syncing' | 'conflict' | 'offline'
    { name: 'last_moved_by_id', type: 'string', isOptional: true },
    { name: 'last_moved_at', type: 'number', isOptional: true },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
    // Sync metadata
    { name: '_status', type: 'string' },
    { name: '_version', type: 'number' },
    { name: '_synced_at', type: 'number', isOptional: true },
  ]
})
class MobileKanbanCard extends Model {
  static table = 'mobile_kanban_cards'

  @field('column_id') columnId!: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
  @field('position') position!: number
  @field('drag_state') dragState!: 'idle' | 'dragging' | 'dropping'
  @field('realtime_sync_status') realtimeSyncStatus!: 'synced' | 'syncing' | 'conflict' | 'offline'
  @date('sla_deadline') slaDeadline!: Date
  @relation('mobile_assignments', 'assignment_id') assignment!: Relation<MobileAssignment>
}
```

**Drag & Drop Logic**:
1. **Long-press activation** (500ms): Sets `drag_state = 'dragging'`, provides haptic feedback
2. **Drag gesture**: Updates card position in real-time, highlights drop zones
3. **Drop**: Sets `drag_state = 'dropping'`, validates stage transition rules:
   - Staff members: Sequential only (To Do → In Progress → Review → Done)
   - Managers: Can skip stages
4. **Sync**: Updates `column_id`, `position`, increments `_version`, queues for backend sync
5. **Realtime update**: Supabase Realtime subscription receives other users' moves, animates card to new position

**Animation Queue**:
- Stores pending animations as JSON array: `[{type: 'move', from: 'todo', to: 'in_progress', duration: 300}, ...]`
- Animations execute sequentially to prevent visual conflicts

---

### 5. MobileNetworkNode

Entity node in relationship graph with position coordinates, cluster membership, expansion state, touch gesture handlers.

```typescript
@tableSchema({
  name: 'mobile_network_nodes',
  columns: [
    { name: 'id', type: 'string', isIndexed: true },
    { name: 'graph_id', type: 'string', isIndexed: true }, // References parent dossier/entity
    { name: 'entity_type', type: 'string' }, // 'dossier' | 'person' | 'organization' | 'engagement'
    { name: 'entity_id', type: 'string', isIndexed: true },
    { name: 'label_ar', type: 'string' },
    { name: 'label_en', type: 'string' },
    { name: 'node_type', type: 'string' }, // 'primary' | 'related' | 'indirect'
    { name: 'connection_strength', type: 'number' }, // 0.0-1.0 (edge weight)
    { name: 'position_x', type: 'number' }, // Force-directed layout X coordinate
    { name: 'position_y', type: 'number' }, // Force-directed layout Y coordinate
    { name: 'cluster_id', type: 'string', isOptional: true },
    { name: 'is_expanded', type: 'boolean' },
    { name: 'is_visible', type: 'boolean' },
    { name: 'last_activity_at', type: 'number' },
    { name: 'gesture_state', type: 'string' }, // 'idle' | 'pinching' | 'panning' | 'tapping'
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
    // Sync metadata
    { name: '_status', type: 'string' },
    { name: '_version', type: 'number' },
    { name: '_synced_at', type: 'number', isOptional: true },
  ]
})
class MobileNetworkNode extends Model {
  static table = 'mobile_network_nodes'

  @field('entity_type') entityType!: string
  @field('connection_strength') connectionStrength!: number
  @field('position_x') positionX!: number
  @field('position_y') positionY!: number
  @field('is_expanded') isExpanded!: boolean
  @field('is_visible') isVisible!: boolean
  @children('mobile_network_edges') edges!: Query<MobileNetworkEdge>
}
```

**Clustering Algorithm**:
- When node count >20: Apply k-means clustering on `(position_x, position_y)` coordinates
- Cluster size 3-7 nodes, create cluster node with badge showing count
- User taps cluster → expand with smooth zoom animation, reveal individual nodes

**Touch Gestures**:
- **Tap**: Select node, show bottom sheet with entity summary, "View Details" action
- **Long-press**: Context menu (Pin node, Hide node, View relationships)
- **Pinch-zoom**: Scale graph (0.5x - 3x), constrained to readable range
- **Pan**: Translate graph viewport, inertial scrolling with deceleration

---

### 6. MobileSyncQueue

Local queue of pending changes awaiting connectivity with retry count and conflict resolution state.

```typescript
@tableSchema({
  name: 'mobile_sync_queue',
  columns: [
    { name: 'id', type: 'string', isIndexed: true },
    { name: 'operation', type: 'string' }, // 'create' | 'update' | 'delete'
    { name: 'entity_type', type: 'string', isIndexed: true },
    { name: 'entity_id', type: 'string', isIndexed: true },
    { name: 'entity_data', type: 'string' }, // JSON serialized entity
    { name: 'retry_count', type: 'number' },
    { name: 'max_retries', type: 'number' }, // Default 3
    { name: 'last_error', type: 'string', isOptional: true },
    { name: 'conflict_state', type: 'string' }, // 'none' | 'detected' | 'resolved' | 'user_action_required'
    { name: 'priority', type: 'number' }, // 0 (low) - 10 (high), determines sync order
    { name: 'queued_at', type: 'number' },
    { name: 'last_retry_at', type: 'number', isOptional: true },
    { name: 'resolved_at', type: 'number', isOptional: true },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ]
})
class MobileSyncQueue extends Model {
  static table = 'mobile_sync_queue'

  @field('operation') operation!: 'create' | 'update' | 'delete'
  @field('entity_type') entityType!: string
  @field('entity_id') entityId!: string
  @json('entity_data', sanitizeEntity) entityData!: any
  @field('retry_count') retryCount!: number
  @field('conflict_state') conflictState!: 'none' | 'detected' | 'resolved' | 'user_action_required'
  @field('priority') priority!: number
}
```

**Sync Processing**:
1. **Queue operations**: When user performs CUD operation offline, insert to sync_queue with `priority` (intake submission = 10, Kanban move = 5)
2. **Connectivity detection**: On network state change (offline → online), trigger sync processor
3. **Priority-based processing**: Sort queue by `priority DESC, queued_at ASC`, process sequentially
4. **Retry logic**: On failure, increment `retry_count`, exponential backoff (1s, 2s, 4s, 8s), max 3 retries
5. **Conflict detection**: If server `_version` ≠ local `_version`, set `conflict_state = 'detected'`, pause queue, notify user
6. **User resolution**: Show conflict dialog, user selects version, update `conflict_state = 'resolved'`, resume queue

---

### 7. MobilePushNotification

Notification entity with category, priority level, grouping key, delivery status.

```typescript
@tableSchema({
  name: 'mobile_push_notifications',
  columns: [
    { name: 'id', type: 'string', isIndexed: true },
    { name: 'notification_id', type: 'string', isIndexed: true }, // FCM/APNS notification ID
    { name: 'category', type: 'string', isIndexed: true }, // 'assignment' | 'intake' | 'user_management' | 'kanban'
    { name: 'priority', type: 'string' }, // 'urgent' | 'high' | 'normal'
    { name: 'title_ar', type: 'string' },
    { name: 'title_en', type: 'string' },
    { name: 'body_ar', type: 'string' },
    { name: 'body_en', type: 'string' },
    { name: 'grouping_key', type: 'string', isOptional: true }, // For notification bundling
    { name: 'deep_link_url', type: 'string' }, // e.g., 'intldossier://assignment/123'
    { name: 'delivery_status', type: 'string' }, // 'pending' | 'delivered' | 'read' | 'dismissed'
    { name: 'is_actionable', type: 'boolean' }, // Has action buttons (Accept/Reject)
    { name: 'action_buttons', type: 'string', isOptional: true }, // JSON array of action configs
    { name: 'delivered_at', type: 'number', isOptional: true },
    { name: 'read_at', type: 'number', isOptional: true },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
    // Sync metadata
    { name: '_status', type: 'string' },
    { name: '_version', type: 'number' },
    { name: '_synced_at', type: 'number', isOptional: true },
  ]
})
class MobilePushNotification extends Model {
  static table = 'mobile_push_notifications'

  @field('category') category!: 'assignment' | 'intake' | 'user_management' | 'kanban'
  @field('priority') priority!: 'urgent' | 'high' | 'normal'
  @field('delivery_status') deliveryStatus!: 'pending' | 'delivered' | 'read' | 'dismissed'
  @field('is_actionable') isActionable!: boolean
  @date('delivered_at') deliveredAt?: Date
}
```

**Notification Grouping**:
- Use `grouping_key` to bundle similar notifications: `assignment-new`, `intake-approved`, `role-changed`
- If >5 notifications with same `grouping_key` within 5 minutes, create summary notification: "10 new assignments - 3 urgent"
- Summary notification expands to show individual items on tap

**Action Buttons**:
```json
// Example: Dual approval workflow notification
{
  "action_buttons": [
    {"id": "approve", "label_ar": "موافقة", "label_en": "Approve", "action": "approve_role_change"},
    {"id": "reject", "label_ar": "رفض", "label_en": "Reject", "action": "reject_role_change"}
  ]
}
```

---

### 8. MobileDraft

Locally stored draft work with auto-save timestamp and recovery mechanism.

```typescript
@tableSchema({
  name: 'mobile_drafts',
  columns: [
    { name: 'id', type: 'string', isIndexed: true },
    { name: 'draft_type', type: 'string', isIndexed: true }, // 'intake' | 'search_filter' | 'role_change'
    { name: 'user_id', type: 'string', isIndexed: true },
    { name: 'title_ar', type: 'string', isOptional: true },
    { name: 'title_en', type: 'string', isOptional: true },
    { name: 'draft_data', type: 'string' }, // JSON serialized form state
    { name: 'is_encrypted', type: 'boolean' }, // True if contains confidential data
    { name: 'auto_save_enabled', type: 'boolean' },
    { name: 'last_auto_save_at', type: 'number', isOptional: true },
    { name: 'expiry_at', type: 'number' }, // Auto-delete after 30 days
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ]
})
class MobileDraft extends Model {
  static table = 'mobile_drafts'

  @field('draft_type') draftType!: 'intake' | 'search_filter' | 'role_change'
  @json('draft_data', sanitizeDraft) draftData!: any
  @field('is_encrypted') isEncrypted!: boolean
  @field('auto_save_enabled') autoSaveEnabled!: boolean
  @date('expiry_at') expiryAt!: Date
}
```

**Auto-Save Logic**:
- Auto-save every 30 seconds when `auto_save_enabled = true`
- On app backgrounding, immediate auto-save of all unsaved drafts
- On session termination (role change, logout), encrypt confidential drafts, save to iOS Keychain/Android Keystore
- On recovery: Show "Resume draft" dialog on next login with draft preview (title, timestamp)

---

## WatermelonDB Schema Setup

### Database Configuration

```typescript
// mobile/src/database/index.ts
import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import schema from './schema'
import migrations from './migrations'
import { MobileIntakeTicket, MobileSearchIndex, MobileAssignment, MobileKanbanCard, MobileNetworkNode, MobileSyncQueue, MobilePushNotification, MobileDraft } from './models'

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true, // Use JSI for better performance on React Native 0.70+
  onSetUpError: error => {
    console.error('WatermelonDB setup error:', error)
  }
})

export const database = new Database({
  adapter,
  modelClasses: [
    MobileIntakeTicket,
    MobileSearchIndex,
    MobileAssignment,
    MobileKanbanCard,
    MobileNetworkNode,
    MobileSyncQueue,
    MobilePushNotification,
    MobileDraft,
  ],
})
```

### Indexes for Performance

```sql
-- Full-text search index for mobile_search_index
CREATE VIRTUAL TABLE mobile_search_index_fts USING fts5(
  keywords_ar, keywords_en,
  content='mobile_search_index',
  content_rowid='id'
);

-- Composite indexes for common queries
CREATE INDEX idx_assignments_user_status ON mobile_assignments(assigned_to_id, status);
CREATE INDEX idx_kanban_board_column ON mobile_kanban_cards(board_id, column_id, position);
CREATE INDEX idx_sync_queue_priority ON mobile_sync_queue(priority DESC, queued_at ASC);
CREATE INDEX idx_notifications_category_status ON mobile_push_notifications(category, delivery_status);
```

## Relationships

```typescript
// One-to-Many: MobileAssignment → MobileKanbanCard
@children('mobile_kanban_cards') kanbanCards!: Query<MobileKanbanCard>

// Many-to-Many: MobileNetworkNode ↔ MobileNetworkNode (via edges table)
@children('mobile_network_edges') edges!: Query<MobileNetworkEdge>

// One-to-One: MobileDraft → User (via user_id foreign key)
@field('user_id') userId!: string
```

## Storage Management

### Cleanup Strategy

```typescript
// Run daily at app startup
async function cleanupStaleData() {
  const database = getDatabase()
  const now = Date.now()
  const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000)

  // Delete synced records older than 90 days (except active assignments)
  await database.write(async () => {
    const staleTickets = await database.get<MobileIntakeTicket>('mobile_intake_tickets')
      .query(
        Q.where('_status', 'synced'),
        Q.where('_synced_at', Q.lt(ninetyDaysAgo))
      )
      .fetch()

    await database.batch(
      ...staleTickets.map(ticket => ticket.prepareDestroyPermanently())
    )
  })

  // Delete expired drafts
  await database.write(async () => {
    const expiredDrafts = await database.get<MobileDraft>('mobile_drafts')
      .query(Q.where('expiry_at', Q.lt(now)))
      .fetch()

    await database.batch(
      ...expiredDrafts.map(draft => draft.prepareDestroyPermanently())
    )
  })
}
```

### Storage Monitoring

```typescript
import * as FileSystem from 'expo-file-system'

async function checkStorageAvailability() {
  const freeSpace = await FileSystem.getFreeDiskStorageAsync()
  const dbSize = await getDatabaseSize()

  const maxCache = Math.min(freeSpace * 0.2, 1024 * 1024 * 1024) // 20% or 1GB max
  const minCache = 200 * 1024 * 1024 // 200MB minimum

  if (dbSize > maxCache * 0.95) {
    // Storage critical: Alert user, trigger aggressive cleanup
    showStorageCriticalAlert()
    await cleanupOldestCachedEntities()
  } else if (dbSize > maxCache * 0.8) {
    // Storage warning: Notify user, suggest manual cleanup
    showStorageWarningNotification()
  }

  return {
    freeSpace,
    dbSize,
    maxCache,
    usagePercent: (dbSize / maxCache) * 100
  }
}
```

## Migration Example

```typescript
// mobile/src/database/migrations.ts
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        // Add attachment_sync_status column to mobile_intake_tickets
        {
          type: 'add_column',
          table: 'mobile_intake_tickets',
          column: {
            name: 'attachment_sync_status',
            type: 'string',
            isOptional: true
          }
        },
        // Create index for faster attachment sync queries
        {
          type: 'sql',
          sql: `CREATE INDEX idx_intake_attachment_status ON mobile_intake_tickets(attachment_sync_status) WHERE attachment_sync_status != 'completed'`
        }
      ]
    }
  ]
})
```

## Security Considerations

### Field-Level Encryption

```typescript
// Encrypt confidential intake tickets before storing
import * as SecureStore from 'expo-secure-store'
import CryptoJS from 'crypto-js'

async function saveEncryptedIntakeTicket(ticket: MobileIntakeTicket) {
  if (ticket.sensitivity === 'confidential' || ticket.sensitivity === 'secret') {
    // Generate encryption key from platform secure storage
    let encryptionKey = await SecureStore.getItemAsync('intake_encryption_key')
    if (!encryptionKey) {
      encryptionKey = CryptoJS.lib.WordArray.random(256/8).toString()
      await SecureStore.setItemAsync('intake_encryption_key', encryptionKey)
    }

    // Encrypt sensitive fields
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify({
        title_ar: ticket.titleAr,
        title_en: ticket.titleEn,
        description_ar: ticket.descriptionAr,
        description_en: ticket.descriptionEn
      }),
      encryptionKey
    ).toString()

    // Store encrypted blob, clear plaintext fields
    await ticket.update(record => {
      record.encryptedData = encryptedData
      record.titleAr = '[ENCRYPTED]'
      record.titleEn = '[ENCRYPTED]'
      record.descriptionAr = '[ENCRYPTED]'
      record.descriptionEn = '[ENCRYPTED]'
    })
  }
}

async function decryptIntakeTicket(ticket: MobileIntakeTicket) {
  if (ticket.encryptedData) {
    // Require biometric authentication before decryption
    const biometricResult = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to view confidential intake',
      fallbackLabel: 'Use device password'
    })

    if (!biometricResult.success) {
      throw new Error('Authentication failed')
    }

    const encryptionKey = await SecureStore.getItemAsync('intake_encryption_key')
    const decryptedData = CryptoJS.AES.decrypt(ticket.encryptedData, encryptionKey!).toString(CryptoJS.enc.Utf8)

    return JSON.parse(decryptedData)
  }
}
```

## Summary

The mobile data model mirrors the Supabase PostgreSQL schema with sync metadata for offline-first operation. WatermelonDB provides:

- **Offline-first storage**: All entities cached locally for read operations
- **Sync protocol**: Incremental sync with optimistic locking, hybrid conflict resolution
- **Performance**: Indexed queries, FTS5 search, lazy loading for 1000+ entities
- **Security**: Field-level encryption for confidential data using platform secure storage
- **Storage management**: Automatic cleanup of stale data (>90 days) with dynamic storage limits
