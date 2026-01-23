# Troubleshooting & Debugging Guide

## Overview

This guide provides comprehensive troubleshooting solutions for common issues encountered in the GASTAT International Dossier System. Given the complex tech stack (React 19, TypeScript, Supabase, TanStack Query, Real-time subscriptions, i18n with RTL support), this guide accelerates issue resolution and reduces debugging time.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Docker & Infrastructure Issues](#docker--infrastructure-issues)
3. [Database & Supabase Issues](#database--supabase-issues)
4. [Authentication & Authorization Issues](#authentication--authorization-issues)
5. [Frontend & React Issues](#frontend--react-issues)
6. [TanStack Query Issues](#tanstack-query-issues)
7. [Real-time Subscription Issues](#real-time-subscription-issues)
8. [Internationalization & RTL Issues](#internationalization--rtl-issues)
9. [API & Network Issues](#api--network-issues)
10. [Performance & Optimization Issues](#performance--optimization-issues)
11. [Build & Deployment Issues](#build--deployment-issues)
12. [Debugging Tools & Techniques](#debugging-tools--techniques)
13. [Common Error Messages](#common-error-messages)
14. [FAQ](#faq)
15. [Getting Help](#getting-help)

## Quick Diagnostics

### System Health Check

```bash
# Check all Docker containers are running
docker ps --filter "name=intl-dossier"

# Check application logs
pnpm logs

# Verify database connection
docker exec -it intl-dossier-postgres psql -U postgres -c "SELECT version();"

# Test Redis connection
docker exec -it intl-dossier-redis redis-cli ping

# Check frontend dev server
curl http://localhost:5173

# Check backend API
curl http://localhost:4000/health
```

### Environment Validation

```bash
# Verify all required environment variables are set
grep -E "^[A-Z_]+=.+" .env | cut -d= -f1 | sort

# Check Node.js version (requires 18+ LTS)
node --version

# Check pnpm version
pnpm --version

# Verify TypeScript version (requires 5.8+)
pnpm tsc --version
```

## Docker & Infrastructure Issues

### Port Already in Use

**Symptoms:**
- Error: `bind: address already in use`
- Container fails to start

**Solution:**

```bash
# Find what's using the port (e.g., PostgreSQL on 54322)
lsof -i :54322

# Kill the process
kill -9 <PID>

# Or change the port in docker-compose.yml
# ports:
#   - "54323:5432"  # Use different host port
```

### Container Keeps Restarting

**Symptoms:**
- Container status shows "Restarting"
- Services unavailable

**Solution:**

```bash
# Check container logs
docker logs intl-dossier-<service> --tail 100

# Check container health status
docker inspect intl-dossier-<service> | grep -A 10 Health

# Check resource usage
docker stats intl-dossier-<service>

# Restart container
docker compose restart <service>
```

### Volume Permission Issues

**Symptoms:**
- Permission denied errors in logs
- Database won't start

**Solution:**

```bash
# Fix volume permissions
docker compose down
sudo chown -R $USER:$USER ./volumes/

# Reset volumes (WARNING: deletes data)
docker compose down --volumes
docker compose up -d
```

### Network Connectivity Issues

**Symptoms:**
- Services can't reach each other
- DNS resolution fails

**Solution:**

```bash
# Inspect network
docker network inspect intl-dossier_default

# Recreate network
docker compose down
docker network prune
docker compose up -d

# Test connectivity between containers
docker exec intl-dossier-frontend ping intl-dossier-postgres
```

## Database & Supabase Issues

### Connection Refused

**Symptoms:**
- `ECONNREFUSED` errors
- Application can't connect to database

**Solution:**

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Verify connection string in .env
# DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Test connection from host
psql postgresql://postgres:postgres@localhost:54322/postgres

# Check PostgreSQL logs
docker logs intl-dossier-postgres --tail 50
```

### Migration Failures

**Symptoms:**
- Migrations fail to apply
- Schema version mismatch

**Solution:**

```bash
# Check current migration status
pnpm db:status

# Rollback last migration
pnpm db:rollback

# Re-run migrations
pnpm db:migrate

# Reset database (development only)
pnpm db:reset

# View migration history
psql $DATABASE_URL -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
```

### Supabase RLS 403 Errors (Row-Level Security)

Row-Level Security (RLS) is Supabase's primary authorization mechanism. 403 errors indicate permission denied, often due to RLS policies blocking access. This section provides comprehensive troubleshooting for all RLS-related issues.

#### Understanding 403 Permission Denied

**HTTP Status:** `403 Forbidden`

**Common Error Messages:**
- `new row violates row-level security policy`
- `permission denied for table <table_name>`
- `PERMISSION_DENIED` error code in API responses
- Data queries return empty results despite data existing

**Error Structure:**

The application uses structured permission errors (see `frontend/src/types/permission-error.types.ts`):

```typescript
interface PermissionDeniedError {
  status: 403
  code: 'PERMISSION_DENIED'
  requiredPermission: 'read' | 'write' | 'delete' | 'approve' | 'publish' | 'assign' | 'manage' | 'admin'
  resourceType: 'dossier' | 'country' | 'organization' | 'mou' | 'event' | 'forum' | etc.
  resourceId?: string
  currentRole: 'admin' | 'manager' | 'staff' | 'viewer'
  requiredRole?: 'admin' | 'manager' | 'staff' | 'viewer'
  reason: PermissionDeniedReason
  accessGranters: AccessGranter[]
  suggestedActions: PermissionAction[]
}
```

#### Symptoms & Root Causes

##### 1. Insufficient Role (`insufficient_role`)

**Symptoms:**
- User has lower role than required (e.g., `viewer` trying to edit)
- Frontend displays "Permission Denied" dialog
- 403 on INSERT/UPDATE/DELETE operations

**Root Cause:**
RLS policy requires higher role than user's current role

**Debugging:**

```bash
# 1. Check user's current role
psql $DATABASE_URL -c "
SELECT id, email, role
FROM auth.users
WHERE id = 'user-uuid';
"

# 2. Check RLS policy role requirements
psql $DATABASE_URL -c "
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'dossiers'
  AND (qual::text LIKE '%role%' OR with_check::text LIKE '%role%');
"

# 3. Verify role in JWT claims
# In browser console:
supabase.auth.getUser().then(({ data }) => {
  console.log('User role:', data.user?.user_metadata?.role)
})
```

**Solution:**

```sql
-- Option 1: Adjust policy to allow user's role
CREATE POLICY "staff_can_read_dossiers"
ON dossiers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND user_metadata->>'role' IN ('staff', 'manager', 'admin')
  )
);

-- Option 2: Upgrade user's role (admin only)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{role}',
  '"manager"'
)
WHERE id = 'user-uuid';
```

##### 2. Resource Restricted (`resource_restricted`)

**Symptoms:**
- User can access some resources but not others
- 403 on specific dossiers/documents
- "Access denied to this resource" message

**Root Cause:**
Resource has specific access restrictions (e.g., only assigned users can view)

**Debugging:**

```bash
# Check resource assignments
psql $DATABASE_URL -c "
SELECT d.id, d.title, da.user_id, u.email
FROM dossiers d
LEFT JOIN dossier_assignments da ON d.id = da.dossier_id
WHERE d.id = 'resource-uuid';
"

# Check if RLS policy requires assignment
psql $DATABASE_URL -c "
SELECT policyname, qual::text
FROM pg_policies
WHERE tablename = 'dossiers'
  AND qual::text LIKE '%assignment%';
"
```

**Solution:**

```sql
-- Assign user to resource
INSERT INTO dossier_assignments (dossier_id, user_id, role)
VALUES ('dossier-uuid', 'user-uuid', 'editor')
ON CONFLICT (dossier_id, user_id) DO UPDATE
SET role = EXCLUDED.role;

-- Or create policy that checks assignments
CREATE POLICY "users_view_assigned_dossiers"
ON dossiers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM dossier_assignments
    WHERE dossier_id = dossiers.id
    AND user_id = auth.uid()
  )
);
```

##### 3. Not Assigned (`not_assigned`)

**Symptoms:**
- User not in resource's assignment list
- Can't see resource in listings
- 403 when accessing resource directly

**Root Cause:**
Policy requires explicit assignment, user not assigned

**Debugging:**

```typescript
// Check assignments via API
const { data: assignments } = await supabase
  .from('dossier_assignments')
  .select('*')
  .eq('user_id', userId)
  .eq('dossier_id', dossierId)

console.log('User assignments:', assignments)

// Test with service role (bypasses RLS)
const { data: resource } = await supabase
  .from('dossiers')
  .select('*')
  .eq('id', dossierId)
  .limit(1)
  .single()

console.log('Resource exists:', !!resource)
```

**Solution:**

See `resource_restricted` solution above for assignment management.

##### 4. Delegation Expired/Revoked (`delegation_expired`, `delegation_revoked`)

**Symptoms:**
- User previously had access, now denied
- "Your access has expired" message
- Temporary permissions no longer valid

**Root Cause:**
Time-limited delegation expired or was manually revoked

**Debugging:**

```sql
-- Check delegations
SELECT
  id,
  delegator_id,
  delegatee_id,
  resource_type,
  resource_id,
  permissions,
  expires_at,
  revoked_at,
  CASE
    WHEN revoked_at IS NOT NULL THEN 'revoked'
    WHEN expires_at < NOW() THEN 'expired'
    ELSE 'active'
  END as status
FROM permission_delegations
WHERE delegatee_id = 'user-uuid'
  AND resource_id = 'resource-uuid';
```

**Solution:**

```sql
-- Request new delegation (application-specific)
-- User must request access via frontend access request system

-- Or extend delegation (manager/admin only)
UPDATE permission_delegations
SET expires_at = NOW() + INTERVAL '7 days'
WHERE id = 'delegation-uuid'
  AND revoked_at IS NULL;
```

##### 5. Resource Locked (`resource_locked`)

**Symptoms:**
- Read access works, write access denied
- "Resource is locked for editing" message
- 403 only on UPDATE/DELETE

**Root Cause:**
Resource locked by another user or workflow

**Debugging:**

```sql
-- Check resource lock status
SELECT
  id,
  locked_at,
  locked_by_user_id,
  lock_reason,
  u.email as locked_by
FROM dossiers d
LEFT JOIN auth.users u ON d.locked_by_user_id = u.id
WHERE d.id = 'resource-uuid';
```

**Solution:**

```sql
-- Release lock (if you own it or are admin)
UPDATE dossiers
SET locked_at = NULL,
    locked_by_user_id = NULL,
    lock_reason = NULL
WHERE id = 'resource-uuid'
  AND (locked_by_user_id = auth.uid() OR is_admin());

-- Or wait for lock to expire (implementation-specific)
```

##### 6. Workflow State (`workflow_state`)

**Symptoms:**
- Action allowed in some states, denied in others
- "Cannot edit published dossier" message
- 403 when trying to modify completed work

**Root Cause:**
RLS policy enforces workflow state transitions

**Debugging:**

```sql
-- Check resource workflow state
SELECT id, status, workflow_state, published_at
FROM dossiers
WHERE id = 'resource-uuid';

-- Check RLS policy for state restrictions
SELECT policyname, cmd, with_check::text
FROM pg_policies
WHERE tablename = 'dossiers'
  AND with_check::text LIKE '%status%';
```

**Solution:**

```sql
-- Update workflow state (if permitted)
UPDATE dossiers
SET status = 'draft'
WHERE id = 'resource-uuid'
  AND status = 'published'
  AND (
    -- Only managers can unpublish
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND user_metadata->>'role' IN ('manager', 'admin')
    )
  );
```

#### Common RLS Debugging Procedures

##### Procedure 1: Verify Authentication

```bash
# 1. Check user is authenticated
# Browser console:
const { data: { user }, error } = await supabase.auth.getUser()
console.log('Authenticated user:', user)
console.log('Auth error:', error)

# 2. Check JWT token validity
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('Access token expires:', new Date(session?.expires_at * 1000))

# 3. Verify user exists in database
psql $DATABASE_URL -c "
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
WHERE id = 'user-uuid';
"
```

##### Procedure 2: Inspect RLS Policies

```sql
-- List all policies for a table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd, -- SELECT, INSERT, UPDATE, DELETE
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE tablename = 'your_table_name'
ORDER BY cmd, policyname;

-- Check if RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'your_table_name';
```

##### Procedure 3: Test Query Visibility

```typescript
// Test with authenticated user (RLS enforced)
const { data: userView, error: userError } = await supabase
  .from('dossiers')
  .select('id, title')
  .eq('id', resourceId)

console.log('User view:', userView) // May be empty
console.log('User error:', userError)

// Test with service role (RLS bypassed)
// Create service role client
import { createClient } from '@supabase/supabase-js'

const supabaseService = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY // Keep secret!
)

const { data: serviceView } = await supabaseService
  .from('dossiers')
  .select('id, title')
  .eq('id', resourceId)

console.log('Service role view:', serviceView) // Should see all data

// If service role sees data but user doesn't -> RLS policy issue
```

##### Procedure 4: Enable Query Logging

```sql
-- Enable RLS violation logging (PostgreSQL)
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_error_verbosity = 'verbose';
SELECT pg_reload_conf();

-- Check logs for RLS violations
-- In Supabase dashboard: Database > Logs
-- Filter by: "violates row-level security"
```

##### Procedure 5: Test Policy Conditions

```sql
-- Test policy condition directly
-- Replace auth.uid() with actual user ID
SELECT
  *,
  -- Test USING clause
  (auth.uid() = user_id) as passes_using,
  -- Test WITH CHECK clause
  (auth.uid() = user_id AND status = 'draft') as passes_with_check
FROM dossiers
WHERE id = 'resource-uuid';

-- Impersonate user for testing (PostgreSQL)
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = 'user-uuid';

SELECT * FROM dossiers WHERE id = 'resource-uuid';

-- Reset
RESET role;
```

#### Common RLS Policy Patterns

##### Pattern 1: User Owns Resource

```sql
-- Users can only access their own data
CREATE POLICY "users_own_data"
ON table_name FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

##### Pattern 2: Role-Based Access

```sql
-- Different permissions by role
CREATE POLICY "role_based_access"
ON table_name FOR ALL
USING (
  CASE (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid())
    WHEN 'admin' THEN true
    WHEN 'manager' THEN department_id IN (SELECT department_id FROM user_departments WHERE user_id = auth.uid())
    WHEN 'staff' THEN user_id = auth.uid()
    ELSE false
  END
);
```

##### Pattern 3: Assignment-Based Access

```sql
-- Users must be explicitly assigned
CREATE POLICY "assignment_based_access"
ON dossiers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM dossier_assignments
    WHERE dossier_id = dossiers.id
    AND user_id = auth.uid()
  )
);
```

##### Pattern 4: Time-Restricted Access

```sql
-- Access expires after certain date
CREATE POLICY "time_restricted_access"
ON resources FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_access
    WHERE resource_id = resources.id
    AND user_id = auth.uid()
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (revoked_at IS NULL)
  )
);
```

##### Pattern 5: Public + Protected Resources

```sql
-- Some resources public, others require auth
CREATE POLICY "public_or_assigned"
ON dossiers FOR SELECT
USING (
  is_public = true
  OR
  EXISTS (
    SELECT 1 FROM dossier_assignments
    WHERE dossier_id = dossiers.id
    AND user_id = auth.uid()
  )
);
```

#### Frontend Error Handling Integration

When 403 errors occur, the frontend displays structured error messages:

```typescript
// Hook usage example
import { usePermissionError } from '@/hooks/usePermissionError'

function DossierView({ dossierId }) {
  const { error, hasError, requestAccess, clearError } = usePermissionError()

  // Fetch dossier (may throw 403)
  const { data, error: queryError } = useQuery({
    queryKey: ['dossiers', dossierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select('*')
        .eq('id', dossierId)
        .single()

      if (error?.code === 'PGRST301') {
        // RLS violation - set permission error
        setError({
          error: {
            code: 'PERMISSION_DENIED',
            message: 'You do not have permission to view this dossier',
            details: {
              required_permission: 'read',
              resource_type: 'dossier',
              resource_id: dossierId,
              current_role: 'viewer',
              reason: 'not_assigned'
            }
          }
        })
        throw error
      }

      return data
    }
  })

  if (hasError) {
    return (
      <PermissionDeniedDialog
        open={hasError}
        onClose={clearError}
        error={error}
        onRequestAccess={async (granter, reason) => {
          await requestAccess({
            granterId: granter.userId,
            resourceType: 'dossier',
            resourceId: dossierId,
            requestedPermission: 'read',
            reason,
            urgency: 'medium'
          })
        }}
      />
    )
  }

  return <div>{/* Render dossier */}</div>
}
```

#### Quick Fixes Checklist

When encountering 403 errors, check in this order:

1. ✅ **User authenticated?** → Check `supabase.auth.getUser()`
2. ✅ **RLS enabled?** → Check `pg_tables.rowsecurity`
3. ✅ **Policies exist?** → Check `pg_policies` for table
4. ✅ **User has role?** → Check `auth.users.user_metadata.role`
5. ✅ **User assigned?** → Check assignment tables
6. ✅ **Resource locked?** → Check lock status
7. ✅ **Workflow allows?** → Check resource status/state
8. ✅ **Policy syntax correct?** → Test with service role
9. ✅ **auth.uid() returns value?** → Test in policy condition
10. ✅ **JWT claims populated?** → Check session metadata

#### Advanced Debugging

```sql
-- Create helper function to debug RLS
CREATE OR REPLACE FUNCTION debug_rls_access(
  p_table_name text,
  p_resource_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'user_id', p_user_id,
    'user_role', (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = p_user_id),
    'rls_enabled', (SELECT rowsecurity FROM pg_tables WHERE tablename = p_table_name),
    'policies', (
      SELECT jsonb_agg(jsonb_build_object(
        'name', policyname,
        'command', cmd,
        'using', qual::text,
        'with_check', with_check::text
      ))
      FROM pg_policies
      WHERE tablename = p_table_name
    ),
    'assignments', (
      SELECT jsonb_agg(jsonb_build_object(
        'user_id', user_id,
        'role', role,
        'created_at', created_at
      ))
      FROM dossier_assignments
      WHERE dossier_id = p_resource_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Usage
SELECT debug_rls_access('dossiers', 'resource-uuid'::uuid);
```

#### Common Mistakes & Anti-Patterns

❌ **Mistake 1: Missing WITH CHECK clause**

```sql
-- Bad: No WITH CHECK, allows any INSERT
CREATE POLICY "users_select_own" ON table FOR SELECT
USING (user_id = auth.uid());

-- Good: WITH CHECK prevents invalid inserts
CREATE POLICY "users_select_own" ON table FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "users_insert_own" ON table FOR INSERT
WITH CHECK (user_id = auth.uid());
```

❌ **Mistake 2: Using wrong auth function**

```sql
-- Bad: current_user is PostgreSQL role, not Supabase user
USING (user_id = current_user)

-- Good: auth.uid() returns Supabase user ID
USING (user_id = auth.uid())
```

❌ **Mistake 3: Not handling NULL user_id**

```sql
-- Bad: Fails when user not authenticated
USING (user_id = auth.uid())

-- Good: Explicit NULL check
USING (user_id = auth.uid() AND auth.uid() IS NOT NULL)
```

❌ **Mistake 4: Overly complex policies**

```sql
-- Bad: Hard to debug, slow performance
CREATE POLICY "complex" ON table
USING (
  EXISTS (SELECT 1 FROM t1 WHERE ...) OR
  EXISTS (SELECT 1 FROM t2 WHERE ...) OR
  (status = 'public' AND created_at > NOW() - INTERVAL '30 days')
  -- ... 20 more conditions
);

-- Good: Split into multiple policies
CREATE POLICY "public_recent" ON table
USING (status = 'public' AND created_at > NOW() - INTERVAL '30 days');

CREATE POLICY "user_assigned" ON table
USING (EXISTS (SELECT 1 FROM assignments WHERE ...));
```

#### Performance Optimization

```sql
-- Add indexes for policy conditions
CREATE INDEX idx_dossiers_user_id ON dossiers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_assignments_user_dossier ON dossier_assignments(user_id, dossier_id);

-- Use covering indexes for complex policies
CREATE INDEX idx_dossiers_access ON dossiers(id, user_id, status, is_public)
WHERE status IN ('draft', 'published');

-- Monitor slow policies
SELECT
  schemaname,
  tablename,
  policyname,
  pg_stat_user_tables.seq_scan,
  pg_stat_user_tables.idx_scan
FROM pg_policies
JOIN pg_stat_user_tables USING (schemaname, tablename)
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;
```

### Slow Queries

**Symptoms:**
- API requests timeout
- Database CPU high

**Solution:**

```bash
# Enable query logging
# In docker-compose.yml, add:
# command: postgres -c log_statement=all -c log_duration=on

# Identify slow queries
psql $DATABASE_URL -c "
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
"

# Add missing indexes
# Analyze query plan
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM your_table WHERE condition;"

# Create index
psql $DATABASE_URL -c "CREATE INDEX idx_column_name ON table_name(column_name);"
```

## Authentication & Authorization Issues

### Token Refresh Failures

**Symptoms:**
- User logged out unexpectedly
- 401 Unauthorized errors after timeout
- "Failed to refresh access token" in logs
- `TokenRefreshError` or `AuthApiError` exceptions
- Session expires before expected time

**Solution:**

```javascript
// 1. Check token expiry configuration
// In Supabase dashboard: Authentication > Settings
// Access token expiry: 3600 (1 hour recommended)
// Refresh token expiry: 604800 (7 days recommended)

// 2. Verify refresh token handling
// frontend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Refresh token before expiry (5 minutes buffer)
    tokenRefreshMargin: 300
  }
})

// 3. Manual refresh if needed
const { data, error } = await supabase.auth.refreshSession()
if (error) {
  console.error('Token refresh failed:', error.message)
  // Force re-authentication
  await supabase.auth.signOut()
  window.location.href = '/login'
}

// 4. Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully')
  }
  if (event === 'SIGNED_OUT') {
    // Redirect to login
    window.location.href = '/login'
  }
  if (event === 'USER_UPDATED') {
    console.log('User session updated')
  }
})

// 5. Debug token expiry
const session = await supabase.auth.getSession()
if (session.data.session) {
  const expiresAt = session.data.session.expires_at
  const now = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = expiresAt - now
  console.log(`Token expires in ${timeUntilExpiry} seconds`)
}
```

**JWT Token Debugging:**

```bash
# Decode JWT token to inspect claims (requires jq)
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d | jq

# Check token expiry time
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d | jq '.exp' | xargs -I {} date -r {}

# Verify JWT signature (using jwt.io or JWT debugger)
# Paste token at https://jwt.io to inspect header, payload, and verify signature
```

**Common JWT Issues:**

1. **JWT Secret Mismatch**
   ```bash
   # Verify SUPABASE_JWT_SECRET matches Supabase dashboard
   # Settings > API > JWT Settings > JWT Secret
   echo $SUPABASE_JWT_SECRET
   ```

2. **Expired Refresh Token**
   ```javascript
   // Refresh tokens expire after 7 days (default)
   // User must re-authenticate if refresh token is expired
   const { data, error } = await supabase.auth.refreshSession()
   if (error?.message.includes('refresh_token')) {
     // Redirect to login
     await supabase.auth.signOut()
   }
   ```

3. **Clock Skew Issues**
   ```bash
   # Ensure server time is synchronized
   timedatectl status

   # If out of sync, enable NTP
   sudo timedatectl set-ntp true
   ```

4. **Token Storage Issues**
   ```javascript
   // Check if tokens are being stored correctly
   const storageKey = `sb-${SUPABASE_PROJECT_REF}-auth-token`
   const storedSession = localStorage.getItem(storageKey)
   console.log('Stored session:', storedSession ? 'Found' : 'Missing')

   // Clear corrupted session
   if (storedSession && JSON.parse(storedSession).error) {
     localStorage.removeItem(storageKey)
     await supabase.auth.signOut()
   }
   ```

5. **Network Connectivity During Refresh**
   ```javascript
   // Retry logic for token refresh
   async function refreshWithRetry(maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       const { data, error } = await supabase.auth.refreshSession()
       if (!error) return data

       console.warn(`Refresh attempt ${i + 1} failed:`, error.message)
       await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
     }
     throw new Error('Token refresh failed after retries')
   }
   ```

### Session Not Persisting

**Symptoms:**
- User logged out on page refresh
- Session lost in new tab

**Solution:**

```typescript
// Check localStorage for Supabase session
localStorage.getItem('sb-<project-ref>-auth-token')

// Ensure persistSession is enabled
const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    storage: window.localStorage, // or custom storage
  }
})

// Clear corrupted session
localStorage.removeItem('sb-<project-ref>-auth-token')
```

### CORS Errors on Auth

**Symptoms:**
- CORS errors on login/signup
- `Access-Control-Allow-Origin` errors

**Solution:**

```bash
# In Supabase dashboard: Authentication > URL Configuration
# Add allowed URLs:
# - http://localhost:5173
# - https://your-domain.com

# Verify Site URL and Redirect URLs match your application
```

## Frontend & React Issues

### React 19 Hydration Mismatch

**Symptoms:**
- Warning: "Hydration failed"
- Content flashing/flickering
- Mismatched server/client rendering

**Solution:**

```tsx
// 1. Check for browser-only APIs in SSR
// Bad:
const width = window.innerWidth

// Good:
const [width, setWidth] = useState(0)
useEffect(() => {
  setWidth(window.innerWidth)
}, [])

// 2. Use suppressHydrationWarning for dynamic content
<div suppressHydrationWarning>
  {new Date().toLocaleString()}
</div>

// 3. Check for mismatched HTML structure
// Server and client must render identical markup
```

### Component Not Re-rendering

**Symptoms:**
- UI not updating after state change
- Stale data displayed

**Solution:**

```tsx
// 1. Verify state is immutable
// Bad:
data.push(newItem)
setData(data)

// Good:
setData([...data, newItem])

// 2. Check dependency array
useEffect(() => {
  fetchData()
}, [id]) // Include all dependencies

// 3. Use key prop for list items
{items.map(item => (
  <Component key={item.id} {...item} />
))}
```

### Route Not Found (TanStack Router)

**Symptoms:**
- 404 on valid route
- Navigation not working

**Solution:**

```tsx
// 1. Check route definition
// frontend/src/routes/__root.tsx
export const Route = createRootRoute({
  component: RootComponent,
})

// 2. Verify route registration
// frontend/src/main.tsx
const routeTree = rootRoute.addChildren([
  indexRoute,
  // Add your routes here
])

// 3. Check route params
// Use $param for dynamic segments: /dossiers/$dossierId
```

## TanStack Query Issues

### Stale Data Not Updating

**Symptoms:**
- Old data displayed after mutation
- Cache not invalidating

**Solution:**

```typescript
// 1. Invalidate queries after mutation
import { useMutation, useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: updateData,
  onSuccess: () => {
    // Invalidate all queries with key 'dossiers'
    queryClient.invalidateQueries({ queryKey: ['dossiers'] })

    // Or invalidate specific query
    queryClient.invalidateQueries({ queryKey: ['dossiers', id] })
  }
})

// 2. Use optimistic updates
const mutation = useMutation({
  mutationFn: updateDossier,
  onMutate: async (newDossier) => {
    await queryClient.cancelQueries({ queryKey: ['dossiers', id] })
    const previousDossier = queryClient.getQueryData(['dossiers', id])

    queryClient.setQueryData(['dossiers', id], newDossier)

    return { previousDossier }
  },
  onError: (err, newDossier, context) => {
    queryClient.setQueryData(['dossiers', id], context.previousDossier)
  }
})
```

### Infinite Loading State

**Symptoms:**
- `isLoading` always true
- Spinner never disappears

**Solution:**

```typescript
// 1. Check query key stability
// Bad:
useQuery({ queryKey: ['data', { filter }] }) // New object every render

// Good:
useQuery({ queryKey: ['data', filter] }) // Primitive value

// 2. Verify queryFn returns data
const { data, isLoading, error } = useQuery({
  queryKey: ['dossiers'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('dossiers')
      .select('*')

    if (error) throw error
    return data // Must return data
  }
})

// 3. Check for errors
if (error) {
  console.error('Query error:', error)
}
```

### Query Not Refetching

**Symptoms:**
- Data not updating on focus/reconnect
- Stale data persists

**Solution:**

```typescript
// Configure refetch behavior
const { data } = useQuery({
  queryKey: ['dossiers'],
  queryFn: fetchDossiers,
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchInterval: false, // Or set interval
})

// Manually refetch
const { refetch } = useQuery({ ... })
refetch()

// Check global defaults
// frontend/src/main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 3,
    },
  },
})
```

### Understanding TanStack Query Cache Configuration

TanStack Query v5 uses two critical timing configurations that control cache behavior. Misunderstanding these leads to stale data and unexpected refetching.

#### staleTime vs gcTime (formerly cacheTime)

**staleTime** - How long data is considered "fresh" (default: `0`)
- While fresh, queries will NOT refetch in the background
- After staleTime expires, data becomes "stale" and will refetch on next access
- Set higher for data that changes infrequently

**gcTime** (Garbage Collection Time, formerly `cacheTime`) - How long unused data stays in cache (default: `5 minutes`)
- After query becomes inactive (no observers), starts gcTime countdown
- When gcTime expires, cache entry is garbage collected
- Set higher to preserve cache across navigation

**Common Configuration Patterns:**

```typescript
// Pattern 1: Frequently changing data (real-time updates)
const { data } = useQuery({
  queryKey: ['dossiers', 'active'],
  queryFn: fetchActiveDossiers,
  staleTime: 0, // Always refetch on mount/focus
  gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
})

// Pattern 2: Rarely changing reference data
const { data } = useQuery({
  queryKey: ['countries'],
  queryFn: fetchCountries,
  staleTime: 10 * 60 * 1000, // Fresh for 10 minutes
  gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
})

// Pattern 3: Static configuration data
const { data } = useQuery({
  queryKey: ['app-config'],
  queryFn: fetchConfig,
  staleTime: Infinity, // Never goes stale
  gcTime: Infinity, // Never garbage collected
})

// Pattern 4: User-specific data (balance freshness & performance)
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  staleTime: 2 * 60 * 1000, // Fresh for 2 minutes
  gcTime: 10 * 60 * 1000, // Cache for 10 minutes
})
```

### Cache Invalidation & Synchronization Issues

#### Problem: Data Not Updating After Mutations

**Symptoms:**
- Create/update succeeds but list doesn't show changes
- Detail view shows old data after edit
- Stale data visible across tabs

**Root Cause Analysis:**

```typescript
// 1. Check if invalidation is called
const mutation = useMutation({
  mutationFn: updateDossier,
  onSuccess: () => {
    // ❌ Missing - no cache invalidation!
    console.log('Update succeeded')
  }
})

// 2. Check invalidation scope
const mutation = useMutation({
  mutationFn: updateDossier,
  onSuccess: () => {
    // ❌ Too narrow - only invalidates specific dossier
    queryClient.invalidateQueries({ queryKey: ['dossiers', id] })
    // ✅ Should also invalidate list queries
  }
})
```

**Comprehensive Solution:**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: async (data) => {
    const { data: result, error } = await supabase
      .from('dossiers')
      .update(data)
      .eq('id', dossierId)
      .select()
      .single()

    if (error) throw error
    return result
  },
  onSuccess: (updatedDossier) => {
    // Strategy 1: Invalidate all related queries
    queryClient.invalidateQueries({
      queryKey: ['dossiers'] // Invalidates ALL dossier queries
    })

    // Strategy 2: Surgical invalidation (faster, more precise)
    queryClient.invalidateQueries({
      queryKey: ['dossiers', updatedDossier.id] // Detail view
    })
    queryClient.invalidateQueries({
      queryKey: ['dossiers', 'list'] // List views
    })
    queryClient.invalidateQueries({
      queryKey: ['dossiers', 'stats'] // Statistics
    })

    // Strategy 3: Immediate cache update (optimistic UI)
    queryClient.setQueryData(
      ['dossiers', updatedDossier.id],
      updatedDossier
    )
  },
  onError: (error) => {
    console.error('Mutation failed:', error)
    // Don't invalidate on error - keeps optimistic update
  }
})
```

#### Advanced Invalidation Patterns

```typescript
// Pattern 1: Exact match invalidation
queryClient.invalidateQueries({
  queryKey: ['dossiers', 'list'],
  exact: true // Only ['dossiers', 'list'], not ['dossiers', 'list', { filter: '...' }]
})

// Pattern 2: Predicate-based invalidation
queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === 'dossiers' &&
    query.queryKey[1] !== 'stats' // Invalidate all except stats
})

// Pattern 3: Type-based invalidation (with filters)
queryClient.invalidateQueries({
  queryKey: ['dossiers'],
  type: 'active' // Only invalidate active queries (with observers)
})

// Pattern 4: Refetch control
queryClient.invalidateQueries({
  queryKey: ['dossiers'],
  refetchType: 'active' // Only refetch queries with active observers
})
```

### Cache Persistence & Cross-Tab Synchronization

#### Problem: Cache Not Persisting Across Sessions

**Symptoms:**
- Data refetches on every page reload
- No offline capability
- Poor performance on navigation

**Solution: Enable Cache Persistence**

```typescript
// Install persistence plugin
// pnpm add @tanstack/react-query-persist-client

import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

// Create persister
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  // Optionally encrypt/compress
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data),
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (required for persistence)
    },
  },
})

function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        dehydrateOptions: {
          // Only persist specific queries
          shouldDehydrateQuery: (query) => {
            const queryKey = query.queryKey[0]
            // Persist reference data, not user-specific data
            return ['countries', 'organizations', 'app-config'].includes(queryKey as string)
          }
        }
      }}
    >
      <RouterProvider />
    </PersistQueryClientProvider>
  )
}
```

#### Problem: Stale Data Across Browser Tabs

**Symptoms:**
- User edits data in Tab A, Tab B shows old data
- Concurrent edits cause conflicts

**Solution: Broadcast Channel API Integration**

```typescript
// Create shared hook for cross-tab synchronization
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

function useCrossTabSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Create broadcast channel
    const channel = new BroadcastChannel('tanstack-query-sync')

    // Listen for invalidation messages from other tabs
    channel.onmessage = (event) => {
      const { type, queryKey } = event.data

      if (type === 'invalidate') {
        queryClient.invalidateQueries({ queryKey })
      }

      if (type === 'update') {
        queryClient.setQueryData(queryKey, event.data.data)
      }
    }

    // Broadcast invalidations from this tab
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'success') {
        channel.postMessage({
          type: 'invalidate',
          queryKey: event.query.queryKey
        })
      }
    })

    return () => {
      channel.close()
      unsubscribe()
    }
  }, [queryClient])
}

// Usage in App component
function App() {
  useCrossTabSync()
  return <RouterProvider />
}
```

### Optimistic Updates & Rollback Issues

#### Problem: UI Flickers After Optimistic Update

**Symptoms:**
- UI shows new data, then reverts to old data
- Double rendering after mutation
- Data inconsistency

**Root Cause:** Improper optimistic update implementation

**Comprehensive Optimistic Update Pattern:**

```typescript
const mutation = useMutation({
  mutationFn: async (updatedDossier: Partial<Dossier>) => {
    const { data, error } = await supabase
      .from('dossiers')
      .update(updatedDossier)
      .eq('id', dossierId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // STEP 1: Before mutation starts
  onMutate: async (updatedDossier) => {
    // Cancel outgoing refetches (prevent overwriting optimistic update)
    await queryClient.cancelQueries({ queryKey: ['dossiers', dossierId] })

    // Snapshot previous value for rollback
    const previousDossier = queryClient.getQueryData<Dossier>(['dossiers', dossierId])

    // Optimistically update cache
    queryClient.setQueryData<Dossier>(
      ['dossiers', dossierId],
      (old) => ({ ...old, ...updatedDossier })
    )

    // Return context for rollback
    return { previousDossier }
  },

  // STEP 2: If mutation fails
  onError: (error, updatedDossier, context) => {
    // Rollback to snapshot
    if (context?.previousDossier) {
      queryClient.setQueryData(
        ['dossiers', dossierId],
        context.previousDossier
      )
    }

    // Show error notification
    toast.error('Failed to update dossier')
  },

  // STEP 3: After mutation (success or error)
  onSettled: () => {
    // Refetch to ensure server state
    queryClient.invalidateQueries({ queryKey: ['dossiers', dossierId] })
    queryClient.invalidateQueries({ queryKey: ['dossiers', 'list'] })
  }
})
```

#### Advanced: List Optimistic Updates

```typescript
// Optimistically add item to list
const createMutation = useMutation({
  mutationFn: createDossier,
  onMutate: async (newDossier) => {
    await queryClient.cancelQueries({ queryKey: ['dossiers', 'list'] })

    const previousList = queryClient.getQueryData<Dossier[]>(['dossiers', 'list'])

    queryClient.setQueryData<Dossier[]>(
      ['dossiers', 'list'],
      (old) => [...(old || []), {
        ...newDossier,
        id: `temp-${Date.now()}`, // Temporary ID
        created_at: new Date().toISOString()
      }]
    )

    return { previousList }
  },
  onSuccess: (createdDossier, variables, context) => {
    // Replace temporary item with real data
    queryClient.setQueryData<Dossier[]>(
      ['dossiers', 'list'],
      (old) => old?.map(item =>
        item.id.startsWith('temp-') ? createdDossier : item
      )
    )
  },
  onError: (error, variables, context) => {
    if (context?.previousList) {
      queryClient.setQueryData(['dossiers', 'list'], context.previousList)
    }
  }
})
```

### Debugging Cache Issues

#### Enable TanStack Query DevTools

```tsx
// frontend/src/main.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <>
      <RouterProvider />
      {/* DevTools only in development */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </>
  )
}
```

**DevTools Features:**
- 🔍 Inspect all queries and their states
- ⏱️ View staleTime/gcTime timers
- 🔄 Manually refetch queries
- 🗑️ Clear cache entries
- 📊 Monitor query lifecycle

#### Logging Query Cache State

```typescript
// Add to browser console for debugging
window.queryClient = queryClient

// Inspect all queries
queryClient.getQueryCache().getAll().forEach(query => {
  console.log({
    queryKey: query.queryKey,
    state: query.state.status,
    dataUpdatedAt: new Date(query.state.dataUpdatedAt),
    isStale: query.isStale(),
    observers: query.getObserversCount()
  })
})

// Find specific query
const query = queryClient.getQueryCache().find({ queryKey: ['dossiers', id] })
console.log('Query state:', query?.state)

// Monitor cache changes
queryClient.getQueryCache().subscribe((event) => {
  console.log('Cache event:', event.type, event.query.queryKey)
})
```

#### Common Cache Debugging Commands

```typescript
// Check if data exists in cache
const cachedData = queryClient.getQueryData(['dossiers', id])
console.log('Cached data:', cachedData)

// Check query state
const queryState = queryClient.getQueryState(['dossiers', id])
console.log('Query state:', {
  status: queryState?.status,
  fetchStatus: queryState?.fetchStatus,
  dataUpdatedAt: new Date(queryState?.dataUpdatedAt || 0)
})

// Manually set cache data (testing)
queryClient.setQueryData(['dossiers', id], mockDossier)

// Clear specific query
queryClient.removeQueries({ queryKey: ['dossiers', id] })

// Clear all cache
queryClient.clear()

// Reset to initial state
queryClient.resetQueries({ queryKey: ['dossiers'] })
```

### Common Cache Anti-Patterns

#### ❌ Anti-Pattern 1: Unstable Query Keys

```typescript
// Bad: New object reference every render
const { data } = useQuery({
  queryKey: ['dossiers', { filter: filters }], // filters is object
  queryFn: fetchDossiers
})

// Good: Serialize object or use primitives
const { data } = useQuery({
  queryKey: ['dossiers', JSON.stringify(filters)],
  queryFn: fetchDossiers
})

// Better: Extract primitive values
const { data } = useQuery({
  queryKey: ['dossiers', filters.status, filters.type],
  queryFn: fetchDossiers
})
```

#### ❌ Anti-Pattern 2: Missing Invalidation

```typescript
// Bad: No invalidation after mutation
const mutation = useMutation({
  mutationFn: updateDossier,
  // Missing onSuccess!
})

// Good: Always invalidate related queries
const mutation = useMutation({
  mutationFn: updateDossier,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['dossiers'] })
  }
})
```

#### ❌ Anti-Pattern 3: Over-Invalidation

```typescript
// Bad: Invalidates entire cache on every mutation
const mutation = useMutation({
  mutationFn: updateDossier,
  onSuccess: () => {
    queryClient.invalidateQueries() // No queryKey = all queries!
  }
})

// Good: Surgical invalidation
const mutation = useMutation({
  mutationFn: updateDossier,
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['dossiers', data.id] })
    queryClient.invalidateQueries({ queryKey: ['dossiers', 'list'] })
  }
})
```

#### ❌ Anti-Pattern 4: Incorrect staleTime Configuration

```typescript
// Bad: staleTime too low for static data
const { data } = useQuery({
  queryKey: ['countries'],
  queryFn: fetchCountries,
  staleTime: 0 // Refetches constantly!
})

// Good: Match staleTime to data change frequency
const { data } = useQuery({
  queryKey: ['countries'],
  queryFn: fetchCountries,
  staleTime: 60 * 60 * 1000 // 1 hour for reference data
})
```

#### ❌ Anti-Pattern 5: Forgetting to Cancel Queries

```typescript
// Bad: Race condition in optimistic updates
const mutation = useMutation({
  onMutate: async (newData) => {
    // Missing cancelQueries!
    queryClient.setQueryData(['dossiers', id], newData)
  }
})

// Good: Always cancel before optimistic update
const mutation = useMutation({
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['dossiers', id] })
    const previous = queryClient.getQueryData(['dossiers', id])
    queryClient.setQueryData(['dossiers', id], newData)
    return { previous }
  }
})
```

### Performance Optimization

#### Reduce Unnecessary Refetches

```typescript
// Global configuration for production
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes default
      gcTime: 10 * 60 * 1000, // 10 minutes cache
      refetchOnWindowFocus: false, // Disable in production
      refetchOnReconnect: true,
      retry: 1, // Reduce retry attempts
    },
  },
})
```

#### Implement Query Prefetching

```typescript
// Prefetch on hover for better UX
function DossierList({ dossiers }) {
  const queryClient = useQueryClient()

  const prefetchDossier = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['dossiers', id],
      queryFn: () => fetchDossier(id),
      staleTime: 60 * 1000 // Fresh for 1 minute
    })
  }

  return dossiers.map(dossier => (
    <Link
      to={`/dossiers/${dossier.id}`}
      onMouseEnter={() => prefetchDossier(dossier.id)}
    >
      {dossier.title}
    </Link>
  ))
}
```

#### Selective Query Enabling

```typescript
// Only fetch when needed
const { data } = useQuery({
  queryKey: ['dossiers', id],
  queryFn: () => fetchDossier(id),
  enabled: !!id && isOpen, // Only fetch if ID exists and modal is open
})
```

## Real-time Subscription Issues

### Subscription Not Receiving Updates

**Symptoms:**
- Real-time updates not appearing
- No data on `INSERT`/`UPDATE`/`DELETE`

**Solution:**

```typescript
// 1. Enable Realtime in Supabase dashboard
// Database > Replication > Enable for table

// 2. Check subscription code
const channel = supabase
  .channel('dossiers-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // or 'INSERT', 'UPDATE', 'DELETE'
      schema: 'public',
      table: 'dossiers',
    },
    (payload) => {
      console.log('Change received!', payload)
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
    }
  )
  .subscribe((status) => {
    console.log('Subscription status:', status)
  })

// 3. Verify RLS policies allow SELECT
// User must have SELECT permission to receive real-time updates

// 4. Check connection status
supabase.realtime.connectionState() // Should be 'connected'

// 5. Cleanup subscription
useEffect(() => {
  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

### Connection Drops Frequently

**Symptoms:**
- `CLOSED` status in logs
- Intermittent updates

**Solution:**

```typescript
// 1. Implement reconnection logic
const channel = supabase
  .channel('dossiers', {
    config: {
      broadcast: { self: true },
      presence: { key: userId },
    },
  })
  .subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      console.error('Subscription error, retrying...')
      setTimeout(() => {
        channel.subscribe()
      }, 5000)
    }
  })

// 2. Check network stability
// Monitor browser console for WebSocket errors

// 3. Verify Supabase project status
// Check Supabase dashboard for outages
```

### Supabase Realtime Subscription Drops

Subscription drops occur when the WebSocket connection to Supabase Realtime is interrupted, resulting in missed real-time updates. This comprehensive guide covers all scenarios and solutions.

#### Understanding Subscription Lifecycle

Supabase Realtime subscriptions follow this lifecycle:

```
SUBSCRIBING → SUBSCRIBED → [CHANNEL_ERROR] → TIMED_OUT → CLOSED
                    ↓
              [UNSUBSCRIBED]
```

**Status Meanings:**
- `SUBSCRIBING`: Initial connection attempt
- `SUBSCRIBED`: Successfully connected, receiving updates
- `CHANNEL_ERROR`: Temporary error, will retry
- `TIMED_OUT`: Connection timeout (network issue)
- `CLOSED`: Connection closed (intentional or network failure)
- `UNSUBSCRIBED`: Explicitly unsubscribed

#### Symptoms of Subscription Drops

**Common Indicators:**
- ✗ Real-time updates stop arriving after working initially
- ✗ Status changes from `SUBSCRIBED` to `CLOSED` or `TIMED_OUT`
- ✗ Console shows WebSocket disconnection errors
- ✗ Data updates only appear after manual refresh
- ✗ Subscription works for a while, then stops
- ✗ Multiple subscriptions cause connection instability

#### Root Causes & Solutions

##### 1. Memory Leaks from Unclean Subscription Cleanup

**Root Cause:** Channels not properly removed when component unmounts, causing memory leaks and connection saturation.

**Symptoms:**
- Multiple duplicate subscriptions in DevTools
- Memory usage increases over time
- Subscriptions continue firing after navigation
- Console warning: "Channel already registered"

**Debugging:**

```typescript
// Check active channels
console.log('Active channels:', supabase.getChannels())

// Monitor channel count
setInterval(() => {
  const channels = supabase.getChannels()
  console.log(`Active channels: ${channels.length}`, channels.map(c => c.topic))
}, 5000)
```

**Solution - Proper Cleanup Pattern:**

```typescript
import { useEffect, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'

function useRealtimeSubscription(dossierId: string) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    // 1. Create unique channel name
    const channelName = `dossier-${dossierId}-${Date.now()}`

    // 2. Initialize channel
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dossiers',
          filter: `id=eq.${dossierId}`
        },
        (payload) => {
          console.log('Realtime update:', payload)
          queryClient.invalidateQueries({ queryKey: ['dossiers', dossierId] })
        }
      )
      .subscribe((status) => {
        console.log(`Subscription ${channelName}:`, status)
      })

    channelRef.current = channel

    // 3. Cleanup function (CRITICAL)
    return () => {
      console.log(`Unsubscribing from ${channelName}`)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [dossierId]) // Re-subscribe if dossierId changes

  return channelRef.current
}
```

**Anti-Pattern to Avoid:**

```typescript
// ❌ BAD: Channel created outside useEffect, never cleaned up
const channel = supabase.channel('global-channel')
channel.on('postgres_changes', ...).subscribe()

// ❌ BAD: Missing cleanup
useEffect(() => {
  const channel = supabase.channel('my-channel')
  channel.subscribe()
  // Missing return cleanup!
}, [])

// ❌ BAD: Cleanup doesn't remove channel
useEffect(() => {
  const channel = supabase.channel('my-channel')
  channel.subscribe()
  return () => {
    channel.unsubscribe() // Not enough - use removeChannel!
  }
}, [])
```

##### 2. Network Interruptions & Auto-Reconnection

**Root Cause:** Network instability (WiFi drops, mobile network switches) causes WebSocket disconnection without automatic reconnection.

**Symptoms:**
- Subscription drops after laptop wake from sleep
- Loss of connection on network switch
- Status stuck at `CLOSED` or `TIMED_OUT`

**Solution - Robust Reconnection Logic:**

```typescript
import { useEffect, useRef, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'

function useRobustRealtime(table: string, filter?: string) {
  const [status, setStatus] = useState<string>('idle')
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const MAX_RECONNECT_ATTEMPTS = 5
  const INITIAL_RECONNECT_DELAY = 1000 // 1 second
  const MAX_RECONNECT_DELAY = 30000 // 30 seconds

  const cleanup = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }

  const connect = () => {
    cleanup() // Ensure clean state

    const channel = supabase
      .channel(`${table}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: filter || undefined
        },
        (payload) => {
          console.log(`[${table}] Realtime update:`, payload)
          queryClient.invalidateQueries({ queryKey: [table] })
        }
      )
      .subscribe((newStatus) => {
        console.log(`[${table}] Status:`, newStatus)
        setStatus(newStatus)

        if (newStatus === 'SUBSCRIBED') {
          reconnectAttemptsRef.current = 0 // Reset on success
        }

        // Handle errors with exponential backoff
        if (newStatus === 'CHANNEL_ERROR' || newStatus === 'TIMED_OUT' || newStatus === 'CLOSED') {
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(
              INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
              MAX_RECONNECT_DELAY
            )

            console.log(`[${table}] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`)

            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++
              connect() // Recursive reconnection
            }, delay)
          } else {
            console.error(`[${table}] Max reconnection attempts reached`)
            // Optionally show user notification
          }
        }
      })

    channelRef.current = channel
  }

  useEffect(() => {
    connect()

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('Network online, reconnecting...')
      reconnectAttemptsRef.current = 0
      connect()
    }

    window.addEventListener('online', handleOnline)

    return () => {
      cleanup()
      window.removeEventListener('online', handleOnline)
    }
  }, [table, filter])

  return { status, reconnect: connect }
}
```

##### 3. RLS Policy Changes Causing Silent Drops

**Root Cause:** User loses SELECT permission due to RLS policy changes (role change, assignment removal), causing subscription to silently stop receiving updates.

**Symptoms:**
- Subscription status shows `SUBSCRIBED` but no updates arrive
- Other users receive updates but specific user doesn't
- Works after re-authentication

**Debugging:**

```typescript
// Test if user can SELECT from table
const { data, error } = await supabase
  .from('dossiers')
  .select('id')
  .limit(1)

if (error) {
  console.error('RLS blocking SELECT:', error)
  // User lost permission - subscription won't work
}

// Check user's current role
const { data: { user } } = await supabase.auth.getUser()
console.log('User role:', user?.user_metadata?.role)
```

**Solution:**

```typescript
// Periodically verify subscription health
function useSubscriptionHealthCheck(channelName: string) {
  useEffect(() => {
    const healthCheck = setInterval(async () => {
      const channel = supabase.getChannels().find(c => c.topic === channelName)

      if (!channel) {
        console.warn('Channel not found, recreating...')
        // Recreate subscription
        return
      }

      // Test database access
      const { error } = await supabase
        .from('dossiers')
        .select('id')
        .limit(1)

      if (error?.code === 'PGRST301') {
        console.error('RLS policy blocking access')
        // Notify user: "You no longer have access to this resource"
        // Clear subscription
        supabase.removeChannel(channel)
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(healthCheck)
  }, [channelName])
}
```

##### 4. Too Many Concurrent Subscriptions

**Root Cause:** Supabase free tier limits connections; exceeding limit causes drops.

**Symptoms:**
- New subscriptions fail to connect
- Random existing subscriptions drop
- Error: "Max connections exceeded"

**Debugging:**

```typescript
// Audit all active subscriptions
const channels = supabase.getChannels()
console.log(`Active subscriptions: ${channels.length}`)
channels.forEach(channel => {
  console.log(`- ${channel.topic}:`, channel.state)
})

// Supabase limits:
// Free tier: ~200 concurrent connections
// Pro tier: ~500+ concurrent connections
```

**Solution - Subscription Pooling:**

```typescript
// Centralized subscription manager
class RealtimeManager {
  private static channels = new Map<string, RealtimeChannel>()
  private static listeners = new Map<string, Set<Function>>()

  static subscribe(table: string, callback: Function) {
    const key = `table:${table}`

    // Reuse existing channel
    if (!this.channels.has(key)) {
      const channel = supabase
        .channel(key)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          // Notify all listeners
          this.listeners.get(key)?.forEach(cb => cb(payload))
        })
        .subscribe()

      this.channels.set(key, channel)
      this.listeners.set(key, new Set())
    }

    // Add listener
    this.listeners.get(key)?.add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback)

      // Cleanup if no listeners
      if (this.listeners.get(key)?.size === 0) {
        const channel = this.channels.get(key)
        if (channel) {
          supabase.removeChannel(channel)
          this.channels.delete(key)
          this.listeners.delete(key)
        }
      }
    }
  }
}

// Usage in component
function MyComponent() {
  useEffect(() => {
    const unsubscribe = RealtimeManager.subscribe('dossiers', (payload) => {
      console.log('Update:', payload)
    })

    return unsubscribe
  }, [])
}
```

##### 5. Browser Tab Visibility & Connection Throttling

**Root Cause:** Browsers throttle WebSocket connections when tab is hidden to save resources.

**Symptoms:**
- Subscriptions drop when tab in background
- Resume working when tab becomes active

**Solution - Visibility API Integration:**

```typescript
function useVisibilityAwareRealtime(table: string) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  const connect = () => {
    if (channelRef.current) return // Already connected

    const channel = supabase
      .channel(`${table}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        queryClient.invalidateQueries({ queryKey: [table] })
      })
      .subscribe()

    channelRef.current = channel
  }

  const disconnect = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }

  useEffect(() => {
    // Initial connection
    if (document.visibilityState === 'visible') {
      connect()
    }

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab visible, reconnecting...')
        connect()
      } else {
        console.log('Tab hidden, disconnecting to save resources')
        disconnect()
        // Alternatively, keep connection but reduce query invalidation frequency
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [table])
}
```

#### Production-Ready Realtime Hook

Combine all best practices into a single reusable hook:

```typescript
import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeConfig {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  schema?: string
  queryKey?: unknown[]
  onPayload?: (payload: any) => void
  enabled?: boolean
}

export function useRealtime(config: RealtimeConfig) {
  const {
    table,
    event = '*',
    filter,
    schema = 'public',
    queryKey,
    onPayload,
    enabled = true
  } = config

  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [status, setStatus] = useState<string>('idle')
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const MAX_RECONNECT_ATTEMPTS = 5
  const INITIAL_DELAY = 1000
  const MAX_DELAY = 30000

  const cleanup = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (channelRef.current) {
      console.log(`[Realtime] Cleaning up ${table} subscription`)
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }

  const connect = () => {
    if (!enabled) return

    cleanup()

    const channelName = `${table}-${filter || 'all'}-${Date.now()}`
    console.log(`[Realtime] Subscribing to ${channelName}`)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event, schema, table, filter: filter || undefined },
        (payload) => {
          console.log(`[Realtime] ${table} update:`, payload.eventType)

          // Custom callback
          if (onPayload) {
            onPayload(payload)
          }

          // Auto-invalidate queries
          if (queryKey) {
            queryClient.invalidateQueries({ queryKey })
          }
        }
      )
      .subscribe((newStatus) => {
        console.log(`[Realtime] ${table} status:`, newStatus)
        setStatus(newStatus)

        if (newStatus === 'SUBSCRIBED') {
          reconnectAttemptsRef.current = 0
        }

        if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(newStatus)) {
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(
              INITIAL_DELAY * Math.pow(2, reconnectAttemptsRef.current),
              MAX_DELAY
            )

            console.log(`[Realtime] Reconnecting in ${delay}ms`)
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++
              connect()
            }, delay)
          }
        }
      })

    channelRef.current = channel
  }

  useEffect(() => {
    if (!enabled) {
      cleanup()
      return
    }

    connect()

    // Network recovery
    const handleOnline = () => {
      console.log('[Realtime] Network online, reconnecting...')
      reconnectAttemptsRef.current = 0
      connect()
    }

    // Tab visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status !== 'SUBSCRIBED') {
        console.log('[Realtime] Tab visible, reconnecting...')
        connect()
      }
    }

    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cleanup()
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, table, event, filter, schema])

  return {
    status,
    isConnected: status === 'SUBSCRIBED',
    reconnect: connect,
    disconnect: cleanup
  }
}

// Usage example
function DossierView({ dossierId }: { dossierId: string }) {
  const { status, isConnected } = useRealtime({
    table: 'dossiers',
    event: '*',
    filter: `id=eq.${dossierId}`,
    queryKey: ['dossiers', dossierId],
    enabled: !!dossierId
  })

  return (
    <div>
      <Badge variant={isConnected ? 'success' : 'warning'}>
        {status}
      </Badge>
      {/* Component content */}
    </div>
  )
}
```

#### Debugging Subscription Drops

##### Enable Realtime Debug Logging

```typescript
// Enable verbose logging (development only)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    log_level: 'debug' // 'info' | 'debug' | 'warn' | 'error'
  }
})
```

##### Monitor Subscription State

```typescript
// Add to browser console for debugging
window.debugRealtime = () => {
  const channels = supabase.getChannels()
  console.log('=== Realtime Debug ===')
  console.log(`Active channels: ${channels.length}`)

  channels.forEach((channel, index) => {
    console.log(`\nChannel ${index + 1}:`)
    console.log('  Topic:', channel.topic)
    console.log('  State:', channel.state)
    console.log('  Listeners:', channel.bindings)
  })

  console.log('\nConnection state:', supabase.realtime.connectionState())
  console.log('=====================')
}

// Run periodically
setInterval(window.debugRealtime, 10000)
```

##### Test Subscription Health

```bash
# Check Supabase Realtime status
curl https://<project-ref>.supabase.co/realtime/v1/health

# Expected response:
# {"status":"ok","postgres_cdc":"ok"}
```

##### Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `CHANNEL_ERROR` | Subscription failed | Check RLS policies, verify table exists |
| `TIMED_OUT` | Connection timeout | Network issue, implement retry |
| `CLOSED` | Connection closed | Reconnect with exponential backoff |
| `PGRST301` | RLS violation | User lacks SELECT permission |
| `Max connections exceeded` | Too many subscriptions | Implement subscription pooling |

#### Best Practices Checklist

✅ **Always cleanup subscriptions** in `useEffect` return
✅ **Use unique channel names** to avoid conflicts
✅ **Implement exponential backoff** for reconnection
✅ **Monitor subscription status** with status callbacks
✅ **Verify RLS policies** allow SELECT for real-time updates
✅ **Pool subscriptions** when possible to reduce connections
✅ **Handle network events** (online/offline, visibility changes)
✅ **Log subscription lifecycle** for debugging
✅ **Set reasonable reconnection limits** to avoid infinite loops
✅ **Test subscription recovery** after network interruptions

#### Common Anti-Patterns

❌ **Creating subscriptions outside React lifecycle**
```typescript
// Bad: Global subscription, never cleaned up
const channel = supabase.channel('global').subscribe()
```

❌ **Using `unsubscribe()` instead of `removeChannel()`**
```typescript
// Bad: Doesn't remove channel from pool
return () => channel.unsubscribe()

// Good: Completely removes channel
return () => supabase.removeChannel(channel)
```

❌ **Ignoring subscription status**
```typescript
// Bad: No error handling
channel.subscribe()

// Good: Monitor and react to status
channel.subscribe((status) => {
  if (status === 'CHANNEL_ERROR') handleError()
})
```

❌ **Creating multiple subscriptions for same data**
```typescript
// Bad: Each component creates own subscription
function Component1() { useRealtime('dossiers') }
function Component2() { useRealtime('dossiers') }

// Good: Share single subscription via manager
RealtimeManager.subscribe('dossiers', callback)
```

## Internationalization & RTL Issues

### RTL Layout Broken

Arabic RTL (Right-to-Left) layout issues are common when using directional CSS properties instead of logical properties. This comprehensive guide covers detection, debugging, and fixing RTL layout bugs.

#### Understanding RTL Layout Requirements

**Core Principle:** Use **logical properties** that adapt to text direction automatically, never use directional properties.

**Why Logical Properties?**
- Directional properties (`left`, `right`, `ml-*`, `mr-*`) are hardcoded and don't flip in RTL
- Logical properties (`start`, `end`, `ms-*`, `me-*`) automatically adapt based on `dir` attribute
- Ensures consistent layout across LTR (English) and RTL (Arabic) languages

#### Symptoms of RTL Layout Bugs

**Visual Indicators:**
- ✗ Arabic text displays left-aligned instead of right-aligned
- ✗ Icons (arrows, chevrons) point wrong direction in Arabic
- ✗ Margins/padding appear on wrong side (e.g., left padding instead of right)
- ✗ Navigation menus start from left instead of right
- ✗ Modal/dialog close buttons on wrong side
- ✗ Form labels misaligned with inputs
- ✗ Border radius on wrong corners
- ✗ Dropdowns/tooltips positioned incorrectly
- ✗ Flexbox/grid items in wrong order

#### Root Cause Analysis

**Common Causes:**
1. Using directional Tailwind classes (`ml-*`, `mr-*`, `pl-*`, `pr-*`)
2. Missing `dir` attribute on containers
3. Hard-coded CSS with `left`/`right` properties
4. Icons not flipped for RTL context
5. Third-party components without RTL support
6. Absolute positioning with `left`/`right` instead of `start`/`end`

#### RTL-Safe Tailwind Classes Reference

**MANDATORY:** Always use logical properties. Never use directional properties.

| ❌ Avoid       | ✅ Use Instead  | Description              |
|---------------|----------------|--------------------------|
| `ml-*`        | `ms-*`         | Margin start             |
| `mr-*`        | `me-*`         | Margin end               |
| `pl-*`        | `ps-*`         | Padding start            |
| `pr-*`        | `pe-*`         | Padding end              |
| `left-*`      | `start-*`      | Position start           |
| `right-*`     | `end-*`        | Position end             |
| `text-left`   | `text-start`   | Text align start         |
| `text-right`  | `text-end`     | Text align end           |
| `rounded-l-*` | `rounded-s-*`  | Border radius start      |
| `rounded-r-*` | `rounded-e-*`  | Border radius end        |
| `border-l-*`  | `border-s-*`   | Border start             |
| `border-r-*`  | `border-e-*`   | Border end               |
| `divide-x`    | Use flexbox    | Dividers (no RTL support)|

#### Debugging Procedure

**Step 1: Enable Arabic Language**

```typescript
// In browser console
localStorage.setItem('i18nextLng', 'ar')
location.reload()

// Or use language switcher in UI
```

**Step 2: Inspect Layout Issues**

```bash
# Check for directional classes in codebase
grep -r "ml-\|mr-\|pl-\|pr-\|text-left\|text-right" frontend/src/

# Check for hardcoded CSS
grep -r "margin-left\|margin-right\|padding-left\|padding-right" frontend/src/

# Look for missing dir attributes
grep -r "className=" frontend/src/ | grep -v "dir="
```

**Step 3: Verify RTL Context Detection**

```tsx
// In component
import { useTranslation } from 'react-i18next'

const { i18n } = useTranslation()
console.log('Current language:', i18n.language)
console.log('Is RTL:', i18n.language === 'ar')

// Check HTML dir attribute
console.log('Document dir:', document.documentElement.dir) // Should be 'rtl'
```

**Step 4: Test Logical Properties**

```tsx
// Create test component
function RTLTest() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="p-4">
      <div className="ms-8 bg-blue-500 text-white p-4">
        Margin start (should be right in RTL)
      </div>
      <div className="me-8 bg-green-500 text-white p-4">
        Margin end (should be left in RTL)
      </div>
    </div>
  )
}
```

#### Comprehensive Solutions

##### Solution 1: Convert Directional to Logical Properties

**Bad (Directional):**
```tsx
// ❌ Will break in RTL
<div className="ml-4 mr-2 pl-6 pr-3 text-left border-l-2 rounded-l-lg">
  <button className="absolute right-4">Close</button>
</div>
```

**Good (Logical):**
```tsx
// ✅ RTL-safe
<div className="ms-4 me-2 ps-6 pe-3 text-start border-s-2 rounded-s-lg">
  <button className="absolute end-4">Close</button>
</div>
```

##### Solution 2: Flip Directional Icons

**Icons that must flip in RTL:**
- Arrows: `→` `←` `↗` `↖` `↘` `↙`
- Chevrons: `<` `>` `«` `»`
- Navigation: Back, Forward, Next, Previous
- Directional indicators: Sort arrows, expand/collapse

**Implementation:**

```tsx
import { useTranslation } from 'react-i18next'
import { ChevronRight, ArrowRight, ChevronLeft, ArrowLeft } from 'lucide-react'

function NavigationButton() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <button className="flex items-center gap-2">
      {/* Flip icon in RTL */}
      <ChevronRight className={isRTL ? 'rotate-180' : ''} />
      <span>Next</span>
    </button>
  )
}

// Better: Use conditional icons
function BetterNavigationButton() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const NextIcon = isRTL ? ChevronLeft : ChevronRight
  const BackIcon = isRTL ? ChevronRight : ChevronLeft

  return (
    <>
      <button>
        <BackIcon /> {t('back')}
      </button>
      <button>
        {t('next')} <NextIcon />
      </button>
    </>
  )
}
```

##### Solution 3: Set dir Attribute Correctly

**Global dir Setting:**

```tsx
// App.tsx or _app.tsx
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    // Set dir on document root
    const direction = i18n.language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.dir = direction
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  return <RouterProvider />
}
```

**Component-Level dir:**

```tsx
// For isolated RTL components (modals, dialogs)
function Modal({ children }) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="modal">
      {children}
    </div>
  )
}
```

##### Solution 4: Fix Tailwind Configuration

**Enable RTL Support:**

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    // Option 1: Use tailwindcss-rtl plugin
    require('tailwindcss-rtl'),

    // Option 2: Use tailwindcss-logical plugin (recommended)
    require('tailwindcss-logical'),
  ],
}
```

**Install Plugin:**

```bash
# Option 1: tailwindcss-rtl
pnpm add -D tailwindcss-rtl

# Option 2: tailwindcss-logical (better support for logical properties)
pnpm add -D tailwindcss-logical
```

##### Solution 5: Handle Third-Party Components

**Components without RTL support:**

```tsx
// Wrap with dir override
import { DatePicker } from 'third-party-library'

function RTLDatePicker(props) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <DatePicker
        {...props}
        locale={isRTL ? 'ar' : 'en'}
        // Override positioning
        popoverProps={{
          align: isRTL ? 'end' : 'start'
        }}
      />
    </div>
  )
}
```

##### Solution 6: RTL-Safe Flexbox & Grid

**Flexbox Direction:**

```tsx
// ❌ Bad: Hardcoded flex direction
<div className="flex flex-row">
  <div>First</div>
  <div>Second</div>
</div>

// ✅ Good: Uses logical order (automatically reverses in RTL)
<div className="flex flex-row" dir={isRTL ? 'rtl' : 'ltr'}>
  <div>First</div>
  <div>Second</div>
</div>

// ✅ Better: Use flex-row-reverse conditionally if needed
<div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
  <div>First</div>
  <div>Second</div>
</div>
```

**Grid Template Areas:**

```tsx
// ❌ Bad: Hardcoded positions
<div className="grid grid-cols-[200px_1fr]">
  <aside>Sidebar</aside>
  <main>Content</main>
</div>

// ✅ Good: Reverse in RTL
<div className={`grid ${isRTL ? 'grid-cols-[1fr_200px]' : 'grid-cols-[200px_1fr]'}`}>
  <aside className={isRTL ? 'order-2' : 'order-1'}>Sidebar</aside>
  <main className={isRTL ? 'order-1' : 'order-2'}>Content</main>
</div>
```

#### Common RTL Layout Patterns

##### Pattern 1: Navigation Menu

```tsx
function NavMenu() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <nav dir={isRTL ? 'rtl' : 'ltr'} className="flex gap-4">
      {/* Links automatically order correctly with dir */}
      <a href="/" className="px-4">{t('home')}</a>
      <a href="/about" className="px-4">{t('about')}</a>
      <a href="/contact" className="px-4">{t('contact')}</a>
    </nav>
  )
}
```

##### Pattern 2: Form Layout

```tsx
function FormField({ label, children }) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="flex flex-col gap-2">
      <label className="text-start text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}
```

##### Pattern 3: Modal with Close Button

```tsx
function Modal({ title, onClose, children }) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="modal">
      <div className="modal-header flex justify-between items-center p-4">
        <h2 className="text-start">{title}</h2>
        <button
          onClick={onClose}
          className="absolute top-4 end-4" // end-4, not right-4
        >
          <X />
        </button>
      </div>
      <div className="modal-body p-4">{children}</div>
    </div>
  )
}
```

##### Pattern 4: List with Icons

```tsx
function ListItem({ icon: Icon, text }) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <li className="flex items-center gap-3" dir={isRTL ? 'rtl' : 'ltr'}>
      <Icon className="shrink-0" />
      <span className="text-start">{text}</span>
    </li>
  )
}
```

#### Testing RTL Layouts

**Manual Testing Checklist:**

```bash
# 1. Switch to Arabic
# 2. Check each of these elements:

✅ Text alignment (right-aligned in RTL)
✅ Margins and padding (flipped correctly)
✅ Icons (directional icons flipped)
✅ Navigation (menus flow right-to-left)
✅ Forms (labels aligned correctly)
✅ Modals (close button on correct side)
✅ Dropdowns (positioned correctly)
✅ Tooltips (positioned correctly)
✅ Scrollbars (on left side in RTL)
✅ Tabs (order correct)
```

**Automated Testing:**

```typescript
// RTL layout test
import { render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/config'

describe('RTL Layout', () => {
  beforeEach(() => {
    i18n.changeLanguage('ar')
  })

  it('sets dir=rtl on container', () => {
    const { container } = render(<MyComponent />)
    expect(container.firstChild).toHaveAttribute('dir', 'rtl')
  })

  it('uses logical properties for margins', () => {
    const { container } = render(<MyComponent />)
    const element = container.querySelector('.my-element')
    expect(element).toHaveClass('ms-4') // Not ml-4
  })

  it('flips directional icons', () => {
    const { container } = render(<NavigationButton />)
    const icon = container.querySelector('svg')
    expect(icon).toHaveClass('rotate-180')
  })
})
```

#### Performance Considerations

**Avoid Runtime Direction Checks:**

```tsx
// ❌ Bad: Recalculates on every render
function Component() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' // Runs every render

  return <div className={isRTL ? 'flex-row-reverse' : 'flex-row'} />
}

// ✅ Good: Use memo or context
const RTLContext = createContext(false)

function RTLProvider({ children }) {
  const { i18n } = useTranslation()
  const isRTL = useMemo(() => i18n.language === 'ar', [i18n.language])

  return <RTLContext.Provider value={isRTL}>{children}</RTLContext.Provider>
}

function Component() {
  const isRTL = useContext(RTLContext)
  return <div className={isRTL ? 'flex-row-reverse' : 'flex-row'} />
}
```

#### Common Mistakes & Anti-Patterns

❌ **Mistake 1: Using directional properties**
```tsx
<div className="ml-4 text-left"> {/* ❌ Will break in RTL */}
<div className="ms-4 text-start"> {/* ✅ RTL-safe */}
```

❌ **Mistake 2: Forgetting dir attribute**
```tsx
<div className="modal"> {/* ❌ No dir attribute */}
<div dir={isRTL ? 'rtl' : 'ltr'} className="modal"> {/* ✅ Has dir */}
```

❌ **Mistake 3: Not flipping icons**
```tsx
<ChevronRight /> {/* ❌ Always points right */}
<ChevronRight className={isRTL ? 'rotate-180' : ''} /> {/* ✅ Flips in RTL */}
```

❌ **Mistake 4: Hardcoded absolute positioning**
```tsx
<button className="absolute right-4"> {/* ❌ Always on right */}
<button className="absolute end-4"> {/* ✅ Adapts to direction */}
```

❌ **Mistake 5: Using transform without RTL consideration**
```tsx
<div className="transform translate-x-4"> {/* ❌ Always translates right */}
<div className={`transform ${isRTL ? '-translate-x-4' : 'translate-x-4'}`}> {/* ✅ Conditional */}
```

#### Quick Fix Script

```bash
# Find and replace directional classes
# (Manual review required - don't blindly replace!)

# Replace margin classes
find frontend/src -type f -name "*.tsx" -o -name "*.jsx" | xargs sed -i '' 's/\bml-/ms-/g'
find frontend/src -type f -name "*.tsx" -o -name "*.jsx" | xargs sed -i '' 's/\bmr-/me-/g'

# Replace padding classes
find frontend/src -type f -name "*.tsx" -o -name "*.jsx" | xargs sed -i '' 's/\bpl-/ps-/g'
find frontend/src -type f -name "*.tsx" -o -name "*.jsx" | xargs sed -i '' 's/\bpr-/pe-/g'

# Replace text alignment
find frontend/src -type f -name "*.tsx" -o -name "*.jsx" | xargs sed -i '' 's/\btext-left\b/text-start/g'
find frontend/src -type f -name "*.tsx" -o -name "*.jsx" | xargs sed -i '' 's/\btext-right\b/text-end/g'

# WARNING: Review all changes manually before committing!
```

#### Resources

- **CLAUDE.md RTL Guidelines:** Comprehensive RTL development guide
- **Tailwind CSS Logical Properties:** https://tailwindcss.com/docs/padding#logical-properties
- **MDN Web Docs - CSS Logical Properties:** https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties
- **i18next Documentation:** https://www.i18next.com/

### Translations Not Loading

**Symptoms:**
- Keys displayed instead of translations
- `t('key')` returns 'key'

**Solution:**

```typescript
// 1. Verify translation files exist
// frontend/src/locales/en/common.json
// frontend/src/locales/ar/common.json

// 2. Check i18n initialization
// frontend/src/i18n/config.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: require('../locales/en/common.json'),
      },
      ar: {
        common: require('../locales/ar/common.json'),
      },
    },
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
  })

// 3. Use correct namespace
const { t } = useTranslation('common')
t('key') // Looks in common.json

// 4. Check JSON syntax
// Validate JSON files at jsonlint.com
```

### Language Not Switching

**Symptoms:**
- Language selector doesn't work
- UI stays in same language

**Solution:**

```typescript
// 1. Verify language change handler
import { useTranslation } from 'react-i18next'

const { i18n } = useTranslation()

const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng)
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lng
}

// 2. Check localStorage persistence
localStorage.getItem('i18nextLng') // Should match current language

// 3. Re-render after language change
// Use i18n.language in components to trigger re-render
```

## API & Network Issues

### 404 Not Found

**Symptoms:**
- API endpoint returns 404
- Route not defined

**Solution:**

```bash
# 1. Check backend routes
# backend/src/routes/index.ts
grep -r "router.get\|router.post" backend/src/routes/

# 2. Verify base URL
# frontend/.env
VITE_API_URL=http://localhost:4000

# 3. Check proxy configuration
# frontend/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:4000'
    }
  }
})

# 4. Test endpoint directly
curl http://localhost:4000/api/dossiers
```

### Request Timeout

**Symptoms:**
- Long wait times
- `ETIMEDOUT` errors

**Solution:**

```typescript
// 1. Increase timeout in fetch/axios
const response = await fetch(url, {
  signal: AbortSignal.timeout(30000) // 30 seconds
})

// 2. Check for slow database queries
// See Database & Supabase Issues > Slow Queries

// 3. Monitor network tab
// Chrome DevTools > Network > Check request timing

// 4. Implement retry logic
import { useQuery } from '@tanstack/react-query'

useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
})
```

## Performance & Optimization Issues

### Slow Page Load

**Symptoms:**
- High Time to Interactive (TTI)
- Large bundle size

**Solution:**

```bash
# 1. Analyze bundle size
pnpm build
pnpm analyze

# 2. Check for large dependencies
npx vite-bundle-visualizer

# 3. Implement code splitting
# Use dynamic imports
const Component = lazy(() => import('./Component'))

# 4. Optimize images
# Use WebP format, lazy loading
<img src="image.webp" loading="lazy" />
```

### Memory Leaks

**Symptoms:**
- Increasing memory usage
- Browser tab crashes

**Solution:**

```typescript
// 1. Cleanup subscriptions
useEffect(() => {
  const subscription = subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [])

// 2. Cancel pending requests
useEffect(() => {
  const controller = new AbortController()

  fetch(url, { signal: controller.signal })

  return () => {
    controller.abort()
  }
}, [])

// 3. Profile memory usage
// Chrome DevTools > Memory > Take heap snapshot
```

## Build & Deployment Issues

### Build Failures

**Symptoms:**
- `pnpm build` fails
- TypeScript errors

**Solution:**

```bash
# 1. Clear cache and node_modules
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 2. Check TypeScript errors
pnpm typecheck

# 3. Verify environment variables
grep -E "^VITE_" .env

# 4. Check for missing dependencies
pnpm install --frozen-lockfile

# 5. Review build logs
pnpm build 2>&1 | tee build.log
```

### Environment Variables Not Working

**Symptoms:**
- `undefined` values in production
- Config not loading

**Solution:**

```bash
# 1. Frontend: Use VITE_ prefix
VITE_API_URL=https://api.example.com

# 2. Backend: Load from .env
# backend/.env
DATABASE_URL=postgresql://...

# 3. Verify loading in code
# frontend/src/config.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
}

# 4. Check Docker environment
# docker-compose.yml
environment:
  - DATABASE_URL=${DATABASE_URL}
```

## Debugging Tools & Techniques

### Browser DevTools

Modern browsers provide powerful built-in debugging tools essential for troubleshooting React applications. This section covers Chrome/Edge DevTools (similar tools exist in Firefox and Safari).

#### Opening DevTools

| Method | Shortcut |
|--------|----------|
| Right-click > Inspect | N/A |
| Keyboard (Windows/Linux) | `F12` or `Ctrl + Shift + I` |
| Keyboard (Mac) | `Cmd + Option + I` |
| Menu | Chrome Menu > More Tools > Developer Tools |

#### Console Tab

The Console is your primary debugging interface for JavaScript execution and logging.

**Essential Commands:**

```javascript
// Log variables and objects
console.log('Debug value:', variable)
console.table(arrayOfObjects)  // Display arrays as tables
console.dir(domElement)        // Show DOM properties

// Grouping logs
console.group('User Actions')
console.log('Action 1')
console.log('Action 2')
console.groupEnd()

// Timing operations
console.time('API Call')
await fetchData()
console.timeEnd('API Call')

// Conditional logging
console.assert(value > 0, 'Value must be positive')

// Clear console
console.clear()
```

**Application-Specific Debugging:**

```javascript
// Debug TanStack Query cache
window.queryClient.getQueryCache().getAll()

// Check Supabase auth state
await supabase.auth.getSession()

// Test i18n language switching
i18n.changeLanguage('ar')

// Inspect React component
$r  // Selected component in React DevTools
```

#### Network Tab

Monitor all network requests, essential for debugging API calls and real-time subscriptions.

**Key Features:**

| Feature | Use Case |
|---------|----------|
| Filter by type | `Fetch/XHR`, `WS` (WebSockets), `Doc`, `CSS`, `JS` |
| Search requests | Find specific API endpoints |
| Request details | Headers, Payload, Preview, Response, Timing |
| Throttling | Simulate slow connections (3G, 4G) |
| Disable cache | Force fresh requests |
| HAR export | Save network log for analysis |

**Common Workflows:**

```bash
# Debug failed API requests
1. Filter by "Fetch/XHR"
2. Look for red status codes (4xx, 5xx)
3. Click request > Preview tab to see error response
4. Headers tab to verify Authorization header

# Monitor Supabase real-time
1. Filter by "WS" (WebSockets)
2. Click WebSocket connection
3. Messages tab shows subscription events
4. Look for "postgres_changes" payloads

# Check request timing
1. Click request > Timing tab
2. Identify bottlenecks:
   - DNS Lookup
   - Initial Connection
   - SSL/TLS
   - Waiting (TTFB)
   - Content Download

# Export network activity
1. Right-click in Network tab
2. Save all as HAR with content
3. Analyze in external tools or share with team
```

#### Elements/Inspector Tab

Inspect and modify DOM structure and CSS in real-time.

**Key Features:**

```bash
# Inspect element
1. Click element picker icon (or Ctrl+Shift+C / Cmd+Shift+C)
2. Hover over page elements
3. Click to inspect

# Edit HTML
1. Right-click element > Edit as HTML
2. Make changes
3. Press Ctrl+Enter to apply

# Modify CSS
1. Select element
2. Styles panel shows applied styles
3. Edit values or add new properties
4. Changes apply immediately

# Debug layout issues
1. Computed tab shows final computed styles
2. Box model visualization
3. Hover over padding/margin/border to highlight

# Find elements
Ctrl+F / Cmd+F in Elements tab
- Search by selector: div.container
- Search by text content
- Search by XPath
```

**RTL Debugging:**

```javascript
// Check RTL direction
$0.dir  // 'rtl' or 'ltr' for selected element

// Verify logical properties
getComputedStyle($0).marginInlineStart  // Should use 'ms-*' classes
getComputedStyle($0).paddingInlineEnd   // Should use 'pe-*' classes

// Test RTL layout
document.dir = 'rtl'  // Force RTL for testing
```

#### Sources/Debugger Tab

Debug JavaScript with breakpoints and step-through execution.

**Setting Breakpoints:**

```bash
# Line breakpoints
1. Open source file
2. Click line number to set breakpoint
3. Breakpoint appears as blue marker

# Conditional breakpoints
1. Right-click line number
2. Add conditional breakpoint
3. Enter condition: userId === '123'

# Logpoints (non-breaking)
1. Right-click line number
2. Add logpoint
3. Enter expression to log

# Event listener breakpoints
1. Event Listener Breakpoints panel
2. Expand categories (Mouse, Keyboard, etc.)
3. Check events to break on
```

**Debugging Workflow:**

```bash
# When breakpoint hits
1. Scope panel shows variable values
2. Call Stack shows execution path
3. Step controls:
   - Resume (F8) - Continue execution
   - Step Over (F10) - Execute current line
   - Step Into (F11) - Enter function call
   - Step Out (Shift+F11) - Exit current function

# Watch expressions
1. Watch panel > Click +
2. Add expression to monitor
3. Updates on each step

# Edit and continue
1. Pause execution
2. Edit code in source
3. Save (Ctrl+S / Cmd+S)
4. Resume - changes apply immediately
```

**React-Specific Debugging:**

```javascript
// Add breakpoint in React component
function UserProfile({ userId }) {
  debugger;  // Execution pauses here
  const user = useQuery(...)

  // Or use conditional debugger
  if (userId === '123') debugger;

  return <div>...</div>
}
```

#### Performance Tab

Profile runtime performance and identify bottlenecks.

**Recording Performance:**

```bash
# Record profile
1. Click Record button (or Ctrl+E / Cmd+E)
2. Interact with application
3. Click Stop
4. Analyze results

# Key metrics
- FPS (frames per second) - aim for 60 FPS
- CPU usage - identify expensive operations
- Network activity - concurrent requests
- Screenshots - visual timeline of page changes
```

**Analyzing Results:**

```bash
# Flame chart
- Shows function call stack over time
- Wider bars = more time spent
- Click bar to see function details

# Bottom-Up / Call Tree
- Aggregates time by function
- Identifies hotspots

# React component rendering
- Install React DevTools Profiler
- See component render times
- Identify unnecessary re-renders
```

#### Application Tab

Inspect storage, caches, and application state.

**Storage Types:**

| Type | Use Case | Location |
|------|----------|----------|
| Local Storage | Persistent user preferences | Application > Local Storage |
| Session Storage | Temporary session data | Application > Session Storage |
| Cookies | Auth tokens, session IDs | Application > Cookies |
| IndexedDB | Large structured data | Application > IndexedDB |
| Cache Storage | Service Worker caches | Application > Cache Storage |

**Common Tasks:**

```bash
# View stored auth tokens
1. Application > Local Storage
2. Look for 'supabase.auth.token'
3. Verify expiry time

# Clear storage
1. Application > Storage
2. Click "Clear site data"
3. Select storage types to clear

# Inspect Supabase session
localStorage.getItem('sb-<project-ref>-auth-token')

# Debug i18n language setting
localStorage.getItem('i18nextLng')  // Current language

# Check TanStack Query cache persistence
localStorage.getItem('REACT_QUERY_OFFLINE_CACHE')
```

#### Lighthouse Audits

Automated testing for performance, accessibility, SEO, and best practices.

```bash
# Run audit
1. Open DevTools
2. Lighthouse tab
3. Select categories to audit
4. Click "Generate report"

# Key metrics
- Performance Score (0-100)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)

# Accessibility checks
- ARIA attributes
- Color contrast
- Keyboard navigation
- Screen reader compatibility
```

#### Mobile Device Simulation

Test responsive design and mobile-specific issues.

```bash
# Enable device toolbar
1. Click device icon (or Ctrl+Shift+M / Cmd+Shift+M)
2. Select device preset or custom dimensions
3. Test touch events and screen sizes

# Device settings
- Dimensions: Width x Height
- Device pixel ratio (DPR)
- User agent string
- Network throttling

# Responsive breakpoints testing
Base (320px+) → sm (640px+) → md (768px+) → lg (1024px+)
```

**Touch Event Testing:**

```bash
# Simulate touch
1. Enable device toolbar
2. Click and drag to simulate swipe
3. Check touch target sizes (min 44x44px)

# Test RTL on mobile
1. Device toolbar > More options
2. Add device with RTL locale
3. Or manually set: document.dir = 'rtl'
```

#### Remote Debugging (Mobile Devices)

Debug web apps running on physical mobile devices.

**Android (Chrome):**

```bash
# Setup
1. Enable USB debugging on Android device
2. Connect via USB
3. Chrome DevTools > More tools > Remote devices
4. Select device and inspect WebView/Chrome tab

# Wireless debugging (Android 11+)
1. Settings > Developer options > Wireless debugging
2. Pair device via QR code or pairing code
3. chrome://inspect#devices
```

**iOS (Safari):**

```bash
# Setup
1. Enable Web Inspector on iOS device
   Settings > Safari > Advanced > Web Inspector
2. Connect via USB
3. Mac Safari > Develop > [Device name] > [Page]

# Requirements
- Mac with Safari
- iOS device with Safari
- USB connection or same Wi-Fi network
```

#### DevTools Best Practices

```bash
# Performance tips
1. Use Performance monitor for real-time metrics
   - Ctrl+Shift+P > Show Performance Monitor
   - Track CPU, memory, FPS

2. Enable paint flashing
   - Settings > More tools > Rendering
   - Check "Paint flashing"
   - See what re-paints on interactions

3. Check layout shifts
   - Rendering > Layout Shift Regions
   - Identify CLS issues

# Debugging tips
1. Preserve log across page loads
   - Network/Console settings > Preserve log

2. Disable cache during development
   - Network settings > Disable cache

3. Blackbox third-party scripts
   - Sources > right-click file > Blackbox script
   - Skip library code when debugging

4. Use workspace for persistent edits
   - Sources > Filesystem > Add folder
   - Edit files directly in DevTools
   - Changes save to disk
```

### React Developer Tools

```bash
# Install extension
# Chrome: https://chrome.google.com/webstore React Developer Tools

# Usage:
# 1. Open DevTools > Components tab
# 2. Inspect component props/state
# 3. Profiler tab for performance analysis
```

### TanStack Query DevTools

```tsx
// Enable in development
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <>
      <RouterProvider />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}
```

### Supabase Logs

```bash
# View real-time logs in Supabase dashboard
# Logs & Reports > Logs

# Filter by:
# - Status code (400, 500)
# - Method (GET, POST)
# - Path (/rest/v1/dossiers)

# Export logs
# Logs > Export > Download CSV
```

### Network Monitoring

```bash
# Chrome DevTools > Network
# 1. Filter by type (Fetch/XHR)
# 2. Check request/response headers
# 3. Verify payload
# 4. Check timing (TTFB, Download)

# HAR file export for analysis
# Network > Export HAR
```

### Database Query Logging

```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
SELECT pg_reload_conf();

-- View slow queries
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Browser Console Tips

```javascript
// Debug TanStack Query
window.queryClient = queryClient

// Debug Supabase
window.supabase = supabase

// Check auth state
supabase.auth.getUser().then(console.log)

// Monitor real-time
supabase.realtime.connectionState()

// Test i18n
i18n.changeLanguage('ar')
```

## Common Error Messages

### `Cannot read property 'map' of undefined`

**Cause:** Data not loaded before rendering

**Fix:**
```tsx
const { data, isLoading } = useQuery({ ... })

if (isLoading) return <Loading />
if (!data) return null

return <>{data.map(...)}</>
```

### `401 Unauthorized`

**Cause:** Missing or expired auth token

**Fix:**
```typescript
// Check user session
const { data: { user } } = await supabase.auth.getUser()

// Refresh session
const { data } = await supabase.auth.refreshSession()

// Re-login
await supabase.auth.signInWithPassword({ email, password })
```

### `403 Forbidden`

**Cause:** RLS policy blocking access

**Fix:** See [RLS Policy Issues](#rls-policy-issues-403-forbidden)

### `ECONNREFUSED`

**Cause:** Service not running or wrong port

**Fix:**
```bash
# Check service is running
docker ps | grep <service>

# Verify port in connection string
# localhost:54322 (not 5432 from inside Docker)
```

### `Hydration failed`

**Cause:** Server/client HTML mismatch

**Fix:** See [React 19 Hydration Mismatch](#react-19-hydration-mismatch)

## Error Codes Reference

This section provides a comprehensive reference for all error codes you may encounter in the GASTAT International Dossier System.

### HTTP Status Codes

#### 2xx Success

| Code | Name | Description | Action Required |
|------|------|-------------|-----------------|
| `200` | OK | Request succeeded | None - success response |
| `201` | Created | Resource created successfully | None - success response |
| `204` | No Content | Request succeeded, no content returned | None - success response |

#### 4xx Client Errors

| Code | Name | Description | Action Required |
|------|------|-------------|-----------------|
| `400` | Bad Request | Invalid request format or parameters | Check request payload, validate input data |
| `401` | Unauthorized | Missing or invalid authentication token | Sign in again, refresh session token |
| `403` | Forbidden | Authenticated but not authorized to access resource | Check RLS policies, verify user permissions |
| `404` | Not Found | Requested resource doesn't exist | Verify resource ID, check if resource was deleted |
| `409` | Conflict | Request conflicts with current state (e.g., duplicate) | Check for existing records, resolve conflicts |
| `422` | Unprocessable Entity | Request valid but cannot be processed (validation error) | Fix validation errors in request payload |
| `429` | Too Many Requests | Rate limit exceeded | Wait and retry with exponential backoff |

#### 5xx Server Errors

| Code | Name | Description | Action Required |
|------|------|-------------|-----------------|
| `500` | Internal Server Error | Unexpected server error | Check server logs, retry request, report if persists |
| `502` | Bad Gateway | Upstream server error (e.g., Supabase unavailable) | Wait and retry, check service status |
| `503` | Service Unavailable | Server temporarily unavailable (maintenance/overload) | Wait and retry, check status page |
| `504` | Gateway Timeout | Upstream server didn't respond in time | Retry request, check for slow queries |

### Application-Specific Error Codes

#### AI Generation Errors

| Code | Description | Retryable | Action Required |
|------|-------------|-----------|-----------------|
| `RATE_LIMIT_EXCEEDED` | Too many AI requests in short period | ✅ Yes | Wait 60s and retry, reduce request frequency |
| `SPEND_CAP_REACHED` | AI usage limit reached for organization | ❌ No | Contact administrator to increase quota |
| `PROVIDER_UNAVAILABLE` | AI provider service is down | ✅ Yes | Wait and retry, check provider status |
| `MODEL_UNAVAILABLE` | Requested AI model not accessible | ❌ No | Use different model, contact support |
| `GENERATION_FAILED` | AI generation failed unexpectedly | ✅ Yes | Retry request, simplify input |
| `CONTEXT_TOO_LONG` | Input exceeds model's context window | ❌ No | Reduce input size, summarize content |
| `CONTENT_FILTERED` | Content violates AI policy | ❌ No | Revise input to comply with policies |
| `TIMEOUT` | AI generation took too long | ✅ Yes | Retry with simpler request |
| `FEATURE_DISABLED` | AI feature disabled for organization | ❌ No | Contact administrator to enable feature |
| `BRIEF_FETCH_FAILED` | Generated brief couldn't be retrieved | ✅ Yes | Retry request, check database connection |

#### Authentication Errors

| Code | Description | Action Required |
|------|-------------|-----------------|
| `INVALID_CREDENTIALS` | Email or password incorrect | Re-enter credentials, use password reset |
| `SESSION_EXPIRED` | User session has expired | Sign in again to get new session |
| `TOKEN_INVALID` | JWT token is malformed or tampered | Clear local storage, sign in again |
| `TOKEN_EXPIRED` | JWT token has passed expiration time | Refresh token or sign in again |
| `USER_NOT_FOUND` | User account doesn't exist | Verify email, contact administrator |
| `USER_DISABLED` | User account has been disabled | Contact administrator |
| `EMAIL_NOT_CONFIRMED` | Email verification pending | Check inbox for verification email |
| `MFA_REQUIRED` | Multi-factor authentication required | Complete MFA challenge |

#### Database Errors

| Code | Description | Action Required |
|------|-------------|-----------------|
| `23505` | Unique constraint violation | Resource already exists, use different value |
| `23503` | Foreign key constraint violation | Referenced resource doesn't exist |
| `23502` | Not null constraint violation | Required field is missing |
| `42P01` | Undefined table | Run migrations, verify schema |
| `42703` | Undefined column | Check column name, run migrations |
| `22P02` | Invalid text representation | Check data types match schema |
| `53300` | Too many connections | Reduce connection pool size, check for leaks |
| `57014` | Query cancelled | Query took too long, optimize query |

#### Network Errors

| Code | Description | Retryable | Action Required |
|------|-------------|-----------|-----------------|
| `NETWORK_ERROR` | Network request failed | ✅ Yes | Check internet connection, retry |
| `TIMEOUT_ERROR` | Request exceeded timeout | ✅ Yes | Retry request, check network speed |
| `CORS_ERROR` | Cross-origin request blocked | ❌ No | Verify CORS configuration on server |
| `DNS_ERROR` | Domain name resolution failed | ✅ Yes | Check DNS settings, verify domain |
| `SSL_ERROR` | SSL/TLS certificate error | ❌ No | Verify certificate validity, check system time |
| `CONNECTION_REFUSED` | Server refused connection | ✅ Yes | Verify service is running, check port |
| `CONNECTION_RESET` | Connection reset by peer | ✅ Yes | Retry request, check network stability |

#### Real-time Subscription Errors

| Code | Description | Action Required |
|------|-------------|-----------------|
| `SUBSCRIPTION_FAILED` | Failed to establish subscription | Check RLS policies, verify channel name |
| `SUBSCRIPTION_TIMED_OUT` | Subscription handshake timed out | Check network connection, retry |
| `SUBSCRIPTION_CLOSED` | Subscription closed unexpectedly | Reconnect subscription, check auth state |
| `CHANNEL_NOT_FOUND` | Subscription channel doesn't exist | Verify channel name, check table exists |
| `BROADCAST_FAILED` | Failed to broadcast message | Check connection state, retry broadcast |

### Error Response Format

All API errors follow this standard format:

```typescript
{
  "code": "ERROR_CODE",           // Machine-readable error code
  "message": "Human readable",     // User-friendly error message
  "details": "Additional context", // Optional technical details
  "retryable": true,              // Whether request can be retried
  "retryAfter": 60                // Seconds to wait before retry (optional)
}
```

### Handling Errors in Code

#### Frontend (React/TypeScript)

```typescript
import { parseAIError, getErrorMessage } from '@/utils/ai-errors'
import { useTranslation } from 'react-i18next'

function handleError(error: unknown) {
  const { t } = useTranslation()
  const aiError = parseAIError(error)

  // Get user-friendly message
  const message = getErrorMessage(aiError, t)

  // Show error to user
  toast.error(message)

  // Retry if applicable
  if (aiError.retryable) {
    const delay = aiError.retryAfter ? aiError.retryAfter * 1000 : 3000
    setTimeout(() => retryRequest(), delay)
  }
}
```

#### Backend (Node.js/TypeScript)

```typescript
import { SupabaseClient } from '@supabase/supabase-js'

async function handleDatabaseError(error: any) {
  // Check for specific PostgreSQL error codes
  if (error.code === '23505') {
    throw new Error('Resource already exists')
  }

  if (error.code === '23503') {
    throw new Error('Referenced resource not found')
  }

  // Log unexpected errors
  console.error('Database error:', error)
  throw new Error('Database operation failed')
}
```

#### TanStack Query Error Handling

```typescript
const { data, error, isError } = useQuery({
  queryKey: ['dossiers'],
  queryFn: fetchDossiers,
  retry: (failureCount, error) => {
    // Don't retry on 4xx errors (client errors)
    if (error.status >= 400 && error.status < 500) {
      return false
    }
    // Retry up to 3 times for 5xx errors
    return failureCount < 3
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
})

if (isError) {
  // Handle error with user-friendly message
  return <ErrorState error={error} />
}
```

### Quick Error Lookup

**Can't access resource:** Check `403` (RLS policy) or `401` (authentication)
**Resource not found:** Check `404` (wrong ID) or `42P01` (table missing)
**Duplicate entry:** Check `409` (conflict) or `23505` (unique constraint)
**Request fails immediately:** Check `400` (bad request) or `422` (validation)
**Request times out:** Check `504` (gateway timeout) or network issues
**AI generation fails:** Check `RATE_LIMIT_EXCEEDED`, `CONTEXT_TOO_LONG`, or `PROVIDER_UNAVAILABLE`
**Real-time not working:** Check `SUBSCRIPTION_FAILED` or `401` (auth expired)

## FAQ

### Q: How do I reset the development database?

```bash
pnpm db:reset
```

### Q: How do I clear TanStack Query cache?

```typescript
queryClient.clear()
```

### Q: How do I debug RLS policies?

```sql
-- Check policies
\dp table_name

-- Test as user
SET SESSION AUTHORIZATION 'user_id';
SELECT * FROM table_name;
```

### Q: How do I enable verbose logging?

```bash
# Frontend
VITE_LOG_LEVEL=debug pnpm dev

# Backend
LOG_LEVEL=debug pnpm dev
```

### Q: Where are error logs stored?

```bash
# Docker logs
docker logs intl-dossier-<service>

# Application logs (if configured)
./logs/error.log
./logs/combined.log
```

## Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Search existing GitHub issues
3. ✅ Review application logs
4. ✅ Try the Quick Diagnostics steps
5. ✅ Reproduce in minimal environment

### Information to Include

```markdown
**Environment:**
- OS: macOS 13.0 / Ubuntu 22.04 / Windows 11
- Node.js: v18.17.0
- pnpm: 8.6.0
- Docker: 24.0.5

**Issue:**
Clear description of the problem

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Logs:**
```
Paste relevant logs here
```

**Screenshots:**
(if applicable)
```

### Contact Channels

- **GitHub Issues:** https://github.com/gastat/intl-dossier/issues
- **Email:** support@gastat.sa
- **Slack:** #intl-dossier-support (internal)

---

_Last updated: 2025-01-24_
