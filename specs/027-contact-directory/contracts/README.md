# API Contracts: Contact Directory

**Feature**: 027-contact-directory
**API Style**: REST via Supabase Edge Functions
**Date**: 2025-10-26

## Endpoint Overview

| Endpoint | Method | Purpose | User Story |
|----------|--------|---------|------------|
| `/contacts` | GET | List/search contacts | P1 (FR-011) |
| `/contacts` | POST | Create contact manually | P1 (FR-001) |
| `/contacts/:id` | GET | Get contact details | P1 |
| `/contacts/:id` | PATCH | Update contact | P1 |
| `/contacts/:id` | DELETE | Archive contact | P1 |
| `/contacts/scan-business-card` | POST | Upload & OCR business card | P2 (FR-003, FR-004, FR-005) |
| `/contacts/extract-document` | POST | Bulk extract from document | P3 (FR-007, FR-008) |
| `/contacts/duplicates` | GET | Detect duplicates | P2 (FR-010) |
| `/contacts/export` | GET | Export CSV/vCard | P1 (FR-021) |
| `/relationships` | GET/POST | Manage contact relationships | P4 (FR-013) |
| `/interaction-notes` | GET/POST | Manage interaction history | P5 (FR-015, FR-016) |
| `/tags` | GET/POST | Manage tags | P4 (FR-014) |
| `/organizations` | GET/POST | Manage organizations | P1 (FR-012) |

## Authentication

All endpoints require **Supabase Auth JWT** in `Authorization` header:

```
Authorization: Bearer <supabase-jwt-token>
```

User ID is extracted from JWT via `auth.uid()` for RLS policies.

---

## 1. List/Search Contacts

**Endpoint**: `GET /contacts`

**Query Parameters**:
- `search` (string, optional): Full-text search on name, organization, email
- `organization_id` (uuid, optional): Filter by organization
- `tags` (uuid[], optional): Filter by tags (comma-separated)
- `source_type` (enum, optional): Filter by source (`manual`, `business_card`, `document`)
- `limit` (integer, default 50, max 500): Pagination limit
- `offset` (integer, default 0): Pagination offset
- `sort_by` (enum, default `created_at`): Sort field (`name`, `organization`, `created_at`)
- `sort_order` (enum, default `desc`): Sort order (`asc`, `desc`)

**Response**: `200 OK`
```json
{
  "contacts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "خالد الزهراني",
      "organization": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "الهيئة العامة للإحصاء"
      },
      "position": "Director of International Cooperation",
      "email_addresses": ["khalid@example.gov.sa"],
      "phone_numbers": ["+966501234567"],
      "tags": [{"id": "770e8400", "name": "UN Statistical Commission", "color": "#3B82F6"}],
      "source_type": "business_card",
      "created_at": "2025-10-26T10:30:00Z"
    }
  ],
  "total_count": 150,
  "has_more": true
}
```

**Performance Target**: <2s for 10,000 contacts (SC-005)

---

## 2. Create Contact Manually

**Endpoint**: `POST /contacts`

**Request Body**:
```json
{
  "full_name": "John Smith",
  "organization_id": "660e8400-e29b-41d4-a716-446655440002",
  "position": "Senior Statistician",
  "email_addresses": ["john.smith@example.org"],
  "phone_numbers": ["+14155551234"],
  "notes": "Met at conference",
  "tags": ["770e8400-e29b-41d4-a716-446655440011"]
}
```

**Response**: `201 Created`
```json
{
  "id": "551e8400-e29b-41d4-a716-446655440005",
  "full_name": "John Smith",
  "organization_id": "660e8400-e29b-41d4-a716-446655440002",
  ...
  "created_at": "2025-10-26T11:00:00Z"
}
```

**Errors**:
- `400 Bad Request`: Validation errors (invalid email, missing required fields)
- `409 Conflict`: Potential duplicate detected

**Performance Target**: <1 minute to create contact (SC-001)

---

## 3. Scan Business Card

**Endpoint**: `POST /contacts/scan-business-card`

**Request**: `multipart/form-data`
```
Content-Type: multipart/form-data

------WebKitFormBoundary
Content-Disposition: form-data; name="image"; filename="business-card.jpg"
Content-Type: image/jpeg

<binary data>
------WebKitFormBoundary
Content-Disposition: form-data; name="consent_cloud_ocr"

true
------WebKitFormBoundary--
```

**Response**: `200 OK`
```json
{
  "document_source_id": "bb0e8400-e29b-41d4-a716-446655440040",
  "extracted_data": {
    "full_name": "خالد الزهراني",
    "organization": "الهيئة العامة للإحصاء",
    "position": "Director of International Cooperation",
    "email_addresses": ["khalid@stats.gov.sa"],
    "phone_numbers": ["+966501234567"]
  },
  "ocr_confidence": 92.5,
  "ocr_language": "ar",
  "processing_time_ms": 4250
}
```

**Workflow**:
1. Upload image to Supabase Storage
2. Create `document_sources` record (status: `processing`)
3. Preprocess image (Sharp: resize, enhance)
4. Run Tesseract OCR (local)
5. If confidence < 75% AND consent_cloud_ocr=true, fallback to Google Vision
6. Parse extracted text to identify fields
7. Return extracted data for user review
8. Update `document_sources` record (status: `completed`)

**Performance Target**: <30s including review (SC-003), <15s OCR processing

**Errors**:
- `400 Bad Request`: Invalid file format, file too large (>50MB)
- `422 Unprocessable Entity`: OCR failed to extract text
- `403 Forbidden`: Cloud OCR requires consent

---

## 4. Extract from Document

**Endpoint**: `POST /contacts/extract-document`

**Request**: `multipart/form-data`
```
Content-Type: multipart/form-data

------WebKitFormBoundary
Content-Disposition: form-data; name="document"; filename="invitation-letter.pdf"
Content-Type: application/pdf

<binary data>
------WebKitFormBoundary--
```

**Response**: `202 Accepted` (async processing)
```json
{
  "document_source_id": "cc0e8400-e29b-41d4-a716-446655440050",
  "status": "processing",
  "estimated_completion_ms": 20000
}
```

**Check Status**: `GET /contacts/extract-document/:document_source_id`

**Response when complete**: `200 OK`
```json
{
  "document_source_id": "cc0e8400-e29b-41d4-a716-446655440050",
  "status": "completed",
  "extracted_contacts": [
    {
      "full_name": "Jane Doe",
      "organization": "UN Statistics Division",
      "position": "Chief Statistician",
      "email_addresses": ["jane.doe@un.org"],
      "phone_numbers": ["+12125551234"]
    },
    {
      "full_name": "Ahmed Hassan",
      "organization": "Arab Institute for Training and Research in Statistics",
      "email_addresses": ["ahmed@aitrs.org"]
    }
  ],
  "extracted_contacts_count": 2,
  "processing_time_ms": 18500
}
```

**Performance Target**: <2 minutes for 20-page document (SC-004), 1 page/sec processing

---

## 5. Detect Duplicates

**Endpoint**: `GET /contacts/duplicates?name=<name>&organization_id=<org_id>`

**Response**: `200 OK`
```json
{
  "potential_duplicates": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "Khalid Alzahrani",
      "organization_id": "660e8400-e29b-41d4-a716-446655440001",
      "match_score": 0.95,
      "match_reasons": ["name_fuzzy_match", "same_organization"]
    }
  ]
}
```

**Matching Algorithm**:
- Exact email match: 100% duplicate
- Name + organization fuzzy match (>90% similarity): Potential duplicate (warn user)

**Requirement**: FR-010 (warn users about duplicates)

---

## 6. Export Contacts

**Endpoint**: `GET /contacts/export?format=<csv|vcard>`

**Query Parameters**:
- `format` (enum, required): `csv` or `vcard`
- `contact_ids` (uuid[], optional): Specific contacts to export (comma-separated)
- `organization_id` (uuid, optional): Export all contacts from organization

**Response**: `200 OK`
```
Content-Type: text/csv | text/vcard
Content-Disposition: attachment; filename="contacts-2025-10-26.csv"

<CSV or vCard data>
```

**CSV Format**:
```csv
Full Name,Organization,Position,Email,Phone,Tags,Created At
"خالد الزهراني","الهيئة العامة للإحصاء","Director","khalid@stats.gov.sa","+966501234567","UN Statistical Commission","2025-10-26T10:30:00Z"
```

**vCard Format**:
```vcard
BEGIN:VCARD
VERSION:3.0
FN:خالد الزهراني
ORG:الهيئة العامة للإحصاء
TITLE:Director of International Cooperation
EMAIL:khalid@stats.gov.sa
TEL:+966501234567
END:VCARD
```

**Security**: Export respects RLS policies (FR-020, FR-022)

---

## Error Responses

All endpoints follow standard HTTP error codes:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email_addresses[0]",
      "value": "invalid-email"
    }
  }
}
```

**Error Codes**:
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: RLS policy violation
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource
- `422 Unprocessable Entity`: Business logic error (e.g., OCR failed)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Rate Limiting

| Endpoint | Rate Limit |
|----------|-----------|
| `/contacts` (GET) | 100 req/min per user |
| `/contacts` (POST) | 20 req/min per user |
| `/contacts/scan-business-card` | 10 req/min per user |
| `/contacts/extract-document` | 5 req/min per user |
| `/contacts/export` | 3 req/hr per user |

---

## Testing Contracts

**Contract Tests** (backend/tests/contract/):
- `contact-api.test.ts`: Test all `/contacts` endpoints
- `ocr-api.test.ts`: Test business card & document extraction
- `export-api.test.ts`: Test CSV/vCard export

**Tools**: Vitest + Supertest for HTTP testing

---

**API Contracts Complete**: 13 endpoints defined with request/response schemas, error handling, and performance targets.
