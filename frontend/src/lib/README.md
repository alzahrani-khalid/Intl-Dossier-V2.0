# RealtimeManager

**Purpose**: Production-ready Supabase Realtime connection manager with automatic reconnection, offline queuing, and presence tracking.

---

## Overview

`RealtimeManager` is a robust wrapper around Supabase Realtime channels that provides enterprise-grade connection management for real-time collaborative features. It handles the complexities of WebSocket connections, network interruptions, and presence synchronization, allowing you to focus on building features.

**Key Features**:
- ✅ **Automatic Reconnection**: Exponential backoff strategy with configurable retry limits
- ✅ **Offline Support**: Message queueing when offline, automatic flush on reconnection
- ✅ **Connection Health Monitoring**: 30-second heartbeat checks with auto-recovery
- ✅ **Presence Tracking**: Built-in user presence with status updates (online, idle, typing, away)
- ✅ **Message Deduplication**: Prevents duplicate broadcasts within 5-second window
- ✅ **Network State Awareness**: Listens to browser online/offline events
- ✅ **Singleton Pattern**: Single instance manages all channels throughout the app
- ✅ **Type-Safe**: Full TypeScript support with comprehensive interfaces

---

## Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                      RealtimeManager (Singleton)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────┐  ┌──────────────┐  ┌────────────────┐        │
│  │  Channel Map  │  │ Message Queue│  │ Reconnect State│        │
│  │               │  │              │  │                │        │
│  │ channel1 ──►  │  │ channel1 ──► │  │ attempts: 0-5  │        │
│  │ channel2 ──►  │  │ channel2 ──► │  │ timeouts: Map  │        │
│  │ channel3 ──►  │  │ channel3 ──► │  │ delays: 1s-32s │        │
│  └───────────────┘  └──────────────┘  └────────────────┘        │
│                                                                   │
│  ┌───────────────────────────────────────────────────────┐      │
│  │            Network Monitoring & Heartbeat             │      │
│  │  • window.addEventListener('online')                  │      │
│  │  • window.addEventListener('offline')                 │      │
│  │  • 30-second heartbeat interval                       │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │      Supabase Realtime Channels       │
        ├───────────────────────────────────────┤
        │  • Presence (sync, join, leave)       │
        │  • Broadcast (custom events)          │
        │  • Postgres Changes (database sync)   │
        └───────────────────────────────────────┘
```

### Connection Lifecycle

```
1. Subscribe
   ├─ Create channel with config
   ├─ Setup presence/broadcast/database handlers
   ├─ Subscribe to Supabase Realtime
   └─ Store in channels Map

2. Connection Monitoring
   ├─ Heartbeat checks every 30s
   ├─ Detect errored/closed channels
   └─ Trigger auto-reconnection

3. Offline Handling
   ├─ Detect browser offline event
   ├─ Queue outgoing messages
   └─ Wait for reconnection

4. Reconnection Strategy
   ├─ Attempt 1: 1s delay
   ├─ Attempt 2: 2s delay
   ├─ Attempt 3: 4s delay
   ├─ Attempt 4: 8s delay
   ├─ Attempt 5: 16s delay
   └─ Give up after 5 attempts

5. Back Online
   ├─ Detect browser online event
   ├─ Reconnect all channels
   └─ Flush queued messages

6. Unsubscribe
   ├─ Unsubscribe from channel
   ├─ Clear reconnect timeouts
   ├─ Clear message queue
   └─ Remove from channels Map
```

---

## Key Concepts

### 1. Singleton Pattern

RealtimeManager uses a singleton instance to ensure:
- **Single source of truth** for all realtime connections
- **Shared connection pool** across the entire application
- **Consistent state management** for network monitoring
- **Memory efficiency** - no duplicate channel subscriptions

```typescript
// Singleton instance - use this throughout your app
import { realtimeManager } from '@/lib/realtime'

// Convenience functions that use the singleton internally
import { subscribeToChannel, broadcastMessage } from '@/lib/realtime'
```

### 2. Offline Message Queueing

When the browser goes offline (or connection is lost):
- Outgoing messages are **queued in memory** (per channel)
- Messages are **automatically flushed** when connection is restored
- No messages are lost during temporary disconnections

**Implementation**:
```typescript
private messageQueue: Map<string, Array<{ event: string; payload: any }>> = new Map()

broadcast(channelName: string, event: string, payload: any) {
  if (!this.isOnline) {
    this.queueMessage(channelName, event, payload)
    return Promise.resolve()
  }
  // ... send immediately
}
```

### 3. Exponential Backoff Reconnection

When a channel errors or times out, RealtimeManager attempts reconnection with increasing delays:

| Attempt | Delay Formula          | Actual Delay |
|---------|------------------------|--------------|
| 1       | 1000ms × 2^0           | 1 second     |
| 2       | 1000ms × 2^1           | 2 seconds    |
| 3       | 1000ms × 2^2           | 4 seconds    |
| 4       | 1000ms × 2^3           | 8 seconds    |
| 5       | 1000ms × 2^4           | 16 seconds   |
| 6+      | Give up (max 5 attempts)| -            |

**Why exponential backoff?**
- Prevents overwhelming the server with rapid reconnection attempts
- Gives time for network/server issues to resolve
- Industry-standard pattern for distributed systems

### 4. Presence Tracking

Presence allows tracking who is currently active on a channel:

**Use Cases**:
- **Collaborative editing**: Show active users viewing/editing a document
- **Online indicators**: Display "who's online" in dossier views
- **Cursor sharing**: Real-time cursor positions in collaborative tools
- **Activity status**: Online, idle, typing, away indicators

**Data Structure**:
```typescript
interface PresenceUser {
  id: string                              // User identifier
  email: string                           // User email
  name?: string                           // Display name
  avatar?: string                         // Avatar URL
  color?: string                          // UI color (cursors, highlights)
  cursor?: { x: number; y: number }       // Cursor position
  selection?: string                      // Selected text
  status?: 'online' | 'idle' | 'typing' | 'away'
  lastSeen?: Date                         // Auto-updated timestamp
}
```

### 5. Message Deduplication

Prevents duplicate message processing when broadcasts are received multiple times:

**Implementation**:
- Each broadcast creates a unique ID: `${event}-${JSON.stringify(payload)}-${Date.now()}`
- ID is stored in a `Set` for 5 seconds
- Duplicate messages within 5-second window are ignored
- Old IDs are automatically cleaned up after 5 seconds

---

## Usage Examples

### Example 1: Basic Channel Subscription

Subscribe to a channel and listen for database changes:

```typescript
import { subscribeToChannel } from '@/lib/realtime'

function DossierList() {
  useEffect(() => {
    const channel = subscribeToChannel({
      channel: 'dossiers-list',
      onDatabaseChange: (payload) => {
        console.log('Database change:', payload)

        if (payload.eventType === 'INSERT') {
          // Handle new dossier
          queryClient.invalidateQueries({ queryKey: ['dossiers'] })
        }

        if (payload.eventType === 'UPDATE') {
          // Update existing dossier in cache
          queryClient.setQueryData(['dossier', payload.new.id], payload.new)
        }
      },
    })

    return () => {
      unsubscribeFromChannel('dossiers-list')
    }
  }, [])

  // ... component JSX
}
```

### Example 2: Real-Time Notifications with Broadcast

Send and receive custom events via broadcast:

```typescript
import { subscribeToChannel, broadcastMessage } from '@/lib/realtime'
import { useQueryClient } from '@tanstack/react-query'

function useRealtimeNotifications() {
  const queryClient = useQueryClient()
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const channel = subscribeToChannel({
      channel: 'notifications',
      onBroadcast: (event, payload) => {
        switch (event) {
          case 'notification.created':
            // Add to local state
            setNotifications((prev) => [payload.notification, ...prev])
            // Invalidate server cache
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            // Show toast
            toast.info(payload.notification.message)
            break

          case 'notification.read':
            // Update read status locally
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === payload.notificationId ? { ...n, read: true } : n
              )
            )
            break
        }
      },
    })

    return () => unsubscribeFromChannel('notifications')
  }, [queryClient])

  const markAsRead = (notificationId: string) => {
    // Broadcast to all connected clients
    broadcastMessage('notifications', 'notification.read', { notificationId })
  }

  return { notifications, markAsRead }
}
```

### Example 3: Collaborative Editing with Presence

Track users viewing/editing a document:

```typescript
import { subscribeToChannel, trackUserPresence, updateUserPresence } from '@/lib/realtime'
import type { PresenceUser } from '@/lib/realtime'

function CollaborativeEditor({ documentId }: { documentId: string }) {
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([])
  const { user } = useAuth()

  useEffect(() => {
    const channelName = `document:${documentId}`

    const channel = subscribeToChannel({
      channel: channelName,
      onPresenceSync: (state) => {
        // Convert presence state to array of users
        const users = Object.values(state).flat() as PresenceUser[]
        setActiveUsers(users)
      },
      onPresenceJoin: (state) => {
        const newUsers = Object.values(state).flat() as PresenceUser[]
        toast.success(`${newUsers[0]?.name || 'Someone'} joined the document`)
      },
      onPresenceLeave: (state) => {
        const leftUsers = Object.values(state).flat() as PresenceUser[]
        toast.info(`${leftUsers[0]?.name || 'Someone'} left the document`)
      },
    })

    // Track current user's presence
    trackUserPresence(channelName, {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      color: generateUserColor(user.id),
      status: 'online',
    })

    return () => unsubscribeFromChannel(channelName)
  }, [documentId, user])

  const handleMouseMove = (e: React.MouseEvent) => {
    const channelName = `document:${documentId}`
    updateUserPresence(channelName, {
      cursor: { x: e.clientX, y: e.clientY },
    })
  }

  const handleTyping = () => {
    const channelName = `document:${documentId}`
    updateUserPresence(channelName, { status: 'typing' })
  }

  return (
    <div onMouseMove={handleMouseMove}>
      <ActiveUsersList users={activeUsers} />
      <Editor onInput={handleTyping} />
      <Cursors users={activeUsers} />
    </div>
  )
}
```

### Example 4: Commitment Status Updates

Real-time commitment tracking across team members:

```typescript
import { subscribeToChannel, broadcastMessage } from '@/lib/realtime'

function useCommitmentTracking(dossierId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = subscribeToChannel({
      channel: `dossier:${dossierId}:commitments`,
      onBroadcast: (event, payload) => {
        if (event === 'commitment.status_changed') {
          // Update commitment in cache
          queryClient.setQueryData(
            ['commitment', payload.commitmentId],
            (old: Commitment) => ({
              ...old,
              status: payload.newStatus,
              updated_at: payload.timestamp,
            })
          )

          // Invalidate dossier stats to reflect updated counts
          queryClient.invalidateQueries({
            queryKey: ['dossierStats', dossierId],
          })

          // Show notification
          toast.success(
            `Commitment "${payload.title}" updated to ${payload.newStatus}`
          )
        }
      },
    })

    return () => unsubscribeFromChannel(`dossier:${dossierId}:commitments`)
  }, [dossierId, queryClient])

  const updateCommitmentStatus = async (
    commitmentId: string,
    newStatus: CommitmentStatus
  ) => {
    // Update in database
    await updateCommitmentMutation.mutateAsync({ id: commitmentId, status: newStatus })

    // Broadcast to all team members
    await broadcastMessage(`dossier:${dossierId}:commitments`, 'commitment.status_changed', {
      commitmentId,
      newStatus,
      title: commitment.title,
      timestamp: new Date().toISOString(),
    })
  }

  return { updateCommitmentStatus }
}
```

### Example 5: Dossier Activity Feed

Real-time activity timeline for dossier updates:

```typescript
import { subscribeToChannel } from '@/lib/realtime'
import type { RealtimeConfig } from '@/lib/realtime'

function DossierActivityFeed({ dossierId }: { dossierId: string }) {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    const config: RealtimeConfig = {
      channel: `dossier:${dossierId}:activity`,

      // Listen to database changes (commitments, documents, relationships)
      onDatabaseChange: (payload) => {
        const activity: Activity = {
          id: crypto.randomUUID(),
          type: payload.eventType,
          table: payload.table,
          timestamp: new Date(),
          data: payload.new || payload.old,
        }

        setActivities((prev) => [activity, ...prev])
      },

      // Listen to custom broadcast events (comments, mentions, etc.)
      onBroadcast: (event, payload) => {
        if (event === 'comment.created') {
          const activity: Activity = {
            id: crypto.randomUUID(),
            type: 'COMMENT',
            timestamp: new Date(),
            data: payload,
          }
          setActivities((prev) => [activity, ...prev])
        }
      },
    }

    const channel = subscribeToChannel(config)

    return () => unsubscribeFromChannel(`dossier:${dossierId}:activity`)
  }, [dossierId])

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Recent Activity</h2>
      <div className="space-y-2">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  )
}
```

### Example 6: Health Score Dashboard with Live Updates

Real-time health score monitoring across all dossiers:

```typescript
import { subscribeToChannel } from '@/lib/realtime'
import { useDashboardHealthAggregations } from '@/hooks/useDashboardHealthAggregations'

function HealthScoreDashboard() {
  const { data: aggregations, isLoading } = useDashboardHealthAggregations('region')
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = subscribeToChannel({
      channel: 'health-scores-global',
      onBroadcast: (event, payload) => {
        if (event === 'health_score.recalculated') {
          // Invalidate dashboard aggregations
          queryClient.invalidateQueries({
            queryKey: ['dashboardHealthAggregations'],
          })

          // Update specific dossier stats
          queryClient.setQueryData(
            ['dossierStats', payload.dossierId],
            (old: DossierStats) => ({
              ...old,
              health_score: payload.newScore,
              health_grade: payload.newGrade,
            })
          )
        }
      },
    })

    return () => unsubscribeFromChannel('health-scores-global')
  }, [queryClient])

  if (isLoading) return <SkeletonLoader />

  return <RelationshipHealthChart aggregations={aggregations} />
}
```

---

## Best Practices

### 1. Channel Naming Conventions

Use consistent, descriptive channel names:

```typescript
// ✅ Good: Specific, hierarchical, descriptive
'dossier:123:commitments'
'document:456:presence'
'user:789:notifications'
'global:health-scores'

// ❌ Bad: Generic, unclear scope
'channel1'
'updates'
'realtime'
```

### 2. Cleanup on Unmount

**Always** unsubscribe when components unmount to prevent memory leaks:

```typescript
useEffect(() => {
  const channel = subscribeToChannel({ /* ... */ })

  // Cleanup function
  return () => {
    unsubscribeFromChannel(channelName)
  }
}, [dependencies])
```

### 3. Cache Invalidation Strategy

Coordinate realtime updates with TanStack Query cache:

```typescript
// Pattern 1: Invalidate to refetch from server
onBroadcast: (event, payload) => {
  queryClient.invalidateQueries({ queryKey: ['dossiers'] })
}

// Pattern 2: Optimistic update (immediate UI feedback)
onBroadcast: (event, payload) => {
  queryClient.setQueryData(['dossier', payload.id], payload)
}

// Pattern 3: Combined (optimistic + eventual consistency)
onBroadcast: (event, payload) => {
  // Immediate update
  queryClient.setQueryData(['dossier', payload.id], payload)
  // Background refetch for consistency
  queryClient.invalidateQueries({ queryKey: ['dossier', payload.id] })
}
```

### 4. Error Handling

Handle edge cases gracefully:

```typescript
subscribeToChannel({
  channel: 'my-channel',
  onBroadcast: (event, payload) => {
    try {
      // Process payload
      processMessage(payload)
    } catch (error) {
      console.error('Failed to process message:', error)
      // Log to monitoring service
      Sentry.captureException(error)
      // Show user-friendly error
      toast.error('Failed to process update')
    }
  },
})
```

### 5. Presence Updates Throttling

Avoid flooding the network with presence updates:

```typescript
import { throttle } from 'lodash-es'

const throttledPresenceUpdate = throttle(
  (channelName: string, cursor: { x: number; y: number }) => {
    updateUserPresence(channelName, { cursor })
  },
  100 // Update at most every 100ms
)

<div onMouseMove={(e) => {
  throttledPresenceUpdate(channelName, { x: e.clientX, y: e.clientY })
}}>
```

### 6. Monitor Channel Health

Check connection status before critical operations:

```typescript
import { realtimeManager } from '@/lib/realtime'

const sendCriticalUpdate = async () => {
  if (!realtimeManager.isChannelSubscribed('my-channel')) {
    toast.warning('Connection lost. Update will be sent when reconnected.')
    // Fall back to HTTP request
    await fetch('/api/update', { /* ... */ })
    return
  }

  await broadcastMessage('my-channel', 'update', data)
}
```

### 7. Leverage TypeScript

Use type-safe event payloads:

```typescript
// Define event types
type CommitmentEvent =
  | { type: 'status_changed'; commitmentId: string; newStatus: string }
  | { type: 'deadline_updated'; commitmentId: string; newDeadline: string }
  | { type: 'assigned'; commitmentId: string; assigneeId: string }

subscribeToChannel({
  channel: 'commitments',
  onBroadcast: (event, payload: CommitmentEvent) => {
    switch (payload.type) {
      case 'status_changed':
        handleStatusChange(payload.commitmentId, payload.newStatus)
        break
      case 'deadline_updated':
        handleDeadlineUpdate(payload.commitmentId, payload.newDeadline)
        break
      case 'assigned':
        handleAssignment(payload.commitmentId, payload.assigneeId)
        break
    }
  },
})
```

---

## Troubleshooting

### Issue: Channel Not Receiving Messages

**Symptoms**:
- Messages sent but not received
- Database changes not triggering callbacks

**Checklist**:
1. ✅ Verify channel is subscribed: `realtimeManager.isChannelSubscribed('channel-name')`
2. ✅ Check channel state: `realtimeManager.getChannelState('channel-name')` (should be `'joined'`)
3. ✅ Confirm Supabase Realtime is enabled in project settings
4. ✅ Verify RLS policies allow current user to access data
5. ✅ Check browser console for WebSocket errors
6. ✅ Ensure channel name is consistent between sender and receiver

**Solution**:
```typescript
// Debug channel state
useEffect(() => {
  const checkHealth = setInterval(() => {
    const state = realtimeManager.getChannelState('my-channel')
    const subscribed = realtimeManager.isChannelSubscribed('my-channel')
    console.log('Channel state:', state, 'Subscribed:', subscribed)

    if (state === 'errored' || state === 'closed') {
      console.error('Channel is in error state. Reconnecting...')
      unsubscribeFromChannel('my-channel')
      subscribeToChannel({ /* ... */ })
    }
  }, 5000)

  return () => clearInterval(checkHealth)
}, [])
```

### Issue: Duplicate Messages

**Symptoms**:
- Same broadcast received multiple times
- Notifications appearing twice

**Cause**:
- Multiple subscriptions to the same channel
- Deduplication not working (unlikely - built-in)

**Solution**:
```typescript
// Ensure only one subscription exists
useEffect(() => {
  // Unsubscribe first if exists
  if (realtimeManager.isChannelSubscribed('my-channel')) {
    unsubscribeFromChannel('my-channel')
  }

  const channel = subscribeToChannel({ /* ... */ })

  return () => {
    unsubscribeFromChannel('my-channel')
  }
}, [/* stable dependencies only */])
```

### Issue: Presence Not Syncing

**Symptoms**:
- `onPresenceSync` not firing
- Active users list is empty

**Checklist**:
1. ✅ Verify `trackPresence()` was called after channel subscription
2. ✅ Check that presence key is set in channel config
3. ✅ Ensure user data is valid (non-null `id` and `email`)

**Solution**:
```typescript
useEffect(() => {
  const channel = subscribeToChannel({
    channel: 'my-channel',
    onPresenceSync: (state) => {
      console.log('Presence synced:', state)
      const users = Object.values(state).flat()
      setActiveUsers(users)
    },
  })

  // Wait for channel to be subscribed before tracking presence
  const intervalId = setInterval(() => {
    if (realtimeManager.isChannelSubscribed('my-channel')) {
      trackUserPresence('my-channel', {
        id: user.id,
        email: user.email,
        status: 'online',
      })
      clearInterval(intervalId)
    }
  }, 500)

  return () => {
    clearInterval(intervalId)
    unsubscribeFromChannel('my-channel')
  }
}, [user])
```

### Issue: Messages Lost During Offline Period

**Symptoms**:
- Messages sent while offline never arrive
- Queue not flushing

**Explanation**:
- RealtimeManager queues **outgoing** messages only
- **Incoming** messages during offline periods are NOT queued (limitation of WebSockets)

**Workaround**:
```typescript
// When coming back online, refetch critical data
window.addEventListener('online', () => {
  // Invalidate queries to fetch latest data
  queryClient.invalidateQueries({ queryKey: ['dossiers'] })
  queryClient.invalidateQueries({ queryKey: ['commitments'] })

  toast.success('Back online. Data refreshed.')
})
```

### Issue: Exponential Backoff Not Reconnecting

**Symptoms**:
- Channel stuck in `errored` state
- Reconnection attempts exhausted

**Cause**:
- Max reconnection attempts (5) exceeded
- Persistent server/network issue

**Solution**:
```typescript
// Manual recovery
const forceReconnect = () => {
  // Reset reconnection attempts
  realtimeManager['reconnectAttempts'].set('my-channel', 0)

  // Unsubscribe and resubscribe
  unsubscribeFromChannel('my-channel')
  subscribeToChannel({ /* ... */ })
}

// Add manual reconnect button in UI
<Button onClick={forceReconnect}>Reconnect to Real-time</Button>
```

### Issue: High Memory Usage

**Symptoms**:
- Browser tab consuming excessive memory
- Performance degradation over time

**Cause**:
- Channels not being cleaned up
- Message queues growing indefinitely

**Solution**:
```typescript
// Always clean up channels on unmount
useEffect(() => {
  const channel = subscribeToChannel({ /* ... */ })

  return () => {
    unsubscribeFromChannel('my-channel')
  }
}, [])

// For app-level cleanup (e.g., logout)
const handleLogout = () => {
  realtimeManager.unsubscribeAll() // Unsubscribe from all channels
  // ... rest of logout logic
}
```

### Debug Mode

Enable verbose logging for troubleshooting:

```typescript
// Add to RealtimeManager for debugging (temporary)
subscribe(config: RealtimeConfig): RealtimeChannel {
  console.log(`[RealtimeManager] Subscribing to channel: ${config.channel}`)

  // ... existing code ...

  channel.subscribe((status, err) => {
    console.log(`[RealtimeManager] Channel ${config.channel} status:`, status, err)
    // ... existing code ...
  })

  return channel
}
```

---

## API Reference

### Core Methods

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `subscribe(config)` | Subscribe to a channel | `RealtimeConfig` | `RealtimeChannel` |
| `unsubscribe(channelName)` | Unsubscribe from a channel | `string` | `void` |
| `unsubscribeAll()` | Unsubscribe from all channels | - | `void` |
| `broadcast(channelName, event, payload)` | Send message to channel | `string, string, any` | `Promise<void>` |
| `trackPresence(channelName, user)` | Track user presence | `string, PresenceUser` | `Promise<void>` |
| `updatePresence(channelName, updates)` | Update user presence | `string, Partial<PresenceUser>` | `Promise<void>` |
| `getPresenceState(channelName)` | Get current presence state | `string` | `RealtimePresenceState` |
| `getChannelState(channelName)` | Get channel connection state | `string` | `string \| undefined` |
| `isChannelSubscribed(channelName)` | Check if channel is active | `string` | `boolean` |
| `destroy()` | Clean up all resources | - | `void` |

### Convenience Functions

```typescript
// Import these for common operations
import {
  subscribeToChannel,       // Same as realtimeManager.subscribe()
  unsubscribeFromChannel,    // Same as realtimeManager.unsubscribe()
  broadcastMessage,          // Same as realtimeManager.broadcast()
  trackUserPresence,         // Same as realtimeManager.trackPresence()
  updateUserPresence,        // Same as realtimeManager.updatePresence()
} from '@/lib/realtime'
```

---

## Performance Considerations

### Connection Limits

- **Supabase Free Tier**: Max 200 concurrent connections
- **Pro Tier**: Max 500 concurrent connections
- **Each browser tab** = 1 connection per subscribed channel

**Recommendation**: Share channels across features when possible

```typescript
// ✅ Good: One channel for all dossier updates
subscribeToChannel({
  channel: `dossier:${dossierId}`,
  onBroadcast: (event, payload) => {
    switch (event) {
      case 'commitment.updated': /* ... */
      case 'document.uploaded': /* ... */
      case 'relationship.created': /* ... */
    }
  },
})

// ❌ Bad: Separate channel for each feature
subscribeToChannel({ channel: `dossier:${dossierId}:commitments` })
subscribeToChannel({ channel: `dossier:${dossierId}:documents` })
subscribeToChannel({ channel: `dossier:${dossierId}:relationships` })
```

### Message Size

- **Max broadcast payload**: 250 KB
- **Large payloads**: Store in database, broadcast only IDs/references

```typescript
// ✅ Good: Broadcast reference, fetch full data
broadcastMessage('channel', 'document.uploaded', { documentId: '123' })

// ❌ Bad: Broadcast entire document
broadcastMessage('channel', 'document.uploaded', { document: largeDocumentObject })
```

---

## Related Documentation

- **Supabase Realtime Docs**: https://supabase.com/docs/guides/realtime
- **TanStack Query Integration**: `frontend/src/hooks/README.md`
- **Notification System**: `frontend/src/components/notifications/README.md`
- **Project Guidelines**: `CLAUDE.md`

---

## License

Part of the Intl-Dossier V2.0 project. See root `LICENSE` file for details.
