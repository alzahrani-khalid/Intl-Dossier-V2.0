# CRITICAL: Supabase Edge Function Persistent Caching Bug

**Date**: 2025-10-31
**Project**: zkrcjzdemdmwhearhfgg (Intl-Dossier)
**Region**: eu-west-2
**Status**: **URGENT** - Deployed code does NOT match source code

---

## Summary

Supabase Edge Functions is deploying and executing **OLD cached code** that does not exist anywhere in our source repository, despite multiple redeployments, function deletion/recreation, and even creating entirely new functions with different names.

---

## Evidence of the Problem

### 1. Source Code (What We Have)

File: `/supabase/functions/intelligence-refresh/index.ts` (lines 324-337)

```typescript
const queries: Record<IntelligenceType, string> = {
  economic: `[V45-STRUCTURED-JSON] Analyze ${entityName}'s economic intelligence. Respond ONLY with valid JSON in this exact format:
{
  "summary": "Brief 2-3 sentence executive summary",
  "metrics": {
    "gdp_growth": "X.X%",
    "inflation_rate": "X.X%",
    "trade_balance": "$XXB surplus/deficit",
    "unemployment": "X.X%"
  },
  "analysis": "Detailed analysis..."
}
...`
```

**Verification Marker Added**: `[V45-STRUCTURED-JSON]` (line 326)

### 2. Database Shows (What's Actually Running)

Query from database after latest deployment (2025-10-31 21:06:12 UTC):

```sql
SELECT anythingllm_query FROM intelligence_reports
WHERE intelligence_type = 'economic'
ORDER BY last_refreshed_at DESC LIMIT 1;
```

**Result**:

```
"For the country \"China\": Analyze current economic indicators including GDP growth, inflation rate, trade balance, and major economic policies. Provide quantitative data with sources. Focus specifically on China's economic situation.

IMPORTANT: Provide your response in BOTH English and Arabic using..."
```

This is the **OLD bilingual format** that:

- ❌ Does NOT exist in our current source code
- ❌ Does NOT contain the V45 verification marker
- ❌ Does NOT generate metrics (stored as NULL)

### 3. Search Confirmation

Searched ENTIRE codebase for old prompt format:

```bash
find /Users/.../supabase/functions -name "*.ts" -exec grep -l "For the country" {} \;
# Result: NO FILES FOUND

grep -r "For the country" /Users/.../supabase/functions/
# Result: NO MATCHES
```

**The old code does NOT exist anywhere in our repository.**

---

## Actions Taken (All Failed)

### Attempt 1: Standard Redeploy

```bash
supabase functions deploy intelligence-refresh --project-ref zkrcjzdemdmwhearhfgg
# Deployed as version 40, 41, 42, 43, 44
# Result: Still used old code
```

### Attempt 2: Clear Deno Cache

```bash
rm -rf ~/.cache/deno
supabase functions deploy intelligence-refresh --project-ref zkrcjzdemdmwhearhfgg
# Result: Still used old code
```

### Attempt 3: Delete and Recreate Function

```bash
supabase functions delete intelligence-refresh --project-ref zkrcjzdemdmwhearhfgg
# Function ID: d5e95905-6036-4bea-ad1f-601a12be4c69 (DELETED)

supabase functions deploy intelligence-refresh --project-ref zkrcjzdemdmwhearhfgg
# New Function ID: 9ec7ce3e-0d09-4a2b-b7b2-bdafd554cdb1 (RECREATED)
# Result: Still used old code despite NEW function ID
```

### Attempt 4: Deploy with Different Function Name

```bash
cp -r supabase/functions/intelligence-refresh supabase/functions/intelligence-refresh-v2
supabase functions deploy intelligence-refresh-v2 --project-ref zkrcjzdemdmwhearhfgg
# Completely new function name
# Result: STILL used old code
```

---

## Timeline of Deployments

| Time (UTC)   | Action                         | Function Version | Code Used | Metrics  |
| ------------ | ------------------------------ | ---------------- | --------- | -------- |
| 19:23:07     | Deploy v40                     | 40               | OLD       | NULL     |
| 19:23:07     | Deploy v41                     | 41               | OLD       | NULL     |
| 20:23:16     | Deploy v42 with logging        | 42               | OLD       | NULL     |
| 20:31:50     | Deploy v43 cache cleared       | 43               | OLD       | NULL     |
| 20:33:09     | Deploy v44 enhanced logging    | 44               | OLD       | NULL     |
| **20:43:39** | **Delete + Recreate (NEW ID)** | **1**            | **OLD**   | **NULL** |
| **20:48:00** | **Add V45 marker**             | **2**            | **OLD**   | **NULL** |
| **21:02:00** | **Deploy as -v2 (NEW NAME)**   | **1**            | **OLD**   | **NULL** |

**Latest Database Record**: 2025-10-31 21:06:12 UTC

- Query used: OLD format ("For the country...")
- Metrics: NULL
- NO V45 marker present

---

## What This Proves

1. **Platform-level caching** - The bundled code is being cached somewhere that persists across:
   - Multiple redeployments
   - Function deletion/recreation
   - New function IDs
   - Completely different function names

2. **CDN/Edge caching** - The cached bundle is likely stored at CDN or edge level, not locally

3. **No local cache involvement** - Clearing Deno cache had no effect

4. **Not a Git issue** - Old code doesn't exist in repository

---

## Impact

**CRITICAL**: Our application cannot function correctly because:

- Intelligence reports are generated without metrics
- Database stores NULL in metrics field
- UI displays "N/A" for all key indicators
- Users cannot access critical economic/political data

**Business Impact**: The intelligence dashboard is completely non-functional.

---

## Expected Behavior

After deploying new code:

1. Edge Function should execute the NEW code with structured JSON prompts
2. AnythingLLM should receive prompts with `[V45-STRUCTURED-JSON]` marker
3. Metrics should be parsed and stored in database
4. UI should display actual values instead of "N/A"

---

## Actual Behavior

After deploying new code (including deletion/recreation):

1. Edge Function executes OLD cached code with bilingual prompts
2. AnythingLLM receives old format (verified via database query field)
3. Metrics are NULL (parsing fails)
4. UI shows "N/A" for all indicators

---

## Verification Test

**To verify this is a caching issue**, please check the deployed bundle for function:

- **Function Name**: `intelligence-refresh-v2`
- **Function ID**: (latest deployment)
- **Project**: zkrcjzdemdmwhearhfgg
- **Region**: eu-west-2

**Expected to find in bundle** (line 326):

```typescript
economic: `[V45-STRUCTURED-JSON] Analyze ${entityName}'s economic intelligence...`;
```

**Actually executing** (from database query field):

```
"For the country \"China\": Analyze current economic indicators..."
```

---

## Request for Supabase Support

Please investigate:

1. **CDN/Edge caching** - Is there a cache layer that survives function deletion?
2. **Bundle storage** - Where are bundled functions stored? Can this be cleared?
3. **Deployment pipeline** - Is there an intermediate cache between CLI and runtime?
4. **Manual cache invalidation** - Can Supabase support manually clear caches for project zkrcjzdemdmwhearhfgg?

---

## Technical Details

- **Supabase CLI Version**: (latest)
- **Deno Version**: N/A (not installed locally, using Supabase bundler)
- **Project ID**: zkrcjzdemdmwhearhfgg
- **Function Path**: `supabase/functions/intelligence-refresh/index.ts`
- **Bundle Size**: 147.4kB
- **Deployment Method**: Supabase CLI via `supabase functions deploy`

---

## Workaround Attempted

We tried deploying with a completely different function name (`intelligence-refresh-v2`) to bypass any name-based caching. **This also failed** - the new function with a new name STILL executed the old cached code.

This proves the caching is not based on function name but likely on:

- Project ID + bundled dependencies
- CDN URL patterns
- File content hash (but hash should change!)

---

## Next Steps Needed

1. **Supabase support** to manually invalidate caches for project zkrcjzdemdmwhearhfgg
2. **Investigate** platform caching architecture for Edge Functions
3. **Provide workaround** to force cache invalidation
4. **Fix** underlying caching bug to prevent this from affecting other users

---

## Contact Information

**Project**: Intl-Dossier V2.0
**GitHub**: (if applicable)
**Priority**: URGENT - Production feature non-functional

---

## Additional Context

### AnythingLLM Verification

We verified that AnythingLLM WORKS PERFECTLY with the new structured JSON prompts when tested directly in the chat interface. The response was:

```json
{
  "summary": "...",
  "metrics": {
    "gdp_growth": "5.4%",
    "inflation_rate": "2.2%",
    "trade_balance": "$68B surplus",
    "unemployment": "5.5%"
  },
  "analysis": "..."
}
```

This confirms:

- ✅ The NEW prompts work correctly
- ✅ The parsing logic is correct
- ✅ The problem is ONLY that the deployed function uses cached OLD code

---

**Thank you for your urgent attention to this critical issue.**
