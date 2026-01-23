# Security Test - Authentication Without Organization Membership (Subtask 2-2)

## Objective
Verify that users without organization membership are properly rejected with a 403 Forbidden response and appropriate error message. This confirms the multi-tenancy security fix prevents unauthorized access.

## Prerequisites
1. Access to Supabase Dashboard (https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg)
2. Backend server running locally
3. HTTP client (curl, Postman, or browser)

## Test Setup

### Step 1: Create Test User Without Organization Membership

**Option A: Using Supabase Dashboard (Recommended)**
1. Navigate to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Fill in details:
   - Email: `test-no-org@example.com`
   - Password: `TestPassword123!`
   - Auto confirm user: ✅ (checked)
4. Click "Create user"
5. **CRITICAL**: Do NOT add this user to `organization_members` table
6. **CRITICAL**: Do NOT add this user to `users` table (or ensure `is_active = false` if added)

**Option B: Using SQL**
```sql
-- This will create auth user only, without organization membership
-- Run in Supabase SQL Editor
SELECT auth.signup(
  email := 'test-no-org@example.com',
  password := 'TestPassword123!'
);

-- Verify user exists in auth but NOT in organization_members
SELECT
  au.id,
  au.email,
  CASE
    WHEN om.user_id IS NULL THEN 'No organization membership ✅'
    ELSE 'Has organization membership ❌'
  END as membership_status
FROM auth.users au
LEFT JOIN organization_members om ON om.user_id = au.id AND om.left_at IS NULL
WHERE au.email = 'test-no-org@example.com';
```

Expected result: User should have "No organization membership ✅"

### Step 2: Verify Test User Configuration

Run this query to confirm test user has NO organization membership:

```sql
-- Verify test user has no active organization memberships
SELECT
  au.id as user_id,
  au.email,
  COUNT(om.organization_id) as active_memberships
FROM auth.users au
LEFT JOIN organization_members om ON om.user_id = au.id AND om.left_at IS NULL
WHERE au.email = 'test-no-org@example.com'
GROUP BY au.id, au.email;
```

**Expected Output:**
- `active_memberships`: 0

If `active_memberships > 0`, delete the membership:
```sql
DELETE FROM organization_members
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-no-org@example.com');
```

## Verification Steps

### Step 3: Start Backend Server
```bash
cd backend
pnpm dev
```

Wait for server to start on port 3001

### Step 4: Obtain Authentication Token for Test User

```bash
curl -X POST 'https://zkrcjzdemdmwhearhfgg.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-no-org@example.com",
    "password": "TestPassword123!"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {
    "id": "...",
    "email": "test-no-org@example.com"
  }
}
```

Copy the `access_token` value for the next step.

### Step 5: Attempt Authenticated Request

```bash
curl -X GET http://localhost:3001/api/ai/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v
```

Replace `YOUR_JWT_TOKEN` with the token from Step 4.

### Step 6: Verify Security Response

**Expected Behavior (CRITICAL):**

✅ **Status Code**: `403 Forbidden`

✅ **Response Body**:
```json
{
  "error": "Forbidden",
  "message": "User is not a member of any organization"
}
```

✅ **Backend Logs** should show:
```
Security: User has no organization membership {
  userId: '...',
  email: 'test-no-org@example.com'
}
```

**❌ FAILURE Indicators:**
- Status code is 200 OK (security bypass - user should be blocked!)
- Status code is 500 (server error - middleware not working)
- No security log entry (logging not working)
- User gets access to resources (multi-tenancy bypass!)

### Step 7: Test Optional Auth Middleware (Edge Case)

Some routes use `optionalSupabaseAuth` which should handle missing organization gracefully:

```bash
# Test route with optional auth (if available)
curl -X GET http://localhost:3001/api/public-route \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v
```

**Expected Behavior for Optional Auth:**
- ✅ Request continues without authentication
- ✅ `req.user` is undefined or not populated
- ✅ Backend logs show informational warning (not error):
  ```
  Optional auth: User has no organization membership, continuing without auth {
    userId: '...',
    email: 'test-no-org@example.com'
  }
  ```

## Code Implementation Verified

The security fix is implemented in `backend/src/middleware/supabase-auth.ts`:

### 1. `supabaseAuth` middleware (lines 108-228)
```typescript
// Resolve user's organization from memberships
const organizationId = await resolveUserOrganization(userProfile.id)

if (!organizationId) {
  logger.warn('Security: User has no organization membership', {
    userId: userProfile.id,
    email: userProfile.email,
  })
  res.status(403).json({
    error: 'Forbidden',
    message: 'User is not a member of any organization',
  })
  return
}
```

### 2. `optionalSupabaseAuth` middleware (lines 233-312)
```typescript
const organizationId = await resolveUserOrganization(userProfile.id)

if (!organizationId) {
  logger.warn('Optional auth: User has no organization membership, continuing without auth', {
    userId: userProfile.id,
    email: userProfile.email,
  })
  return next() // Continue without auth if no organization
}
```

## Success Criteria

- [x] Test user created in Supabase Auth
- [ ] Test user has ZERO organization memberships (verified via SQL)
- [ ] Backend server starts successfully
- [ ] Authentication request returns **403 Forbidden**
- [ ] Response message is "User is not a member of any organization"
- [ ] Backend logs show security warning
- [ ] Request does NOT get access to protected resources
- [ ] No server errors or crashes

## Cleanup (After Testing)

Delete the test user to keep database clean:

```sql
-- Delete from auth.users (cascades to auth-related tables)
DELETE FROM auth.users
WHERE email = 'test-no-org@example.com';
```

## Security Implications

This test verifies that:
1. ✅ The hardcoded `DEFAULT_ORGANIZATION_ID` bypass is eliminated
2. ✅ Multi-tenancy isolation is enforced at the authentication layer
3. ✅ Users cannot access resources without proper organization membership
4. ✅ Security logging tracks unauthorized access attempts
5. ✅ Error messages are clear but don't leak sensitive information

## Status
✅ Code implementation verified
⏳ Awaiting manual runtime testing
⏳ Awaiting confirmation of 403 Forbidden response

---

**Related Files:**
- Implementation: `backend/src/middleware/supabase-auth.ts`
- Spec: `.auto-claude/specs/014-medium-hardcoded-default-organization-id-bypasses-/spec.md`
- Plan: `.auto-claude/specs/014-medium-hardcoded-default-organization-id-bypasses-/implementation_plan.json`
