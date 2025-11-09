# Dynamic Country Intelligence System - API Contracts

**Feature**: 029-dynamic-country-intelligence
**Created**: 2025-01-30
**Status**: Ready for Implementation

## Overview

This directory contains the complete API contracts for the Dynamic Country Intelligence System, which transforms country dossier pages from static/hardcoded data to a dynamic intelligence system powered by AnythingLLM.

### Key Features

- **TTL-Based Caching**: Intelligence data cached with configurable Time-To-Live (24h economic, 6h political, 12h security, 48h bilateral)
- **Manual Refresh**: Users can trigger on-demand intelligence updates
- **Automatic Refresh**: Background job refreshes expired intelligence without user intervention
- **Selective Refresh**: Support for refreshing specific intelligence types (economic, political, security, bilateral)
- **Concurrent Refresh Prevention**: Locking mechanism prevents duplicate operations
- **Multilingual Support**: All intelligence data available in English and Arabic
- **Stale-While-Revalidate**: Frontend shows cached data immediately while fetching fresh data in background
- **AnythingLLM Integration**: RAG-powered intelligence generation using workspace-based document retrieval

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │ TanStack Query Hooks (useIntelligence.ts)          │    │
│  │ - Automatic caching with TTL                        │    │
│  │ - Optimistic updates                                │    │
│  │ - Background refetch on stale                       │    │
│  └────────────────────────────────────────────────────┘    │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │ API Service (intelligence-api.ts)                   │    │
│  │ - Type-safe HTTP client                             │    │
│  │ - Error handling                                     │    │
│  │ - Authentication                                     │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Edge Functions (Deno)                  │
│  ┌────────────────┬───────────────────┬──────────────────┐ │
│  │ intelligence-  │ intelligence-     │ intelligence-    │ │
│  │ get            │ refresh           │ batch-update     │ │
│  │                │                   │                  │ │
│  │ GET cached     │ POST manual       │ POST automatic   │ │
│  │ intelligence   │ refresh           │ batch refresh    │ │
│  │ with TTL       │ with locking      │ (cron job)       │ │
│  └────────────────┴───────────────────┴──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         ▼                      ▼                       ▼
┌────────────────────┐  ┌──────────────────┐  ┌──────────────┐
│  PostgreSQL DB     │  │  AnythingLLM     │  │ External APIs│
│  - intelligence_   │  │  - RAG queries   │  │ - World Bank │
│    reports table   │  │  - Workspaces    │  │ - Travel     │
│  - RLS policies    │  │  - Embeddings    │  │   Advisories │
│  - TTL functions   │  │  - GPT-4/Claude  │  │              │
└────────────────────┘  └──────────────────┘  └──────────────┘
```

---

## Files

### 1. OpenAPI Specification (`openapi.yaml`)

**Purpose**: Complete REST API documentation in OpenAPI 3.0 format

**Endpoints**:
- `GET /intelligence-get` - Fetch cached intelligence
- `POST /intelligence-refresh` - Trigger manual refresh
- `POST /intelligence-batch-update` - Background batch refresh (service role only)

**Key Features**:
- Complete request/response schemas
- Error response definitions (400, 401, 404, 409, 500, 503)
- Bilingual error messages (English/Arabic)
- Authentication requirements (JWT Bearer token)
- Query parameters and request body validation

**Usage**:
```bash
# View in Swagger UI
docker run -p 8080:8080 -e SWAGGER_JSON=/openapi.yaml \
  -v $(pwd)/openapi.yaml:/openapi.yaml swaggerapi/swagger-ui

# Generate TypeScript types
npx openapi-typescript openapi.yaml -o types.ts
```

### 2. Validation Schemas (`validation-schemas.ts`)

**Purpose**: Runtime type validation using Zod for both backend and frontend

**Schemas**:
- `GetIntelligenceQuerySchema` - Query parameter validation
- `RefreshIntelligenceRequestSchema` - Refresh request body validation
- `BatchUpdateRequestSchema` - Batch update request validation
- `IntelligenceReportSchema` - Intelligence report structure
- `ErrorResponseSchema` - Standardized error format

**Key Features**:
- Shared between Edge Functions and frontend for consistency
- Runtime validation with detailed error messages
- Type inference for TypeScript
- Helper functions for parsing and validation

**Usage**:
```typescript
import { GetIntelligenceQuerySchema } from './validation-schemas';

// Parse and validate
const params = GetIntelligenceQuerySchema.parse({
  entity_id: '550e8400-e29b-41d4-a716-446655440000',
  intelligence_type: 'economic'
});

// Type is automatically inferred
// params: { entity_id: string; intelligence_type?: IntelligenceType; ... }
```

### 3. Edge Functions

#### `intelligence-get/index.ts`

**Purpose**: Fetch cached intelligence with TTL status and data source metadata

**Features**:
- RLS-protected database queries (user context)
- Filtering by intelligence type
- Include/exclude stale data
- Language selection (en/ar)
- Computed fields (is_expired, time_until_expiry_hours)
- Metadata aggregation (fresh_count, stale_count)

**Example Request**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "$SUPABASE_URL/functions/v1/intelligence-get?entity_id=550e8400-e29b-41d4-a716-446655440000&intelligence_type=economic&language=en"
```

**Example Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "entity_id": "550e8400-e29b-41d4-a716-446655440000",
      "intelligence_type": "economic",
      "title": "Saudi Arabia Economic Indicators Q1 2025",
      "content": "GDP growth rate: 3.2%, Inflation: 2.1%...",
      "confidence_score": 85,
      "refresh_status": "fresh",
      "is_expired": false,
      "time_until_expiry_hours": 23.5,
      "data_sources_metadata": [...]
    }
  ],
  "meta": {
    "total_count": 1,
    "fresh_count": 1,
    "stale_count": 0
  }
}
```

#### `intelligence-refresh/index.ts`

**Purpose**: Trigger manual intelligence refresh with AnythingLLM integration

**Features**:
- Locking mechanism prevents concurrent refreshes (409 on conflict)
- Selective refresh by intelligence type
- AnythingLLM RAG queries with workspace-based retrieval
- External API integration (World Bank, travel advisories)
- Async processing with timeout (10 seconds)
- Graceful degradation when AnythingLLM unavailable (503)

**Example Request**:
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "550e8400-e29b-41d4-a716-446655440000",
    "intelligence_types": ["economic", "political"],
    "priority": "high"
  }' \
  "$SUPABASE_URL/functions/v1/intelligence-refresh"
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "refresh_id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "completed",
    "entity_id": "550e8400-e29b-41d4-a716-446655440000",
    "intelligence_types": ["economic", "political"],
    "triggered_by": "770e8400-e29b-41d4-a716-446655440002",
    "triggered_at": "2025-01-30T14:30:00Z"
  },
  "message_en": "Intelligence refresh completed successfully",
  "message_ar": "تم إكمال تحديث المعلومات الاستخباراتية بنجاح"
}
```

#### `intelligence-batch-update/index.ts`

**Purpose**: Background job for automatic intelligence refresh (cron scheduler)

**Features**:
- Service role authentication required
- Processes expired intelligence based on TTL
- Batch processing with configurable limit (default 50)
- Sequential processing to avoid overwhelming AnythingLLM
- Comprehensive logging and failure tracking
- Dry run mode for testing

**Example Request** (via cron):
```bash
# Cron job: Run every hour
0 * * * * curl -X POST \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50}' \
  "$SUPABASE_URL/functions/v1/intelligence-batch-update"
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "batch_id": "880e8400-e29b-41d4-a716-446655440003",
    "processed_count": 25,
    "success_count": 23,
    "failure_count": 2,
    "started_at": "2025-01-30T02:00:00Z",
    "completed_at": "2025-01-30T02:05:30Z",
    "duration_ms": 330000,
    "failures": [
      {
        "entity_id": "...",
        "intelligence_type": "political",
        "error_code": "ANYTHINGLLM_UNAVAILABLE",
        "error_message": "..."
      }
    ]
  }
}
```

### 4. Frontend Hooks (`useIntelligence.ts`)

**Purpose**: TanStack Query hooks for reactive intelligence data management

**Hooks**:
- `useIntelligence()` - Fetch intelligence with automatic caching
- `useIntelligenceByType()` - Fetch single intelligence type
- `useAllIntelligence()` - Fetch all types for an entity
- `useRefreshIntelligence()` - Mutation for manual refresh
- `useRefreshIntelligenceType()` - Refresh single type
- `usePrefetchIntelligence()` - Prefetch on hover
- `useIntelligenceStaleStatus()` - Check if data is stale
- `useIntelligenceRefreshStatus()` - Get refresh status

**Key Features**:
- Stale-while-revalidate pattern (shows cached data, refetches in background)
- Optimistic updates for refresh operations
- Automatic cache invalidation
- Toast notifications for user feedback
- Bilingual error messages
- Query key factory for granular invalidation

**Example Usage**:
```tsx
import { useIntelligence, useRefreshIntelligence } from '@/hooks/useIntelligence';

function CountryIntelligenceTab({ countryId }: { countryId: string }) {
  const { data, isLoading, isStale } = useIntelligence({
    entity_id: countryId,
    intelligence_type: 'economic',
  });

  const { mutate: refresh, isPending } = useRefreshIntelligence();

  const handleRefresh = () => {
    refresh({
      entity_id: countryId,
      intelligence_types: ['economic', 'political'],
    });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center">
        <h2>Economic Intelligence</h2>
        {isStale && <Badge variant="warning">Outdated Data</Badge>}
        <Button onClick={handleRefresh} disabled={isPending}>
          {isPending ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {data?.data.map((report) => (
        <IntelligenceCard key={report.id} report={report} />
      ))}
    </div>
  );
}
```

### 5. API Service (`intelligence-api.ts`)

**Purpose**: Type-safe HTTP client for intelligence operations

**Functions**:
- `getIntelligence()` - Fetch intelligence data
- `refreshIntelligence()` - Trigger manual refresh
- `getIntelligenceByType()` - Fetch single type
- `getAllIntelligence()` - Fetch all types
- `refreshIntelligenceType()` - Refresh single type
- `isIntelligenceStale()` - Check staleness
- `getStaleIntelligenceTypes()` - Get types needing refresh

**Key Features**:
- Automatic JWT token management
- Standardized error handling
- Type inference from OpenAPI spec
- Request/response validation
- Bilingual error messages

---

## Database Schema

### Intelligence Reports Table Extensions

The `intelligence_reports` table (created in migration `20250130000001_extend_intelligence_reports_dynamic_system.sql`) includes:

**Key Columns**:
- `entity_id` (UUID) - Links to dossiers table
- `entity_type` (TEXT) - Type of dossier (country, organization, etc.)
- `intelligence_type` (TEXT) - Classification (economic, political, security, bilateral, general)
- `cache_expires_at` (TIMESTAMPTZ) - TTL expiration timestamp
- `refresh_status` (TEXT) - Current status (fresh, stale, refreshing, error, expired)
- `data_sources_metadata` (JSONB) - Array of source metadata objects
- `anythingllm_workspace_id` (TEXT) - Workspace used for RAG queries
- `anythingllm_response_metadata` (JSONB) - Model, tokens, sources cited

**Helper Functions**:
- `get_intelligence_ttl_hours(intel_type)` - Returns TTL in hours for each type
- `lock_intelligence_for_refresh()` - Acquires exclusive lock for refresh
- `mark_expired_intelligence_stale()` - Marks expired items as stale (cron job)
- `is_intelligence_cache_expired(report_id)` - Checks if cache expired

**Indexes**:
- `idx_intelligence_reports_entity` - Fast lookups by entity
- `idx_intelligence_reports_cache_expires` - TTL expiration queries
- `idx_intelligence_reports_stale` - Find stale intelligence for batch updates

---

## Testing

### Edge Function Testing

```bash
# Test intelligence-get locally
curl http://localhost:54321/functions/v1/intelligence-get?entity_id=$ENTITY_ID

# Test intelligence-refresh locally
curl -X POST http://localhost:54321/functions/v1/intelligence-refresh \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "'$ENTITY_ID'", "intelligence_types": ["economic"]}'
```

### Frontend Testing

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useIntelligence } from '@/hooks/useIntelligence';

test('fetches intelligence data', async () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(
    () => useIntelligence({ entity_id: 'test-id' }),
    { wrapper }
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.data).toHaveLength(4);
});
```

---

## Deployment

### Environment Variables

```bash
# .env
VITE_SUPABASE_URL=https://zkrcjzdemdmwhearhfgg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...

# Edge Functions
SUPABASE_URL=https://zkrcjzdemdmwhearhfgg.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
ANYTHINGLLM_URL=http://localhost:3001
ANYTHINGLLM_API_KEY=your-api-key-here
ENVIRONMENT=production
```

### Deploy Edge Functions

```bash
# Deploy all three functions
supabase functions deploy intelligence-get
supabase functions deploy intelligence-refresh
supabase functions deploy intelligence-batch-update

# Set environment variables
supabase secrets set ANYTHINGLLM_URL=http://localhost:3001
supabase secrets set ANYTHINGLLM_API_KEY=your-api-key-here
```

### Setup Cron Job for Batch Updates

```sql
-- Using pg_cron extension
SELECT cron.schedule(
  'intelligence-batch-update',
  '0 * * * *', -- Every hour
  $$
  SELECT net.http_post(
    url := 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-batch-update',
    headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '", "Content-Type": "application/json"}',
    body := '{"limit": 50}'
  );
  $$
);
```

---

## Performance Considerations

### Caching Strategy

- **Client-side**: TanStack Query caches for 5 minutes (staleTime), keeps for 1 hour (gcTime)
- **Server-side**: PostgreSQL caches with TTL (24h economic, 6h political, 12h security, 48h bilateral)
- **HTTP caching**: Edge Functions return `Cache-Control: public, max-age=60, s-maxage=120`

### Rate Limiting

- **AnythingLLM**: 1 second delay between batch requests to avoid rate limits
- **External APIs**: Exponential backoff on rate limit errors
- **Concurrent Refreshes**: Locking mechanism prevents duplicate operations

### Optimization Tips

1. **Prefetch intelligence on navigation hover** using `usePrefetchIntelligence()`
2. **Use selective refresh** to only update stale intelligence types
3. **Enable background refresh** for automatic updates without user awareness
4. **Monitor cache hit ratio** (target: 80%+)

---

## Error Handling

### Error Codes

- `VALIDATION_ERROR` (400) - Invalid request parameters
- `UNAUTHORIZED` (401) - Missing or invalid authentication
- `NOT_FOUND` (404) - Entity or intelligence not found
- `REFRESH_IN_PROGRESS` (409) - Concurrent refresh conflict
- `INTERNAL_ERROR` (500) - Unexpected server error
- `SERVICE_UNAVAILABLE` (503) - AnythingLLM unavailable

### Error Responses

All errors follow a standardized format with bilingual messages:

```json
{
  "success": false,
  "error": {
    "code": "REFRESH_IN_PROGRESS",
    "message_en": "A refresh operation is already in progress",
    "message_ar": "عملية تحديث قيد التنفيذ بالفعل",
    "details": { ... },
    "correlation_id": "aa0e8400-e29b-41d4-a716-446655440005"
  }
}
```

---

## Next Steps

1. **Deploy database migration**: Apply `20250130000001_extend_intelligence_reports_dynamic_system.sql`
2. **Deploy Edge Functions**: Deploy all three functions to staging
3. **Configure AnythingLLM**: Set up workspaces for each country
4. **Test end-to-end**: Verify intelligence fetch, refresh, and batch update
5. **Setup cron job**: Schedule hourly batch updates
6. **Implement UI components**: Build intelligence dashboard and inline widgets
7. **Monitor performance**: Track cache hit ratio, refresh times, and error rates

---

## Support

For questions or issues related to the Dynamic Country Intelligence System:

- **Feature Spec**: `/specs/029-dynamic-country-intelligence/spec.md`
- **Database Migration**: `/supabase/migrations/20250130000001_extend_intelligence_reports_dynamic_system.sql`
- **Edge Functions**: `/supabase/functions/intelligence-*`
- **Frontend Hooks**: `/frontend/src/hooks/useIntelligence.ts`
- **API Service**: `/frontend/src/services/intelligence-api.ts`
