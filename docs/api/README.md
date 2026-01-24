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
8. [Edge Functions Reference](./edge-functions-reference.md) - Comprehensive reference for all 285 Edge Functions
   - [Positions](./categories/positions.md) - Position paper management (23 endpoints)
   - [Intake](./categories/intake.md) - Service request processing (19 endpoints)
   - [Assignments](./categories/assignments.md) - Work assignment management (18 endpoints)
   - [Dossiers](./categories/dossiers.md) - Dossier lifecycle management (29 endpoints)
   - [After Actions](./categories/after-actions.md) - After-action records and commitments (9 endpoints)
   - [Engagements](./categories/engagements.md) - Diplomatic engagement tracking (15 endpoints)
   - [Documents](./categories/documents.md) - Document management and versioning (12 endpoints)
   - [Search](./categories/search.md) - Full-text and vector search (10 endpoints)
   - [Calendar](./categories/calendar.md) - Event and meeting scheduling (8 endpoints)
   - [Attachments](./categories/attachments.md) - File upload and storage (5 endpoints)
   - [AI Services](./categories/ai-services.md) - AI-powered analysis and extraction (13 endpoints)
   - [Workflow](./categories/workflow.md) - Workflow automation (7 endpoints)
   - [Notifications](./categories/notifications.md) - Real-time notifications (10 endpoints)
   - [Intelligence](./categories/intelligence.md) - Intelligence signal processing (5 endpoints)
   - [Authentication & MFA](./categories/authentication.md) - Multi-factor authentication (10 endpoints)
   - [Security & Access](./categories/security-access.md) - Access control and permissions (12 endpoints)
   - [User Management](./categories/user-management.md) - User profiles and roles (8 endpoints)
   - [Analytics & Reporting](./categories/analytics-reporting.md) - Dashboards and reports (6 endpoints)
   - [Commitments](./categories/commitments.md) - Commitment tracking (5 endpoints)
   - [MOUs](./categories/mous.md) - MOU management (2 endpoints)
   - [Relationships](./categories/relationships.md) - Relationship mapping (9 endpoints)
   - [Collaboration](./categories/collaboration.md) - Team collaboration (10 endpoints)
   - [Data Management](./categories/data-management.md) - Data operations (9 endpoints)
   - [Administration](./categories/administration.md) - System administration (5 endpoints)
   - [Unified Work](./categories/unified-work.md) - Work item management (3 endpoints)
   - [Mobile Sync](./categories/mobile-sync.md) - Offline synchronization (3 endpoints)
   - [Utilities](./categories/utilities.md) - Helper functions (20 endpoints)

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