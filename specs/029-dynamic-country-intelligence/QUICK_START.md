# Dynamic Country Intelligence System - Quick Start Guide

**For Developers**: This guide helps you quickly start using the new intelligence schema.

## TL;DR

```typescript
import { IntelligenceReport, IntelligenceType } from '@/types/intelligence-reports.types';

// Get intelligence for a country
const economicIntel = await getLatestIntelligence(countryId, 'economic');

// Check if cache is stale
if (isIntelligenceStale(economicIntel)) {
  // Trigger refresh
  await refreshIntelligence(countryId, ['economic']);
}

// Display in UI
<IntelligenceWidget
  entityId={countryId}
  intelligenceType="economic"
  showRefreshButton={true}
/>
```

## Installation

### 1. Apply Database Migration

Using Supabase MCP (recommended):

```bash
# Migration will be applied automatically via MCP
# File: supabase/migrations/20250130000001_extend_intelligence_reports_dynamic_system.sql
```

Or manually:

```bash
npx supabase db push
```

### 2. Import TypeScript Types

```typescript
// In your component file
import {
  IntelligenceReport,
  IntelligenceType,
  RefreshStatus,
  IntelligenceCacheStatus,
  isIntelligenceStale,
  isIntelligenceExpired,
  getIntelligenceTypeLabel,
  INTELLIGENCE_TTL_HOURS,
} from '@/types/intelligence-reports.types';
```

## Core Concepts

### Intelligence Types

```typescript
type IntelligenceType =
  | 'economic'      // GDP, inflation, trade - TTL: 24h
  | 'political'     // Events, leadership - TTL: 6h
  | 'security'      // Threats, advisories - TTL: 12h
  | 'bilateral'     // Relationships - TTL: 48h
  | 'general';      // Other - TTL: 24h
```

### Refresh Status States

```typescript
type RefreshStatus =
  | 'fresh'         // Valid cache
  | 'stale'         // Expired but usable
  | 'refreshing'    // Currently updating
  | 'error'         // Last refresh failed
  | 'expired';      // Too old
```

## Common Tasks

### Task 1: Fetch Intelligence for Entity

```typescript
// Edge Function: intelligence-get
const response = await supabase.functions.invoke('intelligence-get', {
  body: {
    entity_id: countryId,
    intelligence_types: ['economic', 'political'], // Optional filter
    include_stale: true, // Default: true
    latest_only: true, // Default: true
  }
});

const { data, cache_status } = response.data;
```

### Task 2: Refresh Intelligence

```typescript
// Edge Function: intelligence-refresh
const response = await supabase.functions.invoke('intelligence-refresh', {
  body: {
    entity_id: countryId,
    intelligence_types: ['economic'], // Selective refresh
    force: false, // Set true to refresh even if fresh
  }
});

const { success, refreshed_types, duration_ms } = response.data;
```

### Task 3: Check Cache Status

```typescript
// Using helper functions
import { isIntelligenceStale, getTimeUntilExpiry } from '@/types/intelligence-reports.types';

const report: IntelligenceReport = /* fetched from DB */;

if (isIntelligenceStale(report)) {
  console.log('Cache is stale - consider refreshing');
}

const ttl = getTimeUntilExpiry(report);
if (ttl && ttl < 3600000) { // Less than 1 hour
  console.log('Cache expires soon');
}
```

### Task 4: Display in UI Component

```typescript
import { IntelligenceWidget } from '@/components/intelligence/IntelligenceWidget';
import { useTranslation } from 'react-i18next';

function CountryDossierPage({ countryId }: { countryId: string }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Economic indicators inline widget */}
      <section className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">
          {i18n.language === 'ar' ? 'المؤشرات الاقتصادية' : 'Economic Indicators'}
        </h2>
        <IntelligenceWidget
          entityId={countryId}
          intelligenceType="economic"
          showRefreshButton={true}
          showTimestamp={true}
          showConfidence={true}
          className="bg-white dark:bg-gray-800 rounded-lg p-4"
        />
      </section>

      {/* Other sections... */}
    </div>
  );
}
```

### Task 5: Create Intelligence Dashboard

```typescript
import { IntelligenceDashboard } from '@/components/intelligence/IntelligenceDashboard';

function IntelligenceTab({ countryId }: { countryId: string }) {
  return (
    <IntelligenceDashboard
      entityId={countryId}
      intelligenceTypes={['economic', 'political', 'security', 'bilateral']}
      showFilters={true}
      showExport={true}
      dateRange={{
        start: '2024-01-01',
        end: new Date().toISOString().split('T')[0],
      }}
      minConfidence={70}
      onRefresh={(types) => console.log('Refreshed:', types)}
    />
  );
}
```

## Database Queries

### Query 1: Get Latest Intelligence for Entity

```sql
SELECT * FROM get_latest_intelligence(
  'entity-uuid-here',  -- entity_id
  'economic',          -- intelligence_type (optional)
  true                 -- include_stale
);
```

### Query 2: Find Expired Intelligence

```sql
SELECT
  entity_id,
  entity_type,
  intelligence_type,
  hours_since_refresh
FROM intelligence_cache_status
WHERE refresh_status = 'stale'
  OR is_expired = true
ORDER BY hours_since_refresh DESC;
```

### Query 3: Lock Intelligence for Refresh

```sql
SELECT lock_intelligence_for_refresh(
  'entity-uuid-here',  -- entity_id
  'economic',          -- intelligence_type
  'user-uuid-here',    -- user_id
  'manual'             -- trigger_type
);
```

### Query 4: Get All Intelligence Types for Entity

```sql
SELECT
  intelligence_type,
  title,
  confidence_score,
  refresh_status,
  last_refreshed_at,
  cache_expires_at
FROM intelligence_reports
WHERE entity_id = 'entity-uuid-here'
  AND archived_at IS NULL
ORDER BY intelligence_type, last_refreshed_at DESC;
```

## TanStack Query Hooks

### Hook 1: Fetch Intelligence

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { IntelligenceReport } from '@/types/intelligence-reports.types';

export function useIntelligence(
  entityId: string,
  intelligenceType?: string
) {
  return useQuery({
    queryKey: ['intelligence', entityId, intelligenceType],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('intelligence-get', {
        body: { entity_id: entityId, intelligence_types: intelligenceType ? [intelligenceType] : undefined }
      });

      if (error) throw error;
      return data as { data: IntelligenceReport[], cache_status: any };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
}
```

### Hook 2: Refresh Intelligence

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { IntelligenceType } from '@/types/intelligence-reports.types';

export function useRefreshIntelligence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityId,
      intelligenceTypes,
      force = false,
    }: {
      entityId: string;
      intelligenceTypes?: IntelligenceType[];
      force?: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke('intelligence-refresh', {
        body: { entity_id: entityId, intelligence_types: intelligenceTypes, force }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate intelligence queries for this entity
      queryClient.invalidateQueries({
        queryKey: ['intelligence', variables.entityId]
      });
    },
  });
}

// Usage in component
function MyComponent({ entityId }: { entityId: string }) {
  const { mutate: refresh, isPending } = useRefreshIntelligence();

  const handleRefresh = () => {
    refresh({
      entityId,
      intelligenceTypes: ['economic'],
      force: false,
    });
  };

  return (
    <button onClick={handleRefresh} disabled={isPending}>
      {isPending ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}
```

### Hook 3: Cache Status

```typescript
export function useIntelligenceCacheStatus(entityId: string) {
  return useQuery({
    queryKey: ['intelligence-cache-status', entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intelligence_cache_status')
        .select('*')
        .eq('entity_id', entityId);

      if (error) throw error;
      return data as IntelligenceCacheStatus[];
    },
    refetchInterval: 60 * 1000, // Refetch every minute for dashboard
  });
}
```

## Edge Function Examples

### intelligence-get Function

```typescript
// supabase/functions/intelligence-get/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { entity_id, intelligence_types, include_stale = true, latest_only = true } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Build query
  let query = supabase
    .from('intelligence_reports')
    .select('*')
    .eq('entity_id', entity_id)
    .is('archived_at', null);

  if (intelligence_types && intelligence_types.length > 0) {
    query = query.in('intelligence_type', intelligence_types);
  }

  if (!include_stale) {
    query = query.eq('refresh_status', 'fresh');
  }

  if (latest_only) {
    query = query.order('last_refreshed_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Calculate cache status
  const cache_status = {
    total_reports: data.length,
    fresh_count: data.filter(r => r.refresh_status === 'fresh').length,
    stale_count: data.filter(r => r.refresh_status === 'stale').length,
    expired_count: data.filter(r => new Date(r.cache_expires_at) < new Date()).length,
  };

  return new Response(JSON.stringify({ success: true, data, cache_status }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

## Monitoring and Alerts

### Check Cache Health

```sql
-- Run daily to monitor cache health
SELECT
  intelligence_type,
  COUNT(*) AS total_reports,
  COUNT(*) FILTER (WHERE refresh_status = 'fresh') AS fresh_count,
  COUNT(*) FILTER (WHERE refresh_status = 'stale') AS stale_count,
  COUNT(*) FILTER (WHERE refresh_status = 'error') AS error_count,
  AVG(EXTRACT(EPOCH FROM (NOW() - last_refreshed_at)) / 3600) AS avg_hours_since_refresh
FROM intelligence_reports
WHERE archived_at IS NULL
GROUP BY intelligence_type;
```

### Alert for Stale Intelligence

```sql
-- Alert if >20% of intelligence is stale
WITH stats AS (
  SELECT
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE refresh_status IN ('stale', 'expired')) AS stale_count
  FROM intelligence_reports
  WHERE archived_at IS NULL
)
SELECT
  stale_count,
  total,
  (stale_count::float / total * 100)::int AS stale_percentage
FROM stats
WHERE (stale_count::float / total) > 0.2; -- >20%
```

## Troubleshooting

### Issue: Intelligence not refreshing

**Check 1**: Verify AnythingLLM service is running
```bash
docker ps | grep anythingllm
```

**Check 2**: Check refresh lock status
```sql
SELECT entity_id, intelligence_type, refresh_status, last_refreshed_at
FROM intelligence_reports
WHERE refresh_status = 'refreshing'
  AND last_refreshed_at < NOW() - INTERVAL '10 minutes';
```

**Fix**: Unlock stuck refreshes
```sql
UPDATE intelligence_reports
SET refresh_status = 'error',
    refresh_error_message = 'Refresh timeout - manually reset'
WHERE refresh_status = 'refreshing'
  AND last_refreshed_at < NOW() - INTERVAL '10 minutes';
```

### Issue: RLS blocking intelligence access

**Check**: Verify user clearance level
```sql
SELECT get_user_clearance_level(auth.uid());
```

**Check**: Verify dossier sensitivity
```sql
SELECT id, name_en, sensitivity_level
FROM dossiers
WHERE id = 'entity-uuid-here';
```

### Issue: High refresh duration

**Check**: Query slow refreshes
```sql
SELECT
  entity_id,
  intelligence_type,
  refresh_duration_ms,
  anythingllm_response_metadata->>'total_tokens' AS tokens,
  last_refreshed_at
FROM intelligence_reports
WHERE refresh_duration_ms > 10000 -- >10 seconds
ORDER BY refresh_duration_ms DESC
LIMIT 10;
```

**Fix**: Consider:
- Optimize AnythingLLM workspace (fewer documents)
- Reduce prompt complexity
- Increase AnythingLLM resources

## Best Practices

1. **Always check cache status before refreshing**
   ```typescript
   if (!isIntelligenceStale(report)) {
     console.log('Cache is fresh - no need to refresh');
     return;
   }
   ```

2. **Use selective refresh for specific types**
   ```typescript
   // Refresh only economic data, not all types
   await refreshIntelligence(entityId, ['economic']);
   ```

3. **Handle refresh errors gracefully**
   ```typescript
   const { data, error } = await refreshIntelligence(entityId);
   if (error) {
     toast.error('Failed to refresh intelligence');
     // Still display cached data
   }
   ```

4. **Show loading states during refresh**
   ```typescript
   const { mutate, isPending } = useRefreshIntelligence();

   return (
     <Button onClick={() => mutate({ entityId })} disabled={isPending}>
       {isPending ? <Spinner /> : 'Refresh'}
     </Button>
   );
   ```

5. **Respect TTL values per intelligence type**
   ```typescript
   // Don't refresh if within TTL
   const ttl = getIntelligenceTTLMs(report.intelligence_type);
   const timeSinceRefresh = Date.now() - new Date(report.last_refreshed_at).getTime();

   if (timeSinceRefresh < ttl) {
     console.log('Within TTL - skipping refresh');
     return;
   }
   ```

## Performance Tips

1. **Use composite indexes for common queries**
   - `idx_intelligence_reports_entity_type_fresh` covers most entity queries

2. **Limit refresh frequency**
   - Respect TTL values
   - Use debouncing for manual refresh buttons

3. **Batch intelligence fetches**
   - Fetch all types in one query rather than separate queries

4. **Cache on frontend**
   - Use TanStack Query's `staleTime` and `cacheTime`
   - Avoid refetching fresh data

5. **Monitor slow queries**
   - Use `intelligence_cache_status` view
   - Check `refresh_duration_ms` regularly

## Next Steps

1. Read full documentation: `specs/029-dynamic-country-intelligence/DATABASE_DESIGN.md`
2. Implement Edge Functions for intelligence operations
3. Create UI components (IntelligenceWidget, IntelligenceDashboard)
4. Set up monitoring and alerts
5. Test with real AnythingLLM integration

## Resources

- **Migration File**: `supabase/migrations/20250130000001_extend_intelligence_reports_dynamic_system.sql`
- **TypeScript Types**: `frontend/src/types/intelligence-reports.types.ts`
- **Design Doc**: `specs/029-dynamic-country-intelligence/DATABASE_DESIGN.md`
- **Feature Spec**: `specs/029-dynamic-country-intelligence/spec.md`

---

**Last Updated**: 2025-01-30
**Version**: 1.0
