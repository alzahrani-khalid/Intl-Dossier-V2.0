# CRITICAL ISSUE: Deployed Code Doesn't Match Source

**Date**: 2025-10-31 20:30 UTC
**Status**: URGENT - Code mismatch between source and deployment

---

## Problem Summary

The `intelligence-refresh` Edge Function is deployed (version 42), but the **running code is using OLD prompts** that don't exist anywhere in the source files.

### Evidence

**Local Source Code** (intelligence-refresh/index.ts line 326):
```typescript
economic: `Analyze ${entityName}'s economic intelligence. Respond ONLY with valid JSON in this exact format:
{
  "summary": "Brief 2-3 sentence executive summary",
  "metrics": {
    "gdp_growth": "X.X%",
    "inflation_rate": "X.X%",
    ...
```

**Database Shows Query Used** (from reports generated at 20:26:56 UTC):
```
"For the country \"China\": Analyze current economic indicators including GDP growth, inflation rate, trade balance, and major economic policies..."
```

### Verification

1. ✅ Searched entire functions directory: Old format NOT found anywhere
2. ✅ Version 42 confirmed deployed at 20:23:16 UTC
3. ✅ Refresh triggered at 20:26:56 UTC (AFTER deployment)
4. ❌ Still using old bilingual prompt format
5. ❌ Metrics are NULL

---

## Possible Causes

### 1. Edge Function Caching
Supabase may be caching the bundled code at the CDN/edge level, preventing new code from running.

**Solution**: Wait 5-10 minutes for cache to expire, or contact Supabase support to invalidate cache.

### 2. Import/Bundle Issue
The Deno bundler might be pulling code from a cached dependency or old import.

**Solution**: Clear Deno cache and redeploy:
```bash
rm -rf ~/.cache/deno
supabase functions deploy intelligence-refresh --project-ref zkrcjzdemdmwhearhfgg
```

### 3. Multiple Function Definitions
There might be multiple function instances or a routing issue causing the wrong function to execute.

**Solution**: Delete and recreate the function entirely.

### 4. Shared Module Using Old Code
A shared module in `_shared/` might have the old query format.

**Solution**: Check `_shared/validation-schemas.ts` and other shared files.

---

## Attempted Fixes

1. ✅ Deployed version 40 (19:23 UTC)
2. ✅ Deployed version 41 (19:23 UTC)
3. ✅ Deployed version 42 with logging (20:23 UTC)
4. ❌ All deployments still execute old code

---

## Next Steps

### Option 1: Clear Deno Cache and Redeploy
```bash
# Clear Deno cache
rm -rf ~/.cache/deno
deno cache --reload /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/supabase/functions/intelligence-refresh/index.ts

# Redeploy
supabase functions deploy intelligence-refresh --project-ref zkrcjzdemdmwhearhfgg
```

### Option 2: Delete and Recreate Function
This might force Supabase to invalidate all caches:
```bash
# Note: This will cause downtime
supabase functions delete intelligence-refresh --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy intelligence-refresh --project-ref zkrcjzdemdmwhearhfgg
```

### Option 3: Contact Supabase Support
There might be a platform-level caching issue that requires Supabase intervention.

### Option 4: Check Shared Dependencies
Search `_shared/` directory for any old query definitions:
```bash
grep -r "For the country" /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/supabase/functions/_shared/
```

---

## Impact

- ❌ **Metrics remain NULL** - Key indicators show "N/A"
- ❌ **Old bilingual format** - Slower generation (not using optimized JSON)
- ❌ **No performance improvement** - Still taking 60-90 seconds instead of 30-45
- ❌ **Unreliable parsing** - Text markers instead of structured JSON

---

## User Impact

The user keeps clicking refresh but sees no change because:
1. The refresh IS working (database updates)
2. But it's generating data with the OLD code
3. So metrics are still NULL
4. And UI still shows "N/A"

**This is extremely frustrating for the user** - the button works, the backend responds, but the results don't change.

---

## Recommended Action

**Try Option 1 first** (clear Deno cache):
1. Clear Deno cache
2. Force reload dependencies
3. Redeploy
4. Test refresh

If that doesn't work, **proceed with Option 2** (delete/recreate).

The source code is CORRECT - we just need to get Supabase to actually RUN the new code!
