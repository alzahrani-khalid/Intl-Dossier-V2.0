# OCR Extract Edge Function

## Overview
Supabase Edge Function for business card OCR extraction with hybrid processing support (Tesseract local + Google Vision cloud fallback).

## Features
- 📷 Business card image upload (JPEG, PNG, WebP)
- 🔍 Hybrid OCR: Tesseract.js (local) with Google Vision fallback
- 🌐 Arabic and English text extraction
- 📧 Smart contact field parsing (name, organization, position, email, phone)
- 💾 Automatic storage to Supabase Storage
- 🔒 Privacy-focused: 80-90% local processing (PDPL compliant)

## API Endpoint
```
POST /functions/v1/ocr-extract
```

## Request Format
**Content-Type:** `multipart/form-data`

### Form Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | File | Yes | Business card image (max 10MB) |
| `consent_cloud_ocr` | Boolean | No | User consent for cloud OCR (default: false) |
| `process_ocr` | Boolean | No | Process OCR immediately (default: true) |

### Headers
```
Authorization: Bearer <supabase-auth-token>
```

## Response Format
```json
{
  "success": true,
  "document_id": "uuid",
  "storage_path": "contacts/business-cards/2025/10/uuid.jpg",
  "file_size": 1024000,
  "ocr_processed": true,
  "extracted_contact": {
    "full_name": "John Doe",
    "organization": "Tech Solutions Inc.",
    "position": "Senior Engineer",
    "email_addresses": ["john.doe@tech.com"],
    "phone_numbers": ["+966501234567"],
    "confidence": 85
  },
  "ocr_result": {
    "confidence": 85,
    "method": "tesseract"
  }
}
```

## Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Usage Example

### JavaScript/TypeScript
```typescript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('consent_cloud_ocr', 'true');

const response = await fetch('https://your-project.supabase.co/functions/v1/ocr-extract', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  },
  body: formData
});

const result = await response.json();
```

### cURL
```bash
curl -X POST https://your-project.supabase.co/functions/v1/ocr-extract \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@business-card.jpg" \
  -F "consent_cloud_ocr=true"
```

## Deployment

### Local Development
```bash
supabase functions serve ocr-extract --env-file .env.local
```

### Deploy to Supabase
```bash
supabase functions deploy ocr-extract
```

### Environment Variables
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations
- `GOOGLE_APPLICATION_CREDENTIALS`: (Optional) Google Vision API credentials

## Storage Structure
```
contacts/business-cards/
├── 2025/
│   ├── 01/
│   │   ├── uuid1.jpg
│   │   └── uuid2.png
│   └── 02/
│       └── uuid3.jpg
```

## Performance Targets
- **Processing Time**: < 15 seconds per card
- **Accuracy**: 85-95% field extraction
- **Local Processing**: 80-90% (privacy compliance)
- **File Size Limit**: 10MB

## Privacy & Compliance
- Default: Local Tesseract.js processing (PDPL compliant)
- Cloud OCR: Requires explicit user consent
- Data stored in user's region (Supabase Storage)
- No data retention beyond user's account

## Error Codes
| Code | Description |
|------|-------------|
| 401 | Unauthorized - Invalid or missing auth token |
| 400 | Bad Request - Invalid file or parameters |
| 413 | File too large (> 10MB) |
| 415 | Unsupported media type |
| 500 | Internal server error |

## Supported Languages
- English (primary)
- Arabic (RTL support)

## File Types
- JPEG/JPG
- PNG
- WebP

## Future Enhancements
- [ ] Batch processing for multiple cards
- [ ] PDF business card support
- [ ] vCard export format
- [ ] Duplicate detection
- [ ] Integration with contact merge