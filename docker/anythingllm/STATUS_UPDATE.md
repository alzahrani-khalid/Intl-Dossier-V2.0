# Intelligence Generation - Status Update

**Date**: 2025-10-31
**Time**: Latest check
**Status**: 🟡 **INVESTIGATING DISCREPANCY**

## Current Situation

### Frontend Behavior ✅
The frontend shows successful mutation:
```javascript
[Intelligence] Auto-generation triggered successfully: {
  success: true,
  data: {...},
  message_en: 'Intelligence refresh completed successfully',
  message_ar: 'تم إكمال تحديث المعلومات الاستخباراتية بنجاح'
}
```

### Backend Reality ❌
- **Edge Function Logs**: NO `intelligence-refresh` calls logged
- **Database**: Empty - no intelligence records for Saudi Arabia (entity_id: `41c7fb7b-1e69-4381-8310-04b6e74d0551`)
- **Only Logs**: `intelligence-batch-update` 401 errors from hours ago

## Possible Causes

### 1. Mock/Cached Response
**Probability**: HIGH 🔴

The success message "Intelligence refresh completed successfully" doesn't match the Edge Function's actual response format. The Edge Function returns:
- `message_en`: "Intelligence refresh initiated successfully" (not "completed")
- `data.status`: "initiated" | "in_progress" (not "completed")
- `data.refresh_id`: UUID

**What to Check**:
- Service worker intercepting requests
- MSW (Mock Service Worker) registered
- Cached API response being returned
- Dev environment using mock data

### 2. Network Request Not Sent
**Probability**: MEDIUM 🟡

The mutation might be failing silently before the fetch call.

**What to Check**:
- Browser Network tab for POST to `/intelligence-refresh`
- Request payload and headers
- Response status and body

### 3. Wrong API Endpoint
**Probability**: LOW 🟢

The frontend might be calling a different endpoint than expected.

**What to Check**:
- Verify `FUNCTIONS_URL` in `intelligence-api.ts`
- Check for environment variable overrides

## Verification Steps

### Step 1: Check Network Tab
1. Open Chrome DevTools → Network tab
2. Filter by "intelligence"
3. Look for POST request to `/functions/v1/intelligence-refresh`
4. Check request payload:
   ```json
   {
     "entity_id": "41c7fb7b-1e69-4381-8310-04b6e74d0551",
     "intelligence_types": ["economic", "political", "security", "bilateral"],
     "force": false,
     "priority": "normal"
   }
   ```

### Step 2: Check Service Worker
Run in browser console:
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

### Step 3: Check for MSW
Run in browser console:
```javascript
console.log('MSW active?', window.msw !== undefined);
```

### Step 4: Verify API URL
Run in browser console:
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Functions URL:', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`);
```

### Step 5: Manual API Test
Get JWT token:
```javascript
(await supabase.auth.getSession()).data.session.access_token
```

Then test with curl:
```bash
curl -X POST 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-refresh' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "entity_id": "41c7fb7b-1e69-4381-8310-04b6e74d0551",
    "intelligence_types": ["economic"],
    "force": false,
    "priority": "normal"
  }' \
  -v
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "refresh_id": "uuid-here",
    "status": "initiated",
    "entity_id": "41c7fb7b-1e69-4381-8310-04b6e74d0551",
    "intelligence_types": ["economic"],
    "triggered_by": "user-id",
    "triggered_at": "2025-10-31T...",
    "estimated_completion": "2025-10-31T..."
  },
  "message_en": "Intelligence refresh initiated successfully",
  "message_ar": "تم بدء تحديث المعلومات الاستخباراتية بنجاح"
}
```

## What's Confirmed Working ✅

1. ✅ AnythingLLM workspace configured correctly
2. ✅ Test script validates bilingual responses work
3. ✅ Edge Function deployed successfully
4. ✅ Frontend mutation hook executes
5. ✅ User authentication valid (no auth errors)

## What's NOT Working ❌

1. ❌ Edge Function not receiving POST requests
2. ❌ No database records being created
3. ❌ Success message doesn't match Edge Function response format

## Next Actions

**PRIORITY 1**: Check browser Network tab for POST to `/intelligence-refresh`
- If NO request: Issue is in frontend API call (mock, service worker, or wrong URL)
- If 404: Edge Function not deployed or wrong endpoint
- If 401: Authentication issue
- If 500: Check Edge Function logs for error details

**PRIORITY 2**: Verify no mocking/caching
- Check for service workers
- Check for MSW
- Clear browser cache and reload

**PRIORITY 3**: Manual API test with curl
- Get real JWT token from browser
- Test Edge Function directly
- Verify AnythingLLM is called
- Check database for new records

## Files to Review

1. `frontend/src/services/intelligence-api.ts:244` - API call implementation
2. `frontend/src/hooks/useIntelligence.ts:300` - Mutation hook
3. `frontend/src/components/intelligence/IntelligenceTabContent.tsx:85` - Component triggering mutation
4. `supabase/functions/intelligence-refresh/index.ts` - Edge Function

## Environment Variables to Check

```env
# Frontend (.env or .env.local)
VITE_SUPABASE_URL=https://zkrcjzdemdmwhearhfgg.supabase.co
VITE_SUPABASE_ANON_KEY=...

# Supabase Edge Function Secrets
ANYTHINGLLM_API_KEY=T70PG8S-WRD4EXH-KEVN4ZB-WM1SEG2
ANYTHINGLLM_WORKSPACE_SLUG=country-intelligence
```

## Summary

The frontend **thinks** the API call succeeded, but the backend **never received it**. This strongly suggests:
1. A mock/service worker is intercepting the request
2. The response is cached and not actually hitting the network
3. The API URL is incorrect or pointing to a mock endpoint

**Action Required**: Check browser Network tab to see if POST request to `/intelligence-refresh` is actually being made.
