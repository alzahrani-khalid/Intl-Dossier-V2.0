# Debugging Auto-Generation Issue

**Date**: 2025-10-31
**Feature**: 029-dynamic-country-intelligence
**Status**: 🔍 **INVESTIGATING**

## Problem Statement

The frontend console shows `[Intelligence] No data found, triggering auto-generation...` but NO POST request to `/intelligence-refresh` is being made. Only GET requests to `/intelligence-get` (404s) are visible in the network tab.

## Root Cause Analysis

### Confirmed Working ✅
1. ✅ AnythingLLM workspace configured correctly with chat mode and bilingual prompt
2. ✅ Test script confirms bilingual responses work: `✅ Found [ENGLISH] marker` and `✅ Found [ARABIC] marker`
3. ✅ Edge Function deployed with correct workspace slug (`country-intelligence`) and chat mode
4. ✅ Database cleared of old placeholder data
5. ✅ useEffect hook triggering (console log at line 78 appears)

### Suspected Issue 🔍
**Authentication Failure**: The `refreshIntelligence` API function (`frontend/src/services/intelligence-api.ts` line 238-269) calls `getAuthToken()` at line 242 **before** making the API call.

```typescript
export async function refreshIntelligence(
  params: RefreshIntelligenceParams
): Promise<RefreshIntelligenceResponse> {
  try {
    const token = await getAuthToken(); // 👈 This might be failing silently

    const response = await fetch(`${FUNCTIONS_URL}/intelligence-refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    // ...
  } catch (error) {
    // Error handling wraps authentication failures
    if (error instanceof Error && 'status' in error) {
      throw error as IntelligenceAPIError;
    }

    const apiError = new Error('Failed to refresh intelligence data') as IntelligenceAPIError;
    apiError.status = 500;
    apiError.code = 'REFRESH_ERROR';
    throw apiError;
  }
}
```

**Why This Causes Silent Failure**:
1. `getAuthToken()` throws if session is invalid: `throw new Error('Authentication required. Please log in.');`
2. The mutation's `onError` handler in `useRefreshIntelligence` hook (line 367-403) shows a toast but doesn't log to console
3. The component's useEffect doesn't have error logging for the mutation call

### Changes Made 🔧

**File**: `frontend/src/components/intelligence/IntelligenceTabContent.tsx`

Added detailed logging to capture mutation errors:

```typescript
refreshMutation.mutate(
  {
    entity_id: dossierId,
    intelligence_types: ['economic', 'political', 'security', 'bilateral'],
    force: false,
    priority: 'normal',
  },
  {
    onSuccess: (data) => {
      console.log('[Intelligence] Auto-generation triggered successfully:', data);
    },
    onError: (error) => {
      console.error('[Intelligence] Auto-generation failed:', error);
      console.error('[Intelligence] Error details:', {
        status: error.status,
        code: error.code,
        message: error.message,
      });
    },
  }
);
```

Also logging mutation state before the call:
```typescript
console.log('[Intelligence] Mutation state:', {
  isPending: refreshMutation.isPending,
  isError: refreshMutation.isError,
  error: refreshMutation.error,
});
```

## Testing Steps

### 1. Check Browser Console for New Logs

After refreshing the Saudi Arabia dossier Intelligence tab, check for:

**Expected if authentication is failing**:
```
[Intelligence] No data found, triggering auto-generation...
[Intelligence] Mutation state: { isPending: false, isError: false, error: null }
[Intelligence] Auto-generation failed: Error: Authentication required. Please log in.
[Intelligence] Error details: { status: undefined, code: undefined, message: "Authentication required. Please log in." }
```

**Expected if authentication succeeds**:
```
[Intelligence] No data found, triggering auto-generation...
[Intelligence] Mutation state: { isPending: false, isError: false, error: null }
[Intelligence] Auto-generation triggered successfully: { success: true, data: {...}, message_en: "..." }
```

### 2. Verify User Session

Check if the user is properly authenticated:

```javascript
// Run in browser console
await supabase.auth.getSession()
```

**Expected**:
```json
{
  "data": {
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "...",
        "email": "kazahrani@stats.gov.sa"
      }
    }
  },
  "error": null
}
```

If `session` is `null`, the user needs to log in again.

### 3. Test with Chrome DevTools Network Tab

With the new logging, if authentication succeeds, you should see:
1. POST request to `/functions/v1/intelligence-refresh`
2. Authorization header with Bearer token
3. Request body with entity_id and intelligence_types

If authentication fails, you'll see:
1. NO network request (because the call is aborted before fetch)
2. Console error with authentication message

## Potential Solutions

### Solution 1: Fix Session Refresh (If Session Expired)

If the user's session has expired, they need to log in again:

```typescript
// In frontend, ensure session is refreshed
const { data: { session }, error } = await supabase.auth.refreshSession();
```

### Solution 2: Add Better Error Handling in Component

If errors are being swallowed, add a global error boundary or mutation error state:

```typescript
const refreshMutation = useRefreshIntelligence({
  onError: (error) => {
    console.error('[Intelligence] Mutation error:', error);
    // Show user-friendly message
    toast.error(`Failed to generate intelligence: ${error.message}`);
  },
});
```

### Solution 3: Fallback to Manual Refresh Button

If auto-generation continues to fail, provide a manual refresh button:

```tsx
{refreshMutation.isError && (
  <Alert variant="destructive">
    <AlertTitle>Auto-generation failed</AlertTitle>
    <AlertDescription>
      {refreshMutation.error?.message || 'Unknown error'}
      <Button onClick={() => refreshMutation.reset()}>Try Again</Button>
    </AlertDescription>
  </Alert>
)}
```

## Next Steps

1. **Reload the Saudi Arabia dossier Intelligence tab** and check browser console for new error logs
2. **Verify user session** is valid
3. **Check network tab** for POST request to `/intelligence-refresh`
4. Based on the error logs, implement the appropriate solution

## Files Modified

- ✅ `frontend/src/components/intelligence/IntelligenceTabContent.tsx` - Added detailed error logging

## References

- **API Service**: `frontend/src/services/intelligence-api.ts` (line 238-269 `refreshIntelligence`)
- **Hook**: `frontend/src/hooks/useIntelligence.ts` (line 290-408 `useRefreshIntelligence`)
- **Component**: `frontend/src/components/intelligence/IntelligenceTabContent.tsx` (line 60-109 useEffect)
- **Edge Function**: `supabase/functions/intelligence-refresh/index.ts`
