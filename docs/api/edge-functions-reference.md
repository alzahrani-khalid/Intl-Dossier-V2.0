# Edge Functions API Reference

## Overview

The GASTAT International Dossier System is powered by **285 Supabase Edge Functions** organized into **27 functional categories**. These serverless functions handle everything from position paper management and intake processing to AI-powered analysis and real-time notifications.

All Edge Functions are built with Deno, TypeScript, and Supabase, providing:
- **Row-Level Security (RLS)** enforcement
- **Bilingual support** (English/Arabic)
- **Real-time capabilities** via Supabase Realtime
- **Mobile-first design** with offline sync support
- **Rate limiting** and caching for performance

## Base URL

```
https://{project-ref}.supabase.co/functions/v1/{function-name}
```

Production environment:
```
https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/
```

## Authentication

All Edge Functions require authentication using Supabase JWT tokens:

```http
Authorization: Bearer <supabase-jwt-token>
apikey: <anon-or-service-role-key>
```

### Getting Authentication Tokens

**Frontend (Browser)**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zkrcjzdemdmwhearhfgg.supabase.co',
  'your-anon-key'
);

// After user signs in
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Call Edge Function
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* your payload */ }
});
```

**Backend (Service Role)**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zkrcjzdemdmwhearhfgg.supabase.co',
  'your-service-role-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

## Function Categories

### Core Operations (Tier 1)

| Category | Functions | Documentation | Description |
|----------|-----------|---------------|-------------|
| **Positions Management** | 23 | [positions.md](./categories/positions.md) | Position papers, talking points, approval workflows, versioning, analytics |
| **Service Intake & Tickets** | 19 | [intake.md](./categories/intake.md) | Intake ticket management, triage, SLA tracking, AI classification |
| **Assignments & Tasks** | 18 | [assignments.md](./categories/assignments.md) | Task assignments, checklists, comments, workflow stages, auto-assignment |
| **Dossiers** | 29 | [dossiers.md](./categories/dossiers.md) | Countries, organizations, forums, persons, and working groups management |

### Content & Records (Tier 2)

| Category | Functions | Documentation | Description |
|----------|-----------|---------------|-------------|
| **After Action Records** | 9 | [after-actions.md](./categories/after-actions.md) | AAR creation, commitments tracking, evidence management |
| **Engagements & Meetings** | 15 | [engagements.md](./categories/engagements.md) | Diplomatic meetings, consultations, visits, and event management |
| **Documents** | 12 | [documents.md](./categories/documents.md) | Document storage, versioning, access control, and metadata |
| **Attachments** | 5 | [attachments.md](./categories/attachments.md) | File uploads, validation, virus scanning, and storage |

### Scheduling & Communication (Tier 3)

| Category | Functions | Documentation | Description |
|----------|-----------|---------------|-------------|
| **Calendar & Scheduling** | 8 | [calendar.md](./categories/calendar.md) | Event management, availability tracking, reminders |
| **Notifications & Messaging** | 10 | [notifications.md](./categories/notifications.md) | Push notifications, email alerts, in-app messaging, SMS |
| **Intelligence & Signals** | 5 | [intelligence.md](./categories/intelligence.md) | Intelligence gathering, signal processing, alerts |

### Discovery & AI (Tier 4)

| Category | Functions | Documentation | Description |
|----------|-----------|---------------|-------------|
| **Search & Discovery** | 10 | [search.md](./categories/search.md) | Full-text search, filtering, faceted search, autocomplete |
| **AI & Machine Learning** | 13 | [ai-services.md](./categories/ai-services.md) | Document extraction, classification, embeddings, brief generation |

### Security & Access (Tier 5)

| Category | Functions | Documentation | Description |
|----------|-----------|---------------|-------------|
| **Authentication & MFA** | 10 | *Coming soon* | Multi-factor authentication, session management, device tracking |
| **Security & Access Control** | 12 | *Coming soon* | Access requests, permissions, audit logging, RLS enforcement |
| **User Management** | 8 | *Coming soon* | User profiles, preferences, roles, teams |

### Operations & Automation (Tier 6)

| Category | Functions | Documentation | Description |
|----------|-----------|---------------|-------------|
| **Workflow & Automation** | 7 | [workflow.md](./categories/workflow.md) | Automated workflows, state machines, triggers |
| **Analytics & Reporting** | 6 | *Coming soon* | Dashboards, metrics, data aggregation, exports |
| **Commitments & Deliverables** | 5 | *Coming soon* | Commitment tracking, progress monitoring, reminders |
| **MOUs & Agreements** | 2 | *Coming soon* | Memoranda of Understanding management |
| **Relationship Management** | 9 | *Coming soon* | Network relationships, connections, mapping |
| **Collaboration** | 10 | *Coming soon* | Comments, mentions, reactions, activity feeds |
| **Data Management** | 9 | *Coming soon* | Data imports, exports, transformations, cleanup |
| **System Administration** | 5 | *Coming soon* | System configuration, health checks, monitoring |
| **Unified Work Management** | 3 | *Coming soon* | Consolidated view of tasks, commitments, and tickets |
| **Mobile Sync** | 3 | *Coming soon* | Offline-first sync for mobile apps |
| **Utilities & Support** | 20 | *Coming soon* | Helper functions, validation, formatting, converters |

## Quick Reference Table

### Top 50 Most-Used Functions

| Function | Method | Category | Description |
|----------|--------|----------|-------------|
| `positions-list` | POST | Positions | List position papers with filtering and pagination |
| `positions-get` | POST | Positions | Retrieve a single position paper by ID |
| `positions-create` | POST | Positions | Create a new position paper |
| `positions-update` | POST | Positions | Update an existing position paper |
| `positions-approve` | POST | Positions | Approve a position paper (workflow action) |
| `positions-submit` | POST | Positions | Submit position paper for approval |
| `positions-publish` | POST | Positions | Publish approved position paper |
| `intake-tickets-list` | POST | Intake | List intake tickets with SLA tracking |
| `intake-tickets-create` | POST | Intake | Create a new intake ticket |
| `intake-tickets-assign` | POST | Intake | Assign ticket to staff member |
| `intake-tickets-triage` | POST | Intake | Auto-triage ticket based on rules |
| `intake-classification` | POST | Intake | AI-powered ticket classification |
| `assignments-my-assignments` | POST | Assignments | Get current user's assignments |
| `assignments-get` | POST | Assignments | Retrieve assignment details |
| `assignments-complete` | POST | Assignments | Mark assignment as completed |
| `assignments-comments-create` | POST | Assignments | Add comment to assignment |
| `dossiers-create` | POST | Dossiers | Create new dossier (country, org, forum, etc.) |
| `dossiers-get` | POST | Dossiers | Retrieve dossier by ID and type |
| `dossiers-update` | POST | Dossiers | Update dossier metadata |
| `dossiers-list` | POST | Dossiers | List dossiers with filtering |
| `after-actions-create` | POST | After Actions | Create AAR with commitments |
| `after-actions-get` | POST | After Actions | Retrieve AAR details |
| `engagements-create` | POST | Engagements | Schedule new engagement |
| `engagements-list` | POST | Engagements | List upcoming engagements |
| `documents-upload` | POST | Documents | Upload and version documents |
| `documents-get` | POST | Documents | Retrieve document metadata |
| `documents-search` | POST | Documents | Full-text search across documents |
| `calendar-events-create` | POST | Calendar | Create calendar event |
| `calendar-events-list` | POST | Calendar | List events with availability |
| `search-unified` | POST | Search | Universal search across all entity types |
| `search-suggest` | POST | Search | Autocomplete suggestions |
| `ai-extract-document` | POST | AI/ML | Extract structured data from PDFs |
| `ai-classify-text` | POST | AI/ML | Classify text into categories |
| `ai-generate-embeddings` | POST | AI/ML | Generate vector embeddings for semantic search |
| `ai-brief-generate` | POST | AI/ML | Generate AI briefing from dossier data |
| `notifications-send` | POST | Notifications | Send notification to user(s) |
| `notifications-mark-read` | POST | Notifications | Mark notifications as read |
| `attachments-upload` | POST | Attachments | Upload file attachment with validation |
| `attachments-download` | POST | Attachments | Download file with access control |
| `intelligence-signals-create` | POST | Intelligence | Create intelligence signal |
| `workflow-trigger` | POST | Workflow | Trigger automated workflow |
| `user-profile-get` | POST | Users | Get user profile and preferences |
| `user-profile-update` | POST | Users | Update user preferences |
| `access-requests-create` | POST | Security | Request access to resource |
| `audit-log-query` | POST | Security | Query audit logs |
| `relationships-create` | POST | Relationships | Create relationship between entities |
| `collaboration-comment` | POST | Collaboration | Add comment to any entity |
| `analytics-dashboard` | POST | Analytics | Get dashboard metrics |
| `mobile-sync-pull` | POST | Mobile | Pull changes for offline sync |
| `mobile-sync-push` | POST | Mobile | Push local changes to server |

> **Note**: All functions use POST method to accept complex request payloads in JSON format, even for read operations. This follows Supabase Edge Functions conventions.

## Common Request/Response Patterns

### Standard Request Format

All Edge Functions accept JSON payloads:

```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: {
    action?: string,           // Optional action for multi-action functions
    filters?: {                // Common filtering
      status?: string[],
      dateRange?: { start: string, end: string },
      assigneeId?: string,
      dossierType?: string
    },
    pagination?: {             // Cursor-based pagination
      limit?: number,          // Default: 50, Max: 100
      cursor?: string,         // Opaque cursor from previous response
      offset?: number          // Offset-based fallback
    },
    sort?: {                   // Sorting
      field: string,
      order: 'asc' | 'desc'
    }
  }
});
```

### Standard Response Format

Successful responses follow this structure:

```json
{
  "success": true,
  "data": {
    // Function-specific data
  },
  "pagination": {              // For list endpoints
    "hasMore": true,
    "nextCursor": "eyJpZCI6MTIzfQ==",
    "total": 150
  },
  "metadata": {                // Optional metadata
    "timestamp": "2026-01-24T12:00:00.000Z",
    "version": "v1"
  }
}
```

### Standard Error Format

Error responses include bilingual messages:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid ticket ID format",
    "message_ar": "تنسيق معرف التذكرة غير صالح",
    "details": {
      "field": "ticketId",
      "expected": "UUID",
      "received": "123"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | User lacks permission for this resource |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `CONFLICT` | 409 | Resource state conflict (e.g., duplicate) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server-side error |
| `SERVICE_UNAVAILABLE` | 503 | Temporary service outage |

## Row-Level Security (RLS)

Edge Functions enforce Supabase Row-Level Security policies:

1. **User Context**: The authenticated user's JWT is used for all database queries
2. **Automatic Filtering**: RLS policies automatically filter results based on user permissions
3. **No Manual Checks**: Functions don't need explicit permission checks - RLS handles it
4. **Service Role Override**: Service role key bypasses RLS (admin operations only)

Example RLS Policy:
```sql
-- Users can only see positions they have access to
CREATE POLICY "positions_select_policy" ON positions
  FOR SELECT
  USING (
    auth.uid() = assigned_to
    OR auth.uid() IN (SELECT user_id FROM position_permissions WHERE position_id = positions.id)
  );
```

## Rate Limiting

Rate limits are enforced per user and function category:

| Category | Limit | Window |
|----------|-------|--------|
| Standard operations | 100 requests | 1 minute |
| AI/ML functions | 20 requests | 1 minute |
| Export/report functions | 10 requests | 1 hour |
| Authentication functions | 5 attempts | 15 minutes |
| File uploads | 50 MB/request | - |

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 75
X-RateLimit-Reset: 1706097600
Retry-After: 30
```

## Caching Strategy

Functions implement caching for performance:

1. **Database-Level**: PostgreSQL query caching
2. **Edge-Level**: Supabase CDN caching for static responses
3. **Client-Level**: Recommended to use TanStack Query with stale-while-revalidate

Example TanStack Query setup:
```typescript
import { useQuery } from '@tanstack/react-query';

const { data, error } = useQuery({
  queryKey: ['positions', filters],
  queryFn: async () => {
    const { data } = await supabase.functions.invoke('positions-list', {
      body: { filters }
    });
    return data;
  },
  staleTime: 5 * 60 * 1000,      // 5 minutes
  cacheTime: 10 * 60 * 1000,     // 10 minutes
  refetchOnWindowFocus: true
});
```

## Real-time Subscriptions

Many functions support real-time updates via Supabase Realtime:

```typescript
// Subscribe to position paper changes
const channel = supabase
  .channel('positions-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'positions',
      filter: `id=eq.${positionId}`
    },
    (payload) => {
      console.log('Position updated:', payload.new);
      // Update UI
    }
  )
  .subscribe();

// Cleanup
channel.unsubscribe();
```

## Mobile & Offline Support

Mobile apps use dedicated sync functions:

1. **Initial Load**: `mobile-sync-pull` with full data snapshot
2. **Incremental Sync**: Delta updates since last sync timestamp
3. **Conflict Resolution**: Last-write-wins with conflict detection
4. **Offline Queue**: Changes queued locally, synced via `mobile-sync-push`

See [Mobile Sync documentation](./categories/mobile-sync.md) *(coming soon)* for details.

## Internationalization (i18n)

All functions support bilingual operation:

**Request Header**:
```http
Accept-Language: ar
```

**Response**:
```json
{
  "success": true,
  "data": {
    "title": "Position Paper on Climate Change",
    "title_ar": "ورقة الموقف بشأن تغير المناخ",
    "description": "Detailed analysis...",
    "description_ar": "تحليل مفصل..."
  }
}
```

## RTL (Right-to-Left) Considerations

For Arabic content:
- Text fields return both `field` and `field_ar` versions
- Date/time formatting respects locale
- Directional metadata (e.g., `textDirection: 'rtl'`) included where relevant

## Versioning

Current API version: **v1**

Breaking changes will result in new versions (v2, v3, etc.):
- Version included in function path: `/functions/v1/{name}`
- Old versions supported for 12 months minimum
- Migration guides provided for major version changes

## Testing & Development

### Local Development

Run Edge Functions locally using Supabase CLI:

```bash
# Start all functions
supabase functions serve

# Start specific function
supabase functions serve positions-list

# With environment variables
supabase functions serve --env-file .env.local
```

### Testing with cURL

```bash
# Example: List positions
curl -X POST \
  'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/positions-list' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "filters": { "status": ["draft", "submitted"] },
    "pagination": { "limit": 10 }
  }'
```

### TypeScript Type Definitions

Type definitions are available in the codebase:

```typescript
// Import from shared types
import type {
  PositionPaper,
  IntakeTicket,
  Assignment,
  Dossier
} from '@/types/database.types';

// Or use Supabase-generated types
import type { Database } from '@/types/supabase';
type Position = Database['public']['Tables']['positions']['Row'];
```

## Security Best Practices

1. **Never expose service role key** - Use anon key for client-side calls
2. **Always validate input** - Use Zod schemas in Edge Functions
3. **Rely on RLS** - Don't bypass RLS unless absolutely necessary
4. **Sanitize user content** - Prevent XSS in rich text fields
5. **Rate limit properly** - Implement per-user rate limiting
6. **Audit sensitive operations** - Log all access to classified data
7. **Use HTTPS only** - Never call functions over HTTP
8. **Rotate keys regularly** - Update API keys quarterly

## Performance Best Practices

1. **Use pagination** - Never fetch all records at once
2. **Implement caching** - Cache frequently accessed data
3. **Batch operations** - Use batch endpoints for multiple items
4. **Optimize queries** - Use database indexes and efficient joins
5. **Compress responses** - Enable gzip compression
6. **Monitor function duration** - Target <1s response time
7. **Use CDN** - Leverage Supabase Edge Network

## Support & Resources

- **API Documentation**: This directory (`docs/api/`)
- **Source Code**: `supabase/functions/`
- **Metadata Inventory**: `docs/api/.metadata/functions-inventory.json`
- **Category Mapping**: `docs/api/.metadata/category-mapping.json`
- **OpenAPI Spec**: `docs/api/openapi.yaml` *(coming soon)*
- **Issue Tracking**: GitHub Issues
- **Support Email**: api-support@gastat.gov.sa
- **Status Page**: https://status.gastat.sa

## Changelog

### Version 1.0.0 (2026-01-24)
- Initial comprehensive documentation of all 285 Edge Functions
- 14 category documentation files published
- Quick reference table for top 50 functions
- Authentication, rate limiting, and caching documentation
- Mobile sync and RTL support documentation

---

**Last Updated**: 2026-01-24
**Total Functions**: 285
**Documented Categories**: 14 of 27
**API Version**: v1
