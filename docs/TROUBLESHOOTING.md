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

**Solution:**

```javascript
// 1. Check token expiry configuration
// In Supabase dashboard: Authentication > Settings
// Access token expiry: 3600 (1 hour recommended)

// 2. Verify refresh token handling
// frontend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 3. Manual refresh if needed
const { data, error } = await supabase.auth.refreshSession()

// 4. Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully')
  }
  if (event === 'SIGNED_OUT') {
    // Redirect to login
  }
})
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

## Internationalization & RTL Issues

### RTL Layout Broken

**Symptoms:**
- Arabic text displays left-aligned
- Icons not flipped
- Margins/padding incorrect

**Solution:**

```tsx
// 1. Use logical properties (ALWAYS)
// Bad:
<div className="ml-4 text-left">

// Good:
<div className="ms-4 text-start">

// 2. Flip directional icons
import { useTranslation } from 'react-i18next'

const { i18n } = useTranslation()
const isRTL = i18n.language === 'ar'

<ChevronRight className={isRTL ? 'rotate-180' : ''} />

// 3. Set dir attribute
<div dir={isRTL ? 'rtl' : 'ltr'}>
  {content}
</div>

// 4. Check Tailwind config
// tailwind.config.js
module.exports = {
  // Enable RTL support
  plugins: [
    require('tailwindcss-rtl'),
  ],
}
```

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
