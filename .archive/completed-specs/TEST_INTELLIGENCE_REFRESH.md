# Intelligence Refresh - Test Instructions

**Issue**: Refresh button spins but doesn't trigger API call
**Status**: Investigating frontend issue

---

## Immediate Action Required

The refresh button is **not sending API requests** to the server. The Edge Function logs show no `intelligence-refresh` calls.

### Step 1: Check Browser Console for Errors

1. **Open Developer Tools**: Press `F12` or right-click → Inspect
2. **Go to Console tab**
3. **Clear console**: Click the 🚫 icon
4. **Click refresh button** on Economic Intelligence card
5. **Look for RED error messages**

Common errors to look for:

- `TypeError: Cannot read property...`
- `Network request failed`
- `Unauthorized` or `401`
- `CORS error`
- React Query errors

### Step 2: Check Network Tab

1. **Go to Network tab** in DevTools
2. **Clear network log**: Click 🚫 icon
3. **Click refresh button**
4. **Look for**:
   - `intelligence-refresh` request (should appear)
   - Status code (should be 200 or show error)
   - Response payload

If NO `intelligence-refresh` request appears, the frontend code isn't making the API call.

---

## Likely Causes

### 1. React Query Hook Issue

**File**: `frontend/src/hooks/useIntelligence.ts`

The `useRefreshIntelligence` hook might not be configured correctly or has an error.

### 2. Button Click Handler Not Wired

**File**: `frontend/src/components/intelligence/RefreshButton.tsx` or individual cards

The refresh button's `onClick` might not be calling the mutation.

### 3. Authentication Error

The user token might be expired or missing, causing the request to fail before sending.

---

## Manual Test (Bypass Frontend)

To verify the Edge Function works, you can test it directly using curl:

```bash
# Get your auth token from browser
# 1. Open DevTools → Application → Local Storage → supabase.auth.token
# 2. Copy the access_token value

curl -X POST "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-refresh" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "038693e5-fd97-4d8e-8a03-6d30d29a3c1e",
    "intelligence_types": ["economic"],
    "priority": "normal"
  }'
```

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "refresh_id": "...",
    "status": "completed",
    "entity_id": "038693e5-fd97-4d8e-8a03-6d30d29a3c1e",
    "intelligence_types": ["economic"],
    ...
  },
  "message_en": "Intelligence refresh completed successfully"
}
```

If this works, the Edge Function is fine and the problem is in the frontend.

---

## Code Files to Check

### Frontend Hook

**File**: `frontend/src/hooks/useIntelligence.ts`

Check the `useRefreshIntelligence` mutation:

```typescript
export function useRefreshIntelligence() {
  return useMutation({
    mutationFn: (params: RefreshIntelligenceParams) => refreshIntelligence(params),
    // ... error handlers
  });
}
```

### API Service

**File**: `frontend/src/services/intelligence-api.ts`

Check the `refreshIntelligence` function:

```typescript
export async function refreshIntelligence(
  params: RefreshIntelligenceParams
): Promise<RefreshIntelligenceResponse> {
  const response = await fetch(`${FUNCTIONS_URL}/intelligence-refresh`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  // ...
}
```

### Refresh Button Component

**File**: `frontend/src/components/intelligence/RefreshButton.tsx`

Check if `onRefresh` callback is being called.

---

## What We Know

✅ **Edge Function Deployed**: Version 41 with structured JSON prompts
✅ **Database Schema**: Has `metrics` column
✅ **API Response**: Includes `metrics` field (v11 of intelligence-get)
❌ **Frontend Refresh**: Not sending API requests to server

**Next Step**: Check browser console for JavaScript errors preventing the mutation from firing.

---

## Temporary Workaround

If you can provide your access token, I can manually trigger the refresh via curl to verify the backend works and generate metrics.

To get your token:

1. Open DevTools (F12)
2. Go to **Application** tab
3. **Local Storage** → `https://zkrcjzdemdmwhearhfgg.supabase.co`
4. Look for `sb-zkrcjzdemdmwhearhfgg-auth-token`
5. Copy the `access_token` value

**DO NOT share the token publicly** - you can just confirm if manual curl works on your end.
