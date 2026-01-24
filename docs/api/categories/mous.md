# MOUs & Agreements API

## Overview

The MOUs & Agreements API manages Memoranda of Understanding, bilateral agreements, renewal tracking, and expiration notifications. All endpoints support bilingual content and document management integration.

## Endpoints

### List MOUs

Retrieve list of MOUs with filtering and search.

**Endpoint:** `GET /mous`

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `expired`, `pending_renewal`, `terminated`)
- `counterparty_id` (optional): Filter by counterparty (dossier_id)
- `expires_within_days` (optional): Filter MOUs expiring within N days
- `search` (optional): Search in bilingual titles and descriptions
- `sort` (optional): Sort field (`expiry_date`, `signed_date`, `title_en`)
- `order` (optional): Sort order (`asc` or `desc`, default: `asc` for expiry_date)
- `limit` (optional): Page size (default: 20)
- `offset` (optional): Page offset (default: 0)

**Response (200 OK):**
```json
{
  "mous": [
    {
      "mou_id": "mou-uuid",
      "title_en": "Framework Agreement on Climate Cooperation",
      "title_ar": "اتفاقية إطارية للتعاون في مجال المناخ",
      "description_en": "Bilateral framework for climate change cooperation",
      "description_ar": "إطار ثنائي للتعاون في مجال تغير المناخ",
      "counterparty_id": "dossier-uuid",
      "counterparty_name": "Ministry of Environment - Country X",
      "counterparty_name_ar": "وزارة البيئة - الدولة X",
      "signed_date": "2023-03-15T00:00:00Z",
      "effective_date": "2023-04-01T00:00:00Z",
      "expiry_date": "2025-03-31T00:00:00Z",
      "status": "active",
      "auto_renew": true,
      "renewal_notice_days": 90,
      "document_url": "https://storage.supabase.co/mous/mou-uuid.pdf",
      "created_at": "2023-03-10T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "days_until_expiry": 441
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0,
  "expiring_soon": 8
}
```

**Error Responses:**
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Query failed

**Implementation Example:**
```typescript
const listMOUs = async (filters?: {
  status?: string;
  expiresWithinDays?: number;
  search?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.expiresWithinDays) params.append('expires_within_days', filters.expiresWithinDays.toString());
  if (filters?.search) params.append('search', filters.search);

  const response = await fetch(`/mous?${params.toString()}`, {
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
```

**Notes:**
- MOUs linked to counterparty dossiers (countries, organizations)
- Expiry date tracking with automatic notifications
- Document storage in Supabase Storage
- RLS enforced based on audience groups

---

### MOU Renewals

Process MOU renewals and track renewal status.

**Endpoint:** `GET /mou-renewals?status={status}`

**Query Parameters:**
- `status` (optional): Filter by renewal status (`pending`, `in_progress`, `completed`, `cancelled`)
- `due_within_days` (optional): Show renewals due within N days (default: 90)

**GET Response (200 OK):**
```json
{
  "renewals": [
    {
      "renewal_id": "renewal-uuid",
      "mou_id": "mou-uuid",
      "mou_title_en": "Framework Agreement on Climate Cooperation",
      "mou_title_ar": "اتفاقية إطارية للتعاون في مجال المناخ",
      "current_expiry_date": "2025-03-31T00:00:00Z",
      "proposed_expiry_date": "2028-03-31T00:00:00Z",
      "renewal_status": "in_progress",
      "renewal_initiated_at": "2024-12-15T10:00:00Z",
      "renewal_initiated_by": "user-uuid",
      "counterparty_notified": true,
      "counterparty_response": "pending",
      "days_until_expiry": 76,
      "assigned_to": "user-uuid",
      "notes_en": "Initial contact made, awaiting counterparty response",
      "notes_ar": "تم إجراء الاتصال الأولي، بانتظار رد الطرف المقابل"
    }
  ],
  "total": 8,
  "pending_approval": 3,
  "in_progress": 4,
  "completed_this_quarter": 12
}
```

**POST /mou-renewals - Initiate Renewal:**

**Request Body:**
```json
{
  "mou_id": "mou-uuid",
  "proposed_expiry_date": "2028-03-31T00:00:00Z",
  "renewal_terms_en": "Extend for 3 years with same terms",
  "renewal_terms_ar": "التمديد لمدة 3 سنوات بنفس الشروط",
  "assigned_to": "user-uuid"
}
```

**Response (201 Created):**
```json
{
  "renewal_id": "renewal-uuid",
  "mou_id": "mou-uuid",
  "renewal_status": "pending",
  "created_at": "2024-01-15T10:30:00Z",
  "assigned_to": "user-uuid",
  "notification_sent": true
}
```

**Error Responses:**
- `400 Bad Request` - Invalid mou_id or dates
  ```json
  {
    "error": "Proposed expiry date must be after current expiry date",
    "error_ar": "يجب أن يكون تاريخ الانتهاء المقترح بعد تاريخ الانتهاء الحالي"
  }
  ```
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to initiate renewals
- `404 Not Found` - MOU not found
- `409 Conflict` - Renewal already in progress
- `500 Internal Server Error` - Renewal initiation failed

**Notes:**
- Renewal notifications sent 90 days before expiry (configurable per MOU)
- Renewal workflow: `pending` → `in_progress` → `completed` / `cancelled`
- Auto-renew flag triggers automatic renewal initiation
- Counterparty notifications sent via email and system notifications
- Renewal history tracked in mou_renewal_history table

---

## MOU Lifecycle

```
draft → pending_signature → active → expiring_soon → expired
                             ↓
                        renewed (back to active)
                             ↓
                        terminated
```

**Status Definitions:**
- `draft`: MOU being drafted, not yet signed
- `pending_signature`: Awaiting signatures from both parties
- `active`: MOU signed and in effect
- `expiring_soon`: Within renewal notice period (default 90 days)
- `expired`: Past expiry date, no longer in effect
- `renewed`: Successfully renewed (transitions to active with new expiry date)
- `terminated`: Terminated before expiry date

## Renewal Notifications

Automatic notifications sent at:
1. **90 days before expiry** - Initial renewal notice to assigned staff
2. **60 days before expiry** - Reminder to assigned staff
3. **30 days before expiry** - Escalation to department manager
4. **7 days before expiry** - Critical alert to director
5. **On expiry date** - MOU expired notification

## MOU Metadata

MOUs include the following metadata:

| Field | Description | Required |
|-------|-------------|----------|
| `title_en` / `title_ar` | MOU title (bilingual) | Yes |
| `description_en` / `description_ar` | MOU description | Yes |
| `counterparty_id` | Linked dossier (country/organization) | Yes |
| `signed_date` | Date MOU signed | Yes |
| `effective_date` | Date MOU takes effect | Yes |
| `expiry_date` | Date MOU expires | Yes |
| `auto_renew` | Automatic renewal flag | No (default: false) |
| `renewal_notice_days` | Days before expiry to send notice | No (default: 90) |
| `document_url` | Signed MOU document | Yes |
| `thematic_areas` | Policy areas covered | No |
| `key_commitments` | Summary of key commitments | No |

## Document Management

MOUs stored in Supabase Storage:
- **Bucket**: `mous`
- **Path Format**: `{mou_id}/{document_type}/{filename}`
- **Document Types**: `signed`, `draft`, `renewal`, `amendment`
- **Access Control**: RLS based on audience groups
- **Versioning**: Enabled for all MOU documents

## Related APIs

- [Dossiers](./dossiers.md) - Counterparty dossier management
- [Documents](./documents.md) - Document versioning and management
- [Notifications](./notifications.md) - Renewal notifications
- [Commitments](./commitments.md) - MOU-related commitments tracking
