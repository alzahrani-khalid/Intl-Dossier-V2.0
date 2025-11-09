# Quick Start: Dynamic Country Intelligence System

**Date**: 2025-01-30
**Feature**: 029-dynamic-country-intelligence

## Overview

This guide provides step-by-step instructions for developers to implement and test the Dynamic Country Intelligence System. Follow these steps in order.

---

## Prerequisites

✅ **Before starting, ensure you have**:
1. Supabase project running (staging: zkrcjzdemdmwhearhfgg)
2. Docker installed and running
3. Node.js 18+ and pnpm installed
4. Access to Supabase project secrets
5. OpenAI API key (for embeddings)

---

## Phase 1: Database Setup (30 minutes)

### Step 1: Apply Database Migration

The migration extends the `intelligence_reports` table with caching, versioning, and entity linking columns.

```bash
# Migration file already created at:
# supabase/migrations/20250130000001_extend_intelligence_reports_dynamic_system.sql

# Apply via Supabase MCP (per 2025 guidelines)
# The MCP will automatically detect and apply the migration
```

**Verification**:
```sql
-- Check new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'intelligence_reports'
  AND column_name IN ('entity_id', 'intelligence_type', 'cache_expires_at', 'refresh_status');

-- Should return 4 rows
```

### Step 2: Verify Indexes

```sql
-- Check performance indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'intelligence_reports'
  AND indexname LIKE 'idx_intelligence%';

-- Should return 15 indexes
```

---

## Phase 2: AnythingLLM Setup (45 minutes)

### Step 1: Deploy AnythingLLM Docker Container

```bash
# Create docker-compose.yml for AnythingLLM
cat > docker-compose.anythingllm.yml <<'EOF'
version: '3.8'

services:
  anythingllm:
    image: mintplexlabs/anythingllm:latest
    container_name: anythingllm
    ports:
      - "3001:3001"
    volumes:
      - anythingllm_data:/app/server/storage
    environment:
      - JWT_SECRET=${ANYTHINGLLM_JWT_SECRET}
      - LLM_PROVIDER=openai
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - EMBEDDING_MODEL_PREF=openai
      - VECTOR_DB=lancedb  # Or 'pgvector' if connecting to Supabase
      - STORAGE_DIR=/app/server/storage

volumes:
  anythingllm_data:
    driver: local

EOF

# Start container
docker-compose -f docker-compose.anythingllm.yml up -d

# Check logs
docker logs anythingllm --tail 50

# Expected output:
# "AnythingLLM is running on http://localhost:3001"
```

### Step 2: Configure AnythingLLM

```bash
# 1. Open http://localhost:3001 in browser
# 2. Complete initial setup wizard:
#    - Set admin email/password
#    - Select OpenAI as LLM provider
#    - Enter OpenAI API key
#    - Select text-embedding-ada-002 as embedding model

# 3. Enable multi-user mode (Settings → Multi-User Mode → Enable)
# 4. Generate API key (Settings → API Keys → Generate New Key)
#    Save this key as ANYTHINGLLM_API_KEY
```

### Step 3: Create Test Workspace

```bash
# Using curl to create first workspace
curl -X POST http://localhost:3001/api/v1/workspace \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "country-sa",
    "description": "Intelligence workspace for Saudi Arabia"
  }'

# Expected response:
# { "workspace": { "name": "country-sa", "slug": "country-sa", ... } }
```

---

## Phase 3: Edge Functions Deployment (30 minutes)

### Step 1: Set Environment Variables

```bash
# Set secrets via Supabase CLI
supabase secrets set ANYTHINGLLM_URL=http://localhost:3001
supabase secrets set ANYTHINGLLM_API_KEY=your-anythingllm-api-key
supabase secrets set OPENAI_API_KEY=your-openai-api-key

# Verify secrets
supabase secrets list
```

### Step 2: Deploy Edge Functions

```bash
# Deploy intelligence-get (fetch cached intelligence)
supabase functions deploy intelligence-get

# Deploy intelligence-refresh (manual refresh)
supabase functions deploy intelligence-refresh

# Deploy intelligence-batch-update (background job)
supabase functions deploy intelligence-batch-update

# Verify deployments
supabase functions list

# Expected output:
# intelligence-get             https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-get
# intelligence-refresh         https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-refresh
# intelligence-batch-update    https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-batch-update
```

### Step 3: Test Edge Functions

```bash
# Get your JWT token (login to app first)
export JWT_TOKEN="your-jwt-token"

# Test intelligence-get
curl https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-get \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "41c7fb7b-1e69-4381-8310-04b6e74d0551",
    "intelligence_type": "economic"
  }'

# Expected: 200 OK with cached intelligence OR 404 if no cache exists
```

---

## Phase 4: Frontend Integration (45 minutes)

### Step 1: Install TypeScript Types

```bash
# Types already generated at:
# frontend/src/types/intelligence-reports.types.ts

# Verify import works
cd frontend
pnpm run typecheck

# Expected: No errors related to intelligence types
```

### Step 2: Use TanStack Query Hooks

```typescript
// In your country dossier component
import { useIntelligence, useRefreshIntelligence } from '@/hooks/useIntelligence';

function CountryIntelligenceWidget({ countryId }: { countryId: string }) {
  // Fetch intelligence with automatic caching
  const { data, isLoading, isStale } = useIntelligence({
    entity_id: countryId,
    intelligence_type: 'economic'
  });

  // Manual refresh mutation
  const { mutate: refresh, isPending } = useRefreshIntelligence();

  if (isLoading) return <Skeleton />;
  if (!data) return <EmptyState message="No economic intelligence available" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.title_en}</CardTitle>
        {isStale && <Badge variant="warning">Stale Data</Badge>}
      </CardHeader>
      <CardContent>
        <p>{data.executive_summary_en}</p>
        <p className="text-sm text-muted-foreground">
          Last updated: {formatDistanceToNow(new Date(data.last_refreshed_at))} ago
        </p>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => refresh({
            entity_id: countryId,
            intelligence_types: ['economic']
          })}
          disabled={isPending}
        >
          {isPending ? 'Refreshing...' : 'Refresh Intelligence'}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Step 3: Test Frontend Components

```bash
# Start development server
cd frontend
pnpm dev

# Navigate to country dossier page
# Open http://localhost:3000/dossiers/countrys/41c7fb7b-1e69-4381-8310-04b6e74d0551

# Expected behavior:
# 1. Page loads with "No economic intelligence available" (no cache yet)
# 2. Click "Refresh Intelligence" button
# 3. See loading state
# 4. After 5-10 seconds, see intelligence content
# 5. Refresh again immediately → see "Refreshing..." disabled state
```

---

## Phase 5: Testing & Validation (30 minutes)

### Test 1: Cache Hit/Miss

```bash
# 1. First request (cache MISS)
time curl -H "Authorization: Bearer $JWT_TOKEN" \
  "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-get?entity_id=41c7fb7b-1e69-4381-8310-04b6e74d0551&intelligence_type=economic"

# Expected: 404 Not Found, response time ~200ms

# 2. Trigger refresh
curl -X POST -H "Authorization: Bearer $JWT_TOKEN" \
  "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-refresh" \
  -d '{"entity_id":"41c7fb7b-1e69-4381-8310-04b6e74d0551","intelligence_types":["economic"]}'

# Expected: 200 OK, response time ~5-10 seconds (AnythingLLM query)

# 3. Second request (cache HIT)
time curl -H "Authorization: Bearer $JWT_TOKEN" \
  "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-get?entity_id=41c7fb7b-1e69-4381-8310-04b6e74d0551&intelligence_type=economic"

# Expected: 200 OK with data, response time <100ms
```

### Test 2: Concurrent Refresh Prevention

```bash
# Terminal 1: Start refresh
curl -X POST -H "Authorization: Bearer $JWT_TOKEN" \
  "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-refresh" \
  -d '{"entity_id":"41c7fb7b-1e69-4381-8310-04b6e74d0551","intelligence_types":["economic"]}'
# Don't wait for response...

# Terminal 2: Immediately try another refresh (within 1 second)
curl -X POST -H "Authorization: Bearer $JWT_TOKEN" \
  "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-refresh" \
  -d '{"entity_id":"41c7fb7b-1e69-4381-8310-04b6e74d0551","intelligence_types":["economic"]}'

# Expected from Terminal 2: 409 Conflict
# { "error": "Refresh already in progress", "correlation_id": "..." }
```

### Test 3: TTL Expiration

```sql
-- Manually expire cache (for testing)
UPDATE intelligence_reports
SET cache_expires_at = NOW() - INTERVAL '1 hour',
    refresh_status = 'stale'
WHERE entity_id = '41c7fb7b-1e69-4381-8310-04b6e74d0551'
  AND intelligence_type = 'economic'
  AND is_latest_version = true;

-- Verify status
SELECT
  id,
  intelligence_type,
  refresh_status,
  cache_expires_at,
  CASE
    WHEN cache_expires_at > NOW() THEN 'fresh'
    WHEN cache_expires_at <= NOW() THEN 'stale'
  END AS computed_status
FROM intelligence_reports
WHERE entity_id = '41c7fb7b-1e69-4381-8310-04b6e74d0551'
  AND intelligence_type = 'economic'
  AND is_latest_version = true;

-- Expected: refresh_status = 'stale', computed_status = 'stale'
```

---

## Common Issues & Troubleshooting

### Issue 1: AnythingLLM Connection Timeout

**Symptoms**: Edge Function returns 500 error, logs show "ECONNREFUSED localhost:3001"

**Solution**:
```bash
# Check AnythingLLM is running
docker ps | grep anythingllm

# If not running, start it
docker-compose -f docker-compose.anythingllm.yml up -d

# Check logs for errors
docker logs anythingllm --tail 100
```

### Issue 2: "No Workspace Found" Error

**Symptoms**: Refresh fails with "Workspace country-sa not found"

**Solution**:
```bash
# List workspaces
curl http://localhost:3001/api/v1/workspaces \
  -H "Authorization: Bearer YOUR_API_KEY"

# If workspace missing, create it
curl -X POST http://localhost:3001/api/v1/workspace \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "country-sa"}'
```

### Issue 3: Vector Embedding Dimension Mismatch

**Symptoms**: Database error "vector dimension mismatch: expected 1536, got 384"

**Solution**:
```bash
# Check embedding model in AnythingLLM
# Settings → Embedding Preference → Should be "text-embedding-ada-002"

# If wrong model, change to OpenAI ada-002
# Then re-upload documents and re-embed
```

### Issue 4: RLS Policy Blocks Query

**Symptoms**: Edge Function returns empty array despite data existing

**Solution**:
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'intelligence_reports';

-- Verify user has access to dossier
SELECT *
FROM dossiers
WHERE id = '41c7fb7b-1e69-4381-8310-04b6e74d0551';

-- If missing, check user permissions in users table
```

---

## Performance Benchmarks

**Expected Performance** (after warmup):

| Operation | Target | Actual (your results) |
|-----------|--------|----------------------|
| Cache hit (intelligence-get) | <100ms | ___ ms |
| Cache miss + AnythingLLM query | <10s | ___ s |
| Manual refresh (cached response) | <5s | ___ s |
| Vector similarity search | <200ms | ___ ms |
| Batch update (50 items) | <5 min | ___ min |

**How to Measure**:
```bash
# Use curl with timing
time curl -w "\nTime: %{time_total}s\n" [URL]

# Or use Apache Bench for load testing
ab -n 100 -c 10 -H "Authorization: Bearer $JWT_TOKEN" [URL]
```

---

## Next Steps

✅ **You've completed the quickstart! Now you can**:
1. **Implement UI Components**: Add intelligence widgets to country dossier pages
2. **Set Up Monitoring**: Configure Grafana dashboards for cache hit ratio
3. **Add More Workspaces**: Create workspaces for other countries
4. **Upload Documents**: Add intelligence reports to AnythingLLM workspaces
5. **Schedule Batch Updates**: Set up cron job for automatic refresh

**Recommended Reading**:
- [API Contracts](./api-contracts/README.md) - Full API documentation
- [Data Model](./data-model.md) - Database schema details
- [Research](./research.md) - Architecture decisions

---

## Support & Resources

- **AnythingLLM Docs**: https://docs.useanything.com
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **TanStack Query**: https://tanstack.com/query/latest
- **Project Issues**: Report bugs at GitHub repo

**Estimated Total Setup Time**: ~3 hours (including testing)
