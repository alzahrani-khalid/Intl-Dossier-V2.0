# Front Door Intake API Documentation

**Version**: 1.0.0
**Base URL**: `https://api.gastat.sa/v1`
**Authentication**: Bearer Token (JWT)

## Overview

The Front Door Intake API provides a unified entry point for support requests with AI-powered triage, duplicate detection, and SLA management. All requests must include a valid JWT token in the `Authorization` header.

## Authentication

```http
Authorization: Bearer <your_jwt_token>
```

## Rate Limiting

- **Authenticated users**: 300 requests per minute
- **Anonymous users**: 60 requests per minute

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 1234567890
```

## Endpoints

### Tickets

#### Create Ticket

Submit a new intake ticket.

```http
POST /intake/tickets
Content-Type: application/json
```

**Request Body:**
```json
{
  "request_type": "engagement",
  "title": "Support request title",
  "title_ar": "عنوان طلب الدعم",
  "description": "Detailed description of the request",
  "description_ar": "وصف تفصيلي للطلب",
  "type_specific_fields": {
    "partner_country": "United States",
    "engagement_type": "Technical cooperation"
  },
  "urgency": "high",
  "dossier_id": "uuid-of-existing-dossier",
  "source": "web"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "ticket_number": "TKT-2025-001234",
  "request_type": "engagement",
  "title": "Support request title",
  "title_ar": "عنوان طلب الدعم",
  "status": "submitted",
  "priority": "high",
  "sla_preview": {
    "acknowledgment_target_minutes": 30,
    "resolution_target_minutes": 480,
    "acknowledgment_target_time": "2025-01-29T15:30:00Z",
    "resolution_target_time": "2025-01-30T09:00:00Z"
  },
  "created_at": "2025-01-29T15:00:00Z",
  "created_by": "user-uuid"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication token
- `413 Payload Too Large`: Attachment exceeds size limit
- `429 Too Many Requests`: Rate limit exceeded

---

#### List Tickets

Retrieve a paginated list of intake tickets with optional filtering.

```http
GET /intake/tickets?status=submitted&page=1&limit=20
```

**Query Parameters:**
- `status` (optional): Filter by status (`draft`, `submitted`, `triaged`, `assigned`, `in_progress`, `converted`, `closed`, `merged`)
- `request_type` (optional): Filter by type (`engagement`, `position`, `mou_action`, `foresight`)
- `sensitivity` (optional): Filter by sensitivity (`public`, `internal`, `confidential`, `secret`)
- `urgency` (optional): Filter by urgency (`low`, `medium`, `high`, `critical`)
- `assigned_to` (optional): Filter by assignee UUID
- `assigned_unit` (optional): Filter by unit/queue
- `sla_breached` (optional): Filter by SLA breach status (boolean)
- `created_after` (optional): Filter by creation date (ISO 8601)
- `created_before` (optional): Filter by creation date (ISO 8601)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "ticket_number": "TKT-2025-001234",
      "request_type": "engagement",
      "title": "Support request title",
      "status": "submitted",
      "priority": "high",
      "assigned_to": null,
      "sla_status": {
        "acknowledgment_breached": false,
        "resolution_breached": false,
        "acknowledgment_remaining_minutes": 25
      },
      "created_at": "2025-01-29T15:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

---

#### Get Ticket

Retrieve detailed information for a specific ticket.

```http
GET /intake/tickets/{id}
```

**Path Parameters:**
- `id` (required): Ticket UUID

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "ticket_number": "TKT-2025-001234",
  "request_type": "engagement",
  "title": "Support request title",
  "title_ar": "عنوان طلب الدعم",
  "description": "Detailed description",
  "description_ar": "وصف تفصيلي",
  "type_specific_fields": {...},
  "sensitivity": "internal",
  "urgency": "high",
  "priority": "high",
  "status": "submitted",
  "assigned_to": null,
  "assigned_unit": null,
  "dossier_id": "dossier-uuid",
  "sla_status": {
    "acknowledgment": {
      "target_minutes": 30,
      "elapsed_minutes": 5,
      "remaining_minutes": 25,
      "is_breached": false,
      "target_time": "2025-01-29T15:30:00Z"
    },
    "resolution": {
      "target_minutes": 480,
      "elapsed_minutes": 5,
      "remaining_minutes": 475,
      "is_breached": false,
      "target_time": "2025-01-30T09:00:00Z"
    }
  },
  "attachments": [],
  "created_at": "2025-01-29T15:00:00Z",
  "created_by": "user-uuid",
  "updated_at": "2025-01-29T15:00:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Ticket does not exist
- `403 Forbidden`: User does not have access to this ticket

---

#### Update Ticket

Update ticket details (restricted fields based on status).

```http
PATCH /intake/tickets/{id}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated title",
  "title_ar": "عنوان محدث",
  "description": "Updated description",
  "urgency": "critical",
  "type_specific_fields": {
    "partner_country": "Canada"
  }
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "ticket_number": "TKT-2025-001234",
  "title": "Updated title",
  "status": "submitted",
  "updated_at": "2025-01-29T15:30:00Z",
  "updated_by": "user-uuid"
}
```

---

### Triage

#### Apply AI Triage

Get AI-powered triage suggestions for a ticket.

```http
POST /intake/tickets/{id}/triage
Content-Type: application/json
```

**Request Body:**
```json
{
  "request_suggestions": true
}
```

**Response (200 OK):**
```json
{
  "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
  "ai_suggestions": {
    "suggested_type": "engagement",
    "suggested_sensitivity": "internal",
    "suggested_urgency": "high",
    "suggested_assignee": "user-uuid",
    "suggested_unit": "international-relations",
    "confidence_scores": {
      "type": 0.92,
      "sensitivity": 0.88,
      "urgency": 0.85,
      "assignment": 0.76
    }
  },
  "model_info": {
    "model_name": "gpt-4",
    "model_version": "2024-01-01",
    "inference_time_ms": 1250
  },
  "generated_at": "2025-01-29T15:05:00Z"
}
```

**Override Suggestions:**
```http
POST /intake/tickets/{id}/triage
Content-Type: application/json
```

**Request Body:**
```json
{
  "accept_suggestions": false,
  "override_values": {
    "sensitivity": "confidential",
    "urgency": "critical",
    "assigned_unit": "executive-office"
  },
  "override_reason": "Requires executive attention due to sensitive nature",
  "override_reason_ar": "يتطلب اهتمام تنفيذي بسبب الطبيعة الحساسة"
}
```

**Response (200 OK):**
```json
{
  "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "triaged",
  "applied_values": {
    "sensitivity": "confidential",
    "urgency": "critical",
    "priority": "urgent",
    "assigned_unit": "executive-office"
  },
  "triage_decision_id": "decision-uuid",
  "triaged_at": "2025-01-29T15:10:00Z",
  "triaged_by": "user-uuid"
}
```

---

### Assignment

#### Assign Ticket

Assign a ticket to a user or unit.

```http
POST /intake/tickets/{id}/assign
Content-Type: application/json
```

**Request Body:**
```json
{
  "assigned_to": "user-uuid",
  "assigned_unit": "international-relations",
  "assignment_note": "Assigned to specialist team",
  "assignment_note_ar": "تم التكليف لفريق المتخصصين"
}
```

**Response (200 OK):**
```json
{
  "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "assigned",
  "assigned_to": "user-uuid",
  "assigned_unit": "international-relations",
  "assigned_at": "2025-01-29T15:15:00Z",
  "assigned_by": "supervisor-uuid"
}
```

---

### Duplicates

#### Detect Duplicates

Find potential duplicate tickets using AI-powered semantic search.

```http
GET /intake/tickets/{id}/duplicates?threshold=0.65
```

**Query Parameters:**
- `threshold` (optional): Similarity threshold (0-1, default: 0.65)
- `include_resolved` (optional): Include closed/merged tickets (boolean, default: false)

**Response (200 OK):**
```json
{
  "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
  "candidates": [
    {
      "ticket_id": "candidate-uuid-1",
      "ticket_number": "TKT-2025-001100",
      "title": "Similar request title",
      "overall_score": 0.87,
      "title_similarity": 0.92,
      "content_similarity": 0.85,
      "metadata_similarity": 0.84,
      "is_high_confidence": true
    },
    {
      "ticket_id": "candidate-uuid-2",
      "ticket_number": "TKT-2025-000950",
      "title": "Related support request",
      "overall_score": 0.71,
      "title_similarity": 0.68,
      "content_similarity": 0.75,
      "metadata_similarity": 0.70,
      "is_high_confidence": false
    }
  ],
  "model_info": {
    "embedding_model": "bge-m3",
    "threshold_used": 0.65,
    "detection_method": "vector"
  }
}
```

---

#### Merge Tickets

Merge duplicate tickets into a primary ticket.

```http
POST /intake/tickets/{id}/merge
Content-Type: application/json
```

**Request Body:**
```json
{
  "target_ticket_ids": ["ticket-uuid-1", "ticket-uuid-2"],
  "merge_reason": "Confirmed duplicates - same engagement request",
  "merge_reason_ar": "نسخ مؤكدة - نفس طلب المشاركة"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "primary_ticket_id": "550e8400-e29b-41d4-a716-446655440000",
  "merged_ticket_ids": ["ticket-uuid-1", "ticket-uuid-2"],
  "history_preserved": true,
  "merged_at": "2025-01-29T15:20:00Z",
  "merged_by": "user-uuid"
}
```

---

### Conversion

#### Convert to Artifact

Convert an intake ticket to a working artifact (engagement, position, etc.).

```http
POST /intake/tickets/{id}/convert
Content-Type: application/json
```

**Request Body:**
```json
{
  "target_type": "engagement",
  "additional_data": {
    "engagement_level": "Strategic partnership",
    "primary_contact": "contact-uuid"
  },
  "mfa_code": "123456"
}
```

**Note**: MFA code is required for confidential or secret tickets.

**Response (200 OK):**
```json
{
  "success": true,
  "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
  "artifact_type": "engagement",
  "artifact_id": "engagement-uuid",
  "artifact_url": "https://app.gastat.sa/engagements/engagement-uuid",
  "converted_at": "2025-01-29T15:25:00Z",
  "converted_by": "user-uuid",
  "correlation_id": "conv_1738164300_abc123xyz"
}
```

---

### Attachments

#### Upload Attachment

Upload a file attachment to a ticket.

```http
POST /intake/tickets/{id}/attachments
Content-Type: multipart/form-data
```

**Form Data:**
- `file` (required): File to upload
- `file_name` (required): Original filename
- `description` (optional): File description

**Limits:**
- Maximum file size: 25 MB
- Maximum total attachments per ticket: 100 MB
- Allowed types: PDF, DOCX, XLSX, images (JPEG, PNG, GIF), text files

**Response (201 Created):**
```json
{
  "id": "attachment-uuid",
  "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
  "file_name": "support-document.pdf",
  "file_size": 2048576,
  "mime_type": "application/pdf",
  "scan_status": "pending",
  "uploaded_at": "2025-01-29T15:30:00Z",
  "uploaded_by": "user-uuid"
}
```

**Error Responses:**
- `413 Payload Too Large`: File exceeds size limit
- `415 Unsupported Media Type`: File type not allowed

---

#### Get Attachment Download URL

Get a signed URL to download an attachment.

```http
GET /intake/tickets/{id}/attachments/{attachment_id}/download
```

**Response (200 OK):**
```json
{
  "attachment_id": "attachment-uuid",
  "file_name": "support-document.pdf",
  "download_url": "https://storage.supabase.co/signed-url...",
  "expires_at": "2025-01-29T15:35:00Z",
  "scan_status": "clean"
}
```

**Note**: Download URL is valid for 5 minutes. Files with `scan_status` other than "clean" cannot be downloaded.

---

### Health Checks

#### System Health

Check overall system health.

```http
GET /intake/health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-29T15:00:00Z",
  "services": {
    "database": "healthy",
    "storage": "healthy",
    "ai": "healthy"
  },
  "version": "1.0.0"
}
```

#### AI Service Health

Check AI service availability and performance.

```http
GET /intake/ai/health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "ai_available": true,
  "embedding_model": "bge-m3",
  "llm_model": "gpt-4",
  "average_latency_ms": 1250,
  "last_successful_inference": "2025-01-29T14:58:00Z",
  "fallback_mode": false,
  "cached_results_available": true
}
```

**Degraded Response (200 OK):**
```json
{
  "status": "degraded",
  "ai_available": false,
  "fallback_mode": true,
  "reason": "AI service temporarily unavailable",
  "cached_results_available": true,
  "last_successful_inference": "2025-01-29T13:00:00Z",
  "retry_after": 300
}
```

---

## Error Responses

### Standard Error Format

All error responses follow this structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ],
    "request_id": "req_abc123xyz",
    "timestamp": "2025-01-29T15:00:00Z"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request data validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | User lacks permission for this resource |
| `NOT_FOUND` | 404 | Requested resource does not exist |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate ticket) |
| `PAYLOAD_TOO_LARGE` | 413 | Request payload exceeds size limit |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | File type not supported |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## Webhook Events

The system can send webhook notifications for important events:

### Ticket Status Changed

```json
{
  "event": "ticket.status_changed",
  "timestamp": "2025-01-29T15:00:00Z",
  "data": {
    "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
    "ticket_number": "TKT-2025-001234",
    "old_status": "submitted",
    "new_status": "triaged",
    "changed_by": "user-uuid"
  }
}
```

### SLA Breached

```json
{
  "event": "sla.breached",
  "timestamp": "2025-01-29T15:30:00Z",
  "data": {
    "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
    "ticket_number": "TKT-2025-001234",
    "sla_type": "acknowledgment",
    "breach_time": "2025-01-29T15:30:00Z"
  }
}
```

### Virus Scan Completed

```json
{
  "event": "attachment.scan_completed",
  "timestamp": "2025-01-29T15:02:00Z",
  "data": {
    "attachment_id": "attachment-uuid",
    "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
    "scan_status": "clean",
    "scan_details": {}
  }
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://api.gastat.sa',
  'your-anon-key'
);

// Create ticket
const { data, error } = await supabase
  .from('intake_tickets')
  .insert({
    request_type: 'engagement',
    title: 'Support request',
    title_ar: 'طلب دعم',
    description: 'Details...',
    urgency: 'high'
  })
  .select()
  .single();

// List tickets with filtering
const { data: tickets } = await supabase
  .from('intake_tickets')
  .select('*')
  .eq('status', 'submitted')
  .order('created_at', { ascending: false })
  .range(0, 19);

// Real-time subscription for SLA updates
const channel = supabase
  .channel('ticket-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'intake_tickets',
    filter: `id=eq.${ticketId}`
  }, (payload) => {
    console.log('Ticket updated:', payload.new);
  })
  .subscribe();
```

### cURL

```bash
# Create ticket
curl -X POST https://api.gastat.sa/v1/intake/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "request_type": "engagement",
    "title": "Support request",
    "title_ar": "طلب دعم",
    "description": "Details...",
    "urgency": "high"
  }'

# List tickets
curl -X GET "https://api.gastat.sa/v1/intake/tickets?status=submitted&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Get ticket with ID
curl -X GET https://api.gastat.sa/v1/intake/tickets/$TICKET_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## Best Practices

### Performance

1. **Use pagination**: Always specify `limit` parameter to avoid large responses
2. **Filter early**: Apply filters at the API level rather than client-side
3. **Cache static data**: Cache SLA policies and configuration data
4. **Use Realtime subscriptions**: For live updates instead of polling
5. **Batch operations**: Group related operations when possible

### Security

1. **Never log tokens**: Avoid logging authentication tokens
2. **Validate MFA**: Always require MFA for confidential+ operations
3. **Check file types**: Validate file types before upload
4. **Rate limiting**: Respect rate limits to avoid blocking
5. **Use HTTPS**: Always use HTTPS for API calls

### Error Handling

```typescript
try {
  const { data, error } = await createTicket(payload);

  if (error) {
    if (error.code === 'RATE_LIMITED') {
      // Wait and retry after rate limit reset
      const retryAfter = parseInt(error.headers['X-RateLimit-Reset']);
      await sleep(retryAfter * 1000);
      return retry();
    }

    if (error.code === 'VALIDATION_ERROR') {
      // Handle validation errors
      displayErrors(error.details);
      return;
    }

    // Log and report other errors
    logger.error('Ticket creation failed', error);
    throw error;
  }

  return data;
} catch (error) {
  // Handle network or unexpected errors
  handleUnexpectedError(error);
}
```

---

## Support

For API issues or questions:
- **Documentation**: `/specs/008-front-door-intake/`
- **OpenAPI Spec**: `/specs/008-front-door-intake/contracts/api-spec.yaml`
- **Support**: support@gastat.sa