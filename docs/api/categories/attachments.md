# Attachments API

## Overview

The Attachments API provides secure file upload, download, and management capabilities for the GASTAT International Dossier System. It supports multiple file types, automatic virus scanning, file compression, and integrates with Supabase Storage for scalable file management.

**Key Features:**
- Secure file upload with multipart/form-data support
- File download with presigned URLs (time-limited)
- Virus scanning and malware detection
- File compression and optimization
- Thumbnail generation for images and PDFs
- File metadata extraction (size, MIME type, checksum)
- Attachment linking to entities (documents, positions, engagements, etc.)
- Bilingual file naming and descriptions
- Storage quota management

## Endpoints

### Upload Attachment

Upload a file and attach it to an entity (document, position, engagement, etc.).

**Endpoint:** `POST /attachments-upload`

**Request (Multipart Form Data):**
```
POST /attachments-upload
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="climate-report-2024.pdf"
Content-Type: application/pdf

[Binary file content]
------WebKitFormBoundary
Content-Disposition: form-data; name="metadata"

{
  "entity_type": "document",
  "entity_id": "doc-550e8400-e29b-41d4-a716-446655440000",
  "filename": "Climate Policy Report 2024",
  "filename_ar": "تقرير سياسة المناخ 2024",
  "description": "Comprehensive climate policy analysis",
  "description_ar": "تحليل شامل لسياسة المناخ",
  "tags": ["climate", "policy", "2024"],
  "visibility": "organization"
}
------WebKitFormBoundary--
```

**Response (201 Created):**
```json
{
  "id": "att-550e8400-e29b-41d4-a716-446655440000",
  "entity_type": "document",
  "entity_id": "doc-550e8400-e29b-41d4-a716-446655440000",
  "filename": "Climate Policy Report 2024",
  "filename_ar": "تقرير سياسة المناخ 2024",
  "original_filename": "climate-report-2024.pdf",
  "file_path": "attachments/2024/01/climate-report-2024-abc123.pdf",
  "mime_type": "application/pdf",
  "file_size": 2048576,
  "checksum": "sha256:abc123def456...",
  "virus_scan_status": "clean",
  "uploaded_by": "user-id",
  "created_at": "2024-01-20T10:30:00Z",
  "storage_bucket": "attachments",
  "thumbnail_url": null
}
```

**Error Responses:**
- `400 Bad Request` - Missing file or invalid metadata
- `401 Unauthorized` - Missing or invalid authorization header
- `403 Forbidden` - User lacks permission to upload to this entity
- `413 Payload Too Large` - File exceeds size limit (default: 50MB)
- `415 Unsupported Media Type` - File type not allowed
- `422 Unprocessable Entity` - Virus detected in file
- `500 Internal Server Error` - Upload failed
- `507 Insufficient Storage` - Storage quota exceeded

**Supported File Types:**
- Documents: PDF, DOCX, XLSX, PPTX, TXT, MD
- Images: JPG, PNG, GIF, SVG, WEBP
- Archives: ZIP, RAR, 7Z, TAR, GZ
- Others: CSV, JSON, XML

**File Size Limits:**
- Default: 50MB per file
- Images: 10MB per file
- Archives: 100MB per file
- Admin users: 500MB per file

**Implementation Example:**
```typescript
const uploadAttachment = async (
  file: File,
  entityType: string,
  entityId: string,
  metadata?: AttachmentMetadata
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify({
    entity_type: entityType,
    entity_id: entityId,
    filename: metadata?.filename || file.name,
    filename_ar: metadata?.filenameAr,
    description: metadata?.description,
    tags: metadata?.tags || [],
    visibility: metadata?.visibility || 'organization'
  }));

  const response = await fetch('/attachments-upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_ar || error.error);
  }

  return await response.json();
};

// React hook for file upload with progress
const useFileUpload = () => {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File, entityType: string, entityId: string) => {
    setUploading(true);
    setProgress(0);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        setProgress((e.loaded / e.total) * 100);
      }
    });

    return new Promise((resolve, reject) => {
      xhr.onload = () => {
        setUploading(false);
        if (xhr.status === 201) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error('Upload failed'));
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        reject(new Error('Network error'));
      };

      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify({
        entity_type: entityType,
        entity_id: entityId
      }));

      xhr.open('POST', '/attachments-upload');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  };

  return { upload, progress, uploading };
};
```

**Notes:**
- Files are automatically scanned for viruses upon upload
- Checksums (SHA-256) are calculated for integrity verification
- Image thumbnails are generated asynchronously
- File paths are organized by date: `attachments/YYYY/MM/filename-hash.ext`
- Original filenames are preserved in metadata

---

### Download Attachment

Download a file using a time-limited presigned URL.

**Endpoint:** `GET /attachments-download?attachment_id={id}`

**Query Parameters:**
- `attachment_id` (required): UUID of the attachment
- `expires_in` (optional): URL expiration in seconds (default: 3600, max: 86400)
- `inline` (optional): Display inline instead of download (default: false)

**Response (200 OK):**
```json
{
  "attachment_id": "att-550e8400-e29b-41d4-a716-446655440000",
  "filename": "Climate Policy Report 2024",
  "download_url": "https://zkrcjzdemdmwhearhfgg.supabase.co/storage/v1/object/sign/attachments/2024/01/climate-report-abc123.pdf?token=eyJhbGc...",
  "expires_at": "2024-01-20T11:30:00Z",
  "file_size": 2048576,
  "mime_type": "application/pdf"
}
```

**Error Responses:**
- `400 Bad Request` - Missing attachment_id parameter
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - User lacks permission to download this file
- `404 Not Found` - Attachment not found
- `410 Gone` - File deleted or expired

**Implementation Example:**
```typescript
const downloadAttachment = async (attachmentId: string, inline = false) => {
  const params = new URLSearchParams({
    attachment_id: attachmentId,
    inline: inline.toString()
  });

  const response = await fetch(`/attachments-download?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_ar || error.error);
  }

  const data = await response.json();

  // Trigger browser download
  const link = document.createElement('a');
  link.href = data.download_url;
  link.download = data.filename;
  link.click();

  return data;
};

// Direct file fetch (for preview)
const getAttachmentBlob = async (attachmentId: string) => {
  const { download_url } = await downloadAttachment(attachmentId, true);

  const response = await fetch(download_url);
  return await response.blob();
};
```

**Security:**
- Presigned URLs expire after specified duration (default: 1 hour)
- URLs are single-use and cannot be shared
- Download activity is logged for audit
- RLS policies enforce access control

---

### List Attachments

Retrieve attachments for an entity with filtering and pagination.

**Endpoint:** `GET /attachments-list`

**Query Parameters:**
- `entity_type` (required): Entity type (document, position, engagement, etc.)
- `entity_id` (required): UUID of the entity
- `mime_type` (optional): Filter by MIME type (e.g., "application/pdf")
- `tags` (optional): Comma-separated tags
- `uploaded_by` (optional): Filter by uploader user ID
- `sort` (optional): Sort field (filename, created_at, file_size, default: created_at)
- `order` (optional): Sort order (asc or desc, default: desc)
- `limit` (optional): Page size (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "att-123",
      "filename": "Climate Policy Report 2024",
      "filename_ar": "تقرير سياسة المناخ 2024",
      "original_filename": "climate-report-2024.pdf",
      "mime_type": "application/pdf",
      "file_size": 2048576,
      "checksum": "sha256:abc123...",
      "tags": ["climate", "policy"],
      "virus_scan_status": "clean",
      "uploaded_by": "user-id",
      "uploader_name": "Ahmed Al-Rashid",
      "created_at": "2024-01-20T10:30:00Z",
      "thumbnail_url": "https://storage.supabase.co/thumbnails/att-123.jpg"
    },
    {
      "id": "att-456",
      "filename": "Budget Analysis.xlsx",
      "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "file_size": 512000,
      "uploaded_by": "user-id-2",
      "created_at": "2024-01-19T14:00:00Z"
    }
  ],
  "total": 8,
  "total_size": 15728640,
  "limit": 20,
  "offset": 0,
  "has_more": false
}
```

**Implementation Example:**
```typescript
const listAttachments = async (
  entityType: string,
  entityId: string,
  filters?: {
    mimeType?: string;
    tags?: string[];
    uploadedBy?: string;
  }
) => {
  const params = new URLSearchParams({
    entity_type: entityType,
    entity_id: entityId,
    limit: '20'
  });

  if (filters?.mimeType) params.append('mime_type', filters.mimeType);
  if (filters?.tags) params.append('tags', filters.tags.join(','));
  if (filters?.uploadedBy) params.append('uploaded_by', filters.uploadedBy);

  const response = await fetch(`/attachments-list?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};

// Get all PDF attachments
const getPDFAttachments = (entityType: string, entityId: string) => {
  return listAttachments(entityType, entityId, {
    mimeType: 'application/pdf'
  });
};
```

**Notes:**
- Total size is calculated for all attachments on the entity
- Thumbnails are available for images and PDFs
- Deleted attachments are excluded from results

---

### Delete Attachment

Soft delete an attachment (archives instead of permanently removing).

**Endpoint:** `DELETE /attachments-delete`

**Request Body:**
```json
{
  "attachment_id": "att-550e8400-e29b-41d4-a716-446655440000",
  "reason": "Outdated content",
  "permanent": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Attachment deleted successfully",
  "message_ar": "تم حذف المرفق بنجاح",
  "attachment_id": "att-550e8400-e29b-41d4-a716-446655440000",
  "deleted_at": "2024-01-20T15:00:00Z",
  "permanent": false
}
```

**Error Responses:**
- `400 Bad Request` - Missing attachment_id
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - User lacks permission to delete this attachment
- `404 Not Found` - Attachment not found

**Implementation Example:**
```typescript
const deleteAttachment = async (
  attachmentId: string,
  reason?: string,
  permanent = false
) => {
  const response = await fetch('/attachments-delete', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      attachment_id: attachmentId,
      reason,
      permanent
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
- Soft delete (default): File is archived and can be restored by admins
- Permanent delete: File is immediately removed from storage (requires admin role)
- Deletion is logged for audit trail
- Associated thumbnails are also deleted

---

### Get Attachment Metadata

Retrieve attachment information without downloading the file.

**Endpoint:** `GET /attachments?attachment_id={id}`

**Query Parameters:**
- `attachment_id` (required): UUID of the attachment
- `include_access_log` (optional): Include recent access history (default: false)

**Response (200 OK):**
```json
{
  "id": "att-550e8400-e29b-41d4-a716-446655440000",
  "entity_type": "document",
  "entity_id": "doc-123",
  "filename": "Climate Policy Report 2024",
  "filename_ar": "تقرير سياسة المناخ 2024",
  "description": "Comprehensive climate policy analysis",
  "description_ar": "تحليل شامل لسياسة المناخ",
  "original_filename": "climate-report-2024.pdf",
  "file_path": "attachments/2024/01/climate-report-abc123.pdf",
  "mime_type": "application/pdf",
  "file_size": 2048576,
  "checksum": "sha256:abc123def456...",
  "tags": ["climate", "policy", "2024"],
  "visibility": "organization",
  "virus_scan_status": "clean",
  "virus_scan_date": "2024-01-20T10:30:15Z",
  "uploaded_by": "user-id",
  "uploader_name": "Ahmed Al-Rashid",
  "created_at": "2024-01-20T10:30:00Z",
  "updated_at": "2024-01-20T10:30:00Z",
  "thumbnail_url": "https://storage.supabase.co/thumbnails/att-123.jpg",
  "download_count": 15,
  "last_accessed": "2024-01-20T14:30:00Z",
  "access_log": [
    {
      "user_id": "user-456",
      "user_name": "Sara Al-Mutairi",
      "accessed_at": "2024-01-20T14:30:00Z",
      "action": "download"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Missing attachment_id parameter
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - User lacks permission to view this attachment
- `404 Not Found` - Attachment not found

**Implementation Example:**
```typescript
const getAttachmentMetadata = async (
  attachmentId: string,
  includeAccessLog = false
) => {
  const params = new URLSearchParams({
    attachment_id: attachmentId,
    include_access_log: includeAccessLog.toString()
  });

  const response = await fetch(`/attachments?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_ar || error.error);
  }

  return await response.json();
};

// Display file size in human-readable format
const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
};

// Example: Show attachment info card
const AttachmentCard = ({ attachmentId }: { attachmentId: string }) => {
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    getAttachmentMetadata(attachmentId).then(setMetadata);
  }, [attachmentId]);

  if (!metadata) return <Skeleton />;

  return (
    <div className="attachment-card">
      <h3>{metadata.filename}</h3>
      <p>{formatFileSize(metadata.file_size)}</p>
      <p>Uploaded by {metadata.uploader_name}</p>
      <p>Downloads: {metadata.download_count}</p>
    </div>
  );
};
```

---

## File Processing Features

### Virus Scanning

All uploaded files are automatically scanned for viruses and malware:

- **Clean**: File passed virus scan
- **Infected**: Virus detected (upload rejected)
- **Quarantined**: Suspicious file quarantined for review
- **Scanning**: Scan in progress (async for large files)

**Scan Status Response:**
```json
{
  "virus_scan_status": "clean",
  "virus_scan_date": "2024-01-20T10:30:15Z",
  "scan_engine": "ClamAV",
  "scan_version": "1.0.0"
}
```

### Thumbnail Generation

Thumbnails are automatically generated for supported file types:

- **Images**: JPG, PNG, GIF, WEBP (200x200px)
- **PDFs**: First page thumbnail (200x280px)
- **Videos**: First frame thumbnail (experimental)

**Thumbnail URL Format:**
```
https://storage.supabase.co/thumbnails/{attachment_id}.jpg?expires={timestamp}&token={jwt}
```

### File Compression

Large files are automatically compressed to save storage:

- **Images**: WebP conversion with 85% quality
- **PDFs**: PDF optimization (removes unused objects)
- **Archives**: Re-compression with optimal settings

**Compression Stats:**
```json
{
  "original_size": 5242880,
  "compressed_size": 2097152,
  "compression_ratio": 0.6,
  "savings_bytes": 3145728
}
```

---

## Storage Quotas

Storage quotas are enforced per organization:

| Plan | Storage Limit | File Size Limit | Transfer Limit |
|------|---------------|-----------------|----------------|
| Free | 5 GB | 25 MB | 10 GB/month |
| Pro | 100 GB | 100 MB | 500 GB/month |
| Enterprise | Unlimited | 500 MB | Unlimited |

**Quota Exceeded Response (507):**
```json
{
  "error": {
    "code": "storage_quota_exceeded",
    "message": "Storage quota exceeded. Please upgrade your plan.",
    "message_ar": "تم تجاوز حصة التخزين. يرجى ترقية خطتك.",
    "quota": {
      "used": 5368709120,
      "limit": 5368709120,
      "available": 0,
      "usage_percentage": 100
    }
  }
}
```

---

## Related APIs

- **Documents API** - Document file management
- **Positions API** - Attach supporting documents
- **Engagements API** - Meeting materials and agendas
- **Dossiers API** - Country/organization documents

## Performance Considerations

- **Upload speed**: Depends on file size and network (typical: 5-10 MB/s)
- **Virus scan**: <5 seconds for files <10MB, async for larger files
- **Thumbnail generation**: <3 seconds for images, <10 seconds for PDFs
- **Download URLs**: Presigned URLs are generated instantly (<50ms)
- **Storage**: Powered by Supabase Storage (S3-compatible)

## Security & Access Control

All attachment operations enforce access control:
- **Organization-level**: Files are scoped to organizations
- **Entity-level**: Access controlled by linked entity permissions
- **User-level**: Upload/delete permissions based on roles
- **Visibility**: `public` (all org members), `restricted` (specific users), `private` (uploader only)
- **Encryption**: Files encrypted at rest (AES-256)
- **Audit logging**: All operations logged for compliance

## Best Practices

1. **Always scan files**: Virus scan results are checked before allowing downloads
2. **Use presigned URLs**: Don't store long-term download URLs
3. **Handle large files**: Use progress indicators for files >5MB
4. **Validate MIME types**: Check file type before upload
5. **Set expiration**: Use short expiration times for sensitive files
6. **Tag files**: Use consistent tagging for easier search
7. **Bilingual metadata**: Provide both English and Arabic filenames/descriptions
8. **Monitor quotas**: Check storage usage regularly
