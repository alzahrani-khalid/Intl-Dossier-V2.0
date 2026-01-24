# Data Management API

## Overview

The Data Management API handles data import/export, content libraries, entity templates, data retention, content expiration, and sample data generation. All endpoints support bulk operations and bilingual content.

## Endpoints

### Data Import

Import data from external sources.

**Endpoint:** `POST /data-import`

**Request Body:**
```json
{
  "import_type": "positions",
  "format": "csv",
  "file_url": "https://storage.supabase.co/imports/positions.csv",
  "mapping": {
    "title_en": "Title (EN)",
    "title_ar": "Title (AR)",
    "content_en": "Content",
    "thematic_category": "Category"
  },
  "options": {
    "skip_duplicates": true,
    "update_existing": false,
    "validate_before_import": true
  }
}
```

**Response (202 Accepted):**
```json
{
  "import_id": "import-uuid",
  "import_type": "positions",
  "status": "validating",
  "total_rows": 245,
  "estimated_completion_minutes": 5,
  "validation_errors": [],
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Status Check (GET /data-import?import_id={id}):**
```json
{
  "import_id": "import-uuid",
  "status": "completed",
  "total_rows": 245,
  "imported": 240,
  "skipped": 3,
  "failed": 2,
  "errors": [
    {
      "row": 15,
      "error": "Invalid thematic_category value",
      "error_ar": "قيمة الفئة الموضوعية غير صالحة"
    }
  ],
  "completed_at": "2024-01-15T10:35:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid import_type or format
  ```json
  {
    "error": "Unsupported format. Supported formats: csv, xlsx, json",
    "error_ar": "تنسيق غير مدعوم. التنسيقات المدعومة: csv، xlsx، json"
  }
  ```
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to import data (requires admin role)
- `500 Internal Server Error` - Import failed

**Supported Import Types:**
- `positions` - Position papers
- `dossiers` - Dossiers (countries, organizations, etc.)
- `intake_tickets` - Service intake tickets
- `assignments` - Task assignments
- `users` - User accounts (admin only)
- `relationships` - Dossier relationships

**Supported Formats:**
- `csv` - Comma-separated values
- `xlsx` - Excel spreadsheet
- `json` - JSON array

---

### Data Export

Export data to external formats.

**Endpoint:** `POST /data-export`

**Request Body:**
```json
{
  "export_type": "positions",
  "format": "xlsx",
  "filters": {
    "status": ["published"],
    "date_from": "2024-01-01",
    "date_to": "2024-01-31"
  },
  "columns": [
    "id",
    "title_en",
    "title_ar",
    "thematic_category",
    "status",
    "created_at",
    "author_name"
  ],
  "include_related": {
    "audience_groups": true,
    "dossiers": true
  }
}
```

**Response (202 Accepted):**
```json
{
  "export_id": "export-uuid",
  "export_type": "positions",
  "status": "generating",
  "estimated_rows": 240,
  "estimated_completion_minutes": 3,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Status Check (GET /data-export?export_id={id}):**
```json
{
  "export_id": "export-uuid",
  "status": "completed",
  "rows_exported": 240,
  "file_size_bytes": 524288,
  "download_url": "https://storage.supabase.co/exports/export-uuid.xlsx",
  "expires_at": "2024-01-22T10:30:00Z",
  "completed_at": "2024-01-15T10:33:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid export_type or filters
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to export data
- `500 Internal Server Error` - Export failed

---

### Data Library

Manage reusable content library (templates, snippets, boilerplate).

**Endpoint:** `GET /data-library?category={category}` or `POST /data-library`

**List Library Items:**
```http
GET /data-library?category=position_templates&language=en
```

**Response (200 OK):**
```json
{
  "items": [
    {
      "item_id": "lib-uuid",
      "category": "position_templates",
      "title_en": "Bilateral Climate Cooperation Template",
      "title_ar": "قالب التعاون الثنائي في مجال المناخ",
      "content_en": "Template content...",
      "content_ar": "محتوى القالب...",
      "tags": ["climate", "bilateral", "environment"],
      "usage_count": 45,
      "created_at": "2023-06-15T10:00:00Z",
      "updated_at": "2024-01-10T15:30:00Z"
    }
  ],
  "total": 28,
  "categories": ["position_templates", "talking_points", "boilerplate_text"]
}
```

**Create Library Item:**

**Request Body:**
```json
{
  "category": "position_templates",
  "title_en": "New Template",
  "title_ar": "قالب جديد",
  "content_en": "Template content...",
  "content_ar": "محتوى القالب...",
  "tags": ["tag1", "tag2"],
  "visibility": "organization"
}
```

**Response (201 Created):**
```json
{
  "item_id": "lib-uuid",
  "created_at": "2024-01-15T10:30:00Z",
  "created_by": "user-uuid"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid category or missing required fields
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Creation failed

---

### Entity Templates

Manage entity templates for quick creation.

**Endpoint:** `GET /entity-templates?entity_type={type}` or `POST /entity-templates`

**List Templates:**
```http
GET /entity-templates?entity_type=position
```

**Response (200 OK):**
```json
{
  "templates": [
    {
      "template_id": "tmpl-uuid",
      "entity_type": "position",
      "name_en": "Standard Bilateral Position",
      "name_ar": "موقف ثنائي قياسي",
      "description_en": "Template for bilateral policy positions",
      "template_data": {
        "position_type_id": "type-uuid",
        "thematic_category": "bilateral",
        "structure": {
          "sections": [
            "background",
            "key_points",
            "talking_points",
            "q_and_a"
          ]
        }
      },
      "usage_count": 67,
      "is_default": true
    }
  ],
  "total": 12
}
```

**Create Template:**

**Request Body:**
```json
{
  "entity_type": "position",
  "name_en": "Economic Partnership Template",
  "name_ar": "قالب الشراكة الاقتصادية",
  "template_data": {
    "position_type_id": "type-uuid",
    "thematic_category": "economy",
    "default_sections": ["overview", "benefits", "risks"]
  },
  "is_default": false
}
```

**Response (201 Created):**
```json
{
  "template_id": "tmpl-uuid",
  "entity_type": "position",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### Data Retention

Configure data retention policies.

**Endpoint:** `GET /data-retention` or `POST /data-retention`

**Get Retention Policies:**
```http
GET /data-retention
```

**Response (200 OK):**
```json
{
  "policies": [
    {
      "policy_id": "policy-uuid",
      "entity_type": "intake_ticket",
      "retention_period_days": 2555,
      "action": "archive",
      "conditions": {
        "status": ["closed", "resolved"]
      },
      "last_run": "2024-01-14T00:00:00Z",
      "next_run": "2024-01-15T00:00:00Z",
      "records_processed_last_run": 45
    }
  ],
  "total": 8
}
```

**Create Retention Policy:**

**Request Body:**
```json
{
  "entity_type": "audit_logs",
  "retention_period_days": 2555,
  "action": "delete",
  "conditions": {},
  "schedule": "0 0 * * 0"
}
```

**Response (201 Created):**
```json
{
  "policy_id": "policy-uuid",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### Retention Processor

Execute data retention policies (cron job endpoint).

**Endpoint:** `POST /retention-processor`

**Request Body:**
```json
{
  "execution_time": "2024-01-15T00:00:00Z",
  "dry_run": false
}
```

**Response (200 OK):**
```json
{
  "processed": true,
  "policies_executed": 8,
  "records_archived": 145,
  "records_deleted": 23,
  "execution_time_ms": 4523,
  "next_run": "2024-01-16T00:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid service role key
- `500 Internal Server Error` - Processing failed

---

### Content Expiration

Set content expiration dates for temporary content.

**Endpoint:** `POST /content-expiration`

**Request Body:**
```json
{
  "entity_type": "document",
  "entity_id": "doc-uuid",
  "expires_at": "2024-12-31T23:59:59Z",
  "action": "archive",
  "notify_before_days": 7
}
```

**Response (200 OK):**
```json
{
  "expiration_id": "exp-uuid",
  "entity_type": "document",
  "entity_id": "doc-uuid",
  "expires_at": "2024-12-31T23:59:59Z",
  "notification_scheduled": "2024-12-24T00:00:00Z"
}
```

---

### Content Expiration Processor

Process expired content (cron job endpoint).

**Endpoint:** `POST /content-expiration-processor`

**Request Body:**
```json
{
  "execution_time": "2024-01-15T00:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "processed": true,
  "items_expired": 12,
  "items_archived": 10,
  "items_deleted": 2,
  "notifications_sent": 15,
  "execution_time_ms": 2341
}
```

---

### Sample Data

Generate sample/demo data for testing (development/staging only).

**Endpoint:** `POST /sample-data`

**Request Body:**
```json
{
  "entity_types": ["positions", "dossiers", "assignments"],
  "count_per_type": 50,
  "include_relationships": true,
  "language": "both"
}
```

**Response (201 Created):**
```json
{
  "generated": true,
  "entities_created": {
    "positions": 50,
    "dossiers": 50,
    "assignments": 50,
    "relationships": 75
  },
  "execution_time_ms": 15234
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid service role key
- `403 Forbidden` - Not allowed in production environment
- `500 Internal Server Error` - Generation failed

**Notes:**
- Only available in development and staging environments
- Blocked in production via environment check
- Sample data marked with `is_sample: true` flag
- Can be bulk deleted with DELETE /sample-data

---

## Data Management Best Practices

1. **Import Validation**: Always set `validate_before_import: true` to catch errors early
2. **Export Scheduling**: Use scheduled exports for regular backups
3. **Retention Policies**: Review policies quarterly to ensure compliance
4. **Content Expiration**: Set expiration for temporary/sensitive content
5. **Library Organization**: Use consistent tagging for easy discovery

## Retention Actions

| Action | Description | Reversible |
|--------|-------------|------------|
| `archive` | Move to archive (read-only) | Yes |
| `soft_delete` | Mark as deleted (can restore) | Yes (within 30 days) |
| `delete` | Permanently delete | No |
| `anonymize` | Remove PII, keep data | No |

## Related APIs

- [Administration](./administration.md) - Audit logs for compliance
- [Documents](./documents.md) - Document versioning and storage
- [Analytics](./analytics-reporting.md) - Data export for reporting
