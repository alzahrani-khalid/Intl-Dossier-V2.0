# Documents API

## Overview

The Documents API provides comprehensive document management capabilities including creation, versioning, classification, OCR processing, annotations, and preview generation. All documents support bilingual content (English/Arabic), attachment management, and enforce Row-Level Security (RLS) based on organization access.

**Key Features:**
- Document CRUD operations with version tracking
- OCR text extraction from images and PDFs
- PDF generation from templates
- Document annotations (highlights, notes, stamps, signatures)
- Automatic classification and content search
- Document preview generation (thumbnails, web previews)
- Template-based document creation

## Endpoints

### Create Document

Create a new document with metadata and optional file attachment.

**Endpoint:** `POST /documents-create`

**Request Body:**
```json
{
  "organization_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Climate Policy Brief 2024",
  "title_ar": "موجز سياسة المناخ 2024",
  "description": "Comprehensive climate policy analysis",
  "description_ar": "تحليل شامل لسياسة المناخ",
  "document_type": "brief",
  "status": "draft",
  "tags": ["climate", "policy", "2024"],
  "metadata": {
    "author": "Policy Team",
    "department": "International Relations"
  },
  "file_path": "documents/climate-brief-2024.pdf",
  "mime_type": "application/pdf",
  "file_size": 2048576
}
```

**Response (201 Created):**
```json
{
  "id": "doc-550e8400-e29b-41d4-a716-446655440000",
  "organization_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Climate Policy Brief 2024",
  "title_ar": "موجز سياسة المناخ 2024",
  "document_type": "brief",
  "status": "draft",
  "version": 1,
  "file_path": "documents/climate-brief-2024.pdf",
  "mime_type": "application/pdf",
  "file_size": 2048576,
  "checksum": "sha256:abc123...",
  "created_by": "user-id",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or invalid document_type
- `401 Unauthorized` - Missing or invalid authorization header
- `403 Forbidden` - User lacks permission to create documents in this organization
- `500 Internal Server Error` - Failed to create document

**Implementation Example:**
```typescript
const createDocument = async (documentData: CreateDocumentRequest) => {
  const response = await fetch('/documents-create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      organization_id: documentData.organizationId,
      title: documentData.title,
      title_ar: documentData.titleAr,
      document_type: documentData.type,
      file_path: documentData.filePath,
      mime_type: documentData.mimeType
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_ar || error.error);
  }

  return await response.json();
};
```

**Notes:**
- Document versions are automatically created on each update
- File uploads should be handled separately via Attachments API
- Checksum (SHA-256) is automatically calculated for file integrity

---

### Get Document

Retrieve a single document by ID with RLS-based access control.

**Endpoint:** `GET /documents-get?document_id={id}`

**Query Parameters:**
- `document_id` (required): UUID of the document
- `include_versions` (optional): Include version history (default: false)

**Response (200 OK):**
```json
{
  "id": "doc-550e8400-e29b-41d4-a716-446655440000",
  "organization_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Climate Policy Brief 2024",
  "title_ar": "موجز سياسة المناخ 2024",
  "description": "Comprehensive climate policy analysis",
  "document_type": "brief",
  "status": "published",
  "version": 3,
  "file_path": "documents/climate-brief-2024-v3.pdf",
  "mime_type": "application/pdf",
  "file_size": 2048576,
  "checksum": "sha256:abc123...",
  "tags": ["climate", "policy", "2024"],
  "created_by": "user-id",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:45:00Z",
  "versions": []
}
```

**Error Responses:**
- `400 Bad Request` - Missing document_id parameter
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - User lacks permission to view this document
- `404 Not Found` - Document not found

**Access Control (RLS):**
- Users must belong to the document's organization
- Document visibility respects organization-level permissions

**Implementation Example:**
```typescript
const getDocument = async (documentId: string, includeVersions = false) => {
  const params = new URLSearchParams({
    document_id: documentId,
    include_versions: includeVersions.toString()
  });

  const response = await fetch(`/documents-get?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 404) {
    throw new Error('Document not found or access denied');
  }

  return await response.json();
};
```

---

### Delete Document

Soft delete a document (archives instead of permanently deleting).

**Endpoint:** `DELETE /documents-delete`

**Request Body:**
```json
{
  "document_id": "doc-550e8400-e29b-41d4-a716-446655440000",
  "reason": "Outdated policy content"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Document archived successfully",
  "message_ar": "تم أرشفة المستند بنجاح",
  "document_id": "doc-550e8400-e29b-41d4-a716-446655440000",
  "archived_at": "2024-01-20T15:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing document_id
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - User lacks permission to delete this document
- `404 Not Found` - Document not found

**Implementation Example:**
```typescript
const deleteDocument = async (documentId: string, reason?: string) => {
  const response = await fetch('/documents-delete', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      document_id: documentId,
      reason
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_ar || error.error);
  }

  return await response.json();
};
```

**Notes:**
- Documents are soft-deleted (archived) not permanently removed
- Archived documents can be restored by administrators
- Associated files remain in storage

---

### Document Versions

Retrieve version history for a document with change tracking.

**Endpoint:** `GET /document-versions?document_id={id}`

**Query Parameters:**
- `document_id` (required): UUID of the document
- `limit` (optional): Number of versions to return (default: 10, max: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "data": [
    {
      "version": 3,
      "document_id": "doc-550e8400-e29b-41d4-a716-446655440000",
      "title": "Climate Policy Brief 2024 (Updated)",
      "changes": "Updated economic impact section",
      "file_path": "documents/climate-brief-2024-v3.pdf",
      "file_size": 2048576,
      "checksum": "sha256:xyz789...",
      "created_by": "user-id",
      "created_at": "2024-01-20T14:45:00Z"
    },
    {
      "version": 2,
      "document_id": "doc-550e8400-e29b-41d4-a716-446655440000",
      "title": "Climate Policy Brief 2024",
      "changes": "Added regional analysis",
      "file_path": "documents/climate-brief-2024-v2.pdf",
      "created_by": "user-id",
      "created_at": "2024-01-18T09:15:00Z"
    }
  ],
  "total": 3,
  "current_version": 3
}
```

**Error Responses:**
- `400 Bad Request` - Missing document_id parameter
- `401 Unauthorized` - Missing authorization header
- `404 Not Found` - Document not found

**Implementation Example:**
```typescript
const getDocumentVersions = async (documentId: string, limit = 10) => {
  const params = new URLSearchParams({
    document_id: documentId,
    limit: limit.toString()
  });

  const response = await fetch(`/document-versions?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

---

### Document Annotations

Manage document annotations including highlights, notes, stamps, and signatures.

**Endpoint (GET):** `GET /document-annotations?document_id={id}`
**Endpoint (POST):** `POST /document-annotations`
**Endpoint (PUT):** `PUT /document-annotations`
**Endpoint (DELETE):** `DELETE /document-annotations`

**List Annotations - GET Request:**

**Query Parameters:**
- `document_id` (required): UUID of the document
- `page_number` (optional): Filter by page number
- `annotation_type` (optional): Filter by type (handwritten, highlight, text_note, shape, stamp, signature)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "ann-550e8400-e29b-41d4-a716-446655440000",
      "document_id": "doc-123",
      "page_number": 1,
      "annotation_type": "highlight",
      "color": "#FFFF00",
      "x": 100,
      "y": 200,
      "width": 300,
      "height": 20,
      "content": "Important section",
      "created_by": "user-id",
      "created_at": "2024-01-20T10:00:00Z"
    }
  ],
  "total": 5
}
```

**Create Annotation - POST Request:**

**Request Body:**
```json
{
  "organization_id": "org-123",
  "document_id": "doc-123",
  "page_number": 1,
  "annotation_type": "highlight",
  "color": "#FFFF00",
  "x": 100,
  "y": 200,
  "width": 300,
  "height": 20,
  "content": "Important section"
}
```

**Response (201 Created):**
```json
{
  "id": "ann-550e8400-e29b-41d4-a716-446655440000",
  "document_id": "doc-123",
  "annotation_type": "highlight",
  "created_at": "2024-01-20T10:00:00Z"
}
```

**Implementation Example:**
```typescript
const createAnnotation = async (annotation: CreateAnnotationInput) => {
  const response = await fetch('/document-annotations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(annotation)
  });

  return await response.json();
};

const getAnnotations = async (documentId: string, pageNumber?: number) => {
  const params = new URLSearchParams({ document_id: documentId });
  if (pageNumber) params.append('page_number', pageNumber.toString());

  const response = await fetch(`/document-annotations?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  return await response.json();
};
```

**Notes:**
- Annotations support real-time collaboration
- Handwritten annotations use SVG path data
- Batch creation supported for importing annotations

---

### Document Classification

Automatically classify documents using AI-powered categorization.

**Endpoint:** `POST /document-classification`

**Request Body:**
```json
{
  "document_id": "doc-550e8400-e29b-41d4-a716-446655440000",
  "classification_model": "gpt-4o-mini",
  "categories": ["policy", "legal", "technical", "administrative"]
}
```

**Response (200 OK):**
```json
{
  "document_id": "doc-550e8400-e29b-41d4-a716-446655440000",
  "classification": {
    "primary_category": "policy",
    "confidence": 0.92,
    "secondary_categories": ["technical"],
    "suggested_tags": ["climate", "international", "framework"],
    "language": "en",
    "document_type": "brief"
  },
  "processing_time_ms": 850
}
```

**Error Responses:**
- `400 Bad Request` - Missing document_id or invalid parameters
- `401 Unauthorized` - Missing authorization header
- `404 Not Found` - Document not found
- `500 Internal Server Error` - Classification service unavailable

**Implementation Example:**
```typescript
const classifyDocument = async (documentId: string, categories?: string[]) => {
  const response = await fetch('/document-classification', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      document_id: documentId,
      categories: categories || ['policy', 'legal', 'technical', 'administrative']
    })
  });

  return await response.json();
};
```

---

### Document Content Search

Full-text search within document content with highlighting.

**Endpoint:** `POST /document-content-search`

**Request Body:**
```json
{
  "query": "climate change mitigation",
  "document_ids": ["doc-123", "doc-456"],
  "search_mode": "exact",
  "highlight": true,
  "limit": 20,
  "offset": 0
}
```

**Response (200 OK):**
```json
{
  "results": [
    {
      "document_id": "doc-123",
      "title": "Climate Policy Brief 2024",
      "matches": [
        {
          "page_number": 3,
          "snippet": "...strategies for <mark>climate change mitigation</mark> through international...",
          "position": { "x": 100, "y": 200 },
          "relevance_score": 0.95
        }
      ],
      "total_matches": 5
    }
  ],
  "total": 1,
  "query_time_ms": 45
}
```

**Implementation Example:**
```typescript
const searchDocumentContent = async (query: string, documentIds?: string[]) => {
  const response = await fetch('/document-content-search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      document_ids: documentIds,
      highlight: true
    })
  });

  return await response.json();
};
```

---

### OCR Extract

Extract text from images and PDFs using OCR (Optical Character Recognition).

**Endpoint:** `POST /ocr-extract`

**Request Body:**
```json
{
  "document_id": "doc-550e8400-e29b-41d4-a716-446655440000",
  "file_path": "documents/scanned-report.pdf",
  "language": "eng+ara",
  "output_format": "text",
  "detect_tables": true
}
```

**Response (200 OK):**
```json
{
  "document_id": "doc-550e8400-e29b-41d4-a716-446655440000",
  "extracted_text": "Full extracted text content...",
  "pages": [
    {
      "page_number": 1,
      "text": "Page 1 text content...",
      "confidence": 0.94,
      "language": "eng",
      "tables": []
    }
  ],
  "metadata": {
    "total_pages": 5,
    "processing_time_ms": 3500,
    "languages_detected": ["eng", "ara"]
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid file format or missing parameters
- `401 Unauthorized` - Missing authorization header
- `404 Not Found` - Document or file not found
- `500 Internal Server Error` - OCR processing failed

**Implementation Example:**
```typescript
const extractOCR = async (documentId: string, filePath: string) => {
  const response = await fetch('/ocr-extract', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      document_id: documentId,
      file_path: filePath,
      language: 'eng+ara',
      detect_tables: true
    })
  });

  return await response.json();
};
```

**Notes:**
- Supports English and Arabic text recognition
- Table detection extracts structured data
- Processing time depends on document size and complexity

---

### Document OCR Process

Process a document for OCR with queue management and status tracking.

**Endpoint:** `POST /document-ocr-process`

**Request Body:**
```json
{
  "document_id": "doc-550e8400-e29b-41d4-a716-446655440000",
  "priority": "normal",
  "notify_on_complete": true
}
```

**Response (202 Accepted):**
```json
{
  "job_id": "ocr-job-123",
  "document_id": "doc-550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "estimated_completion": "2024-01-20T10:05:00Z",
  "queue_position": 3
}
```

**Check Status - GET Request:**

**Endpoint:** `GET /document-ocr-process?job_id={id}`

**Response (200 OK):**
```json
{
  "job_id": "ocr-job-123",
  "document_id": "doc-550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 100,
  "result": {
    "extracted_text": "Full text...",
    "pages": 5,
    "confidence": 0.92
  },
  "completed_at": "2024-01-20T10:04:30Z"
}
```

**Implementation Example:**
```typescript
const processOCR = async (documentId: string) => {
  const response = await fetch('/document-ocr-process', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      document_id: documentId,
      priority: 'normal',
      notify_on_complete: true
    })
  });

  return await response.json();
};
```

---

### Document Preview

Generate document previews (thumbnails, web-optimized versions).

**Endpoint:** `GET /document-preview?document_id={id}&type={type}`

**Query Parameters:**
- `document_id` (required): UUID of the document
- `type` (optional): Preview type (thumbnail, small, medium, large, default: thumbnail)
- `page` (optional): Page number for multi-page documents (default: 1)

**Response (200 OK):**
```json
{
  "document_id": "doc-550e8400-e29b-41d4-a716-446655440000",
  "preview_url": "https://storage.supabase.co/previews/doc-123-thumbnail.jpg",
  "type": "thumbnail",
  "width": 200,
  "height": 280,
  "expires_at": "2024-01-20T22:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing document_id
- `401 Unauthorized` - Missing authorization header
- `404 Not Found` - Document not found or preview unavailable
- `500 Internal Server Error` - Preview generation failed

**Implementation Example:**
```typescript
const getDocumentPreview = async (documentId: string, type = 'thumbnail') => {
  const params = new URLSearchParams({
    document_id: documentId,
    type
  });

  const response = await fetch(`/document-preview?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

---

### Document Templates

Manage document templates for standardized document creation.

**Endpoint (GET):** `GET /document-templates`
**Endpoint (POST):** `POST /document-templates`

**List Templates - GET Request:**

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "template-123",
      "name": "Policy Brief Template",
      "name_ar": "نموذج موجز السياسة",
      "category": "policy",
      "fields": [
        {
          "name": "title",
          "type": "text",
          "required": true
        },
        {
          "name": "executive_summary",
          "type": "textarea",
          "required": true
        }
      ],
      "created_at": "2024-01-10T08:00:00Z"
    }
  ],
  "total": 15
}
```

**Create from Template - POST Request:**

**Request Body:**
```json
{
  "template_id": "template-123",
  "title": "Climate Policy Brief 2024",
  "data": {
    "executive_summary": "Summary content...",
    "recommendations": "Recommendations..."
  }
}
```

**Response (201 Created):**
```json
{
  "document_id": "doc-550e8400-e29b-41d4-a716-446655440000",
  "template_id": "template-123",
  "created_at": "2024-01-20T10:00:00Z"
}
```

**Implementation Example:**
```typescript
const createFromTemplate = async (templateId: string, data: Record<string, any>) => {
  const response = await fetch('/document-templates', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      template_id: templateId,
      data
    })
  });

  return await response.json();
};
```

---

### PDF Generate

Generate PDF documents from HTML content or templates.

**Endpoint:** `POST /pdf-generate`

**Request Body:**
```json
{
  "html_content": "<html><body><h1>Climate Policy Brief</h1><p>Content...</p></body></html>",
  "options": {
    "format": "A4",
    "orientation": "portrait",
    "margin": {
      "top": "2cm",
      "bottom": "2cm",
      "left": "2cm",
      "right": "2cm"
    },
    "header": "<div>Header content</div>",
    "footer": "<div>Page {{page}} of {{pages}}</div>",
    "display_header_footer": true
  },
  "filename": "climate-brief-2024.pdf"
}
```

**Response (200 OK):**
```json
{
  "file_path": "generated/climate-brief-2024.pdf",
  "file_size": 1024000,
  "pages": 12,
  "download_url": "https://storage.supabase.co/generated/climate-brief-2024.pdf",
  "expires_at": "2024-01-21T10:00:00Z",
  "checksum": "sha256:def456..."
}
```

**Error Responses:**
- `400 Bad Request` - Invalid HTML or options
- `401 Unauthorized` - Missing authorization header
- `500 Internal Server Error` - PDF generation failed

**Implementation Example:**
```typescript
const generatePDF = async (htmlContent: string, options?: PDFOptions) => {
  const response = await fetch('/pdf-generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      html_content: htmlContent,
      options: {
        format: 'A4',
        orientation: 'portrait',
        ...options
      }
    })
  });

  return await response.json();
};
```

**Notes:**
- Supports bilingual content (RTL for Arabic)
- Generated PDFs are temporarily stored (24-hour expiration)
- Headers and footers support dynamic placeholders

---

## Related APIs

- **Attachments API** - File upload/download for document files
- **Search API** - Cross-document semantic search
- **Dossiers API** - Link documents to dossiers
- **Positions API** - Attach documents to policy positions

## Performance Considerations

- **OCR Processing**: Large documents may take 30-60 seconds
- **PDF Generation**: Typically completes in 2-5 seconds
- **Content Search**: Indexed search completes in <100ms
- **Preview Generation**: Cached for 24 hours

## Security & Access Control

All document operations enforce organization-level RLS:
- Users can only access documents within their organization
- Document sharing requires explicit permission grants
- Annotations are user-specific but visible to authorized viewers
- File downloads require valid authentication tokens
