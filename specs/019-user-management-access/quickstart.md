# Quickstart: User Management & Access Control

**Feature**: 019-user-management-access
**Date**: 2025-10-11
**Target Audience**: Developers implementing user lifecycle management and RBAC

## Overview

This guide provides step-by-step instructions to set up and implement the User Management & Access Control system, including database schema, Edge Functions, frontend components, and automated workflows.

## Prerequisites

- **Supabase Project**: Pro plan required (for pg_cron extension)
- **Node.js**: 18+ LTS
- **PostgreSQL**: 15+ (via Supabase)
- **Redis**: 7.x instance (for session management)
- **Supabase CLI**: Latest version
- **Environment Variables**: See `.env.example`

## Architecture Overview

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend      │─────▶│  Edge Functions  │─────▶│   PostgreSQL    │
│  React + TS     │      │   (Supabase)     │      │   + pg_cron     │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                        │                          │
         │                        │                          │
         ▼                        ▼                          ▼
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Supabase       │      │     Redis        │      │  Materialized   │
│  Realtime       │      │  Session Store   │      │     Views       │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

## Step 1: Database Setup

### 1.1 Enable Required Extensions

```sql
-- Connect to Supabase database
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### 1.2 Create ENUMs

```bash
# Apply ENUM migration
supabase migration new create_user_enums

# Edit migration file: supabase/migrations/YYYYMMDDHHMMSS_create_user_enums.sql
```

```sql
-- User role hierarchy: admin > editor > viewer
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');

-- Account types
CREATE TYPE user_type AS ENUM ('employee', 'guest');

-- Account status
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'deactivated');

-- Delegation source tracking
CREATE TYPE delegation_source AS ENUM ('direct', 'delegated');

-- Approval workflow states
CREATE TYPE approval_status AS ENUM ('pending', 'first_approved', 'approved', 'rejected');

-- Review status
CREATE TYPE review_status AS ENUM ('in_progress', 'completed');
```

### 1.3 Create Core Tables

```bash
# Create users table extension
supabase migration new extend_users_table
```

```sql
-- Extend Supabase auth.users with profile columns
ALTER TABLE auth.users
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'viewer',
  ADD COLUMN IF NOT EXISTS user_type user_type DEFAULT 'employee',
  ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"language": "en", "timezone": "UTC", "theme": "light"}',
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_ip INET,
  ADD COLUMN IF NOT EXISTS allowed_resources UUID[],
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Constraints
ALTER TABLE auth.users
  ADD CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  ADD CONSTRAINT guest_expiration CHECK (user_type != 'guest' OR expires_at IS NOT NULL),
  ADD CONSTRAINT employee_no_resources CHECK (user_type = 'guest' OR allowed_resources IS NULL);

-- Indexes
CREATE INDEX idx_users_role ON auth.users(role);
CREATE INDEX idx_users_status ON auth.users(status);
CREATE INDEX idx_users_type ON auth.users(user_type);
CREATE INDEX idx_users_last_login ON auth.users(last_login_at);
```

### 1.4 Create Supporting Tables

See `data-model.md` for complete schema definitions. Key tables to create:

1. `user_sessions` - Active session tracking
2. `delegations` - Permission delegation with triggers
3. `pending_role_approvals` - Dual approval workflow
4. `access_reviews` - Compliance reviews
5. `audit_logs` - Partitioned audit trail (yearly partitions)
6. `notifications` - User notifications

### 1.5 Apply Migrations

```bash
# Push migrations to Supabase
supabase db push

# Verify migrations
supabase db diff
```

## Step 2: Row Level Security (RLS) Setup

### 2.1 Enable RLS on All Tables

```sql
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_role_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

### 2.2 Create RLS Policies

```sql
-- Users: Admin full access, users can view own profile
CREATE POLICY users_admin_all ON auth.users
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY users_own_profile ON auth.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Delegations: Users can view own delegations
CREATE POLICY delegations_view_own ON delegations
  FOR SELECT TO authenticated
  USING (grantor_id = auth.uid() OR grantee_id = auth.uid());

-- Audit logs: Append-only, admin read access
CREATE POLICY audit_insert_only ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY audit_select_admin ON audit_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY audit_no_update ON audit_logs
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY audit_no_delete ON audit_logs
  FOR DELETE TO authenticated
  USING (false);
```

## Step 3: Automated Jobs (pg_cron)

### 3.1 Schedule Delegation Expiration

```sql
SELECT cron.schedule(
  'process-expired-delegations',
  '* * * * *', -- Every minute
  $$
    UPDATE delegations
    SET is_active = false,
        revoked_at = now(),
        revoked_by = NULL
    WHERE valid_until < now()
      AND is_active = true
  $$
);
```

### 3.2 Guest Account Expiration

```sql
SELECT cron.schedule(
  'deactivate-expired-guests',
  '*/5 * * * *', -- Every 5 minutes
  $$
    UPDATE auth.users
    SET status = 'inactive',
        updated_at = now()
    WHERE user_type = 'guest'
      AND expires_at < now()
      AND status = 'active'
  $$
);
```

### 3.3 Quarterly Access Reviews

```sql
SELECT cron.schedule(
  'quarterly-access-review',
  '0 9 1 1,4,7,10 *', -- 9 AM on 1st of Jan, Apr, Jul, Oct
  $$
    INSERT INTO access_reviews (review_name, review_scope, reviewer_id, status)
    VALUES (
      'Q' || EXTRACT(QUARTER FROM now()) || ' ' || EXTRACT(YEAR FROM now()) || ' Access Review',
      'all_users',
      (SELECT id FROM auth.users WHERE role = 'admin' ORDER BY created_at LIMIT 1),
      'in_progress'
    )
  $$
);
```

### 3.4 Materialized View Refresh

```sql
SELECT cron.schedule(
  'refresh-access-review-summary',
  '0 */6 * * *', -- Every 6 hours
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY access_review_summary$$
);
```

## Step 4: Edge Functions Deployment

### 4.1 Create Edge Functions

```bash
# Create Edge Functions for user management
supabase functions new create-user
supabase functions new activate-account
supabase functions new deactivate-user
supabase functions new assign-role
supabase functions new approve-role-change
supabase functions new delegate-permissions
supabase functions new revoke-delegation
supabase functions new generate-access-review
```

### 4.2 Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy create-user
supabase functions deploy activate-account
supabase functions deploy deactivate-user
supabase functions deploy assign-role
supabase functions deploy approve-role-change
supabase functions deploy delegate-permissions
supabase functions deploy revoke-delegation
supabase functions deploy generate-access-review

# Verify deployment
supabase functions list
```

### 4.3 Set Environment Variables

```bash
# Set secrets for Edge Functions
supabase secrets set REDIS_URL=redis://...
supabase secrets set APP_URL=https://app.gastat.gov.sa
supabase secrets set EMAIL_SERVICE_KEY=...
```

## Step 5: Redis Session Store Setup

### 5.1 Configure Redis Connection

```typescript
// backend/src/config/redis.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

// Session validation
export async function validateSession(userId: string, sessionToken: string): Promise<boolean> {
  const storedToken = await redis.get(`sessions:user:${userId}:${sessionToken}`);
  return storedToken === sessionToken;
}

// Invalidate all user sessions (on role change)
export async function invalidateUserSessions(userId: string): Promise<void> {
  const keys = await redis.keys(`sessions:user:${userId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

### 5.2 Session Middleware

```typescript
// backend/src/middleware/session-validation.ts
import { validateSession } from '../config/redis';

export async function sessionValidationMiddleware(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Validate session against Redis whitelist
  const isValid = await validateSession(user.id, token);
  if (!isValid) {
    return new Response('Session invalidated', { status: 401 });
  }

  return null; // Session valid
}
```

## Step 6: Frontend Implementation

### 6.1 Install Dependencies

```bash
cd frontend
npm install @supabase/supabase-js @tanstack/react-query react-i18next
```

### 6.2 Create User Management Hooks

```typescript
// frontend/src/hooks/use-user-session.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useUserSession() {
  return useQuery({
    queryKey: ['user-session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });
}

export function useRoleAssignment() {
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data, error } = await supabase.functions.invoke('assign-role', {
        body: { user_id: userId, new_role: role },
      });
      if (error) throw error;
      return data;
    },
  });
}
```

### 6.3 Create Realtime Role Change Listener

```typescript
// frontend/src/hooks/use-role-change-listener.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export function useRoleChangeListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const channel = supabase.channel('role_changes')
      .on('broadcast', { event: 'role_changed' }, (payload) => {
        const { user_id, new_role } = payload.payload;

        // Check if current user affected
        const currentUser = supabase.auth.getUser();
        if (currentUser.data.user?.id === user_id) {
          // Clear session and redirect to login
          supabase.auth.signOut();
          navigate('/login', {
            state: { message: `Your role has been changed to ${new_role}. Please log in again.` }
          });
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [navigate]);
}
```

### 6.4 Create User Management Components

```bash
# Generate shadcn/ui components
npx shadcn@latest add form table dialog badge button
```

```typescript
// frontend/src/components/user-management/UserTable.tsx
import { useQuery } from '@tanstack/react-query';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function UserTable() {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await supabase.from('users').select('*');
      return data;
    },
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Login</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users?.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                {user.role}
              </Badge>
            </TableCell>
            <TableCell>{user.status}</TableCell>
            <TableCell>{new Date(user.last_login_at).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Step 7: Testing Setup

### 7.1 Contract Tests

```typescript
// frontend/tests/contract/user-lifecycle.test.ts
import { describe, it, expect } from 'vitest';
import { supabase } from '@/lib/supabase';

describe('User Lifecycle API', () => {
  it('should create user with valid data', async () => {
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email: 'test@gastat.gov.sa',
        full_name: 'Test User',
        username: 'testuser',
        role: 'viewer',
      },
    });

    expect(error).toBeNull();
    expect(data).toHaveProperty('user_id');
    expect(data.activation_sent).toBe(true);
  });

  it('should reject duplicate email', async () => {
    const { error } = await supabase.functions.invoke('create-user', {
      body: {
        email: 'duplicate@gastat.gov.sa',
        full_name: 'Duplicate User',
        username: 'duplicate',
        role: 'viewer',
      },
    });

    expect(error).toBeDefined();
    expect(error.message).toContain('DUPLICATE_EMAIL');
  });
});
```

### 7.2 Integration Tests

```typescript
// frontend/tests/integration/delegation-expiry.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Delegation Expiration Workflow', () => {
  it('should automatically revoke expired delegations', async () => {
    // Create delegation expiring in 1 minute
    const { data: delegation } = await supabase.functions.invoke('delegate-permissions', {
      body: {
        grantee_id: 'test-user-id',
        valid_until: new Date(Date.now() + 60000).toISOString(),
        reason: 'Test delegation',
      },
    });

    // Wait for expiration + processing (65 seconds)
    await new Promise(resolve => setTimeout(resolve, 65000));

    // Verify delegation is revoked
    const { data: updated } = await supabase
      .from('delegations')
      .select('is_active')
      .eq('id', delegation.delegation_id)
      .single();

    expect(updated.is_active).toBe(false);
  });
});
```

### 7.3 E2E Tests (Playwright)

```typescript
// frontend/tests/e2e/user-lifecycle.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Lifecycle', () => {
  test('admin can create and deactivate user', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@gastat.gov.sa');
    await page.fill('[name="password"]', 'admin-password');
    await page.click('button[type="submit"]');

    // Navigate to users page
    await page.goto('/users');
    await page.click('button:has-text("Create User")');

    // Fill user form
    await page.fill('[name="email"]', 'newuser@gastat.gov.sa');
    await page.fill('[name="full_name"]', 'New User');
    await page.fill('[name="username"]', 'newuser');
    await page.selectOption('[name="role"]', 'editor');
    await page.click('button:has-text("Create")');

    // Verify user created
    await expect(page.locator('text=newuser@gastat.gov.sa')).toBeVisible();

    // Deactivate user
    await page.click('[data-user-id]:has-text("newuser@gastat.gov.sa") button:has-text("Deactivate")');
    await page.click('button:has-text("Confirm")');

    // Verify user deactivated
    await expect(page.locator('text=inactive')).toBeVisible();
  });
});
```

## Step 8: Local Development

### 8.1 Start Development Environment

```bash
# Terminal 1: Start Supabase local
supabase start

# Terminal 2: Start Redis (Docker)
docker run -p 6379:6379 redis:7-alpine

# Terminal 3: Start frontend
cd frontend && npm run dev

# Terminal 4: Watch Edge Functions
supabase functions serve
```

### 8.2 Seed Test Data

```bash
# Run seed script
supabase db seed
```

```sql
-- supabase/seed.sql
INSERT INTO auth.users (email, username, full_name, role, status)
VALUES
  ('admin@gastat.gov.sa', 'admin', 'System Administrator', 'admin', 'active'),
  ('editor@gastat.gov.sa', 'editor', 'Editor User', 'editor', 'active'),
  ('viewer@gastat.gov.sa', 'viewer', 'Viewer User', 'viewer', 'active');
```

## Step 9: Production Deployment

### 9.1 Environment Configuration

```bash
# .env.production
SUPABASE_URL=https://zkrcjzdemdmwhearhfgg.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
REDIS_URL=redis://production-redis:6379
APP_URL=https://app.gastat.gov.sa
EMAIL_SERVICE_KEY=...
```

### 9.2 Deploy to Production

```bash
# Link to production project
supabase link --project-ref zkrcjzdemdmwhearhfgg

# Push migrations
supabase db push --linked

# Deploy Edge Functions
supabase functions deploy --project-ref zkrcjzdemdmwhearhfgg

# Build and deploy frontend
npm run build
# Deploy to hosting (Vercel/Netlify/etc.)
```

### 9.3 Post-Deployment Verification

```bash
# Verify pg_cron jobs
psql $DATABASE_URL -c "SELECT * FROM cron.job;"

# Check RLS policies
psql $DATABASE_URL -c "SELECT schemaname, tablename, policyname FROM pg_policies;"

# Test Edge Functions
curl https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/create-user \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gastat.gov.sa","full_name":"Test","username":"test","role":"viewer"}'
```

## Step 10: Monitoring & Observability

### 10.1 Setup Logging

```typescript
// Use Winston logger in Edge Functions
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

logger.info('User created', {
  user_id: userId,
  role: role,
  created_by: adminId,
});
```

### 10.2 Monitor pg_cron Jobs

```sql
-- Check cron job execution history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- Check failed jobs
SELECT * FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC;
```

### 10.3 Performance Monitoring

```typescript
// Add performance tracking to Edge Functions
const startTime = performance.now();

// ... business logic ...

const duration = performance.now() - startTime;
logger.info('Function execution time', { duration_ms: duration });
```

## Troubleshooting

### Issue: pg_cron jobs not running
**Solution**: Verify Supabase Pro plan, check cron.job table, ensure timezone is UTC

### Issue: Session invalidation not working
**Solution**: Verify Redis connection, check session key format, ensure Realtime subscriptions active

### Issue: Circular delegation not prevented
**Solution**: Verify check_circular_delegation trigger is active, check recursive CTE logic

### Issue: Audit logs allow updates
**Solution**: Verify RLS policies are enabled, check audit_no_update policy

## Next Steps

1. ✅ Database and RLS setup complete
2. ✅ Edge Functions deployed
3. ✅ Frontend components implemented
4. → Run `/speckit.tasks` to generate implementation tasks
5. → Execute tasks by user story priority (P1 → P2 → P3)
6. → Run test suite and validate success criteria

## Resources

- **API Contracts**: See `contracts/` directory for OpenAPI specs
- **Data Model**: See `data-model.md` for complete schema
- **Research Decisions**: See `research.md` for technology choices
- **Supabase Docs**: https://supabase.com/docs
- **pg_cron Docs**: https://github.com/citusdata/pg_cron
