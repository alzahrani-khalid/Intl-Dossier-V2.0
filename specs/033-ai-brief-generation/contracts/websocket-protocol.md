# WebSocket Protocol: AI Chat (Mobile)

**Feature Branch**: `033-ai-brief-generation`

## Connection

### Endpoint

```
wss://{host}/api/ai/ws-chat
```

### Authentication

Include JWT token as query parameter:

```
wss://api.example.com/api/ai/ws-chat?token={jwt_token}
```

### Connection Headers

```
Sec-WebSocket-Protocol: chat-v1
```

## Message Types

### Client → Server Messages

#### 1. Chat Message

```json
{
  "type": "message",
  "id": "msg_uuid",
  "payload": {
    "content": "What commitments do we have with Japan?",
    "context": {
      "current_page": "/dossiers/uuid",
      "selected_entity_id": "uuid"
    }
  }
}
```

#### 2. Cancel Request

```json
{
  "type": "cancel",
  "id": "msg_uuid",
  "payload": {
    "message_id": "original_msg_uuid"
  }
}
```

#### 3. Ping (Keepalive)

```json
{
  "type": "ping",
  "id": "ping_uuid",
  "timestamp": 1701792000000
}
```

### Server → Client Messages

#### 1. Connection Acknowledged

```json
{
  "type": "connected",
  "id": "conn_uuid",
  "payload": {
    "session_id": "session_uuid",
    "user_id": "user_uuid",
    "features_enabled": {
      "chat": true,
      "brief_generation": true,
      "entity_linking": true
    }
  }
}
```

#### 2. Stream Start

```json
{
  "type": "stream_start",
  "id": "response_uuid",
  "payload": {
    "in_response_to": "original_msg_uuid",
    "run_id": "ai_run_uuid"
  }
}
```

#### 3. Content Chunk

```json
{
  "type": "content",
  "id": "chunk_uuid",
  "payload": {
    "in_response_to": "original_msg_uuid",
    "content": "Based on our records, ",
    "accumulated_content": "Based on our records, you have 3 active commitments..."
  }
}
```

#### 4. Tool Call Start

```json
{
  "type": "tool_start",
  "id": "tool_uuid",
  "payload": {
    "in_response_to": "original_msg_uuid",
    "tool_name": "search_commitments",
    "tool_input": {
      "country": "Japan",
      "status": "active"
    }
  }
}
```

#### 5. Tool Call Result

```json
{
  "type": "tool_result",
  "id": "tool_uuid",
  "payload": {
    "in_response_to": "original_msg_uuid",
    "tool_name": "search_commitments",
    "success": true,
    "result": {
      "count": 3,
      "items": [{ "id": "uuid", "title": "Trade Agreement Follow-up", "status": "active" }]
    },
    "latency_ms": 234
  }
}
```

#### 6. Citation

```json
{
  "type": "citation",
  "id": "cite_uuid",
  "payload": {
    "in_response_to": "original_msg_uuid",
    "entity_type": "commitment",
    "entity_id": "uuid",
    "entity_name": "Trade Agreement Follow-up",
    "excerpt": "Follow up on bilateral trade discussions...",
    "deep_link": "/commitments/uuid"
  }
}
```

#### 7. Stream Complete

```json
{
  "type": "stream_complete",
  "id": "complete_uuid",
  "payload": {
    "in_response_to": "original_msg_uuid",
    "run_id": "ai_run_uuid",
    "tokens_used": {
      "input": 450,
      "output": 320
    },
    "latency_ms": 3420
  }
}
```

#### 8. Error

```json
{
  "type": "error",
  "id": "error_uuid",
  "payload": {
    "in_response_to": "original_msg_uuid",
    "code": "AI_PROVIDER_TIMEOUT",
    "message": "Request timed out. Please try again.",
    "retryable": true,
    "retry_after": null
  }
}
```

#### 9. Pong (Keepalive Response)

```json
{
  "type": "pong",
  "id": "pong_uuid",
  "payload": {
    "in_response_to": "ping_uuid",
    "server_timestamp": 1701792000050
  }
}
```

## Connection Lifecycle

### 1. Connection Flow

```
Client                          Server
   |                               |
   |------ WS Connect + JWT ------>|
   |                               |
   |<----- connected (ack) --------|
   |                               |
   |------- message (chat) ------->|
   |                               |
   |<------ stream_start ----------|
   |<------ tool_start ------------|
   |<------ tool_result -----------|
   |<------ content (x N) ---------|
   |<------ citation --------------|
   |<------ stream_complete -------|
   |                               |
   |------- ping ----------------->|
   |<------ pong ------------------|
   |                               |
```

### 2. Keepalive

- Client MUST send `ping` every 30 seconds
- Server responds with `pong` within 5 seconds
- If no `pong` received, client should reconnect
- Server closes connection after 60 seconds of inactivity

### 3. Reconnection Strategy

```typescript
const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000]; // ms

function getReconnectDelay(attempt: number): number {
  return RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)];
}

// Reconnect with exponential backoff
// Max 5 attempts before showing "Connection lost" to user
```

### 4. Offline Handling (Mobile)

```typescript
interface QueuedMessage {
  id: string;
  content: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

// When offline:
// 1. Queue messages locally (max 10)
// 2. Show "Offline - messages will be sent when connected"
// 3. On reconnect, send queued messages in order
// 4. If offline > 5 minutes, clear queue and show warning
```

## Rate Limiting

- Maximum 10 messages per minute per user
- Maximum 1 concurrent stream per connection
- Server sends `error` with `AI_PROVIDER_RATE_LIMITED` if exceeded

## Message Size Limits

| Message Type               | Max Size |
| -------------------------- | -------- |
| Client message             | 8 KB     |
| Server content chunk       | 4 KB     |
| Server tool result         | 32 KB    |
| Total accumulated response | 128 KB   |

## Binary Protocol (Future)

For improved efficiency, a binary protocol using MessagePack may be introduced:

```
Sec-WebSocket-Protocol: chat-v2-binary
```

Current implementation uses JSON (chat-v1).
