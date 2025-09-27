# Export Operations API

## Overview

Export endpoints enable users to extract data in various formats with support for large datasets through streaming and progress tracking.

## Request Export

### Create Export Request

**Endpoint:** `POST /export`

**Request Body:**
```json
{
  "resource_type": "dossiers",
  "format": "excel",
  "filters": {
    "status": "active",
    "country": "SA",
    "date_from": "2024-01-01",
    "date_to": "2024-12-31"
  },
  "columns": [
    "id",
    "title",
    "title_ar",
    "status",
    "created_at",
    "country",
    "organization"
  ]
}
```

**Response (202 Accepted):**
```json
{
  "id": "850e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "estimated_rows": 50000,
  "estimated_completion": "2024-01-15T10:35:00Z"
}
```

**Format Options:**
- `csv` - Comma-separated values
- `json` - JSON lines format (streaming)
- `excel` - Microsoft Excel (.xlsx)

**Rate Limiting:**
- 10 export requests per hour per user
- Maximum 100,000 rows per export
- 24-hour retention for completed exports

---

### Check Export Status

**Endpoint:** `GET /export/{id}`

**Response (200 OK - Processing):**
```json
{
  "id": "850e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": 45.5,
  "row_count": 22750,
  "file_size_bytes": null,
  "download_url": null,
  "expires_at": null,
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": null,
  "error_message": null
}
```

**Response (200 OK - Completed):**
```json
{
  "id": "850e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 100,
  "row_count": 50000,
  "file_size_bytes": 15728640,
  "download_url": "/export/850e8400-e29b-41d4-a716-446655440000/download",
  "expires_at": "2024-01-16T10:35:00Z",
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:35:00Z",
  "error_message": null
}
```

**Status Values:**
- `pending` - Export queued
- `processing` - Export in progress
- `completed` - Ready for download
- `failed` - Export failed

---

### Download Export

**Endpoint:** `GET /export/{id}/download`

**Response Headers:**
```http
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="export_2024-01-15_dossiers.xlsx"
Content-Length: 15728640
Cache-Control: private, no-cache
```

**Response (200 OK):** Binary file stream

**Error Responses:**
- `404 Not Found` - Export not found or not ready
- `410 Gone` - Export expired

## Implementation Examples

### Request and Monitor Export

```typescript
// Request export with progress monitoring
const exportData = async (filters: ExportFilters) => {
  // 1. Create export request
  const response = await fetch('/export', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      resource_type: 'dossiers',
      format: 'excel',
      filters,
      columns: ['id', 'title', 'status', 'created_at']
    })
  });
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    throw new Error(`Rate limit exceeded. Try again in ${retryAfter} seconds`);
  }
  
  const { id, estimated_completion } = await response.json();
  
  // 2. Monitor progress
  return pollExportStatus(id, estimated_completion);
};

// Poll for export completion
const pollExportStatus = async (exportId: string, estimatedTime: string) => {
  const pollInterval = 2000; // 2 seconds
  const maxAttempts = 60; // 2 minutes max
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const response = await fetch(`/export/${exportId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const status = await response.json();
    
    // Update UI with progress
    updateProgressBar(status.progress);
    
    if (status.status === 'completed') {
      return status;
    }
    
    if (status.status === 'failed') {
      throw new Error(status.error_message || 'Export failed');
    }
    
    attempts++;
    await sleep(pollInterval);
  }
  
  throw new Error('Export timeout');
};

// Download completed export
const downloadExport = async (exportId: string) => {
  const response = await fetch(`/export/${exportId}/download`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    if (response.status === 410) {
      throw new Error('Export has expired. Please request a new export.');
    }
    throw new Error('Download failed');
  }
  
  // Get filename from Content-Disposition header
  const disposition = response.headers.get('Content-Disposition');
  const filename = disposition
    ?.split('filename=')[1]
    ?.replace(/['"]/g, '') || 'export.xlsx';
  
  // Create download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
```

### Streaming Large Exports

```typescript
// Stream JSON export for processing
const streamJsonExport = async (exportId: string) => {
  const response = await fetch(`/export/${exportId}/download`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  
  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        const record = JSON.parse(line);
        await processRecord(record);
      }
    }
  }
};
```

## Export Formats

### CSV Format

```csv
id,title,title_ar,status,created_at,country,organization
1,"Annual Report","التقرير السنوي","active","2024-01-01T00:00:00Z","SA","GASTAT"
2,"Statistical Bulletin","النشرة الإحصائية","draft","2024-01-02T00:00:00Z","SA","GASTAT"
```

**Characteristics:**
- UTF-8 with BOM for Excel compatibility
- RFC 4180 compliant
- Quoted fields for special characters
- ISO 8601 date format

### JSON Lines Format

```json
{"id":1,"title":"Annual Report","title_ar":"التقرير السنوي","status":"active","created_at":"2024-01-01T00:00:00Z","country":"SA","organization":"GASTAT"}
{"id":2,"title":"Statistical Bulletin","title_ar":"النشرة الإحصائية","status":"draft","created_at":"2024-01-02T00:00:00Z","country":"SA","organization":"GASTAT"}
```

**Characteristics:**
- One JSON object per line
- Streaming-friendly
- No array wrapper
- Compact format

### Excel Format

**Sheet Structure:**
- Sheet 1: Data with headers
- Sheet 2: Metadata (export info, filters applied)
- Auto-filtered headers
- Formatted dates and numbers
- Frozen header row

## Performance Optimization

### Large Dataset Handling

```typescript
// Backend streaming implementation
async function* streamExportData(query: Query) {
  const batchSize = 10000;
  let offset = 0;
  
  while (true) {
    const batch = await database.query({
      ...query,
      limit: batchSize,
      offset
    });
    
    if (batch.length === 0) break;
    
    yield batch;
    offset += batchSize;
    
    // Allow other operations to process
    await setImmediate();
  }
}

// Format and write to file
async function processExport(exportId: string, format: Format) {
  const writer = createWriter(format);
  
  for await (const batch of streamExportData(query)) {
    writer.write(formatBatch(batch, format));
    
    // Update progress
    await updateExportProgress(exportId, {
      progress: (processedRows / totalRows) * 100,
      row_count: processedRows
    });
  }
  
  writer.end();
}
```

### Export Queue Management

```typescript
// Priority queue for exports
class ExportQueue {
  private queue: PriorityQueue<ExportJob>;
  private workers: Worker[];
  
  async addJob(job: ExportJob) {
    // Check rate limits
    const userExports = await this.getUserExportCount(job.userId);
    if (userExports >= 10) {
      throw new RateLimitError('Export limit exceeded');
    }
    
    // Assign priority
    job.priority = this.calculatePriority(job);
    
    // Add to queue
    this.queue.push(job);
    
    // Process if workers available
    this.processNext();
  }
  
  private calculatePriority(job: ExportJob): number {
    let priority = 0;
    
    // Smaller exports have higher priority
    if (job.estimatedRows < 1000) priority += 10;
    else if (job.estimatedRows < 10000) priority += 5;
    
    // User role priority
    if (job.userRole === 'admin') priority += 5;
    
    return priority;
  }
}
```

## Security Considerations

### Permission Validation

```typescript
// Validate export permissions
const validateExportPermissions = async (
  userId: string,
  resourceType: string,
  filters: any
) => {
  // Check resource-level permissions
  const hasAccess = await checkResourceAccess(userId, resourceType);
  if (!hasAccess) {
    throw new ForbiddenError('No access to resource type');
  }
  
  // Apply RLS filters
  const rlsFilters = await getRLSFilters(userId, resourceType);
  filters = { ...filters, ...rlsFilters };
  
  // Validate column access
  const allowedColumns = await getAllowedColumns(userId, resourceType);
  columns = columns.filter(col => allowedColumns.includes(col));
  
  return { filters, columns };
};
```

### Data Sanitization

```typescript
// Sanitize exported data
const sanitizeExportData = (data: any[], userRole: string) => {
  return data.map(record => {
    // Remove sensitive fields
    delete record.internal_notes;
    delete record.audit_metadata;
    
    // Mask PII if not authorized
    if (userRole !== 'admin') {
      record.email = maskEmail(record.email);
      record.phone = maskPhone(record.phone);
    }
    
    return record;
  });
};
```

## Best Practices

### 1. User Experience

- Show accurate progress indicators
- Provide time estimates
- Allow export cancellation
- Send email notification when ready
- Clear expiration warnings

### 2. Performance

- Use pagination for large datasets
- Implement streaming for memory efficiency
- Cache frequently exported data
- Use background jobs for processing
- Optimize database queries with proper indexes

### 3. Error Handling

```typescript
// Comprehensive error handling
const handleExportError = (error: ExportError) => {
  switch (error.code) {
    case 'RATE_LIMIT':
      return {
        message: 'Too many exports. Please try again later.',
        message_ar: 'عدد كبير جداً من عمليات التصدير. يرجى المحاولة لاحقاً.',
        retry_after: error.retryAfter
      };
    
    case 'TIMEOUT':
      return {
        message: 'Export took too long. Try with fewer records.',
        message_ar: 'استغرق التصدير وقتاً طويلاً. حاول مع عدد أقل من السجلات.',
        suggestion: 'Apply more filters'
      };
    
    case 'PERMISSION_DENIED':
      return {
        message: 'You do not have permission to export this data.',
        message_ar: 'ليس لديك إذن لتصدير هذه البيانات.'
      };
    
    default:
      return {
        message: 'Export failed. Please try again.',
        message_ar: 'فشل التصدير. يرجى المحاولة مرة أخرى.'
      };
  }
};
```

## Testing

### Test Scenarios

```bash
# Test small export
curl -X POST /export \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "resource_type": "dossiers",
    "format": "csv",
    "filters": {"limit": 100}
  }'

# Test large export (performance)
curl -X POST /export \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "resource_type": "dossiers",
    "format": "json",
    "filters": {"date_from": "2020-01-01"}
  }'

# Test rate limiting
for i in {1..15}; do
  curl -X POST /export \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"resource_type": "dossiers", "format": "csv"}'
done
```

### Performance Targets

| Export Size | Target Time | Format |
|------------|-------------|---------|
| 1,000 rows | < 2 seconds | All |
| 10,000 rows | < 10 seconds | CSV/JSON |
| 10,000 rows | < 15 seconds | Excel |
| 100,000 rows | < 30 seconds | CSV/JSON |
| 100,000 rows | < 45 seconds | Excel |

---

*For export support, contact: data-services@gastat.gov.sa*