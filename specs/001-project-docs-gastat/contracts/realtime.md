# WebSocket Real-time Contracts

**Version**: 1.0.0
**Date**: 2025-09-25
**Protocol**: WebSocket (wss://)
**Base URL**: `wss://realtime.intl-dossier.gastat.gov.sa/v1`

## Connection Management

### Authentication
```typescript
// Initial connection with JWT token
const ws = new WebSocket('wss://realtime.intl-dossier.gastat.gov.sa/v1');

// First message must be authentication
ws.send(JSON.stringify({
  type: 'auth',
  payload: {
    token: 'JWT_TOKEN_HERE'
  }
}));

// Server response
{
  type: 'auth_success',
  payload: {
    user_id: 'uuid',
    session_id: 'uuid',
    permissions: string[]
  }
}
```

### Heartbeat
```typescript
// Client must send heartbeat every 30 seconds
{
  type: 'ping',
  timestamp: 1234567890
}

// Server response
{
  type: 'pong',
  timestamp: 1234567891
}
```

## Channel Subscriptions

### Subscribe to Channels
```typescript
// Subscribe to entity updates
{
  type: 'subscribe',
  channel: 'dossier:country:SA',  // or 'dossier:mou:uuid'
  params: {
    include_presence: true
  }
}

// Success response
{
  type: 'subscribed',
  channel: 'dossier:country:SA',
  presence: {
    count: 3,
    users: [
      { user_id: 'uuid', name: 'John Doe', role: 'editor' }
    ]
  }
}
```

### Unsubscribe
```typescript
{
  type: 'unsubscribe',
  channel: 'dossier:country:SA'
}
```

## Real-time Events

### 1. Dossier Updates
```typescript
// Server broadcast when dossier changes
{
  type: 'dossier_update',
  channel: 'dossier:country:SA',
  payload: {
    entity_type: 'country',
    entity_id: 'uuid',
    operation: 'update',  // create, update, delete
    fields_changed: ['cooperation_areas', 'relationship_status'],
    updated_by: {
      user_id: 'uuid',
      name: 'Jane Smith'
    },
    timestamp: 1234567890
  }
}
```

### 2. Collaborative Editing
```typescript
// Send edit operation
{
  type: 'edit_operation',
  channel: 'document:uuid',
  payload: {
    operation_type: 'insert',  // insert, delete, format
    position: 150,
    content: 'New text',
    version: 42
  }
}

// Broadcast to other users
{
  type: 'remote_operation',
  channel: 'document:uuid',
  payload: {
    user_id: 'uuid',
    user_name: 'John Doe',
    operation_type: 'insert',
    position: 150,
    content: 'New text',
    version: 43
  }
}

// Cursor position updates
{
  type: 'cursor_position',
  channel: 'document:uuid',
  payload: {
    user_id: 'uuid',
    position: 150,
    selection_length: 10
  }
}
```

### 3. Presence Tracking
```typescript
// User joins channel
{
  type: 'presence_join',
  channel: 'dossier:country:SA',
  payload: {
    user_id: 'uuid',
    name: 'Ahmed Al-Rashid',
    avatar: 'url',
    status: 'online',  // online, away, busy
    activity: 'viewing'  // viewing, editing, commenting
  }
}

// User leaves channel
{
  type: 'presence_leave',
  channel: 'dossier:country:SA',
  payload: {
    user_id: 'uuid'
  }
}

// User activity change
{
  type: 'presence_update',
  channel: 'dossier:country:SA',
  payload: {
    user_id: 'uuid',
    activity: 'editing',
    field: 'cooperation_areas'
  }
}
```

### 4. Notifications
```typescript
// Real-time notification
{
  type: 'notification',
  priority: 'high',  // low, medium, high, urgent
  payload: {
    id: 'uuid',
    title: {
      en: 'MoU Expiring Soon',
      ar: 'مذكرة التفاهم على وشك الانتهاء'
    },
    message: {
      en: 'MoU with UN Statistics Division expires in 30 days',
      ar: 'تنتهي مذكرة التفاهم مع شعبة الإحصاءات بالأمم المتحدة خلال 30 يومًا'
    },
    entity_type: 'mou',
    entity_id: 'uuid',
    action_required: true,
    actions: [
      {
        label: 'Review',
        url: '/mous/uuid/review'
      }
    ]
  }
}
```

### 5. Task Updates
```typescript
// Task status change
{
  type: 'task_update',
  channel: 'workspace:uuid',
  payload: {
    task_id: 'uuid',
    previous_status: 'pending',
    new_status: 'in_progress',
    assigned_to: 'uuid',
    updated_by: 'uuid',
    timestamp: 1234567890
  }
}

// Task assignment
{
  type: 'task_assigned',
  channel: 'user:uuid',
  payload: {
    task_id: 'uuid',
    title: 'Prepare UN Statistics Division Brief',
    assigned_by: {
      user_id: 'uuid',
      name: 'Sarah Johnson'
    },
    due_date: '2025-10-15',
    priority: 'high'
  }
}
```

### 6. AI Brief Generation Progress
```typescript
// Brief generation started
{
  type: 'brief_generation_started',
  request_id: 'uuid',
  payload: {
    type: 'meeting',
    entity_id: 'uuid',
    estimated_time: 30000  // milliseconds
  }
}

// Progress updates
{
  type: 'brief_generation_progress',
  request_id: 'uuid',
  payload: {
    stage: 'analyzing',  // analyzing, generating, reviewing, finalizing
    progress: 45,  // percentage
    message: 'Analyzing historical interactions...'
  }
}

// Generation complete
{
  type: 'brief_generation_complete',
  request_id: 'uuid',
  payload: {
    brief_id: 'uuid',
    generation_time: 28500,
    confidence_score: 0.92
  }
}

// Generation failed
{
  type: 'brief_generation_failed',
  request_id: 'uuid',
  payload: {
    error: 'AI service temporarily unavailable',
    fallback_available: true
  }
}
```

### 7. Commitment Alerts
```typescript
// Commitment deadline approaching
{
  type: 'commitment_alert',
  priority: 'high',
  payload: {
    commitment_id: 'uuid',
    mou_id: 'uuid',
    title: 'Data submission deadline approaching',
    days_until_deadline: 7,
    responsible_department: 'International Relations',
    alert_level: 1  // 1=first alert, 2=second, 3=escalated
  }
}
```

### 8. Relationship Health Alerts
```typescript
// Relationship health status change
{
  type: 'relationship_health_change',
  channel: 'relationship:uuid',
  payload: {
    relationship_id: 'uuid',
    previous_status: 'healthy',
    new_status: 'at_risk',
    score_change: -15,
    current_score: 58,
    trigger: 'no_interaction_90_days',
    recommendations: [
      'Schedule bilateral meeting',
      'Review pending commitments'
    ]
  }
}
```

## Error Handling

### Error Messages
```typescript
// Generic error format
{
  type: 'error',
  error_code: 'SUBSCRIPTION_FAILED',
  message: 'Insufficient permissions to subscribe to channel',
  channel: 'dossier:secret:xyz',
  timestamp: 1234567890
}

// Common error codes
enum ErrorCode {
  AUTH_FAILED = 'AUTH_FAILED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  SUBSCRIPTION_FAILED = 'SUBSCRIPTION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_MESSAGE_FORMAT = 'INVALID_MESSAGE_FORMAT',
  CHANNEL_NOT_FOUND = 'CHANNEL_NOT_FOUND',
  VERSION_CONFLICT = 'VERSION_CONFLICT'
}
```

## Rate Limiting

```typescript
// Rate limit warning
{
  type: 'rate_limit_warning',
  payload: {
    current_rate: 95,  // messages per minute
    limit: 100,
    reset_in: 45  // seconds
  }
}

// Rate limit exceeded
{
  type: 'rate_limit_exceeded',
  payload: {
    retry_after: 60,  // seconds
    limit: 100
  }
}
```

## Connection States

```typescript
enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATED = 'authenticated',
  RECONNECTING = 'reconnecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

// State change notification
{
  type: 'connection_state',
  state: 'authenticated',
  session_id: 'uuid',
  reconnect_count: 0
}
```

## Channel Patterns

### Channel Naming Convention
- `dossier:{type}:{id}` - Entity updates (e.g., `dossier:country:SA`)
- `document:{id}` - Document collaboration
- `workspace:{id}` - Workspace activity
- `user:{id}` - User-specific notifications
- `relationship:{id}` - Relationship monitoring
- `global` - System-wide announcements

### Permission Levels
- `read` - Can subscribe and receive updates
- `write` - Can send messages to channel
- `admin` - Can manage channel settings

## Client SDK Example

```typescript
class DossierRealtimeClient {
  private ws: WebSocket;
  private subscriptions: Map<string, Subscription>;
  private messageQueue: Message[];

  constructor(token: string) {
    this.connect(token);
    this.setupHeartbeat();
    this.setupReconnection();
  }

  subscribe(channel: string, callbacks: {
    onMessage?: (msg: Message) => void;
    onPresence?: (presence: Presence) => void;
    onError?: (error: Error) => void;
  }): Subscription {
    // Implementation
  }

  send(channel: string, message: any): Promise<void> {
    // Implementation with automatic retry
  }

  presence(channel: string): PresenceState {
    // Get current presence state
  }
}

// Usage
const client = new DossierRealtimeClient(authToken);

const subscription = client.subscribe('dossier:country:SA', {
  onMessage: (msg) => {
    console.log('Dossier updated:', msg);
  },
  onPresence: (presence) => {
    console.log('Users viewing:', presence.users);
  }
});

// Clean up
subscription.unsubscribe();
```

## Security Considerations

1. **Authentication**: All connections must be authenticated with valid JWT
2. **Authorization**: Channel subscriptions checked against user permissions
3. **Data Classification**: Channels respect document classification levels
4. **Encryption**: All WebSocket connections use TLS 1.3
5. **Rate Limiting**: Per-user rate limits to prevent abuse
6. **Input Validation**: All messages validated before processing
7. **Audit Logging**: All real-time events logged for compliance

---

*This contract ensures real-time collaboration features work seamlessly while maintaining security and performance standards.*