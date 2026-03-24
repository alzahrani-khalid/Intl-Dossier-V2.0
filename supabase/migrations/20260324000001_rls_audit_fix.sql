-- ============================================================================
-- Migration: RLS Audit Fix — Ensure ALL public tables have RLS enabled
-- Date: 2026-03-24
-- Feature: security-hardening (Phase 03, Plan 03)
-- Description:
--   1. Enables RLS on every public table that does not already have it
--   2. Adds org-scoped policies for tables with organization_id column
--   3. Adds read-only public access for lookup/reference tables
--   4. Creates RPC functions for the RLS audit test suite
--
-- Service role bypass: RLS without FORCE ROW LEVEL SECURITY means
-- service_role key naturally bypasses RLS (correct for backend operations).
-- ============================================================================

-- ============================================================================
-- PART 1: Enable RLS on ALL public tables (zero exceptions per D-03)
-- ============================================================================

-- Dynamically enable RLS on every public user table that lacks it.
-- This catches any table added by future migrations that forgot RLS.
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'          -- ordinary tables only
      AND c.relrowsecurity = false  -- RLS not yet enabled
      AND c.relname NOT LIKE 'pg_%'
      AND c.relname NOT LIKE '_pg_%'
      AND c.relname NOT LIKE 'schema_%'
      AND c.relname NOT IN ('schema_migrations', 'supabase_migrations')
    ORDER BY c.relname
  LOOP
    RAISE NOTICE 'Enabling RLS on table: %', tbl.tablename;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- PART 2: Add org-scoped policies for tables with organization_id
-- ============================================================================

-- For tables that have an organization_id column but NO policy referencing
-- org_id in their USING clause, create standard org isolation policies.
-- Uses auth.jwt()->>'org_id' per D-02 constraint.
DO $$
DECLARE
  tbl RECORD;
  policy_exists BOOLEAN;
BEGIN
  FOR tbl IN
    SELECT t.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_name = c.table_name AND t.table_schema = c.table_schema
    WHERE c.table_schema = 'public'
      AND c.column_name = 'organization_id'
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  LOOP
    -- Check if any org-scoped policy already exists for this table
    SELECT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = tbl.table_name
        AND (qual::text LIKE '%org_id%' OR with_check::text LIKE '%org_id%'
             OR qual::text LIKE '%organization_id%' OR with_check::text LIKE '%organization_id%')
    ) INTO policy_exists;

    IF NOT policy_exists THEN
      RAISE NOTICE 'Adding org isolation policies for table: %', tbl.table_name;

      -- SELECT policy
      EXECUTE format(
        'CREATE POLICY "%s_org_isolation_select" ON public.%I FOR SELECT TO authenticated USING (organization_id = (auth.jwt()->>''org_id'')::uuid)',
        tbl.table_name, tbl.table_name
      );

      -- INSERT policy
      EXECUTE format(
        'CREATE POLICY "%s_org_isolation_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (organization_id = (auth.jwt()->>''org_id'')::uuid)',
        tbl.table_name, tbl.table_name
      );

      -- UPDATE policy
      EXECUTE format(
        'CREATE POLICY "%s_org_isolation_update" ON public.%I FOR UPDATE TO authenticated USING (organization_id = (auth.jwt()->>''org_id'')::uuid)',
        tbl.table_name, tbl.table_name
      );

      -- DELETE policy
      EXECUTE format(
        'CREATE POLICY "%s_org_isolation_delete" ON public.%I FOR DELETE TO authenticated USING (organization_id = (auth.jwt()->>''org_id'')::uuid)',
        tbl.table_name, tbl.table_name
      );
    ELSE
      RAISE NOTICE 'Table % already has org-scoped policies, skipping', tbl.table_name;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PART 3: Add read-only public access for lookup/reference tables
-- ============================================================================

-- Tables WITHOUT organization_id that have RLS enabled but NO policies at all
-- are treated as lookup/reference tables and get a read-only policy.
DO $$
DECLARE
  tbl RECORD;
  has_policies BOOLEAN;
  has_org_id BOOLEAN;
BEGIN
  FOR tbl IN
    SELECT c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = true  -- RLS is enabled
    ORDER BY c.relname
  LOOP
    -- Check if table has any policies
    SELECT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl.tablename
    ) INTO has_policies;

    -- Check if table has organization_id column
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl.tablename
        AND column_name = 'organization_id'
    ) INTO has_org_id;

    -- Only add public read for tables with NO policies and NO organization_id
    IF NOT has_policies AND NOT has_org_id THEN
      RAISE NOTICE 'Adding public read policy for lookup table: %', tbl.tablename;
      EXECUTE format(
        'CREATE POLICY "%s_authenticated_read" ON public.%I FOR SELECT TO authenticated USING (true)',
        tbl.tablename, tbl.tablename
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PART 4: RPC functions for the RLS audit test suite
-- ============================================================================

-- Function: get_tables_without_rls
-- Returns all public tables where RLS is NOT enabled
CREATE OR REPLACE FUNCTION public.get_tables_without_rls()
RETURNS TABLE(schemaname text, tablename text) AS $$
BEGIN
  RETURN QUERY
  SELECT n.nspname::text AS schemaname, c.relname::text AS tablename
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = false
    AND c.relname NOT LIKE 'pg_%'
    AND c.relname NOT LIKE '_pg_%'
    AND c.relname NOT LIKE 'schema_%'
    AND c.relname NOT IN ('schema_migrations', 'supabase_migrations')
  ORDER BY c.relname;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: get_rls_tables_without_policies
-- Returns tables that have RLS enabled but zero policies
CREATE OR REPLACE FUNCTION public.get_rls_tables_without_policies()
RETURNS TABLE(tablename text) AS $$
BEGIN
  RETURN QUERY
  SELECT c.relname::text AS tablename
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = true
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = c.relname
    )
  ORDER BY c.relname;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: get_policies_for_table
-- Returns all policies for a specific table
CREATE OR REPLACE FUNCTION public.get_policies_for_table(p_table_name text)
RETURNS TABLE(policyname text, cmd text, qual text, with_check text, roles text[]) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.policyname::text,
    p.cmd::text,
    p.qual::text,
    p.with_check::text,
    p.roles::text[]
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = p_table_name
  ORDER BY p.policyname;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: get_tables_with_org_id
-- Returns tables that have an organization_id column
CREATE OR REPLACE FUNCTION public.get_tables_with_org_id()
RETURNS TABLE(tablename text, has_org_policy boolean) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.table_name::text AS tablename,
    EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public'
        AND p.tablename = c.table_name
        AND (p.qual::text LIKE '%org_id%' OR p.with_check::text LIKE '%org_id%'
             OR p.qual::text LIKE '%organization_id%' OR p.with_check::text LIKE '%organization_id%')
    ) AS has_org_policy
  FROM information_schema.columns c
  JOIN information_schema.tables t
    ON t.table_name = c.table_name AND t.table_schema = c.table_schema
  WHERE c.table_schema = 'public'
    AND c.column_name = 'organization_id'
    AND t.table_type = 'BASE TABLE'
  ORDER BY c.table_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute on RPC functions to service_role and authenticated
GRANT EXECUTE ON FUNCTION public.get_tables_without_rls() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_rls_tables_without_policies() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_policies_for_table(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_tables_with_org_id() TO service_role;

-- ============================================================================
-- Migration Complete
-- ============================================================================
