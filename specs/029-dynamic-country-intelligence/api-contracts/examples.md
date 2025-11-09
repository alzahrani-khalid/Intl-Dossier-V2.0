# API Examples - Dynamic Country Intelligence System

This document provides comprehensive examples of all API requests and responses for testing and integration.

---

## Table of Contents

1. [GET /intelligence-get Examples](#get-intelligence-get-examples)
2. [POST /intelligence-refresh Examples](#post-intelligence-refresh-examples)
3. [POST /intelligence-batch-update Examples](#post-intelligence-batch-update-examples)
4. [Frontend Hook Examples](#frontend-hook-examples)
5. [Error Response Examples](#error-response-examples)

---

## GET /intelligence-get Examples

### Example 1: Fetch All Intelligence Types for an Entity

**Request**:
```bash
curl -X GET \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-get?entity_id=550e8400-e29b-41d4-a716-446655440000&include_stale=true&language=en"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "entity_id": "550e8400-e29b-41d4-a716-446655440000",
      "entity_type": "country",
      "intelligence_type": "economic",
      "title": "Saudi Arabia Economic Indicators Q1 2025",
      "title_ar": "المؤشرات الاقتصادية للمملكة العربية السعودية للربع الأول 2025",
      "content": "GDP growth rate: 3.2%, Inflation: 2.1%, Trade balance: +$15B. The Saudi economy continues to demonstrate robust growth driven by Vision 2030 diversification initiatives. Key sectors showing expansion include tourism, technology, and renewable energy.",
      "content_ar": "معدل نمو الناتج المحلي الإجمالي: 3.2%، التضخم: 2.1%، الميزان التجاري: +15 مليار دولار...",
      "confidence_score": 85,
      "refresh_status": "fresh",
      "cache_expires_at": "2025-01-31T14:30:00Z",
      "cache_created_at": "2025-01-30T14:30:00Z",
      "last_refreshed_at": "2025-01-30T14:30:00Z",
      "is_expired": false,
      "time_until_expiry_hours": 23.5,
      "data_sources_metadata": [
        {
          "source": "world_bank_api",
          "endpoint": "/v2/country/SAU/indicator/NY.GDP.MKTP.CD",
          "retrieved_at": "2025-01-30T14:25:00Z",
          "confidence": 95
        },
        {
          "source": "anythingllm",
          "endpoint": "/api/v1/workspace/country-saudi-arabia/chat",
          "retrieved_at": "2025-01-30T14:28:00Z",
          "confidence": 85
        }
      ],
      "anythingllm_workspace_id": "country-saudi-arabia",
      "anythingllm_query": "Analyze current economic indicators for Saudi Arabia...",
      "anythingllm_response_metadata": {
        "model": "gpt-4-turbo",
        "tokens_used": 1250,
        "sources_cited": ["World Bank API", "IMF Reports", "Saudi Vision 2030"]
      },
      "version": 1,
      "created_at": "2025-01-30T14:30:00Z",
      "updated_at": "2025-01-30T14:30:00Z"
    },
    {
      "id": "990e8400-e29b-41d4-a716-446655440005",
      "entity_id": "550e8400-e29b-41d4-a716-446655440000",
      "entity_type": "country",
      "intelligence_type": "political",
      "title": "Saudi Arabia Political Developments",
      "title_ar": "التطورات السياسية في المملكة العربية السعودية",
      "content": "Recent diplomatic engagements include renewed relations with regional partners...",
      "content_ar": "تشمل المشاركات الدبلوماسية الأخيرة تجديد العلاقات مع الشركاء الإقليميين...",
      "confidence_score": 78,
      "refresh_status": "stale",
      "cache_expires_at": "2025-01-30T08:00:00Z",
      "cache_created_at": "2025-01-30T02:00:00Z",
      "last_refreshed_at": "2025-01-30T02:00:00Z",
      "is_expired": true,
      "time_until_expiry_hours": -6.5,
      "data_sources_metadata": [...],
      "version": 1,
      "created_at": "2025-01-30T02:00:00Z",
      "updated_at": "2025-01-30T02:00:00Z"
    }
  ],
  "meta": {
    "total_count": 4,
    "fresh_count": 3,
    "stale_count": 1
  }
}
```

### Example 2: Fetch Only Economic Intelligence (Fresh Data)

**Request**:
```bash
curl -X GET \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-get?entity_id=550e8400-e29b-41d4-a716-446655440000&intelligence_type=economic&include_stale=false&language=ar"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "entity_id": "550e8400-e29b-41d4-a716-446655440000",
      "entity_type": "country",
      "intelligence_type": "economic",
      "title": "المؤشرات الاقتصادية للمملكة العربية السعودية للربع الأول 2025",
      "title_ar": "المؤشرات الاقتصادية للمملكة العربية السعودية للربع الأول 2025",
      "content": "معدل نمو الناتج المحلي الإجمالي: 3.2%، التضخم: 2.1%، الميزان التجاري: +15 مليار دولار...",
      "content_ar": "معدل نمو الناتج المحلي الإجمالي: 3.2%، التضخم: 2.1%، الميزان التجاري: +15 مليار دولار...",
      "confidence_score": 85,
      "refresh_status": "fresh",
      "is_expired": false,
      ...
    }
  ],
  "meta": {
    "total_count": 1,
    "fresh_count": 1,
    "stale_count": 0
  }
}
```

### Example 3: Entity Not Found

**Request**:
```bash
curl -X GET \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-get?entity_id=00000000-0000-0000-0000-000000000000"
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message_en": "No intelligence data found for the specified entity",
    "message_ar": "لم يتم العثور على بيانات استخباراتية للكيان المحدد",
    "details": {
      "entity_id": "00000000-0000-0000-0000-000000000000",
      "intelligence_type": null
    },
    "correlation_id": "dd0e8400-e29b-41d4-a716-446655440008"
  }
}
```

---

## POST /intelligence-refresh Examples

### Example 1: Refresh All Intelligence Types

**Request**:
```bash
curl -X POST \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "550e8400-e29b-41d4-a716-446655440000",
    "priority": "normal"
  }' \
  "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-refresh"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "refresh_id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "completed",
    "entity_id": "550e8400-e29b-41d4-a716-446655440000",
    "intelligence_types": ["economic", "political", "security", "bilateral"],
    "triggered_by": "770e8400-e29b-41d4-a716-446655440002",
    "triggered_at": "2025-01-30T14:30:00Z",
    "estimated_completion": "2025-01-30T14:30:10Z"
  },
  "message_en": "Intelligence refresh completed successfully",
  "message_ar": "تم إكمال تحديث المعلومات الاستخباراتية بنجاح"
}
```

### Example 2: Selective Refresh (Economic and Political Only)

**Request**:
```bash
curl -X POST \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "550e8400-e29b-41d4-a716-446655440000",
    "intelligence_types": ["economic", "political"],
    "force": false,
    "priority": "high"
  }' \
  "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-refresh"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "refresh_id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "completed",
    "entity_id": "550e8400-e29b-41d4-a716-446655440000",
    "intelligence_types": ["economic", "political"],
    "triggered_by": "770e8400-e29b-41d4-a716-446655440002",
    "triggered_at": "2025-01-30T14:30:00Z",
    "estimated_completion": "2025-01-30T14:30:10Z"
  },
  "message_en": "Intelligence refresh completed successfully",
  "message_ar": "تم إكمال تحديث المعلومات الاستخباراتية بنجاح"
}
```

### Example 3: Refresh Conflict (Already in Progress)

**Request**:
```bash
curl -X POST \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "550e8400-e29b-41d4-a716-446655440000",
    "intelligence_types": ["economic"]
  }' \
  "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-refresh"
```

**Response** (409 Conflict):
```json
{
  "success": false,
  "error": {
    "code": "REFRESH_IN_PROGRESS",
    "message_en": "A refresh operation is already in progress for intelligence types: economic",
    "message_ar": "عملية تحديث قيد التنفيذ بالفعل لأنواع المعلومات الاستخباراتية: economic",
    "in_progress_since": "2025-01-30T14:29:30Z"
  }
}
```

### Example 4: AnythingLLM Service Unavailable

**Request**:
```bash
curl -X POST \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "550e8400-e29b-41d4-a716-446655440000"
  }' \
  "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-refresh"
```

**Response** (503 Service Unavailable):
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message_en": "AnythingLLM service is currently unavailable. Cached data remains accessible.",
    "message_ar": "خدمة AnythingLLM غير متاحة حاليًا. البيانات المخزنة مؤقتًا لا تزال متاحة.",
    "retry_after": 60
  }
}
```

---

## POST /intelligence-batch-update Examples

### Example 1: Standard Batch Update (Production)

**Request** (via cron job):
```bash
curl -X POST \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SERVICE_ROLE_KEY..." \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 50
  }' \
  "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-batch-update"
```

**Response** (200 OK):
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
        "entity_id": "550e8400-e29b-41d4-a716-446655440000",
        "intelligence_type": "political",
        "error_code": "ANYTHINGLLM_UNAVAILABLE",
        "error_message": "AnythingLLM service is currently unavailable"
      },
      {
        "entity_id": "550e8400-e29b-41d4-a716-446655440001",
        "intelligence_type": "security",
        "error_code": "EXTERNAL_API_RATE_LIMIT",
        "error_message": "Travel advisory API rate limit exceeded"
      }
    ]
  },
  "message_en": "Batch intelligence refresh completed. 23 successful, 2 failed.",
  "message_ar": "تم إكمال تحديث المعلومات الاستخباراتية بالدفعة. 23 ناجح، 2 فاشل."
}
```

### Example 2: Dry Run (Testing)

**Request**:
```bash
curl -X POST \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SERVICE_ROLE_KEY..." \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 10,
    "dry_run": true
  }' \
  "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-batch-update"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "batch_id": "880e8400-e29b-41d4-a716-446655440004",
    "processed_count": 8,
    "success_count": 0,
    "failure_count": 0,
    "started_at": "2025-01-30T10:00:00Z",
    "completed_at": "2025-01-30T10:00:01Z",
    "duration_ms": 1000,
    "failures": []
  },
  "message_en": "Dry run completed. Would process 8 items.",
  "message_ar": "تم إكمال التشغيل التجريبي. سيتم معالجة 8 عنصرًا."
}
```

### Example 3: No Expired Intelligence

**Request**:
```bash
curl -X POST \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SERVICE_ROLE_KEY..." \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 50,
    "intelligence_types": ["economic", "political"]
  }' \
  "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-batch-update"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "batch_id": "880e8400-e29b-41d4-a716-446655440005",
    "processed_count": 0,
    "success_count": 0,
    "failure_count": 0,
    "started_at": "2025-01-30T15:00:00Z",
    "completed_at": "2025-01-30T15:00:00Z",
    "duration_ms": 50,
    "failures": []
  },
  "message_en": "No expired intelligence items to process",
  "message_ar": "لا توجد عناصر معلومات استخباراتية منتهية الصلاحية للمعالجة"
}
```

---

## Frontend Hook Examples

### Example 1: Basic Intelligence Fetching

```tsx
import { useIntelligence } from '@/hooks/useIntelligence';

function EconomicIntelligenceCard({ countryId }: { countryId: string }) {
  const { data, isLoading, error } = useIntelligence({
    entity_id: countryId,
    intelligence_type: 'economic',
    language: 'en',
  });

  if (isLoading) return <Skeleton />;
  if (error) return <Alert>Error: {error.message}</Alert>;

  const economicIntel = data?.data[0];
  if (!economicIntel) return <EmptyState />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{economicIntel.title}</CardTitle>
        <Badge variant={economicIntel.refresh_status === 'fresh' ? 'success' : 'warning'}>
          {economicIntel.refresh_status}
        </Badge>
      </CardHeader>
      <CardContent>
        <p>{economicIntel.content}</p>
        <div className="text-sm text-muted-foreground mt-4">
          Last updated: {new Date(economicIntel.last_refreshed_at).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Example 2: Manual Refresh with Optimistic Updates

```tsx
import { useRefreshIntelligence, useIntelligence } from '@/hooks/useIntelligence';
import { Button } from '@/components/ui/button';

function IntelligenceRefreshButton({ countryId }: { countryId: string }) {
  const { data } = useIntelligence({ entity_id: countryId });
  const { mutate: refresh, isPending } = useRefreshIntelligence();

  const handleRefresh = () => {
    refresh({
      entity_id: countryId,
      intelligence_types: ['economic', 'political', 'security'],
      priority: 'high',
    });
  };

  const hasStaleData = data?.data.some((r) => r.is_expired || r.refresh_status === 'stale');

  return (
    <div className="flex items-center gap-2">
      {hasStaleData && (
        <Badge variant="warning">Outdated Data Available</Badge>
      )}
      <Button onClick={handleRefresh} disabled={isPending}>
        {isPending ? 'Refreshing...' : 'Refresh Intelligence'}
      </Button>
    </div>
  );
}
```

### Example 3: Selective Refresh by Type

```tsx
import { useRefreshIntelligenceType, useIntelligenceByType } from '@/hooks/useIntelligence';

function EconomicIntelligenceSection({ countryId }: { countryId: string }) {
  const { data: economicIntel, isLoading } = useIntelligenceByType(
    countryId,
    'economic'
  );
  const { mutate: refreshEconomic, isPending } = useRefreshIntelligenceType();

  const handleRefresh = () => {
    refreshEconomic({
      entity_id: countryId,
      intelligence_type: 'economic',
      force: true,
    });
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h3>Economic Intelligence</h3>
        <Button onClick={handleRefresh} disabled={isPending} size="sm">
          Refresh
        </Button>
      </div>
      {economicIntel && (
        <IntelligenceContent intelligence={economicIntel} />
      )}
    </div>
  );
}
```

### Example 4: Prefetch on Hover

```tsx
import { usePrefetchIntelligence } from '@/hooks/useIntelligence';
import { Link } from '@tanstack/react-router';

function CountryCard({ country }: { country: Country }) {
  const prefetchIntelligence = usePrefetchIntelligence();

  return (
    <Link
      to={`/dossiers/countrys/${country.id}`}
      onMouseEnter={() => prefetchIntelligence(country.id)}
    >
      <Card>
        <CardHeader>
          <CardTitle>{country.name_en}</CardTitle>
        </CardHeader>
      </Card>
    </Link>
  );
}
```

### Example 5: Intelligence Dashboard with All Types

```tsx
import { useAllIntelligence, useRefreshIntelligence } from '@/hooks/useIntelligence';

function CountryIntelligenceDashboard({ countryId }: { countryId: string }) {
  const { data, isLoading } = useAllIntelligence(countryId);
  const { mutate: refresh, isPending } = useRefreshIntelligence();

  if (isLoading) return <LoadingSpinner />;

  const intelligenceByType = {
    economic: data?.data.find((i) => i.intelligence_type === 'economic'),
    political: data?.data.find((i) => i.intelligence_type === 'political'),
    security: data?.data.find((i) => i.intelligence_type === 'security'),
    bilateral: data?.data.find((i) => i.intelligence_type === 'bilateral'),
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <IntelligenceTypeCard
        title="Economic Intelligence"
        intelligence={intelligenceByType.economic}
      />
      <IntelligenceTypeCard
        title="Political Analysis"
        intelligence={intelligenceByType.political}
      />
      <IntelligenceTypeCard
        title="Security Assessment"
        intelligence={intelligenceByType.security}
      />
      <IntelligenceTypeCard
        title="Bilateral Relations"
        intelligence={intelligenceByType.bilateral}
      />
    </div>
  );
}
```

---

## Error Response Examples

### Validation Error (400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message_en": "Invalid request parameters: entity_id must be a valid UUID",
    "message_ar": "معلمات الطلب غير صالحة: يجب أن يكون entity_id UUID صالحًا",
    "details": {
      "field": "entity_id",
      "reason": "Must be a valid UUID",
      "provided": "invalid-id"
    },
    "correlation_id": "bb0e8400-e29b-41d4-a716-446655440006"
  }
}
```

### Unauthorized (401)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message_en": "Missing or invalid authorization header",
    "message_ar": "رأس التفويض مفقود أو غير صالح",
    "correlation_id": "cc0e8400-e29b-41d4-a716-446655440007"
  }
}
```

### Internal Server Error (500)

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message_en": "An unexpected error occurred",
    "message_ar": "حدث خطأ غير متوقع",
    "details": {
      "error_message": "Database connection timeout",
      "error_stack": "Error: Connection timeout\n  at ..."
    },
    "correlation_id": "ee0e8400-e29b-41d4-a716-446655440009"
  }
}
```

---

## Testing Checklist

Use these examples to test the complete API:

- [ ] Fetch intelligence with all parameters
- [ ] Fetch intelligence with selective types
- [ ] Fetch intelligence in Arabic language
- [ ] Handle 404 when entity doesn't exist
- [ ] Refresh all intelligence types
- [ ] Refresh selective intelligence types
- [ ] Handle concurrent refresh conflict (409)
- [ ] Handle AnythingLLM unavailable (503)
- [ ] Batch update with standard limit
- [ ] Batch update with dry run
- [ ] Verify cache TTL expiration
- [ ] Verify locking mechanism prevents duplicates
- [ ] Test frontend hooks with React Query DevTools
- [ ] Verify optimistic updates in UI
- [ ] Test prefetch on navigation hover
