# AI API Reference

**Feature**: 033-ai-brief-generation
**Version**: 1.0.0
**OpenAPI Spec**: [`specs/033-ai-brief-generation/contracts/ai-api.yaml`](../specs/033-ai-brief-generation/contracts/ai-api.yaml)

## Base URL

```
Development: http://localhost:4000/api/ai
Staging: https://api.staging.intldossier.com/api/ai
Production: https://api.intldossier.com/api/ai
```

## Authentication

All endpoints require a valid Supabase JWT token in the Authorization header:

```http
Authorization: Bearer <supabase_jwt_token>
```

---

## Brief Generation

### Generate Brief (SSE Streaming)

Generate an AI-powered brief for an engagement or dossier with real-time streaming.

```http
POST /api/ai/briefs/generate
Content-Type: application/json
Accept: text/event-stream
```

**Request Body:**

| Field           | Type   | Required | Description                                    |
| --------------- | ------ | -------- | ---------------------------------------------- |
| `engagement_id` | UUID   | Yes\*    | Target engagement ID                           |
| `dossier_id`    | UUID   | Yes\*    | Target dossier ID                              |
| `custom_prompt` | string | No       | User guidance for brief focus (max 2000 chars) |
| `language`      | string | No       | `en` or `ar` (default: `en`)                   |

\*At least one of `engagement_id` or `dossier_id` is required.

**Example Request:**

```bash
curl -X POST "http://localhost:4000/api/ai/briefs/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "engagement_id": "123e4567-e89b-12d3-a456-426614174000",
    "custom_prompt": "Focus on trade agreements"
  }'
```

**SSE Events:**

| Event Type | Description                |
| ---------- | -------------------------- |
| `progress` | Generation progress update |
| `content`  | Streamed content chunk     |
| `citation` | Citation reference         |
| `complete` | Generation completed       |
| `error`    | Error occurred             |

**Example SSE Response:**

```
data: {"type":"progress","stage":"retrieving","message":"Retrieving context...","progress":10}

data: {"type":"progress","stage":"generating","message":"Generating executive summary...","progress":30}

data: {"type":"content","section":"executive_summary","content":"This brief covers..."}

data: {"type":"citation","citation":{"entity_type":"dossier","entity_id":"abc123","entity_name":"Japan Dossier"}}

data: {"type":"complete","brief_id":"xyz789","status":"completed","duration_ms":45000}
```

**Error Codes:**

| Code                   | HTTP Status | Description                             |
| ---------------------- | ----------- | --------------------------------------- |
| `FEATURE_DISABLED`     | 403         | Brief generation is disabled            |
| `MISSING_TARGET`       | 400         | No engagement_id or dossier_id provided |
| `AI_SPEND_CAP_REACHED` | 503         | Organization spend cap exceeded         |
| `RATE_LIMITED`         | 429         | Too many requests                       |
| `GENERATION_TIMEOUT`   | 504         | Generation exceeded 90s timeout         |

---

### Get Brief by ID

Retrieve a previously generated brief.

```http
GET /api/ai/briefs/:briefId
```

**Example Request:**

```bash
curl "http://localhost:4000/api/ai/briefs/xyz789" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**

```json
{
  "id": "xyz789",
  "engagement_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "title": "Japan Trade Engagement Brief",
  "executive_summary": "This brief covers...",
  "background": "Historical context...",
  "key_participants": [...],
  "relevant_positions": [...],
  "active_commitments": [...],
  "talking_points": ["Point 1", "Point 2"],
  "recommendations": "Recommended actions...",
  "citations": [...],
  "created_at": "2025-12-06T10:00:00Z",
  "completed_at": "2025-12-06T10:00:45Z"
}
```

---

### List Briefs

List briefs with optional filters.

```http
GET /api/ai/briefs?engagement_id=<uuid>&limit=10&offset=0
```

**Query Parameters:**

| Parameter       | Type    | Description               |
| --------------- | ------- | ------------------------- |
| `engagement_id` | UUID    | Filter by engagement      |
| `dossier_id`    | UUID    | Filter by dossier         |
| `status`        | string  | Filter by status          |
| `limit`         | integer | Max results (default: 20) |
| `offset`        | integer | Pagination offset         |

---

## AI Chat

### Send Chat Message (SSE Streaming)

Send a natural language query and receive a streaming response.

```http
POST /api/ai/chat
Content-Type: application/json
Accept: text/event-stream
```

**Request Body:**

| Field                  | Type   | Required | Description                   |
| ---------------------- | ------ | -------- | ----------------------------- |
| `message`              | string | Yes      | User message (max 4000 chars) |
| `conversation_history` | array  | No       | Previous messages for context |
| `language`             | string | No       | `en` or `ar` (default: `en`)  |

**Example Request:**

```bash
curl -X POST "http://localhost:4000/api/ai/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "message": "What commitments do we have with Japan?",
    "conversation_history": []
  }'
```

**SSE Events:**

| Event Type    | Description                  |
| ------------- | ---------------------------- |
| `init`        | Chat initialized with run ID |
| `content`     | Streamed response content    |
| `tool_call`   | Tool execution started       |
| `tool_result` | Tool execution completed     |
| `citation`    | Citation reference           |
| `complete`    | Response completed           |
| `error`       | Error occurred               |

**Example SSE Response:**

```
data: {"type":"init","runId":"run_abc123"}

data: {"type":"tool_call","name":"query_commitments","input":{"country":"Japan"}}

data: {"type":"tool_result","name":"query_commitments","result":[...]}

data: {"type":"content","content":"Based on our records, you have 3 active commitments with Japan:"}

data: {"type":"citation","citation":{"entity_type":"commitment","entity_id":"com123"}}

data: {"type":"complete","tokens_used":{"input":150,"output":200},"duration_ms":2500}
```

**Available Tools:**

| Tool Name                | Description                         |
| ------------------------ | ----------------------------------- |
| `search_entities`        | Semantic search across all entities |
| `get_dossier`            | Retrieve dossier details            |
| `query_commitments`      | Query commitments by criteria       |
| `get_engagement_history` | Get engagement timeline             |

---

### WebSocket Chat (Mobile)

For mobile clients, WebSocket is available at:

```
ws://localhost:4000/api/ai/chat/ws
```

See [`contracts/websocket-protocol.md`](../specs/033-ai-brief-generation/contracts/websocket-protocol.md) for protocol details.

---

## Entity Linking

### Propose Entity Links

Generate AI-suggested entity links for an intake ticket.

```http
POST /api/ai/intake-linking/propose-links
Content-Type: application/json
```

**Request Body:**

| Field       | Type | Required | Description      |
| ----------- | ---- | -------- | ---------------- |
| `intake_id` | UUID | Yes      | Intake ticket ID |

**Example Request:**

```bash
curl -X POST "http://localhost:4000/api/ai/intake-linking/propose-links" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"intake_id": "ticket123"}'
```

**Response:**

```json
{
  "run_id": "run_xyz",
  "proposals": [
    {
      "id": "prop123",
      "entity_type": "country",
      "entity_id": "japan-uuid",
      "entity_name": "Japan",
      "confidence_score": 92,
      "confidence_level": "high",
      "justification": "Ticket mentions Japanese delegation and trade discussions",
      "expires_at": "2025-12-13T10:00:00Z"
    }
  ],
  "summary": "Found 3 potential entity links based on content analysis"
}
```

---

### Approve Proposal

Approve an entity link proposal.

```http
POST /api/ai/intake-linking/proposals/:proposalId/approve
```

**Response:**

```json
{
  "link_id": "link_abc",
  "message": "Entity link created successfully"
}
```

---

### Reject Proposal

Reject an entity link proposal (optionally with feedback).

```http
POST /api/ai/intake-linking/proposals/:proposalId/reject
Content-Type: application/json
```

**Request Body:**

```json
{
  "reason": "Not relevant to this ticket"
}
```

---

## Admin Endpoints

### AI Usage Metrics

```http
GET /api/ai/admin/usage?period=month&breakdown=feature
```

**Query Parameters:**

| Parameter   | Type   | Description                   |
| ----------- | ------ | ----------------------------- |
| `period`    | string | `day`, `week`, `month`        |
| `breakdown` | string | `feature`, `provider`, `user` |

### AI Settings

```http
GET /api/ai/admin/settings
PUT /api/ai/admin/settings
```

---

## Health Check

```http
GET /api/ai/health
```

**Response:**

```json
{
  "status": "ok",
  "embeddings": "bge-m3",
  "dimensions": 1024,
  "providers": ["anthropic", "openai", "ollama"],
  "redis": "connected"
}
```

---

## Rate Limiting

| Endpoint            | Limit                       |
| ------------------- | --------------------------- |
| `/briefs/generate`  | 10 requests/minute per user |
| `/chat`             | 30 requests/minute per user |
| `/intake-linking/*` | 20 requests/minute per user |

When rate limited, the response includes:

```json
{
  "code": "RATE_LIMITED",
  "message": "Too many requests",
  "retry_after_seconds": 30
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable message",
  "details": {}
}
```

See [`contracts/error-codes.md`](../specs/033-ai-brief-generation/contracts/error-codes.md) for the complete error code reference.

---

## Frontend Integration

### React Hook Example

```tsx
import { useGenerateBrief } from '@/hooks/useGenerateBrief';

function BriefPanel({ engagementId }) {
  const { generate, progress, content, isLoading, error } = useGenerateBrief();

  const handleGenerate = () => {
    generate({
      engagement_id: engagementId,
      custom_prompt: 'Focus on economic cooperation',
    });
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={isLoading}>
        Generate Brief
      </button>
      {isLoading && <ProgressBar value={progress} />}
      {content && <BriefViewer content={content} />}
      {error && <ErrorMessage error={error} />}
    </div>
  );
}
```

### Chat Hook Example

```tsx
import { useAIChat } from '@/hooks/useAIChat';

function ChatPanel() {
  const { sendMessage, messages, isStreaming } = useAIChat();

  const handleSend = (message: string) => {
    sendMessage({ message });
  };

  return (
    <div>
      <MessageList messages={messages} />
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
```

---

## Related Documentation

- [AI Admin Guide](./ai-admin-guide.md) - Configuration and policy management
- [AI User Guide](./ai-user-guide.md) - End-user documentation
- [WebSocket Protocol](../specs/033-ai-brief-generation/contracts/websocket-protocol.md) - Mobile WebSocket details
- [Error Codes](../specs/033-ai-brief-generation/contracts/error-codes.md) - Complete error reference
- [Caching Strategy](../specs/033-ai-brief-generation/contracts/caching-rate-limiting.md) - Caching and rate limiting details
