# API Contracts Summary

**Feature**: After-Action Structured Documentation  
**Date**: 2025-01-14  
**Base URL**: `/functions/v1`

## API Groups

### 1. After-Action CRUD Operations
**File**: `after-action-api.md`  
**Endpoints**: 8 endpoints for creating, updating, publishing, and managing after-action records

Key operations:
- POST `/after-action/create` - Create draft
- PUT `/after-action/update/:id` - Update draft
- POST `/after-action/publish/:id` - Publish & create tasks
- POST `/after-action/request-edit/:id` - Request edit (creator)
- POST `/after-action/approve-edit/:id` - Approve/reject edit (supervisor)
- GET `/after-action/list` - List with filtering
- GET `/after-action/get/:id` - Get full details
- DELETE `/after-action/delete/:id` - Delete draft

### 2. AI Extraction Service
**Endpoints**: 3 endpoints for AI-powered meeting minutes extraction

- POST `/ai-extraction/extract-sync` - Synchronous extraction (<5s, documents <500KB)
- POST `/ai-extraction/extract-async` - Asynchronous extraction (>5s, large documents)
- GET `/ai-extraction/status/:job_id` - Poll async extraction status

**Request** (extract-sync/extract-async):
```json
{
  "document_url": "string (Supabase Storage signed URL)",
  "document_type": "pdf" | "docx" | "txt",
  "language": "en" | "ar" | "mixed",
  "extraction_options": {
    "extract_decisions": boolean,
    "extract_commitments": boolean,
    "extract_risks": boolean,
    "extract_follow_ups": boolean
  }
}
```

**Response** (sync):
```json
{
  "success": true,
  "data": {
    "decisions": [{...}],
    "commitments": [{...}],
    "risks": [{...}],
    "follow_up_actions": [{...}],
    "processing_time_ms": 3500
  }
}
```

**Response** (async - immediate):
```json
{
  "success": true,
  "data": {
    "job_id": "uuid",
    "status": "processing",
    "estimated_completion": "ISO8601 timestamp"
  }
}
```

### 3. PDF Generation Service
**Endpoints**: 2 endpoints for bilingual PDF generation

- POST `/pdf-generation/generate-bilingual/:id` - Generate EN/AR PDFs
- GET `/pdf-generation/download/:id/:language` - Get signed download URL

**Request** (generate-bilingual):
```json
{
  "after_action_id": "uuid",
  "include_attachments_list": boolean,
  "include_confidential_sections": boolean,
  "watermark": "string (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "english_pdf": {
      "file_name": "AfterAction_Title_20250114_EN.pdf",
      "file_size": 245678,
      "storage_path": "string",
      "generation_time_ms": 2500
    },
    "arabic_pdf": {
      "file_name": "AfterAction_Title_20250114_AR.pdf",
      "file_size": 289123,
      "storage_path": "string",
      "generation_time_ms": 2800
    }
  }
}
```

### 4. External Contacts Management
**Endpoints**: 3 endpoints for managing external (non-system) contacts

- POST `/external-contacts/create` - Create new contact
- GET `/external-contacts/search` - Search by name/email
- PUT `/external-contacts/update-commitment/:commitment_id` - Update external commitment status

**Request** (create):
```json
{
  "email": "string (required, validated)",
  "name": "string (2-100 chars)",
  "organization": "string (optional)",
  "email_enabled": boolean
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "email@example.com",
    "name": "John Doe",
    "organization": "Example Org",
    "email_enabled": true,
    "created_by": "uuid",
    "created_at": "ISO8601 timestamp"
  }
}
```

**Request** (search):
```
GET /external-contacts/search?q=john&limit=10
```

**Response**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "email": "john@example.com",
        "name": "John Doe",
        "organization": "Example Org"
      }
    ]
  }
}
```

**Request** (update-commitment):
```json
{
  "commitment_id": "uuid",
  "status": "in_progress" | "completed" | "cancelled",
  "completion_notes": "string (optional)"
}
```

### 5. Mobile Sync API
**Endpoints**: 1 endpoint for incremental mobile sync

- POST `/mobile-sync/incremental` - Sync changes since timestamp

**Request**:
```json
{
  "last_sync_timestamp": "ISO8601 timestamp",
  "device_id": "string",
  "pending_changes": {
    "after_actions": [
      {
        "operation": "create" | "update" | "delete",
        "local_id": "uuid",
        "data": {...},
        "_version": number
      }
    ],
    "commitments": [...],
    "decisions": [...]
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "server_timestamp": "ISO8601 timestamp",
    "changes": {
      "after_actions": {
        "created": [...],
        "updated": [...],
        "deleted": ["uuid"]
      },
      "commitments": {...},
      "external_contacts": {...}
    },
    "conflicts": [
      {
        "entity_type": "after_action_record",
        "entity_id": "uuid",
        "conflict_type": "version_mismatch",
        "server_version": {...},
        "client_version": {...}
      }
    ],
    "sync_summary": {
      "total_sent": 5,
      "total_received": 12,
      "conflicts_count": 1
    }
  }
}
```

## Authentication

All endpoints require JWT Bearer token from Supabase Auth:

```
Authorization: Bearer <jwt_token>
```

Token obtained via Supabase client SDK:
```typescript
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token
```

## Common Response Patterns

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "string (optional)"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [...] // optional
  }
}
```

### Pagination
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

## Rate Limiting

- Standard endpoints: 100 req/min per user
- Write endpoints (POST/PUT): 20 req/min per user
- Publish endpoint: 10 req/min per user
- AI extraction: 5 req/min per user
- PDF generation: 10 req/min per user

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704902400
```

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| VALIDATION_ERROR | 400 | Invalid request body |
| VERSION_CONFLICT | 400 | Optimistic lock failed |
| UNAUTHORIZED | 401 | Missing/invalid token |
| PERMISSION_DENIED | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

## WebSocket Events (Supabase Realtime)

Subscribe to real-time updates:

```typescript
const channel = supabase
  .channel('after-action-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'after_action_records',
      filter: `dossier_id=eq.${dossierId}`
    },
    (payload) => {
      // Handle real-time update
    }
  )
  .subscribe()
```

Events:
- `INSERT` - New after-action created
- `UPDATE` - After-action updated
- `DELETE` - After-action deleted

## Testing

**Base URL (Staging)**: `https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1`  
**Base URL (Production)**: TBD

Test credentials available in CLAUDE.md

## Next Steps

Phase 1 complete. Proceed to generate quickstart.md.
