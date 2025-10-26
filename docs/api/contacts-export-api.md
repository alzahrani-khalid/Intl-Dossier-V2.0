# Contacts Export API Documentation

## Overview
The Contacts Export API provides functionality to export contact data in CSV and vCard formats with support for filtering, pagination, and bulk operations.

## Base URL
```
Production: https://[project-id].supabase.co/functions/v1
Development: http://localhost:54321/functions/v1
```

## Authentication
All endpoints require authentication via Supabase Auth JWT token.

```http
Authorization: Bearer <jwt-token>
```

## Endpoints

### Export Contacts

Export contacts in CSV or vCard format.

**Endpoint**: `POST /contacts-export`

#### Request Body

```typescript
{
  format: 'csv' | 'vcard';           // Required: Export format
  contact_ids?: string[];            // Optional: Specific contact IDs to export
  organization_id?: string;          // Optional: Filter by organization
  tags?: string[];                   // Optional: Filter by tags (must have all)
  limit?: number;                    // Optional: Max contacts (default: 1000, max: 1000)
}
```

#### Response

**Success Response** (200 OK)

For CSV format:
```http
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="contacts_2025-10-26.csv"

﻿Full Name,Organization,Position,Email,Phone,Tags,Created At
John Doe,ACME Corp,CEO,john@acme.com,+1234567890,"vip,partner",2025-10-26 10:00:00
```

For vCard format:
```http
Content-Type: text/vcard; charset=utf-8
Content-Disposition: attachment; filename="contacts_2025-10-26.vcf"

BEGIN:VCARD
VERSION:3.0
FN:John Doe
N:John Doe;;;;
ORG:ACME Corp
TITLE:CEO
EMAIL;TYPE=PREF:john@acme.com
TEL;TYPE=PREF:+1234567890
CATEGORIES:vip,partner
UID:123e4567-e89b-12d3-a456-426614174000
REV:20251026T100000Z
END:VCARD
```

**Error Responses**

401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

400 Bad Request
```json
{
  "error": "Invalid format. Must be \"csv\" or \"vcard\""
}
```

404 Not Found
```json
{
  "error": "No contacts found"
}
```

500 Internal Server Error
```json
{
  "error": "Export failed"
}
```

### Example Usage

#### JavaScript/TypeScript

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export all contacts as CSV
async function exportAllContactsCSV() {
  const { data, error } = await supabase.functions.invoke('contacts-export', {
    body: {
      format: 'csv',
      limit: 1000
    }
  });

  if (error) {
    console.error('Export failed:', error);
    return;
  }

  // Create download link
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'contacts.csv';
  link.click();
}

// Export specific contacts as vCard
async function exportSelectedContactsVCard(contactIds: string[]) {
  const { data, error } = await supabase.functions.invoke('contacts-export', {
    body: {
      format: 'vcard',
      contact_ids: contactIds
    }
  });

  if (error) {
    console.error('Export failed:', error);
    return;
  }

  // Handle vCard download
  const blob = new Blob([data], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url);
}

// Export with filters
async function exportFilteredContacts() {
  const { data, error } = await supabase.functions.invoke('contacts-export', {
    body: {
      format: 'csv',
      organization_id: 'org-123',
      tags: ['vip', 'partner'],
      limit: 500
    }
  });

  // Handle response...
}
```

#### cURL

```bash
# Export all contacts as CSV
curl -X POST https://[project-id].supabase.co/functions/v1/contacts-export \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "limit": 100
  }' \
  -o contacts.csv

# Export specific contacts as vCard
curl -X POST https://[project-id].supabase.co/functions/v1/contacts-export \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "vcard",
    "contact_ids": ["id1", "id2", "id3"]
  }' \
  -o contacts.vcf

# Export with organization filter
curl -X POST https://[project-id].supabase.co/functions/v1/contacts-export \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "organization_id": "org-123"
  }' \
  -o org-contacts.csv
```

## Export Formats

### CSV Format

The CSV export includes the following columns:
- **Full Name**: Contact's complete name
- **Organization**: Associated organization name
- **Position**: Job title or position
- **Email**: Semicolon-separated list of email addresses
- **Phone**: Semicolon-separated list of phone numbers
- **Tags**: Semicolon-separated list of tags
- **Created At**: Timestamp of contact creation

**Features:**
- UTF-8 BOM for Excel Arabic text support
- RFC 4180 compliant escaping
- Handles special characters and line breaks
- Maximum 1000 contacts per export

### vCard Format

The vCard export follows vCard 3.0 specification:
- **FN**: Full name (required)
- **N**: Name components
- **ORG**: Organization name
- **TITLE**: Job position
- **EMAIL**: Email addresses with TYPE
- **TEL**: Phone numbers with TYPE
- **NOTE**: Additional notes
- **CATEGORIES**: Tags
- **UID**: Unique identifier
- **REV**: Last revision date

**Features:**
- vCard 3.0 compatible
- Works with Outlook, Apple Contacts, Google Contacts
- Proper escaping for special characters
- Multiple email/phone support

## Rate Limiting

- **Rate Limit**: 100 requests per minute per user
- **Max Export Size**: 1000 contacts per request
- **Concurrent Requests**: 5 maximum

## Performance Considerations

1. **Large Exports**: For datasets > 1000 contacts, use pagination
2. **Filtering**: Apply filters to reduce export size
3. **Caching**: Results are not cached; each request queries fresh data
4. **Timeout**: Requests timeout after 30 seconds

## Security

1. **Authentication**: Required for all requests
2. **Authorization**: Users can only export their own contacts
3. **Input Validation**: All parameters are validated
4. **SQL Injection**: Protected via parameterized queries
5. **XSS Prevention**: Output properly escaped

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Successful export
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: No contacts match criteria
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Changelog

### Version 1.0.0 (2025-10-26)
- Initial release
- CSV and vCard export formats
- Filtering by contact IDs, organization, and tags
- UTF-8 BOM support for Arabic text
- Rate limiting and security controls

## Support

For issues or questions:
- GitHub Issues: [Project Repository]
- Email: support@example.com
- Documentation: https://docs.example.com/api/contacts-export