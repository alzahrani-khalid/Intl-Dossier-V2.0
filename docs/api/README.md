# API Documentation

## Overview

The GASTAT International Dossier System API provides comprehensive endpoints for security, monitoring, export, analytics, and accessibility features. All endpoints follow RESTful conventions and return JSON responses.

## Base URL

```
https://{environment}.api.gastat.sa/v1
```

Environments:
- `dev` - Development environment
- `staging` - Staging environment  
- `prod` - Production environment

## Authentication

All API endpoints require authentication using JWT Bearer tokens:

```http
Authorization: Bearer <token>
```

## API Categories

1. [Authentication & MFA](./authentication.md) - Multi-factor authentication endpoints
2. [Monitoring & Alerts](./monitoring.md) - System monitoring and alert management
3. [Export Operations](./export.md) - Data export functionality
4. [Analytics](./analytics.md) - Clustering and analysis endpoints
5. [Accessibility](./accessibility.md) - User accessibility preferences
6. [Security & Audit](./security.md) - Audit logging and security features
7. [Unified Work Management](./unified-work-management.md) - Consolidated work items (commitments, tasks, intake)

## Common Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

## Error Response Format

All error responses follow this format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message in English",
  "message_ar": "رسالة خطأ قابلة للقراءة باللغة العربية",
  "details": {
    // Additional error details if applicable
  }
}
```

## Rate Limiting

API rate limits are enforced per user:

- Standard endpoints: 100 requests per minute
- Export endpoints: 10 requests per hour
- Authentication endpoints: 5 attempts per 15 minutes

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 75
X-RateLimit-Reset: 1643723400
```

## Pagination

List endpoints support pagination:

```http
GET /api/resource?page=1&limit=50
```

Response includes pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 500,
    "pages": 10
  }
}
```

## Versioning

The API version is included in the URL path. Breaking changes will result in a new version:

- Current version: `v1`
- Version lifecycle: 12 months minimum support

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available:
- [OpenAPI Spec (YAML)](../../specs/005-resolve-critical-items/contracts/openapi.yaml)
- Swagger UI: `https://{environment}.api.gastat.sa/docs`

## SDK Support

Official SDKs are available for:
- TypeScript/JavaScript
- Python
- Java

## Support

For API support and questions:
- Email: api-support@gastat.gov.sa
- Documentation: This directory
- Status Page: `https://status.gastat.sa`