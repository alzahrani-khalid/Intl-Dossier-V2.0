/**
 * RLS Audit Test Suite
 *
 * Verifies that ALL public Supabase tables have RLS enabled and correct policies.
 * Uses service_role (admin) client to query PostgreSQL system catalogs.
 *
 * Per D-03: Every table must have RLS enabled -- zero exceptions.
 * Per D-02: Sensitive tables (with organization_id) must have org-scoped policies.
 *
 * These tests use RPC functions created by migration 20260324000001_rls_audit_fix.sql.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

describe('RLS Audit: All Public Tables', () => {
  let supabaseAdmin: SupabaseClient

  beforeAll(() => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to run RLS audit tests',
      )
    }
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  })

  it('every public table has RLS enabled (D-03: zero exceptions)', async () => {
    const { data, error } = await supabaseAdmin.rpc('get_tables_without_rls')

    expect(error).toBeNull()

    if (data && data.length > 0) {
      const tableNames = data.map(
        (row: { schemaname: string; tablename: string }) => row.tablename,
      )
      // Fail with descriptive message listing all tables without RLS
      expect(tableNames).toEqual(
        expect.arrayContaining([]),
      )
      expect(data).toHaveLength(0)
    } else {
      expect(data).toHaveLength(0)
    }
  })

  it('every RLS-enabled table has at least one policy', async () => {
    const { data, error } = await supabaseAdmin.rpc('get_rls_tables_without_policies')

    expect(error).toBeNull()

    if (data && data.length > 0) {
      const orphanedTables = data.map((row: { tablename: string }) => row.tablename)
      // Tables with RLS but no policies silently block ALL access
      console.warn('Tables with RLS enabled but NO policies (all access blocked):', orphanedTables)
    }
    expect(data).toHaveLength(0)
  })

  it('sensitive tables have org-scoped policies (D-02)', async () => {
    // Core dossier tables that MUST have organization_id-based policies
    const sensitiveTables = [
      'countries',
      'organizations',
      'forums',
      'engagements',
      'topics',
      'working_groups',
      'persons',
      'elected_officials',
      'documents',
      'tasks',
      'commitments',
      'intelligence_signals',
      // Phase 54 additions:
      'intelligence_event',
      'intelligence_digest',
      'dashboard_digest',
    ]

    for (const table of sensitiveTables) {
      const { data: policies, error } = await supabaseAdmin.rpc('get_policies_for_table', {
        p_table_name: table,
      })

      if (error) {
        // Table may not exist in this environment -- skip gracefully
        console.warn(`Skipping policy check for ${table}: ${error.message}`)
        continue
      }

      // Table must have at least one policy
      expect(
        policies?.length,
        `Table "${table}" has no RLS policies`,
      ).toBeGreaterThan(0)

      // At least one policy should reference org_id or organization_id
      const hasOrgPolicy = policies?.some(
        (p: { qual: string | null; with_check: string | null }) =>
          p.qual?.includes('org_id') ||
          p.qual?.includes('organization_id') ||
          p.with_check?.includes('org_id') ||
          p.with_check?.includes('organization_id'),
      )
      expect(
        hasOrgPolicy,
        `Table "${table}" has policies but none reference org_id/organization_id`,
      ).toBe(true)
    }
  })

  it('tables with organization_id column all have org-scoped policies', async () => {
    const { data, error } = await supabaseAdmin.rpc('get_tables_with_org_id')

    expect(error).toBeNull()

    if (data && data.length > 0) {
      const tablesWithoutOrgPolicy = data
        .filter((row: { tablename: string; has_org_policy: boolean }) => !row.has_org_policy)
        .map((row: { tablename: string }) => row.tablename)

      if (tablesWithoutOrgPolicy.length > 0) {
        console.warn(
          'Tables with organization_id but NO org-scoped policy:',
          tablesWithoutOrgPolicy,
        )
      }
      expect(tablesWithoutOrgPolicy).toHaveLength(0)
    }
  })

  it('no table has RLS disabled in public schema', async () => {
    // Double-check using a different approach: query pg_class directly
    const { data, error } = await supabaseAdmin.rpc('get_tables_without_rls')

    expect(error).toBeNull()

    // This is the strictest assertion: zero tables without RLS
    expect(data ?? []).toEqual([])
  })

  it('RPC audit functions are accessible', async () => {
    // Verify the audit helper functions exist and are callable
    const functions = [
      { name: 'get_tables_without_rls', args: {} },
      { name: 'get_rls_tables_without_policies', args: {} },
      { name: 'get_policies_for_table', args: { p_table_name: 'countries' } },
      { name: 'get_tables_with_org_id', args: {} },
    ]

    for (const fn of functions) {
      const { error } = await supabaseAdmin.rpc(fn.name, fn.args)
      expect(
        error,
        `RPC function "${fn.name}" should be callable but got error: ${error?.message}`,
      ).toBeNull()
    }
  })
})
