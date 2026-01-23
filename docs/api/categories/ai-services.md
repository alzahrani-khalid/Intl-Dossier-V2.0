# AI & Machine Learning API

## Overview

The AI & Machine Learning API provides intelligent document extraction, content summarization, semantic search, translation, and contextual recommendations. These endpoints leverage AnythingLLM for self-hosted AI processing with support for bilingual content (English/Arabic) and vector embeddings for semantic operations.

## Endpoints

### AI Document Extraction

Extract structured data from uploaded documents using AI/ML models with support for sync and async processing modes.

**Endpoint:** `POST /ai-extract`

**Request Body (multipart/form-data):**
```json
{
  "file": "File object",
  "language": "en",
  "mode": "auto"
}
```

**Parameters:**
- `file` (required): Document file to extract (PDF, DOCX, TXT)
- `language` (required): Content language (`'en'` or `'ar'`)
- `mode` (required): Processing mode:
  - `'sync'`: Synchronous processing (files <1MB, <10 pages)
  - `'async'`: Asynchronous processing (large files, queued)
  - `'auto'`: Automatically choose based on file size

**Response (200 OK - Sync Mode):**
```json
{
  "mode": "sync",
  "decisions": [
    {
      "description": "Climate change mitigation commitment",
      "rationale": "Aligned with Paris Agreement",
      "decision_maker": "Minister of Environment",
      "decision_date": "2024-01-15",
      "confidence": 0.92
    }
  ],
  "commitments": [
    {
      "title": "Carbon neutrality by 2050",
      "description": "Commitment to achieve net-zero emissions",
      "deadline": "2050-12-31",
      "owner": "Ministry of Environment",
      "confidence": 0.88
    }
  ],
  "key_points": [
    "Renewable energy targets",
    "Carbon pricing mechanism",
    "Green technology investment"
  ],
  "metadata": {
    "pages_processed": 8,
    "processing_time_ms": 4500
  }
}
```

**Response (202 Accepted - Async Mode):**
```json
{
  "mode": "async",
  "job_id": "ext-550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "estimated_completion": "2024-01-15T10:35:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid file format or missing parameters
- `401 Unauthorized` - Missing or invalid authorization
- `413 Payload Too Large` - File exceeds 50MB limit
- `500 Internal Server Error` - AI extraction failed

**Implementation Example:**
```typescript
const extractDocument = async (file: File, language: 'en' | 'ar') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('language', language);
  formData.append('mode', 'auto');

  const response = await fetch('/ai-extract', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Extraction failed');
  }

  const result = await response.json();

  if (result.mode === 'async') {
    // Poll for completion
    return await pollExtractionStatus(result.job_id);
  }

  return result;
};
```

**Notes:**
- File size limit: 50MB
- Supported formats: PDF, DOCX, TXT, MD
- Sync mode timeout: 30 seconds
- Async jobs retained for 7 days

---

### Check Extraction Status

Check the status of an asynchronous AI extraction job.

**Endpoint:** `GET /ai-extract-status?job_id={id}`

**Query Parameters:**
- `job_id` (required): UUID of the extraction job

**Response (200 OK - Processing):**
```json
{
  "id": "ext-550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": 65,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Response (200 OK - Completed):**
```json
{
  "id": "ext-550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 100,
  "result": {
    "decisions": [...],
    "commitments": [...],
    "key_points": [...]
  },
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:34:00Z"
}
```

**Response (200 OK - Failed):**
```json
{
  "id": "ext-550e8400-e29b-41d4-a716-446655440000",
  "status": "failed",
  "progress": 0,
  "error": "Unsupported file format",
  "created_at": "2024-01-15T10:30:00Z",
  "failed_at": "2024-01-15T10:31:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing job_id parameter
- `401 Unauthorized` - Missing authorization
- `404 Not Found` - Job not found or expired

**Implementation Example:**
```typescript
const pollExtractionStatus = async (jobId: string): Promise<any> => {
  const maxAttempts = 60; // 5 minutes with 5s intervals
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(
      `/ai-extract-status?job_id=${jobId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    const data = await response.json();

    if (data.status === 'completed') {
      return data.result;
    }

    if (data.status === 'failed') {
      throw new Error(data.error || 'Extraction failed');
    }

    // Wait 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }

  throw new Error('Extraction timeout');
};
```

---

### AI Interaction Logs

Track and audit AI-generated content with user edit history and approval workflows.

**Endpoint (List):** `GET /ai-interaction-logs`

**Query Parameters:**
- `organizationId` (optional): Filter by organization
- `userId` (optional): Filter by user
- `interactionType` (optional): Filter by type (`extraction`, `summary`, `suggestion`)
- `contentType` (optional): Filter by content type
- `status` (optional): Filter by status (`pending`, `approved`, `rejected`)
- `startDate` (optional): Filter from date (ISO 8601)
- `endDate` (optional): Filter to date (ISO 8601)
- `limit` (optional): Page size (default: 20, max: 100)
- `offset` (optional): Page offset (default: 0)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "log-550e8400-e29b-41d4-a716-446655440000",
      "interaction_type": "extraction",
      "content_type": "after_action_record",
      "original_content": {...},
      "ai_generated_content": {...},
      "final_content": {...},
      "user_edits": 3,
      "approval_status": "approved",
      "user_id": "user-id",
      "created_at": "2024-01-15T10:30:00Z",
      "completed_at": "2024-01-15T10:45:00Z"
    }
  ],
  "total": 127,
  "limit": 20,
  "offset": 0
}
```

**Endpoint (Create):** `POST /ai-interaction-logs`

**Request Body:**
```json
{
  "interaction_type": "extraction",
  "content_type": "after_action_record",
  "original_content": {...},
  "ai_generated_content": {...},
  "metadata": {
    "file_name": "meeting-notes.pdf",
    "model": "gpt-4"
  }
}
```

**Response (201 Created):**
```json
{
  "id": "log-550e8400-e29b-41d4-a716-446655440000",
  "interaction_type": "extraction",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Endpoint (Complete):** `PUT /ai-interaction-logs/:id/complete`

**Request Body:**
```json
{
  "final_content": {...},
  "approval_status": "approved"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Missing authorization
- `404 Not Found` - Interaction log not found

**Implementation Example:**
```typescript
const logAIInteraction = async (
  type: string,
  original: any,
  aiGenerated: any
) => {
  // Start interaction log
  const logResponse = await fetch('/ai-interaction-logs', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      interaction_type: type,
      content_type: 'after_action_record',
      original_content: original,
      ai_generated_content: aiGenerated
    })
  });

  const log = await logResponse.json();

  // User reviews and edits content
  const finalContent = await presentForUserReview(aiGenerated);

  // Complete interaction
  await fetch(`/ai-interaction-logs/${log.id}/complete`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      final_content: finalContent,
      approval_status: 'approved'
    })
  });

  return log.id;
};
```

---

### Generate AI Summary

Generate executive summaries for documents, meetings, or dossiers.

**Endpoint:** `POST /ai-summary-generate`

**Request Body:**
```json
{
  "content_type": "engagement",
  "content_id": "eng-550e8400-e29b-41d4-a716-446655440000",
  "summary_length": "medium",
  "language": "en",
  "include_key_points": true,
  "include_action_items": true
}
```

**Parameters:**
- `content_type` (required): Type of content (`engagement`, `dossier`, `position`, `document`)
- `content_id` (required): UUID of content to summarize
- `summary_length` (optional): Length (`short`, `medium`, `long`, default: `medium`)
- `language` (required): Summary language (`'en'` or `'ar'`)
- `include_key_points` (optional): Extract key points (default: `true`)
- `include_action_items` (optional): Extract action items (default: `true`)

**Response (200 OK):**
```json
{
  "summary": "The bilateral meeting focused on climate cooperation, renewable energy partnerships, and technology transfer. Both parties agreed to establish a joint working group...",
  "key_points": [
    "Establishment of Joint Climate Working Group",
    "Renewable energy technology transfer agreement",
    "Carbon credit trading framework",
    "Timeline: Q2 2024 for framework completion"
  ],
  "action_items": [
    {
      "description": "Draft joint working group charter",
      "owner": "Ministry of Environment",
      "deadline": "2024-03-15"
    },
    {
      "description": "Identify technology transfer candidates",
      "owner": "Ministry of Energy",
      "deadline": "2024-04-01"
    }
  ],
  "metadata": {
    "model": "gpt-4",
    "confidence": 0.89,
    "word_count": 156,
    "generated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid content_type or content_id
- `401 Unauthorized` - Missing authorization
- `404 Not Found` - Content not found
- `500 Internal Server Error` - AI generation failed

**Implementation Example:**
```typescript
const generateSummary = async (
  contentType: string,
  contentId: string,
  language: 'en' | 'ar'
) => {
  const response = await fetch('/ai-summary-generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content_type: contentType,
      content_id: contentId,
      summary_length: 'medium',
      language: language,
      include_key_points: true,
      include_action_items: true
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Summary generation failed');
  }

  return await response.json();
};
```

---

### Generate Embeddings

Generate vector embeddings for semantic search and similarity matching.

**Endpoint:** `POST /embeddings-generate`

**Request Body:**
```json
{
  "text": "Climate change mitigation through renewable energy partnerships",
  "language": "en",
  "model": "bge-m3"
}
```

**Parameters:**
- `text` (required): Text to embed (max 8192 tokens)
- `language` (required): Text language (`'en'` or `'ar'`)
- `model` (optional): Embedding model (`'bge-m3'`, default: `'bge-m3'`)

**Response (200 OK):**
```json
{
  "embedding": [0.023, -0.041, 0.067, ...],
  "dimensions": 1536,
  "model": "bge-m3",
  "tokens": 12,
  "generated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Text too long or missing
- `401 Unauthorized` - Missing authorization
- `500 Internal Server Error` - Embedding generation failed

**Implementation Example:**
```typescript
const generateEmbedding = async (text: string, language: 'en' | 'ar') => {
  const response = await fetch('/embeddings-generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      language,
      model: 'bge-m3'
    })
  });

  if (!response.ok) {
    throw new Error('Embedding generation failed');
  }

  const { embedding } = await response.json();
  return embedding;
};
```

**Notes:**
- Embeddings are 1536-dimensional vectors
- BGE-M3 supports multilingual content
- Use for semantic search, similarity, clustering

---

### Contextual Suggestions

Get AI-powered contextual suggestions based on current user activity.

**Endpoint:** `POST /contextual-suggestions`

**Request Body:**
```json
{
  "context_type": "dossier_view",
  "context_id": "dossier-id",
  "user_intent": "research",
  "limit": 5
}
```

**Response (200 OK):**
```json
{
  "suggestions": [
    {
      "type": "related_position",
      "id": "pos-id",
      "title": "Climate Cooperation Framework",
      "relevance_score": 0.92,
      "reason": "Related to current dossier theme"
    },
    {
      "type": "recent_engagement",
      "id": "eng-id",
      "title": "Bilateral Climate Summit",
      "relevance_score": 0.88,
      "reason": "Recent activity with same country"
    }
  ]
}
```

---

### Relationship Suggestions

Suggest potential relationships between dossiers based on AI analysis.

**Endpoint:** `POST /relationship-suggestions`

**Request Body:**
```json
{
  "dossier_id": "dossier-id",
  "limit": 10
}
```

**Response (200 OK):**
```json
{
  "suggestions": [
    {
      "target_dossier_id": "target-id",
      "target_dossier_name": "Ministry of Environment",
      "relationship_type": "partnership",
      "confidence": 0.87,
      "evidence": [
        "Co-participation in 3 engagements",
        "Shared topic: climate change"
      ]
    }
  ]
}
```

---

### Smart Import Suggestions

Analyze uploaded documents and suggest optimal import strategy.

**Endpoint:** `POST /smart-import-suggestions`

**Request Body (multipart/form-data):**
```json
{
  "file": "File object"
}
```

**Response (200 OK):**
```json
{
  "suggested_import_type": "engagement",
  "confidence": 0.91,
  "detected_entities": [
    {
      "type": "country",
      "name": "United Kingdom",
      "confidence": 0.95
    },
    {
      "type": "date",
      "value": "2024-01-15",
      "confidence": 0.88
    }
  ],
  "suggested_fields": {
    "title": "Bilateral Climate Meeting",
    "date": "2024-01-15",
    "participants": ["UK", "Saudi Arabia"]
  }
}
```

---

### Word Assistant

AI-powered writing assistant for bilingual content.

**Endpoint:** `POST /word-assistant`

**Request Body:**
```json
{
  "action": "suggest",
  "text": "The Kingdom emphasizes the importance of",
  "language": "en",
  "context": "position_paper"
}
```

**Response (200 OK):**
```json
{
  "suggestions": [
    "sustainable development",
    "multilateral cooperation",
    "climate action"
  ]
}
```

---

### Voice Memos

Record and manage voice memos for quick note-taking.

**Endpoint (Upload):** `POST /voice-memos`

**Request Body (multipart/form-data):**
```json
{
  "audio": "File object",
  "language": "en"
}
```

**Response (201 Created):**
```json
{
  "id": "memo-id",
  "duration_seconds": 45,
  "file_size_bytes": 450000,
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### Transcribe Voice Memo

Transcribe voice memo to text using AI speech recognition.

**Endpoint:** `POST /voice-memos-transcribe`

**Request Body:**
```json
{
  "memo_id": "memo-id",
  "language": "en"
}
```

**Response (200 OK):**
```json
{
  "memo_id": "memo-id",
  "transcription": "Discussed renewable energy partnership with UK representatives. Key points: technology transfer, carbon credits, joint working group.",
  "language": "en",
  "confidence": 0.94,
  "transcribed_at": "2024-01-15T10:31:00Z"
}
```

---

### Translate Content

Translate content between English and Arabic.

**Endpoint:** `POST /translate-content`

**Request Body:**
```json
{
  "text": "Climate change mitigation",
  "source_language": "en",
  "target_language": "ar",
  "preserve_formatting": true
}
```

**Response (200 OK):**
```json
{
  "translated_text": "التخفيف من آثار تغير المناخ",
  "source_language": "en",
  "target_language": "ar",
  "confidence": 0.96,
  "model": "nllb-200"
}
```

---

### Generate Policy Brief Outline

AI-generated outline for policy briefs.

**Endpoint:** `POST /policy-brief-outline`

**Request Body:**
```json
{
  "topic": "Climate Change Cooperation",
  "language": "en",
  "sections": ["executive_summary", "background", "recommendations"]
}
```

**Response (200 OK):**
```json
{
  "outline": {
    "executive_summary": {
      "key_points": [...]
    },
    "background": {
      "subsections": [...]
    },
    "recommendations": {
      "items": [...]
    }
  }
}
```

---

## Common Features

### Authentication

All AI endpoints require JWT authentication via the `Authorization` header:

```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Bilingual Support

All AI endpoints support both English and Arabic content through the `language` parameter (`'en'` or `'ar'`).

### Rate Limiting

AI endpoints have usage limits to prevent abuse:
- Free tier: 100 requests/hour
- Standard tier: 1000 requests/hour
- Enterprise tier: Unlimited

### Error Handling

Standard error response format:

```json
{
  "error": "Error message in English",
  "error_ar": "رسالة الخطأ بالعربية",
  "details": {
    "field": "Additional context"
  }
}
```

---

## Related APIs

- [Documents API](./documents.md) - Document management and storage
- [Search API](./search.md) - Semantic search and discovery
- [Intelligence API](./intelligence.md) - Country intelligence signals
- [Workflow API](./workflow.md) - Automation and background processing
