-- ============================================
-- TENANT ISOLATION LAYER
-- Feature: Multi-tenancy architectural enforcement
-- Date: 2026-01-13
-- ============================================
--
-- This migration creates a dedicated architectural layer that enforces
-- tenant isolation at the data access level, ensuring all queries
-- automatically filter by tenant context.
--
-- Key components:
-- 1. Tenant context management functions (SECURITY DEFINER)
-- 2. Universal RLS helper functions for organization membership
-- 3. Tenant-scoped connection pooling support via session variables
-- 4. Audit trail for cross-tenant access attempts
-- ============================================

-- ============================================
-- SCHEMA FOR TENANT ISOLATION
-- ============================================

CREATE SCHEMA IF NOT EXISTS tenant_isolation;

COMMENT ON SCHEMA tenant_isolation IS 'Tenant isolation layer for multi-tenancy enforcement';

-- ============================================
-- TENANT CONTEXT SESSION VARIABLES
-- ============================================

-- Set up GUC (Grand Unified Configuration) variables for tenant context
-- These allow setting tenant context at connection/session level

-- Function to set the current tenant context
CREATE OR REPLACE FUNCTION tenant_isolation.set_tenant_context(
  p_tenant_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, tenant_isolation
AS $$
BEGIN
  -- Set the tenant_id for this session
  PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, FALSE);

  -- Set the user_id for audit purposes
  IF p_user_id IS NOT NULL THEN
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, FALSE);
  END IF;

  -- Log the context switch for audit
  INSERT INTO tenant_isolation.tenant_context_audit (
    tenant_id,
    user_id,
    action,
    session_id
  ) VALUES (
    p_tenant_id,
    p_user_id,
    'set_context',
    pg_backend_pid()::TEXT
  );
END;
$$;

-- Function to get the current tenant context
CREATE OR REPLACE FUNCTION tenant_isolation.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, tenant_isolation
AS $$
DECLARE
  v_tenant_id TEXT;
BEGIN
  -- First try session variable
  v_tenant_id := current_setting('app.current_tenant_id', TRUE);

  IF v_tenant_id IS NOT NULL AND v_tenant_id != '' THEN
    RETURN v_tenant_id::UUID;
  END IF;

  -- If not set, try to get from user's primary organization
  SELECT om.organization_id INTO v_tenant_id
  FROM public.organization_members om
  WHERE om.user_id = auth.uid()
    AND om.left_at IS NULL
  ORDER BY om.joined_at ASC
  LIMIT 1;

  RETURN v_tenant_id::UUID;
END;
$$;

-- Function to clear tenant context
CREATE OR REPLACE FUNCTION tenant_isolation.clear_tenant_context()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, tenant_isolation
AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', '', FALSE);
  PERFORM set_config('app.current_user_id', '', FALSE);
END;
$$;

-- ============================================
-- TENANT MEMBERSHIP VERIFICATION
-- ============================================

-- Function to check if user is a member of a tenant (organization)
CREATE OR REPLACE FUNCTION tenant_isolation.is_tenant_member(
  p_tenant_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, tenant_isolation
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_tenant_id
      AND om.user_id = p_user_id
      AND om.left_at IS NULL
  );
END;
$$;

-- Function to get all tenant IDs for a user
CREATE OR REPLACE FUNCTION tenant_isolation.get_user_tenant_ids(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, tenant_isolation
AS $$
DECLARE
  v_tenant_ids UUID[];
BEGIN
  SELECT ARRAY_AGG(om.organization_id)
  INTO v_tenant_ids
  FROM public.organization_members om
  WHERE om.user_id = p_user_id
    AND om.left_at IS NULL;

  RETURN COALESCE(v_tenant_ids, ARRAY[]::UUID[]);
END;
$$;

-- Function to check if user has access to a tenant (for RLS policies)
CREATE OR REPLACE FUNCTION tenant_isolation.has_tenant_access(
  p_tenant_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, tenant_isolation
AS $$
BEGIN
  -- Service role always has access
  IF current_setting('request.jwt.claim.role', TRUE) = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- Check if user is authenticated and is a member
  RETURN auth.uid() IS NOT NULL AND tenant_isolation.is_tenant_member(p_tenant_id, auth.uid());
END;
$$;

-- ============================================
-- UNIVERSAL RLS POLICY HELPERS
-- ============================================

-- Generic function for SELECT policies on tenant-scoped tables
CREATE OR REPLACE FUNCTION tenant_isolation.rls_select_policy(
  p_organization_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, tenant_isolation
AS $$
BEGIN
  -- Service role bypass
  IF current_setting('request.jwt.claim.role', TRUE) = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- Admins can see all records
  IF public.auth_has_role('admin') THEN
    RETURN TRUE;
  END IF;

  -- Regular users can only see records from their organizations
  RETURN p_organization_id = ANY(tenant_isolation.get_user_tenant_ids());
END;
$$;

-- Generic function for INSERT policies on tenant-scoped tables
CREATE OR REPLACE FUNCTION tenant_isolation.rls_insert_policy(
  p_organization_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, tenant_isolation
AS $$
BEGIN
  -- Service role bypass
  IF current_setting('request.jwt.claim.role', TRUE) = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- User must be a member of the organization to insert
  RETURN tenant_isolation.is_tenant_member(p_organization_id, auth.uid());
END;
$$;

-- Generic function for UPDATE policies on tenant-scoped tables
CREATE OR REPLACE FUNCTION tenant_isolation.rls_update_policy(
  p_organization_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, tenant_isolation
AS $$
BEGIN
  -- Service role bypass
  IF current_setting('request.jwt.claim.role', TRUE) = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- Admins can update any record
  IF public.auth_has_role('admin') THEN
    RETURN TRUE;
  END IF;

  -- Editors can update records in their organizations
  IF public.auth_has_any_role(ARRAY['editor', 'admin']) THEN
    RETURN tenant_isolation.is_tenant_member(p_organization_id, auth.uid());
  END IF;

  RETURN FALSE;
END;
$$;

-- Generic function for DELETE policies on tenant-scoped tables
CREATE OR REPLACE FUNCTION tenant_isolation.rls_delete_policy(
  p_organization_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, tenant_isolation
AS $$
BEGIN
  -- Service role bypass
  IF current_setting('request.jwt.claim.role', TRUE) = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- Only admins can delete, and only within their organizations
  IF public.auth_has_role('admin') THEN
    RETURN tenant_isolation.is_tenant_member(p_organization_id, auth.uid());
  END IF;

  RETURN FALSE;
END;
$$;

-- ============================================
-- TENANT CONTEXT AUDIT TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_isolation.tenant_context_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  action TEXT NOT NULL,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenant_context_audit_tenant ON tenant_isolation.tenant_context_audit(tenant_id);
CREATE INDEX idx_tenant_context_audit_user ON tenant_isolation.tenant_context_audit(user_id);
CREATE INDEX idx_tenant_context_audit_created ON tenant_isolation.tenant_context_audit(created_at DESC);

-- ============================================
-- CROSS-TENANT ACCESS VIOLATION LOG
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_isolation.access_violation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  attempted_tenant_id UUID NOT NULL,
  user_tenant_ids UUID[],
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  query_snippet TEXT,
  blocked BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_violation_user ON tenant_isolation.access_violation_log(user_id);
CREATE INDEX idx_access_violation_tenant ON tenant_isolation.access_violation_log(attempted_tenant_id);
CREATE INDEX idx_access_violation_created ON tenant_isolation.access_violation_log(created_at DESC);

-- Function to log access violations
CREATE OR REPLACE FUNCTION tenant_isolation.log_access_violation(
  p_user_id UUID,
  p_attempted_tenant_id UUID,
  p_table_name TEXT,
  p_operation TEXT,
  p_query_snippet TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, tenant_isolation
AS $$
BEGIN
  INSERT INTO tenant_isolation.access_violation_log (
    user_id,
    attempted_tenant_id,
    user_tenant_ids,
    table_name,
    operation,
    query_snippet,
    blocked
  ) VALUES (
    p_user_id,
    p_attempted_tenant_id,
    tenant_isolation.get_user_tenant_ids(p_user_id),
    p_table_name,
    p_operation,
    p_query_snippet,
    TRUE
  );
END;
$$;

-- ============================================
-- TENANT SCOPED QUERY BUILDER
-- ============================================

-- Function that can be used in queries to automatically scope to tenant
CREATE OR REPLACE FUNCTION tenant_isolation.scoped_to_tenant(
  p_organization_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, tenant_isolation
AS $$
DECLARE
  v_current_tenant UUID;
BEGIN
  v_current_tenant := tenant_isolation.get_current_tenant_id();

  -- If no tenant context, use membership check
  IF v_current_tenant IS NULL THEN
    RETURN tenant_isolation.has_tenant_access(p_organization_id);
  END IF;

  -- Strict mode: only allow access to current tenant
  RETURN p_organization_id = v_current_tenant;
END;
$$;

-- ============================================
-- TENANT ISOLATION POLICIES FOR CORE TABLES
-- ============================================

-- Apply RLS to organization_members table if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'organization_members' AND relrowsecurity = TRUE
  ) THEN
    ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Policies for organization_members table
DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;
CREATE POLICY "org_members_select" ON public.organization_members
  FOR SELECT
  USING (
    -- Service role bypass
    current_setting('request.jwt.claim.role', TRUE) = 'service_role'
    OR
    -- Users can see their own memberships
    user_id = auth.uid()
    OR
    -- Admins can see all
    public.auth_has_role('admin')
    OR
    -- Members can see other members of their organizations
    organization_id = ANY(tenant_isolation.get_user_tenant_ids())
  );

DROP POLICY IF EXISTS "org_members_insert" ON public.organization_members;
CREATE POLICY "org_members_insert" ON public.organization_members
  FOR INSERT
  WITH CHECK (
    current_setting('request.jwt.claim.role', TRUE) = 'service_role'
    OR
    -- Only admins can add members
    public.auth_has_role('admin')
  );

DROP POLICY IF EXISTS "org_members_update" ON public.organization_members;
CREATE POLICY "org_members_update" ON public.organization_members
  FOR UPDATE
  USING (
    current_setting('request.jwt.claim.role', TRUE) = 'service_role'
    OR
    public.auth_has_role('admin')
  )
  WITH CHECK (
    current_setting('request.jwt.claim.role', TRUE) = 'service_role'
    OR
    public.auth_has_role('admin')
  );

DROP POLICY IF EXISTS "org_members_delete" ON public.organization_members;
CREATE POLICY "org_members_delete" ON public.organization_members
  FOR DELETE
  USING (
    current_setting('request.jwt.claim.role', TRUE) = 'service_role'
    OR
    public.auth_has_role('admin')
  );

-- ============================================
-- ENSURE USERS TABLE HAS TENANT MEMBERSHIP
-- ============================================

-- Add default_organization_id to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'default_organization_id'
  ) THEN
    ALTER TABLE public.users
    ADD COLUMN default_organization_id UUID REFERENCES public.organizations(id);

    COMMENT ON COLUMN public.users.default_organization_id IS 'User primary organization for tenant context';
  END IF;
END
$$;

-- ============================================
-- TENANT CONTEXT RESOLUTION FUNCTION
-- ============================================

-- Function to resolve tenant context for a user
CREATE OR REPLACE FUNCTION tenant_isolation.resolve_user_tenant(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, tenant_isolation
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- First check if there's a session context
  v_tenant_id := tenant_isolation.get_current_tenant_id();
  IF v_tenant_id IS NOT NULL THEN
    -- Verify user has access to this tenant
    IF tenant_isolation.is_tenant_member(v_tenant_id, p_user_id) THEN
      RETURN v_tenant_id;
    END IF;
  END IF;

  -- Check user's default organization
  SELECT default_organization_id INTO v_tenant_id
  FROM public.users
  WHERE id = p_user_id;

  IF v_tenant_id IS NOT NULL AND tenant_isolation.is_tenant_member(v_tenant_id, p_user_id) THEN
    RETURN v_tenant_id;
  END IF;

  -- Fall back to first organization membership
  SELECT om.organization_id INTO v_tenant_id
  FROM public.organization_members om
  WHERE om.user_id = p_user_id
    AND om.left_at IS NULL
  ORDER BY om.joined_at ASC
  LIMIT 1;

  RETURN v_tenant_id;
END;
$$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant schema usage
GRANT USAGE ON SCHEMA tenant_isolation TO authenticated;
GRANT USAGE ON SCHEMA tenant_isolation TO service_role;

-- Grant function execute permissions
GRANT EXECUTE ON FUNCTION tenant_isolation.set_tenant_context TO authenticated;
GRANT EXECUTE ON FUNCTION tenant_isolation.get_current_tenant_id TO authenticated;
GRANT EXECUTE ON FUNCTION tenant_isolation.clear_tenant_context TO authenticated;
GRANT EXECUTE ON FUNCTION tenant_isolation.is_tenant_member TO authenticated;
GRANT EXECUTE ON FUNCTION tenant_isolation.get_user_tenant_ids TO authenticated;
GRANT EXECUTE ON FUNCTION tenant_isolation.has_tenant_access TO authenticated;
GRANT EXECUTE ON FUNCTION tenant_isolation.rls_select_policy TO authenticated;
GRANT EXECUTE ON FUNCTION tenant_isolation.rls_insert_policy TO authenticated;
GRANT EXECUTE ON FUNCTION tenant_isolation.rls_update_policy TO authenticated;
GRANT EXECUTE ON FUNCTION tenant_isolation.rls_delete_policy TO authenticated;
GRANT EXECUTE ON FUNCTION tenant_isolation.scoped_to_tenant TO authenticated;
GRANT EXECUTE ON FUNCTION tenant_isolation.resolve_user_tenant TO authenticated;

-- Service role needs full access to audit tables
GRANT ALL ON tenant_isolation.tenant_context_audit TO service_role;
GRANT ALL ON tenant_isolation.access_violation_log TO service_role;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION tenant_isolation.set_tenant_context IS 'Set the current tenant context for the session';
COMMENT ON FUNCTION tenant_isolation.get_current_tenant_id IS 'Get the current tenant ID from session or user membership';
COMMENT ON FUNCTION tenant_isolation.clear_tenant_context IS 'Clear the current tenant context';
COMMENT ON FUNCTION tenant_isolation.is_tenant_member IS 'Check if a user is a member of a tenant organization';
COMMENT ON FUNCTION tenant_isolation.get_user_tenant_ids IS 'Get all tenant IDs that a user has access to';
COMMENT ON FUNCTION tenant_isolation.has_tenant_access IS 'Check if current user has access to a tenant (for RLS)';
COMMENT ON FUNCTION tenant_isolation.rls_select_policy IS 'Universal RLS SELECT policy helper';
COMMENT ON FUNCTION tenant_isolation.rls_insert_policy IS 'Universal RLS INSERT policy helper';
COMMENT ON FUNCTION tenant_isolation.rls_update_policy IS 'Universal RLS UPDATE policy helper';
COMMENT ON FUNCTION tenant_isolation.rls_delete_policy IS 'Universal RLS DELETE policy helper';
COMMENT ON FUNCTION tenant_isolation.scoped_to_tenant IS 'Filter function to scope queries to current tenant';
COMMENT ON FUNCTION tenant_isolation.resolve_user_tenant IS 'Resolve the appropriate tenant context for a user';

COMMENT ON TABLE tenant_isolation.tenant_context_audit IS 'Audit trail for tenant context switches';
COMMENT ON TABLE tenant_isolation.access_violation_log IS 'Log of blocked cross-tenant access attempts';
