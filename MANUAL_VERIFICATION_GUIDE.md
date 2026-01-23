# Manual Verification Guide - Subtask 2-1

## Objective
Test authentication with valid organization membership to verify that `req.user.organization_id` is resolved correctly from the database (not using the old hardcoded default value).

## Prerequisites
1. Backend server must be running
2. Valid test user credentials with organization membership
3. HTTP client (curl, Postman, or browser)

## Test User Credentials
- Email: kazahrani@stats.gov.sa
- Password: itisme

## Verification Steps

### Step 1: Start Backend Server
```bash
cd backend
pnpm dev
# or
npm run dev
```

Wait for server to start on port 3001

### Step 2: Obtain Authentication Token

Use Supabase Auth to get a valid JWT token:

**Option A: Using curl with Supabase Auth API**
```bash
curl -X POST 'https://zkrcjzdemdmwhearhfgg.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kazahrani@stats.gov.sa",
    "password": "itisme"
  }'
```

**Option B: Using the frontend application**
1. Login to the frontend application
2. Open browser DevTools > Application > Local Storage
3. Find the Supabase session token

### Step 3: Make Authenticated Request

```bash
curl -X GET http://localhost:3001/api/ai/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v
```

### Step 4: Verify Response

**Expected Behavior:**
1. ✅ Response status: 200 OK
2. ✅ Response includes user information
3. ✅ `req.user.organization_id` is set to the user's actual organization ID
4. ✅ The organization ID is NOT the old hardcoded value: `4d931519-07f6-4568-8043-7af6fde581a6`

**Check Backend Logs:**
Look for log entry:
```
Supabase user authenticated {
  userId: '...',
  email: 'kazahrani@stats.gov.sa',
  role: '...',
  organizationId: '<actual-org-id-from-database>'
}
```

### Step 5: Verify Organization Resolution

Check that the organization ID in the logs matches the user's actual organization from the database:

```sql
-- Query to verify user's organization membership
SELECT
  om.organization_id,
  o.name as organization_name,
  u.default_organization_id
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
JOIN users u ON u.id = om.user_id
WHERE om.user_id = '<user-id>'
  AND om.left_at IS NULL
ORDER BY om.joined_at ASC;
```

## Code Changes Verified

The following changes were implemented in `backend/src/middleware/supabase-auth.ts`:

1. **Added `resolveUserOrganization()` helper function** (lines 39-102)
   - Queries `organization_members` table for active memberships
   - Returns user's `default_organization_id` if set and valid
   - Falls back to first joined organization
   - Returns `null` if user has no memberships

2. **Removed hardcoded `DEFAULT_ORGANIZATION_ID`**
   - Constant completely removed from file
   - No fallback to hardcoded organization ID

3. **Updated `supabaseAuth` middleware** (lines 108-228)
   - Calls `resolveUserOrganization()` for both profile-found and profile-missing cases
   - Returns 403 Forbidden if user has no organization membership
   - Sets `req.user.organization_id` to resolved value only

4. **Updated `optionalSupabaseAuth` middleware** (lines 233-312)
   - Also uses `resolveUserOrganization()`
   - Continues without auth if user has no organization (graceful fallback)

## Success Criteria

- [ ] Backend server starts without errors
- [ ] Authentication request returns 200 OK
- [ ] `req.user.organization_id` matches user's actual organization
- [ ] Organization ID is NOT `4d931519-07f6-4568-8043-7af6fde581a6`
- [ ] Backend logs show "Supabase user authenticated" with correct organizationId
- [ ] No errors in backend console during authentication

## Notes

This verification confirms that the multi-tenancy security fix is working correctly. Users can only access resources within their assigned organization, and there is no hardcoded fallback that could bypass tenant isolation.

## Status
✅ Code review completed - changes implemented correctly
⏳ Awaiting manual runtime verification
