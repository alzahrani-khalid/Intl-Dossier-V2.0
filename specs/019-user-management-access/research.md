# Research: User Management & Access Control

**Feature**: 019-user-management-access
**Date**: 2025-10-11
**Purpose**: Resolve technical unknowns and document technology decisions for implementing comprehensive user lifecycle management and RBAC

## Research Areas

### 1. Dual Approval Workflow for Admin Role Assignment

**Decision**: Implement approval workflow using Supabase database state machine with pending_role_approvals table

**Rationale**:
- Native Supabase approach without external workflow engines
- State machine pattern provides clear approval stages: pending → first_approved → completed
- Prevents same administrator from providing both approvals via CHECK constraint
- Audit trail built-in via approval records

**Alternatives Considered**:
- **External workflow engine (Temporal, Camunda)**: Rejected due to infrastructure overhead for single workflow type
- **Email-based approval links**: Rejected due to security concerns and lack of audit integration
- **Real-time collaborative approval UI**: Considered but deferred to later iteration; async approval is sufficient

**Implementation Approach**:
```sql
CREATE TABLE pending_role_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  requested_role user_role NOT NULL,
  requester_id UUID REFERENCES auth.users NOT NULL,
  first_approver_id UUID REFERENCES auth.users,
  second_approver_id UUID REFERENCES auth.users,
  status approval_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT different_approvers CHECK (first_approver_id != second_approver_id),
  CONSTRAINT no_self_approval CHECK (
    requester_id != first_approver_id AND
    requester_id != second_approver_id
  )
);
```

**Dependencies**: None (native PostgreSQL)

---

### 2. Session Termination on Role Change

**Decision**: Use Supabase Realtime subscriptions + Redis session store for immediate invalidation

**Rationale**:
- Supabase JWT tokens cannot be invalidated server-side (stateless by design)
- Redis session whitelist provides O(1) lookup for session validation
- Realtime subscription broadcasts role changes to all active frontend clients
- Clients immediately clear local session and redirect to login

**Alternatives Considered**:
- **JWT blacklist**: Rejected due to storage growth and O(n) lookup performance
- **Short-lived JWT (5 min) with refresh**: Considered but 5min delay unacceptable for security requirement (<30s)
- **Supabase Auth session revocation API**: Does not exist in current Supabase version

**Implementation Approach**:
1. On role change: Delete Redis session keys for user_id `DEL sessions:user:{user_id}:*`
2. Broadcast Realtime event: `supabase.channel('role_changes').send({ user_id, new_role })`
3. Frontend listeners: On event received, check if current user affected → logout
4. API middleware: Validate request JWT against Redis session whitelist

**Dependencies**:
- Redis 7.x for session storage
- Supabase Realtime for change broadcasts

---

### 3. Delegation Chain Validation & Prevention

**Decision**: Implement recursive CTE query with delegation_source tracking column

**Rationale**:
- PostgreSQL recursive CTEs efficiently detect circular references in single query
- delegation_source column distinguishes original permissions from delegated ones
- Non-transitive enforcement via CHECK constraint on source type

**Alternatives Considered**:
- **Graph database (Neo4j)**: Rejected due to infrastructure complexity for single use case
- **Application-level validation**: Rejected due to race condition risks in concurrent delegations
- **Materialized delegation paths**: Rejected due to maintenance overhead on delegation changes

**Implementation Approach**:
```sql
CREATE TYPE delegation_source AS ENUM ('direct', 'delegated');

CREATE TABLE delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grantor_id UUID REFERENCES auth.users NOT NULL,
  grantee_id UUID REFERENCES auth.users NOT NULL,
  source delegation_source DEFAULT 'direct',
  resource_type TEXT,
  resource_id UUID,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ NOT NULL,
  CONSTRAINT no_delegated_redelegation CHECK (
    source = 'direct' -- Only direct permissions can be delegated
  )
);

-- Circular delegation prevention function
CREATE OR REPLACE FUNCTION check_circular_delegation()
RETURNS TRIGGER AS $$
BEGIN
  -- Use recursive CTE to detect if grantee has delegation path back to grantor
  IF EXISTS (
    WITH RECURSIVE delegation_chain AS (
      SELECT grantee_id, grantor_id FROM delegations WHERE grantor_id = NEW.grantee_id
      UNION ALL
      SELECT d.grantee_id, d.grantor_id
      FROM delegations d
      INNER JOIN delegation_chain dc ON d.grantor_id = dc.grantee_id
    )
    SELECT 1 FROM delegation_chain WHERE grantee_id = NEW.grantor_id
  ) THEN
    RAISE EXCEPTION 'Circular delegation detected';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Dependencies**: PostgreSQL 15+ (recursive CTEs)

---

### 4. Delegation Expiration Automation

**Decision**: Use pg_cron extension for scheduled expiration processing

**Rationale**:
- Native PostgreSQL scheduling without external cron service
- Runs within database transaction context for atomicity
- Triggers at 1-minute intervals for near-real-time expiration (<1 min requirement)

**Alternatives Considered**:
- **Supabase Edge Function with external cron (GitHub Actions)**: Rejected due to external dependency and less reliability
- **Node.js worker with node-cron**: Rejected due to additional service deployment
- **Database triggers on SELECT**: Rejected due to performance impact and non-standard approach

**Implementation Approach**:
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule delegation expiration check every minute
SELECT cron.schedule(
  'process-expired-delegations',
  '* * * * *', -- Every minute
  $$
    UPDATE delegations
    SET is_active = false,
        revoked_at = now(),
        revoked_by = NULL -- System revocation
    WHERE valid_until < now()
      AND is_active = true
  $$
);

-- Notification trigger on expiration
CREATE OR REPLACE FUNCTION notify_delegation_expired()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for grantor
  INSERT INTO notifications (user_id, type, message)
  VALUES (OLD.grantor_id, 'delegation_expired',
          'Delegation to ' || (SELECT email FROM auth.users WHERE id = OLD.grantee_id) || ' has expired');

  -- Insert notification for grantee
  INSERT INTO notifications (user_id, type, message)
  VALUES (OLD.grantee_id, 'delegation_expired',
          'Delegation from ' || (SELECT email FROM auth.users WHERE id = OLD.grantor_id) || ' has expired');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delegation_expired_notification
AFTER UPDATE OF is_active ON delegations
FOR EACH ROW
WHEN (OLD.is_active = true AND NEW.is_active = false AND NEW.revoked_by IS NULL)
EXECUTE FUNCTION notify_delegation_expired();
```

**Dependencies**:
- pg_cron extension (available in Supabase Pro plan)
- notifications table for user notifications

---

### 5. Access Review Report Generation Performance

**Decision**: Use materialized view with partial refresh for large user sets

**Rationale**:
- Materialized view pre-computes complex aggregations (roles + delegations + activity)
- CONCURRENTLY refresh prevents table locks during updates
- Meets <10s requirement even for 1000+ users
- Indexed on common filter columns (department, role, last_login)

**Alternatives Considered**:
- **Real-time aggregation query**: Rejected due to poor performance at scale (>10s for 1000 users)
- **Pre-computed daily reports**: Rejected due to staleness for on-demand reviews
- **Separate OLAP database**: Rejected due to infrastructure complexity for single feature

**Implementation Approach**:
```sql
CREATE MATERIALIZED VIEW access_review_summary AS
SELECT
  u.id AS user_id,
  u.email,
  u.full_name,
  u.role AS primary_role,
  u.last_login_at,
  u.status,
  COALESCE(json_agg(DISTINCT d.*) FILTER (WHERE d.id IS NOT NULL), '[]') AS active_delegations,
  COUNT(DISTINCT d.id) AS delegation_count,
  EXTRACT(DAYS FROM (now() - u.last_login_at)) AS days_since_login
FROM auth.users u
LEFT JOIN delegations d ON d.grantee_id = u.id AND d.is_active = true
GROUP BY u.id;

-- Indexes for common filters
CREATE INDEX idx_review_summary_role ON access_review_summary(primary_role);
CREATE INDEX idx_review_summary_last_login ON access_review_summary(last_login_at);
CREATE INDEX idx_review_summary_status ON access_review_summary(status);

-- Refresh schedule (every 6 hours)
SELECT cron.schedule(
  'refresh-access-review-summary',
  '0 */6 * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY access_review_summary'
);
```

**Dependencies**:
- PostgreSQL materialized views
- pg_cron for scheduled refresh

---

### 6. Audit Log Immutability & Retention

**Decision**: Use PostgreSQL RLS policies + append-only table pattern with partition pruning for 7-year retention

**Rationale**:
- RLS policies prevent UPDATE/DELETE on audit_logs (only INSERT allowed)
- Table partitioning by year enables efficient historical data management
- Old partitions can be archived to cold storage (S3) after 2 years while maintaining query access
- Meets 7-year retention requirement without performance degradation

**Alternatives Considered**:
- **Separate audit database**: Rejected due to cross-database query complexity
- **Event sourcing framework**: Rejected due to over-engineering for audit use case
- **Write-once storage (WORM)**: Considered but PostgreSQL RLS + partitioning sufficient

**Implementation Approach**:
```sql
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create yearly partitions
CREATE TABLE audit_logs_2025 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE audit_logs_2026 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
-- ... create partitions for 7 years

-- Immutability via RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_insert_only ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY audit_select_admin ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Prevent UPDATE/DELETE entirely
CREATE POLICY audit_no_update ON audit_logs
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY audit_no_delete ON audit_logs
  FOR DELETE TO authenticated
  USING (false);
```

**Dependencies**:
- PostgreSQL 15+ partitioning
- Supabase RLS policies

---

### 7. Guest Account Management & Expiration

**Decision**: Extend existing users table with user_type ENUM + auto-deactivation via pg_cron

**Rationale**:
- Single users table maintains referential integrity across system
- user_type ENUM ('employee', 'guest') distinguishes account types
- Automatic expiration via cron job (same pattern as delegation expiry)
- RLS policies enforce guest access restrictions

**Alternatives Considered**:
- **Separate guest_users table**: Rejected due to JOIN complexity and duplicate auth logic
- **Manual expiration workflow**: Rejected due to human error risk
- **Third-party guest access service**: Rejected due to integration complexity

**Implementation Approach**:
```sql
CREATE TYPE user_type AS ENUM ('employee', 'guest');

ALTER TABLE auth.users ADD COLUMN user_type user_type DEFAULT 'employee';
ALTER TABLE auth.users ADD COLUMN expires_at TIMESTAMPTZ;
ALTER TABLE auth.users ADD COLUMN allowed_resources UUID[];

-- Guest expiration cron job
SELECT cron.schedule(
  'deactivate-expired-guests',
  '*/5 * * * *', -- Every 5 minutes
  $$
    UPDATE auth.users
    SET status = 'inactive'
    WHERE user_type = 'guest'
      AND expires_at < now()
      AND status = 'active'
  $$
);

-- RLS policy for guest access restriction
CREATE POLICY guest_resource_access ON dossiers
  FOR SELECT TO authenticated
  USING (
    CASE
      WHEN (SELECT user_type FROM auth.users WHERE id = auth.uid()) = 'guest'
      THEN id = ANY((SELECT allowed_resources FROM auth.users WHERE id = auth.uid()))
      ELSE true -- Employees have full access
    END
  );
```

**Dependencies**:
- pg_cron extension
- RLS policies on protected tables

---

### 8. MFA-Based Password Reset

**Decision**: Use Supabase Auth built-in MFA + custom recovery flow for non-MFA users

**Rationale**:
- Supabase Auth natively supports TOTP-based MFA
- MFA-enabled users can reset password via TOTP verification
- Non-MFA users fall back to time-limited email link (1 hour expiry, one-time use)
- Reduces custom authentication logic

**Alternatives Considered**:
- **SMS-based MFA**: Rejected due to cost and telecom dependency
- **Security questions**: Rejected due to poor security (easily guessable)
- **Admin-initiated reset only**: Rejected due to poor user experience

**Implementation Approach**:
```typescript
// Edge Function: initiate-password-reset
export async function initiatePasswordReset(email: string) {
  const user = await supabase.auth.admin.getUserByEmail(email);

  if (!user) {
    // Return generic message to prevent email enumeration
    return { message: 'If email exists, reset instructions sent' };
  }

  // Check if user has MFA enabled
  const { data: factors } = await supabase.auth.admin.mfa.listFactors(user.id);
  const hasMFA = factors && factors.length > 0;

  if (hasMFA) {
    // MFA user: Require TOTP verification before password change
    const { data: challenge } = await supabase.auth.admin.mfa.challenge({
      factorId: factors[0].id
    });

    return {
      method: 'mfa',
      challengeId: challenge.id,
      message: 'Enter TOTP code to reset password'
    };
  } else {
    // Non-MFA user: Send time-limited email link
    const { data } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: user.email,
      options: {
        redirectTo: `${APP_URL}/auth/reset-password`
      }
    });

    await sendPasswordResetEmail(user.email, data.properties.action_link);

    return {
      method: 'email',
      message: 'Password reset link sent (expires in 1 hour)'
    };
  }
}
```

**Dependencies**:
- Supabase Auth MFA (included in all plans)
- Email delivery service (already configured)

---

## Technology Stack Summary

### Core Technologies
- **Database**: PostgreSQL 15+ with extensions: pg_cron, pgcrypto
- **Auth**: Supabase Auth (JWT, MFA, email verification)
- **Caching**: Redis 7.x for session store
- **Realtime**: Supabase Realtime for role change broadcasts
- **Email**: Existing email service for activation/reset/notification emails

### Key Patterns
- State machine for approval workflows
- Recursive CTEs for circular delegation detection
- Materialized views for complex reporting
- Table partitioning for long-term audit retention
- RLS policies for data access control
- pg_cron for automated expiration processing

### Performance Strategies
- Redis session whitelist: O(1) session validation
- Materialized view refresh: <10s report generation for 1000+ users
- Indexed delegation queries: <100ms circular detection
- Partitioned audit logs: <2s historical queries

### Security Measures
- Dual approval workflow with constraint validation
- Immediate session invalidation on role change
- Immutable audit logs via RLS policies
- MFA support for password reset
- Rate limiting on user management endpoints (10 req/min per IP)

---

## Open Questions & Risks

### Resolved
- ✅ How to enforce dual approval without external workflow engine? → Database state machine
- ✅ How to invalidate JWT sessions immediately? → Redis whitelist + Realtime broadcast
- ✅ How to prevent circular delegations at scale? → Recursive CTE with trigger
- ✅ How to automate delegation expiration? → pg_cron scheduled jobs
- ✅ How to handle 7-year audit retention? → Table partitioning + cold storage

### Remaining Risks
- **pg_cron availability**: Requires Supabase Pro plan. Mitigation: Verify plan tier before implementation
- **Redis infrastructure**: Requires separate Redis instance. Mitigation: Use Supabase's built-in Redis or managed Redis service
- **Email deliverability**: Password reset/activation emails may be blocked. Mitigation: Use dedicated email service (SendGrid/Postmark) with SPF/DKIM
- **Concurrent bulk operations**: 100 admins performing bulk role changes may overwhelm database. Mitigation: Implement queue-based processing for bulk operations

---

## Next Steps

1. ✅ Research complete - All technical decisions documented
2. → Phase 1: Generate data-model.md from entities
3. → Phase 1: Generate API contracts based on decisions
4. → Phase 1: Create quickstart.md with setup instructions
5. → Phase 1: Update agent context with new technologies
